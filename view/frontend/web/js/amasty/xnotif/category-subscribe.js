(function () {
    'use strict';

    $.widget('categorySubscribe', {
        component: 'Amasty_Xnotif/js/category_subscribe',
        options: {
            selectors: {
                alertBlock: '.amxnotif-container, .alert.stock.link-stock-alert',
                productInfoContainer: '.product-item-info',
                productInnerContainer: '.product-item-inner',
                amxnotifBlock: '.amxnotif-block',
                subscribePopup: '.category.subscribe-popup',
                closePopup: '.close-subscribe-popup'
            },
            parent: null,
            popup: {}
        },

        _create: function () {
            if (this.options.parent) {
                this.elements = this.options.parent.find(this.options.selectors.alertBlock);
            } else {
                this.elements = $(this.options.selectors.alertBlock);
            }

            if (this.elements.length > 0) {
                this._initialization();
            }
        },

        _initialization: function () {
            $.each(this.elements, function (elementId, element) {
                elementId = $(element).attr('data-product-id');
                var isGuest = $(element).find(this.options.selectors.amxnotifBlock).length > 0,
                    parentItem = $(element).parents(this.options.selectors.productInfoContainer).first(),
                    productInner = parentItem.find(this.options.selectors.productInnerContainer),
                    isSwatchesExists = parentItem.find('.swatch-attribute').length;

                if (productInner.length > 0 && !this.options.parent && !isSwatchesExists) {
                    productInner.prepend(element);
                }

                if (this.options.usePopup === '1' && isGuest) {
                    if (!this.options.popup[elementId]) {
                        this.options.popup[elementId] = $(element).find(this.options.selectors.subscribePopup);
                    }
                    $(element).find('a').on('click', function () {
                        this.options.popup[elementId].show();
                        window.onclick = function (event) {
                            if (this.options.popup[elementId]
                                && this.options.popup[elementId][0]
                                && event.target == this.options.popup[elementId][0]
                            ) {
                                this.closeSubscribePopup(elementId);
                            }
                        }.bind(this);
                    }.bind(this));
                    this.options.popup[elementId].find(this.options.selectors.closePopup).on('click', function () {
                        this.closeSubscribePopup(elementId);
                    }.bind(this));
                    $('body').append(this.options.popup[elementId]);
                } else if (isGuest) {
                    $(element).find(this.options.selectors.amxnotifBlock).show();
                } else {
                    $(element).show();
                }
            }.bind(this));
        },

        closeSubscribePopup: function (elementId) {
            this.options.popup[elementId].hide();
        }
    });
})();