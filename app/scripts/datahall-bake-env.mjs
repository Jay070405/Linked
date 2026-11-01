// Bakes the film's reflections once (scripts/datahall-env-bake.js in Chrome, through the dev server) into
// src/pages/data-hall/room-env.bin, so the page doesn't render and filter the room at every load.
//   node scripts/datahall-bake-env.mjs          (BASE_URL defaults to the dev server, http://127.0.0.1:4322)
// The file: zlib-deflated; 8 bytes of width and height (uint32, little-endian), then the texture's half floats as RGB
// (three reads only the colour; alpha goes back on load), each rounded to 7 bits of mantissa (under 0.4% off, in
// reflections that are blurred anyway) and stored as the difference from the texel to its left (the first in a row:
// the one below), low bytes first and high bytes after. 1.5 MB of halves deflate to about 80 KB that way.
// Rebake after a three.js update: the layout of the filtered texture is three's.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const work = path.join(app, '../../../视觉设计作品集');
const {default: puppeteer} = await import(pathToFileURL(path.join(work, 'cases/d5-glasses/app/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4322';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.join(app, 'src/pages/data-hall/room-env.bin');

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'datahall-env-'));
const browser = await puppeteer.launch({executablePath: CHROME, headless: true, userDataDir: profile, args: ['--ignore-gpu-blocklist', '--use-angle=d3d11']});
try {
  const page = await browser.newPage();
  await page.goto(BASE + '/scripts/datahall-env-bake.js');
  const {width, height, revision, data} = await page.evaluate(async () => (await import('/scripts/datahall-env-bake.js')).bake());
  const halves = new Uint16Array(new Uint8Array(Buffer.from(data, 'base64')).buffer);
  const n = width * height;
  // (three's shader reads only the colour; the atlas's unused corners are 0 throughout)
  let odd = 0;
  for (let i = 0; i < n; i++) if (halves[i * 4 + 3] !== 0x3c00 && (halves[i * 4 + 3] || halves[i * 4] || halves[i * 4 + 1] || halves[i * 4 + 2])) odd++;
  if (odd) throw new Error(`${odd} texels with alpha other than 1 that aren't empty`);
  const body = Buffer.alloc(8 + n * 6), v = new Uint16Array(n * 3);
  body.writeUInt32LE(width, 0); body.writeUInt32LE(height, 4);
  // (positive halves are in order as integers, so rounding the integer rounds the mantissa)
  for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) v[i * 3 + c] = Math.min(0x7bff, (halves[i * 4 + c] + 4) & ~7);
  for (let k = 0; k < n * 3; k++) {
    const x = (k / 3 | 0) % width, d = (v[k] - (x ? v[k - 3] : k >= width * 3 ? v[k - width * 3] : 0)) & 0xffff;
    body[8 + k] = d & 255; body[8 + n * 3 + k] = d >> 8;
  }
  const packed = zlib.deflateSync(body, {level: 9});
  fs.writeFileSync(OUT, packed);
  console.log(`three r${revision}, ${width}×${height}: ${(halves.byteLength / 1024).toFixed(0)} KB of halves → ${(packed.length / 1024).toFixed(0)} KB in ${path.relative(app, OUT)}`);
} finally {
  await browser.close();
  fs.rmSync(profile, {recursive: true, force: true});
}
