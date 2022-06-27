(function () {
    'use strict';

      $.widget('mage.amPackPopupCart', {
        component: 'Amasty_Mostviewed/js/ampackcart_popup',
        options: {
            packId: ''
        },
        selectors: {
            'forms': '.amrelated-product-info form'
        },

        _create: function (options) {
            var self = this;
            this._createButtonObserve(this.element);
        },

        _createButtonObserve: function (element) {
            var self = this,
                forms = $(self.selectors.forms);
            element.off('click').on('click', function (e) {
                var validator = null,
                    data = [],
                    valid = true;

                e.preventDefault();
                forms.each(function (index, form) {
                    validator = $(form).validation({radioCheckboxClosest: '.nested'});
                    if (!validator.valid()) {
                        valid = false;
                    }
                });

                if (valid) {
                    forms.each(function (index, form) {
                        form = $(form);
                        data[index] = form.serialize();
                    });

                    self.sendAjax(data);
                }
            });
        },

        sendAjax: function (data) {
            var self = this,
                d = {
                    'amrelated_products_popup': data,
                    'products_in_cart': this.options.productsInCart,
                    'ajax_cart': this.options.isAjaxCartEnabled,
                    'form_key': $.mage.cookies.get('form_key'),
                    'product_page': $('body').hasClass('catalog-product-view'),
                    'pack_id': this.options.packId
                };
            $.request.post({
                url: self.options.url,
                data: d,
                dataType: 'json',
                beforeSend: function () {
                    console.log('popup-loader-show');
                    //$('body').loader('show');
                },
                success: function (response) {
                    $('[data-amrelated-js="bundle-popup"]').fadeOut();
                    $('[data-amrelated-js="add-to-cart"]').first().amPackCart('success', response);
                },
                 error: function (response) {
                    console.log('popup-loader-hide');
                    //$('body').loader('hide');
                }
            })
        }
    });

})();
