// The site plan without its route, for the case page's "Find the door" game and gate-code widget, plus small copies of
// the route photos:
//   public/assets/product/last-100-feet/plan-base.webp   the prototype's own site plan (presentation frame 1) with the
//       route, the waypoint tokens, the address pin and the highlighted car taken out, widened to the plan rectangle
//       BASE in src/product/v2/data/l100-route.js, so the page can draw pins and the route on it in plan units
//   public/assets/product/last-100-feet/photos/<slot>.webp   480 px copies of the prototype's photos (AI-generated
//       illustrative images of a fictional complex)
// Run with the site's dev server running (it serves the embedded build in public/proto/last-100-feet).
//
//   node scripts/capture-last-100-feet-plan.mjs [path-to-d3-last-100-feet-prototype]
//
// Uses the prototype's own puppeteer-core and sharp, and the installed Chrome; this repo gains no dependency.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {BASE} from '../src/product/v2/data/l100-route.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const source = path.resolve(process.argv[2] || process.env.L100_SRC || path.join(app, '../../../视觉设计作品集/d3-last-100-feet-prototype'));
const require = createRequire(path.join(source, 'package.json'));
const {default: puppeteer} = await import(pathToFileURL(path.join(source, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const sharp = require('sharp');
const PAGE = (process.env.BASE_URL || 'http://127.0.0.1:4316') + '/proto/last-100-feet/index.html';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const assets = path.join(app, 'public/assets/product/last-100-feet');
const log = [];

const browser = await puppeteer.launch({executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb']});
const page = await browser.newPage();
await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
await page.setViewport({width: 1600, height: 1000, deviceScaleFactor: 2.5});
await page.goto(`${PAGE}?present=1`, {waitUntil: 'networkidle0'});
await page.evaluate(() => document.fonts.ready);
// Frame 1 draws the plan at 404 px for 438 plan units; keep that stroke and label weight, widen the window to BASE.
const px = BASE.w * 404 / 438, py = BASE.h * 404 / 438;
const clip = await page.evaluate(({BASE, px, py}) => {
  const svg = document.querySelector('.pr-plan svg');
  const route = svg.querySelector('path[d="M206 455 V441 H226 V431"]');
  const clipGroup = svg.querySelector('g[clip-path]');
  let layer = route; while (layer && layer.parentNode !== clipGroup) layer = layer.parentNode;
  layer?.remove();                                                   // legs and waypoint tokens
  svg.querySelectorAll('.pin-drop').forEach(n => n.remove());        // the address pin: the page draws its own
  svg.querySelectorAll('rect').forEach(r => {                        // the highlighted car becomes an ordinary one
    if (r.getAttribute('fill') === '#494949') r.setAttribute('fill', '#DADAD7');
    if (r.getAttribute('fill') === 'rgba(255,255,255,.3)') r.setAttribute('fill', 'rgba(25,25,25,.16)');
  });
  clipGroup.removeAttribute('clip-path');
  svg.setAttribute('viewBox', `${BASE.x} ${BASE.y} ${BASE.w} ${BASE.h}`);
  const host = svg.parentElement;
  Object.assign(host.style, {position: 'fixed', left: '0', top: '0', width: `${px}px`, height: `${py}px`, margin: '0', zIndex: 10, borderRadius: '0', overflow: 'hidden'});
  return {x: 0, y: 0, width: px, height: py};
}, {BASE, px, py});
await new Promise(r => setTimeout(r, 400));
const info = await sharp(await page.screenshot({clip})).webp({quality: 86, effort: 6}).toFile(path.join(assets, 'plan-base.webp'));
log.push(`plan-base ${info.width}x${info.height} (${BASE.x} ${BASE.y} ${BASE.w} ${BASE.h})`);
await browser.close();

await fs.mkdir(path.join(assets, 'photos'), {recursive: true});
for (const slot of ['curb', 'gate', 'courtyard', 'stairs', 'door', 'garage']) {
  const p = await sharp(path.join(app, 'public/proto/last-100-feet/photos', `${slot}.webp`)).resize({width: 480}).webp({quality: 74, effort: 6}).toFile(path.join(assets, 'photos', `${slot}.webp`));
  log.push(`photo ${slot} ${p.width}x${p.height} ${(p.size / 1024).toFixed(1)} KB`);
}
console.log(`Last 100 Feet plan:\n  ${log.join('\n  ')}`);
