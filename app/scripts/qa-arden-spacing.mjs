// Reviewer check: node app/scripts/qa-arden-spacing.mjs <baseUrl>
// Accepts an origin or the complete /product/arden URL. No screenshots are required.
import {createRequire} from 'node:module';

if (process.argv.includes('--help')) {
  console.log('node app/scripts/qa-arden-spacing.mjs <baseUrl>\nChecks 390, 768, 1280, 1440, 1920, 2560 in light and dark, plus both orbit viewers.');
  process.exit(0);
}
// Prefer an app installation; the shared portfolio tooling also provides playwright-core.
let chromium;
for (const location of ['../package.json', '../../../../视觉设计作品集/site/package.json', '../../../../视觉设计作品集/videos/tools/package.json']) {
  try { ({chromium} = createRequire(new URL(location, import.meta.url))('playwright-core')); break; } catch { /* next installation */ }
}
if (!chromium) throw new Error('playwright-core is required. Install it in app/ with npm install --save-dev playwright-core.');
const url = new URL(process.argv[2] || 'http://127.0.0.1:4316');
if (url.pathname === '/') url.pathname = '/product/arden';
const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
const failures = new Set();
const assert = (condition, message) => { if (!condition) failures.add(message); };
const settle = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

async function inspect(page, label) {
  const issues = await page.evaluate(() => {
    const issues = [], root = document.querySelector('.ar');
    const width = innerWidth, edge = Math.max(20, Math.min(width * .032, 56));
    const contentLeft = root.getBoundingClientRect().left + Math.max(edge, (root.getBoundingClientRect().width - 1440) / 2);
    const rect = e => e.getBoundingClientRect();
    const describe = e => `${e.tagName.toLowerCase()}.${String(e.className).replaceAll(' ', '.')} “${e.textContent.trim().slice(0, 48)}”`;
    // Compare what is actually painted: clip scrollable nav links and media containers, but never exempt overlays.
    const visibleRect = e => {
      const r = rect(e), box = {left:r.left, right:r.right, top:Math.max(0,r.top), bottom:Math.min(innerHeight,r.bottom)};
      for (let n = e; n; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) < .02 || n.hidden) return null;
        if (n !== e) {
          const p = rect(n);
          if (/(hidden|clip|auto|scroll)/.test(s.overflowX)) { box.left = Math.max(box.left,p.left); box.right = Math.min(box.right,p.right); }
          if (/(hidden|clip|auto|scroll)/.test(s.overflowY)) { box.top = Math.max(box.top,p.top); box.bottom = Math.min(box.bottom,p.bottom); }
        }
      }
      return box.right > box.left && box.bottom > box.top ? box : null;
    };
    const intersects = (a,b) => Math.min(a.right,b.right)-Math.max(a.left,b.left) > 1 && Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top) > 1;
    const skipText = e => {
      for (let n = e; n; n = n.parentElement) {
        const s = getComputedStyle(n), box = rect(n);
        if (box.width <= 1 || box.height <= 1) return true;
        const clip = s.clip.match(/^rect\((.*)\)$/);
        if (clip) {
          const [top, right, bottom, left] = clip[1].split(/[,\s]+/).map(parseFloat);
          if (right <= left || bottom <= top) return true;
        }
        const inset = s.clipPath.match(/^inset\(([^)]*?)(?:\s+round\s+.*)?\)$/);
        if (inset) {
          const values = inset[1].trim().split(/\s+/);
          const [t, r = t, b = t, l = r] = values;
          const pixels = (v, size) => parseFloat(v) * (v.endsWith('%') ? size / 100 : 1);
          if (pixels(t, box.height) + pixels(b, box.height) >= box.height ||
              pixels(l, box.width) + pixels(r, box.width) >= box.width) return true;
        }
        if (n !== e && /(auto|scroll)/.test(s.overflowX) && n.scrollWidth > n.clientWidth) return true;
      }
      return false;
    };
    const logo = document.querySelector('.v16-wordmark'), right = document.querySelector('.v16-navigation .sm-toggle');
    const local = root.querySelector('.ar-local-in'), nav = root.querySelector('.ar-local');
    if (!logo || !right || !local) issues.push('site/case navigation missing');
    else {
      if (Math.abs(rect(local.firstElementChild).left - rect(logo).left) > 1) issues.push('case wordmark does not align with site logo');
      if (Math.abs(rect(local.lastElementChild).right - rect(right).right) > 1) issues.push('case navigation right edge does not align with site header');
      if (Math.abs(rect(local.firstElementChild).left - edge) > 1) issues.push('case wordmark does not use --edge');
    }
    for (const h of root.querySelectorAll('.ar-chapter h2')) {
      if (rect(h).width && Math.abs(rect(h).left - contentLeft) > 1) issues.push(`${describe(h)}: heading is not at content left ${contentLeft}`);
    }
    for (const e of root.querySelectorAll('*')) {
      if (e.closest('.ar-sr,svg,canvas,iframe') || skipText(e) || !visibleRect(e)) continue;
      // Descendant text (including sr-only spans) belongs to its own element's check.
      const textRects = [...e.childNodes].filter(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()).flatMap(n => {
        const range = document.createRange(); range.selectNodeContents(n);
        return [...range.getClientRects()].filter(r => r.width > 0 && r.height > 0);
      });
      const r = textRects.length ? {
        left: Math.min(...textRects.map(r => r.left)), right: Math.max(...textRects.map(r => r.right)),
        top: Math.min(...textRects.map(r => r.top)), bottom: Math.max(...textRects.map(r => r.bottom)),
      } : null;
      if (r && (r.left < edge - 1 || r.right > width - edge + 1)) issues.push(`${describe(e)}: text outside safe area (${r.left.toFixed(1)}, ${r.right.toFixed(1)})`);
    }
    const pills = [...root.querySelectorAll('.ar-check-mark,.ar-xp-chip,.ar-btn,.ar-seg-opt,.ar-facts > li,.ar-day-sound')];
    for (let i = 0; i < pills.length; i++) for (let j = i + 1; j < pills.length; j++) {
      if (pills[i].parentElement !== pills[j].parentElement) continue;
      const a = visibleRect(pills[i]), b = visibleRect(pills[j]);
      if (a && b && intersects(a,b)) issues.push(`overlapping pills: ${describe(pills[i])} / ${describe(pills[j])}`);
    }
    const navBox = rect(nav);
    for (const e of root.querySelectorAll('.ar-day-ai:not(.is-list),.ar-film-kind,.ar-film-hint,.ar-toprow,.ar-day-hud-wrap')) {
      const r = visibleRect(e), stage = e.closest('.ar-day-stage,.ar-film');
      // A departing stage can scroll behind the opaque nav; check the stage while it owns the pinned viewport.
      if (r && stage && rect(stage).top >= navBox.bottom - 1 && intersects(r,navBox)) issues.push(`overlay intersects case nav: ${describe(e)}`);
    }
    const check = root.querySelector('.ar-check-panel');
    if (check && visibleRect(check)) {
      const children = [...check.children], s = getComputedStyle(check);
      if (s.paddingTop !== '20px' || s.paddingLeft !== '20px') issues.push('Hearing panel padding is not 20px');
      for (let i = 1; i < children.length; i++) if (Math.abs(rect(children[i]).top - rect(children[i-1]).bottom - 16) > 1) issues.push('Hearing panel rhythm is not 16px');
      const bars = [...check.querySelectorAll('.ar-check-bars span')].map(rect);
      if (bars.some(b => Math.abs(b.bottom - bars[0].bottom) > 1 || b.height < 1.9)) issues.push('Hearing chart baseline/ticks are uneven');
      for (const chip of check.querySelectorAll('.ar-check-mark')) if (Math.abs(rect(chip).height - 28) > 1) issues.push('Hearing chip height is not 28px');
    }
    if (document.documentElement.scrollWidth > width + 1) issues.push('horizontal page overflow');
    return issues;
  });
  issues.forEach(i => failures.add(`${label}: ${i}`));
}

async function checkOrbit(page, kind, label) {
  const selector = `[data-orbit="${kind}"]`;
  if (kind === 'exploded') await page.locator('.ar-xp-run').evaluate(e => {
    const pin = e.firstElementChild, y = e.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(pin).top) + (e.offsetHeight - pin.offsetHeight) * .92;
    window.scrollTo({top:y, behavior:'instant'});
  });
  else await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForFunction(s => document.querySelector(s)?.dataset.ready === 'true', selector, {timeout: 90_000});
  const viewer = page.locator(selector);
  await viewer.scrollIntoViewIfNeeded();
  await viewer.focus();
  for (const [key, frame] of [['Home','e12_a000'], ['ArrowLeft','e12_a350'], ['ArrowRight','e12_a000'], ['ArrowUp','e25_a000'], ['ArrowDown','e12_a000']]) {
    await page.keyboard.press(key);
    await page.waitForFunction(({s,f}) => document.querySelector(s)?.dataset.frame === f, {s:selector,f:frame});
  }
  for (let i=0;i<12;i++) await page.keyboard.press('ArrowDown');
  await page.waitForFunction(s => document.querySelector(s)?.dataset.frame === 'e-30_a000',selector);
  for (let i=0;i<12;i++) await page.keyboard.press('ArrowUp');
  await page.waitForFunction(s => document.querySelector(s)?.dataset.frame === 'e70_a000',selector);
  await page.keyboard.press('Home');
  await page.waitForFunction(s => document.querySelector(s)?.dataset.frame === 'e12_a000',selector);
  // focusing the viewer can scroll the pinned section out of its spin state; return to it before dragging
  if (kind === 'exploded') { await page.locator('.ar-xp-run').evaluate(e => {
    const pin = e.firstElementChild, y = e.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(pin).top) + (e.offsetHeight - pin.offsetHeight) * .92;
    window.scrollTo({top:y, behavior:'instant'});
  }); await page.waitForFunction(s => document.querySelector(s)?.classList.contains('is-spin'), selector); }
  const b = await viewer.boundingBox();
  await page.mouse.move(b.x+b.width*.5,b.y+b.height*.5);
  await page.mouse.down();
  await page.mouse.move(b.x+b.width*.65,b.y+b.height*.35,{steps:12});
  await page.waitForTimeout(150);
  // read while still held: after release, inertia can wrap the azimuth back to a000 by chance
  let f = await viewer.getAttribute('data-frame');
  await page.mouse.up();
  if (f === 'e12_a000') {
    // A pinned section can still be settling after the theme/keyboard passes; retry once from a fresh position.
    await page.waitForTimeout(600);
    const c = await viewer.boundingBox();
    await page.mouse.move(c.x+c.width*.5,c.y+c.height*.5); await page.mouse.down();
    await page.mouse.move(c.x+c.width*.65,c.y+c.height*.35,{steps:12}); await page.waitForTimeout(150);
    f = await viewer.getAttribute('data-frame'); await page.mouse.up();
  }
  await page.waitForTimeout(1800);
  assert(!f.startsWith('e12_') && !f.endsWith('a000'),`${label}: ${kind} diagonal drag did not move both axes (${f})`);
  if (kind === 'exploded') {
    const anchors = await page.evaluate(async () => {
      const e = document.querySelector('[data-orbit="exploded"]'), mobile = matchMedia('(max-width: 760px)').matches;
      const data = await (await fetch(`/assets/product/arden/seq/orbit-exploded${mobile?'-m':''}/parts.json`)).json();
      const frame = data.frames.find(f => f.file === `${e.dataset.frame}.png`);
      return [...e.querySelectorAll('.ar-xp-n')].every((button,i) => {
        const a = Object.values(frame.parts).find(a => a.n === i+1);
        return !!a && Math.abs(parseFloat(button.style.left)-a.x_pct)<.01 && Math.abs(parseFloat(button.style.top)-a.y_pct)<.01 && (Number(button.style.opacity)>0) === a.visible;
      });
    });
    assert(anchors,`${label}: hotspot anchors/visibility do not match the displayed frame`);
  }
  if (page.viewportSize().width === 390) {
    await viewer.focus(); await page.keyboard.press('Home');
    await page.waitForFunction(s => document.querySelector(s)?.dataset.frame === 'e12_a000',selector);
    const point = await viewer.evaluate(e => {
      const canvas = e.querySelector('canvas'), r = canvas.getBoundingClientRect(), ctx = canvas.getContext('2d');
      // Use a real opaque pixel and avoid the hotspot buttons, rather than assume the object fills its image.
      for (let y=.25;y<.75;y+=.025) for (let x=.2;x<.8;x+=.025) {
        const sx=r.left+x*r.width, sy=r.top+y*r.height;
        if (ctx.getImageData(Math.floor(x*canvas.width),Math.floor(y*canvas.height),1,1).data[3]>100 && document.elementFromPoint(sx,sy)===canvas) return {x:sx,y:sy};
      }
      return null;
    });
    assert(point,`${label}: ${kind} has no opaque object pixels to test touch`);
    if (point) {
      const cdp = await page.context().newCDPSession(page);
      const touch = (type,p) => cdp.send('Input.dispatchTouchEvent',{type,touchPoints:p?[{...p,id:1}]:[]});
      await touch('touchStart',point);
      await page.waitForTimeout(220);
      for (let i=1;i<=6;i++) { await touch('touchMove',{x:point.x,y:point.y-i*10}); await page.waitForTimeout(20); }
      await touch('touchEnd');
      await page.waitForTimeout(1800);
      assert(!(await viewer.getAttribute('data-frame')).startsWith('e12_'),`${label}: ${kind} deliberate touch tilt did not change elevation`);
      await viewer.focus(); await page.keyboard.press('Home');
      await page.waitForFunction(s => document.querySelector(s)?.dataset.frame === 'e12_a000',selector);
      const before = await page.evaluate(() => scrollY);
      await touch('touchStart',point);
      for (let i=1;i<=6;i++) await touch('touchMove',{x:point.x+1,y:point.y-i*12});
      await touch('touchEnd'); await settle(page);
      assert(await page.evaluate(() => scrollY) > before+30,`${label}: ${kind} mostly vertical swipe did not scroll the page`);
      assert((await viewer.getAttribute('data-frame'))==='e12_a000',`${label}: ${kind} page swipe rotated the object`);
      await cdp.detach();
    }
  }
}

try {
  for (const width of [390,768,1280,1440,1920,2560]) for (const theme of ['light','dark']) {
    const label = `${width} ${theme}`;
    const context = await browser.newContext({viewport:{width,height:900},colorScheme:theme,hasTouch:width===390});
    const page = await context.newPage();
    page.on('pageerror',e => failures.add(`${label}: ${e.message}`));
    await context.addInitScript(theme => { localStorage.setItem('jay-lang','en'); localStorage.setItem('jl-case-theme',theme); },theme);
    try {
      await page.goto(url.href,{waitUntil:'domcontentloaded'});
      await page.waitForSelector('.ar-chapter');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(800);
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y=0;y<height;y+=600) {
        await page.evaluate(y => scrollTo({top:y,behavior:'instant'}),y);
        await settle(page);
        await inspect(page,label);
      }
      // Explicitly exercise each mounted day scene, including its late Hearing Check-in state.
      const spans = [1.5,1.1,1.3,1.6,1.35,1.2,1.5,.6], total = spans.reduce((a,b)=>a+b,0);
      let start = 0;
      for (const span of spans) {
        const progress = (start + span * .85) / total; start += span;
        await page.locator('.ar-day-run').evaluate((e,p) => {
          const stage=e.firstElementChild;
          scrollTo({top:e.getBoundingClientRect().top+scrollY-parseFloat(getComputedStyle(stage).top)+p*(e.offsetHeight-stage.offsetHeight),behavior:'instant'});
        },progress);
        await page.waitForTimeout(300);
        await inspect(page,label);
      }
      for (const kind of ['assembled','exploded']) await checkOrbit(page,kind,label);
      console.log(`Checked ${label}`);
    } catch (e) { failures.add(`${label}: ${e.message}`); }
    finally { await context.close(); }
  }
} finally { await browser.close(); }
if (failures.size) { console.error([...failures].map(s=>`FAIL ${s}`).join('\n')); process.exitCode=1; }
else console.log('PASS: Arden spacing, panels, overlays and both two-axis viewers at all six widths in both themes.');
