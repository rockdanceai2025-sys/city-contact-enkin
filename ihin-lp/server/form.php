<?php
/**
 * 申し込みフォームの受け取りプログラム（エックスサーバー用）
 *
 * index.html と同じ場所に置いてください。
 * フォームの action="form.php" から送信された内容を、
 * 下の TO 宛にメールで送ります。送信者には自動返信も送ります。
 *
 * 設定を変えたいときは、この下の「設定」だけ書き換えてください。
 */

// ───────── 設定 ─────────
$TO        = 'tsumugi@tsumugi-lp.net';   // 受信するアドレス
$FROM      = 'tsumugi@tsumugi-lp.net';   // 送信元（必ず自分のドメインのアドレスにすること）
$SHOP      = '片づけ処 つむぎ';
$TEL       = '0120-373-880';
$HOURS     = '8:00〜20:00（土日祝も対応・年中無休）';
$AUTO_REPLY = true;                       // 送信者への自動返信を送るか
// ────────────────────────

mb_language('Japanese');
mb_internal_encoding('UTF-8');

/** ヘッダーへの改行混入（なりすまし送信）を防ぐ */
function clean_header($v) {
    return trim(str_replace(array("\r", "\n", "%0d", "%0a", "%0D", "%0A"), '', $v));
}

/** 本文用。改行は残すが、制御文字は落とす */
function clean_body($v) {
    $v = str_replace(array("\r\n", "\r"), "\n", $v);
    return trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v));
}

function show($title, $message, $isError = false) {
    global $TEL, $SHOP;
    $color = $isError ? '#b5372a' : '#23415f';
    http_response_code($isError ? 400 : 200);
    header('Content-Type: text/html; charset=UTF-8');
    echo '<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">'
       . '<meta name="viewport" content="width=device-width,initial-scale=1">'
       . '<meta name="robots" content="noindex,nofollow">'
       . '<title>' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '｜' . htmlspecialchars($SHOP, ENT_QUOTES, 'UTF-8') . '</title>'
       . '<link rel="preconnect" href="https://fonts.googleapis.com">'
       . '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
       . '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&family=Noto+Serif+JP:wght@600&display=swap" rel="stylesheet">'
       . '<style>'
       . 'html,body,input,button{font-family:"Noto Sans JP",sans-serif}'
       . 'body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;'
       . 'background:#fbf8f3;color:#3a3630;line-height:1.95;font-size:17px}'
       . '.card{width:100%;max-width:560px;background:#fff;border-radius:20px;padding:48px 36px;'
       . 'box-shadow:0 10px 36px rgba(35,65,95,.10);text-align:center}'
       . 'h1{font-family:"Noto Serif JP",serif;font-size:25px;font-weight:600;color:' . $color . ';margin:0 0 20px}'
       . 'p{margin:0 0 18px}'
       . '.tel{display:inline-block;background:#fbf1e4;border-radius:12px;padding:14px 22px;'
       . 'font-weight:700;color:#9a6234;margin-top:6px}'
       . '.tel a{color:inherit;text-decoration:none}'
       . 'a.back{display:inline-block;margin-top:26px;background:#23415f;color:#fff;'
       . 'text-decoration:none;font-weight:700;padding:15px 34px;border-radius:999px}'
       . '</style></head><body><div class="card">'
       . '<h1>' . htmlspecialchars($title, ENT_QUOTES, 'UTF-8') . '</h1>'
       . $message
       . '<p class="tel">お急ぎの方は　<a href="tel:' . preg_replace('/[^0-9]/', '', $TEL) . '">' . htmlspecialchars($TEL, ENT_QUOTES, 'UTF-8') . '</a></p>'
       . '<p><a class="back" href="./">トップページへ戻る</a></p>'
       . '</div></body></html>';
    exit;
}

// POST 以外で直接開かれたときはトップへ戻す
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ./');
    exit;
}

// 迷惑メール対策：人には見えない項目に入力があれば、送信せず完了画面だけ出す
if (!empty($_POST['website'])) {
    show('送信しました', '<p>お問い合わせありがとうございます。</p>');
}

$name    = clean_header(isset($_POST['name']) ? $_POST['name'] : '');
$tel     = clean_header(isset($_POST['tel']) ? $_POST['tel'] : '');
$email   = clean_header(isset($_POST['email']) ? $_POST['email'] : '');
$address = clean_body(isset($_POST['address']) ? $_POST['address'] : '');
$room    = clean_body(isset($_POST['room']) ? $_POST['room'] : '');
$attend  = clean_body(isset($_POST['attend']) ? $_POST['attend'] : '');
$message = clean_body(isset($_POST['message']) ? $_POST['message'] : '');

// 必須項目の確認
$errors = array();
if ($name === '')    { $errors[] = 'お名前'; }
if ($tel === '')     { $errors[] = '電話番号'; }
if ($email === '')   { $errors[] = 'メールアドレス'; }
if ($address === '') { $errors[] = '物件の所在地'; }
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    show('メールアドレスをご確認ください',
         '<p>メールアドレスの形式が正しくないようです。<br>'
       . 'お手数ですが、前のページに戻ってご確認ください。</p>', true);
}
if ($errors) {
    show('入力されていない項目があります',
         '<p>' . htmlspecialchars(implode('、', $errors), ENT_QUOTES, 'UTF-8') . ' が未入力です。<br>'
       . 'お手数ですが、前のページに戻ってご入力ください。</p>', true);
}

// ───────── 店舗側へ送るメール ─────────
$subject = '【お見積もり依頼】' . $name . ' 様';
$body =
    "ホームページの申し込みフォームから、お見積もりのご依頼がありました。\n\n"
  . "────────────────────\n"
  . "お名前　　　　：" . $name . "\n"
  . "電話番号　　　：" . $tel . "\n"
  . "メールアドレス：" . $email . "\n"
  . "物件の所在地　：" . $address . "\n"
  . "間取り　　　　：" . ($room !== '' ? $room : '（未記入）') . "\n"
  . "立ち会いの有無：" . ($attend !== '' ? $attend : '（未記入）') . "\n"
  . "ご相談内容　　：\n" . ($message !== '' ? $message : '（未記入）') . "\n"
  . "────────────────────\n\n"
  . "受信日時：" . date('Y年n月j日 H:i') . "\n"
  . "送信元IP：" . (isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '不明') . "\n";

$headers = "From: " . mb_encode_mimeheader($SHOP, 'UTF-8') . " <" . $FROM . ">\r\n"
         . "Reply-To: " . $email . "\r\n";

$sent = mb_send_mail($TO, $subject, $body, $headers);

if (!$sent) {
    show('送信できませんでした',
         '<p>申し訳ございません。送信時に問題が発生しました。<br>'
       . 'お手数ですが、お電話にてご相談ください。</p>', true);
}

// ───────── 送信者への自動返信 ─────────
if ($AUTO_REPLY) {
    $replySubject = '【' . $SHOP . '】お見積もりのご依頼を承りました';
    $replyBody =
        $name . " 様\n\n"
      . "この度は " . $SHOP . " へお問い合わせいただき、ありがとうございます。\n"
      . "下記の内容でご依頼を承りました。担当者より1営業日以内にご連絡いたします。\n\n"
      . "────────────────────\n"
      . "お名前　　　　：" . $name . "\n"
      . "電話番号　　　：" . $tel . "\n"
      . "物件の所在地　：" . $address . "\n"
      . "間取り　　　　：" . ($room !== '' ? $room : '（未記入）') . "\n"
      . "立ち会いの有無：" . ($attend !== '' ? $attend : '（未記入）') . "\n"
      . "ご相談内容　　：\n" . ($message !== '' ? $message : '（未記入）') . "\n"
      . "────────────────────\n\n"
      . "お急ぎの場合は、お電話にてご相談ください。\n"
      . "　" . $TEL . "　受付 " . $HOURS . "\n\n"
      . "※ このメールは自動送信です。ご返信いただいても問題ございません。\n\n"
      . $SHOP . "\n";
    $replyHeaders = "From: " . mb_encode_mimeheader($SHOP, 'UTF-8') . " <" . $FROM . ">\r\n";
    @mb_send_mail($email, $replySubject, $replyBody, $replyHeaders);
}

show('お申し込みを承りました',
     '<p>お問い合わせいただき、ありがとうございます。<br>'
   . '担当者より<strong>1営業日以内</strong>にご連絡いたします。</p>'
   . '<p>確認のメールをお送りしましたので、ご確認ください。<br>'
   . '届いていない場合は、迷惑メールフォルダもご確認ください。</p>');
