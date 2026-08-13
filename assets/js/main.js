/**
 * シティコンタクト｜遠近両用レンズ ページ
 * - 見え方シミュレーター（手元のぼやけ ON / OFF）
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
      // aria-pressed = true → 遠近両用（手元もくっきり）
      simStage.classList.toggle('is-blurred', isBifocal);
    });
  }

  /* ---------------------------------------------
     2. スクロールでのフェードイン
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
