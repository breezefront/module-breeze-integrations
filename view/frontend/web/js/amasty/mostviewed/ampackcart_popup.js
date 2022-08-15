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
                params = {
                    'amrelated_products_popup': data,
                    'products_in_cart': self.options.productsInCart,
                    'ajax_cart': self.options.isAjaxCartEnabled,
                    'form_key': $.cookies.get('form_key'),
                    'product_page': $('body').hasClass('catalog-product-view'),
                    'pack_id': self.options.packId
                };

            $.request.post({
                url: self.options.url,
                data: params,
                beforeSend: function () {
                    $('body').spinner(true, {css: {
                            position: 'fixed',
                            top: 0,
                            bottom: 0,
                            right: 0,
                            left: 0,
                            background: '#ffffff',
                            opacity: .5
                        }
                    });
                },
                success: function (data) {
                    $('[data-amrelated-js="bundle-popup"]').fadeOut();
                    $('[data-amrelated-js="add-to-cart"]').first().amPackCart('succesS', data);
                },
                error: function () {
                    $('body').spinner(false);
                }
            });
        }
    });
})();
