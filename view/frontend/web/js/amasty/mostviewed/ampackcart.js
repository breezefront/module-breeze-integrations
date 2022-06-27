(function () {
    'use strict';

    $.widget('mage.amPackCart', {
        component: 'Amasty_Mostviewed/js/ampackcart',
        options: {},
        parent: null,
        selectors: {
            'form': '#product_addtocart_form',
            'parent': '[data-amrelated-js="pack-wrapper"]',
            'mainContainer': '[data-amrelated-js="bundle-popup"]',
            'closePopup': '[data-amrelated-js="close-popup"]',
            'productsWrapper': '[data-amrelated-js="products-wrapper"]'
        },

        /**
         * @private
         * @returns {void}
         */
        _create: function () {
            this._createButtonObserve(this.element);
        },

        _createButtonObserve: function (element) {
            var self = this,
                form = null,
                validator = null;

            element.off('click').on('click', function (e) {
                e.preventDefault();

                var data = '',
                    parent = $(this).parents(self.selectors.parent),
                    relatedData = $(parent).find('input').serialize(),
                    mainProduct = parent.find('[data-amrelated-js="pack-item"].-main');
                form = self.getMainProductForm(mainProduct.data('product-id'));
                if (form && form.length) {
                    validator = form.validation({radioCheckboxClosest: '.nested'})
                }
                if (!validator || validator.valid()) {
                    if (form && form.length) {
                        data = form.serialize();
                    } else {
                        data = 'form_key=' + $.mage.cookies.get('form_key');
                        if (mainProduct.length) {
                            data += '&' +'amrelated_products[' + mainProduct.data('product-id') + ']=' + 1;
                        }
                    }

                    data += '&' + relatedData;
                    data += '&ajax_cart=' + self.options.isAjaxCartEnabled;
                    data += '&product_page=' + $('body').hasClass('catalog-product-view');
                    data += '&pack_id=' + $(e.currentTarget).closest(self.selectors.parent).data('pack-id');
                    $.request.post({
                        url: self.options.url,
                        data: data,
                        dataType: 'json',
                        beforeSend: function () {
                            console.log('loader-show');
                            //$('body').loader('show');
                        },

                        success: function (response) {
                            self.success(response);
                        },

                        error: function () {
                            console.log('loader-hide');
                            self._scrollToTop();
                        }
                    });
                } else {
                    self._scrollToTop();
                }
            });
        },

        /**
         * @private
         * @param {Number} mainProductId
         * @returns {Number|null}
         */
        getMainProductForm: function (mainProductId) {
            var form = $(this.selectors.form),
                formProductInput = null,
                isMainProductForm = false;
            if (form.length) {
                formProductInput = form.find('[name="product"]');
                if (parseInt(formProductInput.val()) === parseInt(mainProductId)) {
                    isMainProductForm = true;
                }
            }

            return isMainProductForm ? form : null;
        },

        success: function (response) {
            console.log('loader-hide');
            //$('body').loader('hide');

            if (response.is_add_to_cart) {
                if ($('body').hasClass('checkout-cart-index')) {
                    window.location.reload();
                }

                this._showConfirmPopup(response);
            } else {
                this.showProductPopup(response);
            }
        },

        _showConfirmPopup: function (response) {
            if (this.options.isAjaxCartEnabled) {
                require(['showConfirmPopup'], function (showConfirmPopup) {
                    showConfirmPopup(response);
                });
            } else {
                this._scrollToTop();
            }
        },

        _scrollToTop: function () {
            window.scroll({top: 0, behavior: 'smooth'});
        },

        showProductPopup: function (products) {
            var self = this,
                oldPopup = $(this.selectors.mainContainer),
                popup = $(products.html);

            if (oldPopup.length > 0) {
                oldPopup.remove();
            }

            popup.find(self.selectors.closePopup).on('click', function () {
                popup.fadeOut();
            });

            popup.on('click', function (event) {
                if (!($(event.target).hasClass('amrelated-bundle-popup')
                        || $(event.target).parents().hasClass('amrelated-bundle-popup'))
                ) {
                    popup.fadeOut();
                }
            });

            popup.hide().appendTo($('body')).fadeIn();

            //fix magento swatches scroll issue
            $(self.selectors.productsWrapper).on('scroll', function () {
                $('.swatch-option-tooltip').hide();
            });

            $(window).on('scroll', function () {
                if (popup.css('display') != 'none') {
                    $('.swatch-option-tooltip').hide();
                }
            });

            $(this.selectors.mainContainer).trigger('contentUpdated');
        }
    });

})();
