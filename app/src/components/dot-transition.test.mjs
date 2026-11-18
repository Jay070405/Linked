import test from 'node:test';
import assert from 'node:assert/strict';
import {createDotTransition, placeOf} from './dot-transition.js';

// A page with no canvas context and a clock driven by hand: enough to check the order of things, not the picture.
function harness({reduced = false, hidden = false, frames = true} = {}) {
  const classes = new Set(), listeners = new Map(), painted = [];
  let now = 0, queue = [], timers = [];
  const win = {
    innerWidth: 1200, innerHeight: 800, devicePixelRatio: 1, location: {pathname: '/systems/roco', hash: ''},
    performance: {now: () => now}, sessionStorage: {getItem: () => null},
    requestAnimationFrame: frames ? fn => (queue.push(fn), queue.length) : fn => (void fn, 0), cancelAnimationFrame() {},
    setTimeout: (fn, ms) => (timers.push({fn, at: now + ms}), timers.length), clearTimeout(id) { if (timers[id - 1]) timers[id - 1].fn = null; },
  };
  const g = new Proxy({}, {get: (_, k) => (k === 'fillText' ? text => painted.push(text) : () => {}), set: () => true});
  const canvas = {width: 0, height: 0, getContext: () => g};
  const doc = {activeElement: null, hidden, defaultView: win, addEventListener: (e, fn) => listeners.set(e, fn), removeEventListener: e => listeners.delete(e)};
  const element = () => ({isConnected: true, focus() { doc.activeElement = this; }});
  const source = element(), node = Object.assign(element(), {classList: {add: c => classes.add(c), remove: c => classes.delete(c)}, querySelector: () => canvas, addEventListener() {}, removeEventListener() {}});
  doc.activeElement = source;
  // let time pass: frames and timers that are due run, in order, until `ms` has gone by
  const pass = async ms => { const end = now + ms; while (now < end) { now += 16; const due = queue; queue = []; due.forEach(fn => fn(now)); timers.forEach(t => { if (t.fn && t.at <= now) { const fn = t.fn; t.fn = null; fn(); } }); for (let i = 0; i < 8; i++) await Promise.resolve(); } };
  return {classes, listeners, painted, doc, node, source, win, pass, controller: createDotTransition(node, () => reduced, doc)};
}

test('covers the page, changes it underneath, names the place, then uncovers it', async () => {
  const h = harness(); let committedAt = null, t = 0;
  const done = h.controller.run(() => { committedAt = t; });
  await h.pass(200); t = 200;
  assert.ok(h.classes.has('is-active'));
  assert.equal(committedAt, null, 'the page must not change before the dots have covered it');
  await h.pass(400); t = 600;
  assert.equal(committedAt, 200, 'the page changes once it is covered');
  await h.pass(1200); await done;
  assert.ok(h.painted.includes('SYSTEMS') && h.painted.includes('ROCO'), 'the cover says where the visitor has arrived');
  assert.equal(h.classes.has('is-active'), false);
  assert.equal(h.doc.activeElement, h.source, 'focus goes back to where it was');
});

test('only the newest of several requests commits', async () => {
  const h = harness(), seen = [];
  const first = h.controller.run(async isCurrent => { seen.push(['first', isCurrent()]); });
  h.controller.run(async isCurrent => { seen.push(['second', isCurrent()]); });
  await h.pass(2000); await first;
  assert.deepEqual(seen, [['second', true]]);
});

test('reduced motion and a background tab change the page at once', async () => {
  for (const options of [{reduced: true}, {hidden: true}]) {
    const h = harness(options); let committed = false;
    await h.controller.run(() => { committed = true; });
    assert.equal(committed, true);
    assert.equal(h.classes.has('is-active'), false);
  }
});

test('a page that stops getting frames still finishes its navigation', async () => {
  const h = harness({frames: false}); let committed = false;
  const done = h.controller.run(() => { committed = true; });
  await h.pass(4000); await done;
  assert.equal(committed, true);
  assert.equal(h.classes.has('is-active'), false);
});

test('the cover is labelled by the part of the site', () => {
  assert.deepEqual(placeOf('/product/atelier'), {label: 'PRODUCT', sub: 'ATELIER'});
  assert.deepEqual(placeOf('/systems/league-of-legends/'), {label: 'SYSTEMS', sub: 'LEAGUE OF LEGENDS'});
  assert.deepEqual(placeOf('/works'), {label: 'ART', sub: ''});
  assert.deepEqual(placeOf('/about'), {label: 'ABOUT', sub: ''});
  assert.deepEqual(placeOf('/', '#contact'), {label: 'HELLO', sub: ''});
  assert.deepEqual(placeOf('/', '#home'), {label: 'JL-01', sub: ''});
});
