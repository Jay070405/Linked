// Alignment check for /product/arden (site-spec/WORLD-ARDEN-V4.md §2): one content grid (max 1200 px, 12 columns,
// 24 px gutter), so in every chapter the left edges of the h2, the first card and the first media block line up within
// 1 px, at 1440 and at 1280. Full-bleed blocks (the opening film, the worn photo, the day's stage) are left out on
// purpose: they run edge to edge with equal margins, which is checked separately. Also fails on sideways scroll.
// Exit code 1 on any problem.
//
//   node scripts/qa-arden-align.mjs [url]        (default http://127.0.0.1:4393/product/arden, a running dev server)
//
// Uses the Arden prototype's puppeteer-core and the installed Chrome with a temporary profile; this repo gains no
// dependency.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const protoDir = path.join(here, '../../../../视觉设计作品集/cases/d5-glasses/app');
const {default: puppeteer} = await import(pathToFileURL(path.join(protoDir, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const URL = process.argv[2] || 'http://127.0.0.1:4393/product/arden';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';

// what counts as a card and as a media block, in the order they're looked for
const CARDS = ['.ar-pcard', '.ar-after-grid > div', '.ar-detail', '.ar-xp-chips', '.ar-pair > div', '.ar-make > div',
  '.ar-app-tasks li', '.ar-eval-col', '.ar-open li', '.ar-worn li'];
const MEDIA = ['.ar-charge-stage', '.ar-cmf-fig', '.ar-turn-stage', '.ar-xp-pin', '.ar-cut-fig', '.ar-dims-fig', '.ar-plate', '.ar-worn figure',
  '.ar-app-frame', '.ar-app-phone', '.ar-lineup'];

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'align-'));
const browser = await puppeteer.launch({executablePath: CHROME, headless: true, userDataDir: profile, args: ['--no-sandbox', '--hide-scrollbars', '--remote-debugging-port=0']});
const problems = [];
try {
  for (const [w, h] of [[1440, 900], [1280, 800]]) {
    const page = await browser.newPage();
    await page.setViewport({width: w, height: h});
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem('jay-lang', 'en'); } catch {} });
    await page.goto(URL, {waitUntil: 'networkidle0', timeout: 90000});
    // walk down once so everything that mounts near the viewport has mounted
    const height = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < height; y += 700) { await page.evaluate(v => scrollTo(0, v), y); await new Promise(r => setTimeout(r, 60)); }
    await new Promise(r => setTimeout(r, 600));
    const rows = await page.evaluate((CARDS, MEDIA) => {
      const left = el => (el ? Math.round(el.getBoundingClientRect().left * 10) / 10 : null);
      const first = (root, list) => { for (const sel of list) { const el = root.querySelector(sel); if (el && el.getBoundingClientRect().width > 0) return [sel, el]; } return [null, null]; };
      return [...document.querySelectorAll('.ar section.ar-chapter')].map(sec => {
        const h2 = sec.querySelector('h2');
        const [cs, card] = first(sec, CARDS), [ms, media] = first(sec, MEDIA);
        return {id: sec.id || h2?.id || sec.className, h2: left(h2), card: left(card), cardSel: cs, media: left(media), mediaSel: ms};
      });
    }, CARDS, MEDIA);
    for (const r of rows) {
      const edges = [['h2', r.h2], [r.cardSel, r.card], [r.mediaSel, r.media]].filter(([, v]) => v != null);
      const base = edges[0]?.[1];
      for (const [name, v] of edges) if (Math.abs(v - base) > 1) problems.push(`${w}: ${r.id}: ${name} at ${v}px, h2 at ${base}px`);
      console.log(`${w}  ${String(r.id).padEnd(22)} ${edges.map(([n, v]) => `${n}=${v}`).join('  ')}`);
    }
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > w) problems.push(`${w}: the page scrolls sideways (${sw}px)`);
    await page.close();
  }
} finally { await browser.close(); fs.rmSync(profile, {recursive: true, force: true}); }
if (problems.length) { console.log('\nMISALIGNED\n' + problems.join('\n')); process.exitCode = 1; } else console.log('\nPASS: every chapter lines up');
