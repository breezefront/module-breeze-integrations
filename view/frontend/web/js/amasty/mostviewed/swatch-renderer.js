(function () {
    'use strict';

    $.widget('mage.SwatchRenderer', {
        component: 'Amasty_Mostviewed/js/swatch-renderer',

        _RenderControls: function () {
            var tmp = this.inProductList;
            if (this.element.closest('.amrelated-products-wrapper').length !== 0) {
                this.inProductList = false;
            }

            this._super();
            this.inProductList = tmp;

            return this;
        },

        _loadMedia: function () {
            var $main = this.element.parents('.amrelated-product-info'),
                images;

            if (!$main.length) {
               return this._super();
            }

            if (this.options.useAjax) {
                this._debouncedLoadProductMedia();
            }  else {
                images = this.options.jsonConfig.images[this.getProduct()];

                if (!images) {
                    images = this.options.mediaGalleryInitial;
                }
                this.updateBaseImage(this._sortImages(images), $main, !this.inProductList);
            }
        }
    });
})();

