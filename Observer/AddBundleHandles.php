<?php

namespace Swissup\BreezeIntegrations\Observer;

class AddBundleHandles implements \Magento\Framework\Event\ObserverInterface
{
    private \Swissup\BreezeIntegrations\Model\LayoutHandlesProvider $handlesProvider;

    public function __construct(
        \Swissup\BreezeIntegrations\Model\LayoutHandlesProvider $handlesProvider
    ) {
        $this->handlesProvider = $handlesProvider;
    }

    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        $observer->getTransport()->setHandles(array_merge(
            $observer->getTransport()->getHandles(),
            $this->handlesProvider->getHandles()
        ));
    }
}
