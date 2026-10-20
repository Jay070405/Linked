import {scrollerOf} from '../../v2/motion';

/* The canvas camera. Frames ([data-frame]) sit in Figma-style sections ([data-section]), one section per row, left to
   right, on a world that is moved with one transform. The page scroll is the story: it is cut into segments, a "read"
   segment per frame and a "move" segment between frames (the camera zooms out, pans, zooms back in).

   The story is paged. The camera rests on stops: one per frame, a few down a frame taller than the stage, and one per
   stage of a held frame (the compile plays a part per stop). One wheel or trackpad gesture, one arrow, Page or space
   key, or one touch swipe moves exactly one stop, in a slow, gentle transition (1.1 s inside a frame, up to 1.4 s for
   the longest flights). Input is locked while it runs, and a wheel gesture only ends after IDLE ms of silence, so a
   trackpad's trailing momentum never pages twice. Past the last stop, the page goes on below the canvas.
   Anything else that moves the page (the scrollbar, find in page, a link) is followed, then settled on the nearest stop.

   Dragging the canvas, ctrl/cmd + wheel, a trackpad pinch or a two-finger pinch detach the camera ("free"); a wheel
   gesture, Escape or Back to the story fly it back.

   World units are CSS px at 100%. A camera {x, y, s} puts world point (x, y) at the viewport's top-left corner:
   screen = (world - camera) * s. Every camera is checked before it is drawn: a bad one (NaN, Infinity, a scale out of
   range) is replaced by the story's own view, and a listener that throws can't stop the loop, so the canvas never goes
   blank. */

const GAP = 200;          // between frames in a row
const ROW_GAP = 520;      // between section rows
const PAD = 120;          // section padding around its frames
const HEAD = 40;          // extra room above the frames for the section's name
const MIN_S = .04, MAX_S = 4;
const FIT = 160;          // a frame up to this much taller than the stage is shown whole, centered (padding under the chrome)
const STRIDE = .85;       // stops down a taller frame are at most this share of the stage apart
const IDLE = 250;         // ms of wheel silence that end a gesture (its momentum tail is swallowed until then)
const NUDGE = 8;          // px a gesture travels before it counts, so a resting finger doesn't page
const SWIPE = 48;         // px of a touch swipe that steps (or 24 px, quickly)

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
// the paging ease: a sine in-out, slow to leave and slow to land, never a snap
const gentle = t => (1 - Math.cos(Math.PI * t)) / 2;
const sane = c => !!c && Number.isFinite(c.x) && Number.isFinite(c.y) && Number.isFinite(c.s)
  && c.s >= MIN_S / 2 && c.s <= MAX_S * 2 && Math.abs(c.x) < 1e6 && Math.abs(c.y) < 1e6;
const lineOf = e => (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);

/** Offset of `el` inside `root`, in untransformed CSS px. */
export function offsetWithin(el, root) {
  let x = 0, y = 0, n = el;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return {x, y};
}

export default class Camera {
  constructor({root, track, viewport, world, insets, onActive, onFree, onChange}) {
    Object.assign(this, {root, track, viewport, world, insets, onActive, onFree, onChange});
    this.scroller = scrollerOf(root);
    this.cam = {x: 0, y: 0, s: 1}; this.good = null;
    this.p = 0; this.pt = 0; this.total = 0; this.trackTop = 0;
    this.rects = []; this.sections = []; this.segments = []; this.views = []; this.stops = [];
    this.free = null;       // {cam, anim?} while detached
    this.move = null;       // a transition: {from, a0?, a1, depth, soft, t0, dur}
    this.listeners = new Set();
    this.active = -1; this.arrived = -1;
    this.tool = 'move';
    this.raf = 0; this.last = 0; this.layoutQueued = 0;
    this.pointers = new Map(); this.drag = null; this.pinch = null; this.swipe = null;
    this.freeScroll = 0; this.gesture = null; this.expect = null;
  }

  // ---------- lifecycle ----------
  start() {
    const s = this.scroller;
    this.onScroll = this.onScroll.bind(this);
    this.onResize = () => this.queueLayout();
    this.onWheel = this.onWheel.bind(this);
    this.onStoryWheel = this.onStoryWheel.bind(this);
    this.onDown = this.onDown.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onUp = this.onUp.bind(this);
    this.onKey = this.onKey.bind(this);
    this.onFocus = this.onFocus.bind(this);
    this.lastInput = 0;
    this.onInput = () => { this.lastInput = performance.now(); };
    this.onGesture = this.onGesture.bind(this);
    s.addEventListener('scroll', this.onScroll, {passive: true});
    ['wheel', 'keydown', 'touchmove', 'pointerdown'].forEach(t => addEventListener(t, this.onInput, {passive: true, capture: true}));
    addEventListener('resize', this.onResize);
    // the story's wheel: on the window, so a wheel over the site's nav pages too
    addEventListener('wheel', this.onStoryWheel, {passive: false, capture: true});
    this.viewport.addEventListener('wheel', this.onWheel, {passive: false});
    this.viewport.addEventListener('pointerdown', this.onDown);
    this.viewport.addEventListener('pointermove', this.onMove);
    this.viewport.addEventListener('pointerup', this.onUp);
    this.viewport.addEventListener('pointercancel', this.onUp);
    this.viewport.addEventListener('gesturestart', this.onGesture);
    this.viewport.addEventListener('gesturechange', this.onGesture);
    addEventListener('keydown', this.onKey);
    this.world.addEventListener('focusin', this.onFocus);
    // a focused control inside an overflow:hidden box could still scroll it; keep the viewport at its origin
    this.viewport.addEventListener('scroll', this.resetViewportScroll = () => { this.viewport.scrollTop = 0; this.viewport.scrollLeft = 0; });
    this.ro = new ResizeObserver(() => this.queueLayout());
    this.layout(true);
  }
  stop() {
    const s = this.scroller;
    s.removeEventListener('scroll', this.onScroll);
    ['wheel', 'keydown', 'touchmove', 'pointerdown'].forEach(t => removeEventListener(t, this.onInput, {capture: true}));
    removeEventListener('resize', this.onResize);
    removeEventListener('wheel', this.onStoryWheel, {capture: true});
    this.viewport.removeEventListener('wheel', this.onWheel);
    this.viewport.removeEventListener('pointerdown', this.onDown);
    this.viewport.removeEventListener('pointermove', this.onMove);
    this.viewport.removeEventListener('pointerup', this.onUp);
    this.viewport.removeEventListener('pointercancel', this.onUp);
    this.viewport.removeEventListener('gesturestart', this.onGesture);
    this.viewport.removeEventListener('gesturechange', this.onGesture);
    this.viewport.removeEventListener('scroll', this.resetViewportScroll);
    removeEventListener('keydown', this.onKey);
    this.world.removeEventListener('focusin', this.onFocus);
    this.ro?.disconnect();
    cancelAnimationFrame(this.raf); cancelAnimationFrame(this.layoutQueued); cancelAnimationFrame(this.progRaf); clearTimeout(this.settleTimer);
    // hand the DOM back to the flow layout
    this.world.style.transform = '';
    this.track.style.height = '';
    this.world.querySelectorAll('[data-frame],[data-section]').forEach(el => { el.style.left = ''; el.style.top = ''; el.style.width = ''; el.style.height = ''; });
  }
  subscribe(fn) {
    this.listeners.add(fn);
    try { fn(this.cam, this); } catch (err) { this.report(err); }
    return () => this.listeners.delete(fn);
  }

  // ---------- layout ----------
  queueLayout() {
    if (this.layoutQueued) return;
    this.layoutQueued = requestAnimationFrame(() => { this.layoutQueued = 0; this.layout(false); });
  }
  layout(first) {
    const vp = this.vp = {w: this.viewport.clientWidth, h: this.viewport.clientHeight};
    if (!vp.w || !vp.h) return;
    // where we are, so a relayout keeps the reader's place
    const anchor = first ? null : this.anchorAt(this.p);
    const narrow = this.insets({wide: false}, vp), wide = this.insets({wide: true}, vp);
    this.world.style.setProperty('--stage-w', `${vp.w - narrow.l - narrow.r}px`);
    this.world.style.setProperty('--stage-w-wide', `${vp.w - wide.l - wide.r}px`);
    this.world.style.setProperty('--stage-h', `${vp.h - narrow.t - narrow.b}px`);

    const sections = [...this.world.querySelectorAll('[data-section]')];
    const rects = [];
    let y = 0, worldW = 0;
    this.sections = sections.map((sec, si) => {
      const frames = [...sec.querySelectorAll('[data-frame]')];
      let x = PAD, maxH = 0;
      const top = PAD + HEAD;
      frames.forEach(f => {
        const w = f.offsetWidth, h = f.offsetHeight;
        f.style.left = `${x}px`; f.style.top = `${top}px`;
        const stops = f.dataset.stops ? f.dataset.stops.split(',').map(Number).filter(Number.isFinite) : null;
        rects.push({el: f, id: f.dataset.frame, wide: f.hasAttribute('data-wide'), hold: Number(f.dataset.hold) || 0, stops: stops?.length ? stops : null,
          section: si, x, y: y + top, w, h, local: {x, y: top}});
        x += w + GAP; maxH = Math.max(maxH, h);
      });
      const w = x - GAP + PAD, h = top + maxH + PAD;
      sec.style.left = '0px'; sec.style.top = `${y}px`; sec.style.width = `${w}px`; sec.style.height = `${h}px`;
      const rect = {x: 0, y, w, h};
      y += h + ROW_GAP; worldW = Math.max(worldW, w);
      return rect;
    });
    this.world.style.width = `${worldW}px`; this.world.style.height = `${y - ROW_GAP}px`;
    this.bounds = {x: 0, y: 0, w: worldW, h: y - ROW_GAP};
    this.rects = rects;
    // observe the frames that are there now (a frame React replaced would otherwise go unmeasured); only new ones, since
    // starting an observation reports a size and would queue another layout
    const seen = this.observed ||= new Set();
    rects.forEach(r => { if (!seen.has(r.el)) { seen.add(r.el); this.ro.observe(r.el); } });
    seen.forEach(el => { if (!el.isConnected) { this.ro.unobserve(el); seen.delete(el); } });

    // story segments
    const views = rects.map(r => this.view(r));
    const segments = [];
    let off = 0;
    rects.forEach((r, i) => {
      if (i) {
        const len = Math.round(vp.h * (rects[i - 1].section !== r.section ? 1.15 : .72));
        segments.push({type: 'move', from: i - 1, to: i, start: off, len, A: views[i - 1].end, B: views[i].start});
        off += len;
      }
      segments.push({type: 'read', i, start: off, len: views[i].len, A: views[i].start, B: views[i].end});
      off += views[i].len;
    });
    this.segments = segments; this.views = views;
    this.total = off;
    // the stops, in story order; j numbers them inside their frame
    this.stops = [];
    segments.forEach(seg => {
      if (seg.type !== 'read') return;
      views[seg.i].stops.forEach((f, j) => this.stops.push({i: seg.i, j, p: seg.start + clamp(Math.round(seg.len * f), 0, seg.len - 1)}));
    });
    this.track.style.height = `${Math.round(off + vp.h)}px`;
    this.trackTop = this.measureTrackTop();

    if (anchor) {
      const p = this.fromAnchor(anchor);
      if (Math.abs(p - this.p) > .5) { this.p = this.pt = p; this.writeScroll(p); }
    } else {
      this.pt = this.p = clamp(this.scrollTop() - this.trackTop, 0, this.total);
    }
    // a transition in flight keeps flying, to where its stop is now
    if (this.move) { this.pt = this.fromAnchor(this.move.a1); this.writeScroll(this.pt); }
    else if (!this.free) this.cam = this.camAt(this.p);
    this.apply();
    this.updateActive(true);
  }

  /** The view of one frame: centered in the stage at 100%; a frame much taller than the stage is read from its top to
      its bottom. `stops` are where the camera rests, as shares of the frame's read segment. */
  view(r) {
    const vp = this.vp, ins = this.insets(r, vp);
    const stageW = vp.w - ins.l - ins.r, stageH = vp.h - ins.t - ins.b;
    const x = r.x - (ins.l + (stageW - r.w) / 2);
    // a frame can ask to hold the camera longer (the compile is scrubbed by this segment)
    const hold = r.hold * vp.h;
    const over = r.h - stageH;
    if (over <= FIT) {
      // the frame fits (or nearly): one still view, anywhere in the segment; a held frame names its own stops
      const at = {x, y: r.y - (ins.t + (stageH - r.h) / 2), s: 1};
      return {start: at, end: at, len: Math.round(vp.h * .34 + hold), still: !hold, stops: hold && r.stops ? r.stops : [.5]};
    }
    const y0 = r.y - ins.t, y1 = r.y + r.h - (vp.h - ins.b);
    const n = 1 + Math.ceil(over / (stageH * STRIDE));
    return {start: {x, y: y0, s: 1}, end: {x, y: y1, s: 1}, len: Math.round(over + vp.h * .12 + hold), still: false,
      stops: hold && r.stops ? r.stops : Array.from({length: n}, (_, k) => k / (n - 1))};
  }

  measureTrackTop() {
    const s = this.scroller, r = this.track.getBoundingClientRect();
    return s === window ? r.top + scrollY : r.top - s.getBoundingClientRect().top + s.scrollTop;
  }
  scrollTop() { return this.scroller === window ? scrollY : this.scroller.scrollTop; }
  /** Moves the page to story position `p` without the camera following it (onScroll knows it was us). */
  writeScroll(p) {
    const top = Math.round(this.trackTop + p);
    this.expect = top;
    this.programmatic = true;
    cancelAnimationFrame(this.progRaf);
    // the scroll event of an instant scroll comes before the next frame's callbacks
    this.progRaf = requestAnimationFrame(() => { this.programmatic = false; this.expect = null; });
    if (this.scroller === window) window.scrollTo({top, behavior: 'instant'});
    else this.scroller.scrollTo({top, behavior: 'instant'});
  }
  smoothScroll(top) {
    if (this.scroller === window) window.scrollTo({top, behavior: 'smooth'});
    else this.scroller.scrollTo({top, behavior: 'smooth'});
  }

  segAt(p) {
    const list = this.segments;
    let lo = 0, hi = list.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (list[mid].start <= p) lo = mid; else hi = mid - 1; }
    return list[lo];
  }
  /** A place in the story that survives a relayout: a stop, a spot in a frame's read segment, or a share of a move. */
  anchorAt(p) {
    if (!this.segments.length || !Number.isFinite(p)) return null;
    const stop = this.stops.find(s => Math.abs(s.p - p) < .5);
    if (stop) return {type: 'stop', i: stop.i, j: stop.j};
    const seg = this.segAt(p);
    return seg.type === 'read' ? {type: 'read', i: seg.i, d: p - seg.start} : {type: 'move', to: seg.to, t: seg.len ? (p - seg.start) / seg.len : 0};
  }
  anchor() { return this.anchorAt(this.p); }
  fromAnchor(a) {
    if (!a) return clamp(this.p, 0, this.total);
    if (a.type === 'stop') {
      const own = this.stops.filter(s => s.i === a.i);
      if (own.length) return own[Math.min(a.j, own.length - 1)].p;
      return this.fromAnchor({type: 'read', i: a.i, d: 0});
    }
    const seg = a.type === 'read' ? this.segments.find(s => s.type === 'read' && s.i === a.i) : this.segments.find(s => s.type === 'move' && s.to === a.to);
    if (!seg) return clamp(this.p, 0, this.total);
    return a.type === 'read' ? seg.start + Math.min(a.d, seg.len) : seg.start + a.t * seg.len;
  }
  readStart(i) { return this.segments.find(s => s.type === 'read' && s.i === i); }

  // ---------- camera math ----------
  camAt(p) {
    if (!this.segments.length) return this.cam;
    const seg = this.segAt(clamp(p, 0, this.total));
    const t = seg.len ? clamp((p - seg.start) / seg.len, 0, 1) : 1;
    if (seg.type === 'read') return {x: lerp(seg.A.x, seg.B.x, t), y: lerp(seg.A.y, seg.B.y, t), s: 1};
    return this.between(seg.A, seg.B, t);
  }
  /** Zoom out, pan, zoom in: centers move on an ease, the visible width (1/s) gets a bump in the middle that is big
      enough to show both ends of the move. `soft`: the paging ease, with the zoom leaving and landing at rest too. */
  between(A, B, t, depth = 1, soft = false) {
    const vp = this.vp, P = {x: vp.w / 2, y: vp.h / 2};
    const cA = {x: A.x + P.x / A.s, y: A.y + P.y / A.s}, cB = {x: B.x + P.x / B.s, y: B.y + P.y / B.s};
    const dx = Math.abs(cB.x - cA.x), dy = Math.abs(cB.y - cA.y);
    const mid = clamp(Math.min(vp.w / (dx + vp.w * 1.1), vp.h / (dy + vp.h * 1.1)), .045, .92);
    const base = (1 / A.s + 1 / B.s) / 2;
    const bump = Math.max(0, 1 / mid - base) * depth;
    const e = soft ? gentle(t) : easeInOut(t);
    const inv = lerp(1 / A.s, 1 / B.s, e) + bump * Math.sin(Math.PI * (soft ? e : t));
    const s = 1 / inv;
    const c = {x: lerp(cA.x, cB.x, e), y: lerp(cA.y, cB.y, e)};
    return {x: c.x - P.x / s, y: c.y - P.y / s, s};
  }

  apply() {
    // the guard: never draw a camera that would put the world nowhere
    if (!sane(this.cam)) this.recover('camera out of range');
    const {x, y, s} = this.cam;
    this.good = this.cam;
    this.world.style.transform = `translate3d(${(-x * s).toFixed(2)}px, ${(-y * s).toFixed(2)}px, 0) scale(${s.toFixed(5)})`;
    // one listener that throws (a frame's own animation) must not stop the camera
    this.listeners.forEach(fn => { try { fn(this.cam, this); } catch (err) { this.report(err); } });
  }
  report(err) {
    if (this.reported) return;
    this.reported = true;
    console.error('[ready-for-agents] canvas recovered from:', err);
  }
  /** Back to a camera that shows the story: the story's own view where it is, else the last good one. */
  recover(why) {
    this.report(new Error(why));
    this.move = null;
    if (!Number.isFinite(this.pt)) this.pt = Number.isFinite(this.p) ? this.p : 0;
    if (!Number.isFinite(this.p)) this.p = this.pt;
    this.p = this.pt = clamp(this.pt, 0, this.total || 0);
    let c = null;
    try { c = this.free ? this.good : this.camAt(this.p); } catch { c = null; }
    if (!sane(c)) c = sane(this.good) ? this.good : {x: 0, y: 0, s: 1};
    this.cam = {...c};
    if (this.free) { this.free.anim = null; this.free.cam = {...c}; }
  }
  request() { if (!this.raf) this.raf = requestAnimationFrame(this.tick ||= this.loop.bind(this)); }
  loop(now) {
    this.raf = 0;
    let moving = false;
    try {
      const dt = Math.min(64, now - (this.last || now)); this.last = now;
      if (this.free) {
        const a = this.free.anim;
        if (a) {
          const t = clamp((now - a.t0) / a.dur, 0, 1), e = easeInOut(t);
          this.free.cam = {x: lerp(a.from.x, a.to.x, e), y: lerp(a.from.y, a.to.y, e), s: 1 / lerp(1 / a.from.s, 1 / a.to.s, e)};
          if (t < 1) moving = true; else this.free.anim = null;
        }
        this.cam = this.free.cam;
      } else if (this.move) {
        const m = this.move;
        const t = clamp((now - m.t0) / m.dur, 0, 1);
        const p1 = this.fromAnchor(m.a1);
        this.pt = p1;
        // inside a frame the story itself moves (a held frame plays along); between frames it is already there
        this.p = m.a0 ? lerp(this.fromAnchor(m.a0), p1, m.soft ? gentle(t) : easeInOut(t)) : p1;
        this.cam = this.between(m.from, this.camAt(p1), t, m.depth, m.soft);
        if (t < 1) moving = true; else { this.move = null; this.p = p1; this.cam = this.camAt(p1); }
      } else {
        const d = this.pt - this.p;
        if (Math.abs(d) > .35) { this.p += d * (1 - Math.exp(-dt / 75)); moving = true; } else this.p = this.pt;
        this.cam = this.camAt(this.p);
      }
      this.apply();
      this.updateActive(false);
      if (!moving && !this.free) this.watch();
    } catch (err) {
      // whatever threw, put the story's view back and keep going
      this.report(err);
      this.recover('loop');
      try { this.apply(); } catch { /* listeners already isolated */ }
    }
    if (moving) this.request(); else this.last = 0;
    this.viewport.classList.toggle('is-moving', moving);
    // zoomed in past 100% and at rest: let the browser re-raster the world sharp instead of scaling a 100% bitmap
    const sharp = !moving && this.cam.s > 1.01;
    if (sharp !== this.sharp) { this.sharp = sharp; this.world.style.willChange = sharp ? 'auto' : ''; }
  }
  /** At rest on the story, the frame it is on must be on screen; if not (frames replaced, stale measures), re-measure. */
  watch() {
    const r = this.rects[this.active], c = this.cam, vp = this.vp;
    if (!r || !vp) return;
    const L = (r.x - c.x) * c.s, T = (r.y - c.y) * c.s, R = L + r.w * c.s, B = T + r.h * c.s;
    if (!r.el.isConnected || R < 0 || L > vp.w || B < 0 || T > vp.h) {
      this.report(new Error('frame off screen at rest'));
      this.queueLayout();
    }
  }

  updateActive(force) {
    if (!this.segments.length) return;
    const seg = this.segAt(this.p);
    const t = seg.len ? (this.p - seg.start) / seg.len : 1;
    const active = seg.type === 'read' ? seg.i : (t < .5 ? seg.from : seg.to);
    const arrived = !this.free && !this.move && seg.type === 'read' && Math.abs(this.pt - this.p) < 40 ? seg.i : -1;
    if (force || active !== this.active || arrived !== this.arrived) {
      this.active = active; this.arrived = arrived;
      this.onActive?.(active, arrived);
    }
    this.onChange?.(this);
  }

  // ---------- paging ----------
  locked() { return !!this.move; }
  /** The stop one step from story position `p`. Anywhere on a still frame counts as being on its stop. */
  nextStop(p, dir) {
    const list = this.stops;
    if (!list.length) return -1;
    const seg = this.segAt(clamp(p, 0, this.total));
    const here = seg.type === 'read' && this.views[seg.i]?.still ? list.find(s => s.i === seg.i)?.p ?? p : p;
    if (dir > 0) return list.findIndex(s => s.p > here + 2);
    for (let k = list.length - 1; k >= 0; k--) if (list[k].p < here - 2) return k;
    return -1;
  }
  /** One step. False when there is no stop that way (the caller hands the input to the page). */
  step(dir) {
    const k = this.nextStop(this.pt, dir);
    if (k < 0) return false;
    this.goStop(k);
    return true;
  }
  stepDuration(from, to, same) {
    const vp = this.vp;
    const d = Math.hypot(to.x + vp.w / 2 / to.s - (from.x + vp.w / 2 / from.s), to.y + vp.h / 2 / to.s - (from.y + vp.h / 2 / from.s)) / vp.w;
    // inside a frame 1.1 s; between frames 1.15 s for a neighbour, up to 1.4 s across the file
    return same ? clamp(1100 + d * 150, 1100, 1200) : clamp(1150 + d * 45, 1150, 1400);
  }
  goStop(k, settle = false) {
    const s = this.stops[k];
    if (!s) return;
    const seg = this.segAt(this.p);
    const same = seg.type === 'read' && seg.i === s.i;
    const from = {...this.cam}, to = this.camAt(s.p);
    const dist = Math.hypot((to.x - from.x) * to.s, (to.y - from.y) * to.s);
    const dur = settle ? clamp(360 + dist * 1.4, 360, 1100) : this.stepDuration(from, to, same);
    this.move = {from, a0: same ? this.anchorAt(this.p) : null, a1: {type: 'stop', i: s.i, j: s.j}, depth: same || settle ? 0 : 1, soft: true, t0: performance.now(), dur};
    if (!same) this.p = s.p;
    this.pt = s.p;
    this.writeScroll(s.p);
    this.request();
  }
  /** Past the last stop: the page carries on below the canvas (the next project, the footer). The last frame looks the
      same anywhere in its segment, so the scroll moves to the canvas's very end unseen and what is below shows at once. */
  release(how) {
    this.p = this.pt = this.total;
    this.writeScroll(this.total);
    if (how === 'touch') this.smoothScroll(Math.round(this.trackTop + this.total + this.vp.h * .8));
    this.request();
  }
  /** Coming back up from below the canvas: land on the last stop. */
  land() {
    const s = this.stops.at(-1);
    if (!s) return;
    this.move = null;
    this.p = this.pt = s.p;
    this.cam = this.camAt(s.p);
    this.writeScroll(s.p);
    this.request();
  }
  /** Where the page is relative to the canvas: 'above', 'on' (the viewport is pinned) or 'below'. */
  where() {
    const top = this.scrollTop() - this.trackTop;
    return top < -1 ? 'above' : top > this.total + 1 ? 'below' : 'on';
  }
  /** The element under the input that scrolls by itself (a list, a dialog), if any, and whether it can go `dy`. */
  owner(target, dy) {
    const stop = this.scroller === window ? document.body : this.scroller;
    for (let n = target instanceof Element ? target : target?.parentElement; n && n !== stop && n !== document.documentElement; n = n.parentElement) {
      if (n.matches('dialog, [aria-modal="true"]')) return {el: n, can: true};
      if (n.scrollHeight > n.clientHeight + 1) {
        const oy = getComputedStyle(n).overflowY;
        if (oy === 'auto' || oy === 'scroll') return {el: n, can: dy < 0 ? n.scrollTop > 0 : n.scrollTop + n.clientHeight < n.scrollHeight - 1};
      }
    }
    return null;
  }

  // ---------- story input ----------
  /** A plain wheel: one gesture, one stop. */
  onStoryWheel(e) {
    if (e.ctrlKey || e.metaKey) return;               // zoom: onWheel
    const k = lineOf(e), dy = e.deltaY * k, dx = e.deltaX * k;
    if (Math.abs(dx) > Math.abs(dy)) return;          // sideways is not a story gesture
    const now = performance.now();
    let g = this.gesture;
    if (!g || now - g.last >= IDLE) {
      g = this.gesture = {sum: 0, done: false, page: false, last: now, owner: undefined};
    } else g.last = now;
    // a list or a dialog under the pointer scrolls itself, and never chains to the canvas
    if (g.owner === undefined) g.owner = this.owner(e.target, dy);
    if (g.owner) {
      const own = this.owner(e.target, dy);
      if (own?.can) return;
      if (this.where() === 'on') e.preventDefault();
      return;
    }
    if (g.page) return;                               // handed to the page: it scrolls natively to the end of the gesture
    const where = this.where();
    if (where === 'above') return;
    if (where === 'below') {
      // under the canvas the page scrolls by itself, until a scroll up would cross back into the canvas
      if (dy < 0 && this.scrollTop() - this.trackTop + dy < this.total) { e.preventDefault(); g.done = true; this.land(); }
      return;
    }
    if (g.done) { e.preventDefault(); return; }      // the rest of a gesture that already stepped (or was swallowed)
    g.sum += dy;
    if (this.free) {
      e.preventDefault();
      if (Math.abs(g.sum) > 24) { g.done = true; this.backToStory(); }
      return;
    }
    if (Math.abs(g.sum) < NUDGE) { e.preventDefault(); return; }
    g.done = true;
    const dir = Math.sign(g.sum);
    if (this.locked()) { e.preventDefault(); return; } // a transition is running: the whole gesture is swallowed
    if (this.step(dir)) { e.preventDefault(); return; }
    if (dir > 0) { g.page = true; this.release('wheel'); return; } // the wheel's own scroll then shows the page below
    e.preventDefault();
  }
  onScroll() {
    const raw = this.scrollTop();
    if (this.expect != null && Math.abs(raw - this.expect) <= 1.5) { this.expect = null; return; }
    this.expect = null;
    const pt = clamp(raw - this.trackTop, 0, this.total);
    // Focus moving inside an embedded prototype makes the browser scroll this page to "reveal" it, which would move
    // the camera. With focus in the iframe and no wheel, key or touch on this page just before, put the scroll back.
    const ae = document.activeElement;
    if (!this.programmatic && !this.free && ae?.tagName === 'IFRAME' && this.world.contains(ae) && performance.now() - this.lastInput > 400) {
      this.writeScroll(this.pt);
      return;
    }
    const delta = pt - this.pt;
    this.pt = pt;
    if (this.free) {
      if (this.programmatic) return;
      this.freeScroll += Math.abs(delta);
      if (this.freeScroll > 24) this.backToStory();
      return;
    }
    // the page moved by other means (the scrollbar, find in page, a link): follow it, then settle on a stop
    if (this.move) { this.move.a1 = this.anchorAt(pt); this.move.a0 = null; }
    else if (Math.abs(this.pt - this.p) > this.vp.h * 1.4) this.fly(this.pt);
    if (delta) this.dir = Math.sign(delta);
    clearTimeout(this.settleTimer);
    this.settleTimer = setTimeout(() => this.settle(), 180);
    this.request();
  }
  /** The nearest stop to `p`; between two frames, the one the scroll was heading for (unless it barely started). */
  nearestStop(p) {
    const seg = this.segAt(p);
    let i = seg.i;
    if (seg.type === 'move') { const t = seg.len ? (p - seg.start) / seg.len : 1; i = (this.dir >= 0 ? t > .1 : t > .9) ? seg.to : seg.from; }
    let best = -1, d = Infinity;
    this.stops.forEach((s, k) => { if (s.i === i && Math.abs(s.p - p) < d) { d = Math.abs(s.p - p); best = k; } });
    return best;
  }
  /** Don't leave the camera between stops after the page was moved by other means. */
  settle() {
    if (this.free || this.move || this.drag || this.where() !== 'on') return;
    if (this.pt >= this.total - 1) return;           // at the very end: the page below is about to show
    const k = this.nearestStop(this.pt);
    const s = this.stops[k];
    if (!s || Math.abs(s.p - this.pt) < 1) return;
    const seg = this.segAt(this.pt);
    if (seg.type === 'read' && seg.i === s.i && this.views[seg.i]?.still) return; // the same view anywhere on it
    this.goStop(k, true);
  }
  fly(p, ms) {
    const from = {...this.cam};
    this.p = this.pt = p;
    const to = this.camAt(p);
    this.move = {from, a0: null, a1: this.anchorAt(p), depth: 1, soft: true, t0: performance.now(), dur: ms ?? this.stepDuration(from, to, false)};
    this.request();
  }
  /** Story position `p` (or frame i at local offset `local`), flown to. */
  jump(i, local = 0) {
    const seg = this.readStart(i);
    if (!seg) return;
    const own = this.stops.filter(s => s.i === i);
    // a frame's own name goes to its first stop
    const p = local <= 0 && own.length ? own[0].p : seg.start + clamp(local, 0, seg.len - 1);
    this.exitFree(false);
    this.writeScroll(p);
    this.fly(p);
  }
  onFocus(e) {
    if (this.free || this.programmatic) return;
    const target = e.target, frame = target.closest?.('[data-frame]');
    if (!frame) return;
    const i = this.rects.findIndex(r => r.el === frame);
    if (i < 0) return;
    // already on screen inside the stage: nothing to do
    const r = target.getBoundingClientRect(), vp = this.viewport.getBoundingClientRect(), ins = this.insets(this.rects[i], this.vp);
    if (i === this.active && r.top >= vp.top + ins.t - 8 && r.bottom <= vp.bottom - ins.b + 8 && r.left >= vp.left && r.right <= vp.right) return;
    const local = offsetWithin(target, frame).y;
    const stageH = this.vp.h - ins.t - ins.b;
    // something tall (the live editor) is shown from its top; anything else a little above the middle
    const lead = target.offsetHeight > stageH * .6 ? 16 : stageH * .3;
    requestAnimationFrame(() => this.jump(i, Math.max(1, local - lead)));
  }

  // ---------- free camera ----------
  enterFree() {
    if (this.free) return;
    this.move = null;
    this.free = {cam: {...this.cam}};
    this.freeScroll = 0;
    this.viewport.classList.add('is-free');
    this.onFree?.(true);
  }
  exitFree(animate = true) {
    if (!this.free) return;
    const from = this.free.cam;
    this.free = null;
    this.viewport.classList.remove('is-free');
    this.onFree?.(false);
    if (animate) {
      this.p = this.pt;
      this.move = {from, a0: null, a1: this.anchorAt(this.pt), depth: .6, soft: false, t0: performance.now(), dur: 820};
      this.request();
    }
  }
  backToStory() { this.exitFree(true); }
  /** The page opens on the canvas a little zoomed out, then settles on the first frame. */
  intro() {
    if (!this.segments.length || this.p > 40) return;
    const to = this.camAt(this.p), vp = this.vp, s = .5;
    const P = {x: vp.w / 2, y: vp.h / 2}, c = {x: to.x + P.x / to.s, y: to.y + P.y / to.s};
    const from = {x: c.x - P.x / s + 220, y: c.y - P.y / s + 140, s};
    this.cam = from;
    this.move = {from, a0: null, a1: this.anchorAt(this.p), depth: 0, soft: false, t0: performance.now() + 200, dur: 1400};
    this.apply();
    this.request();
  }
  freeTo(to, dur = 520) {
    this.enterFree();
    this.free.anim = {from: {...this.free.cam}, to, t0: performance.now(), dur};
    this.request();
  }
  zoomAt(px, py, factor, animate = false) {
    this.enterFree();
    const c = this.free.anim ? this.free.anim.to : this.free.cam;
    const s = clamp(c.s * factor, MIN_S, MAX_S);
    const wx = c.x + px / c.s, wy = c.y + py / c.s;
    const to = {x: wx - px / s, y: wy - py / s, s};
    if (animate) this.freeTo(to, 260);
    else { this.free.anim = null; this.free.cam = to; this.request(); }
  }
  zoomBy(factor) { this.zoomAt(this.vp.w / 2, this.vp.h / 2, factor, true); }
  zoomTo100() { const c = this.cam; this.zoomAt(this.vp.w / 2, this.vp.h / 2, 1 / c.s, true); }
  zoomToFit() {
    const b = this.bounds, vp = this.vp, ins = this.insets({wide: false}, vp);
    const w = vp.w - ins.l - ins.r, h = vp.h - ins.t - ins.b;
    const s = clamp(Math.min(w / b.w, h / b.h) * .96, MIN_S, 1);
    this.freeTo({x: b.x - (ins.l + (w - b.w * s) / 2) / s, y: b.y - (ins.t + (h - b.h * s) / 2) / s, s}, 700);
  }

  onWheel(e) {
    if (!(e.ctrlKey || e.metaKey)) return;     // a plain wheel pages the story (onStoryWheel)
    e.preventDefault();
    const r = this.viewport.getBoundingClientRect();
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    // a mouse wheel notch (about 100) zooms by about a third; a trackpad pinch sends small deltas and zooms smoothly
    this.zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-clamp(dy, -100, 100) * .004));
  }
  onGesture(e) {
    // Safari trackpad pinch
    e.preventDefault();
    if (e.type === 'gesturestart') { this.gestureScale = 1; return; }
    const r = this.viewport.getBoundingClientRect();
    this.zoomAt(e.clientX - r.left, e.clientY - r.top, e.scale / (this.gestureScale || 1));
    this.gestureScale = e.scale;
  }
  canDrag(e) {
    if (this.tool === 'hand' || e.button === 1) return true;
    if (e.button !== 0) return false;
    // the canvas itself, a section's background, a frame's name: not a frame's content
    return !e.target.closest('[data-frame-body], .rfaw-ui, a, button, input, iframe');
  }
  onDown(e) {
    this.pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
    // a one-finger touch anywhere on the canvas (not the panel or toolbar) may be a swipe: one stop
    this.swipe = e.pointerType === 'touch' && this.pointers.size === 1 && !e.target.closest('.rfaw-ui')
      ? {id: e.pointerId, x: e.clientX, y: e.clientY, t0: performance.now()} : null;
    if (e.pointerType === 'touch' && this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      this.drag = null;
      this.pinch = {d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2};
      return;
    }
    if (!this.canDrag(e)) return;
    if (e.pointerType === 'mouse' || e.pointerType === 'pen' || this.tool === 'hand') e.preventDefault();
    this.drag = {id: e.pointerId, x: e.clientX, y: e.clientY, moved: false, touch: e.pointerType === 'touch'};
  }
  onMove(e) {
    if (this.pointers.has(e.pointerId)) this.pointers.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (this.pinch && this.pointers.size >= 2) {
      const [a, b] = [...this.pointers.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const r = this.viewport.getBoundingClientRect();
      this.enterFree();
      const c = this.free.cam;
      // pan with the midpoint, zoom about it
      this.free.cam = {x: c.x - (mx - this.pinch.mx) / c.s, y: c.y - (my - this.pinch.my) / c.s, s: c.s};
      this.zoomAt(mx - r.left, my - r.top, d / (this.pinch.d || d));
      this.pinch = {d, mx, my};
      return;
    }
    const g = this.drag;
    if (!g || g.id !== e.pointerId) return;
    const dx = e.clientX - g.x, dy = e.clientY - g.y;
    if (!g.moved) {
      // on touch, a mostly vertical swipe pages the story (onUp), it doesn't pan
      if (g.touch && Math.abs(dy) > Math.abs(dx)) { this.drag = null; return; }
      if (Math.hypot(dx, dy) < 4) return;
      g.moved = true;
      if (this.swipe?.id === e.pointerId) this.swipe = null;
      try { this.viewport.setPointerCapture(e.pointerId); } catch { /* gone */ }
      this.viewport.classList.add('is-dragging');
      this.enterFree();
    }
    const c = this.free.cam;
    this.free.anim = null;
    this.free.cam = {x: c.x - dx / c.s, y: c.y - dy / c.s, s: c.s};
    g.x = e.clientX; g.y = e.clientY;
    this.request();
  }
  onUp(e) {
    const sw = this.swipe;
    if (sw?.id === e.pointerId) {
      this.swipe = null;
      const dx = e.clientX - sw.x, dy = e.clientY - sw.y, dt = performance.now() - sw.t0;
      const far = Math.abs(dy) >= SWIPE || (Math.abs(dy) >= SWIPE / 2 && Math.abs(dy) / dt > .4);
      if (e.type === 'pointerup' && !this.pinch && far && dt < 900 && Math.abs(dy) > Math.abs(dx) * 1.2) this.swipeStep(dy < 0 ? 1 : -1);
    }
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (this.drag?.id === e.pointerId) { this.drag = null; this.viewport.classList.remove('is-dragging'); }
  }
  swipeStep(dir) {
    if (this.free) { this.backToStory(); return; }
    if (this.locked() || this.where() !== 'on') return;
    if (!this.step(dir) && dir > 0) this.release('touch');
  }
  onKey(e) {
    const t = e.target;
    const typing = t.closest?.('input, textarea, select, [contenteditable], iframe');
    if (e.key === 'Escape' && this.free) { this.backToStory(); return; }
    if (typing) return;
    if (e.defaultPrevented || e.target.closest?.('.v2-lb, dialog')) return;
    if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (e.code === 'Digit1') { e.preventDefault(); this.zoomToFit(); return; }
      if (e.code === 'Digit0') { e.preventDefault(); this.zoomTo100(); return; }
    }
    this.keyStep(e);
  }
  /** Arrows, Page Up/Down, space and shift+space: one stop. Home and End: the first and the last. */
  keyStep(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const t = e.target;
    const space = e.key === ' ' || e.key === 'Spacebar';
    const dir = {ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1}[e.key] ?? (space ? (e.shiftKey ? -1 : 1) : 0);
    const edge = e.key === 'Home' ? -1 : e.key === 'End' ? 1 : 0;
    if (!dir && !edge) return;
    // keys a focused control uses itself
    if (space && t.closest?.('button, a[href], summary, label, [role=button], [role=checkbox], [role=switch], [role=tab], [role=menuitem], [role=option]')) return;
    if (t.closest?.('[role=slider], [role=tablist], [role=radiogroup], [role=menu], [role=listbox], [role=grid], [role=tree], [role=spinbutton]')) return;
    if (this.owner(t, dir || edge)?.can) return;   // a focused list scrolls itself
    const where = this.where();
    if (where === 'above') return;
    if (where === 'below') {
      // under the canvas the page scrolls; a key that would cross back into the canvas lands on the last stop
      const by = e.key.startsWith('Arrow') ? 40 : this.vp.h * .85;
      if (dir < 0 && this.scrollTop() - this.trackTop - by < this.total) {
        e.preventDefault();
        const s = this.stops.at(-1);
        if (s) this.smoothScroll(Math.round(this.trackTop + s.p));
      }
      return;
    }
    if (this.free) { e.preventDefault(); this.backToStory(); return; }
    // holding a key doesn't race through the file, and a transition finishes before the next one
    if (e.repeat || this.locked()) { e.preventDefault(); return; }
    if (edge) {
      e.preventDefault();
      if (this.nextStop(this.pt, edge) >= 0) this.goStop(edge < 0 ? 0 : this.stops.length - 1);
      return;
    }
    if (this.step(dir)) { e.preventDefault(); return; }
    // past the last stop the key's own scroll shows the page below; before the first there is nothing above
    if (dir > 0) this.release('key'); else e.preventDefault();
  }
  setTool(tool) { this.tool = tool; this.viewport.classList.toggle('is-hand', tool === 'hand'); }

  /** Screen position (viewport px) of a world point under the current camera. */
  project(wx, wy, cam = this.cam) { return {x: (wx - cam.x) * cam.s, y: (wy - cam.y) * cam.s}; }
  /** World position of an element's box, from its offsets inside the world. */
  worldRect(el) {
    const frame = el.closest('[data-frame]');
    const r = frame && this.rects.find(x => x.el === frame);
    if (!r) return null;
    const o = offsetWithin(el, frame);
    return {x: r.x + o.x, y: r.y + o.y, w: el.offsetWidth, h: el.offsetHeight};
  }
}
