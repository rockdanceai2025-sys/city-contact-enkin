/**
 * シティコンタクト｜遠近両用コンタクト特集ページ
 * - 見え方シミュレーター
 * - ラインナップのタブ切り替え
 * - FAQアコーディオン
 * - スクロールでのフェードイン
 * 依存ライブラリなし（バニラJS）
 */
(function () {
  'use strict';

  /* ---------------------------------------------
     1. 見え方シミュレーター
     --------------------------------------------- */
  var simSwitch = document.getElementById('simSwitch');
  var simStage = document.getElementById('simStage');

  if (simSwitch && simStage) {
    simSwitch.addEventListener('click', function () {
      var isBifocal = simSwitch.getAttribute('aria-pressed') === 'true';
      simSwitch.setAttribute('aria-pressed', String(!isBifocal));
      // aria-pressed = true → 遠近両用（ぼやけなし）
      simStage.classList.toggle('is-blurred', isBifocal);
    });
  }

  /* ---------------------------------------------
     2. ラインナップのタブ
     --------------------------------------------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.p-lineup__tab'));

  function activateTab(tab) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      var panel = document.getElementById(t.getAttribute('aria-controls'));
      if (panel) { panel.hidden = !selected; }
    });
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener('click', function () { activateTab(tab); });
    // 左右キーでの移動（キーボード操作対応）
    tab.addEventListener('keydown', function (e) {
      var next = null;
      if (e.key === 'ArrowRight') { next = tabs[(index + 1) % tabs.length]; }
      if (e.key === 'ArrowLeft') { next = tabs[(index - 1 + tabs.length) % tabs.length]; }
      if (next) {
        e.preventDefault();
        activateTab(next);
        next.focus();
      }
    });
  });

  /* ---------------------------------------------
     3. FAQアコーディオン
     --------------------------------------------- */
  Array.prototype.forEach.call(document.querySelectorAll('.p-faq__q'), function (q) {
    var answer = q.nextElementSibling;
    if (!answer) { return; }

    q.addEventListener('click', function () {
      var isOpen = q.getAttribute('aria-expanded') === 'true';
      q.setAttribute('aria-expanded', String(!isOpen));
      answer.classList.toggle('is-open', !isOpen);
    });
  });

  /* ---------------------------------------------
     4. スクロールでのフェードイン
     --------------------------------------------- */
  var targets = document.querySelectorAll('.js-fade');

  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-visible'); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

  Array.prototype.forEach.call(targets, function (el) { observer.observe(el); });
})();
