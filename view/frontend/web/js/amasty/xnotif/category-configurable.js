(function () {
    'use strict';

    $.widget('amxnotifCategoryConfigurable', {
        component: 'Amasty_Xnotif/js/category/configurable',
        options: {
            selectors: {
                alertBlock: '.amxnotif-container, .alert.stock.link-stock-alert'
            }
        },

        _create: function () {
            $.request.get({
                url: this.options.url,
                data: 'product=' + this.options.ids,
                success: function (data) {
                    if (!data) {
                        return;
                    }

                    $.each(data, function (productId, config) {
                        $.fn.amnotification({
                            'xnotif': config,
                            'is_category': true,
                            'element': $('[data-amsubscribe="' + productId + '"]')
                        });
                    });
                }
            });
        }
    });
})();
