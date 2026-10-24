// Local QA for /product/arden (site-spec/WORLD-ARDEN-V3.md and -V4.md): no lens overlay and no pill; the chapters'
// statements fill in with the scroll; the day's controls by keyboard and touch (directions, the sun slider and the tint,
// capture and its five-second clip, You / Them, the light slider, squeeze and hold, the timeline); charging by keyboard
// and touch; one pair on the turntable before and after a drag; fold and unfold (once rendered); the inside's part
// cards, path chips and signal path, and its 360° turn once rendered; reduced motion (statements still and complete, a
// list of stills, the controls still work); no sideways scroll on a phone; no console errors. Exit 1 on any failure.
//
//   node scripts/qa-arden-v4.mjs [url]        (default http://127.0.0.1:4393/product/arden, a running dev server)
//
// Uses the Arden prototype's puppeteer-core and the installed Chrome with a temporary profile, like
// capture-arden-screens.mjs; this repo gains no dependency.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import {fileURLToPath, pathToFileURL} from 'node:url';
const here = path.dirname(fileURLToPath(import.meta.url));
const protoDir = path.join(here, '../../../../视觉设计作品集/cases/d5-glasses/app');
const {default: puppeteer} = await import(pathToFileURL(path.join(protoDir, 'node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js')).href);
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const URL = process.argv[2] || 'http://127.0.0.1:4393/product/arden';
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'v4int-'));
const browser = await puppeteer.launch({executablePath: CHROME, headless: true, userDataDir: profile, args: ['--no-sandbox', '--remote-debugging-port=0']});
const sleep = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' · ' + extra : ''}`);
const run = async ({w, h, touch = false, reduced = false}) => {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
  await page.setViewport({width: w, height: h, deviceScaleFactor: touch ? 2 : 1, isMobile: touch, hasTouch: touch});
  if (reduced) await page.emulateMediaFeatures([{name: 'prefers-reduced-motion', value: 'reduce'}]);
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('jay-lang', 'en'); } catch {} });
  await page.goto(URL, {waitUntil: 'networkidle0', timeout: 90000});
  return {page, errors};
};
const glide = async (page, y) => { const cur = await page.evaluate(() => scrollY); const st = y > cur ? 200 : -200; for (let v = cur; st > 0 ? v < y : v > y; v += st) { await page.evaluate(x => window.scrollTo(0, x), v); await sleep(12); } await page.evaluate(x => window.scrollTo(0, x), y); await sleep(1000); };
// y for a scene of the day: the middle of its span
const dayY = (page, id) => page.evaluate(id => {
  const SP = [['putOn', 1.5], ['walk', 1.1], ['cafe', 1.3], ['sun', 1.6], ['park', 1.35], ['ask', 1.2], ['dinner', 1.5], ['case', .6]];
  const total = SP.reduce((a, [, d]) => a + d, 0);
  let start = 0; for (const [k, d] of SP) { if (k === id) { start += d * .55; break; } start += d; }
  const run = document.querySelector('.ar-day-run'), st = run.firstElementChild, top = parseFloat(getComputedStyle(st).top) || 0;
  return Math.round(run.getBoundingClientRect().top + scrollY - top + (start / total) * (run.offsetHeight - st.offsetHeight));
}, id);
const at = (page, sel, block = 'center') => page.evaluate((s, b) => document.querySelector(s)?.scrollIntoView({block: b}), sel, block);
const visibleGlasses = page => page.evaluate(() => [...document.querySelectorAll('.ar-turn-stage img, .ar-turn-stage canvas')]
  .filter(e => { const c = getComputedStyle(e), r = e.getBoundingClientRect(); return c.visibility !== 'hidden' && c.display !== 'none' && +c.opacity > .05 && r.width > 40; }).length);

try {
  // 1. desktop, keyboard
  {
    const {page, errors} = await run({w: 1440, h: 900});
    const gone = await page.evaluate(() => ({pov: !!document.querySelector('.ar-pov,.ar-glance'), pill: !!document.querySelector('.ar-wear-pill')}));
    ok('no lens overlay and no pill', !gone.pov && !gone.pill, JSON.stringify(gone));
    // the walk: the display counts down
    await glide(page, await dayY(page, 'walk'));
    const walk = await page.evaluate(() => document.querySelector('.ar-hud')?.textContent || '');
    ok('walk: the display shows directions', /\d+ m|Arrived/.test(walk), walk.slice(0, 60));
    // the statements: the problem's words are all in by the end of its pin
    {
      const y = await page.evaluate(() => { const r = document.querySelector('.ar-problem .ar-say-run'); return Math.round(r.getBoundingClientRect().top + scrollY + r.offsetHeight - innerHeight * .5); });
      await glide(page, y);
      const o = await page.evaluate(() => [...document.querySelectorAll('.ar-problem .ar-say-w')].map(w => +getComputedStyle(w).opacity));
      ok('statement: every word filled in by the end of the pin', o.length > 3 && Math.min(...o) > .95, o.map(v => v.toFixed(2)).join(' '));
    }
    // the sun: the slider raises the light and the lenses tint
    await glide(page, await dayY(page, 'sun'));
    await page.focus('.ar-day-range input'); await page.keyboard.press('End'); await sleep(500);
    const sunHud = await page.evaluate(() => document.querySelector('.ar-hud')?.textContent || '');
    ok('sun: full sun tints the lenses to 85%', /Tint 85% · auto/.test(sunHud), sunHud.slice(0, 60));
    await page.keyboard.press('Home'); await sleep(400);
    const shade = await page.evaluate(() => document.querySelector('.ar-hud')?.textContent || '');
    ok('sun: in the shade they clear', /Tint 0% · auto/.test(shade), shade.slice(0, 60));
    // the park: capture by keyboard (Enter on the control, then Space anywhere on the stage)
    await glide(page, await dayY(page, 'park'));
    await page.focus('.ar-hw.is-capture'); await page.keyboard.press('Enter'); await sleep(1300);
    let cap = await page.evaluate(() => ({pressed: document.querySelector('.ar-hw.is-capture')?.getAttribute('aria-pressed'), hud: document.querySelector('.ar-hud')?.textContent || ''}));
    ok('park: Enter on the capture control records', cap.pressed === 'true' && /0:0\d/.test(cap.hud), JSON.stringify(cap).slice(0, 120));
    await sleep(5000);
    cap = await page.evaluate(() => ({pressed: document.querySelector('.ar-hw.is-capture')?.getAttribute('aria-pressed'), hud: document.querySelector('.ar-hud')?.textContent || ''}));
    ok('park: the clip stops at five seconds and is saved', cap.pressed === 'false', cap.hud.slice(0, 80));
    // You / Them by arrow key
    await page.focus('.ar-day-caption .ar-sides [data-side=you]'); await page.keyboard.press('ArrowRight'); await sleep(500);
    const them = await page.evaluate(() => ({side: document.querySelector('.ar-day-caption .ar-sides [aria-checked=true]')?.dataset.side, slider: !!document.querySelector('.ar-day-range input')}));
    ok('park: arrow key flips to Them, with the light slider', them.side === 'them' && them.slider, JSON.stringify(them));
    if (them.slider) {
      await page.focus('.ar-day-range input'); for (let i = 0; i < 30; i++) await page.keyboard.press('ArrowRight');
      const out = await page.evaluate(() => document.querySelector('.ar-day-out')?.textContent || '');
      ok('park: the slider moves the indicator estimate', /cd\/m²/.test(out), out);
    }
    await page.focus('.ar-day-caption .ar-sides [data-side=them]'); await page.keyboard.press('ArrowLeft'); await sleep(300);
    // the ask: squeeze and hold with the keyboard
    await glide(page, await dayY(page, 'ask'));
    await page.focus('.ar-hw.is-squeeze'); await page.keyboard.down('Space'); await sleep(1300); await page.keyboard.up('Space'); await sleep(600);
    const ask = await page.evaluate(() => document.querySelector('.ar-hud')?.textContent || '');
    ok('ask: holding Space on the squeeze answers', /Japanese maple/.test(ask), ask.slice(0, 80));
    // the timeline: a stop takes you to its scene
    await page.focus('button.ar-day-stop:nth-of-type(2)'); await page.keyboard.press('Enter'); await sleep(2600);
    const cur = await page.evaluate(() => document.querySelector('.ar-day-stop[aria-current]')?.textContent || '');
    ok('timeline: Enter on 10:30 goes to the café', /10:30/.test(cur), cur);
    // charging: the button, then the numbers
    await at(page, '#ar-charge .ar-btn'); await sleep(800);
    await page.focus('#ar-charge .ar-btn'); await page.keyboard.press('Enter'); await sleep(4200);
    const ch = await page.evaluate(() => ({seated: !!document.querySelector('.ar-charge-stage[data-seated]'), nums: [...document.querySelectorAll('.ar-charge-bat-val b')].map(b => b.textContent), real: !!document.querySelector('.ar-charge-stage.is-real')}));
    ok('charging: Enter seats them and counts to 100 / 74', ch.seated && ch.nums.join() === '100%,74%', JSON.stringify(ch));
    // the turntable: one pair, before and after a drag
    await at(page, '.ar-turn-stage'); await sleep(1500);
    let g = await visibleGlasses(page);
    const box = await page.$eval('.ar-turn-stage', e => { const r = e.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; });
    await page.mouse.move(box.x, box.y); await page.mouse.down(); await page.mouse.move(box.x + 220, box.y, {steps: 8}); await page.mouse.up(); await sleep(900);
    const g2 = await visibleGlasses(page);
    ok('turntable: one pair of glasses, before and after a drag', g === 1 && g2 === 1, `${g} / ${g2}`);
    // the inside: a number by keyboard opens its card; a chip lights a path
    await at(page, '.ar-xp-run', 'start');
    const xpEnd = await page.evaluate(() => { const r = document.querySelector('.ar-xp-run'), st = r.firstElementChild; return Math.round(r.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(st).top) || 0) + .95 * (r.offsetHeight - st.offsetHeight)); });
    await glide(page, xpEnd); await sleep(600);
    await page.focus('button.ar-xp-n'); await sleep(300);
    const card = await page.evaluate(() => document.querySelector('.ar-xp-card')?.textContent || '');
    ok('inside: focusing a number shows its card', /mm/.test(card), card.slice(0, 60));
    await page.click('.ar-xp-chip'); await sleep(300);
    const chip = await page.evaluate(() => ({pressed: document.querySelector('.ar-xp-chip')?.getAttribute('aria-pressed'), dim: document.querySelectorAll('.ar-xp-pieces img[data-dim]').length || document.querySelectorAll('.ar-xp-n[data-on]').length}));
    ok('inside: the power chip lights its path', chip.pressed === 'true' && chip.dim > 0, JSON.stringify(chip));
    // the cutaway: the signal path
    await at(page, '.ar-cut-fire'); await sleep(600);
    await page.focus('.ar-cut-fire'); await page.keyboard.press('Enter'); await sleep(3500);
    const sig = await page.evaluate(() => { const e = document.querySelector('.ar-sig-text'); return e ? {text: e.textContent, o: getComputedStyle(e).opacity} : null; });
    ok('cutaway: the signal path ends on the interlock line', sig && /No light, no camera/.test(sig.text) && +sig.o > .5, JSON.stringify(sig).slice(0, 90));
    // fold and unfold, once the fold is rendered
    if (await page.$('.ar-fold-stage')) {
      await at(page, '.ar-fold-stage'); await sleep(900);
      await page.click('.ar-fold .ar-btn'); await sleep(1600);
      const folded = await page.evaluate(() => document.querySelector('.ar-fold-stage').getAttribute('aria-valuenow'));
      await page.focus('.ar-fold-stage'); await page.keyboard.press('Home'); await sleep(300);
      const open = await page.evaluate(() => document.querySelector('.ar-fold-stage').getAttribute('aria-valuenow'));
      ok('fold: the button folds them, Home opens them', folded === '100' && open === '0', `${folded} / ${open}`);
    } else ok('fold: not rendered yet, nothing shown', !(await page.$('.ar-fold')));
    // the exploded view turns once it's apart (when rendered)
    if (await page.$('.ar-xp-stage')) {
      const end = await page.evaluate(() => { const r = document.querySelector('.ar-xp-run'), st = r.firstElementChild; return Math.round(r.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(st).top) || 0) + .9 * (r.offsetHeight - st.offsetHeight)); });
      await glide(page, end); await sleep(800);
      const b = await page.$eval('.ar-xp-stage', el => { const r = el.getBoundingClientRect(); return {x: r.left + r.width * .3, y: r.top + r.height * .5, w: r.width}; });
      await page.mouse.move(b.x, b.y); await page.mouse.down(); await page.mouse.move(b.x + b.w * .25, b.y, {steps: 10}); await page.mouse.up(); await sleep(1500);
      const sp = await page.evaluate(() => ({deg: document.querySelector('.ar-xp-stage').getAttribute('aria-valuenow'), shown: [...document.querySelectorAll('.ar-xp-n.is-ride')].filter(n => +getComputedStyle(n).opacity > .2).length}));
      ok('inside: a drag turns the exploded view, numbers ride along', sp.deg !== '0' && sp.shown > 3, JSON.stringify(sp));
    }
    ok('no console errors (desktop)', !errors.length, errors.join(' | '));
    await page.close();
  }
  // 2. phone, touch
  {
    const {page, errors} = await run({w: 390, h: 844, touch: true});
    await glide(page, await dayY(page, 'park'));
    const tap = async sel => { const c = await page.$eval(sel, el => { const r = el.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; }); await page.touchscreen.tap(c.x, c.y); };
    await tap('.ar-hw.is-capture'); await sleep(1300);
    const p = await page.evaluate(() => document.querySelector('.ar-hw.is-capture')?.getAttribute('aria-pressed'));
    ok('phone: tap on the capture control records', p === 'true', p);
    await tap('.ar-day-caption .ar-sides [data-side=them]'); await sleep(500);
    const s = await page.evaluate(() => document.querySelector('.ar-day-caption .ar-sides [aria-checked=true]')?.dataset.side);
    ok('phone: tap flips to Them', s === 'them', s);
    await tap('button.ar-day-stop:nth-of-type(6)'); await sleep(2600);
    const cur = await page.evaluate(() => document.querySelector('.ar-day-stop[aria-current]')?.getAttribute('aria-label') || '');
    ok('phone: tap on a timeline dot goes to its scene', /20:15/.test(cur), cur);
    await at(page, '#ar-charge .ar-btn'); await sleep(700);
    await tap('#ar-charge .ar-btn'); await sleep(4200);
    const nums = await page.evaluate(() => [...document.querySelectorAll('.ar-charge-bat-val b')].map(b => b.textContent).join());
    ok('phone: tap puts them in the case', nums === '100%,74%', nums);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    ok('phone: no sideways scroll', sw <= 390, String(sw));
    ok('no console errors (phone)', !errors.length, errors.join(' | '));
    await page.close();
  }
  // 3. reduced motion
  {
    const {page, errors} = await run({w: 1440, h: 900, reduced: true});
    const r = await page.evaluate(() => ({list: !!document.querySelector('.ar-day.is-list'), stills: document.querySelectorAll('.ar-day-still').length, canvas: !!document.querySelector('.ar-film-canvas, .ar-day-film')}));
    ok('reduced: the day is a list of stills, no film', r.list && r.stills >= 6 && !r.canvas, JSON.stringify(r));
    const still = await page.evaluate(() => ({pinned: [...document.querySelectorAll('.ar-say-pin')].some(p => getComputedStyle(p).position === 'sticky'),
      faint: [...document.querySelectorAll('.ar-say-w, .ar-rw-w')].filter(w => +getComputedStyle(w).opacity < .99).length}));
    ok('reduced: statements and headings still and complete', !still.pinned && !still.faint, JSON.stringify(still));
    await at(page, '.ar-day .ar-hw.is-capture'); await sleep(500);
    await page.click('.ar-day .ar-hw.is-capture'); await sleep(600);
    const p = await page.evaluate(() => document.querySelector('.ar-day .ar-hw.is-capture')?.getAttribute('aria-pressed'));
    ok('reduced: the capture control still works', p === 'true', p);
    await at(page, '#ar-charge .ar-btn'); await sleep(400);
    await page.click('#ar-charge .ar-btn'); await sleep(400);
    const nums = await page.evaluate(() => [...document.querySelectorAll('.ar-charge-bat-val b')].map(b => b.textContent).join());
    ok('reduced: charging swaps at once', nums === '100%,74%', nums);
    ok('no console errors (reduced)', !errors.length, errors.join(' | '));
    await page.close();
  }
} finally { await browser.close(); fs.rmSync(profile, {recursive: true, force: true}); }
console.log(results.join('\n'));
if (results.some(r => r.startsWith('FAIL'))) process.exitCode = 1;
