// Leaves and re-enters Data Hall inside the site ten times (Other Project ↔ Data Hall, by the site's own links) and
// reports any WebGL warnings, such as Chrome's "Too many active WebGL contexts".
//   node scripts/datahall-leak.mjs        (BASE_URL defaults to the dev server, http://127.0.0.1:4322)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url)), app = path.resolve(here, '..');
const work = path.join(app, '../../../视觉设计作品集');
const {default: puppeteer} = await import(pathToFileURL(path.join(work, 'cases/d5-glasses/app/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4322';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'datahall-leak-'));
const browser = await puppeteer.launch({executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, userDataDir: profile, args: ['--ignore-gpu-blocklist']});
const warnings = [];
try {
  const page = await browser.newPage();
  page.on('console', m => {if (/webgl|context/i.test(m.text())) warnings.push(m.type() + ': ' + m.text());});
  page.on('pageerror', e => warnings.push('pageerror: ' + e.message));
  await page.setViewport({width: 1280, height: 800});
  await page.evaluateOnNewDocument(() => sessionStorage.setItem('jl-arrived', '1'));
  await page.goto(BASE + '/other-project/data-hall', {waitUntil: 'load'});
  for (let i = 0; i < 10; i++) {
    await page.waitForFunction(() => window.__dataHall, {timeout: 60000});
    await page.evaluate(() => document.querySelector('.dh-m-foot a').click());
    await page.waitForFunction(() => !window.__dataHall && document.querySelector('a[href="/other-project/data-hall"]'), {timeout: 60000});
    await new Promise(r => setTimeout(r, 800));
    await page.evaluate(() => document.querySelector('a[href="/other-project/data-hall"]').dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, button: 0})));
  }
  await page.waitForFunction(() => window.__dataHall, {timeout: 60000});
  console.log('10 round trips done;', warnings.length ? warnings.length + ' warnings:\n' + warnings.join('\n') : 'no WebGL warnings');
} finally {
  await browser.close();
  fs.rmSync(profile, {recursive: true, force: true});
}
