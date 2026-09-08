/* ==========================================================
   AURA FIT - SERVICE WORKER
   Cache-first for the app shell so the installed app opens
   instantly and keeps working offline. The wardrobe itself
   lives in localStorage, so offline is genuinely useful.
   Bump CACHE when you ship new assets.
   ========================================================== */
var CACHE = 'aura-fit-v10';

var SHELL = [
  './',
  './index.html',
  './admin.html',
  './manifest.webmanifest',
  './vendor/bootstrap.min.css',
  './vendor/bootstrap.bundle.min.js',
  './css/tokens.css',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/screens.css',
  './css/auth.css',
  './css/admin.css',
  './css/bootstrap-interop.css',
  './js/sprite.js',
  './js/garments.js',
  './js/colour.js',
  './js/illustrations.js',
  './js/data.js',
  './js/store.js',
  './js/ui.js',
  './js/recommend.js',
  './js/pwa.js',
  './js/screens/auth.js',
  './js/screens/onboarding.js',
  './js/screens/home.js',
  './js/screens/wardrobe.js',
  './js/screens/item.js',
  './js/screens/additem.js',
  './js/screens/outfit.js',
  './js/screens/ideas.js',
  './js/screens/account.js',
  './js/screens/stats.js',
  './js/screens/admin.js',
  './js/router.js',
  './js/app.js',
  './js/admin-shell.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE)
      /* addAll rejects the whole batch if one file 404s, so add individually */
      .then(function (c) {
        return Promise.all(SHELL.map(function (u) {
          return c.add(u).catch(function () { /* optional asset */ });
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.map(function (k) {
          return k.indexOf('aura-fit-') !== 0 || k === CACHE ? null : caches.delete(k);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;   // let the network handle fonts/CDNs

  /* Navigations: always ask the network for the document, bypassing the HTTP
     cache, so a new deploy is picked up on the very next load. The cached copy
     is only a fallback for when there is no connection. */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req, { cache: 'no-store' }).then(function (res) {
        if (res.ok) {
          var copy = res.clone();
          e.waitUntil(caches.open(CACHE).then(function (cache) { return cache.put(req, copy); }));
        }
        return res;
      }).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (r) {
          return r || caches.match(url.pathname.endsWith('/admin.html') ? './admin.html' : './index.html');
        });
      })
    );
    return;
  }

  /* Assets: stale-while-revalidate.
     Serve the cached copy immediately so the app starts instantly, but always
     re-fetch in the background and store the fresh one. Without this a cached
     shell can pin users to an old build until the cache name changes. */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var network = fetch(req).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var copy = res.clone();
          return caches.open(CACHE).then(function (c) { return c.put(req, copy); }).then(function () { return res; });
        }
        return res;
      }).catch(function () {
        return hit || Response.error();
      });
      e.waitUntil(network.then(function () {}));
      return hit || network;
    })
  );
});

self.addEventListener('message', function (e) {
  if (e.data === 'skip-waiting') self.skipWaiting();
});
