/* =========================================================
   遺品整理LP  スクリプト（ライブラリ不要）
   1. スクロールに応じたフェードイン
   2. フォーム送信のハンドリング（送信先が未設定のときの案内）
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 1. フェードイン ---------- */
  var targets = document.querySelectorAll('.js-fade');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(targets, function (el) { el.classList.add('is-visible'); });
  } else {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(targets, function (el) { observer.observe(el); });
  }

  /* ---------- 2. フォーム ---------- */
  /* 本番でフォームシステムへ接続したら（action を設定したら）、
     この処理は自動的に何もしなくなります。 */
  var form = document.getElementById('js-form');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    var action = form.getAttribute('action');
    var connected = action && action !== '#' && action !== '';

    if (connected) return; // 送信先が設定済みなら通常送信

    e.preventDefault();

    // 入力チェック（ブラウザ標準のメッセージを表示）
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var notice = document.getElementById('js-form-notice');
    if (!notice) {
      notice = document.createElement('p');
      notice.id = 'js-form-notice';
      notice.setAttribute('role', 'status');
      notice.style.cssText =
        'margin-top:14px;padding:16px 18px;border-radius:12px;background:#fbf1e4;' +
        'border:1.5px solid #e0a869;color:#9a6234;font-size:15px;line-height:1.9;text-align:center;';
      form.appendChild(notice);
    }
    notice.textContent =
      'こちらは表示確認用のページのため、まだ送信先が設定されていません。'
      + 'お急ぎの場合は、お電話（0120-000-000）にてご相談ください。';
    notice.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  });
})();
