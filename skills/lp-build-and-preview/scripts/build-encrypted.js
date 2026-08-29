/**
 * パスワード付き確認ページ用の暗号化データ（site.bin）を作ります。
 *
 *   node tools/build-encrypted.js <パスワード> [入力HTML] [出力bin]
 *
 * 既定では、このスクリプトの1つ上の階層にある preview.html を暗号化し、
 * 同じ階層に site.bin を出力します。
 * パスワード入力画面（index.html）が、ブラウザの中でこれを復号して表示します。
 *
 * 形式
 *   site.bin = [salt 16][iv 12][AES-256-GCM の暗号文 + 認証タグ 16]
 *   復号後   = [目次の長さ 4][目次JSON][ファイル本体...]
 *
 * 目次JSON = [{ name, len, mime }, ...]
 * ブラウザ側は name が "index.html" のものを本体として表示します。
 * 動画など別ファイルも同梱したい場合は EXTRA に足してください
 * （その場合、表示側で Blob URL に差し替える処理も必要になります）。
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ITERATIONS = 250000;

const password = process.argv[2];
if (!password) {
  console.error('使い方: node tools/build-encrypted.js <パスワード> [入力HTML] [出力bin]');
  process.exit(1);
}

const ROOT = path.resolve(__dirname, '..');
const input = process.argv[3] ? path.resolve(process.argv[3]) : path.join(ROOT, 'preview.html');
const output = process.argv[4] ? path.resolve(process.argv[4]) : path.join(ROOT, 'site.bin');

if (!fs.existsSync(input)) {
  console.error(`入力が見つかりません: ${input}`);
  console.error('先に build-preview.py で preview.html を作ってください。');
  process.exit(1);
}

// 同梱するファイル。LPが1ファイル完結なら index.html だけでよい
const EXTRA = []; // 例: [{ name: 'movie.mp4', file: path.join(ROOT, 'assets/img/movie.mp4'), mime: 'video/mp4' }]
const entries = [{ name: 'index.html', file: input, mime: 'text/html' }, ...EXTRA];

const bodies = entries.map((e) => fs.readFileSync(e.file));
const manifest = Buffer.from(
  JSON.stringify(entries.map((e, i) => ({ name: e.name, len: bodies[i].length, mime: e.mime }))),
  'utf8'
);

const header = Buffer.alloc(4);
header.writeUInt32BE(manifest.length, 0);
const plain = Buffer.concat([header, manifest, ...bodies]);

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(Buffer.from(password, 'utf8'), salt, ITERATIONS, 32, 'sha256');

const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(plain), cipher.final()]);
// WebCrypto の AES-GCM は「暗号文＋認証タグ」が連結された形を期待する
const out = Buffer.concat([salt, iv, encrypted, cipher.getAuthTag()]);

fs.writeFileSync(output, out);
console.log(`生成しました: ${output}  (${(out.length / 1024).toFixed(0)} KB)`);
console.log(`パスワード: ${password}`);
