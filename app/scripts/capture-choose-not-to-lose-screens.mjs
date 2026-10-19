// Captures the embedded "Choose Not to Lose" build as the screenshots /product/choose-not-to-lose crossfades through and
// falls back to on phones, plus the close-ups the page and the /product tile use. Run after
// build-choose-not-to-lose-proto.mjs, with the site's dev server running, so screenshots and iframes match.
//
//   node scripts/capture-choose-not-to-lose-screens.mjs [path-to-d4-choose-not-to-lose-prototype]
//
// Two sizes, matching the two kits in v2/Device.jsx:
//   screens/<name>.webp  1440 x 900 at 1.25x: a browser window on the flow (hero, live prototype)
//   pages/<name>.webp    1440 x PAGE_H at 1.25x: the whole page, which the sticky steps pan and zoom over like a scroll
// Uses the prototype's own puppeteer-core, sharp from the Ready for agents prototype, and the installed Chrome; this repo
// gains no dependency.
import {createRequire} from 'node:module';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const source = path.resolve(process.argv[2] || process.env.CNTL_SRC || path.join(app, '../../../视觉设计作品集/d4-choose-not-to-lose-prototype'));
const sharpHome = path.resolve(process.env.PD_PROTOTYPE_SRC || path.join(app, '../../../视觉设计作品集/pd-prototype'));
const {default: puppeteer} = await import(pathToFileURL(path.join(source, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const sharp = createRequire(path.join(sharpHome, 'package.json'))('sharp');
const ORIGIN = process.env.BASE_URL || 'http://127.0.0.1:4316';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const assets = path.join(app, 'public/assets/product/choose-not-to-lose');
const dirs = {screens: path.join(assets, 'screens'), pages: path.join(assets, 'pages')};
for (const dir of Object.values(dirs)) await fs.mkdir(dir, {recursive: true});

// name -> query, exactly as the case page builds its iframe URLs (CNTL_STATES in v2/Device.jsx)
export const STATES = {
  'baseline': 'screen=baseline', 'scenarios': 'screen=scenarios', 'compare': 'screen=compare', 'math': 'screen=math',
  'worst-year': 'screen=worst-year', 'review-b': 'screen=review&plan=b', 'confirmation': 'screen=confirmation&plan=a',
};
export const PAGE_H = 2080;  // the tallest step state (math, with the proof open) is 2064 px at 1440
const SCALE = 1.25;
const url = query => `${ORIGIN}/proto/choose-not-to-lose/index.html?${query}`;

const browser = await puppeteer.launch({executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb']});
const page = await browser.newPage();
await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const open = async (query, height, scale = SCALE) => {
  await page.setViewport({width: 1440, height, deviceScaleFactor: scale});
  await page.goto(url(query), {waitUntil: 'networkidle0'});
  await page.evaluate(async () => {
    await document.fonts.ready;
    document.activeElement?.blur?.();  // a focused skip link would show in the shot
  });
  await new Promise(r => setTimeout(r, 400));
  return page.evaluate(() => document.documentElement.scrollHeight);
};
const save = async (file, clip) => {
  const info = await sharp(await page.screenshot(clip ? {clip} : {})).webp({quality: 84, effort: 6}).toFile(file);
  return `${path.relative(assets, file)} ${info.width}x${info.height}`;
};
const log = [];
for (const [name, query] of Object.entries(STATES)) {
  await open(query, 900);
  log.push(await save(path.join(dirs.screens, `${name}.webp`)));
  const tall = await open(query, PAGE_H);
  if (tall > PAGE_H) throw new Error(`${name} is ${tall} px tall; raise PAGE_H (and the kit's h) to fit it`);
  log.push(await save(path.join(dirs.pages, `${name}.webp`)));
}

// Close-ups at 2x, clipped in CSS px. Positions are the 1440-wide layout's own.
const rect = sel => page.$eval(sel, el => { const r = el.getBoundingClientRect(); return {x: r.left, y: r.top, width: r.width, height: r.height}; });
await open('screen=compare', PAGE_H, 2);
// the /product tile and next-project card: the chart, with the cost-difference note lifted in front
log.push(await save(path.join(assets, 'tile.webp'), {x: 16, y: 386, width: 1088, height: 600}));
log.push(await save(path.join(assets, 'tile-note.webp'), await rect('.dominance')));
// decisions
log.push(await save(path.join(assets, 'decision-year.webp'), {x: 32, y: 392, width: 1056, height: 704}));
await open('screen=scenarios', PAGE_H, 2);
log.push(await save(path.join(assets, 'decision-bills.webp'), {x: 208, y: 216, width: 1024, height: 600}));
await open('screen=math', PAGE_H, 2);
log.push(await save(path.join(assets, 'decision-inform.webp'), {x: 32, y: 1255, width: 860, height: 560}));
await open('screen=review&plan=b', PAGE_H, 2);
log.push(await save(path.join(assets, 'decision-option.webp'), {x: 16, y: 270, width: 830, height: 560}));
await open('screen=confirmation&plan=a', PAGE_H, 2);
log.push(await save(path.join(assets, 'decision-sentence.webp'), {x: 16, y: 270, width: 830, height: 560}));

await browser.close();
if (errors.length) throw new Error(`Prototype errors while capturing: ${errors.join('; ')}`);
console.log(`Captured Choose Not to Lose:\n  ${log.join('\n  ')}`);
