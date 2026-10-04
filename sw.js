var CACHE = 'thejail-prison-v32';
var ASSETS = ['./', './index.html', './style.css', './app.js', './manifest.json', './icon.svg', './fonts/play.css', './fonts/Play-Bold-latin.woff2', './fonts/Play-Bold-greek.woff2', './images/window.png', './images/choice-head.png', './images/sym-yes.png', './images/sym-no.png', './images/banner1.png', './images/banner2.png', './images/caution.png', './images/btn-code.png', './images/btn-record.png', './images/icon-cab.png', './images/item-mask.png', './images/icon-mask.png', './images/item-pencil.png', './images/icon-pencil.png', './images/item-tissue.png', './images/icon-tissue.png', './images/item-chain.png', './images/icon-chain.png', './images/item-sharp.png', './images/icon-sharp.png', './images/item-battery.png', './images/icon-battery.png', './images/item-eraser.png', './images/icon-eraser.png', './images/item-diamond.png', './images/icon-diamond.png', './images/item-heart.png', './images/icon-heart.png', './images/item-club.png', './images/icon-club.png', './images/item-spade.png', './images/icon-spade.png', './images/item-carabiner.png', './images/icon-carabiner.png', './images/item-clip.png', './images/icon-clip.png', './images/item-shook.png', './images/icon-shook.png'];

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
