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
            var self = this;
            $.request.get({
                url: this.options.url,
                data: 'product=' + this.options.ids,
                success: function (response) {
                    if (!response.body) {
                        return;
                    }

                    $.each(response.body, function (productId, config) {
                        $.fn.amnotification({
                            'xnotif': config,
                            'is_category' : true,
                            'element' : $('[data-amsubscribe="' + productId + '"]')
                        });
                    });
                }
            });
        }
    });
})();
