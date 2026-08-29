#!/usr/bin/env python3
"""
確認用の1ファイルHTMLを生成します。

  python3 tools/build-preview.py [入力HTML] [出力HTML]

既定では、このスクリプトの1つ上の階層にある index.html を読み、
CSS・JS・画像をすべて埋め込んだ preview.html を出力します。
サーバー不要・ネット接続なしでも、ダブルクリックだけで開けます。
（本番用は index.html + assets/ のセットを使ってください）

パスは HTML 内の記述から自動で見つけるので、
assets/ の構成が案件ごとに違っても動きます。
"""
import base64
import pathlib
import re
import sys

MIME = {
    ".svg": "image/svg+xml",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".avif": "image/avif",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".mp4": "video/mp4",
}


def data_uri(path: pathlib.Path) -> str:
    b64 = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{MIME[path.suffix.lower()]};base64,{b64}"


def is_local(url: str) -> bool:
    """外部URL・data URI 以外（＝同梱ファイル）なら True"""
    return not re.match(r"^(https?:)?//|^data:|^#|^mailto:|^tel:", url)


def main() -> None:
    root = pathlib.Path(__file__).resolve().parent.parent
    src = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "index.html"
    out = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else root / "preview.html"
    base = src.resolve().parent

    html = src.read_text(encoding="utf-8")

    # CSS を <style> として埋め込む
    def inline_css(m: re.Match) -> str:
        href = m.group("href")
        if not is_local(href):
            return m.group(0)
        path = base / href
        if not path.exists():
            print(f"  スキップ（見つかりません）: {href}")
            return m.group(0)
        return "<style>\n" + path.read_text(encoding="utf-8") + "\n</style>"

    html = re.sub(
        r'<link\b[^>]*\brel=["\']stylesheet["\'][^>]*\bhref=["\'](?P<href>[^"\']+)["\'][^>]*>',
        inline_css,
        html,
    )

    # JS を <script> として埋め込む
    def inline_js(m: re.Match) -> str:
        src_attr = m.group("src")
        if not is_local(src_attr):
            return m.group(0)
        path = base / src_attr
        if not path.exists():
            print(f"  スキップ（見つかりません）: {src_attr}")
            return m.group(0)
        return "<script>\n" + path.read_text(encoding="utf-8") + "\n</script>"

    html = re.sub(
        r'<script\b[^>]*\bsrc=["\'](?P<src>[^"\']+)["\'][^>]*>\s*</script>',
        inline_js,
        html,
    )

    # 画像・フォント・動画を data URI に置き換える
    # （href/src/url() のどこに書かれていても拾えるよう、パス文字列を直接置換する）
    assets = sorted(p for p in base.rglob("*") if p.is_file() and p.suffix.lower() in MIME)
    for path in assets:
        rel = path.relative_to(base).as_posix()
        if rel in html:
            html = html.replace(rel, data_uri(path))

    out.write_text(html, encoding="utf-8")

    remaining = re.findall(r'(?:src|href)=["\'](?!https?:|//|data:|#|mailto:|tel:)([^"\']+)["\']', html)
    if remaining:
        print("  外部ファイル参照が残っています:", ", ".join(sorted(set(remaining))[:8]))

    print(f"生成しました: {out}  ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
