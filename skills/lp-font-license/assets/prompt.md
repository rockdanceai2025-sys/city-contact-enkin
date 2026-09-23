# そのまま貼れる指示プロンプト

スキルが読み込まれない環境でも効くよう、単体で完結させてある。
制作の**最初**に貼る。あとから貼ると、フォント差し替えでレイアウトを組み直すことになる。

---

## 制作開始時に貼るプロンプト

```
【フォントとロゴのライセンス指示｜必ず守ること】

■ 大前提
Monotype社のフォントを一切使わないでください。同社はWebサイトを巡回して使用状況を
調べ、高額なライセンス料を請求します。「知らずに使っていた」は通用しません。

■ ロゴ
ロゴは支給されたJPEG/PNG画像をそのまま流用してください。
・フォントで組み直さない
・文字をアウトライン化してSVGに埋め込まない（アウトライン化はフォントの派生物です）
・ロゴ画像が無い場合は、文字を使わない図形だけのマークにするか、必ず私に確認してください

■ 使ってよいフォント（SIL Open Font License）
Noto Sans JP / Noto Serif JP / M PLUS 1p / M PLUS Rounded 1c /
Zen Kaku Gothic / Zen Maru Gothic / Zen Old Mincho / Shippori Mincho /
IBM Plex Sans JP / BIZ UDPGothic / BIZ UDPMincho
→ Google Fonts から読み込んでください。

■ CSSの書き方
:root {
  --font: "Noto Sans JP", sans-serif;
  --font-serif: "Noto Serif JP", serif;
}
フォールバックは総称（sans-serif / serif）だけにしてください。
"Hiragino Sans" "Yu Gothic" "Meiryo" などOSのフォント名は並べないでください。

■ 必ず入れる2行（これが無いと事故ります）
html { font-family: var(--font); }
input, select, textarea, button { font-family: inherit; }
※ CSSで指定しないと、ブラウザ標準で html は Times New Roman、
   フォーム部品は Arial になります。どちらもMonotypeです。
   body に指定するだけでは html が残ります。

■ 絶対に使わないフォント（Monotype系）
・Monotype本体 … Arial / Times New Roman / Gill Sans / Rockwell / Baskerville / Perpetua
・Linotype由来 … Helvetica / Univers / Frutiger / Optima / Palatino / Avenir / DIN Next
・ITC由来 … ITCで始まるもの全般 / Avant Garde / Franklin Gothic / Lubalin / Officina
・フォントワークス（2021年にMonotypeが買収）
  … 筑紫書体シリーズ（筑紫ゴシック・筑紫明朝・筑紫A丸ゴシック・筑紫B丸ゴシック等）/
    ロダン / マティス / スーラ / セザンヌ / グレコ / クレー / 丸フォーク / ハミング

※ AvenirはmacOSに、筑紫A丸ゴシック・筑紫B丸ゴシックはmacOSとCanvaに
  標準で入っています。意識せず使ってしまいやすいので特に注意してください。

■ SVGの中も同じ
OGP画像や図版のSVGに <text> を入れるとき、font-family は上記のOFLフォントにしてください。
装飾ラベル（BEFORE/AFTER等）に Helvetica, Arial と書かないでください。
テキストはアウトライン化せず、<text> のまま残してください。

■ Canva・Illustrator・Figmaからの素材
必ず PNG または JPG（ラスター画像）で書き出したものを使ってください。
SVGやPDFで書き出すと、フォント名やアウトラインが配信物に残ります。
SVGで渡された場合は、中身に font-family や埋め込みフォントが無いか開いて確認してください。

■ 納品前チェック
作業が終わったら、次を報告してください。
1. CSSとSVGで指定している font-family の一覧
2. @font-face の有無、フォントファイル（.woff/.ttf/.otf）を同梱していないか
3. 外部から読み込んでいるフォントの配信元
4. ブラウザで開いたときの計算値に Times New Roman / Arial が出ていないか
   （デベロッパーツール → Elements → Computed の一番下 Rendered Fonts）
```

---

## 既存の制作物を点検するときのプロンプト

```
このサイトのフォントライセンスを点検してください。Monotype社のフォント
（Arial / Times New Roman / Helvetica / Avenir / Frutiger / Univers / Optima /
Palatino / Gill Sans / ITC系、および フォントワークスの筑紫書体・ロダン・
マティス・スーラ・セザンヌ等）が使われていないか確認したいです。

次を調べて報告してください。
1. CSS・HTML・SVG の font-family の指定値をすべて洗い出す
   ※ 本文中の語（例：地名の「筑紫野市」）は対象外です。font-familyの値だけ見てください
2. @font-face の有無と、配信しているフォントファイル（.woff/.ttf/.otf/.eot）
3. 外部フォントの取得先
4. 画像のメタデータに「Canva」「筑紫」等の痕跡が残っていないか
5. ブラウザで開いたときの font-family の計算値
   （CSSに書いていなくても、html は Times New Roman、フォーム部品は Arial になります）

問題が見つかったら、SIL OFL のフォント（Noto Sans JP / Noto Serif JP 等）に
差し替えてください。ロゴは画像のまま流用し、フォントで組み直さないでください。
```

---

## 書体を指定されたときの返し方

クライアントや制作側から特定の書体を希望されたら、その場で決めず、
`references/monotype-brands.md` の照合表と代替案を見て判断する。

代替を提案するときは、**必ず実際に組んで見せる。** 字面の印象が違うと後で揉める。
