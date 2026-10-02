var CACHE = 'thejail-prison-v25';
var ASSETS = ['./', './index.html', './style.css', './app.js', './manifest.json', './icon.svg', './images/code-btn.png', './images/record-btn.png', './images/window.png', './images/choice-head.png', './images/sym-yes.png', './images/sym-no.png', './images/item-mask.png', './images/item-pencil.png', './images/item-pen.png', './images/icon-mask.png', './images/icon-pencil.png', './images/icon-pen.png', './images/item-chain.png', './images/icon-chain.png', './images/item-sharp.png', './images/icon-sharp.png', './images/item-ballpoint.png', './images/icon-ballpoint.png', './images/item-fountain.png', './images/icon-fountain.png', './images/item-heart.png', './images/icon-heart.png', './images/item-diamond.png', './images/icon-diamond.png', './images/item-spade.png', './images/icon-spade.png', './images/item-club.png', './images/icon-club.png', './images/item-file.png', './images/icon-file.png', './images/item-tablet.png', './images/icon-tablet.png', './images/item-timer.png', './images/icon-timer.png',  './fonts/play.css', './fonts/Play-Bold-latin.woff2', './fonts/Play-Bold-greek.woff2'];

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
