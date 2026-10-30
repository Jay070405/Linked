import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import './lf-demo.css';
import {ADDRESS, BASE, GARAGE_GATE, GARAGE_PHOTO, GATE, GEOFENCE_FT, HOLD_MS, LEGS, REVEAL_SECONDS, STEPS, TOTAL_FEET, WAYPOINTS} from '../../product/v2/data/l100-route.js';

/* Last 100 Feet, hands on. Map apps drop 1450 Elm St on the residents-only garage gate; Dana maps the way in once
   (curb, gate, Building 4, stairs, door 214, one photo per step) and every courier follows it. The visitor flips from
   the map app's pin to Dana's route, then walks the courier along it: the slider, dragging the dot, or Walk it (the
   whole route in about 6 s at one steady pace, with minimum-jerk ramps only at the two ends). Cards show each step's
   photo and the prototype's own words; the gate code shows only near the gate, after a hold, and hides after 20 s.

   Geometry is the prototype's (v2/data/l100-route.js): the basemap covers BASE, one plan unit is about a foot, and
   each leg is walked in proportion to its displayed feet. The courier, pin and slider thumb are written per frame
   from one requestAnimationFrame loop, by transform only; React renders only when a discrete state changes. */

const PLAN_SRC = '/assets/product/last-100-feet/plan-base.webp';
/** The part of the basemap on screen: all of BASE except the empty road strip along its bottom edge. */
const VIEW = {x: BASE.x, y: BASE.y, w: BASE.w, h: 490};
const ZONE_R = GEOFENCE_FT;              // the product's geofence around the Elm St gate: 160 ft (one plan unit is about a foot)
const WALK_S = 6, RAMP_S = .7;           // Walk it: the whole route in ~6 s, with 0.7 s ramps at the two ends
const STEP_S = 1;                        // reduced motion: Walk it jumps one waypoint per second
const PIN_S = .72, PIN_LIFT = 30, REVEAL_DELAY = .3;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const same = (p, q) => Math.abs(p.x - q.x) < 1e-9 && Math.abs(p.y - q.y) < 1e-9;

/* ---------- the route ---------- */

/** Leg i's polyline, snapped so it starts and ends exactly on its waypoints (the data's curb and Building 4 markers
    sit a few units off the drawn legs, on the same lines): add the waypoint, drop repeats and any point that would
    double back on itself. */
function legPoints(i) {
  const out = [];
  for (const p of [WAYPOINTS[i].at, ...LEGS[i].pts, WAYPOINTS[i + 1].at]) if (!out.length || !same(out[out.length - 1], p)) out.push(p);
  for (let k = 1; k < out.length - 1;) {
    const a = out[k - 1], b = out[k], c = out[k + 1];
    const ux = b.x - a.x, uy = b.y - a.y, vx = c.x - b.x, vy = c.y - b.y;
    if (Math.abs(ux * vy - uy * vx) < 1e-9 && ux * vx + uy * vy < 0) { out.splice(k, 1); k = Math.max(1, k - 1); } else k++;
  }
  return out;
}
const GEO = LEGS.map((leg, i) => {
  const pts = legPoints(i), segs = pts.slice(1).map((p, k) => Math.hypot(p.x - pts[k].x, p.y - pts[k].y));
  return {pts, segs, len: segs.reduce((s, l) => s + l, 0), d: `M${pts.map(p => `${p.x} ${p.y}`).join(' L')}`};
});
/** where each waypoint sits along the drawn route (plan units) and along the walk (feet: 0, 45, 170, 195, 290) */
const U_AT = GEO.reduce((acc, g) => [...acc, acc[acc.length - 1] + g.len], [0]);
const F_AT = LEGS.reduce((acc, l) => [...acc, acc[acc.length - 1] + l.feet], [0]);
const U_END = U_AT[U_AT.length - 1];
const legAt = u => { let i = 0; while (i < GEO.length - 1 && u > U_AT[i + 1]) i++; return i; };

function pointAtU(u) {
  const c = clamp(u, 0, U_END), i = legAt(c), g = GEO[i];
  let along = c - U_AT[i], k = 0;
  while (k < g.segs.length - 1 && along > g.segs[k]) { along -= g.segs[k]; k++; }
  const a = g.pts[k], b = g.pts[k + 1];
  if (along >= g.segs[k] - 1e-9) return {x: b.x, y: b.y};
  const s = Math.max(0, along) / g.segs[k];
  return {x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s};
}
const feetToU = f => {
  const c = clamp(f, 0, TOTAL_FEET);
  let i = 0; while (i < LEGS.length - 1 && c > F_AT[i + 1]) i++;
  return U_AT[i] + (c - F_AT[i]) / LEGS[i].feet * GEO[i].len;
};
const uToFeet = u => { const c = clamp(u, 0, U_END), i = legAt(c); return F_AT[i] + (c - U_AT[i]) / GEO[i].len * LEGS[i].feet; };
/** The courier's plan position after walking `feet` from the curb: exactly on each waypoint at 0, 45, 170, 195, 290. */
const pointAtFeet = feet => pointAtU(feetToU(feet));

/** the closest point of the route to a plan point; `bias` makes long jumps along the route cost more (drag hysteresis) */
function nearestOnRoute(p, near = 0, bias = 0) {
  let best = null;
  GEO.forEach((g, i) => {
    let base = U_AT[i];
    g.segs.forEach((L, k) => {
      const a = g.pts[k], b = g.pts[k + 1];
      const t = clamp(((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / (L * L), 0, 1);
      const dist = Math.hypot(p.x - (a.x + (b.x - a.x) * t), p.y - (a.y + (b.y - a.y) * t)), u = base + t * L;
      const cost = dist + bias * Math.abs(u - near);
      if (!best || cost < best.cost) best = {u, dist, cost};
      base += L;
    });
  });
  return best;
}

/* ---------- motion ---------- */

function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = t => ((ax * t + bx) * t + cx) * t, Y = t => ((ay * t + by) * t + cy) * t, dX = t => (3 * ax * t + 2 * bx) * t + cx;
  return x => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 6; i++) {
      const e = X(t) - x, d = dX(t);
      if (Math.abs(e) < 1e-7) return Y(t);
      if (Math.abs(d) < 1e-6) break;
      t -= e / d;
    }
    let lo = 0, hi = 1; t = x;
    for (let i = 0; i < 32; i++) { const v = X(t); if (Math.abs(v - x) < 1e-7) break; if (v < x) lo = t; else hi = t; t = (lo + hi) / 2; }
    return Y(t);
  };
}
const EASE = bezier(.33, 0, .2, 1);
const V = U_END / (WALK_S - RAMP_S);                             // walking pace, plan units per second
const mj = u => u * u * u * (10 - 15 * u + 6 * u * u);           // minimum-jerk 0..1
const mjV = u => 30 * u * u * (1 - u) * (1 - u);                 // its rate
const rampD = u => u * u * u * u * (2.5 - 3 * u + u * u);        // distance covered while speeding up, per V * RAMP_S

/* A move is {T, to, at(t), vel(t)} in plan units along the route, t in seconds. */
function glide(a, b, T = clamp(.45 + Math.abs(b - a) / 500, .45, 1.05)) {
  const D = b - a;
  return {T, to: b, at: t => a + D * mj(clamp(t / T, 0, 1)), vel: t => D / T * mjV(clamp(t / T, 0, 1))};
}
/** a steady walk: ramp up to V along a minimum-jerk velocity curve, cruise, ramp down the same way */
function cruise(a, b) {
  const D = Math.abs(b - a), s = b < a ? -1 : 1, R = RAMP_S;
  if (D < V * R) return glide(a, b, Math.max(.35, 1.875 * D / V));
  const Tc = D / V - R, T = Tc + 2 * R;
  const dist = t => (t <= 0 ? 0 : t < R ? V * R * rampD(t / R) : t < R + Tc ? V * R / 2 + V * (t - R) : t < T ? D - V * R * rampD((T - t) / R) : D);
  const vel = t => (t <= 0 || t >= T ? 0 : t < R ? V * mj(t / R) : t < R + Tc ? V : V * mj((T - t) / R));
  return {T, to: b, at: t => a + s * dist(t), vel: t => s * vel(t)};
}
const hold = (a, T) => ({T, to: a, at: () => a, vel: () => 0});
/** reduced motion: jump from waypoint to waypoint */
function hops(a) {
  const pts = U_AT.filter(u => u > a + .5);
  if (!pts.length) return hold(a, 0);
  return {T: (pts.length - 1) * STEP_S + .05, to: pts[pts.length - 1], at: t => pts[clamp(Math.floor(t / STEP_S), 0, pts.length - 1)], vel: () => 0};
}

const sty = (el, k, v) => {
  if (!el) return;
  const m = el.__lf || (el.__lf = {});
  if (m[k] !== v) { m[k] = v; el.style[k] = v; }
};
const txt = (el, v) => { if (el && el.textContent !== v) el.textContent = v; };
const att = (el, k, v) => { if (el && el.getAttribute(k) !== v) el.setAttribute(k, v); };
const DOOR = WAYPOINTS[WAYPOINTS.length - 1].at;
/** the route is drawn leg by leg when Dana's route comes on */
const LEG_T = (() => { let t = 0; return GEO.map(g => { const dur = .16 + g.len * .0028, r = {start: t, dur}; t += dur + .04; return r; }); })();

/** The courier, the pin and the route reveal: one rAF loop that runs only while something moves. */
class Engine {
  constructor() {
    this.x = 0; this.v = 0; this.target = 0; this.omega = 22; this.src = 'idle';
    this.move = null; this.reveal = null; this.after = null;
    this.drawn = GEO.map(() => 0); this.revealed = 0;
    this.mode = 'pin'; this.pinRest = GARAGE_GATE; this.pinAnim = null;
    this.reduced = false; this.kx = 1; this.ky = 1;
    this.dom = {ahead: [], walked: []}; this.copy = null; this.onView = null; this.viewKey = '';
    this.raf = 0; this.last = 0; this.dead = false;
    this.tick = this.tick.bind(this);
  }
  kick() {
    if (this.raf || this.dead) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }
  stop() { cancelAnimationFrame(this.raf); this.raf = 0; }
  tick(now) {
    this.raf = 0;
    if (this.dead) return;
    const dt = clamp((now - this.last) / 1000, 0, .05);
    this.last = now;
    if (this.pinAnim && now - this.pinAnim.t0 >= this.pinAnim.T * 1000) this.pinAnim = null;
    if (this.reveal) this.stepReveal(now);
    if (this.move) {
      const m = this.move, t = (now - m.t0) / 1000;
      if (t >= m.T) { this.x = this.target = m.to; this.v = 0; this.move = null; m.then?.(); }
      else { this.x = m.at(t); this.v = m.vel(t); this.target = this.x; }
    } else if (this.x !== this.target || this.v !== 0) this.stepSpring(dt);
    this.paint(now);
    this.sync();
    if ((this.pinAnim || this.reveal || this.move || this.x !== this.target || this.v !== 0) && !this.raf && !this.dead) this.raf = requestAnimationFrame(this.tick);
  }
  /** critically damped follow, solved exactly per frame: never overshoots a target it is heading for */
  stepSpring(dt) {
    const w = this.omega, e0 = this.x - this.target, v0 = this.v, ex = Math.exp(-w * dt), c = v0 + w * e0;
    this.x = this.target + (e0 + c * dt) * ex;
    this.v = (v0 - w * c * dt) * ex;
    if (this.x < 0) { this.x = 0; this.v = Math.max(0, this.v); } else if (this.x > U_END) { this.x = U_END; this.v = Math.min(0, this.v); }
    if (Math.abs(this.x - this.target) < .01 && Math.abs(this.v) < .05) { this.x = this.target; this.v = 0; }
  }
  stepReveal(now) {
    const t = (now - this.reveal.t0) / 1000;
    let rev = t >= 0 ? 1 : 0, done = true;
    GEO.forEach((g, i) => {
      const p = clamp((t - LEG_T[i].start) / LEG_T[i].dur, 0, 1);
      this.drawn[i] = g.len * EASE(p);
      if (p >= 1) { if (rev === i + 1) rev = i + 2; } else done = false;
    });
    this.revealed = rev;
    if (done) {
      this.reveal = null; this.revealed = WAYPOINTS.length;
      const f = this.after; this.after = null;
      if (f) this.run(hold(this.x, .2), {walking: true, then: f});
    }
  }
  pinPos(now) {
    const a = this.pinAnim;
    if (!a) return {x: this.pinRest.x, y: this.pinRest.y, lift: 0};
    const p = EASE(clamp((now - a.t0) / (a.T * 1000), 0, 1));
    return {x: a.from.x + (a.to.x - a.from.x) * p, y: a.from.y + (a.to.y - a.from.y) * p, lift: 4 * p * (1 - p)};
  }
  pinTo(to) {
    const now = performance.now(), from = this.pinPos(now);
    this.pinRest = to;
    this.pinAnim = this.reduced || same(from, to) ? null : {from: {x: from.x, y: from.y}, to, t0: now, T: PIN_S};
  }
  run(p, o = {}) {
    this.move = {...p, t0: performance.now(), walking: !!o.walking, then: o.then};
    this.src = 'auto';
    this.kick();
  }
  /* ----- what the page asks for ----- */
  toRoute(after) {
    this.mode = 'route'; this.move = null; this.x = this.target = 0; this.v = 0; this.src = 'idle';
    this.pinTo(DOOR);
    if (this.reduced) {
      this.drawn = GEO.map(g => g.len); this.revealed = WAYPOINTS.length; this.reveal = null; this.after = null;
      this.kick(); after?.();
      return;
    }
    this.drawn = GEO.map(() => 0); this.revealed = 0;
    this.reveal = {t0: performance.now() + REVEAL_DELAY * 1000};
    this.after = after || null;
    this.kick();
  }
  toPin() {
    this.mode = 'pin'; this.move = null; this.reveal = null; this.after = null;
    this.v = 0; this.target = this.x; this.src = 'idle';
    this.pinTo(GARAGE_GATE);
    this.kick();
  }
  drive(src, u, omega) {
    if (this.mode !== 'route') return;
    this.move = null; this.after = null; this.src = src; this.omega = omega; this.target = clamp(u, 0, U_END);
    if (this.reduced) { this.x = this.target; this.v = 0; }
    this.kick();
  }
  grab() {
    this.move = null; this.after = null; this.src = 'drag'; this.omega = 50; this.target = this.x; this.v = 0;
    this.kick();
  }
  dragTo(p, free) {
    this.target = free ? nearestOnRoute(p).u : nearestOnRoute(p, this.target, .12).u;
    if (this.reduced) { this.x = this.target; this.v = 0; }
    this.kick();
  }
  walk() {
    if (this.mode !== 'route') return;
    if (this.move?.walking || this.after) { this.pause(); return; }
    const go = () => this.run(this.reduced ? hops(this.x) : cruise(this.x, U_END), {walking: true});
    if (this.x < U_END - .5) { go(); return; }
    if (this.reduced) { this.x = this.target = 0; this.v = 0; go(); return; }
    this.run(glide(this.x, 0), {walking: true, then: () => this.run(hold(0, .18), {walking: true, then: go})});
  }
  /** let go of a walk: ease to a stop from the current pace (exponential, no backtrack) */
  pause() {
    this.after = null;
    if (!this.move) { this.kick(); return; }
    const v = this.v;
    this.move = null; this.src = 'auto';
    if (this.reduced || Math.abs(v) < 1e-3) { this.target = this.x; this.v = 0; }
    else { this.omega = 8; this.target = clamp(this.x + v / 8, 0, U_END); }
    this.kick();
  }
  goTo(u) {
    if (this.mode !== 'route') return;
    this.after = null;
    if (this.reduced) { this.move = null; this.x = this.target = u; this.v = 0; this.src = 'auto'; this.kick(); return; }
    this.run(u > this.x ? cruise(this.x, u) : glide(this.x, u));
  }
  startOver() {
    if (this.mode !== 'route') return;
    this.after = null;
    if (this.reduced) { this.move = null; this.x = this.target = 0; this.v = 0; this.src = 'auto'; this.kick(); return; }
    this.run(glide(this.x, 0));
  }
  setReduced(r) {
    if (r === this.reduced) return;
    this.reduced = r;
    if (!r) return;
    this.pinAnim = null;
    if (this.reveal) { this.reveal = null; this.drawn = GEO.map(g => g.len); this.revealed = WAYPOINTS.length; }
    if (this.move) { this.x = this.move.to; this.move = null; }
    this.target = this.x; this.v = 0;
    const f = this.after; this.after = null;
    this.kick(); f?.();
  }
  /* ----- output ----- */
  view() {
    const route = this.mode === 'route', x = this.x;
    let reached = -1, card = 0;
    if (route) U_AT.forEach((u, i) => { if (x >= u - .5) reached = i; });
    while (card < U_AT.length - 1 && U_AT[card] + .5 < x) card++;
    const p = pointAtU(x);
    return {reached, card: route ? card : 0, delivered: route && x >= U_END - .5, revealed: route ? this.revealed : 0,
      near: route && this.revealed >= 2 && Math.hypot(p.x - GATE.x, p.y - GATE.y) <= ZONE_R, walking: !!(this.move?.walking || this.after)};
  }
  sync() {
    const v = this.view(), key = `${v.reached}|${v.card}|${v.delivered}|${v.revealed}|${v.near}|${v.walking}`;
    if (key !== this.viewKey) { this.viewKey = key; this.onView?.(v); }
  }
  paint(now = performance.now()) {
    const d = this.dom, kx = this.kx, ky = this.ky, c = this.copy;
    const pin = this.pinPos(now);
    sty(d.pin, 'transform', `translate3d(${((pin.x - VIEW.x) * kx).toFixed(2)}px,${((pin.y - VIEW.y) * ky).toFixed(2)}px,0)`);
    sty(d.pinBody, 'transform', `translate3d(0,${(-pin.lift * PIN_LIFT).toFixed(2)}px,0)`);
    sty(d.pinShadow, 'transform', `scale(${(1 - .5 * pin.lift).toFixed(3)})`);
    const p = pointAtU(this.x);
    sty(d.dot, 'transform', `translate3d(${((p.x - VIEW.x) * kx).toFixed(2)}px,${((p.y - VIEW.y) * ky).toFixed(2)}px,0)`);
    GEO.forEach((g, i) => {
      // ahead of the courier: solid red from where they stand to as far as the route is drawn; behind: faded
      const a = clamp(this.x - U_AT[i], 0, g.len), b = this.drawn[i], gap = (g.len + 20).toFixed(2), ah = d.ahead[i], wk = d.walked[i], w = Math.min(a, b);
      sty(ah, 'opacity', b - a > .05 ? '1' : '0');
      if (b - a > .05) { sty(ah, 'strokeDasharray', `${(b - a).toFixed(2)} ${gap}`); sty(ah, 'strokeDashoffset', (-a).toFixed(2)); }
      sty(wk, 'opacity', w > .05 ? '1' : '0');
      if (w > .05) sty(wk, 'strokeDasharray', `${w.toFixed(2)} ${gap}`);
    });
    const ft = uToFeet(this.x), n = Math.round(ft), f = ft / TOTAL_FEET;
    txt(d.num, String(n));
    sty(d.rail, 'transform', `translate3d(${(f * 100).toFixed(3)}%,0,0)`);
    sty(d.fill, 'transform', `scaleX(${f.toFixed(4)})`);
    if (d.range && c) {
      if (this.src !== 'range') { const v = String(Math.round(ft / 5) * 5); if (d.range.value !== v) d.range.value = v; }
      att(d.range, 'aria-valuetext', c.valueText(n));
    }
    if (d.dist && c) {
      let card = 0;
      while (card < U_AT.length - 1 && U_AT[card] + .5 < this.x) card++;
      txt(d.dist, card === 0 ? c.toDoor(Math.round(TOTAL_FEET - ft)) : c.away(Math.max(0, Math.round(F_AT[card] - ft))));
    }
  }
}

/* ---------- words ---------- */

const EN = {
  tryIt: 'Try it',
  hint: 'Switch to Dana’s route, then drag the courier or press Walk it. At the gate, hold to show the code.',
  segLabel: 'What the courier follows', segPin: 'Map app pin', segRoute: 'Dana’s route',
  planPin: 'Site plan of the complex at 1450 Elm St. The map app pin sits on the residents-only garage gate on Cypress Ave.',
  planRoute: 'Site plan with Dana’s route in red: Elm St curb, gate, Building 4, stairs, door 214.',
  mapPin: 'Map apps drop the pin here',
  ftLabel: 'ft from the curb', walk: 'Walk it', pause: 'Pause', again: 'Walk again',
  rangeLabel: 'Courier’s position on Dana’s route', valueText: n => `${n} ft from the curb`,
  residentsOnly: 'Residents only', photoBy: 'Dana’s photo',
  pinLabel: 'Where the pin lands', pinTitle: 'Garage gate, Cypress Ave',
  pinText: 'Map apps send 1450 Elm St here: a residents-only garage gate around the corner. A courier can’t get in, so they circle the block and call Dana.',
  pinMore: 'Dana maps the way in once, one photo per step. Every courier follows it, without calling.',
  useRoute: 'Use Dana’s route',
  stepOf: n => `Step ${n} of 5`, toDoor: n => `${n} ft to door`, away: n => `${n} ft away`,
  codeLabel: 'Gate code', locked: 'Shows at the gate, to the courier on this order', goGate: 'Go to the gate',
  hold: 'Hold to show code', showAgain: 'Show code again', hidesAfter: `Hides after ${REVEAL_SECONDS} s`,
  enter: 'Enter on the call box', hidesIn: n => `Hides in ${n} s`, codeAria: d => `Gate code ${d.split('').join(' ')}`,
  statusShown: `Gate code shown. It hides after ${REVEAL_SECONDS} seconds.`, statusHidden: 'Gate code hidden.',
  doneLabel: 'Step 5 of 5 · Delivered', done: `Delivered to ${ADDRESS.unit}`,
  doneText: 'Left on the mat at the dark green door. No wrong gate, no call to Dana.', startOver: 'Start over',
  fine: 'Fictional complex at 1450 Elm St. Photos are AI-generated illustrations.',
};
const ZH = {
  tryIt: '试一试',
  hint: '切换到“Dana 的路线”，再拖动骑手，或点“走一遍”。走到大门时，按住按钮显示门禁码。',
  segLabel: '骑手跟着什么走', segPin: '地图 app 定位', segRoute: 'Dana 的路线',
  planPin: '1450 Elm St 小区的平面图。地图 app 的定位点落在 Cypress Ave 上只供住户进出的车库门。',
  planRoute: '平面图上的红线是 Dana 的路线：Elm St 路边、大门、4 号楼、楼梯、214 号门。',
  mapPin: '地图 app 定位在这里',
  ftLabel: '英尺 · 距路边', walk: '走一遍', pause: '暂停', again: '再走一遍',
  rangeLabel: '骑手在 Dana 路线上的位置', valueText: n => `距路边 ${n} 英尺`,
  residentsOnly: '仅限住户', photoBy: 'Dana 拍的照片',
  pinLabel: '定位点落在哪', pinTitle: 'Cypress Ave 车库门',
  pinText: '地图 app 把 1450 Elm St 定位到这里：拐角处一扇只供住户进出的车库门。骑手进不去，只能绕着街区转，再打电话给 Dana。',
  pinMore: 'Dana 只需标一次进门路线，每步一张照片。之后每位骑手都照着走，不用打电话。',
  useRoute: '用 Dana 的路线',
  stepOf: n => `第 ${n} 步，共 5 步`, toDoor: n => `离门口 ${n} 英尺`, away: n => `还有 ${n} 英尺`,
  codeLabel: '门禁码', locked: '到了大门才显示，只给接这一单的骑手', goGate: '走到大门',
  hold: '按住显示门禁码', showAgain: '再次显示门禁码', hidesAfter: `${REVEAL_SECONDS} 秒后隐藏`,
  enter: '在对讲机上输入', hidesIn: n => `${n} 秒后隐藏`, codeAria: d => `门禁码 ${d.split('').join(' ')}`,
  statusShown: `门禁码已显示，${REVEAL_SECONDS} 秒后隐藏。`, statusHidden: '门禁码已隐藏。',
  doneLabel: '第 5 步，共 5 步 · 已送达', done: `已送达 ${ADDRESS.unit}`,
  doneText: '放在深绿色门前的地垫上。没走错门，也没给 Dana 打电话。', startOver: '重新开始',
  fine: '1450 Elm St 是虚构的小区。照片为 AI 生成的示意图。',
};
/** the prototype's step cards in Chinese (as on the case page); the English is the data's own */
const STEP_ZH = {
  park: {title: 'Elm St 停车点', instr: '停在橄榄树旁，大门前约 40 英尺处。', alt: 'Elm St 上人行大门前的路边，左边是橄榄树，右边是红色路缘'},
  gate: {title: 'Elm St 大门', instr: '对讲机在左边门柱上，听到蜂鸣就拉门。', alt: '两段灰泥墙之间的黑色金属人行门，对讲机在左边门柱上'},
  building: {title: '4 号楼', instr: '小路分岔处靠右。找墙上的金属“4”。', alt: '庭院里一分为二的步道，右侧楼上挂着金属门牌“4”'},
  stairs: {title: '上楼梯', instr: '走金属楼梯上一层。', alt: '通往二楼的开放式金属楼梯，旁边是“4”号牌'},
  door: {title: '214 号门', instr: '沿走廊直走。深绿色的门，右边有盆栽。', alt: '二楼走廊上深绿色的 214 号门，门前有椰棕地垫，右边有盆栽'},
};

const small = src => src.replace('/proto/last-100-feet/photos/', '/assets/product/last-100-feet/photos/');
const PHOTOS = [
  ...STEPS.map(s => ({src: s.photo, focus: s.focus, alt: {en: s.alt, zh: STEP_ZH[s.key].alt}})),
  {src: GARAGE_PHOTO.photo, focus: '50% 55%', alt: {en: GARAGE_PHOTO.alt, zh: 'Cypress Ave 上的卷帘式车库门，旁边立着刷卡柱，仅限住户'}},
];
const GARAGE_SHOT = PHOTOS.length - 1;
const pctX = x => `${((x - VIEW.x) / VIEW.w * 100).toFixed(3)}%`;
const pctY = y => `${((y - VIEW.y) / VIEW.h * 100).toFixed(3)}%`;
const IMG_STYLE = {left: pctX(BASE.x), top: pctY(BASE.y), width: `${(BASE.w / VIEW.w * 100).toFixed(3)}%`, height: `${(BASE.h / VIEW.h * 100).toFixed(3)}%`};
const PIN_D = 'M14 35C14 35 2.5 22.6 2.5 13A11.5 11.5 0 1 1 25.5 13C25.5 22.6 14 35 14 35Z';

/* ---------- small pieces ---------- */

function Glyph({i}) {
  if (i === 1) return <svg className="lf-glyph-svg" viewBox="-4 -4 8 8" aria-hidden="true"><path d="M-2.6 2.6V-2.6M2.6 2.6V-2.6M-2.6-1.4H2.6M-.9-1.4V2.6M.9-1.4V2.6"/></svg>;
  if (i === 3) return <svg className="lf-glyph-svg" viewBox="-4 -4 8 8" aria-hidden="true"><path d="M-2.6 2.6H-.9V.9H.9V-.9H2.6V-2.6"/></svg>;
  return <span className="lf-glyph">{['P', '', '4', '', ADDRESS.unit][i]}</span>;
}
const IconPlay = () => <svg className="lf-ico" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.6v8.8L10.2 6z" fill="currentColor"/></svg>;
const IconPause = () => <svg className="lf-ico" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.8 1.8h2.3v8.4H2.8zM6.9 1.8h2.3v8.4H6.9z" fill="currentColor"/></svg>;
const IconAgain = () => <svg className="lf-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3"/><path d="M3.5 3.5v5h5"/></svg>;
const IconLock = () => <svg className="lf-ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>;
const IconArrow = () => <svg className="lf-ico" viewBox="0 0 12 12" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6h8M6.6 2.6 10 6 6.6 9.4"/></svg>;

/* ---------- the demo ---------- */

export default function LastHundredFeetDemo({lang = 'en', reduced = false}) {
  const zh = lang === 'zh', c = zh ? ZH : EN;
  const [eng] = useState(() => new Engine());
  const [refs] = useState(() => {
    const set = name => el => { eng.dom[name] = el; };
    return {plan: set('plan'), pin: set('pin'), pinBody: set('pinBody'), pinShadow: set('pinShadow'), dot: set('dot'), num: set('num'),
      range: set('range'), fill: set('fill'), rail: set('rail'), dist: set('dist'),
      ahead: GEO.map((_, i) => el => { eng.dom.ahead[i] = el; }), walked: GEO.map((_, i) => el => { eng.dom.walked[i] = el; })};
  });
  const [mode, setMode] = useState('pin');
  const [view, setView] = useState(() => eng.view());
  const [k, setK] = useState(1.2);
  const [code, setCode] = useState('hidden');      // hidden | shown | hiding
  const [seen, setSeen] = useState(false);
  const [left, setLeft] = useState(REVEAL_SECONDS);
  const [holding, setHolding] = useState(false);
  const [shows, setShows] = useState(0);
  const [status, setStatus] = useState('');
  const holdTimer = useRef(0), grab = useRef(null), codeBox = useRef(null), refocus = useRef(false);
  const photo = mode === 'pin' ? GARAGE_SHOT : view.card;
  const [stack, setStack] = useState([photo]);

  // the loop reads the current words and motion preference; repaint after every render (cheap, and fills new nodes)
  useLayoutEffect(() => { eng.copy = c; eng.onView = setView; eng.setReduced(reduced); eng.paint(); });

  // plan units to pixels, kept current with the plan's size
  useLayoutEffect(() => {
    eng.dead = false;
    const el = eng.dom.plan;
    if (!el) return undefined;
    const measure = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      eng.kx = w / VIEW.w; eng.ky = h / VIEW.h;
      setK(w / VIEW.w);
      eng.paint();
    };
    measure();
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    ro?.observe(el);
    return () => { ro?.disconnect(); eng.dead = true; eng.stop(); };
  }, [eng]);

  // photo crossfade: the newest photo fades in over the ones before it, which drop away once it is opaque
  useLayoutEffect(() => { setStack(s => (s[s.length - 1] === photo ? s : [...s.filter(i => i !== photo), photo])); }, [photo]);
  useEffect(() => {
    if (stack.length < 2) return undefined;
    const t = setTimeout(() => setStack(s => s.slice(-1)), 520);
    return () => clearTimeout(t);
  }, [stack]);

  // the gate code: 20 s on screen, then it hides
  useEffect(() => {
    if (code !== 'shown') return undefined;
    const t = setInterval(() => setLeft(v => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [code, shows]);
  useEffect(() => { if (code === 'shown' && left === 0) { setCode('hiding'); setStatus(c.statusHidden); } }, [code, left, c]);
  // keep keyboard focus in the code row while its content swaps (hold button, tiles, show-again button)
  const keepFocus = () => { if (codeBox.current?.contains(document.activeElement)) refocus.current = true; };
  useEffect(() => {
    if (code !== 'hiding') return undefined;
    const t = setTimeout(() => { keepFocus(); setCode('hidden'); }, reduced ? 0 : 240);
    return () => clearTimeout(t);
  }, [code, reduced]);
  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    codeBox.current?.querySelector('.lf-code-main [tabindex="-1"], .lf-code-main button')?.focus({preventScroll: true});
  }, [code]);
  useEffect(() => { if (!view.near) { clearTimeout(holdTimer.current); setHolding(false); } }, [view.near]);
  useEffect(() => () => clearTimeout(holdTimer.current), []);

  const resetCode = () => { clearTimeout(holdTimer.current); setHolding(false); setCode('hidden'); setSeen(false); setLeft(REVEAL_SECONDS); setStatus(''); };
  const goRoute = after => { if (mode === 'route') return; resetCode(); setMode('route'); eng.toRoute(after); };
  const goPin = () => { if (mode === 'pin') return; resetCode(); setMode('pin'); eng.toPin(); };
  const onWalk = () => { if (mode === 'pin') goRoute(() => eng.walk()); else eng.walk(); };
  const startOver = () => { resetCode(); eng.startOver(); };
  const reveal = () => { keepFocus(); setCode('shown'); setSeen(true); setLeft(REVEAL_SECONDS); setShows(n => n + 1); setStatus(c.statusShown); };
  const startHold = () => {
    if (holding) return;
    setHolding(true);
    clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => { setHolding(false); reveal(); }, HOLD_MS);
  };
  const cancelHold = () => { clearTimeout(holdTimer.current); setHolding(false); };

  // dragging the courier: grab the dot anywhere (touch, pen, mouse), or press on the red line with a mouse
  const toPlan = e => {
    const r = eng.dom.plan.getBoundingClientRect();
    return {x: VIEW.x + (e.clientX - r.left) / r.width * VIEW.w, y: VIEW.y + (e.clientY - r.top) / r.height * VIEW.h};
  };
  const onDown = e => {
    if (mode !== 'route' || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const p = toPlan(e), onDot = !!e.target.closest?.('.lf-dot');
    let off = {x: 0, y: 0};
    if (onDot) { const d = pointAtU(eng.x); off = {x: d.x - p.x, y: d.y - p.y}; }
    else if (e.pointerType !== 'mouse' || nearestOnRoute(p).dist * eng.kx > 14) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* the pointer is already gone */ }
    grab.current = {id: e.pointerId, off};
    eng.grab();
    if (!onDot) eng.dragTo(p, true);
  };
  const onMove = e => {
    const g = grab.current;
    if (!g || g.id !== e.pointerId) return;
    const p = toPlan(e);
    eng.dragTo({x: p.x + g.off.x, y: p.y + g.off.y});
  };
  const onUp = e => { if (grab.current?.id === e.pointerId) grab.current = null; };

  const codeOn = code !== 'hidden';
  const walkLabel = view.walking ? c.pause : view.delivered ? c.again : c.walk;
  const WalkIcon = view.walking ? IconPause : view.delivered ? IconAgain : IconPlay;
  const step = STEPS[view.card], words = zh ? STEP_ZH[step.key] : step;

  const holdButton = seen
    ? <button type="button" className="lf-hold" onClick={reveal}><span className="lf-hold-face"><IconLock/>{c.showAgain}</span></button>
    : <button type="button" className={`lf-hold${holding ? ' is-holding' : ''}`} style={{'--hold': `${HOLD_MS}ms`}}
      onPointerDown={e => { if (e.pointerType === 'mouse' && e.button !== 0) return; try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* gone */ } startHold(); }}
      onPointerUp={cancelHold} onPointerCancel={cancelHold} onBlur={cancelHold} onContextMenu={e => e.preventDefault()}
      onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); startHold(); } }}
      onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); cancelHold(); } }}>
      <span className="lf-hold-fill" aria-hidden="true"/>
      <span className="lf-hold-face"><IconLock/>{c.hold}</span>
    </button>;

  const codeRow = <div className="lf-code" ref={codeBox}>
    <div className="lf-code-head">
      <span className="lf-label">{codeOn ? c.enter : c.codeLabel}</span>
      {codeOn ? <span className="lf-label lf-muted">{c.hidesIn(left)}</span>
        : view.near ? <span className="lf-label lf-muted">{c.hidesAfter}</span>
          : <button type="button" className="lf-link lf-label" onClick={() => eng.goTo(U_AT[1])}>{c.goGate}<IconArrow/></button>}
    </div>
    <div className="lf-code-main">
      {codeOn
        ? <div key={shows} className={`lf-tiles${code === 'hiding' ? ' is-hiding' : ''}`} tabIndex={-1} role="img" aria-label={c.codeAria(ADDRESS.code)} style={{'--reveal': `${REVEAL_SECONDS}s`}}>
          {[...ADDRESS.code].map((n, i) => <span key={i} className="lf-tile" style={{'--i': i}} aria-hidden="true">
            <span className="lf-half lf-half-top"><span>{n}</span></span>
            <span className="lf-half lf-half-bot"/>
            <span className="lf-flap lf-flap-front"/>
            <span className="lf-flap lf-flap-back"><span>{n}</span></span>
          </span>)}
          <span className="lf-drain" aria-hidden="true"><span/></span>
        </div>
        : view.near ? holdButton
          : <button type="button" className="lf-hold is-locked" aria-disabled="true"><span className="lf-hold-face"><IconLock/>{c.locked}</span></button>}
    </div>
  </div>;

  return <div className={`lf${reduced ? ' lf--reduced' : ''}`} lang={zh ? 'zh-CN' : 'en'}>
    <p className="lf-hint"><span className="lf-try lf-label">{c.tryIt}</span><span>{c.hint}</span></p>
    <div className="lf-grid">
      <div className="lf-main">
        <div className="lf-seg" role="group" aria-label={c.segLabel}>
          <span className={`lf-seg-thumb${mode === 'route' ? ' is-right' : ''}`} aria-hidden="true"/>
          <button type="button" aria-pressed={mode === 'pin'} onClick={goPin}><span className="lf-seg-off">{c.segPin}</span><span className="lf-seg-on" aria-hidden="true">{c.segPin}</span></button>
          <button type="button" aria-pressed={mode === 'route'} onClick={() => goRoute()}><span className="lf-seg-off">{c.segRoute}</span><span className="lf-seg-on" aria-hidden="true">{c.segRoute}</span></button>
        </div>
        <div ref={refs.plan} className={`lf-plan${mode === 'route' ? ' is-route' : ''}${view.delivered ? ' is-delivered' : ''}`}>
          <div className="lf-plan-clip"><img className="lf-base" src={PLAN_SRC} alt="" width="1060" height="1200" decoding="async" draggable="false" style={IMG_STYLE}/></div>
          <div className="lf-plan-art" role="img" aria-label={mode === 'pin' ? c.planPin : c.planRoute}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onLostPointerCapture={onUp}>
            <svg className="lf-svg" viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <g className={`lf-zone${view.revealed >= 2 ? ' is-ready' : ''}${view.near ? ' is-near' : ''}`}>
                <circle className="lf-zone-fill" cx={GATE.x} cy={GATE.y} r={ZONE_R}/>
                <circle className="lf-zone-ring" cx={GATE.x} cy={GATE.y} r={ZONE_R} strokeWidth={1 / k} strokeDasharray={`${3 / k} ${3 / k}`}/>
              </g>
              <g className="lf-routes" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.6 / k}>
                <g className="lf-walked">{GEO.map((g, i) => <path key={i} ref={refs.walked[i]} d={g.d}/>)}</g>
                <g className="lf-ahead">{GEO.map((g, i) => <path key={i} ref={refs.ahead[i]} d={g.d}/>)}</g>
              </g>
            </svg>
            {WAYPOINTS.slice(0, 4).map((w, i) => <span key={w.key} aria-hidden="true" style={{left: pctX(w.at.x), top: pctY(w.at.y)}}
              className={`lf-token${i < view.revealed ? ' is-shown' : ''}${i <= view.reached ? ' is-reached' : ''}`}>
              <Glyph i={i}/><span className="lf-token-lit"><Glyph i={i}/></span>
            </span>)}
            <span className="lf-maplabel lf-label" aria-hidden="true" style={{left: pctX(GARAGE_GATE.x), top: pctY(GARAGE_GATE.y)}}>{c.mapPin}</span>
            <div className="lf-pin" ref={refs.pin} aria-hidden="true">
              <span className="lf-pin-shadow" ref={refs.pinShadow}/>
              <span className="lf-pin-body" ref={refs.pinBody}>
                <svg viewBox="0 0 28 36" width="28" height="36" focusable="false">
                  <path className="lf-pin-ink" d={PIN_D}/><path className="lf-pin-red" d={PIN_D}/>
                  <circle className="lf-pin-dot" cx="14" cy="13" r="4"/>
                  <text className="lf-pin-num" x="14" y="13.5" textAnchor="middle" dominantBaseline="central">{ADDRESS.unit}</text>
                </svg>
              </span>
            </div>
            <div className="lf-dot" ref={refs.dot} aria-hidden="true"><span className="lf-dot-core"/></div>
          </div>
        </div>
      </div>

      <div className="lf-side">
        <div className={`lf-controls${mode === 'pin' ? ' is-pin' : ''}`}>
          <div className="lf-meter">
            <p className="lf-reading"><span className="lf-num" ref={refs.num}>0</span><span className="lf-label lf-muted">{c.ftLabel}</span></p>
            <button type="button" className="lf-btn lf-btn-ink lf-walk" onClick={onWalk}><WalkIcon/>{walkLabel}</button>
          </div>
          <div className="lf-range">
            <input ref={refs.range} type="range" min="0" max={TOTAL_FEET} step="5" defaultValue="0" disabled={mode === 'pin'} aria-label={c.rangeLabel}
              onChange={e => eng.drive('range', feetToU(Number(e.target.value)), 36)}/>
            <span className="lf-track" aria-hidden="true"><span className="lf-fill" ref={refs.fill}/></span>
            <span className="lf-ticks" aria-hidden="true">{F_AT.map((f, i) => <span key={i} style={{'--p': f / TOTAL_FEET}}
              className={`lf-tick${i === 4 ? ' is-wide' : ''}${i <= view.reached ? ' is-reached' : ''}`}><Glyph i={i}/><span className="lf-tick-lit"><Glyph i={i}/></span></span>)}</span>
            <span className="lf-rail" ref={refs.rail} aria-hidden="true"><span className="lf-thumb"/></span>
          </div>
        </div>

        <article className={`lf-card${mode === 'pin' ? ' is-pin' : ''}`}>
          <div className="lf-photo">
            {PHOTOS.map((p, i) => {
              const pos = stack.indexOf(i), on = i === photo;
              return <img key={p.src} className={`lf-shot${pos < 0 ? '' : pos === stack.length - 1 ? ' is-on' : ' is-kept'}`} style={{objectPosition: p.focus, zIndex: pos + 1}}
                src={p.src} srcSet={`${small(p.src)} 480w, ${p.src} 1280w`} sizes="(min-width: 760px) 440px, 92vw" width="1280" height="960"
                alt={on ? p.alt[zh ? 'zh' : 'en'] : ''} aria-hidden={on ? undefined : true} loading="lazy" decoding="async" draggable="false"/>;
            })}
            <span className="lf-chip lf-label">{mode === 'pin' ? c.residentsOnly : c.photoBy}</span>
          </div>
          <div className="lf-card-body">
            {mode === 'pin' ? <>
              <div className="lf-step" key="pin">
                <div className="lf-card-head"><span className="lf-label">{c.pinLabel}</span></div>
                <p className="lf-title">{c.pinTitle}</p>
                <p className="lf-text">{c.pinText}</p>
              </div>
              <div className="lf-cta">
                <p className="lf-note">{c.pinMore}</p>
                <button type="button" className="lf-btn lf-btn-ink" onClick={() => goRoute()}>{c.useRoute}<IconArrow/></button>
              </div>
            </> : <>
              <div aria-live="polite">
                <div className="lf-step" key={`${view.card}-${view.delivered}`}>
                  <div className="lf-card-head">
                    <span className="lf-label">{view.delivered ? c.doneLabel : c.stepOf(view.card + 1)}</span>
                    {view.delivered ? null : <span className="lf-label lf-muted lf-dist" ref={refs.dist} aria-hidden="true"/>}
                  </div>
                  <p className="lf-title">{view.delivered ? `✓ ${c.done}` : words.title}</p>
                  <p className="lf-text">{view.delivered ? c.doneText : words.instr}</p>
                </div>
              </div>
              {view.delivered
                ? <div className="lf-done"><button type="button" className="lf-btn lf-btn-ink" onClick={startOver}><IconAgain/>{c.startOver}</button></div>
                : codeRow}
            </>}
          </div>
        </article>
      </div>
    </div>
    <p className="lf-fine">{c.fine}</p>
    <p className="lf-sr" aria-live="polite">{status}</p>
  </div>;
}

/** for checks: the courier's plan position for a distance in feet from the curb */
LastHundredFeetDemo.pointAtFeet = pointAtFeet;
