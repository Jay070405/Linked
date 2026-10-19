import {scrollerOf} from '../../v2/motion';

/* The canvas camera. Frames ([data-frame]) sit in Figma-style sections ([data-section]), one section per row, left to
   right, on a world that is moved with one transform. Page scroll is the story: it is cut into segments, a "read"
   segment per frame (the camera pans down a tall frame at 100%, or rests on a short one) and a "move" segment between
   frames (the camera zooms out, pans, zooms back in). Dragging the canvas, ctrl/cmd + wheel, a trackpad pinch or a
   two-finger pinch detach the camera ("free"); scrolling again, Escape or Back to the story fly it back.

   World units are CSS px at 100%. A camera {x, y, s} puts world point (x, y) at the viewport's top-left corner:
   screen = (world - camera) * s. */

const GAP = 200;          // between frames in a row
const ROW_GAP = 520;      // between section rows
const PAD = 120;          // section padding around its frames
const HEAD = 40;          // extra room above the frames for the section's name
const MIN_S = .04, MAX_S = 4;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
    this.cam = {x: 0, y: 0, s: 1};
    this.p = 0; this.pt = 0; this.total = 0; this.trackTop = 0;
    this.rects = []; this.sections = []; this.segments = [];
    this.free = null;       // {cam, anim?} while detached
    this.flight = null;     // {from, t0, dur, mid}
    this.listeners = new Set();
    this.active = -1; this.arrived = -1;
    this.tool = 'move';
    this.raf = 0; this.last = 0; this.layoutQueued = 0;
    this.pointers = new Map(); this.drag = null; this.pinch = null;
    this.freeScroll = 0;
  }

  // ---------- lifecycle ----------
  start() {
    const s = this.scroller;
    this.onScroll = this.onScroll.bind(this);
    this.onResize = () => this.queueLayout();
    this.onWheel = this.onWheel.bind(this);
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
    this.world.querySelectorAll('[data-frame]').forEach(f => this.ro.observe(f));
    this.layout(true);
  }
  stop() {
    const s = this.scroller;
    s.removeEventListener('scroll', this.onScroll);
    ['wheel', 'keydown', 'touchmove', 'pointerdown'].forEach(t => removeEventListener(t, this.onInput, {capture: true}));
    removeEventListener('resize', this.onResize);
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
    cancelAnimationFrame(this.raf); cancelAnimationFrame(this.layoutQueued); clearTimeout(this.snapTimer);
    // hand the DOM back to the flow layout
    this.world.style.transform = '';
    this.track.style.height = '';
    this.world.querySelectorAll('[data-frame],[data-section]').forEach(el => { el.style.left = ''; el.style.top = ''; el.style.width = ''; el.style.height = ''; });
  }
  subscribe(fn) { this.listeners.add(fn); fn(this.cam, this); return () => this.listeners.delete(fn); }

  // ---------- layout ----------
  queueLayout() {
    if (this.layoutQueued) return;
    this.layoutQueued = requestAnimationFrame(() => { this.layoutQueued = 0; this.layout(false); });
  }
  layout(first) {
    const vp = this.vp = {w: this.viewport.clientWidth, h: this.viewport.clientHeight};
    if (!vp.w || !vp.h) return;
    // where we are, so a relayout keeps the reader's place
    const anchor = first ? null : this.anchor();
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
        rects.push({el: f, id: f.dataset.frame, wide: f.hasAttribute('data-wide'), hold: Number(f.dataset.hold) || 0, section: si, x, y: y + top, w, h, local: {x, y: top}});
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
    this.track.style.height = `${Math.round(off + vp.h)}px`;
    this.trackTop = this.measureTrackTop();

    if (anchor) {
      const p = this.fromAnchor(anchor);
      if (Math.abs(p - this.p) > .5) { this.p = this.pt = p; this.setScroll(p); }
    } else {
      this.pt = this.p = clamp(this.scrollTop() - this.trackTop, 0, this.total);
    }
    if (!this.free) this.cam = this.camAt(this.p);
    this.apply();
    this.updateActive(true);
  }

  /** The view of one frame: centered in the stage at 100%; a tall frame scrolls from its top to its bottom. */
  view(r) {
    const vp = this.vp, ins = this.insets(r, vp);
    const stageW = vp.w - ins.l - ins.r, stageH = vp.h - ins.t - ins.b;
    const x = r.x - (ins.l + (stageW - r.w) / 2);
    // a frame can ask to hold the camera longer (the compile is scrubbed by this segment)
    const hold = r.hold * vp.h;
    if (r.h <= stageH) {
      const y = r.y - (ins.t + (stageH - r.h) / 2);
      // a short frame still holds the camera for a moment, drifting a little so the scroll is felt
      return {start: {x, y: y - 14, s: 1}, end: {x, y: y + 14, s: 1}, len: Math.round(vp.h * .34 + hold)};
    }
    const y0 = r.y - ins.t, y1 = r.y + r.h - (vp.h - ins.b);
    return {start: {x, y: y0, s: 1}, end: {x, y: y1, s: 1}, len: Math.round(y1 - y0 + vp.h * .12 + hold)};
  }

  measureTrackTop() {
    const s = this.scroller, r = this.track.getBoundingClientRect();
    return s === window ? r.top + scrollY : r.top - s.getBoundingClientRect().top + s.scrollTop;
  }
  scrollTop() { return this.scroller === window ? scrollY : this.scroller.scrollTop; }
  setScroll(p) {
    const top = Math.round(this.trackTop + p);
    if (this.scroller === window) window.scrollTo({top, behavior: 'instant'});
    else this.scroller.scrollTo({top, behavior: 'instant'});
  }

  segAt(p) {
    const list = this.segments;
    let lo = 0, hi = list.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (list[mid].start <= p) lo = mid; else hi = mid - 1; }
    return list[lo];
  }
  anchor() {
    if (!this.segments.length) return null;
    const seg = this.segAt(this.p);
    return seg.type === 'read' ? {type: 'read', i: seg.i, d: this.p - seg.start} : {type: 'move', to: seg.to, t: seg.len ? (this.p - seg.start) / seg.len : 0};
  }
  fromAnchor(a) {
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
      enough to show both ends of the move. */
  between(A, B, t, depth = 1) {
    const vp = this.vp, P = {x: vp.w / 2, y: vp.h / 2};
    const cA = {x: A.x + P.x / A.s, y: A.y + P.y / A.s}, cB = {x: B.x + P.x / B.s, y: B.y + P.y / B.s};
    const dx = Math.abs(cB.x - cA.x), dy = Math.abs(cB.y - cA.y);
    const mid = clamp(Math.min(vp.w / (dx + vp.w * 1.1), vp.h / (dy + vp.h * 1.1)), .045, .92);
    const base = (1 / A.s + 1 / B.s) / 2;
    const bump = Math.max(0, 1 / mid - base) * depth;
    const e = easeInOut(t);
    const inv = lerp(1 / A.s, 1 / B.s, e) + bump * Math.sin(Math.PI * t);
    const s = 1 / inv;
    const c = {x: lerp(cA.x, cB.x, e), y: lerp(cA.y, cB.y, e)};
    return {x: c.x - P.x / s, y: c.y - P.y / s, s};
  }

  apply() {
    const {x, y, s} = this.cam;
    this.world.style.transform = `translate3d(${(-x * s).toFixed(2)}px, ${(-y * s).toFixed(2)}px, 0) scale(${s.toFixed(5)})`;
    this.listeners.forEach(fn => fn(this.cam, this));
  }
  request() { if (!this.raf) this.raf = requestAnimationFrame(this.tick ||= this.loop.bind(this)); }
  loop(now) {
    this.raf = 0;
    const dt = Math.min(64, now - (this.last || now)); this.last = now;
    let moving = false;
    if (this.free) {
      const a = this.free.anim;
      if (a) {
        const t = clamp((now - a.t0) / a.dur, 0, 1), e = easeInOut(t);
        this.free.cam = {x: lerp(a.from.x, a.to.x, e), y: lerp(a.from.y, a.to.y, e), s: 1 / lerp(1 / a.from.s, 1 / a.to.s, e)};
        if (t < 1) moving = true; else this.free.anim = null;
      }
      this.cam = this.free.cam;
    } else {
      const d = this.pt - this.p;
      if (Math.abs(d) > .35) { this.p += d * (1 - Math.exp(-dt / 75)); moving = true; } else this.p = this.pt;
      let cam = this.camAt(this.p);
      const f = this.flight;
      if (f) {
        const t = clamp((now - f.t0) / f.dur, 0, 1);
        cam = this.between(f.from, cam, t, f.depth);
        if (t < 1) moving = true; else this.flight = null;
      }
      this.cam = cam;
    }
    this.apply();
    this.updateActive(false);
    if (moving) this.request(); else this.last = 0;
    this.viewport.classList.toggle('is-moving', moving);
    // zoomed in past 100% and at rest: let the browser re-raster the world sharp instead of scaling a 100% bitmap
    const sharp = !moving && this.cam.s > 1.01;
    if (sharp !== this.sharp) { this.sharp = sharp; this.world.style.willChange = sharp ? 'auto' : ''; }
  }

  updateActive(force) {
    if (!this.segments.length) return;
    const seg = this.segAt(this.p);
    const t = seg.len ? (this.p - seg.start) / seg.len : 1;
    const active = seg.type === 'read' ? seg.i : (t < .5 ? seg.from : seg.to);
    const arrived = !this.free && !this.flight && seg.type === 'read' && Math.abs(this.pt - this.p) < 40 ? seg.i : -1;
    if (force || active !== this.active || arrived !== this.arrived) {
      this.active = active; this.arrived = arrived;
      this.onActive?.(active, arrived);
    }
    this.onChange?.(this);
  }

  // ---------- story input ----------
  onScroll() {
    const pt = clamp(this.scrollTop() - this.trackTop, 0, this.total);
    // Focus moving inside an embedded prototype makes the browser scroll this page to "reveal" it, which would move
    // the camera. With focus in the iframe and no wheel, key or touch on this page just before, put the scroll back.
    const ae = document.activeElement;
    if (!this.programmatic && !this.free && ae?.tagName === 'IFRAME' && this.world.contains(ae) && performance.now() - this.lastInput > 400) {
      this.programmatic = true;
      this.setScroll(this.pt);
      requestAnimationFrame(() => { this.programmatic = false; });
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
    // a big jump (Home, End, a link): fly there instead of sweeping past every frame in between
    if (Math.abs(this.pt - this.p) > this.vp.h * 1.4) this.fly(this.pt);
    if (delta) this.dir = Math.sign(delta);
    clearTimeout(this.snapTimer);
    if (!this.programmatic) this.snapTimer = setTimeout(() => this.snap(), 220);
    this.request();
  }
  /** Don't leave the camera hanging between two frames: when the scroll rests inside a move, finish it in the
      direction it was going (or go back, if it barely started). */
  snap() {
    if (this.free || this.flight || this.drag) return;
    const seg = this.segAt(this.pt);
    if (seg.type !== 'move' || !seg.len) return;
    const t = (this.pt - seg.start) / seg.len;
    if (t <= .004 || t >= .996) return;
    const forward = this.dir >= 0 ? t > .1 : t > .9;
    const target = forward ? seg.start + seg.len + 2 : seg.start - 2;
    const top = Math.round(this.trackTop + target);
    if (this.scroller === window) window.scrollTo({top, behavior: 'smooth'});
    else this.scroller.scrollTo({top, behavior: 'smooth'});
  }
  fly(p, ms) {
    const from = this.cam;
    this.p = this.pt = p;
    const to = this.camAt(p);
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    this.flight = {from, t0: performance.now(), dur: ms ?? clamp(520 + dist * .05, 620, 1150), depth: 1};
    this.request();
  }
  /** Story position `p` (or frame i at local offset `local`), flown to. */
  jump(i, local = 0) {
    const seg = this.readStart(i);
    if (!seg) return;
    const p = seg.start + clamp(local, 0, seg.len);
    this.exitFree(false);
    this.programmatic = true;
    this.setScroll(p);
    requestAnimationFrame(() => { this.programmatic = false; });
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
    requestAnimationFrame(() => this.jump(i, local - lead));
  }

  // ---------- free camera ----------
  enterFree() {
    if (this.free) return;
    this.flight = null;
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
      this.flight = {from, t0: performance.now(), dur: 820, depth: .6};
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
    this.flight = {from, t0: performance.now() + 200, dur: 1400, depth: 0};
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
    if (!(e.ctrlKey || e.metaKey)) return;     // a plain wheel scrolls the story
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
      // on touch, a mostly vertical swipe is the page scrolling, not a pan
      if (g.touch && Math.abs(dy) > Math.abs(dx)) { this.drag = null; return; }
      if (Math.hypot(dx, dy) < 4) return;
      g.moved = true;
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
    this.pointers.delete(e.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (this.drag?.id === e.pointerId) { this.drag = null; this.viewport.classList.remove('is-dragging'); }
  }
  onKey(e) {
    const t = e.target;
    const typing = t.closest?.('input, textarea, select, [contenteditable], iframe');
    if (e.key === 'Escape' && this.free) { this.backToStory(); return; }
    if (typing) return;
    if (e.defaultPrevented || e.target.closest?.('.v2-lb')) return;
    if (e.shiftKey && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (e.code === 'Digit1') { e.preventDefault(); this.zoomToFit(); }
      else if (e.code === 'Digit0') { e.preventDefault(); this.zoomTo100(); }
    }
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
