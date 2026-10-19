// Captures the embedded "Ready for agents" build in the states the case page shows, as the screenshots it crossfades
// through and falls back to on phones (public/assets/product/ready-for-agents/screens/<name>.webp, 1440 x 900 at 1.25x).
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
const out = path.join(app, 'public/assets/product/ready-for-agents/screens');
await fs.mkdir(out, {recursive: true});

// name -> query, exactly as the case page builds its iframe URLs (see RFA_KIT in v2/Device.jsx)
export const STATES = {
  'row': 'state=row', 'review': 'state=review', 'hover-c-white': 'state=hover&row=c-white', 'choice': 'state=choice',
  'bound': 'state=bound', 'after': 'state=after', 'ready': 'state=ready', 'agent': 'state=agent', 'outline': 'state=outline',
  'review-dark': 'state=review&theme=dark', 'bound-dark': 'state=bound&theme=dark',
};
const browser = await puppeteer.launch({executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars', '--force-color-profile=srgb']});
const page = await browser.newPage();
await page.setViewport({width: 1440, height: 900, deviceScaleFactor: 1.25});
await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const shoot = async (name, url) => {
  await page.goto(url, {waitUntil: 'networkidle0'});
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))); });
  await new Promise(r => setTimeout(r, 600));
  await sharp(await page.screenshot()).webp({quality: 82, effort: 6}).toFile(path.join(out, `${name}.webp`));
};
for (const [name, query] of Object.entries(STATES)) await shoot(name, `${ORIGIN}/proto/ready-for-agents/index.html?embed=1&${query}`);
// the agent side: the Claude Code session receiving the same note (/agent route)
await shoot('terminal', `${ORIGIN}/proto/ready-for-agents/agent/?state=after`);
await browser.close();
if (errors.length) throw new Error(`Prototype errors while capturing: ${errors.join('; ')}`);
console.log(`Captured ${Object.keys(STATES).length + 1} states into ${path.relative(app, out)}.`);
