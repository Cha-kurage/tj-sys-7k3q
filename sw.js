var CACHE = 'thejail-prison-v62';
var ASSETS = ['./', './index.html', './menkai/', './menkai/index.html', './menkai/menkai.css', './menkai/menkai.js', './images/menkai-ant.png', './images/menkai-gate.png', './images/menkai-stick.png', './images/menkai-butterfly.png', './images/menkai-sun.png', './images/menkai-temple.png', './images/menkai-slope.png', './images/menkai-moon.png', './images/menkai-x.png', './style.css', './app.js', './manifest.json', './videos/warden.mp4', './fonts/play.css', './fonts/murecho.css', './fonts/murecho-100.woff2', './fonts/murecho-101.woff2', './fonts/murecho-102.woff2', './fonts/murecho-103.woff2', './fonts/murecho-104.woff2', './fonts/murecho-105.woff2', './fonts/murecho-106.woff2', './fonts/murecho-107.woff2', './fonts/murecho-108.woff2', './fonts/murecho-109.woff2', './fonts/murecho-110.woff2', './fonts/murecho-111.woff2', './fonts/murecho-112.woff2', './fonts/murecho-113.woff2', './fonts/murecho-114.woff2', './fonts/murecho-117.woff2', './fonts/murecho-119.woff2', './fonts/murecho-55.woff2', './fonts/murecho-56.woff2', './fonts/murecho-66.woff2', './fonts/murecho-69.woff2', './fonts/murecho-71.woff2', './fonts/murecho-72.woff2', './fonts/murecho-74.woff2', './fonts/murecho-77.woff2', './fonts/murecho-78.woff2', './fonts/murecho-80.woff2', './fonts/murecho-81.woff2', './fonts/murecho-82.woff2', './fonts/murecho-83.woff2', './fonts/murecho-84.woff2', './fonts/murecho-85.woff2', './fonts/murecho-86.woff2', './fonts/murecho-87.woff2', './fonts/murecho-88.woff2', './fonts/murecho-89.woff2', './fonts/murecho-90.woff2', './fonts/murecho-91.woff2', './fonts/murecho-92.woff2', './fonts/murecho-93.woff2', './fonts/murecho-94.woff2', './fonts/murecho-95.woff2', './fonts/murecho-96.woff2', './fonts/murecho-97.woff2', './fonts/murecho-98.woff2', './fonts/murecho-99.woff2', './fonts/Play-Bold-latin.woff2', './fonts/Play-Bold-greek.woff2', './images/window.png', './images/choice-head.png', './images/btn-close.png', './images/sym-yes.png', './images/sym-no.png', './images/banner-senryu.png', './images/banner-ai.png', './images/caution.png', './images/btn-code.png', './images/btn-record.png', './images/icon-cab.png', './images/logo-thejail.png', './images/icon-192.png', './images/icon-512.png', './images/apple-touch-icon.png', './images/item-mask.png', './images/icon-mask.png', './images/item-pencil.png', './images/icon-pencil.png', './images/item-tissue.png', './images/icon-tissue.png', './images/item-chain.png', './images/icon-chain.png', './images/item-ballpoint.png', './images/icon-ballpoint.png', './images/item-battery.png', './images/icon-battery.png', './images/item-eraser.png', './images/icon-eraser.png', './images/item-diamond.png', './images/icon-diamond.png', './images/item-heart.png', './images/icon-heart.png', './images/item-club.png', './images/icon-club.png', './images/item-spade.png', './images/icon-spade.png', './images/item-carabiner.png', './images/icon-carabiner.png', './images/item-clip.png', './images/icon-clip.png', './images/item-shook.png', './images/icon-shook.png'];

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

// 動画はRangeリクエスト(iOS Safari必須)に206で応えないと再生できないため、キャッシュから切り出して返す
function rangeResponse(req) {
  return caches.match(req.url).then(function (cached) {
    if (!cached) return fetch(req);
    return cached.arrayBuffer().then(function (buf) {
      var total = buf.byteLength;
      var m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range') || '');
      var start = 0, end = total - 1;
      if (m) {
        if (m[1] !== '') { start = parseInt(m[1], 10); if (m[2] !== '') end = parseInt(m[2], 10); }
        else if (m[2] !== '') { start = Math.max(0, total - parseInt(m[2], 10)); }
      }
      end = Math.min(end, total - 1);
      return new Response(buf.slice(start, end + 1), {
        status: 206,
        statusText: 'Partial Content',
        headers: {
          'Content-Type': cached.headers.get('Content-Type') || 'video/mp4',
          'Content-Range': 'bytes ' + start + '-' + end + '/' + total,
          'Content-Length': String(end - start + 1)
        }
      });
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // 外部への通信には介入しない

  if (req.headers.has('range')) { e.respondWith(rangeResponse(req)); return; }

  if (req.mode === 'navigate') {
    // 「…/menkai」のような末尾スラッシュなしのURL: GitHub Pages は 301 で補うが、
    // iPad の Safari は Service Worker 経由だとそのリダイレクトに失敗する (Load failed)。
    // そのため、こちらで先にスラッシュ付きへ転送する。
    if (!url.pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(url.pathname)) {
      e.respondWith(Response.redirect(url.origin + url.pathname + '/' + url.search + url.hash, 301));
      return;
    }
    e.respondWith(
      caches.match(req, { ignoreSearch: true }).then(function (r) {
        return r || fetch(req).catch(function () { return caches.match('./index.html'); });
      })
    );
    return;
  }

  e.respondWith(caches.match(req).then(function (r) { return r || fetch(req); }));
});
