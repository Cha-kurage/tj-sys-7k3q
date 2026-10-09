var CACHE = 'thejail-prison-v44';
var ASSETS = ['./', './index.html', './style.css', './app.js', './manifest.json', './fonts/play.css', './fonts/murecho.css', './fonts/murecho-100.woff2', './fonts/murecho-101.woff2', './fonts/murecho-102.woff2', './fonts/murecho-103.woff2', './fonts/murecho-104.woff2', './fonts/murecho-105.woff2', './fonts/murecho-106.woff2', './fonts/murecho-107.woff2', './fonts/murecho-108.woff2', './fonts/murecho-109.woff2', './fonts/murecho-110.woff2', './fonts/murecho-111.woff2', './fonts/murecho-112.woff2', './fonts/murecho-113.woff2', './fonts/murecho-114.woff2', './fonts/murecho-117.woff2', './fonts/murecho-119.woff2', './fonts/murecho-55.woff2', './fonts/murecho-71.woff2', './fonts/murecho-72.woff2', './fonts/murecho-77.woff2', './fonts/murecho-78.woff2', './fonts/murecho-80.woff2', './fonts/murecho-81.woff2', './fonts/murecho-82.woff2', './fonts/murecho-84.woff2', './fonts/murecho-86.woff2', './fonts/murecho-87.woff2', './fonts/murecho-89.woff2', './fonts/murecho-90.woff2', './fonts/murecho-91.woff2', './fonts/murecho-92.woff2', './fonts/murecho-93.woff2', './fonts/murecho-94.woff2', './fonts/murecho-95.woff2', './fonts/murecho-96.woff2', './fonts/murecho-97.woff2', './fonts/murecho-98.woff2', './fonts/murecho-99.woff2', './fonts/Play-Bold-latin.woff2', './fonts/Play-Bold-greek.woff2', './images/window.png', './images/choice-head.png', './images/sym-yes.png', './images/sym-no.png', './images/banner-senryu.png', './images/banner-ai.png', './images/caution.png', './images/btn-code.png', './images/btn-record.png', './images/icon-cab.png', './images/logo-thejail.png', './images/icon-192.png', './images/icon-512.png', './images/apple-touch-icon.png', './images/item-mask.png', './images/icon-mask.png', './images/item-pencil.png', './images/icon-pencil.png', './images/item-tissue.png', './images/icon-tissue.png', './images/item-chain.png', './images/icon-chain.png', './images/item-ballpoint.png', './images/icon-ballpoint.png', './images/item-battery.png', './images/icon-battery.png', './images/item-eraser.png', './images/icon-eraser.png', './images/item-diamond.png', './images/icon-diamond.png', './images/item-heart.png', './images/icon-heart.png', './images/item-club.png', './images/icon-club.png', './images/item-spade.png', './images/icon-spade.png', './images/item-carabiner.png', './images/icon-carabiner.png', './images/item-clip.png', './images/icon-clip.png', './images/item-shook.png', './images/icon-shook.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }));
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  e.respondWith(caches.match(e.request).then(function (r) { return r || fetch(e.request); }));
});
