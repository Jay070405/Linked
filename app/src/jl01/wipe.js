// The machine's own transition: its screen dots spill over the whole page, the page changes underneath, the dots drain away.
// Used whenever the world itself changes (a different cartridge, a case opening or closing, a jump from the menu).
// With a label, the covered page says where you are going before it lets you see it.
export function createWipe(canvas) {
  const g = canvas.getContext('2d');
  let raf = 0;
  const IN = 420, GROW = 240, OUT = 420;
  return function wipe({x = innerWidth / 2, y = innerHeight / 2, color = '#0A0B0D', ink = '#F2F2EF', label = '', sub = '', mid, done}) {
    cancelAnimationFrame(raf);
    const dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight, hold = label ? 430 : 110;
    canvas.width = W * dpr; canvas.height = H * dpr;
    const cell = Math.max(20, Math.round(Math.min(W, H) / 24)), cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
    const far = Math.hypot(Math.max(x, W - x), Math.max(y, H - y)) || 1, t0 = performance.now(), full = IN + GROW, turn = full + hold, big = Math.min(W * .17, H * .26, 230);
    let fired = false;
    const frame = now => {
      const t = now - t0, out = t >= turn;
      if (out && !fired) { fired = true; mid && mid(); }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H); g.fillStyle = color;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const cx = c * cell + cell / 2, cy = r * cell + cell / 2, d = Math.hypot(cx - x, cy - y) / far;
        const k = out ? 1 - (t - turn - d * OUT) / GROW : (t - d * IN) / GROW;
        if (k <= 0) continue;
        if (k >= 1) g.fillRect(cx - cell / 2 - .5, cy - cell / 2 - .5, cell + 1, cell + 1);
        else { g.beginPath(); g.arc(cx, cy, k * cell * .74, 0, 6.2832); g.fill(); }
      }
      if (label) { const a = Math.min(1, (t - full + 150) / 150, (turn + 110 - t) / 110);
        if (a > 0) { g.globalAlpha = a; g.fillStyle = ink; g.textAlign = 'center'; g.textBaseline = 'middle';
          g.font = `900 ${big}px "JL Dot",ui-monospace,monospace`; g.fillText(label, W / 2, H / 2 - big * .08);
          if (sub) { g.font = `700 ${Math.max(13, big * .1)}px "Songti SC","JL Song",serif`; try { g.letterSpacing = '.5em'; } catch { /* older canvas */ } g.fillText(sub, W / 2 + big * .025, H / 2 + big * .58); try { g.letterSpacing = '0px'; } catch { /* older canvas */ } }
          g.globalAlpha = 1; } }
      if (t < turn + OUT + GROW) raf = requestAnimationFrame(frame);
      else { g.clearRect(0, 0, W, H); done && done(); }
    };
    raf = requestAnimationFrame(frame);
  };
}
