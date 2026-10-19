// Captures the embedded "Last 100 Feet" build in the screens /product/last-100-feet shows, as the screenshots its
// phones crossfade through and fall back to (public/assets/product/last-100-feet/screens/<id>.webp, 390 x 844 at 2x),
// plus the site plan from the prototype's first presentation frame. Run after build-last-100-feet-proto.mjs, with the
// site's dev server running, so screenshots and iframes match.
//
//   node scripts/capture-last-100-feet-screens.mjs [path-to-d3-last-100-feet-prototype]
//
// Uses the prototype's own puppeteer-core and sharp, and the installed Chrome; this repo gains no dependency.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const source = path.resolve(process.argv[2] || process.env.L100_SRC || path.join(app, '../../../视觉设计作品集/d3-last-100-feet-prototype'));
const require = createRequire(path.join(source, 'package.json'));
const {default: puppeteer} = await import(pathToFileURL(path.join(source, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const sharp = require('sharp');
const PAGE = (process.env.BASE_URL || 'http://127.0.0.1:4316') + '/proto/last-100-feet/index.html';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const assets = path.join(app, 'public/assets/product/last-100-feet');
const out = path.join(assets, 'screens');
await fs.mkdir(out, {recursive: true});

// Screen ids from the prototype's README screen map (round 2). The case page loads each as ?shot&screen=<id>.
export const SCREENS = [
  'r-pin-gate', 'r-basics', 'r-fix',
  'c-arrive', 'c-empty', 'c-step-park', 'c-step-building', 'c-step-stale',
  'c-gate-near', 'c-gate-revealed', 'c-gps-weak', 'c-gate-confirm', 'c-dropoff-match', 'c-feedback',
];

const browser = await puppeteer.launch({executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb']});
const page = await browser.newPage();
await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const settle = async () => {
  // lazy images off screen never finish decoding; give each one a moment, not forever
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => Promise.race([i.decode().catch(() => {}), new Promise(r => setTimeout(r, 1500))])));
  });
  await new Promise(r => setTimeout(r, 700));
};
const log = [];
await page.setViewport({width: 390, height: 844, deviceScaleFactor: 2});
for (const id of SCREENS) {
  await page.goto(`${PAGE}?shot&screen=${id}`, {waitUntil: 'networkidle0'});
  await settle();
  const info = await sharp(await page.screenshot()).webp({quality: 82, effort: 6}).toFile(path.join(out, `${id}.webp`));
  log.push(`${id} ${info.width}x${info.height}`);
}
// The site plan with the whole route, from presentation frame 1 (1600 x 1000), for the hero and the /product tile.
await page.setViewport({width: 1600, height: 1000, deviceScaleFactor: 2});
await page.goto(`${PAGE}?present=1`, {waitUntil: 'networkidle0'});
await settle();
const plan = await page.$eval('.pr-plan', el => { const r = el.getBoundingClientRect(); return {x: r.left, y: r.top, width: r.width, height: r.height}; });
const info = await sharp(await page.screenshot({clip: plan})).webp({quality: 84, effort: 6}).toFile(path.join(assets, 'plan.webp'));
log.push(`plan ${info.width}x${info.height}`);

await browser.close();
if (errors.length) throw new Error(`Prototype errors while capturing: ${errors.join('; ')}`);
console.log(`Captured Last 100 Feet:\n  ${log.join('\n  ')}`);
