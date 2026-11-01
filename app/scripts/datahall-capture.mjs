// Captures Data Hall frames at chosen scroll progresses, as the review rounds and the case page use them.
//   node scripts/datahall-capture.mjs [out-dir] [p,p,…]      (BASE_URL defaults to the dev server, http://127.0.0.1:4322)
// Frames go to out-dir as p0420.png…, plus contact.png, a 4-up sheet of all of them. The film is pinned at each
// progress through window.__dataHall.pin(), so the spring and the intro clock don't blur the capture.
// Uses the Arden prototype's puppeteer-core and the installed Chrome, and sharp from pd-prototype, as
// capture-office-opening.mjs does; this repo gains no dependency.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const work = path.join(app, '../../../视觉设计作品集');
const {default: puppeteer} = await import(pathToFileURL(path.join(work, 'cases/d5-glasses/app/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const sharp = createRequire(path.join(work, 'pd-prototype/package.json'))('sharp');
const PAGE = (process.env.BASE_URL || 'http://127.0.0.1:4322') + '/other-project/data-hall';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const out = path.resolve(process.argv[2] || path.join(app, '../../../aigc-vibecoding/data-hall/shots/latest'));
const ps = (process.argv[3] || '0,0.12,0.24,0.34,0.41,0.49,0.58,0.67,0.76,0.82,0.88,0.93,0.94,0.97').split(',').map(Number);
const W = Number(process.env.W || 1600), H = Number(process.env.H || 900), LANG = process.env.LANG_SITE || 'en';
fs.mkdirSync(out, {recursive: true});

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'datahall-capture-'));
const browser = await puppeteer.launch({executablePath: CHROME, headless: true, userDataDir: profile, args: ['--hide-scrollbars', '--force-color-profile=srgb', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--use-angle=d3d11']});
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {if (m.type() === 'error') errors.push(m.text());});
  await page.setViewport({width: W, height: H, deviceScaleFactor: 1});
  // REDUCED=1: the visitor prefers reduced motion; the film is scrolled to each progress rather than pinned
  if (process.env.REDUCED) await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
  await page.evaluateOnNewDocument(lang => {sessionStorage.setItem('jl-arrived', '1'); localStorage.setItem('jay-lang', lang);}, LANG);
  await page.goto(PAGE, {waitUntil: 'load'});
  await page.waitForFunction(() => window.__dataHall?.ready(), {timeout: 120000, polling: 250});
  await page.evaluate(() => document.querySelectorAll('.studio-loading,.circular-transition').forEach(e => e.remove()));
  // the site navigation writes its labels in on arrival; let that finish so the first shot isn't mid-animation
  await new Promise(r => setTimeout(r, 2500));
  // CLEAN=1: frames without the site's chrome or the captions, for the Other Project card
  if (process.env.CLEAN) await page.addStyleTag({content: '.v16-navigation,.dh-captions,.dh-head,.dh-progress,.portfolio-return{display:none!important}'});
  // EVAL=<js>: run in the page before the shots (debugging)
  if (process.env.EVAL) await page.evaluate(process.env.EVAL);
  const shots = [];
  for (const p of ps) {
    if (process.env.REDUCED) await page.evaluate(v => {const f = document.querySelector('.dh-film'), sc = document.querySelector('.portfolio-page-viewport'); sc.scrollTop = f.offsetTop + v * (f.offsetHeight - innerHeight);}, p);
    else await page.evaluate(v => window.__dataHall.pin(v), p);
    // a few frames so captions and the frame budget settle
    await page.evaluate(() => new Promise(r => {let n = 0; const f = () => (++n > 8 ? r() : requestAnimationFrame(f)); requestAnimationFrame(f);}));
    // captions fade on a clock (about half a second)
    await new Promise(r => setTimeout(r, 650));
    const file = path.join(out, 'p' + String(Math.round(p * 10000)).padStart(5, '0') + '.png');
    await page.screenshot({path: file});
    const info = await page.evaluate(() => window.__dataHall.scene.info());
    shots.push(file);
    console.log(path.basename(file), `calls ${info.calls} tris ${info.triangles}`);
  }
  // MAKING=1: also screenshot the how-it-was-made section, a screen at a time
  if (process.env.MAKING) {
    await page.evaluate(() => window.__dataHall.pin(null));
    const n = await page.evaluate(() => {const v = document.querySelector('.portfolio-page-viewport'), m = document.querySelector('.dh-making'); v.scrollTop = m.offsetTop; return Math.ceil(m.offsetHeight / innerHeight);});
    for (let k = 0; k < n; k++) {
      await page.evaluate(k => {const v = document.querySelector('.portfolio-page-viewport'), m = document.querySelector('.dh-making'); v.scrollTop = m.offsetTop + k * innerHeight * 0.9;}, k);
      await new Promise(r => setTimeout(r, 1300));
      await page.screenshot({path: path.join(out, 'making-' + k + '.png')});
    }
    console.log('making', n);
  }
  // contact sheet, four across
  const tw = 640, th = Math.round(tw * H / W), cols = 4, rows = Math.ceil(shots.length / cols);
  const tiles = await Promise.all(shots.map(async (f, i) => ({input: await sharp(f).resize(tw, th).toBuffer(), left: (i % cols) * (tw + 8), top: Math.floor(i / cols) * (th + 8)})));
  await sharp({create: {width: cols * (tw + 8) - 8, height: rows * (th + 8) - 8, channels: 3, background: '#888'}}).composite(tiles).png().toFile(path.join(out, 'contact.png'));
  console.log('contact.png', errors.length ? 'errors:\n' + errors.join('\n') : 'no page errors');
} finally {
  await browser.close();
  fs.rmSync(profile, {recursive: true, force: true});
}
