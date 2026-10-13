(function () {
  /* ================= 設定 ================= */
  var MIC_DELAY_MS = 3000;     // マイクをタップしてから次の画面まで
  var SIMUL_MS = 200;          // 同時押しとみなす時間差 (0.2秒)
  var CONVERT_DELAY_MS = 500;  // 全部入力されてから漢字に変換するまで
  var CONVERT_MS = 600;        // 変換演出の長さ
  var RELOAD_TAPS = 5;         // リセット: 右下のタップ回数
  var RELOAD_IDLE_MS = 4000;   // タップが途切れてからカウントをリセットするまで
  var RELOAD_AREA = 140;       // 右下 140px 四方

  /* 画像id: ant=アリ gate=門 stick=棒 butterfly=蝶 sun=日 temple=寺 slope=坂 moon=月 x=バツ
     single = 1つだけ押す / pair = 2つを同時押し (SIMUL_MS 以内)。steps を順番に満たすと result に変換される。 */
  var PATTERNS = [
    { name: 'penalty', result: '懲罰房',
      steps: [ { single: 'butterfly', text: 'ちょう' }, { single: 'x', text: 'ばつ' }, { single: 'stick', text: 'ぼう' } ] },
    { name: 'time', result: '時間',
      steps: [ { pair: ['sun', 'temple'], text: 'じ' }, { pair: ['sun', 'gate'], text: 'かん' } ] }
  ];

  function $(id) { return document.getElementById(id); }

  /* ---------- マイク → 3秒後に次の画面 ---------- */
  var micBusy = false;
  $('mic').addEventListener('click', function () {
    if (micBusy) return;
    micBusy = true;
    $('mic').classList.add('listening');
    $('mic-status').textContent = '...';
    setTimeout(function () {
      $('screen-title').hidden = true;
      $('screen-main').hidden = false;
    }, MIC_DELAY_MS);
  });

  /* ---------- タイル ---------- */
  var active = null;          // 選ばれたパターン (最初に条件を満たした方)
  var progress = 0;
  var text = '';
  var complete = false;       // 全部入力されて漢字に変換済み
  var locked = false;         // 印刷中 (リセット待ち)
  var recent = [];            // 直近の押下 {id, t}

  function renderField(animateLast, final) {
    var box = $('field-text');
    box.className = 'field-text' + (final ? ' final' : '');
    box.innerHTML = '';
    var chars = Array.from(text);
    chars.forEach(function (c, i) {
      var s = document.createElement('span');
      s.className = 'ch';
      s.textContent = c;
      if (!animateLast || i < chars.length - animateLast) s.style.animation = 'none';
      box.appendChild(s);
    });
  }

  function stepMatches(step, id, now) {
    if (step.single) return step.single === id;
    var other = step.pair[0] === id ? step.pair[1] : (step.pair[1] === id ? step.pair[0] : null);
    if (!other) return false;
    for (var i = recent.length - 1; i >= 0; i--) {         // 相手が SIMUL_MS 以内に押されていれば同時押し
      if (recent[i].id === other && !recent[i].used && now - recent[i].t <= SIMUL_MS) {
        recent[i].used = true;
        return true;
      }
    }
    return false;
  }

  function advance(pattern, id, now) {
    var step = pattern.steps[progress];
    if (!step || !stepMatches(step, id, now)) return false;
    active = pattern;
    progress++;
    var added = Array.from(step.text).length;
    text += step.text;
    renderField(added, false);
    if (progress >= pattern.steps.length) {
      setTimeout(function () {
        var box = $('field-text');
        box.classList.add('convert');
        setTimeout(function () {
          text = pattern.result;
          renderField(0, true);
          complete = true;
          $('confirm').setAttribute('aria-disabled', 'false');
        }, CONVERT_MS / 2);
      }, CONVERT_DELAY_MS);
    }
    return true;
  }

  function onPress(id) {
    var now = Date.now();
    recent.push({ id: id, t: now, used: false });
    recent = recent.filter(function (r) { return now - r.t <= SIMUL_MS * 5; });
    if (locked || complete) return;
    if (active) { advance(active, id, now); return; }      // 一度決まったら、そのパターンだけ進める
    for (var i = 0; i < PATTERNS.length; i++) {
      if (advance(PATTERNS[i], id, now)) return;
    }
  }

  document.querySelectorAll('.tile').forEach(function (tile) {
    tile.addEventListener('pointerdown', function () {
      tile.classList.remove('pressed');
      void tile.offsetWidth;
      tile.classList.add('pressed');
      setTimeout(function () { tile.classList.remove('pressed'); }, 320);
      onPress(tile.dataset.id);
    });
    tile.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  });

  /* ---------- 確定 → 印刷中 (リセット待ち) ---------- */
  $('confirm').addEventListener('click', function () {
    var btn = $('confirm');
    if (!complete || locked) {
      btn.classList.remove('nope'); void btn.offsetWidth; btn.classList.add('nope');
      return;
    }
    locked = true;
    $('printing').hidden = false;
  });

  /* ---------- リセット: 右下を5回タップ ---------- */
  var taps = 0, idle = null;
  document.addEventListener('pointerdown', function (e) {
    if (e.clientX < window.innerWidth - RELOAD_AREA || e.clientY < window.innerHeight - RELOAD_AREA) return;
    taps++;
    clearTimeout(idle);
    if (taps >= RELOAD_TAPS) { location.reload(); return; }
    idle = setTimeout(function () { taps = 0; }, RELOAD_IDLE_MS);
  }, true);

  /* ---------- 戻る操作の無効化 / ピンチ防止 ---------- */
  function trapBack() { try { history.pushState({ trap: 1 }, '', location.href); } catch (e) {} }
  trapBack();
  window.addEventListener('popstate', trapBack);
  document.addEventListener('pointerdown', function once() { trapBack(); document.removeEventListener('pointerdown', once); });
  ['gesturestart', 'gesturechange'].forEach(function (t) {
    document.addEventListener(t, function (e) { e.preventDefault(); });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(function () {});
  }
})();
