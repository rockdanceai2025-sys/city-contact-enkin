#!/usr/bin/env python3
"""
確認用の1ファイルHTMLを生成します。

  python3 tools/build-preview.py

index.html のCSS・JS・画像（SVG）をすべて埋め込んだ preview.html を出力します。
サーバー不要・ネット接続なしでも、ダブルクリックだけでページを確認できます。
（本番用は index.html + assets/ のセットをご利用ください）
"""
import base64
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent


def data_uri(path: pathlib.Path) -> str:
    b64 = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:image/svg+xml;base64,{b64}"


def main() -> None:
    html = (ROOT / "index.html").read_text(encoding="utf-8")

    # CSS を埋め込む
    css = (ROOT / "assets/css/style.css").read_text(encoding="utf-8")
    html = html.replace(
        '<link rel="stylesheet" href="assets/css/style.css">',
        f"<style>\n{css}\n</style>",
    )

    # JS を埋め込む
    js = (ROOT / "assets/js/main.js").read_text(encoding="utf-8")
    html = html.replace(
        '<script src="assets/js/main.js" defer></script>',
        f"<script>\n{js}\n</script>",
    )

    # 画像（SVG）を data URI に置き換える
    for svg in sorted((ROOT / "assets/img").glob("*.svg")):
        html = html.replace(f"assets/img/{svg.name}", data_uri(svg))

    out = ROOT / "preview.html"
    out.write_text(html, encoding="utf-8")
    print(f"生成しました: {out}  ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
