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
  /* 送信先の決め方
       1. form の action が設定されていれば、それを使って通常どおり送信する
       2. 未設定なら、data-mailto のアドレス宛にメールを作成する
          （入力内容を件名・本文に差し込んだ状態でメールソフトが開く）
     本番でフォームシステムへ接続したら、action を設定するだけで 1 に切り替わります。 */
  var form = document.getElementById('js-form');
  if (!form) return;

  function label(name, fallback) {
    var el = form.querySelector('[name="' + name + '"]');
    if (!el) return fallback;
    var wrap = el.closest('.p-form__row');
    var lb = wrap && wrap.querySelector('.p-form__label');
    if (!lb) return fallback;
    // 「必須」「任意」のバッジを除いたラベル文字列を取り出す
    return lb.textContent.replace(/必須|任意/g, '').trim() || fallback;
  }

  function value(name) {
    var el = form.querySelector('[name="' + name + '"]');
    if (!el) return '';
    if (el.type === 'radio') {
      var checked = form.querySelector('[name="' + name + '"]:checked');
      return checked ? checked.value : '';
    }
    return el.value.trim();
  }

  function buildMail(address) {
    var fields = ['name', 'tel', 'email', 'address', 'room', 'attend', 'message'];
    var lines = fields.map(function (f) {
      return label(f, f) + '：' + (value(f) || '（未記入）');
    });
    var subject = '【無料お見積もりのご依頼】' + (value('name') || 'お問い合わせ');
    var body =
      '片づけ処 つむぎ 御中\n\n' +
      'ホームページのフォームよりお見積もりを依頼します。\n\n' +
      '────────────────\n' +
      lines.join('\n') + '\n' +
      '────────────────\n';
    return 'mailto:' + address +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
  }

  function notice(text) {
    var el = document.getElementById('js-form-notice');
    if (!el) {
      el = document.createElement('p');
      el.id = 'js-form-notice';
      el.setAttribute('role', 'status');
      el.style.cssText =
        'margin-top:14px;padding:16px 18px;border-radius:12px;background:#fbf1e4;' +
        'border:1.5px solid #e0a869;color:#9a6234;font-size:15px;line-height:1.9;text-align:center;';
      form.appendChild(el);
    }
    el.innerHTML = text;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  }

  form.addEventListener('submit', function (e) {
    var action = form.getAttribute('action');
    if (action && action !== '#' && action !== '') return; // 送信先が設定済み

    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var address = form.getAttribute('data-mailto');
    if (!address) {
      notice('こちらは表示確認用のページのため、まだ送信先が設定されていません。'
        + 'お急ぎの場合は、お電話（0120-373-880）にてご相談ください。');
      return;
    }

    // location.href への代入より、リンクのクリックのほうが確実に開く
    // （iOS Safari などで代入が無視されることがあるため）
    var link = document.createElement('a');
    link.href = buildMail(address);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    notice('メールソフトが開きます。内容をご確認のうえ送信してください。<br>'
      + '開かない場合は、お手数ですが <a href="mailto:' + address + '" style="color:inherit;text-decoration:underline;">'
      + address + '</a> 宛にお送りいただくか、'
      + 'お電話（<a href="tel:0120373880" style="color:inherit;text-decoration:underline;">0120-373-880</a>）にてご相談ください。');
  });
})();
