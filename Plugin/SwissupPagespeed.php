<?php

namespace Swissup\BreezeIntegrations\Plugin;

class SwissupPagespeed
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
     * @param \Swissup\Pagespeed\Helper\Config $subject
     * @param boolean $result
     * @return boolean
     */
    public function afterIsDeferJsEnable(
        \Swissup\Pagespeed\Helper\Config $subject,
        $result
    ) {
        if (!$result || !$this->helper->isEnabled()) {
            return $result;
        }

        return false;
    }

    // Enable critical css if default is enabled.
    // This prevents a few seconds of visible unstyled page.
    public function afterIsCriticalCssEnable(
        \Swissup\Pagespeed\Helper\Config $subject,
        $result
    ) {
        if (!$result || !$this->helper->isEnabled()) {
            return $result;
        }

        return $this->helper->getConfig('dev/css/use_css_critical_path');
    }

    // Breeze has built-in critical CSS support for all pages
    public function afterIsAllowedCriticalCssOnCurrentPage(
        \Swissup\Pagespeed\Helper\Config $subject,
        $result
    ) {
        if ($result || !$this->helper->isEnabled()) {
            return $result;
        }
        return true;
    }
}
