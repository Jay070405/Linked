// Captures every screen of the embedded Atelier build as the screenshots the case page crossfades through
// (public/assets/product/atelier/screens/<screen>.webp, 390 x 844 at 2x). Run it after build-atelier-proto.mjs,
// with the site's dev server running, so the screenshots match the live iframe pixel for pixel.
//
//   node scripts/capture-atelier-screens.mjs [path-to-d2-atelier-prototype]
//
// Uses the prototype's own puppeteer-core and sharp, and the installed Chrome; this repo gains no dependency.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const source = path.resolve(process.argv[2] || process.env.ATELIER_SRC || path.join(app, '../../../视觉设计作品集/d2-atelier-prototype'));
const require = createRequire(path.join(source, 'package.json'));
const {default: puppeteer} = await import(pathToFileURL(path.join(source, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const sharp = require('sharp');
const BASE = (process.env.BASE_URL || 'http://127.0.0.1:4316') + '/proto/atelier/index.html';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const out = path.join(app, 'public/assets/product/atelier/screens');
await fs.mkdir(out, {recursive: true});

const SCREENS = ['onboarding', 'welcome', 'home', 'collection', 'upload', 'check', 'sizes', 'price', 'preview', 'published', 'share',
  'orders', 'order', 'empty-home', 'empty-orders', 'drop', 'wall', 'checkout', 'confirmation'];
// The case page loads creator screens with The Blue Hour and collector screens with A Distant Signal.
const art = screen => ['drop', 'wall', 'checkout', 'confirmation'].includes(screen) ? 'signal' : 'blue-hour';

const browser = await puppeteer.launch({executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb']});
const page = await browser.newPage();
await page.setViewport({width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true});
await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
const errors = [];
page.on('pageerror', e => errors.push(e.message));
await page.goto(BASE, {waitUntil: 'networkidle0'});
await page.evaluate(() => localStorage.clear());
for (const screen of SCREENS) {
  await page.goto(`${BASE}?screen=${screen}&art=${art(screen)}`, {waitUntil: 'networkidle0'});
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
  await new Promise(r => setTimeout(r, 500));
  const png = await page.screenshot();
  await sharp(png).webp({quality: 84, effort: 6}).toFile(path.join(out, `${screen}.webp`));
}
await browser.close();
if (errors.length) throw new Error(`Prototype errors while capturing: ${errors.join('; ')}`);
console.log(`Captured ${SCREENS.length} Atelier screens into ${path.relative(app, out)}.`);
