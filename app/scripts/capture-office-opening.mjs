// Captures the 3D office's opening frame as the stills the homepage shows until the live room fades in (office3d/model.js):
//   public/assets/office3d/opening-wide.webp       3575 x 1375  every landscape window up to 2.6:1
//   public/assets/office3d/opening-portrait.webp   1367 x 1536  portrait windows from 0.53:1 to 0.9:1
//   public/assets/office3d/opening-tall.webp        600 x 1298  taller phones, where the camera backs off
// The camera keeps its height-fitted framing within each shape, so the window only crops a still sideways.
// The heights cover the sharpest the live room renders (2200 px on its long side, 1.5x the window at most).
// Re-run after the office model, its lights or the wall title change, with the site's dev or preview server running.
//
//   node scripts/capture-office-opening.mjs            (BASE_URL defaults to the dev server, http://127.0.0.1:4316)
//
// Uses the Arden prototype's puppeteer-core and the installed Chrome (a temporary profile), and sharp from pd-prototype,
// as capture-arden-screens.mjs does; this repo gains no dependency.
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
const PAGE = (process.env.BASE_URL || 'http://127.0.0.1:4316') + '/';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const out = path.join(app, 'public/assets/office3d');
const SHOTS = [
  {name: 'opening-wide', w: 3575, h: 1375},
  {name: 'opening-portrait', w: 1367, h: 1536},
  {name: 'opening-tall', w: 600, h: 1298},
];

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'office-capture-'));
const browser = await puppeteer.launch({executablePath: CHROME, headless: true, userDataDir: profile, args: ['--hide-scrollbars', '--force-color-profile=srgb', '--remote-debugging-port=0', '--ignore-gpu-blocklist']});
const errors = [];
try {
  for (const s of SHOTS) {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.setViewport({width: s.w, height: s.h, deviceScaleFactor: 1});
    // A returning visitor: no loading screen, the room loads at once. The pointer never enters, so the camera is at rest.
    await page.evaluateOnNewDocument(() => { sessionStorage.setItem('jl-arrived', '1'); globalThis.__officeMaxPixels = 4000; });
    await page.goto(PAGE, {waitUntil: 'load'});
    await page.waitForFunction(() => document.querySelector('.office-3d')?.dataset.mode === '3d', {timeout: 120000, polling: 250});
    // Wait until the desk objects have settled on the desk.
    await page.waitForFunction(() => {
      const items = document.querySelector('.office-3d').dataset.items;
      if (items !== window.__items) { window.__items = items; window.__still = 0; return false; }
      return ++window.__still > 10;
    }, {timeout: 30000, polling: 200});
    const frame = await page.evaluate(() => new Promise(resolve => {
      const host = document.querySelector('.office-3d'), canvas = host.querySelector('canvas');
      requestAnimationFrame(() => {
        host.closest('.legacy-hero').dispatchEvent(new Event('office:progress'));   // asks the room for a fresh frame
        requestAnimationFrame(() => resolve({                                        // and reads it before the buffer clears
          png: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height,
          progress: host.dataset.progress, camera: host.dataset.camera, lamp: host.dataset.lamp,
        }));
      });
    }));
    if (frame.width !== s.w || frame.height !== s.h) throw new Error(`${s.name}: the room rendered at ${frame.width}x${frame.height}`);
    if (Number(frame.progress) !== 0 || frame.lamp !== 'on') throw new Error(`${s.name}: not the opening (progress ${frame.progress}, lamp ${frame.lamp})`);
    const png = Buffer.from(frame.png.split(',')[1], 'base64');
    const {channels} = await sharp(png).stats();
    if (channels.slice(0, 3).every(c => c.max < 16)) throw new Error(`${s.name}: the captured frame is blank`);
    const info = await sharp(png).webp({quality: 92, effort: 6}).toFile(path.join(out, `${s.name}.webp`));
    console.log(`${s.name}.webp ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KB · camera ${frame.camera}`);
    await page.close();
  }
} finally {
  await browser.close();
  fs.rmSync(profile, {recursive: true, force: true});
}
if (errors.length) console.warn('page errors:\n' + errors.join('\n'));
