// Every texture is drawn in code: no image downloads. Each rack front is drawn twice from the same slot list,
// once as real hardware and once as a line drawing, so the front turns from drawing into hardware with the rest.
import * as THREE from 'three';
import {bakeNormal} from './gpu';
// the pulled tray's front layout, so the rack's trays are drawn as the same tray
import {FRONT as BEZEL} from './closeup';
import {STACK, NET_STACK, U1, RACK_BASE, BOUNDS, ROOMS, HOT_AISLES, RACKS, ROW_X0, ROW_X1} from './plan';

const canvas = (w, h) => {const c = document.createElement('canvas'); c.width = w; c.height = h; return c;};
const tex = (c, {repeat = null, srgb = true} = {}) => {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat);}
  return t;
};
// a small deterministic random, so every load draws the same textures
const rng = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

// the front panel covers the rack's opening: 0.56 m wide, from RACK_BASE to RACK_BASE + 48U
export const FRONT = {w: 0.56, h: STACK.length * U1, y: RACK_BASE};
export function rackFronts() {return {gpu: drawFront(STACK), net: drawFront(NET_STACK)};}
function drawFront(stack) {
  const W = 256, H = Math.round(W * FRONT.h / FRONT.w), u = H / stack.length;
  // drawn at twice the size for close-ups, in the same 256-wide layout
  const real = canvas(W * 2, H * 2), ink = canvas(W * 2, H * 2), a = real.getContext('2d'), b = ink.getContext('2d');
  a.scale(2, 2); b.scale(2, 2);
  a.fillStyle = '#121316'; a.fillRect(0, 0, W, H);
  b.fillStyle = '#fff'; b.fillRect(0, 0, W, H); b.strokeStyle = '#000'; b.fillStyle = '#000'; b.lineWidth = 1.4;
  const rnd = rng(7);
  // a compute or switch tray's front as the pulled tray has it (closeup.js FRONT, detail.js front()), at true size
  // in the panel: 438 mm wide, 41.45 mm tall from the bottom of its U, so a 3 mm seam shows between trays; the rack's
  // rails, with their square holes, either side
  const tray = (y, h, kind) => {
    const k = W / FRONT.w / 1000, kv = h / (U1 * 1000), X = mm => W / 2 + mm * k, Y = mm => y + h - (20.725 + mm) * kv;
    const box = (x0, y0, x1, y1, col) => {a.fillStyle = col; a.fillRect(X(x0), Y(y1), (x1 - x0) * k, (y1 - y0) * kv);};
    const dot = (x, yy, r, col) => {a.fillStyle = col; a.beginPath(); a.ellipse(X(x), Y(yy), r * k, r * kv, 0, 0, Math.PI * 2); a.fill();};
    const line = (x0, y0, x1, y1) => {b.beginPath(); b.moveTo(X(x0), Y(y0)); b.lineTo(X(x1), Y(y1)); b.stroke();};
    const frame = (x0, y0, x1, y1) => b.strokeRect(X(x0), Y(y1), (x1 - x0) * k, (y1 - y0) * kv);
    // the seam and the rails
    a.fillStyle = '#050506'; a.fillRect(0, y, W, h);
    for (const s of [-1, 1]) {
      box(s < 0 ? -280 : 221, -22.2, s < 0 ? -221 : 280, 23.7, '#18191c');
      for (const hy of [-14.4, 1.5, 17.4]) box(s * 229 - 1.7, hy - 1.7, s * 229 + 1.7, hy + 1.7, '#060607');
    }
    // the bezel: powder-coated, a light catch along its top edge and a darker one along its bottom
    const tone = 0.97 + rnd() * 0.06, c = v => `rgb(${Math.round(38 * v * tone)},${Math.round(40 * v * tone)},${Math.round(44 * v * tone)})`;
    box(-219, -20.725, 219, 20.725, c(1));
    box(-219, 20.1, 219, 20.725, c(1.45)); box(-219, -20.725, 219, -20.2, c(0.6));
    for (const s of [-1, 1]) {
      box(s < 0 ? -219 : 202.6, -20.725, s < 0 ? -202.6 : 219, 20.725, c(1.12));
      box(s * 202.6 - 0.35, -20.725, s * 202.6 + 0.35, 20.725, '#121315');
      for (const sy of [-14, 14]) dot(s * 213.5, sy, 1.5, '#8f9399');
    }
    frame(-219, -20.725, 219, 20.725); line(-202.6, -20.725, -202.6, 20.725); line(202.6, -20.725, 202.6, 20.725);
    if (kind === 'compute') {
      // drive bays: four sleds with their latches, labels and LED windows, and four blanks
      box(-184.2, -19, -67.8, 19, '#08090a');
      BEZEL.sleds.forEach((sx, i) => {
        box(sx - 6.5, -18, sx + 6.5, 18, i < 4 ? '#2e3034' : '#2a2c30');
        if (i < 4) {
          box(sx - 4.75, 12.1, sx + 4.75, 15.5, '#55585e'); box(sx - 4.5, -1, sx + 4.5, 4.6, '#bdbab1'); box(sx - 1.2, 6.5, sx + 1.2, 7.8, '#0d1a12');
          for (let gy = -4; gy > -16; gy -= 2.6) box(sx - 4.9, gy - 0.5, sx + 4.9, gy, '#1b1c1f');
        } else for (let q = 0; q < 6; q++) box(sx - 4, -9.5 + q * 3.6, sx + 4, -8.4 + q * 3.6, '#0b0b0c');
        frame(sx - 6.5, -18, sx + 6.5, 18);
      });
      frame(-184.2, -19, -67.8, 19);
    }
    // the honeycomb vent (one field on a compute tray, two on a switch tray)
    const vents = kind === 'compute' ? [BEZEL.vent] : [[-190, -112], [-104, -26]];
    for (const [v0, v1] of vents) {
      for (let row = 0, vy = -16.5; vy <= 16.6; row++, vy += 3.03) for (let vx = v0 + 1.8 + (row % 2) * 1.75; vx <= v1 - 1.6; vx += 3.5) dot(vx, vy, 1.3, '#070708');
      frame(v0, -17.5, v1, 17.5);
      for (let vx = v0 + 8; vx < v1 - 4; vx += 16) line(vx, -16, vx + 6, 16);
    }
    // management: the stacked network and USB jack, the power and ID buttons, the status LED
    const j = BEZEL.jack;
    box(j.x - j.w / 2, j.y - j.h / 2, j.x + j.w / 2, j.y + j.h / 2, '#9da2a8');
    box(j.x - 5.8, j.y - 10, j.x + 5.8, j.y - 0.8, '#0a0a0b'); box(j.x - 6.2, j.y + 4.2, j.x + 6.2, j.y + 9, '#0a0a0b'); box(j.x - 5.1, j.y + 5.8, j.x + 5.1, j.y + 7.4, '#2e5fb6');
    frame(j.x - j.w / 2, j.y - j.h / 2, j.x + j.w / 2, j.y + j.h / 2);
    for (const [bt, col] of [[BEZEL.power, '#2b2d31'], [BEZEL.id, '#34466e']]) {dot(bt.x, bt.y, 4.2, '#4a4d53'); dot(bt.x, bt.y, 3.3, col); b.beginPath(); b.ellipse(X(bt.x), Y(bt.y), 3.3 * k, 3.3 * kv, 0, 0, Math.PI * 2); b.stroke();}
    box(34.6, 13.4, 36.8, 14.6, '#0d1a12');
    // network ports with their modules plugged in (finned bodies, the fibre receptacle, the pull tab's end), and the
    // DPU's two empty cages; a switch tray has two ports and no DPU
    const ports = kind === 'compute' ? BEZEL.osfp : BEZEL.osfp.slice(1, 3);
    for (const px of ports) {
      box(px - 12, -7.25, px + 12, 7.25, '#0a0a0b');
      box(px - 11.3, -6.5, px + 11.3, 3.9, '#8e949b'); box(px - 11.3, 3.9, px + 11.3, 6.3, '#3a3d42');
      for (let f = -4; f <= 4; f++) box(px + f * 2.4 - 0.3, 3.9, px + f * 2.4 + 0.3, 6.3, '#a9aeb4');
      box(px - 5, -3.1, px + 5, 0.5, '#0c0c0d'); box(px - 4.5, -6.6, px + 4.5, -5.2, '#7d8a96');
      box(px - 9.6, 10.2, px - 7.4, 11.4, '#0d1a12');
      frame(px - 12, -7.25, px + 12, 7.25);
    }
    if (kind === 'compute') for (const qx of BEZEL.qsfp) {box(qx - 9.8, -5.2, qx + 9.8, 5.2, '#0a0a0b'); box(qx - 8.6, -4.2, qx + 8.6, -3.6, '#3c3f45'); frame(qx - 9.8, -5.2, qx + 9.8, 5.2);}
    // the locate light's bezel, the panel screws
    dot(BEZEL.locate.x, BEZEL.locate.y, 3.4, '#4a4d53'); dot(BEZEL.locate.x, BEZEL.locate.y, 2.8, '#0b0c0d');
    for (const sy of [-16.8, 16.8]) for (const sx of [-196, -64, 46, 150]) dot(sx, sy, 1.1, '#9a9ea4');
    // pull handles in brushed aluminium, catching the light down one side
    for (const hx of BEZEL.handles) {
      box(hx - 4.5, -15, hx + 4.5, 15, '#aeb3b9'); box(hx - 2.6, -14, hx - 0.8, 14, '#d3d7dc'); box(hx + 2.8, -14.6, hx + 4.5, 14.6, '#7f848b');
      frame(hx - 4.5, -15, hx + 4.5, 15);
    }
  };
  stack.forEach((kind, i) => {
    const y = H - (i + 1) * u, h = u;
    if (kind === 'cable') {a.fillStyle = '#17181b'; a.fillRect(2, y + 0.5, W - 4, h - 1); a.fillStyle = '#0d0e10'; for (let x = 20; x < W - 20; x += 12) a.fillRect(x, y + 1.5, 7, h - 3); return;}
    if (kind === 'compute' || kind === 'switch') {b.lineWidth = 0.6; tray(y, h, kind); b.lineWidth = 1.4; return;}
    b.strokeRect(3, y + 1, W - 6, h - 2);
    if (kind === 'power') {
      a.fillStyle = '#26282c'; a.fillRect(2, y + 0.5, W - 4, h - 1);
      for (let k = 0; k < 6; k++) {
        const x = 8 + k * (W - 16) / 6;
        a.fillStyle = '#17181b'; a.fillRect(x + 2, y + 2, (W - 16) / 6 - 5, h - 4);
        a.fillStyle = '#41454c'; for (let r = 0; r < 3; r++) a.fillRect(x + 4, y + 3 + r * (h - 6) / 3, (W - 16) / 6 - 9, 1);
        b.strokeRect(x + 2, y + 2.5, (W - 16) / 6 - 5, h - 5);
      }
    } else if (kind === 'patch') {
      // a patch panel with fibre jumpers plugged in, yellow and aqua
      a.fillStyle = '#25272c'; a.fillRect(2, y + 0.5, W - 4, h - 1);
      let run = 0, tone = '#7d7660';
      for (let x = 14; x < W - 14; x += 5) {
        a.fillStyle = '#0b0c0e'; a.fillRect(x, y + 2, 3.4, h - 4);
        if (run <= 0) {run = 2 + Math.floor(rnd() * 9); tone = rnd() > 0.35 ? (rnd() > 0.5 ? '#7d7660' : '#566b6d') : '';}
        run--;
        if (tone && rnd() > 0.15) {a.fillStyle = tone; a.fillRect(x + 0.6, y + 2.5, 2.2, h - 5);}
      }
      b.strokeRect(12, y + 2.5, W - 24, h - 5);
    } else {
      // a switch: two rows of ports
      a.fillStyle = '#202227'; a.fillRect(2, y + 0.5, W - 4, h - 1);
      for (let x = 24; x < W - 24; x += 6.5) for (let r = 0; r < 2; r++) {a.fillStyle = '#0a0b0c'; a.fillRect(x, y + 1.8 + r * (h - 3) / 2, 5, (h - 3) / 2 - 0.8);}
      b.strokeRect(22, y + 2.5, W - 44, h - 5);
    }
  });
  return {real: tex(real), ink: tex(ink, {srgb: false}), normal: normalFrom(real, 3)};
}

// the status lights of one rack, in panel coordinates (x across −0.5…0.5, y in metres from the floor). Kinds:
// 0 steady green once on (power shelves), 1 blinks green while it boots then steady (tray power), 2 amber while the
// link comes up then green (NVLink), 4 green with traffic (network ports)
export function rackLights(gpu) {
  const out = [];
  (gpu ? STACK : NET_STACK).forEach((kind, i) => {
    const y = RACK_BASE + (i + 0.5) * U1;
    // compute and switch trays: the status LED beside the buttons, and the link LED over a network port, where the
    // tray's front has them (drawFront; mm across the tray / FRONT.w, height from the bottom of the U)
    const at = (mmX, mmY) => ({x: mmX / 1000 / FRONT.w, y: RACK_BASE + i * U1 + (20.725 + mmY) / 1000});
    if (kind === 'compute') {out.push({...at(35.7, 14), kind: 1}); out.push({...at(BEZEL.osfp[0] - 8.5, 10.8), kind: 2});}
    if (kind === 'switch') {out.push({...at(35.7, 14), kind: 1}); for (const px of BEZEL.osfp.slice(1, 3)) out.push({...at(px - 8.5, 10.8), kind: 2});}
    if (kind === 'power') for (let k = 0; k < 6; k++) out.push({x: -0.45 + k * (1 - 16 / 256) / 6, y, kind: 0});
    if (kind === 'mgmt' || kind === 'netsw') for (let k = 0; k < 10; k++) out.push({x: -0.38 + k * 0.08, y: y + U1 * 0.28, kind: 4});
  });
  return out;
}

// sealed concrete for the slab, mottled, with saw-cut joints every 6 m (the texture covers 6 m)
export function concrete() {
  const N = 512, c = canvas(N, N), a = c.getContext('2d'), rnd = rng(19);
  a.fillStyle = '#b9b8b3'; a.fillRect(0, 0, N, N);
  for (let i = 0; i < 2600; i++) {
    const r = 6 + rnd() * 40, x = rnd() * N, y = rnd() * N, v = rnd();
    a.fillStyle = v > 0.5 ? `rgba(255,255,255,${0.025 * rnd()})` : `rgba(60,58,54,${0.03 * rnd()})`;
    a.beginPath(); a.arc(x, y, r, 0, Math.PI * 2); a.fill();
  }
  for (let i = 0; i < 9000; i++) {a.fillStyle = `rgba(40,40,40,${0.12 * rnd()})`; a.fillRect(rnd() * N, rnd() * N, 1, 1);}
  a.fillStyle = 'rgba(70,68,64,.55)'; a.fillRect(0, 0, N, 1.5); a.fillRect(0, 0, 1.5, N);
  return tex(c, {repeat: [1, 1]});
}

// a soft round glow for the status lights (`core`: a brighter, wider centre, for the locate light)
export function glow(core = false) {
  const N = 64, c = canvas(N, N), a = c.getContext('2d');
  const g = a.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
  if (core) {g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,.9)'); g.addColorStop(0.55, 'rgba(255,255,255,.3)'); g.addColorStop(1, 'rgba(255,255,255,0)');}
  else {g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');}
  a.fillStyle = g; a.fillRect(0, 0, N, N);
  return tex(c, {srgb: false});
}

// a contact shadow under each standing piece, so the plaster model sits on the slab
export function contact() {
  const N = 64, c = canvas(N, N), a = c.getContext('2d');
  const g = a.createRadialGradient(N / 2, N / 2, N * 0.18, N / 2, N / 2, N / 2);
  g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  a.fillStyle = g; a.fillRect(0, 0, N, N);
  return tex(c, {srgb: false});
}

// the tray's close-up surfaces: a circuit board, the honeycomb front bezel, and the top of a die
export function pcb() {
  const W = 512, H = 1024, c = canvas(W, H), a = c.getContext('2d'), rnd = rng(31);
  a.fillStyle = '#123022'; a.fillRect(0, 0, W, H);
  // buses: bundles of parallel traces that run straight and turn at 45°, like routed memory and power lanes
  a.strokeStyle = '#1f5238'; a.lineWidth = 1.3; a.lineCap = 'round';
  for (let b = 0; b < 26; b++) {
    const n = 4 + Math.floor(rnd() * 7), x0 = rnd() * W, y0 = rnd() * H, len1 = 40 + rnd() * 180, len2 = 30 + rnd() * 160, dir = rnd() > 0.5 ? 1 : -1, vertical = rnd() > 0.5;
    for (let k = 0; k < n; k++) {
      const o = k * 4; a.beginPath();
      if (vertical) {a.moveTo(x0 + o, y0); a.lineTo(x0 + o, y0 + len1); a.lineTo(x0 + o + dir * 24, y0 + len1 + 24); a.lineTo(x0 + o + dir * 24, y0 + len1 + 24 + len2);}
      else {a.moveTo(x0, y0 + o); a.lineTo(x0 + len1, y0 + o); a.lineTo(x0 + len1 + 24, y0 + o + dir * 24); a.lineTo(x0 + len1 + 24 + len2, y0 + o + dir * 24);}
      a.stroke();
    }
  }
  // via fields and component pads, then the silkscreen outlines
  a.fillStyle = '#c9a75a';
  for (let f = 0; f < 18; f++) {const x = rnd() * W, y = rnd() * H; for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) a.fillRect(x + i * 6, y + j * 6, 2, 2);}
  a.strokeStyle = 'rgba(236,240,234,.5)'; a.lineWidth = 1.1;
  for (let i = 0; i < 34; i++) a.strokeRect(rnd() * W, rnd() * H, 10 + rnd() * 36, 6 + rnd() * 18);
  return tex(c);
}
export function bezel() {
  // the tray's front, left to right: a handle, eight drive bays, a honeycomb grille, the management ports, four
  // network ports with their cables plugged in, two DPU ports, a handle
  const W = 1024, H = 96, c = canvas(W, H), a = c.getContext('2d');
  a.fillStyle = '#2a2c31'; a.fillRect(0, 0, W, H);
  a.fillStyle = '#9ca0a8'; a.fillRect(10, 12, 40, H - 24); a.fillRect(W - 50, 12, 40, H - 24);
  for (let k = 0; k < 8; k++) {const x = 66 + k * 30; a.fillStyle = '#16171a'; a.fillRect(x, 10, 24, H - 20); a.fillStyle = '#3d4047'; a.fillRect(x + 3, 14, 18, 8); a.fillStyle = '#5a7ccc'; a.fillRect(x + 9, H - 20, 6, 4);}
  a.fillStyle = '#0b0c0e';
  for (let x = 320; x < 600; x += 14) for (let r = 0; r < 6; r++) {a.beginPath(); a.arc(x + (r % 2) * 7, 13 + r * 14, 5, 0, Math.PI * 2); a.fill();}
  a.fillStyle = '#121315'; a.fillRect(616, 30, 26, 22); a.fillRect(648, 30, 26, 22); a.fillStyle = '#7d8189'; a.fillRect(682, 34, 18, 12);
  for (let k = 0; k < 4; k++) {const x = 716 + k * 52; a.fillStyle = '#0a0a0b'; a.fillRect(x, 18, 44, H - 36); a.fillStyle = '#202227'; a.fillRect(x + 4, 22, 36, H - 44); a.fillStyle = '#2f6a73'; a.fillRect(x + 14, H - 16, 16, 10);}
  for (let k = 0; k < 2; k++) {a.fillStyle = '#0a0a0b'; a.fillRect(930 + k * 22, 26, 16, 30);}
  return tex(c);
}
// one die from above, laid out like the hall (the die's schematic shares the hall's plan): compute blocks where the
// racks are, cache where the hot aisles are, the memory interface where the north gallery is, so the real die
// already reads like its drawing
export function dieTop() {
  const W = 512, H = 640, c = canvas(W, H), a = c.getContext('2d'), rnd = rng(43);
  const X = x => (x - BOUNDS.x0) / (BOUNDS.x1 - BOUNDS.x0) * W, Y = z => (z - BOUNDS.z0) / (BOUNDS.z1 - BOUNDS.z0) * H;
  a.fillStyle = '#232936'; a.fillRect(0, 0, W, H);
  a.fillStyle = '#353043'; a.fillRect(X(BOUNDS.x0 + 0.6), Y(BOUNDS.z0 + 0.8), X(BOUNDS.x1 - 0.6) - X(BOUNDS.x0 + 0.6), Y(ROOMS.hall.z0 - 0.8) - Y(BOUNDS.z0 + 0.8));
  HOT_AISLES.forEach(h => {a.fillStyle = '#3a3346'; a.fillRect(X(ROW_X0), Y(h.z0), X(ROW_X1) - X(ROW_X0), Y(h.z1) - Y(h.z0));});
  RACKS.forEach(r => {
    const v = 46 + rnd() * 16;
    a.fillStyle = `rgb(${v - 6},${v},${v + 24})`; a.fillRect(X(r.x - 0.26), Y(r.z - 0.54), X(r.x + 0.26) - X(r.x - 0.26), Y(r.z + 0.54) - Y(r.z - 0.54));
    a.fillStyle = 'rgba(160,190,255,.1)'; a.fillRect(X(r.x - 0.26), Y(r.z - 0.54), X(r.x + 0.26) - X(r.x - 0.26), 2);
  });
  a.fillStyle = '#4a5160'; a.fillRect(X(BOUNDS.x0 + 0.25), Y(-9.5), X(BOUNDS.x0 + 1.15) - X(BOUNDS.x0 + 0.25), Y(9.5) - Y(-9.5)); a.fillRect(X(BOUNDS.x1 - 1.15), Y(-9.5), X(BOUNDS.x1 - 0.25) - X(BOUNDS.x1 - 1.15), Y(9.5) - Y(-9.5));
  return tex(c);
}

// a fan wall's face, drawn at the proportions of the side that faces the hall (5.8 × 3.6 m): six fans across,
// four high, behind a grille
export function fanFace() {
  const W = 464, H = 288, c = canvas(W, H), a = c.getContext('2d');
  const done = () => ({map: tex(c, {repeat: [1, 1]}), normal: normalFrom(c, 4)});
  a.fillStyle = '#c9cdd2'; a.fillRect(0, 0, W, H);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) {
    const x = 39 + k * 77, y = 36 + r * 72;
    a.fillStyle = '#9da2a9'; a.fillRect(x - 33, y - 33, 66, 66);
    a.fillStyle = '#3a3d42'; a.beginPath(); a.arc(x, y, 30, 0, Math.PI * 2); a.fill();
    a.fillStyle = '#56595f'; a.beginPath(); a.arc(x, y, 10, 0, Math.PI * 2); a.fill();
  }
  a.strokeStyle = 'rgba(200,204,210,.5)'; a.lineWidth = 1;
  for (let x = 4; x < W; x += 6) {a.beginPath(); a.moveTo(x, 0); a.lineTo(x, H); a.stroke();}
  return done();
}

// a normal map from a picture: brighter reads as higher (handles and frames stand proud, holes and ports sink)
const normalFrom = (src, strength = 2) => bakeNormal(src, strength, {luminance: true});
