<?php

namespace Swissup\BreezeIntegrations\Observer;

use Magento\Framework\Module\Dir;

class AddLayoutUpdates implements \Magento\Framework\Event\ObserverInterface
{
    /**
     * @var \Magento\Framework\Module\Manager
     */
    private $moduleManager;

    /**
     * @var \Magento\Framework\Module\ModuleListInterface
     */
    private $moduleList;

    /**
     * @var \Magento\Framework\Module\ModuleListInterface
     */
    private $dirReader;

    /**
     * @var \Magento\Framework\App\CacheInterface
     */
    private $cache;

    /**
     * @param \Magento\Framework\Module\Manager $moduleManager
     * @param \Magento\Framework\Module\ModuleListInterface $moduleList
     * @param \Magento\Framework\Module\Dir\Reader $dirReader
     * @param \Magento\Framework\App\CacheInterface $cache
     */
    public function __construct(
        \Magento\Framework\Module\Manager $moduleManager,
        \Magento\Framework\Module\ModuleListInterface $moduleList,
        \Magento\Framework\Module\Dir\Reader $dirReader,
        \Magento\Framework\App\CacheInterface $cache
    ) {
        $this->moduleManager = $moduleManager;
        $this->moduleList = $moduleList;
        $this->dirReader = $dirReader;
        $this->cache = $cache;
    }

    /**
     * Add dynamic handles for all third-party modules
     *
     * @param \Magento\Framework\Event\Observer $observer
     * @return void
     */
    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        $layoutUpdate = $observer->getLayout()->getUpdate();

        foreach ($this->getHandles() as $handle) {
            $layoutUpdate->addHandle($handle);
        }
    }

    public function getHandles()
    {
        $handles = $this->cache->load('swissup_breeze_integrations_handles');
        if (is_string($handles)) {
            return explode(',', $handles);
        }

        // collect all existing integration layout files
        $allHandles = $this->getAllSupportedHandles();

        // add handles for all active modules only
        $handles = [];
        foreach ($this->moduleList->getNames() as $moduleName) {
            if (!$this->moduleManager->isEnabled($moduleName)) {
                continue;
            }

            $handle = 'breeze_' . strtolower($moduleName);
            if (isset($allHandles[$handle])) {
                $handles[] = $handle;
            }
        }

        $this->cache->save(
            implode(',', $handles),
            'swissup_breeze_integrations_handles',
            [
                \Magento\Framework\App\Cache\Type\Layout::CACHE_TAG,
                \Magento\Framework\App\Cache\Type\Config::CACHE_TAG,
            ],
            86400
        );

        return $handles;
    }

    /**
     * Collect the list of supported handle names
     *
     * @return array
     */
    private function getAllSupportedHandles()
    {
        $handles = [];
        $path = $this->dirReader
            ->getModuleDir(Dir::MODULE_VIEW_DIR, 'Swissup_BreezeIntegrations')
            . '/frontend/layout';

        $iterator = new \FilesystemIterator($path, \FilesystemIterator::SKIP_DOTS);
        foreach ($iterator as $file) {
            $handle = str_replace('.xml', '', $file->getFilename());
            $handles[$handle] = true;
        }

        return $handles;
    }
}
