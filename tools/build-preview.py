#!/usr/bin/env python3
"""
確認用の1ファイルHTMLを生成します。

  python3 tools/build-preview.py

各ページのCSS・JS・画像をすべて埋め込んだ1ファイル版を出力します。
サーバー不要・ネット接続なしでも、ダブルクリックだけでページを確認できます。
（本番用は index.html + assets/ のセットをご利用ください）

  preview.html          ← 現行案（ピンク）
  design6/preview.html  ← デザイン案6（グラファイト）
"""
import base64
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent


MIME = {".svg": "image/svg+xml", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png"}


def data_uri(path: pathlib.Path) -> str:
    b64 = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{MIME[path.suffix.lower()]};base64,{b64}"


def build(base: pathlib.Path) -> None:
    html = (base / "index.html").read_text(encoding="utf-8")

    # CSS を埋め込む
    css = (base / "assets/css/style.css").read_text(encoding="utf-8")
    html = html.replace(
        '<link rel="stylesheet" href="assets/css/style.css">',
        f"<style>\n{css}\n</style>",
    )

    # JS を埋め込む
    js = (base / "assets/js/main.js").read_text(encoding="utf-8")
    html = html.replace(
        '<script src="assets/js/main.js" defer></script>',
        f"<script>\n{js}\n</script>",
    )

    # 画像を data URI に置き換える
    for img in sorted((base / "assets/img").iterdir()):
        if img.suffix.lower() in MIME:
            html = html.replace(f"assets/img/{img.name}", data_uri(img))

    out = base / "preview.html"
    out.write_text(html, encoding="utf-8")
    print(f"生成しました: {out.relative_to(ROOT)}  ({out.stat().st_size / 1024:.0f} KB)")


def main() -> None:
    for base in (ROOT, ROOT / "design6"):
        build(base)


if __name__ == "__main__":
    main()
