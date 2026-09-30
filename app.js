(function () {
  /* ================= 設定 (ここを変えて調整) ================= */
  var TAPS_REQUIRED = 5;        // 隠しタップ回数
  var TAP_RESET_MS = 6000;      // 最後のタップからこの時間が空くとカウントリセット (ゆっくりタップ対応)
  var CHAR_MS = 70;             // 1文字あたりの表示間隔 (仮)
  var LINE_PAUSE_MS = 700;      // 行と行の間の間 (仮)
  var CONSOLE_COUNT = 3;        // 一瞬出るコンソールの数
  var CONSOLE_LIFE_MS = 550;    // コンソール1つの表示時間
  var CONSOLE_GAP_MS = 380;     // 次のコンソールが出るまでの間隔
  var END_HOLD_MS = 2500;       // 最後の文章が終わってからバナーを閉じるまでの時間

  var MSG1 = [
    '暗号生成機能"Code auto β" 起動中',
    '.',
    '.',
    '.',
    '起動完了。利用者の承認を待ちます。',
    '利用者の方々へ',
    'こちらの機能を開くために、次の画面で⭕️を選択してください。'
  ];
  var MSG2 = [
    '利用者の承認が確認できました。',   
  ];
  var QUIZ_ANSWERS = ['カメラ'];   // ひらがな・カタカナ・半角どれでも可
  var CONSOLE_LINES = [
    '$ ssh -p 2222 root@keishicho-core',
    'Permission denied (publickey).',
    '$ ./bypass --target=cellblock_ctrl',
    '[ OK ] injecting payload...',
    '[ OK ] dumping /etc/shadow',
    'WARNING: unauthorized access detected',
    '[ !! ] firewall rules flushed',
    '> decrypt --key=****************',
    'ACCESS GRANTED',
    'root@jail-sys:~# _',
    '0x7f3a 0x91bc 0x00ff 0xdead 0xbeef',
    'connecting to relay 10.0.13.7 ...'
  ];

  /* ================= 共通 ================= */
  function $(id) { return document.getElementById(id); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ---- 通常バナー (注意事項・看守長の挨拶) ---- */
  var open = null;
  function show(id) { var el = $(id); el.hidden = false; open = el; }
  function hide() { if (open) open.hidden = true; open = null; }

  document.querySelectorAll('[data-modal]').forEach(function (btn) {
    btn.addEventListener('click', function () { show(btn.dataset.modal); });
  });
  document.querySelectorAll('.overlay:not(.hk)').forEach(function (ov) {
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.classList.contains('close')) hide();
    });
  });

  /* ---- 隠しタップ ---- */
  var taps = 0, tapTimer = null, busy = false, finished = false;
  $('secret-zone').addEventListener('click', function () {
    if (busy || finished) return;
    taps++;
    clearTimeout(tapTimer);
    if (taps >= TAPS_REQUIRED) {
      taps = 0;
      startHack();
      return;
    }
    tapTimer = setTimeout(function () { taps = 0; }, TAP_RESET_MS);
  });

  /* ---- コンソール演出 ---- */
  function flashConsole() {
    var w = document.createElement('div');
    w.className = 'console';
    var width = 320 + Math.random() * 140;
    var height = 150 + Math.random() * 90;
    w.style.width = width + 'px';
    w.style.left = Math.max(0, Math.random() * (window.innerWidth - width)) + 'px';
    w.style.top = Math.max(0, Math.random() * (window.innerHeight - height)) + 'px';
    var lines = [];
    for (var i = 0; i < 8; i++) lines.push(CONSOLE_LINES[Math.floor(Math.random() * CONSOLE_LINES.length)]);
    w.innerHTML = '<div class="console-bar">terminal — root</div><pre>' + lines.join('\n') + '</pre>';
    document.body.appendChild(w);
    setTimeout(function () { w.remove(); }, CONSOLE_LIFE_MS);
  }

  async function consoleBurst() {
    for (var i = 0; i < CONSOLE_COUNT; i++) {
      flashConsole();
      await sleep(CONSOLE_GAP_MS);
    }
    await sleep(CONSOLE_LIFE_MS - CONSOLE_GAP_MS > 0 ? CONSOLE_LIFE_MS - CONSOLE_GAP_MS : 0);
  }

  /* ---- タイプライター ---- */
  async function typeLines(container, lines) {
    container.innerHTML = '';
    for (var i = 0; i < lines.length; i++) {
      var p = document.createElement('p');
      p.className = 'typing';
      container.appendChild(p);
      var text = lines[i];
      for (var j = 0; j < text.length; j++) {
        p.textContent += text[j];
        container.scrollTop = container.scrollHeight;
        await sleep(CHAR_MS);
      }
      p.classList.remove('typing');
      await sleep(LINE_PAUSE_MS);
    }
  }

  /* ---- 全体シーケンス ---- */
  function waitChoice() {
    return new Promise(function (resolve) {
      $('hk-yes').onclick = function () { resolve(true); };
      $('hk-no').onclick = function () { resolve(false); };
    });
  }

  function closeAllHack() {
    ['hk-msg', 'hk-choice', 'hk-thanks'].forEach(function (id) { $(id).hidden = true; });
    $('hk-msg-body').innerHTML = '';
    $('hk-thanks-body').innerHTML = '';
  }

  async function startHack() {
    busy = true;
    await consoleBurst();

    $('hk-msg').hidden = false;
    await typeLines($('hk-msg-body'), MSG1);

    await sleep(600);
    $('hk-choice').hidden = false;
    var yes = await waitChoice();

    if (!yes) {          // 黒バツ: 全部閉じてやり直し可能に
      closeAllHack();
      busy = false;
      return;
    }

    $('hk-choice').hidden = true;
    $('hk-thanks').hidden = false;
    await typeLines($('hk-thanks-body'), MSG2);

    await sleep(END_HOLD_MS);
    closeAllHack();
    finished = true;
    busy = false;
    var btn = $('code-btn');
    btn.hidden = false;
    btn.classList.add('appear');
    btn.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }

  /* ---- Code auto β → 練習問題 ---- */
  var guideStarted = false;

  function normalize(str) {
    return str.normalize('NFKC').replace(/\s/g, '').toLowerCase()
      .replace(/[ぁ-ゖ]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) + 0x60); });
  }

  function setupQuiz() {
    var input = $('q-input'), form = $('q-form');
    var solved = false;

    function check() {
      if (solved) return;
      var v = normalize(input.value);
      for (var i = 0; i < QUIZ_ANSWERS.length; i++) {
        if (v === normalize(QUIZ_ANSWERS[i])) {
          solved = true;
          input.value = QUIZ_ANSWERS[i];
          input.readOnly = true;
          input.blur();
          $('q-send').disabled = true;
          $('q-status').hidden = false;
          return;
        }
      }
    }

    // 送信ボタン (またはEnter) で判定。不正解は無反応
    form.addEventListener('submit', function (e) { e.preventDefault(); check(); });
  }

  $('code-btn').addEventListener('click', async function (e) {
    e.preventDefault();
    if (guideStarted) return;
    guideStarted = true;

    $('hk-quiz').hidden = false;
    $('q-input').focus();
  });
  setupQuiz();

  /* ---- ピンチズーム防止 (iOS) ---- */
  ['gesturestart', 'gesturechange'].forEach(function (t) {
    document.addEventListener(t, function (e) { e.preventDefault(); });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
