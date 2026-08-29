# ブラウザ検証の手順

目視のレビューだけでは見つからない不具合が必ず残る。実際にブラウザで開いて確かめる。

## 環境

Chromium は `/opt/pw-browsers/` に入っている。Playwright はスクラッチパッドに入れる。
バージョンが合わずに起動できないことがあるので、**実行ファイルのパスを明示**する。

```bash
ls /opt/pw-browsers/            # chromium-XXXX のバージョン番号を確認
cd <scratchpad> && npm init -y >/dev/null 2>&1 && npm i playwright >/dev/null 2>&1
```

```js
const b = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-<バージョン>/chrome-linux/chrome'
});
```

`playwright install` は実行しないこと（ダウンロードが走って失敗する）。

Google Fonts は取得できない環境があり、コンソールに `ERR_CONNECTION_RESET` が出る。
これは**無視してよい**（フォールバックフォントで表示される）。

## 1. 3つの画面幅でスクリーンショットを撮る

`file://` で開けば十分。フェードインは待たずに、クラスを直接付けて全要素を可視化する。

```js
await p.evaluate(() => document.querySelectorAll('.js-fade').forEach(e => e.classList.add('is-visible')));
```

- PC 1280×900
- タブレット 900×900
- スマホ 390×844（`isMobile: true, hasTouch: true, deviceScaleFactor: 2`）

ページが長いときは全画面1枚だと細部が潰れるので、
1000pxずつスクロールしながら**分割して撮る**と読み取りやすい。

## 2. 横スクロールを数値で確認する

見た目では気づきにくい。必ず数値で見る。

```js
await p.evaluate(() => {
  const d = document.documentElement;
  return { scroll: d.scrollWidth, client: d.clientWidth };
});
```

`scrollWidth > clientWidth + 1` なら、はみ出している要素がある。
テーブル・図・コードブロックは `overflow-x: auto` の入れ物に入れる。

## 3. 画像が読めているか

パス切れは見た目が空白になるだけで、エラーも出ないことがある。

```js
await p.$$eval('img', el => el.map(i => i.naturalWidth));   // 0 があれば失敗
```

**表示幅と元画像の幅を比べて、拡大率も見る。** 1.5倍を超えるとにじむ。

```js
const img = document.querySelector('.hero img');
img.getBoundingClientRect().width / img.naturalWidth;
```

## 4. フォームの動作

```js
await p.click('.submit');                       // 未入力 → ブラウザ検証で止まるか
await p.fill('#name', 'テスト'); /* ... */
await p.click('.submit');                       // 入力後 → 想定どおりの挙動か
```

送信先が未設定のあいだは、送信ボタンを押したときに案内を出す実装にしておくと、
クライアントに見せたときに「壊れている」と誤解されない。

## 5. JSエラー

```js
p.on('pageerror', e => console.log('pageerror:', e.message));
p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
```

## 6. パスワード付き確認ページの検証

`fetch('site.bin')` は `file://` では CORS で失敗する。**HTTPサーバー経由で確認する。**

```bash
cd <公開用ファイルのフォルダ> && nohup python3 -m http.server 8899 >/dev/null 2>&1 &
sleep 2
```

確認する項目：

- 誤ったパスワード → 「パスワードが違います。」が出て、ページは表示されない
- 正しいパスワード → LPが表示され、画像も読めている（`naturalWidth` が 0 でない）
- 同じタブで開き直す → パスワード入力なしで自動的に表示される
- スマホ幅でも入力画面が崩れない

サーバーの停止に `pkill` を使うと、シェルごと落ちて以降のコマンドが失敗することがある。
停止は単独のコマンドで実行し、続きは別のコマンドに分けること。

## よく出る不具合

過去に実際に見つかったもの。同じパターンを疑うとよい。

| 症状 | 原因 |
| --- | --- |
| アイコンが巨大化してレイアウトを突き破る | インラインSVG（`<use>`）に width/height の指定漏れ |
| 見出しが見えない | 濃色背景のセクションで、文字色が既定の濃色のまま |
| スマホ専用の要素がPCにも出る | `.u-sp-only { display:none }` が、後続の `.btn { display:inline-flex }` に負けている |
| CTAがファーストビューから押し出される | 列幅を変えた結果、ボタンが折り返して縦に伸びた |
| カードの下線の位置が揃わない | 見出しの行数がカードごとに違う（`min-height` で揃える） |
