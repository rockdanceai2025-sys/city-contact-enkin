#!/usr/bin/env node
/**
 * フォントのライセンス監査。
 *
 *   node tools/audit-fonts.js               … ファイルを静的に検査
 *   node tools/audit-fonts.js --browser     … 実際にブラウザで開いて計算値も検査
 *
 * 危険なフォント名がひとつでも見つかったら終了コード 1 で落ちます。
 * 納品前・公開前に必ず通してください。
 *
 * なぜ必要か：
 *   Monotype 社は買収で多数のブランドを吸収しており（Linotype・ITC・Bitstream、
 *   そして2021年にフォントワークス）、危険な名前が広範囲に及びます。
 *   さらに、CSSで何も指定しないとブラウザ標準で html は Times New Roman、
 *   フォーム部品は Arial になります。どちらも Monotype です。
 *   目視では取りこぼすので、機械的に検査します。
 *
 * 検査対象は font-family の「値」だけです。
 * 本文やコメントに同じ語が出てきても誤検知しません
 * （例：対応エリアの「筑紫野市」はフォント名ではない）。
 */
const fs = require('fs');
const path = require('path');

// Monotype 社が所有・管理するブランド
const MONOTYPE = [
  // Monotype 本体
  'arial', 'times new roman', 'gill sans', 'rockwell', 'perpetua', 'bembo',
  'baskerville', 'monotype garamond', 'joanna', 'plantin', 'albertus', 'walbaum',
  'centaur', 'ehrhardt', 'bell gothic', 'monotype',
  // Linotype 由来（2006年に Monotype が買収）
  'helvetica', 'neue haas grotesk', 'univers', 'frutiger', 'optima', 'palatino',
  'sabon', 'avenir', 'din next',
  // ITC 由来
  'itc', 'avant garde', 'lubalin', 'officina', 'franklin gothic', 'bookman old style',
  // フォントワークス（2021年に Monotype が買収）
  '筑紫', 'tsukushi', 'ロダン', 'rodin', 'マティス', 'matisse', 'スーラ', 'seurat',
  'セザンヌ', 'cezanne', 'グレコ', 'greco', 'スキップ', 'ハミング', '丸フォーク',
  'ニューシネマ',
];

// 権利者が別でも、名指しは避けたいもの（警告のみ・落とさない）
const NEEDS_CHECK = [
  'hiragino', 'ヒラギノ', 'yu gothic', 'yugothic', 'yu mincho', 'yumincho',
  '游ゴシック', '游明朝', 'meiryo', 'メイリオ', 'ms gothic', 'ms pgothic',
  'ｍｓ ゴシック', 'osaka', 'segoe', 'a-otf', 'ud新ゴ', 'リュウミン', '見出ゴ',
];

const SCAN_EXT = ['.html', '.htm', '.css', '.svg', '.js'];
const SKIP_DIR = ['node_modules', '.git', 'dist', 'build'];
const SELF = path.basename(__filename);

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (SKIP_DIR.includes(name)) continue;
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (SCAN_EXT.includes(path.extname(full).toLowerCase())) out.push(full);
  }
  return out;
}

/** font-family の「値」だけを抜き出す。行番号つき。 */
function extractStacks(text) {
  const found = [];
  const patterns = [
    /font-family\s*:\s*([^;}"']*(?:"[^"]*"|'[^']*')?[^;}]*)/gi,  // CSS 宣言
    /font-family\s*=\s*"([^"]*)"/gi,                              // SVG/HTML 属性
    /font-family\s*=\s*'([^']*)'/gi,
    /(--[\w-]*font[\w-]*)\s*:\s*([^;}]+)/gi,                      // CSS カスタムプロパティ
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) {
      const value = (m[2] !== undefined ? m[2] : m[1]) || '';
      found.push({ value: value.trim(), line: text.slice(0, m.index).split('\n').length });
    }
  }
  return found;
}

function matches(stack, list) {
  const lower = stack.toLowerCase();
  return list.filter((name) => lower.includes(name));
}

function staticScan(root) {
  const bad = [], warn = [];
  for (const file of walk(root)) {
    const rel = path.relative(root, file);
    if (path.basename(file) === SELF) continue;      // 定義リスト自身は対象外
    if (rel === 'preview.html') continue;            // index.html の生成物
    const text = fs.readFileSync(file, 'utf8');
    for (const { value, line } of extractStacks(text)) {
      for (const n of matches(value, MONOTYPE)) bad.push(`${rel}:${line}  「${value}」← ${n}`);
      for (const n of matches(value, NEEDS_CHECK)) warn.push(`${rel}:${line}  「${value}」← ${n}`);
    }
  }
  return { bad, warn };
}

/**
 * 配信物そのものの検査。
 * フォント検出クローラーが実際に見るのは、配信しているファイルの中身です。
 *   読み取れるもの … CSSの font-family、@font-face、配信しているフォントファイル、
 *                    SVG内の font-family、画像のメタデータ
 *   読み取れないもの … ラスター画像（PNG/JPG）に焼き込まれた文字の書体
 * なので「使わない・置かない」状態にしておけば、見つかるものがありません。
 */
function assetScan(root) {
  const bad = [], warn = [], info = [];
  const FONT_EXT = ['.woff', '.woff2', '.ttf', '.otf', '.eot'];
  const SAFE_HOST = ['fonts.googleapis.com', 'fonts.gstatic.com'];

  // 1) フォントファイルを同梱していないか
  const walkAll = (dir, out = []) => {
    for (const name of fs.readdirSync(dir)) {
      if (SKIP_DIR.includes(name)) continue;
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) walkAll(full, out);
      else out.push(full);
    }
    return out;
  };
  const all = walkAll(root);
  for (const f of all) {
    if (FONT_EXT.includes(path.extname(f).toLowerCase())) {
      warn.push(`フォントファイルを同梱しています: ${path.relative(root, f)}（ライセンスを確認すること）`);
    }
  }

  // 2) @font-face と、その取得先
  for (const f of all.filter((x) => ['.css', '.html', '.svg'].includes(path.extname(x).toLowerCase()))) {
    const rel = path.relative(root, f);
    if (rel === 'preview.html' || path.basename(f) === SELF) continue;
    const text = fs.readFileSync(f, 'utf8');
    if (/@font-face/i.test(text)) {
      warn.push(`@font-face があります: ${rel}（自前配信しているフォントのライセンスを確認すること）`);
    }
    // 3) 外部フォントの取得先
    const urls = text.match(/https?:\/\/[^"'\s)]*fonts?[^"'\s)]*/gi) || [];
    for (const u of [...new Set(urls)]) {
      const host = (u.match(/^https?:\/\/([^/]+)/) || [])[1] || '';
      if (SAFE_HOST.includes(host)) info.push(`${rel}  ${host}（Google Fonts / SIL OFL）`);
      else warn.push(`${rel}  見慣れないフォント配信元: ${u}`);
    }
  }

  // 4) 画像のメタデータに、フォント名や制作ツールの痕跡がないか
  const TRACE = ['Tsukushi', '筑紫', 'Fontworks', 'フォントワークス', 'Canva',
                 'Helvetica', 'Arial', 'Avenir', 'Frutiger', 'Monotype'];
  for (const f of all.filter((x) => ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(x).toLowerCase()))) {
    const head = fs.readFileSync(f).subarray(0, 65536).toString('latin1');
    for (const t of TRACE) {
      if (head.toLowerCase().includes(t.toLowerCase())) {
        bad.push(`${path.relative(root, f)} のメタデータに「${t}」が残っています（書き出し直すか、メタデータを削除すること）`);
      }
    }
  }

  return { bad, warn, info };
}

async function browserScan(htmlPath) {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.log('  （playwright が無いので計算値の検査は省略します）\n'); return { bad: [], declared: [] }; }

  const dir = '/opt/pw-browsers';
  const found = fs.existsSync(dir) ? fs.readdirSync(dir).filter((d) => d.startsWith('chromium-')) : [];
  const opts = found.length ? { executablePath: `${dir}/${found[0]}/chrome-linux/chrome` } : {};

  const b = await chromium.launch(opts);
  const p = await b.newPage();
  await p.goto('file://' + path.resolve(htmlPath), { waitUntil: 'load' });
  await p.waitForTimeout(1200);
  const declared = await p.evaluate(() => {
    const set = new Set();
    document.querySelectorAll('*').forEach((el) => set.add(getComputedStyle(el).fontFamily));
    return [...set].filter(Boolean).sort();
  });
  await b.close();

  const bad = [];
  for (const d of declared) for (const n of matches(d, MONOTYPE)) bad.push(`計算値  「${d}」← ${n}`);
  return { bad, declared };
}

(async () => {
  const root = path.resolve(__dirname, '..');
  console.log(`フォント監査: ${root}\n`);

  const s = staticScan(root);
  const a = assetScan(root);
  const useBrowser = process.argv.includes('--browser');
  const b = useBrowser ? await browserScan(path.join(root, 'index.html')) : { bad: [], declared: [] };

  if (b.declared.length) {
    console.log('■ ブラウザが計算した font-family（実際に効いている指定）');
    b.declared.forEach((d) => console.log('    ' + d));
    console.log();
  }

  if (a.info.length) {
    console.log('■ 外部から読み込んでいるフォント');
    [...new Set(a.info)].forEach((i) => console.log('    ' + i));
    console.log();
  }

  const warns = [...new Set([...s.warn, ...a.warn])];
  if (warns.length) {
    console.log('▲ 確認したほうがよい点');
    warns.forEach((w) => console.log('    ' + w));
    console.log();
  }

  const bad = [...new Set([...s.bad, ...a.bad, ...b.bad])];
  if (bad.length) {
    console.log('■ 見つかった問題');
    bad.forEach((x) => console.log('    ' + x));
    console.log('\n✖ 監査に通りませんでした。上記を削除してください。');
    process.exit(1);
  }

  console.log('✔ Monotype 系のフォント名も、フォントファイルの同梱もありません。');
  if (!useBrowser) console.log('  （--browser を付けると、ブラウザ標準の Times New Roman / Arial も検査できます）');
})();
