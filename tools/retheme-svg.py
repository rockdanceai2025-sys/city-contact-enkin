#!/usr/bin/env python3
"""
図版（SVG）を DESIGN_6（graphite ink on warm paper）のアクロマティック配色へ変換します。

  python3 tools/retheme-svg.py

- すべての色を「知覚輝度（luminance）そのままのグレー」に置き換えます。
  → 図の明暗構造はそのまま保たれ、色相だけが消えます。
- カラコンのレンズ色（色そのものが情報）は対象外です（KEEP_COLORS）。
- 影（feDropShadow）の適用を外します。DESIGN_6 は「影ではなく1pxの罫線で立体を表す」ため。
- 図版内のフォント指定も、Webフォントを読まないシステムフォントスタックへ変更します。

対象ファイルを書き換えるので、実行後は `python3 tools/build-preview.py` も走らせてください。
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / "assets/img"

# 色そのものが情報になっている値は変換しない（遠近両用カラコンの4色）
KEEP_COLORS = {
    "#9A6A3E", "#6B4526",  # ブラウン
    "#9A9A64", "#5F5E35",  # オリーブ
    "#B0A49A", "#7B6F66",  # グレージュ
    "#4A5058", "#20242A",  # ブラック
}

INK = 0x0D  # --color-graphite-ink 相当。これより暗いグレーは作らない

SYSTEM_FONT = (
    "system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',"
    "'Hiragino Sans','Hiragino Kaku Gothic ProN','Yu Gothic','Meiryo',sans-serif"
)

HEX = re.compile(r"#([0-9a-fA-F]{6})\b")
FONT_FAMILY = re.compile(r'font-family="[^"]*"')
SHADOW_ATTR = re.compile(r'\s*filter="url\(#[^")]*[Ss]hadow[^")]*\)"')


def to_gray(match: re.Match) -> str:
    original = "#" + match.group(1).upper()
    if original in KEEP_COLORS:
        return match.group(0)
    r, g, b = (int(match.group(1)[i:i + 2], 16) for i in (0, 2, 4))
    # sRGB の知覚輝度（Rec.709）。白は白のまま、黒は Graphite Ink まで
    lum = round(0.2126 * r + 0.7152 * g + 0.0722 * b)
    lum = max(INK, min(255, lum))
    return f"#{lum:02X}{lum:02X}{lum:02X}"


def main() -> None:
    for svg in sorted(IMG.glob("*.svg")):
        src = svg.read_text(encoding="utf-8")
        out = HEX.sub(to_gray, src)
        out = FONT_FAMILY.sub(f'font-family="{SYSTEM_FONT}"', out)
        out = SHADOW_ATTR.sub("", out)
        if out != src:
            svg.write_text(out, encoding="utf-8")
            print(f"変換しました: {svg.relative_to(ROOT)}")
        else:
            print(f"変更なし　　: {svg.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
