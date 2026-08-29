#!/usr/bin/env python3
"""
design6（グラファイト・トンマナ）用の画像アセットを生成します。

  python3 tools/make-mono-assets.py

assets/img/ のSVGに含まれる色を「見た目の明るさ（相対輝度）を保ったまま」
グレーへ変換し、design6/assets/img/ へ書き出します。
DESIGN_6 は無彩色を原則とするため、UIと図版から色相を取り除いています。

※ 例外（そのままコピー）
   - color-lens.svg : カラーレンズの色そのものが情報なので原色を維持
   - kv-photo.jpg   : 写真は CSS の filter で白黒表示（元データは保持）
"""
import pathlib
import re
import shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/img"
DST = ROOT / "design6/assets/img"

# 無彩色化するSVG
MONO = ["clinic.svg", "focus-range.svg", "mechanism.svg", "ogp.svg", "favicon.svg"]
# 色を保ったままコピーするファイル
ASIS = ["color-lens.svg", "kv-photo.jpg"]

HEX = re.compile(r"#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b")


def _to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _to_srgb(c: float) -> float:
    return c * 12.92 if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def to_gray(match: re.Match) -> str:
    h = match.group(1)
    if len(h) == 3:
        h = "".join(ch * 2 for ch in h)
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    # 相対輝度（BT.709）で計算すると、色ごとの「濃さの差」が保たれます
    y = 0.2126 * _to_linear(r) + 0.7152 * _to_linear(g) + 0.0722 * _to_linear(b)
    v = round(_to_srgb(y) * 255)
    return "#{0:02X}{0:02X}{0:02X}".format(max(0, min(255, v)))


def main() -> None:
    DST.mkdir(parents=True, exist_ok=True)
    for name in MONO:
        svg = (SRC / name).read_text(encoding="utf-8")
        (DST / name).write_text(HEX.sub(to_gray, svg), encoding="utf-8")
        print(f"無彩色化: {name}")
    for name in ASIS:
        shutil.copyfile(SRC / name, DST / name)
        print(f"コピー　: {name}")


if __name__ == "__main__":
    main()
