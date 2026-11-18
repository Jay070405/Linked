// The site's page change, in the home machine's own manner (src/jl01/wipe.js): its screen dots spill over the page from
// where you pressed, the page changes underneath, the cover says where you are, and the dots drain away.
// The contract is the one the circular transition had: run(action) with an action that may be async and is told whether it
// is still the latest request; requests that arrive while one is running are coalesced, and only the newest commits.
const IN = 260, GROW = 160, OUT = 260, HOLD = 300;

// what the cover says: the part of the site you have arrived in, and under it the page
export function placeOf(pathname = '/', hash = '') {
  const path = pathname.replace(/\/+$/, '') || '/', [, head, ...rest] = path.split('/');
  const label = head === 'product' ? 'PRODUCT' : head === 'systems' ? 'SYSTEMS' : head === 'works' ? 'ART' : head === 'other-project' || head === 'vibecoding' ? 'OTHER' : head === 'about' ? 'ABOUT' : head === 'for' ? 'HELLO'
    : hash === '#contact' ? 'HELLO' : 'JL-01';
  return {label, sub: rest.length ? rest[rest.length - 1].replace(/-/g, ' ').toUpperCase() : ''};
}

export function createDotTransition(node, isReduced, doc = document) {
  const win = doc.defaultView || globalThis, canvas = node.querySelector('canvas'), g = canvas?.getContext?.('2d');
  let pending = null, running = false, alive = true, generation = 0, raf = 0, press = null;
  const block = event => event.preventDefault();
  node.addEventListener('wheel', block, {passive: false}); node.addEventListener('touchmove', block, {passive: false});
  // the dots start where the visitor pressed, if they pressed just now
  const pressed = event => { press = {x: event.clientX, y: event.clientY, t: win.performance.now()}; };
  doc.addEventListener('pointerdown', pressed, true);
  const tone = () => { let side = null; try { side = win.sessionStorage.getItem('jl-side'); } catch { /* storage is optional */ } return side === 'game' ? ['#EFE3CB', '#14110D'] : ['#0A0B0D', '#F2F2EF']; };
  const clear = () => { win.cancelAnimationFrame?.(raf); raf = 0; node.classList.remove('is-active'); if (g) g.clearRect(0, 0, canvas.width, canvas.height); };

  const update = async () => {
    // History can change while an imported page is loading. Only commit the latest request.
    while (pending && alive) { const job = pending; pending = null; await job.action(() => alive && generation === job.id); }
  };
  const begin = () => {
    const W = win.innerWidth, H = win.innerHeight, dpr = Math.min(win.devicePixelRatio || 1, 2), fresh = press && win.performance.now() - press.t < 900;
    const x = fresh ? press.x : W / 2, y = fresh ? press.y : H / 2, [color, ink] = tone();
    canvas.width = W * dpr; canvas.height = H * dpr;
    const cell = Math.max(20, Math.round(Math.min(W, H) / 24));
    return {W, H, dpr, x, y, color, ink, cell, cols: Math.ceil(W / cell) + 1, rows: Math.ceil(H / cell) + 1, far: Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) || 1, label: '', sub: ''};
  };
  // one frame. dir > 0: the dots grow outwards from the press; dir < 0: they drain in the same order. a: how much of the label shows
  const paint = (st, dir, t, a) => {
    const {W, H, dpr, x, y, cell, cols, rows, far} = st;
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.fillStyle = st.color;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cx = c * cell + cell / 2, cy = r * cell + cell / 2, d = Math.hypot(cx - x, cy - y) / far;
      const k = dir === 0 ? 1 : dir > 0 ? (t - d * IN) / GROW : 1 - (t - d * OUT) / GROW;
      if (k <= 0) continue;
      if (k >= 1) g.fillRect(cx - cell / 2 - .5, cy - cell / 2 - .5, cell + 1, cell + 1);
      else { g.beginPath(); g.arc(cx, cy, k * cell * .74, 0, 6.2832); g.fill(); }
    }
    if (st.label && a > 0) {
      const big = Math.min(W * .17, H * .26, 230, W * .84 / (st.label.length * .62));
      g.globalAlpha = Math.min(1, a); g.fillStyle = st.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.font = `900 ${big}px "JL Dot",ui-monospace,monospace`; g.fillText(st.label, W / 2, H / 2 - big * .08);
      if (st.sub) { g.font = `500 ${Math.max(11, big * .085)}px ui-monospace,"SF Mono",Menlo,monospace`; try { g.letterSpacing = '.3em'; } catch { /* older canvas */ } g.fillText(st.sub, W / 2, H / 2 + big * .6); try { g.letterSpacing = '0px'; } catch { /* older canvas */ } }
      g.globalAlpha = 1;
    }
  };
  // run one phase for `ms`. A page that stops getting frames (a tab that went to the background) must still finish its navigation,
  // so a timer ends the phase if the frames do not
  const phase = (st, dir, ms) => new Promise(resolve => {
    const t0 = win.performance.now(); let over = false;
    const end = () => { if (over) return; over = true; win.clearTimeout(guard); win.cancelAnimationFrame(raf); resolve(); };
    const guard = win.setTimeout(end, ms + 400);
    const frame = now => { if (over) return; const t = now - t0;
      paint(st, dir, t, dir === 0 ? Math.min(t / 120, 1) : dir < 0 ? 1 - t / 110 : 0);
      if (t < ms && alive) raf = win.requestAnimationFrame(frame); else end(); };
    raf = win.requestAnimationFrame(frame);
  });

  const run = async action => {
    if (!alive) return;
    pending = {action, id: ++generation};
    if (running) return;
    running = true;
    try {
      while (pending && alive) {
        const source = doc.activeElement; let destination = source;
        node.classList.add('is-active'); node.focus({preventScroll: true});
        if (isReduced() || doc.hidden || !g || !win.requestAnimationFrame) await update();
        else {
          const st = begin();
          await phase(st, 1, IN + GROW);              // cover
          paint(st, 0, 0, 0);
          await update();                             // the page changes underneath (and may take a moment to load)
          if (alive) {
            destination = doc.activeElement !== node ? doc.activeElement : source; node.focus({preventScroll: true});
            Object.assign(st, placeOf(win.location.pathname, win.location.hash));
            await phase(st, 0, (import.meta.env?.DEV && win.__jl?.hold) || HOLD); // say where this is (development: window.__jl.hold keeps the cover up to look at it)
            await phase(st, -1, OUT + GROW);          // drain
          }
        }
        destination = doc.activeElement !== node ? doc.activeElement : destination;
        clear();
        if (doc.activeElement === node && destination?.isConnected) destination.focus({preventScroll: true});
      }
    } finally { running = false; clear(); }
  };
  return {run, dispose() { alive = false; pending = null; generation++; clear(); node.removeEventListener('wheel', block); node.removeEventListener('touchmove', block); doc.removeEventListener('pointerdown', pressed, true); }};
}
