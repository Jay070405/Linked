// The game on the machine's screen. Jay runs, blocks come at him, and over three of them hang the letters G, R and F
// (goal, rules, feedback). Jump a block cleanly and its letter is yours; hit it and the same letter comes round again.
// Nobody has to play: until the first press Jay plays it himself, the way an agent would, and a visitor takes over by pressing.
// Everything is in dots of the 96 x 64 screen and in seconds; drawing is done by screen.js.
export const RUN = {jx: 9, ground: 55, speed: 34};
const UP = 86, G = 232;

export function createRunner() {
  const r = {};
  r.reset = () => Object.assign(r, {h: 0, v: 0, air: false, obs: [], next: 1, got: [false, false, false], demo: true, clear: 0, dist: 0, hit: 0, land: 0, sparks: []});
  r.reset();
  // a press: take over from the demo, start again after a clear, or jump
  r.jump = () => {
    let what = null;
    if (r.demo) { r.demo = false; r.obs.forEach(o => { o.ghost = true; }); what = 'take'; } // letters already on screen during the demo do not count
    if (r.clear > 1.2) { r.got = [false, false, false]; r.clear = 0; r.obs = []; r.next = .7; return 'again'; }
    if (!r.air && r.clear === 0) { r.v = UP; r.air = true; what = what || 'jump'; }
    return what;
  };
  r.step = dt => {
    const out = [], speed = RUN.speed * (1 + .1 * r.got.filter(Boolean).length); // every letter taken makes the next one come a little faster
    r.dist += speed * dt; r.hit = Math.max(0, r.hit - dt); r.land = Math.max(0, r.land - dt);
    if (r.air) { r.h += r.v * dt; r.v -= G * dt; if (r.h <= 0) { r.h = 0; r.v = 0; r.air = false; r.land = .18; } }
    if (r.clear > 0) { r.clear += dt; r.sparks.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; }); return out; }
    r.next -= dt;
    if (r.next <= 0) { r.next = 1.55 + Math.random() * .6; const token = r.got.indexOf(false); r.obs.push({x: 99, w: 5, h: 6 + (Math.random() < .4 ? 2 : 0), token, ghost: r.demo}); }
    const x0 = RUN.jx + 4, x1 = RUN.jx + 13;
    for (const o of r.obs) { o.x -= speed * dt;
      const over = o.x < x1 && o.x + o.w > x0;
      if (over && !o.done) {
        if (r.h < o.h) { o.done = true; o.bumped = true; if (!r.demo) { r.hit = .45; out.push(['hit']); } }
        else if (o.x + o.w / 2 < RUN.jx + 9) { o.done = true; // the middle of the block is behind him: cleared
          if (!o.ghost && o.token >= 0 && !r.got[o.token]) { r.got[o.token] = true; out.push(['got', o.token]);
            if (r.got.every(Boolean)) { r.clear = .001; r.obs = []; r.sparks = Array.from({length: 26}, () => ({x: 48, y: 30, vx: (Math.random() - .5) * 90, vy: -20 - Math.random() * 60})); out.push(['clear']); } } }
      }
    }
    r.obs = r.obs.filter(o => o.x > -8);
    if (r.demo && !r.air) { const o = r.obs.find(q => !q.done && q.x > x1 - 2); if (o && o.x - x1 < 9) { r.v = UP; r.air = true; out.push(['jump']); } }
    return out;
  };
  return r;
}
