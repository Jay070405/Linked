// Captures the embedded Arden companion build as the stills /product/arden shows:
//   public/assets/product/arden/app/desk.webp        the phone and the glasses simulator (1440 x 812): the iframe's poster
//   public/assets/product/arden/app/phone.webp       the phone layout (390 x 844 at 2x): phones get it with a link
//   public/assets/product/arden/app/health-<light|dark>.webp   Health, after a week of conversations (Hearing Check-in)
//   public/assets/product/arden/app/show-person-<light|dark>.webp  the translation screen the wearer turns toward the other person
//   public/assets/product/arden/app/lock.webp, sizes.webp   the Lock Screen while recording, and the Sizes board (1440 x 812)
// Run after build-arden-proto.mjs, with the site's dev server running.
//
//   node scripts/capture-arden-screens.mjs
//
// Uses the prototype's own puppeteer-core and the installed Chrome (a temporary profile), and sharp from pd-prototype;
// this repo gains no dependency.
import {createRequire} from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const work = path.join(app, '../../../视觉设计作品集');
const protoDir = path.join(work, 'cases/d5-glasses/app');
const {default: puppeteer} = await import(pathToFileURL(path.join(protoDir, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const sharp = createRequire(path.join(work, 'pd-prototype/package.json'))('sharp');
const PAGE = (process.env.BASE_URL || 'http://127.0.0.1:4316') + '/proto/arden/index.html';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const out = path.join(app, 'public/assets/product/arden/app');
fs.mkdirSync(out, {recursive: true});

const SHOTS = [
  {name: 'desk', w: 1440, h: 812, query: '?theme=light', scheme: 'light'},
  {name: 'phone', w: 390, h: 844, query: '?theme=light', scheme: 'light'},
  {name: 'health-light', w: 390, h: 844, query: '?tab=Health&week=1&theme=light', scheme: 'light'},
  {name: 'health-dark', w: 390, h: 844, query: '?tab=Health&week=1&theme=dark', scheme: 'dark'},
  // "Show to the other person": what the person across the table reads during a translation (the page's You / Them)
  {name: 'show-person-light', w: 390, h: 844, query: '?screen=show-person&theme=light', scheme: 'light'},
  {name: 'show-person-dark', w: 390, h: 844, query: '?screen=show-person&theme=dark', scheme: 'dark'},
  // the App section's two stills beside the embed: the Lock Screen while recording, and the Sizes board
  {name: 'lock', w: 1440, h: 812, query: '?screen=lock-recording&theme=light', scheme: 'light'},
  {name: 'sizes', w: 1440, h: 812, query: '?screen=sizes-board&theme=light', scheme: 'light'},
];
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'arden-capture-'));
const browser = await puppeteer.launch({executablePath: CHROME, headless: true, userDataDir: profile, args: ['--hide-scrollbars', '--force-color-profile=srgb', '--remote-debugging-port=0']});
const errors = [];
try {
  for (const s of SHOTS) {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    const mobile = s.w < 700;
    await page.setViewport({width: s.w, height: s.h, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile});
    await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}, {name: 'prefers-color-scheme', value: s.scheme}]);
    await page.goto(PAGE + s.query, {waitUntil: 'networkidle0'});
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
    await new Promise(r => setTimeout(r, 700));
    const png = await page.screenshot();
    const info = await sharp(png).webp({quality: 84, effort: 6}).toFile(path.join(out, `${s.name}.webp`));
    console.log(`${s.name}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB`);
    await page.close();
  }
} finally {
  await browser.close();
  fs.rmSync(profile, {recursive: true, force: true});
}
if (errors.length) throw new Error(`Prototype errors: ${errors.join('; ')}`);
