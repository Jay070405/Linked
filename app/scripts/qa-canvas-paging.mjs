// Stress test for the Ready for agents canvas (worlds/ready-for-agents/camera.js): one gesture pages exactly one stop,
// transitions take 1.1-1.4 s, input during a transition is swallowed, and the canvas never goes blank under hundreds
// of wheel events (rapid bursts, trackpad-like momentum, huge deltas, wheel during a transition), keys and swipes.
//
//   npx vite --host 127.0.0.1 --port 4417 --strictPort      (the dev server: the test reads window.__rfaCamera)
//   node scripts/qa-canvas-paging.mjs [http://127.0.0.1:4417/product/ready-for-agents]     (VIEWPORT=1000x600 for another size)
//
// Uses the prototype's puppeteer-core (PUPPETEER_CORE overrides its folder) and sharp, and the installed Chrome
// (CHROME overrides it); this repo gains no dependency. Exits 1 on any failure.
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const proto = path.resolve(process.env.PUPPETEER_CORE || path.join(here, '../../../../视觉设计作品集/pd-prototype'));
const require = createRequire(path.join(proto, 'package.json'));
const {default: puppeteer} = await import(pathToFileURL(path.join(proto, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const sharp = require('sharp');
const URL = process.argv[2] || 'http://127.0.0.1:4417/product/ready-for-agents';
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const browser = await puppeteer.launch({executablePath: CHROME, headless: true, args: ['--no-sandbox', '--hide-scrollbars']});
const page = await browser.newPage();
const [VW, VH] = (process.env.VIEWPORT || '1440x900').split('x').map(Number);
await page.setViewport({width: VW, height: VH, hasTouch: true});
const errors = [];
page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
page.on('console', m => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
await page.goto(URL, {waitUntil: 'networkidle2'});
await page.waitForFunction(() => window.__rfaCamera && document.querySelector('.rfaw.is-canvas'), {timeout: 20000});

// In the page: log every step and transition, and check every frame that the canvas shows the world.
await page.evaluate(() => {
  const log = window.__qa = {steps: [], moves: [], blanks: [], frames: 0};
  const cam = () => window.__rfaCamera;
  let hooked = null, cur = null;
  const hook = c => {
    if (hooked === c) return;
    hooked = c;
    const go = c.goStop.bind(c);
    c.goStop = (k, settle) => { log.steps.push({k, settle: !!settle, t: performance.now()}); return go(k, settle); };
  };
  const tick = () => {
    const c = cam();
    if (c) {
      hook(c);
      log.frames++;
      if (c.move && !cur) cur = {t0: performance.now(), dur: c.move.dur, soft: c.move.soft};
      if (!c.move && cur) { cur.t1 = performance.now(); log.moves.push(cur); cur = null; }
      const world = document.querySelector('.rfaw-world'), vp = document.querySelector('.rfaw-viewport');
      const k = c.cam, v = c.vp;
      const finite = k && [k.x, k.y, k.s].every(Number.isFinite) && k.s > .02;
      const where = c.where();
      // on the canvas (pinned), at least one frame overlaps the viewport
      let onScreen = 0;
      if (finite && v) for (const r of c.rects) {
        const L = (r.x - k.x) * k.s, T = (r.y - k.y) * k.s;
        if (L < v.w && T < v.h && L + r.w * k.s > 0 && T + r.h * k.s > 0) onScreen++;
      }
      const tf = world?.style.transform || '';
      const ok = world?.isConnected && vp?.isConnected && finite && !/NaN|Infinity/.test(tf) && (where !== 'on' || onScreen > 0);
      if (!ok && log.blanks.length < 20) log.blanks.push({t: performance.now(), tf, where, onScreen, cam: k && {...k}, mounted: !!document.querySelector('.rfaw')});
    } else if (log.blanks.length < 20 && !document.querySelector('.rfaw')) log.blanks.push({t: performance.now(), unmounted: true});
    requestAnimationFrame(tick);
  };
  tick();
});

const state = () => page.evaluate(() => {
  const c = window.__rfaCamera;
  const k = c.stops.findIndex(s => Math.abs(s.p - c.pt) < 1);
  return {pt: c.pt, total: c.total, stop: k, stops: c.stops.length, moving: !!c.move, free: !!c.free, where: c.where(), active: c.active,
    steps: window.__qa.steps.filter(s => !s.settle).length, settles: window.__qa.steps.filter(s => s.settle).length};
});
const idle = async (extra = 320) => {
  await page.waitForFunction(() => !window.__rfaCamera.move, {timeout: 8000, polling: 30});
  await sleep(extra);
};
const failures = [];
const expect = (cond, msg, data) => { if (!cond) failures.push(data ? `${msg} ${JSON.stringify(data)}` : msg); console.log(`${cond ? 'ok  ' : 'FAIL'} ${msg}`); };
const shot = async label => {
  const buf = await page.screenshot({type: 'png'});
  const {channels} = await sharp(buf).stats();
  const sd = channels.slice(0, 3).reduce((a, c) => a + c.stdev, 0) / 3;
  expect(sd > 6, `screenshot not blank (${label}, stdev ${sd.toFixed(1)})`);
};
const mouse = page.mouse;
await mouse.move(Math.round(VW * .6), Math.round(VH * .58));
await idle(600);   // the intro flight

// ---- one gesture, one stop ----
let s0 = await state();
await mouse.wheel({deltaY: 120});
await sleep(200);
let s1 = await state();
expect(s1.moving, 'a wheel notch starts a transition');
await idle();
s1 = await state();
expect(s1.steps - s0.steps === 1 && s1.stop >= 0, 'one notch = one step, resting on a stop', {s0, s1});

s0 = s1;
for (let i = 0; i < 30; i++) { await mouse.wheel({deltaY: 120}); await sleep(8); }
await idle();
s1 = await state();
expect(s1.steps - s0.steps === 1, 'a rapid burst of 30 notches = one step', {d: s1.steps - s0.steps});

s0 = s1;
{ let v = 70; for (let i = 0; i < 90; i++) { await mouse.wheel({deltaY: v}); v = Math.max(1, v * .955); await sleep(16); } }
await idle();
s1 = await state();
expect(s1.steps - s0.steps === 1, 'a trackpad flick with 1.5 s of momentum = one step', {d: s1.steps - s0.steps});

s0 = s1;
{ let v = 40; for (let i = 0; i < 220; i++) { await mouse.wheel({deltaY: v}); v = Math.max(.5, v * .985); await sleep(14); } }
await idle();
s1 = await state();
expect(s1.steps - s0.steps === 1, 'a long 3 s momentum tail = one step', {d: s1.steps - s0.steps});

s0 = s1;
await mouse.wheel({deltaY: 120});
await sleep(400);                                     // a new gesture (silence > 250 ms) while the transition runs
for (let i = 0; i < 12; i++) { await mouse.wheel({deltaY: 100}); await sleep(30); }
await idle();
s1 = await state();
expect(s1.steps - s0.steps === 1, 'a gesture during a running transition is swallowed', {d: s1.steps - s0.steps});

s0 = s1;
for (let i = 0; i < 3; i++) { await mouse.wheel({deltaY: 120}); await idle(); }
s1 = await state();
expect(s1.steps - s0.steps === 3 && s1.stop - s0.stop === 3, 'three gestures after the camera settles = three stops', {s0, s1});

s0 = s1;
await mouse.wheel({deltaY: -120}); await idle();
s1 = await state();
expect(s1.stop - s0.stop === -1, 'a gesture up = one stop back', {s0, s1});

// ---- durations ----
{
  const moves = await page.evaluate(() => window.__qa.moves.filter(m => m.soft));
  const paged = moves.slice(-8);
  const durs = paged.map(m => Math.round(m.t1 - m.t0));
  expect(paged.every(m => m.dur >= 1100 && m.dur <= 1400), 'every paging transition is planned at 1.1-1.4 s', paged.map(m => Math.round(m.dur)));
  expect(durs.every(d => d >= 1050 && d <= 1550), 'and takes about that long', durs);
}

// ---- keys ----
s0 = await state();
await page.keyboard.press('ArrowDown'); await idle();
await page.keyboard.press('PageDown'); await idle();
await page.keyboard.press(' '); await idle();
s1 = await state();
expect(s1.stop - s0.stop === 3, 'ArrowDown, PageDown and space each step one stop', {s0, s1});
s0 = s1;
await page.keyboard.press('ArrowUp'); await idle();
await page.keyboard.press('PageUp'); await idle();
s1 = await state();
expect(s1.stop - s0.stop === -2, 'ArrowUp and PageUp each step back one stop', {s0, s1});
s0 = s1;
await page.keyboard.down('ArrowDown'); for (let i = 0; i < 10; i++) { await sleep(40); await page.keyboard.down('ArrowDown'); } await page.keyboard.up('ArrowDown');
await idle();
s1 = await state();
expect(s1.stop - s0.stop === 1, 'holding ArrowDown (auto-repeat) steps once', {s0, s1});

// ---- touch ----
const swipe = async (dy, ms = 180) => {
  const ts = page.touchscreen, x = Math.round(VW * .62), y = Math.round(VH * .58), n = 8;
  await ts.touchStart(x, y);
  for (let i = 1; i <= n; i++) { await ts.touchMove(x + i, y + dy * i / n); await sleep(ms / n); }
  await ts.touchEnd();
};
s0 = await state();
await swipe(-160); await idle();
s1 = await state();
expect(s1.stop - s0.stop === 1, 'a swipe up steps one stop', {s0, s1});
await swipe(160); await idle();
const s2 = await state();
expect(s2.stop - s1.stop === -1, 'a swipe down steps one stop back', {s1, s2});

// ---- free camera: pinch-zoom detaches it, a wheel gesture brings it back ----
s0 = await state();
await page.keyboard.down('Control'); await mouse.wheel({deltaY: 100}); await page.keyboard.up('Control');
await sleep(100);
expect((await state()).free, 'ctrl + wheel zooms the free camera');
await sleep(400);
await mouse.wheel({deltaY: 120}); await idle();
s1 = await state();
expect(!s1.free && s1.stop === s0.stop, 'a plain wheel flies back to the story without stepping', {s0, s1});

// ---- the end of the canvas and back ----
await page.keyboard.press('End'); await idle();
s0 = await state();
expect(s0.stop === s0.stops - 1, 'End goes to the last stop', s0);
await mouse.wheel({deltaY: 300}); await sleep(500);
s1 = await state();
expect(s1.where === 'below', 'past the last stop, the wheel scrolls on to the page below', s1);
await mouse.wheel({deltaY: -600}); await sleep(400);
s1 = await state();
expect(s1.where === 'on' && s1.stop === s1.stops - 1, 'scrolling back up lands on the last stop', s1);
await page.keyboard.press('Home'); await idle();
expect((await state()).stop === 0, 'Home goes to the first stop');
await shot('after the scenarios');

// ---- the guard ----
await page.evaluate(() => { const c = window.__rfaCamera; c.cam = {x: NaN, y: Infinity, s: 0}; c.apply(); });
let tf = await page.evaluate(() => document.querySelector('.rfaw-world').style.transform);
expect(!/NaN|Infinity/.test(tf) && !/scale\(0\.0000/.test(tf), 'a broken camera is replaced before it is drawn', tf);
await page.evaluate(() => { window.__qaOff = window.__rfaCamera.subscribe(() => { throw new Error('qa: a listener that throws'); }); });
s0 = await state();
await mouse.wheel({deltaY: 120}); await idle();
s1 = await state();
expect(s1.stop - s0.stop === 1, 'a listener that throws does not stop the camera', {s0, s1});
await page.evaluate(() => window.__qaOff());

// ---- stress: hundreds of wheel events, every pattern at once ----
let events = 0;
const rnd = (a, b) => a + Math.random() * (b - a);
for (let round = 0; round < 14; round++) {
  const kind = round % 4;
  if (kind === 0) for (let i = 0; i < 40; i++) { await mouse.wheel({deltaY: (round % 3 ? 1 : -1) * rnd(60, 240)}); events++; await sleep(rnd(2, 12)); }
  if (kind === 1) { let v = rnd(40, 140); const d = round % 5 ? 1 : -1; for (let i = 0; i < 70 && v > .5; i++) { await mouse.wheel({deltaY: d * v}); events++; v *= .95; await sleep(16); } }
  if (kind === 2) for (let i = 0; i < 25; i++) { await mouse.wheel({deltaY: (i % 4 === 3 ? -1 : 1) * rnd(800, 3000)}); events++; await sleep(rnd(5, 60)); }
  if (kind === 3) for (let i = 0; i < 30; i++) { await mouse.wheel({deltaY: (Math.random() < .5 ? -1 : 1) * rnd(1, 400), deltaX: rnd(-20, 20)}); events++; await sleep(rnd(0, 300)); }
  if (round % 3 === 2) await shot(`stress round ${round}`);
}
// and while flights are running: a layer row, then wheel straight into it
for (let k = 0; k < 5; k++) {
  await page.evaluate(k => { const rows = [...document.querySelectorAll('a.rfaw-layer-row')]; rows[(k * 7 + 3) % rows.length]?.click(); }, k);
  for (let i = 0; i < 25; i++) { await mouse.wheel({deltaY: (k % 2 ? -1 : 1) * rnd(100, 600)}); events++; await sleep(10); }
}
await idle(800);
const end = await state();
const qa = await page.evaluate(() => ({blanks: window.__qa.blanks, frames: window.__qa.frames}));
console.log(`stress: ${events} wheel events, ${qa.frames} frames checked`);
expect(events >= 300, `at least 300 wheel events in the stress run (${events})`);
expect(qa.blanks.length === 0, 'the canvas never blanked (checked every frame)', qa.blanks.slice(0, 3));
expect(end.where !== 'on' || end.stop >= 0 || end.settles > 0, 'at rest on a stop after the stress run', end);
await shot('after the stress run');
expect(errors.filter(e => !e.includes('qa: a listener that throws') && !e.includes('canvas recovered from')).length === 0, 'no page errors', errors);

await browser.close();
console.log(failures.length ? `\n${failures.length} FAILED:\n${failures.join('\n')}` : '\nall passed');
process.exit(failures.length ? 1 : 0);
