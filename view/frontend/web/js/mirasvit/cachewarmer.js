(function () {
    'use strict';

    $.view('mirasvit.cachewarmerToolbar', {
        component: 'Mirasvit_CacheWarmer/js/toolbar',
        defaults: {
            cookieName: '',
            cookValue: '',
            toolbarUrl: '',
            pageId: '',
            pageType: '',
            warmRules: '',
            defaultStatus: ''
        },

        /** [create description] */
        create: function () {
            var isHit,
                originCookieValue = $.cookies.get(this.cookieName);

            if (!window.performance) {
                return;
            }

            $.cookies.set(this.cookieName, window.performance.timing.fetchStart);

            if (this.cookieValue === null && originCookieValue === null) {
                isHit = this.defaultStatus;
            } else {
                // eslint-disable-next-line eqeqeq
                isHit = this.cookieValue != originCookieValue ? 1 : 0;
            }

            $.request.get({
                url: this.toolbarUrl,
                data: {
                    uri: window.location.href,
                    isHit: isHit,
                    pageId: this.pageId,
                    pageType: this.pageType,
                    warmRules: this.warmRules,
                    userAgent: window.navigator.userAgent,
                    nonCacheableBlocks: $('.mst-cache-warmer__ncb').data('ncb')
                },

                /** [success description] */
                success: function (data) {
                    $('body').append(data.html);
                }
            });
        }
    });

    $.view('mirasvit.cachewarmerTrack', {
        component: 'Mirasvit_CacheWarmer/js/track',
        defaults: {
            url: '',
            cookieName: '',
            cookieValue: ''
        },

        /** [create description] */
        create: function () {
            var originCookieValue = $.cookies.get(this.cookieName);

            if (!window.performance) {
                return;
            }

            $.cookies.set(this.cookieName, window.performance.timing.fetchStart);

            if (this.cookieValue === null && originCookieValue === null) {
                return; //we don't know cached or not now
            }

            $.request.get({
                url: this.url,
                data: {
                    uri: window.location.href,
                    ttfb: window.performance.timing.responseStart - window.performance.timing.fetchStart,
                    // eslint-disable-next-line eqeqeq
                    isHit: this.cookieValue != originCookieValue ? 1 : 0
                }
            });
        }
    });
})();
