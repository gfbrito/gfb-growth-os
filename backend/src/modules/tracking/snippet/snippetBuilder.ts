import { env } from "../../../config/env.js";

export function generateSnippet(pixelKey: string, pixelId: string): string {
  const apiBaseUrl = env.API_BASE_URL;

  return `/* GFB Digital CAPI Gateway Snippet v3.0.0 — Pixel: ${pixelKey} */
(function(window, document) {
  'use strict';

  var PIXEL_KEY = "${pixelKey}";
  var PIXEL_ID = "${pixelId}";
  var ENDPOINT_EVENTS = "${apiBaseUrl}/api/events";
  var ENDPOINT_INTENT = "${apiBaseUrl}/api/checkout-intent";
  var SNIPPET_WAIT_FBP_MS = 2000;

  // 1. Storage Helpers
  function getCookie(name) {
    var v = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
    return v ? decodeURIComponent(v[2]) : null;
  }

  function setCookie(name, value, days) {
    var d = new Date();
    d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * (days || 90));
    document.cookie = name + "=" + encodeURIComponent(value) + ";path=/;expires=" + d.toUTCString() + ";SameSite=Lax";
  }

  function generateId(prefix) {
    return (prefix || 'id') + '_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
  }

  // 2. Identity Resolution (_fbp, _fbc, capi_idx, external_id)
  var capiIdx = sessionStorage.getItem('capi_idx') || getCookie('capi_idx');
  if (!capiIdx) {
    capiIdx = generateId('cidx');
    sessionStorage.setItem('capi_idx', capiIdx);
    setCookie('capi_idx', capiIdx, 30);
  }

  var externalId = localStorage.getItem('capi_ext_id') || getCookie('capi_ext_id');
  if (!externalId) {
    externalId = generateId('uid');
    localStorage.setItem('capi_ext_id', externalId);
    setCookie('capi_ext_id', externalId, 180);
  }

  function getFbc() {
    var existing = getCookie('_fbc');
    if (existing) return existing;
    var match = window.location.search.match(/[?&]fbclid=([^&]+)/);
    if (match && match[1]) {
      var fbcVal = 'fb.1.' + Date.now() + '.' + decodeURIComponent(match[1]);
      setCookie('_fbc', fbcVal, 90);
      return fbcVal;
    }
    return null;
  }

  function waitForFbp(callback, maxWaitMs) {
    var start = Date.now();
    var interval = setInterval(function() {
      var fbp = getCookie('_fbp');
      if (fbp || (Date.now() - start) >= maxWaitMs) {
        clearInterval(interval);
        callback(fbp || null);
      }
    }, 100);
  }

  // 3. Meta Pixel Initialization Stub (if not present)
  if (!window.fbq) {
    var n = window.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = n;
    n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
    var t = document.createElement('script'); t.async = true;
    t.src = 'https://connect.facebook.net/en_US/fbevents.js';
    var s = document.getElementsByTagName('script')[0];
    if (s && s.parentNode) s.parentNode.insertBefore(t, s);
  }

  window.fbq('init', PIXEL_ID, { external_id: externalId });

  // 4. Send Event to Browser Pixel and CAPI Server-Side Simultaneously
  function sendEvent(eventName, customData, userParams) {
    var eventId = generateId('ev');
    var fbc = getFbc();

    // A. Fire Browser Pixel with eventID for deduplication
    window.fbq('track', eventName, customData || {}, { eventID: eventId });

    // B. Wait for _fbp and fire Server-Side CAPI Gateway
    waitForFbp(function(fbp) {
      var payload = {
        pixelKey: PIXEL_KEY,
        eventName: eventName,
        eventId: eventId,
        url: window.location.href,
        referrer: document.referrer || null,
        fbp: fbp,
        fbc: fbc,
        capiIdx: capiIdx,
        externalId: externalId,
        customData: customData || {},
        userData: userParams || {}
      };

      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon(ENDPOINT_EVENTS, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('POST', ENDPOINT_EVENTS, true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify(payload));
        }
      } catch (e) {}
    }, SNIPPET_WAIT_FBP_MS);

    return eventId;
  }

  // Global helper for manual dispatch
  window.gfbSendConversion = sendEvent;

  // 5. Fire Initial PageView
  sendEvent('PageView');

  // 6. Checkout Link Decorator & Intent Tracker
  function decorateCheckoutLinks() {
    var checkoutDomains = [
      'pay.kiwify.com.br',
      'pay.hotmart.com',
      'sun.eduzz.com',
      'checkout.asaas.com',
      'pagar.me'
    ];

    var anchors = document.querySelectorAll('a[href]');
    for (var i = 0; i < anchors.length; i++) {
      var a = anchors[i];
      var href = a.getAttribute('href') || '';
      var isCheckout = false;

      for (var d = 0; d < checkoutDomains.length; d++) {
        if (href.indexOf(checkoutDomains[d]) !== -1) {
          isCheckout = true;
          break;
        }
      }

      if (isCheckout && href.indexOf('capi_idx=') === -1 && href.indexOf('s2=') === -1) {
        var sep = href.indexOf('?') !== -1 ? '&' : '?';
        // s2 carries capi_idx, s3 carries external_id
        var decorated = href + sep + 's2=' + encodeURIComponent(capiIdx) + '&s3=' + encodeURIComponent(externalId) + '&src=gfb_capi';
        a.setAttribute('href', decorated);

        // Track Checkout Intent when clicked
        a.addEventListener('click', function(ev) {
          var targetHref = this.getAttribute('href');
          sendEvent('InitiateCheckout');

          try {
            var intentPayload = {
              capiIdx: capiIdx,
              pixelKey: PIXEL_KEY,
              fbp: getCookie('_fbp'),
              fbc: getFbc(),
              externalId: externalId,
              landingUrl: window.location.href,
              checkoutUrl: targetHref
            };
            if (navigator.sendBeacon) {
              navigator.sendBeacon(ENDPOINT_INTENT, new Blob([JSON.stringify(intentPayload)], { type: 'application/json' }));
            }
          } catch (e) {}
        });
      }
    }
  }

  // 7. Declarative Event Listener [data-capi-event="AddToCart"]
  document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target !== document) {
      var attr = target.getAttribute && target.getAttribute('data-capi-event');
      if (attr) {
        sendEvent(attr);
        break;
      }
      target = target.parentNode;
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorateCheckoutLinks);
  } else {
    decorateCheckoutLinks();
  }
})(window, document);
`;
}
