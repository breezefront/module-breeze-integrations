<?php

namespace Swissup\BreezeIntegrations\Observer;

class AddLayoutUpdates implements \Magento\Framework\Event\ObserverInterface
{
    private \Swissup\BreezeIntegrations\Model\LayoutHandlesProvider $handlesProvider;

    public function __construct(
        \Swissup\BreezeIntegrations\Model\LayoutHandlesProvider $handlesProvider
    ) {
        $this->handlesProvider = $handlesProvider;
    }

    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        $layoutUpdate = $observer->getLayout()->getUpdate();

        foreach ($this->handlesProvider->getHandles() as $handle) {
            $layoutUpdate->addHandle($handle);
        }
    }
}
