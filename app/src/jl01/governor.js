// The picture's resolution follows the machine it runs on.
// The stage tells the governor the time of every frame. About once a second it looks at how long frames have been taking and
// may answer with a new resolution for the canvas (pixels per page pixel); otherwise it answers null.
//   - Frames slower than SLOW for two looks running (a hitch while pictures load is not a slow machine, and neither are the
//     first seconds of a visit): jump down to the page's own resolution (1), and only if that is still far too slow, to `min`.
//     A jump is kept only if it bought time. If fewer pixels changed nothing, something else is setting the pace (a frame-rate
//     cap, a saver mode, a busy processor), so the picture gets its pixels back and the governor leaves it alone for a while.
//   - Frames with time to spare: climb back up, 15% every two seconds. A step that turns out one too many is taken back at
//     once, remembered as the ceiling for a while, and makes the next attempt wait longer.
// It judges by frame intervals, which a display rounds up to whole refreshes; that is why going down is a jump (a small step
// often cannot cross a refresh boundary and would look useless) and going up is a creep (it stops at the first step that does).
// The words on the page are the page's own type and stay sharp whatever the canvas does.
const SLOW = 21, SPARE = 17.6, VERY_SLOW = 30; // milliseconds a frame: under some 48 a second is slow; under 33 is very slow

export function createGovernor({max, min = .7, soft = 1}) {
  const G = {dpr: max, max, avg: 0, t: 0, sum: 0, n: 0, started: false, hold: 0, lock: 0, wait: 45000, up: 0, cool: 6000, slow: 0,
    probe: false, from: max, before: 0, upFrom: null, upAt: 0, ceil: null, ceilUntil: 0};
  const set = (v, t) => { G.dpr = v; G.hold = t + 700; return v; }; // a change of size costs a few frames itself: do not count them
  G.frame = (t, hidden = false) => {
    const d = t - G.t; G.t = t;
    if (!G.started) { G.started = true; G.hold = t + 6000; return null; } // the first seconds compile shaders and decode pictures: not a fair sample
    if (d < 200 && !hidden) { G.sum += d; G.n++; }
    if (G.n < 45 || G.sum < 700) return null;
    const avg = G.avg = G.sum / G.n; G.sum = 0; G.n = 0;
    if (t < G.hold) return null;
    if (G.ceil != null && t > G.ceilUntil) G.ceil = null;
    if (G.probe) { // a jump down is being judged
      G.probe = false; G.slow = 0;
      if (avg < G.before * .88) { G.wait = 45000; return null; }
      G.lock = t + G.wait; G.wait = Math.min(600000, G.wait * 2); return set(G.from, t);
    }
    if (avg > SLOW) {
      if (G.upFrom != null && t - G.upAt < 3500) { // the last step up was one too many
        G.ceil = G.dpr; G.ceilUntil = t + 30000; const back = G.upFrom; G.upFrom = null; G.up = t + G.cool; G.cool = Math.min(60000, G.cool * 1.6); return set(back, t); }
      if (t < G.lock || ++G.slow < 2) return null;
      const to = G.dpr > soft + .01 ? soft : avg > VERY_SLOW && G.dpr > min + .01 ? min : null;
      if (to == null) return null;
      G.probe = true; G.from = G.dpr; G.before = avg; G.upFrom = null; return set(Math.min(to, G.dpr), t);
    }
    G.slow = 0;
    if (G.upFrom != null && t - G.upAt >= 3500) G.upFrom = null; // the step up held
    const top = Math.min(G.max, G.ceil != null ? G.ceil - .04 : G.max);
    if (avg < SPARE && t > G.up && G.dpr < top - .004) { G.upFrom = G.dpr; G.upAt = t; G.up = t + 2000; return set(Math.min(top, G.dpr * 1.15), t); }
    return null;
  };
  return G;
}
