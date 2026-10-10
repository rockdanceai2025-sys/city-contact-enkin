#!/usr/bin/env python3
"""
エックスサーバーへアップロードする一式を作ります。

  python3 tools/build-xserver.py

出力先：dist-xserver/
  index.html   … フォームの送信先を form.php に設定したもの
  assets/      … CSS・JS・画像
  form.php     … フォームを受け取ってメールを送るプログラム
  .htaccess    … http を https へ転送する設定

この中身を、エックスサーバーの public_html に丸ごと置いてください。
"""
import pathlib
import re
import shutil

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'dist-xserver'

if OUT.exists():
    shutil.rmtree(OUT)
OUT.mkdir()

# index.html … フォームの送信先を form.php に向ける
html = (ROOT / 'index.html').read_text(encoding='utf-8')
before = html
html = html.replace('action="#" method="post"', 'action="form.php" method="post"')
if html == before:
    raise SystemExit('index.html の form の action を書き換えられませんでした。構造が変わっていないか確認してください。')

# 確認用の noindex は本番では外す
html = re.sub(r'<!-- =+\s*\n\s*▼▼▼[^\n]*\n(?:[^\n]*\n)*?\s*=+ -->\n', '', html)
html = html.replace('<meta name="robots" content="noindex, nofollow">\n', '')
html = html.replace('<!-- ▲▲▲ 本番公開前に、上の1行を削除 ▲▲▲ -->\n', '')

(OUT / 'index.html').write_text(html, encoding='utf-8')
shutil.copytree(ROOT / 'assets', OUT / 'assets')
shutil.copy(ROOT / 'server' / 'form.php', OUT / 'form.php')
shutil.copy(ROOT / 'server' / '.htaccess', OUT / '.htaccess')

total = sum(f.stat().st_size for f in OUT.rglob('*') if f.is_file())
count = sum(1 for f in OUT.rglob('*') if f.is_file())
print(f'生成しました: {OUT}')
print(f'  {count} ファイル / 合計 {total / 1024:.0f} KB')
print('  noindex を削除し、フォームの送信先を form.php に設定しました。')
