/**
 * シティコンタクト｜遠近両用レンズ ページ（デザイン案6）
 * - 見え方シミュレーター（手元のぼやけ ON / OFF）
 * - スクロールでのフェードイン
 * - 左レールの現在地ハイライト（スクロールスパイ）
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

  var fadeTargets = document.querySelectorAll('.js-fade');
  var navLinks = document.querySelectorAll('.l-rail__nav .c-navrow');

  if (!('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(fadeTargets, function (el) { el.classList.add('is-visible'); });
    return;
  }

  /* ---------------------------------------------
     2. スクロールでのフェードイン
     --------------------------------------------- */
  var fadeObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });

  Array.prototype.forEach.call(fadeTargets, function (el) { fadeObserver.observe(el); });

  /* ---------------------------------------------
     3. 左レールの現在地ハイライト
        （DESIGN_6：現在地は色ではなく、薄い背景の veil で示します）
     --------------------------------------------- */
  if (!navLinks.length) { return; }

  var sections = [];
  Array.prototype.forEach.call(navLinks, function (link) {
    var id = (link.getAttribute('href') || '').replace(/^#/, '');
    var section = id && document.getElementById(id);
    if (section) { sections.push({ link: link, section: section }); }
  });

  var visible = [];

  function highlight() {
    var current = null;
    sections.forEach(function (pair) {
      if (visible.indexOf(pair.section) !== -1 && !current) { current = pair.link; }
    });
    sections.forEach(function (pair) {
      pair.link.classList.toggle('is-current', pair.link === current);
      if (pair.link === current) {
        pair.link.setAttribute('aria-current', 'true');
      } else {
        pair.link.removeAttribute('aria-current');
      }
    });
  }

  var spyObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var i = visible.indexOf(entry.target);
      if (entry.isIntersecting && i === -1) { visible.push(entry.target); }
      if (!entry.isIntersecting && i !== -1) { visible.splice(i, 1); }
    });
    highlight();
  }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

  sections.forEach(function (pair) { spyObserver.observe(pair.section); });
})();
