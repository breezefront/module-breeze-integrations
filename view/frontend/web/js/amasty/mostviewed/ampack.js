(function () {
    'use strict';

    $.widget('mage.amPack', {
        component: 'Amasty_Mostviewed/js/ampack',
        options: {},
        excluded: [],
        mediaBreakpoint: '(min-width: 768px)',
        selectors: {
            'discount': '[data-amrelated-js="bundle-price-discount"]',
            'itemDiscount': '[data-amrelated-js="item-price-discount"]',
            'finalPrice': '[data-amrelated-js="bundle-final-price"]',
            'checkbox': '[data-amrelated-js="checkbox"]',
            'packContainer': '[data-amrelated-js="pack-container"]',
            'packWrapper': '[data-amrelated-js="pack-wrapper"]',
            'packItem': '[data-amrelated-js="pack-item"]',
            'packTitle': '[data-amrelated-js="pack-title"]',
            'selectedBackground': '[data-amrelated-js="selected-background"]',
            'mainPackItem': '[data-item-role="main"]'
        },
        classes: {
            discountApplied: '-discount-applied',
            collapsed: '-collapsed',
            relatedLink: 'amrelated-link',
        },

        _create: function () {
            var self = this;
            if (!this.element) return;

            $(this.selectors.checkbox).on('change', function(){
                self.changeEvent($(this));
            })

            this.observeClickOnMobile();
        },

        observeClickOnMobile: function () {
            var self = this,
                media = matchMedia(self.mediaBreakpoint);
                self.toggleCollapsingListeners(media);
        },

        toggleCollapsingListeners: function (mql) {
            var isEnabled = mql.matches;
            var self = this,
                packItem = $(this.element).find(this.selectors.packItem),
                packTitle = $(this.element).find(this.selectors.packTitle),
                target,
                checkbox;

            if (isEnabled) {
                packItem.on('click.amPack', function (event) {
                    target = $(event.target);

                    if (!target.hasClass(self.classes.relatedLink)
                        && !target.parents().hasClass(self.classes.relatedLink)
                    ) {
                        checkbox = target.parents(self.selectors.packItem).find(self.selectors.checkbox);

                        checkbox.prop('checked', !checkbox.prop('checked')).trigger('change');
                    }
                });

                packTitle.on('click.amPack', function (event) {
                    self.toggleItems(event);
                });
            } else {
                packItem.off('click.amPack');
                packTitle.off('click.amPack');
                self.toggleItems(false);
            }
        },

        toggleItems: function (event) {
            var packContainer;

            if (event) {
                packContainer = $(event.target).parents(this.selectors.packWrapper);

                packContainer.find(this.selectors.packTitle).toggleClass(this.classes.collapsed);
                packContainer.find(this.selectors.packItem).toggleClass(this.classes.collapsed);
            } else {
                $(this.element).find('.' + this.classes.collapsed).removeClass(this.classes.collapsed);
            }
        },

        changeEvent: function (checkbox) {
            var id = checkbox.closest(this.selectors.packItem).attr('data-product-id'),
                isChecked = checkbox.prop('checked'),
                packItem = checkbox.parents(this.selectors.packItem),
                isLastItem = packItem.is('.amrelated-pack-item:last-child'),
                packContainer = checkbox.parents(this.selectors.packContainer),
                itemsCount = packContainer.find(this.selectors.checkbox).length,
                packBackground = packContainer.find(this.selectors.selectedBackground),
                selectedItems = packContainer.find(this.selectors.checkbox + ':checked'),
                selectedItemsCount = selectedItems.length;

            if (isChecked) {
                packItem.addClass('-selected');
                this.excluded = this.excluded.filter(function (item) {
                    return item !== id
                });
                packItem.addClass(this.classes.discountApplied);
            } else {
                packItem.removeClass('-selected');
                this.excluded.push(id);
                packItem.removeClass(this.classes.discountApplied);
            }

            if (this.options.apply_only_for_all) {
                if (this.excluded.length) {
                    packContainer.find(this.selectors.packItem).removeClass(this.classes.discountApplied);
                } else {
                    packContainer.find(this.selectors.packItem).addClass(this.classes.discountApplied);
                }
            }

            if (packContainer.length && itemsCount > 1) {
                var rtlCondition = (isChecked && selectedItemsCount === 1) || (!isChecked && selectedItemsCount === 0);
                packBackground.toggleClass('rtl', rtlCondition ? isLastItem : !isLastItem);
            }

            if (selectedItemsCount === itemsCount) {
                packContainer.addClass('-selected');
                packBackground.css('width','100%');
            } else if (selectedItemsCount === 0) {
                packContainer.removeClass('-selected');
                packBackground.width(0);
            } else {
                packContainer.removeClass('-selected');
                packBackground.width(selectedItems.parents(this.selectors.packItem).outerWidth())
            }

            this.reRenderPrice();
            if (this.options.discount_type == 2) {
                this.reRenderItemDiscount();
            }
        },

        reRenderPrice: function () {
            var self = this,
                saveAmount = 0,
                isAllUnchecked = true,
                useOldPrice = true,
                parentPrice = +this.options.parent_info.price,
                oldPrice = parentPrice,
                newPrice = 0,
                $element = $(this.element);

            $.each(this.options.products, function (index, priceInfo) {
                if (self.excluded.indexOf(index) === -1) {
                    isAllUnchecked = false;
                    oldPrice += priceInfo.price * priceInfo.qty;
                    newPrice += self.applyDiscount(priceInfo, index);
                }
            });

            useOldPrice = isAllUnchecked || (this.options.apply_only_for_all && self.excluded.length);

            if (useOldPrice) {
                newPrice = oldPrice;
            } else {
                newPrice += this.options.apply_for_parent ? this.applyDiscount(this.options.parent_info) : parentPrice;
            }

            this.toggleMainItemDiscount(!useOldPrice, $element);

            saveAmount = oldPrice - newPrice;
            $element.find(this.selectors.discount).html($.catalog.priceUtils.formatPrice(saveAmount, this.options.priceFormat));
            $element.find(this.selectors.finalPrice).html($.catalog.priceUtils.formatPrice(newPrice, this.options.priceFormat));
        },

        toggleMainItemDiscount: function (visible, element) {
            var mainPackItem = element.find(this.selectors.mainPackItem);

            if (visible) {
                mainPackItem.addClass(this.classes.discountApplied);
            } else {
                mainPackItem.removeClass(this.classes.discountApplied);
            }
        },

        applyDiscount: function (priceInfo, productId) {
            var price = priceInfo.price,
                discountAmount = this.getDiscountAmount(productId);

            if (this.options.discount_type == 0) {
                price = (price > discountAmount)
                    ? (price - discountAmount) * priceInfo.qty
                    : 0;
            } else {
                price = price - parseFloat(
                    (Math.round((price * 100) * discountAmount / 100) / 100).toFixed(2)
                );
                price *= priceInfo.qty;
            }

            return price;
        },

        getDiscountAmount: function (productId) {
            var discountAmount = this.options.discount_amount,
                discountType = this.options.discount_type;

            if (discountType == 2) {
                var checkedCount = $(this.element).find(this.selectors.checkbox + ':checked').length;
                checkedCount += 1; // 1 - is parent item
                discountAmount = 0;
                $.each(this.options.conditional_discounts, function (numberItems, conditionalDiscountAmount) {
                    if (checkedCount < numberItems) {
                        return false;
                    }
                    discountAmount = conditionalDiscountAmount;
                });
            } else {
                if (typeof productId !== 'undefined') {
                    discountAmount = this.options.products[productId].discount_amount === null
                        ? discountAmount
                        : this.options.products[productId].discount_amount;
                }
            }

            return discountAmount;
        },

        reRenderItemDiscount: function () {
            var self = this;

            $.each(self.element.find(self.selectors.packItem), function (index, packItem) {
                var productId = $(packItem).data('product-id'),
                    discountAmount = self.getDiscountAmount(productId);
                $(packItem).find(self.selectors.itemDiscount).html(discountAmount + '%');
            });
        }
    });

})();
