(function () {
  /* ================= 設定 (ここを変えて調整) ================= */
  var HOT_TAPS = 5;             // 「金」「建」それぞれのタップ回数
  var HOT_IDLE_MS = 5000;       // タップが途切れてからカウントをリセットするまでの時間 (ゆっくりでもOK)
  var CONSOLE_AFTER_MS = 700;   // 緑のコンソール演出のあと、メッセージが出るまでの間
  var RELOAD_HOLD_MS = 5000;    // スタッフ用リロード(画面右上の長押し)の時間
  var BTN_HOLD_MS = 1000;       // Code auto β / これまでの記録を見る の長押し時間
  var CHAR_MS = 70;             // 1文字あたりの表示間隔 (仮)
  var LINE_PAUSE_MS = 700;      // 行と行の間の間 (仮)
  var CONSOLE_FIRST = 2;        // 最初にゆっくり出すコンソールの数
  var CONSOLE_FIRST_GAP_MS = 450;
  var CONSOLE_PAUSE_MS = 800;   // 最初の2つのあとの間
  var CONSOLE_RUSH_MIN = 5;     // 続けて一気に出す数 (5〜6個)
  var CONSOLE_RUSH_MAX = 6;
  var CONSOLE_RUSH_GAP_MS = 120; // 一気に出すときのずらし幅
  var CONSOLE_LIFE_MS = 650;    // コンソール1つの表示時間
  var END_HOLD_MS = 700;        // 最後の文章が終わってからバナーを閉じるまでの時間

  var MSG1 = [
    '暗号生成機能"Code auto β"起動',
    '利用者の方々の承認を待ちます。'
  ];
  var MSG2 = [
    '利用者の承認が確認できました。',   
  ];
  var PEER_HOLD_MS = 1500;         // 「仲間」の長押し時間
  var WRONG_MS = 500;              // 「間違い」の表示時間
  var LONGPRESS_MS = 1200;         // 「練習を終える」の長押し時間
  var ANALYZE_MS = 2500;           // 「情報を分析中」から結果表示までの時間
  // 各Question: text=問題文 / answers=答え(ひらがな・カタカナ・半角どれでも可)
  //   items=選択肢の画像(images/item-◯◯.png と images/icon-◯◯.png) / correct=正解の選択(順不同)
  var QUESTIONS = [
    { text: 'Question 0 ;\u00a0 写真を撮る時に使うものは何？',
      answers: ['かめら'],
      items: ['mask', 'pencil', 'tissue'],                    // マスク・鉛筆・ティッシュ
      correct: ['mask', 'pencil'],
      endPractice: true },
    { text: 'Question 1 ;\u00a0 作戦の時間についての情報は？',
      answers: ['にじよりかいし'],
      items: ['chain', 'ballpoint', 'battery', 'eraser'],      // 鎖・ボールペン・電池・消しゴム
      correct: ['chain', 'ballpoint'] },
    { text: 'Question 2 ;\u00a0 爆破する場所についての情報は？',
      answers: ['えいちのにばんくかく'],
      items: ['diamond', 'heart', 'club', 'spade'],           // ダイヤ・ハート・クラブ・スペード
      correct: ['diamond', 'heart', 'club', 'spade'] },
    { text: 'Question 3 ;\u00a0 脱出するために鍵となる場所は？',
      answers: ['ぬけみちはえふのさん'],
      items: ['carabiner', 'clip', 'shook'],                  // カラビナ・クリップ・S字フック
      extra: 'cab',                                           // + インフォメーションの「Code auto β」ボタンをタップして選択
      correct: ['carabiner', 'cab'] }
  ];
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
  var records = [];   // 完了したQuestionの記録 (この端末での出来事)
  var consentGiven = false;   // 利用者の同意 (⭕) を得たか
  var quiz = {};      // setupQuiz が中身を入れる (Q3のCode auto β選択用)
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

  /* ---- 起動トリガー: 注意事項の「金」と「建」をそれぞれ5回タップ ---- */
  var busy = false, finished = false;
  var hotCount = { kin: 0, ken: 0 }, hotIdle = null;
  ['kin', 'ken'].forEach(function (k) {
    $('hot-' + k).addEventListener('pointerdown', function () {
      hotCount[k]++;
      clearTimeout(hotIdle);
      hotIdle = setTimeout(function () { hotCount.kin = hotCount.ken = 0; }, HOT_IDLE_MS);
      if (hotCount.kin >= HOT_TAPS && hotCount.ken >= HOT_TAPS) {
        hotCount.kin = hotCount.ken = 0;
        clearTimeout(hotIdle);
        if (busy || finished) return;
        hide();            // 注意事項の画像を閉じる
        startHack();
      }
    });
  });

  /* ---- 広告バナー: タップで拡大 ---- */
  document.querySelectorAll('.banner').forEach(function (b) {
    b.addEventListener('click', function () {
      $('banner-large').src = b.dataset.banner;
      show('modal-banner');
    });
  });

  /* ---- 長押しボタン ---- */
  document.documentElement.style.setProperty('--hold-btn', (BTN_HOLD_MS / 1000) + 's');
  function onHold(el, ms, onFire, onTap) {
    var timer = null, fired = false;
    function cancel() { clearTimeout(timer); timer = null; el.classList.remove('holding'); }
    el.addEventListener('pointerdown', function () {
      fired = false;
      cancel();
      el.classList.add('holding');
      timer = setTimeout(function () {
        timer = null; fired = true;
        el.classList.remove('holding');
        el.classList.add('fired');
        setTimeout(function () { el.classList.remove('fired'); }, 400);
        onFire();
      }, ms);
    });
    el.addEventListener('pointerup', function () {
      var pending = timer !== null;
      cancel();
      if (pending && !fired && onTap) onTap();
    });
    ['pointerleave', 'pointercancel'].forEach(function (t) { el.addEventListener(t, cancel); });
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

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

  // 2つ → 間 → 5〜6個を少しずつずらして一気に → すぐ「起動中」のウィンドウへ
  async function consoleBurst() {
    for (var i = 0; i < CONSOLE_FIRST; i++) {
      flashConsole();
      await sleep(CONSOLE_FIRST_GAP_MS);
    }
    await sleep(CONSOLE_PAUSE_MS);
    var rush = CONSOLE_RUSH_MIN + Math.floor(Math.random() * (CONSOLE_RUSH_MAX - CONSOLE_RUSH_MIN + 1));
    for (var k = 0; k < rush; k++) {
      flashConsole();
      await sleep(CONSOLE_RUSH_GAP_MS);
    }
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
      if (i < lines.length - 1) await sleep(LINE_PAUSE_MS);
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
    await sleep(CONSOLE_AFTER_MS);

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

    consentGiven = true;
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

  /* ---- これまでの記録 (別ページ風・時系列) ---- */
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.textContent = html;
    return e;
  }
  function imgEl(src, cls) { var i = document.createElement('img'); i.src = src; i.alt = ''; i.draggable = false; if (cls) i.className = cls; return i; }

  function renderRecords() {
    var main = $('rec-main');
    main.innerHTML = '';
    var n = 0;

    if (consentGiven) {                  // 1. 利用者の同意 + その時のメガネのウィンドウ
      var s = el('section', 'rec-section');
      s.appendChild(el('p', 'rec-tag', 'RECORD ' + (++n)));
      s.appendChild(el('p', 'rec-title', 'Code auto βを使用し始める際、利用者の同意を得た。'));
      var g = el('div', 'rec-glasses');
      g.appendChild(imgEl('images/choice-head.png'));
      var yn = el('div', 'rec-yn');
      var y = el('div', 'on'); y.appendChild(imgEl('images/sym-yes.png'));
      var no = el('div', 'off'); no.appendChild(imgEl('images/sym-no.png'));
      yn.appendChild(y); yn.appendChild(no);
      g.appendChild(yn);
      s.appendChild(g);
      main.appendChild(s);
    }

    records.forEach(function (r) {       // 2〜. 各Question (質問・答え・選択肢・正解のアイコン)
      var q = QUESTIONS[r.qi];
      var s = el('section', 'rec-section');
      s.appendChild(el('p', 'rec-tag', 'RECORD ' + (++n)));
      s.appendChild(el('p', 'rec-title', q.text));
      s.appendChild(el('p', 'rec-ans', '→ ' + r.answer));
      var opts = el('div', 'rec-opts');
      q.items.forEach(function (id) { opts.appendChild(imgEl('images/item-' + id + '.png')); });
      s.appendChild(opts);
      s.appendChild(el('p', 'rec-label', 'あなたの選択'));
      var ic = el('div', 'rec-icons');
      r.selected.forEach(function (id) { ic.appendChild(imgEl('images/icon-' + id + '.png')); });   // 実際に選んだもの
      s.appendChild(ic);
      main.appendChild(s);
    });

    if (!consentGiven && !records.length) main.appendChild(el('p', 'rec-title', '記録はまだありません。'));
    main.scrollTop = 0;
  }

  onHold($('record-btn'), BTN_HOLD_MS, function () {
    renderRecords();
    $('rec-page').hidden = false;
  });
  $('rec-close').addEventListener('click', function () { $('rec-page').hidden = true; });

  /* ---- Code auto β → 練習問題 ---- */

  // 答えはひらがなのみ正解 (カタカナ・半角カナ・英字は不正解)。空白だけ無視。
  function normalize(str) {
    return str.normalize('NFKC').replace(/\s/g, '');
  }

  function setupQuiz() {
    var input = $('q-input'), form = $('q-form');
    var current = 0, solved = false, analyzing = 0;
    var selected = [];          // 選択順のアイテムid

    // 現在のQuestionの選択肢を並べる
    function renderItems() {
      var box = $('items');
      box.innerHTML = '';
      QUESTIONS[current].items.forEach(function (id) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'item';
        b.dataset.id = id;
        b.dataset.icon = 'images/icon-' + id + '.png';
        b.setAttribute('aria-pressed', 'false');
        b.innerHTML = '<img src="images/item-' + id + '.png" alt="" draggable="false"><span class="item-check">✓</span>';
        box.appendChild(b);
      });
    }

    function resetSelection() {
      selected = [];
      $('tray').innerHTML = '';
      $('code-btn').classList.remove('picked');
      renderItems();
    }

    // Q3: インフォメーションの「Code auto β」ボタンのタップで選択/解除 (結果表示後のみ)
    quiz.tapCab = function () {
      if (!(QUESTIONS[current].extra === 'cab' && solved && !$('result').hidden)) return;
      var idx = selected.indexOf('cab'), btn = $('code-btn');
      if (idx >= 0) {
        selected.splice(idx, 1);
        btn.classList.remove('picked');
        var old = $('tray').querySelector('[data-id="cab"]');
        if (old) old.remove();
      } else {
        selected.push('cab');
        btn.classList.add('picked');
        var img = document.createElement('img');
        img.className = 'tray-icon';
        img.src = 'images/icon-cab.png';
        img.alt = '';
        img.dataset.id = 'cab';
        $('tray').appendChild(img);
      }
    };

    function check() {
      if (solved) return;
      var v = normalize(input.value);
      var answers = QUESTIONS[current].answers;
      for (var i = 0; i < answers.length; i++) {
        if (v === normalize(answers[i])) {
          solved = true;
          input.value = answers[i];
          input.readOnly = true;
          input.blur();
          $('q-send').disabled = true;
          $('q-status').hidden = false;
          var token = ++analyzing;
          setTimeout(function () {
            if (token !== analyzing) return;
            $('result').hidden = false;
            $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, ANALYZE_MS);
          return;
        }
      }
    }

    renderItems();

    // 送信ボタン (またはEnter) で判定。不正解は無反応
    form.addEventListener('submit', function (e) { e.preventDefault(); check(); });

    // アイテムの選択/解除。選択中のものは下のトレイにアイコン表示
    $('items').addEventListener('click', function (e) {
      var btn = e.target.closest('.item');
      if (!btn) return;
      var id = btn.dataset.id, idx = selected.indexOf(id);
      if (idx >= 0) {
        selected.splice(idx, 1);
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
        var old = $('tray').querySelector('[data-id="' + id + '"]');
        if (old) old.remove();
      } else {
        selected.push(id);
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');
        var img = document.createElement('img');
        img.className = 'tray-icon';
        img.src = btn.dataset.icon;
        img.alt = '';
        img.dataset.id = id;
        $('tray').appendChild(img);
      }
    });

    // 「仲間」を長押し → 次のQuestionへ (正解でなければ「間違い」)
    var peerHold = null, peerEl = $('tap-target');
    function cancelPeer() { clearTimeout(peerHold); peerHold = null; }
    peerEl.addEventListener('pointerdown', function () {
      if (!solved) return;
      cancelPeer();
      peerHold = setTimeout(function () {
        peerHold = null;
        if (!isCorrect()) { flashWrong(); return; }
        recordCurrent();
        if (QUESTIONS[current].endPractice) showEndPractice();
        else if (current < QUESTIONS.length - 1) nextQuestion();
        else showAllDone();
      }, PEER_HOLD_MS);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) {
      peerEl.addEventListener(t, cancelPeer);
    });
    peerEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    function recordCurrent() {
      records.push({ qi: current, answer: input.value, selected: selected.slice() });
    }

    // 最後のQuestionのあと: 何もない画面の中央にメッセージ
    function showAllDone() {
      var m = document.querySelector('.cab-main');
      m.classList.add('complete');
      m.scrollTop = 0;
    }

    // 練習問題のあと: 「練習を終える」だけを表示し、長押しで次へ
    function showEndPractice() {
      var rb = $('record-btn');           // 「練習を終える」画面が出たら「これまでの記録を見る」を解禁
      rb.classList.remove('locked');
      rb.removeAttribute('aria-hidden');
      rb.removeAttribute('tabindex');
      document.querySelector('.cab-main').classList.add('ending');
      document.querySelector('.cab-main').scrollTop = 0;
    }

    var holdTimer = null, endBtn = $('end-btn');
    endBtn.style.setProperty('--hold', (LONGPRESS_MS / 1000) + 's');
    function cancelHold() {
      clearTimeout(holdTimer);
      holdTimer = null;
      endBtn.classList.remove('holding');
    }
    endBtn.addEventListener('pointerdown', function () {
      cancelHold();
      endBtn.classList.add('holding');
      holdTimer = setTimeout(function () {
        cancelHold();
        document.querySelector('.cab-main').classList.remove('ending');
        nextQuestion();
      }, LONGPRESS_MS);
    });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (t) {
      endBtn.addEventListener(t, cancelHold);
    });
    endBtn.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    // 選択が正解 (順不同・過不足なし) か。correct未設定の問題は常に正解扱い
    function isCorrect() {
      var c = QUESTIONS[current].correct;
      if (!c) return true;
      return c.length === selected.length && c.every(function (id) { return selected.indexOf(id) >= 0; });
    }
    var wrongTimer = null;
    function flashWrong() {
      var el = $('wrong');
      el.classList.add('show');
      clearTimeout(wrongTimer);
      wrongTimer = setTimeout(function () { el.classList.remove('show'); }, WRONG_MS);
    }

    function nextQuestion() {
      current++;
      solved = false;
      analyzing++;
      resetSelection();
      $('q-text').textContent = QUESTIONS[current].text;
      $('q-status').hidden = true;
      $('result').hidden = true;
      input.value = '';
      input.readOnly = false;
      $('q-send').disabled = false;
      document.querySelector('.cab-main').scrollTop = 0;
      input.focus();
    }
  }

  // 長押しで開く (閉じても入力・選択状態はそのまま残る) / タップはQ3の選択用
  onHold($('code-btn'), BTN_HOLD_MS, function () {
    $('cab-page').hidden = false;
    if (!$('q-input').readOnly) $('q-input').focus();
  }, function () { quiz.tapCab(); });
  $('cab-close').addEventListener('click', function () {
    if (document.activeElement) document.activeElement.blur();
    $('cab-page').hidden = true;
  });
  setupQuiz();

  /* ---- Android: 「戻る」操作を無効化 ---- */
  // 履歴を1つ積んでおき、戻る(popstate)が来るたびに積み直す。
  // Chromeはユーザー操作なしで積んだ履歴を飛ばすため、最初のタッチでも積む。
  function trapBack() { try { history.pushState({ trap: 1 }, '', location.href); } catch (e) {} }
  trapBack();
  window.addEventListener('popstate', trapBack);
  document.addEventListener('pointerdown', function once() {
    trapBack();
    document.removeEventListener('pointerdown', once);
  });

  /* ---- スタッフ用: 画面の右上を5秒長押しでリロード (進行状況もリセット) ---- */
  // どの画面の上でも有効。見えない専用エリアは置かず、座標だけで判定するので
  // 右上にある「✕」ボタンなどの通常のタップは邪魔しない。
  var reloadTimer = null, RELOAD_AREA = 140;   // 右上 140px 四方
  function inReloadArea(e) { return e.clientX >= window.innerWidth - RELOAD_AREA && e.clientY <= RELOAD_AREA; }
  function cancelReload() { clearTimeout(reloadTimer); reloadTimer = null; }
  document.addEventListener('pointerdown', function (e) {
    cancelReload();
    if (!inReloadArea(e)) return;
    reloadTimer = setTimeout(function () { location.reload(); }, RELOAD_HOLD_MS);
  }, true);
  document.addEventListener('pointermove', function (e) { if (reloadTimer && !inReloadArea(e)) cancelReload(); }, true);
  ['pointerup', 'pointercancel'].forEach(function (t) { document.addEventListener(t, cancelReload, true); });

  /* ---- ピンチズーム防止 (iOS) ---- */
  ['gesturestart', 'gesturechange'].forEach(function (t) {
    document.addEventListener(t, function (e) { e.preventDefault(); });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
