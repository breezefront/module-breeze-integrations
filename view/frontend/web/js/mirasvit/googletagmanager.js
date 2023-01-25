(function () {
    'use strict';

    $(document).on('turbolinks:before-cache', function () {
        window.mstGtmProducts = [];
    });

    var eventSelectors = {
        gtmAttrRegex: /^data-gtm-(.*)/g,

        eventAttr:    'data-gtm-event',
        listAttr:     'data-gtm-item_list_id',
        listNameAttr: 'data-gtm-item_list_name',
        productAttr:  'data-gtm-item_id',

        eventSelector:  '',
        listSelector:  '',
        productSelector:  '',

        sentLists: [],

        initialize: function () {
            this.eventSelector   = '[' + this.eventAttr + ']';
            this.listSelector    =  '[' + this.listAttr + ']';
            this.productSelector = '[' + this.productAttr + ']';
        },

        getProductAttribute: function () {
            return this.productAttr;
        },

        getListAttribute: function () {
            return this.listAttr;
        },

        getListNameAttribute: function () {
            return this.listNameAttr;
        },

        getEventAttribute: function () {
            return this.eventAttr;
        },

        getEventSelector: function () {
            return this.eventSelector;
        },

        getListSelector: function () {
            return this.listSelector;
        },

        getProductSelector: function () {
            return this.productSelector;
        },

        getAttributeRegex: function () {
            return this.gtmAttrRegex;
        }
    };
    eventSelectors.initialize();

    $.widget('mstGtmProductStorage', {
        component: 'Mirasvit_GoogleTagManager/js/product-storage',
        isLoading: false,
        isInitEvents: false,

        create: function () {
            this.itemInfoUrl = this.options.itemInfoUrl;
            this.updateProductsTimer = setInterval(this.updateProducts.bind(this), 200);
        },

        destroy: function () {
            clearInterval(this.updateProductsTimer);
        },

        getProductData: function (id) {
            return window.mstGtmProducts[id];
        },

        updateProducts: function () {
            if (this.isLoading) {
                return;
            }

            let $productEls = $(eventSelectors.getProductSelector());

            let missedIds  = [];

            if ($productEls.length) {
                _.each($productEls, function (productEl) {
                    let $productEl = $(productEl);

                    let productId = parseInt($productEl.attr(eventSelectors.getProductAttribute()));

                    if (!productId || typeof window.mstGtmProducts[productId] == 'undefined') {
                        missedIds.push($productEl.attr(eventSelectors.getProductAttribute()));
                    }
                }.bind(this));
            }

            if (missedIds.length) {
                this.isLoading = true;

                $.ajax({
                    url:      this.itemInfoUrl,
                    type:     'POST',
                    dataType: 'json',
                    data:     {product_ids: missedIds},

                    success: function (response) {
                        if (typeof response.data != 'undefined') {
                            for (var i in response.data) {
                                window.mstGtmProducts[response.data[i]['product_id']] = response.data[i];
                            }
                        }
                        this.isLoading = false;

                        // instead of $(document).ready()
                        $(document).trigger('mst-gtm-init-products');
                    }.bind(this)
                });
            }
        }
    });

    $.widget('mstGtmLayer', {
        component: 'Mirasvit_GoogleTagManager/js/layer',

        create: function () {
            const gtm = customerData.get('gtm');

            customerData.reload(['gtm'], false);

            this.subscription = gtm.subscribe(this.onUpdate);
        },

        destroy: function () {
            this.subscription.dispose();
            this._super();
        },

        onUpdate: function (data) {
            _.each(data.push, function (item) {
                if (item) {
                    window.dataLayer.push({ecommerce: null});
                    window.dataLayer.push(item);
                }
            })
        }
    });

    $.widget('mstGtmEventAddToCart', {
        component: 'Mirasvit_GoogleTagManager/js/event/addtocart',

        create: function () {
            const gtm = customerData.get('mst-gtm-addtocart');

            customerData.reload(['mst-gtm-addtocart'], false);

            this.subscription = gtm.subscribe(this.onUpdate);
        },

        destroy: function () {
            this.subscription.dispose();
            this._super();
        },

        onUpdate: function (data) {
            var mstGtmStorage = window.sessionStorage.getItem('mst_gtm');

            mstGtmStorage = mstGtmStorage ? mstGtmStorage.split('|') : [];

            _.each(data.push, function (item) {

                var gtmStorageKey = '';
                if (typeof item.gtm_id != 'undefined') {
                    gtmStorageKey = item.gtm_id;
                }

                if (item && typeof item.gtm_id != 'undefined' && !mstGtmStorage.includes(gtmStorageKey)) {

                    window.dataLayer.push({ecommerce: null});

                    if (typeof item.analytics_type != 'undefined' && item.analytics_type == 'ga3') {
                        window.dataLayer.push(item);
                    } else if (typeof item.analytics_type != 'undefined' && item.analytics_type == 'fbpixel') {
                        if (typeof fbq != 'undefined') {
                            fbq(item[0], item[1], item[2]);
                        }
                    } else {
                        if (typeof gtag != 'undefined') {
                            gtag(item[0], item[1], item[2]);
                        } else {
                            var formatedObj = {};
                            formatedObj[item[0]] = item[1];
                            formatedObj['ecommerce'] = item[2];

                            window.dataLayer.push(formatedObj);
                        }
                    }
                }

                mstGtmStorage.push(gtmStorageKey);
            });

            window.sessionStorage.setItem("mst_gtm", mstGtmStorage.join('|'));
        }
    });

    var AbstractEvent = Class.extend({
        gtmAttrRegex: /^data-gtm-(.*)/g,

        eventAttr:    'data-gtm-event',
        listAttr:     'data-gtm-item_list_id',
        listNameAttr: 'data-gtm-item_list_name',
        productAttr:  'data-gtm-item_id',

        eventSelector:  '',
        listSelector:  '',
        productSelector:  '',

        sentLists: [],

        _initialize: function () {
            this.gtmAttrRegex    = eventSelectors.getAttributeRegex();
            this.eventAttr       = eventSelectors.getEventAttribute();
            this.listAttr        = eventSelectors.getListAttribute();
            this.listNameAttr    = eventSelectors.getListNameAttribute();
            this.productAttr     = eventSelectors.getProductAttribute();
            this.listSelector    = eventSelectors.getListSelector();
            this.productSelector = eventSelectors.getProductSelector();

            this.initEventSelector();

            window.dataLayer = window.dataLayer || [];

            this.listeners();
        },

        destroy: function () {
            window.dataLayer.push(function() {
              this.reset();
            })
        },

        initEventSelector: function () {
            this.eventSelector = eventSelectors.getEventSelector();
        },

        listeners: function () {

        },

        sendData: function ($el) {

        },

        setGaData: function ($listEl, productIds) {

        },

        isVisible: function ($el) {
            if (!$el.is(":visible")) {
                return false;
            }

            const $win = $(window);

            const elementTop = $el.offset().top;
            const elementBottom = elementTop + $el.outerHeight();

            const viewportTop = $win.scrollTop();
            const viewportBottom = viewportTop + $win.height();

            return elementBottom > viewportTop && elementTop < viewportBottom;
        },

        getProductAttribute: function () {
            return this.productAttr;
        },

        getProductSelector: function () {
            return this.productSelector;
        }
    });

    var SelectItem = AbstractEvent.extend({
        redirectUrl: '',

        listeners: function () {
            $(this.productSelector).on('click', "a", function (e) {
                e.preventDefault();

                let $currentEl = $(e.currentTarget);
                let $productEl = $(e.currentTarget).closest(this.productSelector);
                let $listEl    = $($productEl[0]).closest(this.listSelector);
                //let $eventEl   = $($productEl[0]).closest(eventSelector);

                this.redirectUrl = $currentEl.attr('href');

                let productIds = [];

                if ($productEl.length && $listEl.length) {
                    let productId = parseInt($productEl.attr(this.productAttr));

                    if (productId) {
                        productIds.push(productId);

                        this.setGaData($listEl, productIds);
                    }
                }

                window.location = this.redirectUrl;
            }.bind(this));
        },

        setGaData: function ($listEl, productIds) {
            let listId   = $listEl.attr(this.listAttr);
            let listName = $listEl.attr(this.listNameAttr);

            let productId = productIds[0];

            let ga3Data = {
                'event': 'ga3_productClick',
                'ecommerce': {
                    'click': {
                        'actionField': {'list': listName},      // Optional list property.
                        'products': [window.mstGtmProducts[productId]]
                    }
                }
            };

            window.dataLayer.push({ ecommerce: null });  // Clear the previous ecommerce object.
            window.dataLayer.push(ga3Data);

            window.dataLayer.push({ ecommerce: null });  // Clear the previous ecommerce object.
            gtag('event', 'select_item', {
                    item_list_id: listId,
                    item_list_name: listName,
                    items: [window.mstGtmProducts[productId]]
                }
            );
        }
    });

    var ItemList = AbstractEvent.extend({
        isLoading: false,

        initEventSelector: function () {
            this.eventSelector = '[' + this.eventAttr + '="view_item_list"]';
        },

        listeners: function () {
            $(document).on('mst-gtm-init-products', function() {
                _.each($(this.eventSelector), function (el) {
                    let $el = $(el);

                    if (this.isVisible($el)) {
                        this.sendData($el);
                    }
                }.bind(this));
            }.bind(this));
        },

        sendData: function ($el) {
            let $listEl     = $(this.listSelector, $el);
            let $productEls = $(this.productSelector, $el);

            if (!$listEl.length && $el[0].hasAttribute(this.listAttr)) {
                $listEl = $el;
            }

            let productIds = [];

            _.each($productEls, function (productEl) {
                let productId = parseInt($(productEl).attr(this.productAttr));

                if (productId) {
                    productIds.push(productId);
                }
            }.bind(this));

            if (productIds.length) {
                this.setGaData($listEl, productIds);
            }
        },

        setGaData: function ($listEl, productIds) {
            let listId   = $listEl.attr(this.listAttr);
            let listName = $listEl.attr(this.listNameAttr);

            if (typeof this.sentLists[listId] == 'undefined' || !this.sentLists[listId]) {
                this.sentLists[listId] = true;

                let currency = '';

                let items = [];
                for (var i in productIds) {
                    items.push(window.mstGtmProducts[productIds[i]]);

                    if (typeof window.mstGtmProducts[productIds[i]].currency != 'undefined') {
                        currency = window.mstGtmProducts[productIds[i]].currency;
                    }
                }

                window.dataLayer.push({ecommerce: null});  // Clear the previous ecommerce object.
                window.dataLayer.push('event', 'view_item_list', {
                        item_list_id:   listId,
                        item_list_name: listName,
                        items:          [items]
                    }
                );
            }
        }
    });

    var SelectPromotion = AbstractEvent.extend({
        creativeNameAttr: 'data-gtm-creative_name',
        creativeSlotAttr: 'data-gtm-creative_slot',

        promolistIdAttr: 'data-gtml-promo-list-id',

        itemIdAttr:   'data-gtm-item_id',
        itemNameAttr: 'data-gtm-item_name',

        initEventSelector: function () {
            this.eventSelector = '[' + this.eventAttr + '="view_promotion"]';
        },

        listeners: function () {
            let itemIdSelector   = '[' + this.itemIdAttr + ']',
                itemNameSelector = '[' + this.itemNameAttr+ ']';

            $('body').on('click', this.eventSelector + ' ' + itemIdSelector, function (e) {
                let $currentEl = $(e.currentTarget);

                this.sendData($currentEl);

            }.bind(this));

            $('body').on('click', this.eventSelector + ' ' + itemNameSelector, function (e) {
                let $currentEl = $(e.currentTarget);

                this.sendData($currentEl);

            }.bind(this));
        },

        sendData: function ($el) {
            this.setGaData($el, null);
        },

        setGaData: function ($listEl, productIds) {
            let $itemEl  = $listEl;
            let $eventEl = $itemEl.closest(this.eventSelector);

            let items = [];

            _.each($itemEl, function ($el) {
                let item = [];

                _.each($el.attributes, function (attr) {
                    if (attr.name.match(this.gtmAttrRegex)) {
                        let attrName = attr.name.replace(this.gtmAttrRegex, '$1');

                        item[attrName] = attr.value;
                    }
                }.bind(this));

                items.push(item);
            }.bind(this));

            let ga3Data = {
                'event':     'ga3_promotionClick',
                'ecommerce': {
                    'promoClick':  {
                        promotions: items
                    }
                }
            };

            window.dataLayer.push({ecommerce: null});  // Clear the previous ecommerce object.
            window.dataLayer.push(ga3Data);

            let eventItems = {items: items};

            _.each($eventEl[0].attributes, function (attr) {
                if (attr.name.match(this.gtmAttrRegex)) {
                    let attrName = attr.name.replace(this.gtmAttrRegex, '$1');

                    eventItems[attrName] = attr.value;
                }
            }.bind(this));

            window.dataLayer.push({ecommerce: null});  // Clear the previous ecommerce object.
            gtag('event', 'select_promotion',eventItems);
        }
    });

    var ViewPromotion = AbstractEvent.extend({
        creativeNameAttr: 'data-gtm-creative_name',
        creativeSlotAttr: 'data-gtm-creative_slot',

        promolistIdAttr: 'data-gtml-promo-list-id',

        itemIdAttr:   'data-gtm-item_id',
        itemNameAttr: 'data-gtm-item_name',

        initEventSelector: function () {
            this.eventSelector = '[' + this.eventAttr + '="view_promotion"]';
        },

        listeners: function () {
            _.each($(this.eventSelector), function (el) {
                let $el = $(el);

                if (this.isVisible($el)) {
                    this.sendData($el);
                }
            }.bind(this));

            this.onScroll = _.debounce(() => {
                this.sendData($(this.eventSelector), null);
            }, 40);

            $(window).on('scroll', this.onScroll);

            $('body').on('contentUpdated', function () {
                this.sendData($(this.eventSelector), null);
            }.bind(this));
        },

        destroy: function () {
            $(window).off('scroll', this.onScroll);
            this._super();
        },

        sendData: function ($el) {
            _.each($el, function (eventEl, i) {
                let $eventEl = $(eventEl);

                // set identifier or each promo
                if (!$eventEl.attr(this.promolistIdAttr)) {
                    $eventEl.attr(this.promolistIdAttr, i);
                }

                if (this.isVisible($eventEl)) {
                    this.setGaData($eventEl, null);
                }
            }.bind(this));
        },

        setGaData: function ($listEl, productIds) {
            let itemIdSelector   = '[' + this.itemIdAttr + ']',
                itemNameSelector = '[' + this.itemNameAttr+ ']';

            let $eventEl     = $listEl;
            let $itemIdEls   = $(itemIdSelector, $eventEl);
            let $itemNameEls = $(itemNameSelector, $eventEl);

            let listId = $eventEl.attr(this.promolistIdAttr);

            let $itemsEls;
            if ($itemIdEls.length) {
                $itemsEls = $itemIdEls;
            } else {
                $itemsEls = $itemNameEls;
            }

            if (typeof this.sentLists[listId] == 'undefined' || !this.sentLists[listId]) {
                this.sentLists[listId] = true;

                let items = [];

                _.each($itemsEls, function ($el) {
                    let item = [];

                    _.each($el.attributes, function (attr) {
                        if (attr.name.match(this.gtmAttrRegex)) {
                            let attrName = attr.name.replace(this.gtmAttrRegex, '$1');

                            item[attrName] = attr.value;
                        }
                    }.bind(this));

                    items.push(item);
                }.bind(this));

                let ga3Data = {
                    'event': 'ga3_promotionView',
                    'ecommerce': {
                        'promoView':  {
                            promotions: items
                        }
                    }
                };

                window.dataLayer.push({ecommerce: null});  // Clear the previous ecommerce object.
                window.dataLayer.push(ga3Data);

                let eventItems = {items: items};

                _.each($eventEl[0].attributes, function (attr) {
                    if (attr.name.match(this.gtmAttrRegex)) {
                        let attrName = attr.name.replace(this.gtmAttrRegex, '$1');

                        eventItems[attrName] = attr.value;
                    }
                }.bind(this));

                let ga4Data = {
                    0: 'event',
                    1: 'view_promotion',
                    2: eventItems
                };

                window.dataLayer.push({ecommerce: null});  // Clear the previous ecommerce object.
                gtag('event', 'view_promotion', eventItems);
            }
        }
    });

    $.widget('mstGtmEvents', {
        component: 'Mirasvit_GoogleTagManager/js/events',

        create: function () {
            this.selectItem = new SelectItem();
            this.itemList = new ItemList();
            this.selectPromotion = new SelectPromotion();
            this.viewPromotion = new ViewPromotion();
        },

        destroy: function () {
            this.viewPromotion.destroy();
        }
    });

    $.widget('mstGtmToolbar', {
        component: 'Mirasvit_GoogleTagManager/js/toolbar',

        defaults: {
            cookieName: 'mst_gtm_debug',
            debugOn:    'gtm'
        },

        create: function () {
            var $body = $('body');

            var currentUrl = new URL(window.location);

            if (currentUrl.searchParams.get('debug') == this.debugOn) {
                if ($.cookies.get(this.cookieName) == this.debugOn) {
                    $.cookies.set(this.cookieName, '');
                } else {
                    $.cookies.set(this.cookieName, this.debugOn);
                }
            }

            if ($.cookies.get(this.cookieName) == this.debugOn) {
                $body.append(this.getWrapperHtml());

                this.$toolbarBody = $('.mst-gtm__toolbar-body');

                let len = 0
                this.updateToolbarTimer = setInterval(function () {
                    if (window.dataLayer.length !== len) {
                        this.updateToolbar();

                        len = window.dataLayer.length
                    }
                }.bind(this), 1000);
            }
        },

        destroy: function () {
            $('.mst-gtm__toolbar').remove();
            $('body .mst-gtm__toolbar-extra').remove();

            if (this.updateToolbarTimer) {
                clearInterval(this.updateToolbarTimer);
            }
        },

        updateToolbar: function () {
            this.$toolbarBody.html('');

            let index = 1;
            _.each(window.dataLayer, function (data) {
                if (!data.event) {
                    return;
                }

                const $displayData = `<pre><code>${JSON.stringify(data, undefined, 4)}</code></pre>`;

                const $event = $('<div></div>')
                    .addClass('mst-gtm__toolbar-event')
                    .append($('<strong></strong>').html('#' + index))
                    .append($('<i></i>').html('Event: ' + data.event))
                    .append($('<span></span>').html('Open'));

                $event.on('click', function () {
                    this.displayData($displayData)
                }.bind(this));

                this.$toolbarBody.append($event);

                index++;
            }.bind(this));
        },

        getWrapperHtml: function () {
            return '' +
                '<div class="mst-gtm__toolbar">\n' +
                '    <strong>Google Tag Manager</strong>\n' +
                '\n' +
                '    <div class="mst-gtm__toolbar-body">\n' +
                '    </div>\n' +
                '</div>\n';
        },

        displayData: function ($data) {
            $('body .mst-gtm__toolbar-extra').remove();

            var $t = $('<div></div>')
                .addClass('mst-gtm__toolbar-extra')
                .html($data);

            $('body').append($t)
        }
    });
})();
