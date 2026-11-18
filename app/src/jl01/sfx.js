// The device's sounds, synthesised so nothing has to download. The audio context starts on the first key or click.
let ctx, master, muted = false;

const ac = () => {
  if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); master = ctx.createGain(); master.gain.value = .5; master.connect(ctx.destination); }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
};
const noise = (dur, freq, q, vol, when = 0) => {
  const c = ac(), n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const s = c.createBufferSource(); s.buffer = b;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain(); g.gain.value = vol;
  s.connect(f).connect(g).connect(master); s.start(c.currentTime + when);
};
const tone = (f0, f1, dur, vol, type = 'sine', when = 0) => {
  const c = ac(), o = c.createOscillator(), g = c.createGain(), t = c.currentTime + when;
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g).connect(master); o.start(t); o.stop(t + dur + .02);
};
const play = fn => () => { if (muted) return; try { fn(); } catch { /* no audio device */ } };

export const sfx = {
  click: play(() => { noise(.035, 3200, 1.2, .5); tone(180, 90, .05, .35); }),
  tick: play(() => noise(.012, 5200, 2, .28)),
  hover: play(() => tone(880, 880, .03, .05, 'triangle')),
  boot: play(() => { tone(523, 523, .12, .14, 'square'); tone(784, 784, .14, .14, 'square', .11); tone(1047, 1047, .3, .12, 'square', .23); }),
  thunk: play(() => { noise(.09, 700, .8, .8); tone(120, 55, .16, .6); }),
  step: play(() => { noise(.02, 4200, 1.6, .3); tone(660, 660, .05, .07, 'square'); }),
  clear: play(() => { [523, 659, 784, 1047].forEach((f, i) => tone(f, f, .16, .13, 'square', i * .09)); }),
  print: play(() => { noise(.03, 2600, 3, .2); noise(.02, 5200, 2, .12, .035); }),
  wipe: play(() => { noise(.55, 1100, .6, .3); tone(240, 90, .5, .1); }),
  chirp: play(() => { tone(1500, 2300, .07, .12, 'square'); tone(1900, 2600, .07, .1, 'square', .08); }),
  setMuted(v) { muted = v; },
};
