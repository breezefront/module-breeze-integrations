<?php

namespace Swissup\BreezeIntegrations\Plugin;

class SwissupProLabels
{
    /**
     * @var \Swissup\Breeze\Helper\Data
     */
    private $helper;

    /**
     * @param \Swissup\Breeze\Helper\Data $helper
     */
    public function __construct(
        \Swissup\Breeze\Helper\Data $helper
    ) {
        $this->helper = $helper;
    }

    /**
     * @return string
     */
    public function afterGetBaseImageWrapConfig(
        \Swissup\ProLabels\Block\Product\Labels $subject,
        $result
    ) {
        if (!$this->helper->isEnabled()) {
            return $result;
        }

        return $result
            . ', .breeze-gallery:not(.expanded) .main-image-wrapper' // default mode
            . ', .breeze-gallery.expanded .images a:first-child:not([data-clone]) > img' // loop is disabled
            . ', .breeze-gallery.expanded .images a[data-clone]:first-child + a > img';  // first image
    }
}
