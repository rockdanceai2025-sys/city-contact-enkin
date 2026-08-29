/**
 * 確認用ページの暗号化データ（site.bin）を作ります。
 *
 *   node tools/build-encrypted.js <パスワード>
 *
 * preview.html（CSS・JS・画像を埋め込んだ1ファイル版）を暗号化し、
 * site.bin として出力します。index.html のパスワード入力画面が、
 * ブラウザの中でこれを復号して表示します。
 *
 * 形式（shunsainomegumi-preview と同じ）
 *   site.bin = [salt 16][iv 12][AES-256-GCM の暗号文 + 認証タグ]
 *   復号後   = [目次の長さ 4][目次JSON][ファイル本体...]
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ITERATIONS = 250000;
const ROOT = path.resolve(__dirname, '..');

const password = process.argv[2];
if (!password) {
  console.error('使い方: node tools/build-encrypted.js <パスワード>');
  process.exit(1);
}

// 暗号化するファイル（LPは1ファイル完結なので index.html のみ）
const entries = [
  { name: 'index.html', file: path.join(ROOT, 'preview.html'), mime: 'text/html' },
];

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

fs.writeFileSync(path.join(ROOT, 'site.bin'), out);
console.log(
  `生成しました: site.bin  (${(out.length / 1024).toFixed(0)} KB)\n` +
  `パスワード: ${password}`
);
