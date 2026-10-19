// Captures the embedded "Ready for agents" build in the states the case page shows, as the screenshots it crossfades
// through and falls back to on phones (public/assets/product/ready-for-agents/screens/<name>.webp, 1440 x 900 at 1.25x),
// plus the close-ups the page and the /product tile use (principle-*, tile*, agent-*, explore-*).
// Run after build-ready-for-agents-proto.mjs, with the site's dev server running, so screenshots and iframe match.
//
//   node scripts/capture-ready-for-agents-screens.mjs [path-to-pd-prototype]
//
// Uses the prototype's own puppeteer-core and sharp, and the installed Chrome; this repo gains no dependency.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const source = path.resolve(process.argv[2] || process.env.PD_PROTOTYPE_SRC || path.join(app, '../../../视觉设计作品集/pd-prototype'));
const require = createRequire(path.join(source, 'package.json'));
const {default: puppeteer} = await import(pathToFileURL(path.join(source, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const sharp = require('sharp');
const ORIGIN = process.env.BASE_URL || 'http://127.0.0.1:4316';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const assets = path.join(app, 'public/assets/product/ready-for-agents');
const out = path.join(assets, 'screens');
await fs.mkdir(out, {recursive: true});

// name -> query, exactly as the case page builds its iframe URLs (RFA_STATES in v2/Device.jsx). Round 2 of the
// prototype: a Variables row on the frame, Check designs with a "Variables for agents" lens, a variable picker.
export const STATES = {
  'row': 'state=row', 'review': 'state=review', 'hover': 'state=hover&row=c-white-frame',
  'details': 'state=details&row=c-white-frame', 'picker': 'state=picker&row=c-white-frame', 'choice': 'state=choice',
  'bound': 'state=bound', 'after': 'state=after', 'ready': 'state=ready', 'ready-review': 'state=ready-review',
  'agent': 'state=agent', 'outline': 'state=outline',
  'review-dark': 'state=review&theme=dark', 'picker-dark': 'state=picker&row=c-white-frame&theme=dark',
};
const browser = await puppeteer.launch({executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb']});
const page = await browser.newPage();
await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const open = async (url, viewport = {width: 1440, height: 900}, scale = 1.25) => {
  await page.setViewport({...viewport, deviceScaleFactor: scale});
  await page.goto(url, {waitUntil: 'networkidle0'});
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
  });
  await new Promise(r => setTimeout(r, 600));
};
const save = async (file, clip) => {
  const png = await page.screenshot(clip ? {clip} : {});
  const info = await sharp(png).webp({quality: 82, effort: 6}).toFile(file);
  return `${path.basename(file)} ${info.width}x${info.height}`;
};
const editor = query => `${ORIGIN}/proto/ready-for-agents/index.html?embed=1&${query}`;

for (const [name, query] of Object.entries(STATES)) {
  await open(editor(query));
  await save(path.join(out, `${name}.webp`));
}
// the agent side: the Claude Code session receiving the same note (/agent route)
await open(`${ORIGIN}/proto/ready-for-agents/agent/?state=after`);
await save(path.join(out, 'terminal.webp'));

// Close-ups, clipped around live elements (CSS px). `pad` is [x, y]; `count` takes the union of the first n matches.
const box = (sel, pad = [0, 0], count = 1) => page.evaluate((sel, pad, count) => {
  const r = [...document.querySelectorAll(sel)].slice(0, count).map(e => e.getBoundingClientRect());
  if (!r.length) throw new Error(`No element for ${sel}`);
  const x = Math.min(...r.map(b => b.left)) - pad[0], y = Math.min(...r.map(b => b.top)) - pad[1];
  return {x, y, width: Math.max(...r.map(b => b.right)) + pad[0] - x, height: Math.max(...r.map(b => b.bottom)) + pad[1] - y};
}, sel, pad, count);
const union = (...rects) => {
  const x = Math.min(...rects.map(r => r.x)), y = Math.min(...rects.map(r => r.y));
  return {x, y, width: Math.max(...rects.map(r => r.x + r.width)) - x, height: Math.max(...rects.map(r => r.y + r.height)) - y};
};
const log = [];
// Principles: each shown as the piece of the prototype that passes its test.
await open(editor('state=row'));
log.push(await save(path.join(assets, 'principle-row.webp'), await box('.vsum', [0, 6])));
// the /product tile: the top of the properties panel with the row, lifted in front of the editor
log.push(await save(path.join(assets, 'tile-row.webp'), union(await box('.vsum'), {x: 1200, y: 84, width: 240, height: 236})));
await open(editor('state=bound'));
log.push(await save(path.join(assets, 'principle-toast.webp'), await box('.toast', [6, 6])));
await open(editor('state=review'));
log.push(await save(path.join(assets, 'principle-choice.webp'), await box('.pop .crow', [10, 6], 2)));
// the /product tile and the next-project card: canvas, Check designs and the panel
log.push(await save(path.join(assets, 'tile.webp'), {x: 416, y: 70, width: 1024, height: 664}));
await open(editor('state=ready'));
log.push(await save(path.join(assets, 'principle-ready.webp'), await box('.vsum', [0, 6])));
await open(editor('state=agent'));
const note = await page.evaluate(() => {
  const el = [...document.querySelectorAll('.agent-body *')].filter(e => /^\s*Home has \d+ unbound/.test(e.textContent || '')).at(-1);
  if (!el) throw new Error('No agent note');
  const r = el.getBoundingClientRect();
  return {x: r.left - 10, y: r.top - 8, width: r.width + 20, height: r.height + 16};
});
log.push(await save(path.join(assets, 'principle-words.webp'), note));
// the Agents tab, inside the editor
log.push(await save(path.join(assets, 'agent-designer.webp'), {x: 64, y: 0, width: 620, height: 660}));
await open(`${ORIGIN}/proto/ready-for-agents/agent/?state=after`);
log.push(await save(path.join(assets, 'agent-terminal.webp'), await box('.term-window')));
// the three directions, from the /explore board at its own 1920 x 1200 size
await open(`${ORIGIN}/proto/ready-for-agents/explore/`, {width: 1920, height: 1200}, 1.8);
// the board's three iframes paint one after another; the last needs a few seconds
await new Promise(r => setTimeout(r, 4000));
const crops = await page.$$eval('.ex-crop', els => els.map(e => { const r = e.getBoundingClientRect(); return {x: r.left, y: r.top, width: r.width, height: r.height}; }));
if (crops.length !== 3) throw new Error(`Expected 3 direction crops, found ${crops.length}`);
for (const [i, id] of ['a', 'b', 'c'].entries()) log.push(await save(path.join(assets, `explore-${id}.webp`), crops[i]));

await browser.close();
if (errors.length) throw new Error(`Prototype errors while capturing: ${errors.join('; ')}`);
console.log(`Captured ${Object.keys(STATES).length + 1} states into ${path.relative(app, out)}, and close-ups:\n  ${log.join('\n  ')}`);
