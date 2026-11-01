// The close-up hardware's surfaces and shapes, all drawn in code. Every non-metal part of the compute tray (boards,
// package substrates, chip tops, the front panel, labels, plastics) samples one texture atlas, and the bare sheet metal
// one tiling satin-steel finish, so the whole tray draws in a few calls. Each board's parts are listed once and both its
// texture (pads, silkscreen, routing) and its 3D parts are made from that list: every printed outline has a part in it.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {bakeNormal} from './gpu';
import {BOUNDS, ROOMS, HOT_AISLES, COLD_AISLES, RACKS, ROW_X0, ROW_X1, CDUS} from './plan';

const canvas = (w, h) => {const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c;};
const rng = seed => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
const grey = v => {const g = Math.round(Math.min(1, Math.max(0, v)) * 255); return `rgb(${g},${g},${g})`;};
const tex = (c, srgb = true) => {const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;};
// phones get the atlas at half size
let SMALL = typeof window !== 'undefined' && window.innerWidth <= 900;
// and so do modest GPUs on any screen (call before the tray is built: the atlas and the steel are made once and kept)
export function useSmallAtlas(v) {SMALL = SMALL || !!v;}

// The build's pace: long loops `await pace()` often, and it gives the page its turn (`step`, scene.js's, which also
// stops a cancelled build) only once `budget` ms of work have gone by since the last turn, so no piece of the build
// holds the main thread for long, however slow the machine, and a check that isn't due costs next to nothing
// (`pace.now()` takes the turn at once: before a single piece of work that can't be split, such as an upload)
export function pacer(step = async () => {}, budget = 6) {
  let t = performance.now();
  const turn = async () => {await step(); t = performance.now();};
  const pace = async () => {if (performance.now() - t >= budget) await turn();};
  pace.now = turn;
  return pace;
}
const idle = async () => {};
idle.now = idle;


// ---------------------------------------------------------------------------------------------------------------
// The atlas: regions in pixels of a 2048² design size (UVs are fractions, so the half-size atlas uses the same ones)
export const A0 = 2048;
export const R = {
  board: [0, 0, 1024, 1894],          // one superchip board, 200 × 370 mm
  subG: [1032, 0, 800, 800],          // GPU package substrate, 76 mm square
  hbm: [1840, 0, 112, 120],           // HBM stack top
  cover: [1840, 128, 200, 224],       // cold plate cover, 50 × 56 mm
  subC: [1032, 808, 416, 416],        // CPU package substrate, 52 mm square
  ic: [1456, 808, 128, 128],          // a chip's top
  lp: [1592, 808, 120, 140],          // LPDDR5X package top
  poscap: [1720, 808, 146, 86],       // polymer capacitor top, 7.3 × 4.3 mm
  choke: [1720, 902, 90, 90],         // power inductor top
  label: [1456, 960, 240, 160],       // the lid's service label, 60 × 40 mm
  sled: [1872, 808, 52, 144],         // an E1.S sled's face, 13 × 36 mm
  brick: [1720, 1000, 174, 108],      // DC-DC module top, 58 × 36 mm
  pdb: [1032, 1232, 1016, 148],       // power distribution board, 410 × 58 mm
  nic: [1032, 1388, 132, 364],        // network card, 50 × 140 mm
  dpu: [1172, 1388, 132, 364],        // DPU card, 50 × 140 mm
  mgmt: [1312, 1388, 232, 256],       // management board, 104 × 116 mm
  m2: [1872, 1388, 56, 204],          // M.2 boot drive, 22 × 80 mm
  bezel: [0, 1900, 1534, 146],        // the front panel, 438 × 41.45 mm
  mould: [1840, 360, 208, 232],       // the GPU package's mould top, round its dies and stacks, 53 × 59 mm
};
// solid patches: white (tinted by vertex colour) in three finishes, metals, the board edge, the LEDs
const PATCHES = {
  matte: {c: '#ffffff', r: 0.82}, satin: {c: '#ffffff', r: 0.5}, gloss: {c: '#ffffff', r: 0.2},
  metal: {c: '#ffffff', r: 0.27, m: 1}, polish: {c: '#ffffff', r: 0.13, m: 1}, rough: {c: '#ffffff', r: 0.55, m: 1},
  edge: {c: '#9c9566', r: 0.72}, mold: {c: '#121214', r: 0.3}, rubber: {c: '#ffffff', r: 0.93}, plain: {c: '#ffffff', r: 0.66},
  ledG: {c: '#d8ffe4', r: 0.25, e: '#38ff74'}, ledA: {c: '#ffe8bf', r: 0.25, e: '#ffa424'}, ledB: {c: '#d6e4ff', r: 0.25, e: '#4c7dff'},
};
const PATCH_KEYS = Object.keys(PATCHES);
// 32 px patches 48 px apart, the lights on a row of their own, so nothing bleeds into its neighbour at low mip levels
const patchXY = i => (i < 10 ? [1564 + (i % 5) * 48, 1600 + Math.floor(i / 5) * 48] : [1564 + (i - 10) * 72, 1740]);
export const patchUV = name => {
  const i = PATCH_KEYS.indexOf(name);
  if (i < 0) throw new Error('no patch ' + name);
  const [x, y] = patchXY(i);
  return [(x + 12) / A0, 1 - (y + 12) / A0];
};

// One pen draws every layer at once: colour, height (for the normal map), roughness/metalness, emission
class Pen {
  constructor(A) {
    this.L = {c: canvas(A, A), h: canvas(A / 2, A / 2), rm: canvas(A / 2, A / 2), e: canvas(A / 2, A / 2)};
    this.f = {c: A / A0, h: A / A0 / 2, rm: A / A0 / 2, e: A / A0 / 2};
    this.x = {};
    for (const k in this.L) this.x[k] = this.L[k].getContext('2d', {willReadFrequently: k === 'h'});
    const fill = (a, v) => {a.fillStyle = v; a.fillRect(0, 0, a.canvas.width, a.canvas.height);};
    fill(this.x.c, '#808080'); fill(this.x.h, grey(0.5)); fill(this.x.rm, 'rgb(255,128,0)'); fill(this.x.e, '#000');
  }
  // draw inside a region in millimetres: (ox, oy) is where the mm origin sits, from the region's top-left corner
  begin([rx, ry, rw, rh], mmW, mmH, ox = 0, oy = 0) {
    for (const k in this.x) {
      const a = this.x[k], f = this.f[k], sx = rw / mmW * f, sy = rh / mmH * f;
      a.save(); a.setTransform(sx, 0, 0, sy, (rx + ox * rw / mmW) * f, (ry + oy * rh / mmH) * f);
      a.beginPath(); a.rect(-ox, -oy, mmW, mmH); a.clip();
    }
    // the colour layer's pixels per mm, for blurs (which are in pixels)
    this.kx = rw / mmW * this.f.c; this.ky = rh / mmH * this.f.c;
  }
  // a soft shadow: a rectangle (or a disc, w across) at (x, z) grown by `grow`, blurred by sigma mm and moved by
  // (dx, dz) mm, darkening the colour layer by `alpha`, and by `ao` the occlusion in the roughness layer's spare red
  // channel (the layer is an occlusion-roughness-metalness map: the material reads its red as its aoMap, which dims
  // what a surface reflects there as well as its light; a dark colour alone barely shows on a glossy board)
  shade(x, z, w, d, {sigma, alpha = 0, ao = 0, dx = 0, dz = 0, grow = 0, round = false}) {
    const draw = a => {
      a.beginPath();
      if (round) a.arc(x, z, w / 2 + grow, 0, Math.PI * 2); else a.rect(x - w / 2 - grow, z - d / 2 - grow, w + 2 * grow, d + 2 * grow);
      a.fill();
    };
    if (alpha > 0) softShadow(this.x.c, this.kx, this.ky, draw, sigma, `rgba(0,0,0,${alpha})`, dx, dz);
    if (ao > 0) {
      const r = this.x.rm, k = this.f.rm / this.f.c;
      r.save(); r.globalCompositeOperation = 'multiply';
      softShadow(r, this.kx * k, this.ky * k, draw, sigma, `rgba(0,255,255,${ao})`, dx, dz);
      r.restore();
    }
  }
  end() {for (const k in this.x) this.x[k].restore();}
  each(st, fn) {
    for (const k in this.x) {
      let v;
      if (k === 'c') v = st.c;
      else if (k === 'h') v = st.h === undefined ? undefined : grey(st.h);
      else if (k === 'rm') v = st.r === undefined ? undefined : `rgb(255,${Math.round(st.r * 255)},${Math.round((st.m || 0) * 255)})`;
      else v = st.e;
      if (v !== undefined) fn(this.x[k], v);
    }
  }
  rect(x, y, w, h, st) {this.each(st, (a, v) => {a.fillStyle = v; a.fillRect(x, y, w, h);});}
  frame(x, y, w, h, lw, st) {this.each(st, (a, v) => {a.strokeStyle = v; a.lineWidth = lw; a.strokeRect(x, y, w, h);});}
  circle(x, y, r, st) {this.each(st, (a, v) => {a.fillStyle = v; a.beginPath(); a.arc(x, y, r, 0, Math.PI * 2); a.fill();});}
  ring(x, y, r, lw, st) {this.each(st, (a, v) => {a.strokeStyle = v; a.lineWidth = lw; a.beginPath(); a.arc(x, y, r, 0, Math.PI * 2); a.stroke();});}
  line(pts, lw, st, cap = 'round') {
    this.each(st, (a, v) => {a.strokeStyle = v; a.lineWidth = lw; a.lineCap = cap; a.lineJoin = 'round'; a.beginPath(); pts.forEach(([x, y], i) => (i ? a.lineTo(x, y) : a.moveTo(x, y))); a.stroke();});
  }
  poly(pts, st) {this.each(st, (a, v) => {a.fillStyle = v; a.beginPath(); pts.forEach(([x, y], i) => (i ? a.lineTo(x, y) : a.moveTo(x, y))); a.closePath(); a.fill();});}
  rrect(x, y, w, h, r, lw, st) {
    this.each(st, (a, v) => {
      a.beginPath(); a.moveTo(x + r, y); a.arcTo(x + w, y, x + w, y + h, r); a.arcTo(x + w, y + h, x, y + h, r); a.arcTo(x, y + h, x, y, r); a.arcTo(x, y, x + w, y, r); a.closePath();
      if (lw) {a.strokeStyle = v; a.lineWidth = lw; a.stroke();} else {a.fillStyle = v; a.fill();}
    });
  }
  text(s, x, y, size, st, {align = 'center', rot = 0, weight = 600, font = 'Arial, Helvetica, sans-serif'} = {}) {
    this.each(st, (a, v) => {
      a.save(); a.translate(x, y); if (rot) a.rotate(rot);
      a.fillStyle = v; a.font = `${weight} ${size}px ${font}`; a.textAlign = align; a.textBaseline = 'middle'; a.fillText(s, 0, 0);
      a.restore();
    });
  }
}

// a shadow alone, with no shape: the shape is drawn far off the canvas and its blurred shadow thrown back into place
// (canvas blurs and shadow offsets are in pixels, whatever the transform: kx, ky are the context's pixels per unit)
function softShadow(ctx, kx, ky, draw, sigma, color, dx = 0, dz = 0) {
  const off = ctx.canvas.width * 4 + 4096;
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = Math.max(0.01, 2 * sigma * kx);
  ctx.shadowOffsetX = dx * kx - off; ctx.shadowOffsetY = dz * ky;
  ctx.translate(off / kx, 0);
  ctx.fillStyle = ctx.strokeStyle = '#000';
  draw(ctx);
  ctx.restore();
}

// a polyline moved sideways by d (mitred), for routing bundles of parallel traces
function offsetPath(pts, d) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[Math.min(pts.length - 1, i + 1)];
    const s1 = i > 0 ? [b[0] - a[0], b[1] - a[1]] : [c[0] - b[0], c[1] - b[1]], s2 = i < pts.length - 1 ? [c[0] - b[0], c[1] - b[1]] : s1;
    const l1 = Math.hypot(...s1), l2 = Math.hypot(...s2), n1 = [-s1[1] / l1, s1[0] / l1], n2 = [-s2[1] / l2, s2[0] / l2];
    let nx = n1[0] + n2[0], ny = n1[1] + n2[1]; const l = Math.hypot(nx, ny); nx /= l; ny /= l;
    const k = d / Math.max(0.5, nx * n1[0] + ny * n1[1]);
    out.push([b[0] + nx * k, b[1] + ny * k]);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// One superchip board (research.md §3): two GPU packages and a CPU, the GPUs' power stages in columns either side of
// each package, LPDDR5X round the CPU, NVLink connectors on the rear edge, power and cable connectors on the front.
// Millimetres, board-local: x across, z towards the tray's front, the board's centre at the origin. The same board
// is used twice, side by side.
export const BOARD = {w: 200, d: 370};
export const GPU_LOCAL = [0, -110], CPU_LOCAL = 115;
export function boardParts() {
  const P = [], count = {};
  const ref = k => k + (count[k] = (count[k] || {L: 100, Q: 200, C: 300, U: 10, J: 0, R: 400, Y: 0, D: 0, H: 0, TP: 0}[k]) + 1);
  const add = (k, x, z, w, d, h, o = {}) => {const p = {k, x, z, w, d, h, rot: 0, ...o}; P.push(p); return p;};
  GPU_LOCAL.forEach((gz, gi) => {
    add('pkg', 0, gz, 76, 76, 0, {label: 'GPU' + gi});
    for (const s of [-1, 1]) {
      for (let k = 0; k < 7; k++) {
        const z = gz + (k - 3) * 10.5;
        add('choke', s * 55.5, z, 9, 9, 5.6, {ref: ref('L')});
        add('stage', s * 63.6, z, 5, 6, 0.9, {ref: ref('Q')});
        for (const dz of [-2.4, 2.4]) add('cap', s * 68.8, z + dz, 3.2, 1.6, 1.3);
      }
      for (let k = 0; k < 8; k++) add('poscap', s * 47.6, gz + (k - 3.5) * 8.6, 4.3, 7.3, 1.9, {ref: ref('C'), pol: s});
      for (let k = 0; k < 26; k++) for (const cx of [41, 43.2]) add('cap', s * cx, gz - 33 + k * 2.64, 0.8, 1.6, 0.8);
      // the phase controller beside the power stages, with its decoupling
      add('ic', s * 75.5, gz - 28, 5, 5, 0.85, {ref: ref('U')});
      for (let k = 0; k < 4; k++) add('cap', s * (73.2 + k * 1.5), gz - 24, 0.6, 1.0, 0.5);
      add('ic', s * 75.5, gz + 26, 3, 3, 0.8, {ref: ref('U')});
    }
    // threaded posts for the cold plate, outside the package corners
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add('post', sx * 44, gz + sz * 44, 5.6, 5.6, 6.2);
  });
  // between the GPUs: boot flash, a clock, sensors
  add('soic', -9, -56, 4.9, 3.9, 1.5, {ref: ref('U')});
  add('soic', 9, -56, 4.9, 3.9, 1.5, {ref: ref('U')});
  add('xtal', 0, -63.5, 3.2, 2.5, 0.9, {ref: ref('Y')});
  add('ic', 0, -48, 3, 3, 0.8, {ref: ref('U')});
  for (let k = 0; k < 6; k++) add('cap', -10 + k * 4, -50.5, 1.0, 0.5, 0.5);
  // the CPU, its memory and power
  add('cpu', 0, CPU_LOCAL, 52, 52, 0, {label: 'CPU'});
  for (const s of [-1, 1]) for (const cx of [34.5, 48.5]) for (let j = 0; j < 4; j++) add('lpddr', s * cx, CPU_LOCAL + (j - 1.5) * 15.4, 12, 14, 1.0, {ref: ref('U')});
  for (let k = 0; k < 6; k++) {
    const x = (k - 2.5) * 10.5;
    add('poscap', x, 149, 7.3, 4.3, 1.9, {ref: ref('C'), pol: 0});
    add('choke', x, 157.5, 9, 9, 5.6, {ref: ref('L'), rot: 90});
    add('stage', x, 165.6, 6, 5, 0.9, {ref: ref('Q')});
    for (const dx of [-2.4, 2.4]) add('cap', x + dx, 170.6, 1.6, 3.2, 1.3);
  }
  add('ic', 38, 162, 5, 5, 0.85, {ref: ref('U')});
  // threaded posts for the CPU's cold plate, which also covers the memory
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add('post', sx * 58, CPU_LOCAL + sz * 34, 5.6, 5.6, 6.2);
  // the front edge: power in from the distribution board, and cable connectors for the front cards on both sides
  add('pwr', -40, 178, 30, 10, 9, {ref: ref('J')});
  for (const s of [-1, 1]) for (const x of [64, 75, 86]) add('mcio', s * x, 176, 9, 12, 7, {ref: ref('J')});
  for (const x of [-46, -35]) add('res', x, 168.5, 6.4, 3.2, 0.7, {ref: ref('R')});
  for (const s of [-1, 1]) for (const z of [146, 156]) add('ecap', s * 88, z, 8, 8, 7.5, {ref: ref('C')});
  // the rear edge: two NVLink connectors
  for (const s of [-1, 1]) add('nvl', s * 48, -174, 56, 18, 8.5, {ref: ref('J')});
  // housekeeping: a management controller and its flash, a debug header, status lights, a clock
  add('bga', -82, 90, 11, 11, 1.4, {ref: ref('U')});
  add('soic', -82, 105, 4.9, 3.9, 1.5, {ref: ref('U'), rot: 90});
  add('xtal', -74, 80, 3.2, 2.5, 0.9, {ref: ref('Y')});
  add('header', 82, 88, 12.7, 5.1, 6, {ref: ref('J')});
  for (const z of [131, 134.5, 138]) add('led', -88, z, 1.6, 0.8, 0.6, {ref: ref('D')});
  for (let k = 0; k < 5; k++) add('cap', -88 + (k % 2) * 3, 72 + k * 2.2, 1.0, 0.5, 0.5);
  for (let k = 0; k < 6; k++) add('cap', 76 + (k % 3) * 2.4, 98 + Math.floor(k / 3) * 3, 1.6, 0.8, 0.8);
  // mounting holes, with screws
  for (const [x, z] of [[-95, -180], [95, -180], [-95, 180], [95, 180], [-95, -55], [95, -55], [-95, 60], [95, 60], [0, -156]]) add('hole', x, z, 7, 7, 0, {ref: ref('H')});
  return P;
}

// the decoupling capacitors on a package's substrate, package-local mm: columns along the sides of the interposer and
// rows above and below it
export function packageCaps(gpu = true) {
  const out = [];
  if (gpu) {
    for (const s of [-1, 1]) for (const x of [29.6, 31.8]) for (let k = 0; k < 30; k++) out.push({x: s * x, z: -26.1 + k * 1.8, w: 1.0, d: 0.5});
    for (const s of [-1, 1]) for (const z of [31.4, 33.4]) for (let k = 0; k < 26; k++) out.push({x: -22.5 + k * 1.8, z: s * z, w: 0.5, d: 1.0});
  } else {
    for (const s of [-1, 1]) for (const x of [21.2]) for (let k = 0; k < 18; k++) out.push({x: s * x, z: -15.3 + k * 1.8, w: 1.0, d: 0.5});
    for (const s of [-1, 1]) for (const z of [21.2]) for (let k = 0; k < 18; k++) out.push({x: -15.3 + k * 1.8, z: s * z, w: 0.5, d: 1.0});
  }
  return out;
}

// the smaller boards, the same way: millimetres, centred, z towards the front
export const SMALL_BOARDS = {
  pdb: {w: 410, d: 58, parts: [
    ...[-146, -56, 56, 146].map(x => ({k: 'brick', x, z: -2, w: 58, d: 36, h: 11})),
    ...[-20, 20, -101, 101, -190, 190].flatMap(x => [-12, 10].map(z => ({k: 'ecap', x, z, w: 8, d: 8, h: 10}))),
    ...Array.from({length: 8}, (_, k) => ({k: 'fanhdr', x: (k - 3.5) * 38.5 + 12, z: 24, w: 9.5, d: 5, h: 6})),
    {k: 'conn', x: 0, z: -14, w: 22, d: 12, h: 11},
    ...[-105, 105].map(x => ({k: 'conn', x, z: -24, w: 30, d: 8, h: 8})),
    ...[-196, 196].map(x => ({k: 'ic', x, z: -18, w: 5, d: 5, h: 0.9})),
    ...[-90, -80, 80, 90].map(x => ({k: 'res', x, z: 4, w: 6.4, d: 3.2, h: 0.7})),
  ]},
  // (a card carries two devices, NICs or DPUs, each under a heatsink of its own; their power stages beside them)
  nic: {w: 50, d: 140, parts: [
    ...[-48, -18].map(z => ({k: 'ic', x: 0, z, w: 22, d: 22, h: 1.6})),
    ...[-1, 1].flatMap(s => [-46, -36].map(z => ({k: 'choke', x: s * 20.5, z, w: 6, d: 6, h: 4.5}))),
    {k: 'mcio', x: 0, z: -64.5, w: 18, d: 9, h: 7},
    ...Array.from({length: 10}, (_, k) => ({k: 'cap', x: -20 + (k % 5) * 2.4, z: 2 + Math.floor(k / 5) * 2.4, w: 1.6, d: 0.8, h: 0.8})),
    {k: 'xtal', x: 18, z: 0, w: 3.2, d: 2.5, h: 0.9},
  ]},
  mgmt: {w: 104, d: 116, parts: [
    {k: 'bga', x: 22, z: -20, w: 19, d: 19, h: 1.6},
    {k: 'lpddr', x: 22, z: 6, w: 10, d: 12, h: 1.0},
    {k: 'soic', x: 2, z: -20, w: 4.9, d: 3.9, h: 1.5},
    {k: 'm2', x: -30, z: -6, w: 22, d: 80, h: 1.0},
    {k: 'ic', x: 40, z: 22, w: 6, d: 6, h: 0.9},
    ...Array.from({length: 8}, (_, k) => ({k: 'cap', x: 6 + (k % 4) * 2.6, z: -6 + Math.floor(k / 4) * 3, w: 1.6, d: 0.8, h: 0.8})),
  ]},
};

// the front panel, tray-local mm (x across, y up from the tray's middle)
export const FRONT = {
  sleds: Array.from({length: 8}, (_, k) => -177 + k * 14.5), sledW: 13, sledH: 36,
  vent: [-62, -6], jack: {x: 10, y: 0.5, w: 16, h: 23},
  power: {x: 27, y: -7}, id: {x: 27, y: 6},
  osfp: [56, 80, 106, 130], osfpW: 22.6, osfpH: 13,
  qsfp: [163, 184], qsfpW: 18.4, qsfpH: 8.6,
  locate: {x: -194, y: 11}, handles: [-207, 207],
};

// ---------------------------------------------------------------------------------------------------------------
// painters

const PCB = {pour: '#14402f', gap: '#0a271c', trace: '#1c5039', silk: '#e2e6dc', gold: '#d2aa60', via: '#184634', hole: '#050706'};
// the finishes keep apart: satin solder mask, matte ink, smooth plated gold
const MASK = {r: 0.42, m: 0};
const GOLD = {c: PCB.gold, h: 0.6, r: 0.22, m: 1};
const SILK = {c: PCB.silk, h: 0.56, r: 0.8, m: 0};

// pads and silkscreen for one part of a board, in its board's mm
function footprint(P, p, {refs = true} = {}) {
  const {x, z, w, d} = p, r90 = p.rot === 90, W = r90 ? d : w, D = r90 ? w : d;
  const pad = (px, pz, pw, pd) => P.rect(px - pw / 2, pz - pd / 2, pw, pd, GOLD);
  const box = (m, lw = 0.18) => P.frame(x - W / 2 - m, z - D / 2 - m, W + 2 * m, D + 2 * m, lw, SILK);
  const label = (s, dx, dz, size = 1.05, rot = 0) => refs && s && P.text(s, x + dx, z + dz, size, SILK, {rot});
  const long = W >= D;
  switch (p.k) {
    case 'choke':
      if (r90) for (const s of [-1, 1]) pad(x, z + s * (D / 2 - 1.0), W - 1.2, 3.0); else for (const s of [-1, 1]) pad(x + s * (W / 2 - 1.0), z, 3.0, D - 1.2);
      box(0.6); break;
    case 'stage': pad(x, z, W + 0.5, D + 0.5); P.line([[x - W / 2 - 0.5, z - D / 2 - 0.5], [x - W / 2 - 0.5, z - D / 2 + 1]], 0.18, SILK); break;
    case 'poscap':
      if (long) for (const s of [-1, 1]) pad(x + s * (W / 2 - 0.7), z, 2.6, D - 0.6); else for (const s of [-1, 1]) pad(x, z + s * (D / 2 - 0.7), W - 0.6, 2.6);
      box(0.5);
      if (refs) P.text('+', long ? x - W / 2 - 1.4 : x, long ? z : z + (p.pol < 0 ? -1 : 1) * (D / 2 + 1.3), 1.3, SILK);
      break;
    case 'cap': case 'res':
      if (long) for (const s of [-1, 1]) pad(x + s * (W / 2 - W * 0.16), z, W * 0.34 + 0.25, D + 0.25); else for (const s of [-1, 1]) pad(x, z + s * (D / 2 - D * 0.16), W + 0.25, D * 0.34 + 0.25);
      if (p.k === 'res') {box(0.4); label(p.ref, 0, D / 2 + 1.2);}
      break;
    case 'ic': case 'bga':
      if (p.k === 'ic') pad(x, z, W + 0.5, D + 0.5);
      box(0.5); P.circle(x - W / 2 - 1.0, z - D / 2 - 1.0, 0.35, SILK); label(p.ref, 0, D / 2 + 1.5); break;
    case 'soic':
      for (let k = 0; k < 4; k++) for (const s of [-1, 1]) {
        const o = (k - 1.5) * 1.27;
        if (r90) pad(x + o, z + s * (D / 2 + 0.9), 0.6, 1.6); else pad(x + s * (W / 2 + 0.9), z + o, 1.6, 0.6);
      }
      box(0.2); P.circle(x - W / 2 - 1.6, z - D / 2 - 0.4, 0.3, SILK); label(p.ref, 0, D / 2 + 2.2); break;
    case 'lpddr': for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.line([[x + sx * (W / 2 + 0.5), z + sz * (D / 2 - 1.5)], [x + sx * (W / 2 + 0.5), z + sz * (D / 2 + 0.5)], [x + sx * (W / 2 - 1.5), z + sz * (D / 2 + 0.5)]], 0.18, SILK);
      P.poly([[x - W / 2 - 0.4, z - D / 2 - 0.4], [x - W / 2 + 1.2, z - D / 2 - 0.4], [x - W / 2 - 0.4, z - D / 2 + 1.2]], SILK); break;
    case 'xtal': for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) pad(x + sx * (W / 2 - 0.5), z + sz * (D / 2 - 0.45), 1.2, 1.0); box(0.4); label(p.ref, 0, -D / 2 - 1.3); break;
    case 'led': for (const s of [-1, 1]) pad(x + s * (W / 2 - 0.25), z, 0.7, D + 0.2); label(p.ref, -W / 2 - 2.4, 0, 0.9); break;
    case 'ecap': P.ring(x, z, W / 2 + 0.5, 0.18, SILK); P.poly([[x - W / 2 - 0.5, z - 1], [x - W / 2 - 0.5, z + 1], [x - W / 2 - 1.6, z]], SILK); label(p.ref, 0, D / 2 + 1.6); break;
    case 'post': P.circle(x, z, 4.0, GOLD); P.circle(x, z, 1.6, {c: PCB.hole, h: 0.2}); P.ring(x, z, 5.0, 0.18, SILK); break;
    case 'hole':
      P.circle(x, z, 3.8, GOLD); P.circle(x, z, 1.6, {c: PCB.hole, h: 0.2});
      for (let k = 0; k < 8; k++) {const a = k * Math.PI / 4; P.circle(x + Math.cos(a) * 4.6, z + Math.sin(a) * 4.6, 0.35, GOLD); P.circle(x + Math.cos(a) * 4.6, z + Math.sin(a) * 4.6, 0.16, {c: PCB.hole, h: 0.3});}
      P.ring(x, z, 5.6, 0.18, SILK); break;
    case 'pwr': case 'mcio': case 'conn': case 'fanhdr':
      for (let k = 0; k < Math.floor((W - 1) / 0.9); k++) for (const s of [-1, 1]) pad(x - W / 2 + 0.9 + k * 0.9, z + s * (D / 2 + 0.7), 0.42, 1.4);
      box(0.3); P.poly([[x - W / 2 - 1.8, z - D / 2], [x - W / 2 - 0.8, z - D / 2 + 0.6], [x - W / 2 - 1.8, z - D / 2 + 1.2]], SILK); label(p.ref, W / 2 + 2.2, 0); break;
    case 'nvl':
      for (let k = 0; k < 40; k++) pad(x - W / 2 + 2 + k * 1.33, z + D / 2 + 0.8, 0.6, 1.4);
      for (const s of [-1, 1]) {P.circle(x + s * (W / 2 - 2.5), z, 1.6, GOLD); P.circle(x + s * (W / 2 - 2.5), z, 0.9, {c: PCB.hole, h: 0.2});}
      box(0.4); label(p.ref, 0, D / 2 + 2.6, 1.3); break;
    case 'header': for (let i = 0; i < 5; i++) for (const s of [-1, 1]) {P.circle(x - 5.08 + i * 2.54, z + s * 1.27, 0.8, GOLD); P.circle(x - 5.08 + i * 2.54, z + s * 1.27, 0.4, {c: PCB.hole, h: 0.25});}
      box(0.4); label(p.ref, 0, -D / 2 - 1.6); break;
    case 'pkg': case 'cpu': {
      const m = 1.2, L = 7;
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) P.line([[x + sx * (W / 2 + m), z + sz * (W / 2 + m - L)], [x + sx * (W / 2 + m), z + sz * (W / 2 + m)], [x + sx * (W / 2 + m - L), z + sz * (W / 2 + m)]], 0.3, SILK);
      P.poly([[x - W / 2 - m - 0.2, z - D / 2 - m - 0.2], [x - W / 2 - m + 2.4, z - D / 2 - m - 0.2], [x - W / 2 - m - 0.2, z - D / 2 - m + 2.4]], SILK);
      break;
    }
    case 'brick': for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {P.circle(x + sx * (W / 2 - 3), z + sz * (D / 2 - 3), 1.4, GOLD);} box(0.6); label(p.ref, 0, D / 2 + 2); break;
    case 'm2': box(0.4); P.circle(x, z + D / 2 + 2, 2.6, GOLD); P.circle(x, z + D / 2 + 2, 1.2, {c: PCB.hole, h: 0.2}); break;
    default: break;
  }
}

// a part's contact shadow on the board it stands on (colour only: the tray light's shadow map is far too coarse for
// parts a few millimetres tall): a dark line where it meets the board, and a broader, fainter falloff all round it,
// leaning a little away from the tray's key light, which comes from the front right
function contact(P, x, z, W, D, h, round = false) {
  if (!(h > 0.2)) return;
  P.shade(x, z, W, D, {sigma: 0.08 + 0.035 * Math.min(h, 6), alpha: Math.min(0.8, 0.42 + 0.08 * h), ao: 0.5, grow: 0.05, round});
  if (h < 0.7) return;
  const t = Math.min(h, 7);
  P.shade(x, z, W, D, {sigma: 0.3 + 0.42 * t, alpha: Math.min(0.5, 0.18 + 0.06 * t), ao: Math.min(0.85, 0.4 + 0.08 * t), dx: -0.04 * t, dz: -0.08 * t, grow: 0.14 * t, round});
}
// what a board part shows the board, for its contact shadow: footprint, height, round or not
function partShadow(P, p) {
  const r90 = p.rot === 90, W = r90 ? p.d : p.w, D = r90 ? p.w : p.d;
  switch (p.k) {
    // (a package stands on its solder balls: a dark gap under its edge, then a fuller falloff than a part's)
    case 'pkg': case 'cpu':
      P.shade(p.x, p.z, W, D, {sigma: 0.22, alpha: 0.85, ao: 0.75, grow: 0.12});
      return contact(P, p.x, p.z, W, D, 3.4);
    case 'post': return contact(P, p.x, p.z, 5.4, 5.4, p.h, true);
    case 'hole': return contact(P, p.x, p.z, 5.4, 5.4, 1.5, true);
    case 'ecap': return contact(P, p.x, p.z, W, W, p.h, true);
    case 'header': return contact(P, p.x, p.z, W, D, 2.5);
    // (the boot drive stands clear of its board, held at its ends)
    case 'm2': return P.shade(p.x, p.z, W, D, {sigma: 1.1, alpha: 0.25, ao: 0.5, dx: -0.3, dz: -0.6});
    default: return contact(P, p.x, p.z, W, D, p.h);
  }
}

function* paintBoard(P, parts) {
  const rnd = rng(5);
  P.begin(R.board, 200, 370, 100, 185);
  P.rect(-100, -185, 200, 370, {c: PCB.pour, h: 0.52, ...MASK});
  // the cure and the copper under the mask are never perfectly even, in colour or in sheen
  for (let i = 0; i < 700; i++) {P.circle(-100 + rnd() * 200, -185 + rnd() * 370, 3 + rnd() * 12, {c: rnd() > 0.5 ? 'rgba(52,104,74,0.018)' : 'rgba(2,18,10,0.024)'}); if (i % 100 === 99) yield;}
  for (let i = 0; i < 160; i++) {const a = P.x.rm; a.fillStyle = `rgba(255,${rnd() > 0.5 ? 92 : 128},0,0.16)`; a.beginPath(); a.arc(-100 + rnd() * 200, -185 + rnd() * 370, 4 + rnd() * 16, 0, Math.PI * 2); a.fill();}
  // power pours: the clearance round each shows as a dark line through the mask
  const outline = (x0, z0, x1, z1) => P.rrect(x0, z0, x1 - x0, z1 - z0, 1.4, 0.5, {c: PCB.gap, h: 0.46});
  for (const gz of GPU_LOCAL) for (const s of [-1, 1]) {
    outline(Math.min(s * 38.6, s * 60.6), gz - 39.5, Math.max(s * 38.6, s * 60.6), gz + 39.5);
    outline(Math.min(s * 61.2, s * 71.4), gz - 37.5, Math.max(s * 61.2, s * 71.4), gz + 37.5);
  }
  outline(-30.5, 143, 30.5, 161.5); outline(-30.5, 162.2, 30.5, 173.4);
  outline(-57, 165, -31.5, 184);
  // a keep-out map, so the stitching vias stay off the traces and parts
  const occ = new Uint8Array(200 * 370), mark = (x, z, r) => {
    for (let i = Math.floor(x - r); i <= Math.ceil(x + r); i++) for (let j = Math.floor(z - r); j <= Math.ceil(z + r); j++) {
      const u = i + 100, v = j + 185; if (u >= 0 && u < 200 && v >= 0 && v < 370) occ[v * 200 + u] = 1;
    }
  };
  for (const p of parts) {const W = p.rot === 90 ? p.d : p.w, D = p.rot === 90 ? p.w : p.d; for (let i = -W / 2 - 1.5; i <= W / 2 + 1.5; i += 1) for (let j = -D / 2 - 1.5; j <= D / 2 + 1.5; j += 1) mark(p.x + i, p.z + j, 0);}
  yield;
  // routed bundles of differential pairs
  const lanes = (path, pairs, pitch = 1.25, w = 0.2, sep = 0.44) => {
    const offs = [];
    for (let i = 0; i < pairs; i++) {const o = (i - (pairs - 1) / 2) * pitch; offs.push(o - sep / 2, o + sep / 2);}
    const paths = offs.map(o => offsetPath(path, o));
    for (const p of paths) P.line(p, w + 0.4, {c: PCB.gap, h: 0.47});
    for (const p of paths) P.line(p, w, {c: PCB.trace, h: 0.6});
    for (let i = 0; i < path.length - 1; i++) {
      const [ax, az] = path[i], [bx, bz] = path[i + 1], n = Math.ceil(Math.hypot(bx - ax, bz - az));
      for (let k = 0; k <= n; k++) mark(ax + (bx - ax) * k / n, az + (bz - az) * k / n, pairs * pitch / 2 + 1);
    }
  };
  for (const s of [-1, 1]) {
    // GPU1 to the NVLink connectors behind it
    lanes([[s * 29, -146], [s * 29, -166]], 8);
    lanes([[s * 60, -147], [s * 60, -166]], 7);
    yield;
    // GPU0's links: out between the posts, along the board edge past GPU1's power stages, and in to the connectors
    lanes([[s * 24, -37], [s * 24, -47], [s * 33, -56], [s * 76, -56], [s * 84, -64], [s * 84, -152], [s * 72, -164], [s * 72, -167]], 7, 1.2);
    yield;
    // PCIe from the CPU to the cable connectors for the front cards
    lanes([[s * 27, 124], [s * 57, 124], [s * 75, 142], [s * 75, 170]], 6, 1.2);
    yield;
    // gate drive from each phase controller to its power stages
    for (const gz of GPU_LOCAL) for (let k = 0; k < 7; k++) {
      const z = gz + (k - 3) * 10.5, x0 = s * 73.2, z0 = gz - 28 + (k - 3) * 0.6, xm = s * 70.6;
      const pts = [[x0, z0], [xm, z0 + (z - z0) * 0.2], [xm, z - 2.6 * Math.sign(z - z0 || 1)], [s * 66.4, z]];
      P.line(pts, 0.35, {c: PCB.gap, h: 0.47}); P.line(pts, 0.15, {c: PCB.trace, h: 0.58});
    }
  }
  // the chip-to-chip link from the CPU to GPU0, length-matched with serpentines on the outer pairs
  lanes([[0, 39], [0, 88]], 12, 1.15);
  yield;
  for (const s of [-1, 1]) {
    const pts = []; for (let z = 39; z <= 88; z += 0.5) {const k = z > 52 && z < 72 ? Math.sin((z - 52) / 20 * Math.PI * 7) * 1.0 : 0; pts.push([s * (8.6 + k), z]);}
    P.line(pts, 0.6, {c: PCB.gap, h: 0.47}); P.line(pts, 0.2, {c: PCB.trace, h: 0.6});
  }
  // low-speed buses between the housekeeping chips
  for (const pts of [[[-82, 98], [-82, 94]], [[-76, 90], [-66, 90], [-60, 84], [-60, 66], [-18, 66], [-12, 60], [-12, -52]], [[-76, 92], [-64, 92], [-58, 86], [-58, 68], [-16, 68], [-10, 62], [-10, -52]], [[76, 88], [66, 88], [62, 92], [62, 104]]]) {
    P.line(pts, 0.42, {c: PCB.gap, h: 0.47}); P.line(pts, 0.16, {c: PCB.trace, h: 0.58});
  }
  // vias: power fences along the package edges, stitching on a grid where there's room, a fence round the edge
  const via = (x, z) => {P.circle(x, z, 0.36, {c: PCB.via, h: 0.58}); P.circle(x, z, 0.14, {c: '#0e3324', h: 0.44});};
  for (const gz of GPU_LOCAL) for (const s of [-1, 1]) for (let k = 0; k < 58; k++) via(s * 39.6, gz - 34.5 + k * 1.2);
  yield;
  for (let x = -97; x <= 97; x += 4.2) {
    for (let z = -182; z <= 182; z += 4.2) {
      const u = Math.round(x) + 100, v = Math.round(z) + 185;
      if (!occ[v * 200 + u] && rnd() < 0.36) via(x, z);
    }
    yield;
  }
  for (let k = 0; k < 170; k++) {via(-98.6, -183 + k * 2.17); via(98.6, -183 + k * 2.17);}
  for (let k = 0; k < 90; k++) {via(-97 + k * 2.17, -183.6); via(-97 + k * 2.17, 183.6);}
  yield;
  // test points by every phase
  for (const gz of GPU_LOCAL) for (const s of [-1, 1]) for (let k = 0; k < 7; k++) P.circle(s * 71.6, gz + (k - 3) * 10.5 + 4.4, 0.5, GOLD);
  yield;
  // pads and silkscreen for every part, then the shadow each part puts on the board round it
  for (const [i, p] of parts.entries()) {footprint(P, p); if (i % 20 === 19) yield;}
  for (const [i, p] of parts.entries()) {partShadow(P, p); if (i % 3 === 2) yield;}
  // labels a person reads: what each package is, connector names, the board's own number
  for (const p of parts) if (p.label) P.text(p.label, p.k === 'cpu' ? -24 : -30, p.k === 'cpu' ? 84 : p.z - 41.6, 2.6, SILK, {weight: 700, align: 'left'});
  for (const s of [-1, 1]) P.text(s < 0 ? 'NVL A' : 'NVL B', s * 48, -161.4, 1.4, SILK, {weight: 700});
  P.text('SB-2G   REV A04', -86, 106, 1.8, SILK, {weight: 700, rot: -Math.PI / 2});
  P.text('2438   94V-0', -91.5, 106, 1.3, SILK, {rot: -Math.PI / 2});
  for (const [x, z, t] of [[-80, 140, 'PG'], [-80, 128, 'STBY']]) P.text(t, x, z, 1.1, SILK);
  // a barcode label
  P.rect(66, 102, 19, 7, {c: '#ecebe4', h: 0.6, r: 0.8, m: 0});
  for (let x = 67.2, k = 0; x < 83.6; k++) {const w = 0.15 + ((k * 7919) % 5) * 0.12; if (k % 2 === 0) P.rect(x, 102.8, w, 3.8, {c: '#1a1a1a'}); x += w + 0.12;}
  P.text('SN 1652 2441 0087', 75.5, 107.9, 0.9, {c: '#222'});
  // fiducials
  for (const [x, z] of [[-86, -181], [86, -181], [-20, 181.5]]) {P.circle(x, z, 1.6, {c: PCB.gap, h: 0.44}); P.circle(x, z, 0.6, GOLD);}
  // the board's edge, where the mask pulls back from the laminate
  P.frame(-99.85, -184.85, 199.7, 369.7, 0.3, {c: '#2b5a44', h: 0.5});
  P.end();
  yield;
}

// the GPU package's mould from above: matte black compound round the dies and the HBM stacks, with a hairline where it
// meets each and a soft shadow at each one's foot. `stand`: package-local mm rects {x, z, w, d, h} of what stands out
// of it, h its height above the mould
function* paintMould(P, stand) {
  const rnd = rng(61);
  P.begin(R.mould, 53, 59, 26.5, 29.5);
  P.rect(-26.5, -29.5, 53, 59, {c: '#1a1b1d', h: 0.5, r: 0.64, m: 0});
  for (let i = 0; i < 120; i++) P.circle(-26.5 + rnd() * 53, -29.5 + rnd() * 59, 0.5 + rnd() * 2.5, {c: rnd() > 0.5 ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.04)'});
  yield;
  for (const o of stand) {
    P.frame(o.x - o.w / 2 - 0.08, o.z - o.d / 2 - 0.08, o.w + 0.16, o.d + 0.16, 0.12, {c: '#0b0b0c', h: 0.48});
    P.shade(o.x, o.z, o.w, o.d, {sigma: 0.22, alpha: 0.55, ao: 0.6, grow: 0.06});
    P.shade(o.x, o.z, o.w, o.d, {sigma: 0.5 + 0.8 * o.h, alpha: 0.3, ao: 0.55, grow: 0.15 + 0.4 * o.h, dx: -0.1, dz: -0.2});
    yield;
  }
  P.end();
}

function* paintSubstrate(P, region, size, interposer, caps, gpu) {
  const rnd = rng(gpu ? 3 : 4), h = size / 2;
  P.begin(region, size, size, h, h);
  // a warm dark olive laminate under its solder resist, with a slight sheen and a faint mottle
  P.rect(-h, -h, size, size, {c: gpu ? '#2f3424' : '#303527', h: 0.5, r: 0.4, m: 0});
  for (let i = 0; i < 260; i++) P.circle(-h + rnd() * size, -h + rnd() * size, 0.4 + rnd() * 1.6, {c: rnd() > 0.5 ? 'rgba(96,104,70,0.035)' : 'rgba(8,10,2,0.045)'});
  // fine routing seen through the solder resist near the edges
  for (let i = 0; i < 26; i++) {
    const o = -h + 2 + i * (size - 4) / 25;
    P.line([[o, -h + 0.8], [o, -h + 2.2], [o + 0.8, -h + 3.0]], 0.12, {c: 'rgba(70,96,78,0.8)', h: 0.54});
    P.line([[o, h - 0.8], [o, h - 2.2], [o - 0.8, h - 3.0]], 0.12, {c: 'rgba(70,96,78,0.8)', h: 0.54});
  }
  P.rect(-interposer[0] / 2 - 0.3, -interposer[1] / 2 - 0.3, interposer[0] + 0.6, interposer[1] + 0.6, {c: '#121614', h: 0.5});
  const pad = {c: '#c9b88e', h: 0.58, r: 0.3, m: 1};
  for (const c of caps) {
    if (c.w > c.d) for (const s of [-1, 1]) P.rect(c.x + s * c.w / 2 - 0.22, c.z - c.d / 2 - 0.08, 0.44, c.d + 0.16, pad);
    else for (const s of [-1, 1]) P.rect(c.x - c.w / 2 - 0.08, c.z + s * c.d / 2 - 0.22, c.w + 0.16, 0.44, pad);
  }
  yield;
  // pin 1, fiducials, a laser-marked 2D code and lot text in the free corners
  P.poly([[-h + 0.8, -h + 0.8], [-h + 4.6, -h + 0.8], [-h + 0.8, -h + 4.6]], GOLD);
  for (const [x, z] of [[h - 2, -h + 2], [-h + 2, h - 2]]) {P.circle(x, z, 0.9, {c: '#18201b'}); P.circle(x, z, 0.45, GOLD);}
  const code = (cx, cz, n, s) => {const r = rng(9); for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i === 0 || j === n - 1 || ((i + j) % 2 === 0 && j === 0) || ((i % 2 === 0) && i === n - 1) || r() > 0.5) P.rect(cx + i * s, cz + j * s, s * 0.92, s * 0.92, {c: '#8a948c', h: 0.47});};
  if (gpu) {code(h - 9.4, h - 8.2, 14, 0.42); P.text('2441A3', -h + 6.5, h - 6.4, 1.15, {c: '#8a948c', h: 0.47}); P.text('KQ2B-01', -h + 6.5, h - 4.6, 1.15, {c: '#8a948c', h: 0.47});}
  else {code(h - 6.4, h - 6.0, 12, 0.4); P.text('2440B', -h + 5.2, h - 4.4, 1.0, {c: '#8a948c', h: 0.47});}
  P.frame(-h + 0.2, -h + 0.2, size - 0.4, size - 0.4, 0.35, {c: '#3c4a40', h: 0.52});
  // contact shadows: round the interposer's moulded block (the GPU's) or the lid (the CPU's), and each capacitor
  if (gpu) contact(P, 0, 0, interposer[0], interposer[1], 2.8); else contact(P, 0, 0, 41, 41, 2.6);
  yield;
  for (const [i, c] of caps.entries()) {contact(P, c.x, c.z, c.w, c.d, 0.5); if (i % 16 === 15) yield;}
  P.end();
}

function paintChipTops(P) {
  // a chip's top: black epoxy, laser-marked text, a pin-1 dimple (stretched to every chip's shape)
  P.begin(R.ic, 10, 10);
  P.rect(0, 0, 10, 10, {c: '#151618', h: 0.5, r: 0.62, m: 0});
  P.circle(1.5, 1.5, 0.6, {c: '#0c0c0d', h: 0.4});
  P.text('2441', 5.2, 4.1, 1.5, {c: '#4b4d52', h: 0.47}); P.text('A7Q3 TW', 5.2, 6.0, 1.15, {c: '#4b4d52', h: 0.47}); P.text('E3', 5.2, 7.7, 1.0, {c: '#4b4d52', h: 0.47});
  P.end();
  P.begin(R.lp, 12, 14);
  P.rect(0, 0, 12, 14, {c: '#141517', h: 0.5, r: 0.58, m: 0});
  P.poly([[0.6, 0.6], [2.4, 0.6], [0.6, 2.4]], {c: '#3b3d42', h: 0.47});
  P.text('LP5X', 6, 5.0, 1.8, {c: '#4a4c51', h: 0.47}); P.text('16G 8533', 6, 7.4, 1.35, {c: '#4a4c51', h: 0.47}); P.text('2436 MY', 6, 9.4, 1.2, {c: '#4a4c51', h: 0.47});
  P.end();
  P.begin(R.poscap, 7.3, 4.3);
  P.rect(0, 0, 7.3, 4.3, {c: '#1d1a17', h: 0.5, r: 0.42, m: 0});
  P.rect(0, 0, 1.5, 4.3, {c: '#6d6250', h: 0.5});
  P.text('470', 4.4, 1.6, 1.1, {c: '#857c6c', h: 0.5}); P.text('2.5V', 4.4, 2.9, 0.9, {c: '#857c6c', h: 0.5});
  P.end();
  P.begin(R.choke, 9, 9);
  P.rect(0, 0, 9, 9, {c: '#2a2b2e', h: 0.5, r: 0.74, m: 0});
  // the moulded powder's grain: fine and faint, so it reads as a matte finish, not a pattern
  const r = rng(77);
  for (let i = 0; i < 700; i++) P.rect(r() * 9, r() * 9, 0.06, 0.06, {c: r() > 0.5 ? '#2f3033' : '#25262a', h: 0.5 + (r() - 0.5) * 0.015});
  P.text('R15', 4.5, 4.6, 1.25, {c: '#56585e', h: 0.5});
  P.end();
  P.begin(R.hbm, 10.5, 11.5);
  // the stack's top is its top die's back: plain dark silicon, like the GPU dies, with a hairline where the mould meets it
  // (lapped smoother than the matte mould round it, so it reads a touch lighter)
  P.rect(0, 0, 10.5, 11.5, {c: '#282b31', h: 0.5, r: 0.3, m: 0});
  P.frame(0.12, 0.12, 10.26, 11.26, 0.12, {c: '#31343a', h: 0.49});
  // its back is ground too: faint arcs a little smoother and a little rougher by turns, in the finish alone
  {
    const a = P.x.rm, rr = rng(53);
    for (let i = 0; i < 26; i++) {
      a.strokeStyle = `rgba(255,${Math.round((i % 2 ? 0.27 : 0.33) * 255)},0,${(0.25 + rr() * 0.25).toFixed(2)})`; a.lineWidth = 0.18;
      a.beginPath(); a.arc(-14, 26, 22 + i * 0.62 + rr() * 0.2, -Math.PI / 2.4, -Math.PI / 5.5); a.stroke();
    }
  }
  P.end();
}

function paintCover(P) {
  // the cold plate's top cover: black, with the flow engraved on it
  P.begin(R.cover, 50, 56);
  P.rect(0, 0, 50, 56, {c: '#17181b', h: 0.5, r: 0.4, m: 0});
  P.rrect(2.2, 2.2, 45.6, 51.6, 2, 0.35, {c: '#2b2c30', h: 0.44});
  const eng = {c: '#4a4c51', h: 0.44, r: 0.55};
  P.line([[25, 17], [25, 39]], 0.55, eng);
  P.poly([[25, 41.5], [22.6, 37.5], [27.4, 37.5]], eng);
  P.text('IN', 34.5, 10, 2.0, eng, {weight: 700}); P.text('OUT', 35.5, 46, 2.0, eng, {weight: 700});
  for (const [x, z] of [[5.5, 5.5], [44.5, 5.5], [44.5, 50.5], [5.5, 50.5]]) {
    P.circle(x, z, 1.7, {c: '#a7abb1', h: 0.56, r: 0.3, m: 1});
    P.line([[x - 0.8, z], [x + 0.8, z]], 0.35, {c: '#2a2b2e', h: 0.5}); P.line([[x, z - 0.8], [x, z + 0.8]], 0.35, {c: '#2a2b2e', h: 0.5});
  }
  P.end();
}

function paintLabels(P) {
  // the service label on the lid: no maker's name, just the part and serial
  P.begin(R.label, 60, 40);
  P.rect(0, 0, 60, 40, {c: '#ebe9e3', h: 0.52, r: 0.82, m: 0});
  P.rect(0, 0, 60, 6.5, {c: '#1d1e21'});
  P.text('COMPUTE TRAY', 3, 3.3, 2.6, {c: '#ebe9e3'}, {align: 'left', weight: 700});
  const ink = {c: '#2a2b2e'};
  [['P/N', '18-0442-01'], ['S/N', '1652124410087'], ['REV', 'A04'], ['MFG', '2441']].forEach(([a, b], i) => {P.text(a, 3, 11 + i * 4.6, 2.0, ink, {align: 'left', weight: 700}); P.text(b, 11, 11 + i * 4.6, 2.0, ink, {align: 'left', weight: 500});});
  for (let x = 3, k = 0; x < 34; k++) {const w = 0.25 + ((k * 31) % 4) * 0.2; if (k % 2 === 0) P.rect(x, 30.5, w, 6.4, ink); x += w + 0.25;}
  const r = rng(21);
  for (let i = 0; i < 17; i++) for (let j = 0; j < 17; j++) if (i < 1 || j < 1 || i > 15 || j > 15 || r() > 0.52) P.rect(40 + i * 1.05, 12 + j * 1.05, 1.0, 1.0, ink);
  P.end();
  // an E1.S sled's face: grip ribs, the latch's recess, an LED window, a write-on label
  P.begin(R.sled, 13, 36);
  P.rect(0, 0, 13, 36, {c: '#2d2f33', h: 0.5, r: 0.58, m: 0});
  for (let y = 21; y < 34; y += 1.3) P.rect(1.6, y, 9.8, 0.5, {c: '#1c1d20', h: 0.38});
  P.rect(1.4, 1.0, 10.2, 7.4, {c: '#1a1b1e', h: 0.42});
  P.rect(5.2, 10.2, 2.6, 1.3, {c: '#0b0b0c', h: 0.45});
  P.rect(2.0, 13.4, 9.0, 5.6, {c: '#c9c6bd', h: 0.53, r: 0.82});
  for (let k = 0; k < 3; k++) P.rect(2.8, 14.4 + k * 1.5, 4 + k, 0.4, {c: '#5a5a58'});
  P.end();
  // a DC-DC module's top: an aluminium plate with a label
  P.begin(R.brick, 58, 36);
  P.rect(0, 0, 58, 36, {c: '#b9bdc2', h: 0.5, r: 0.38, m: 1});
  for (let k = 0; k < 40; k++) P.rect(0, k * 0.9, 58, 0.25, {c: 'rgba(255,255,255,0.05)'});
  for (const [x, z] of [[3, 3], [55, 3], [55, 33], [3, 33]]) P.circle(x, z, 1.5, {c: '#55585d', h: 0.3, r: 0.6, m: 1});
  P.rect(9, 7, 40, 22, {c: '#e7e5df', h: 0.52, r: 0.8, m: 0});
  P.text('48V : 12V', 29, 13, 3.0, {c: '#222'}, {weight: 700}); P.text('IN 40–60V  OUT 12V  1.2kW', 29, 19, 1.7, {c: '#333'}); P.text('2439  A2', 29, 24, 1.6, {c: '#555'});
  P.end();
}

// a small board: mask, a few routed buses, pads and silkscreen for its parts
function* paintSmallBoard(P, region, spec, buses = []) {
  const {w, d, parts} = spec, rnd = rng(w + d);
  P.begin(region, w, d, w / 2, d / 2);
  P.rect(-w / 2, -d / 2, w, d, {c: PCB.pour, h: 0.52, ...MASK});
  for (let i = 0; i < w * d / 60; i++) P.circle(-w / 2 + rnd() * w, -d / 2 + rnd() * d, 0.4, {c: PCB.via, h: 0.56});
  for (const pts of buses) {for (const [o, c, lw] of [[0, PCB.gap, 2.6], [0, PCB.trace, 1.8]]) P.line(pts, lw, {c, h: c === PCB.trace ? 0.58 : 0.47});}
  for (const p of parts) footprint(P, p, {refs: true});
  yield;
  for (const [i, p] of parts.entries()) {partShadow(P, p); if (i % 3 === 2) yield;}
  P.frame(-w / 2 + 0.2, -d / 2 + 0.2, w - 0.4, d - 0.4, 0.3, {c: '#2b5a44', h: 0.5});
  P.end();
}

function paintM2(P) {
  P.begin(R.m2, 22, 80, 11, 40);
  P.rect(-11, -40, 22, 80, {c: '#16191d', h: 0.52, r: 0.4, m: 0});
  for (let k = 0; k < 30; k++) P.rect(-10 + k * 0.67, -40, 0.4, 3.6, GOLD);
  P.rect(-8, 30, 16, 8, {c: '#e6e4de', h: 0.55, r: 0.8});
  P.text('M.2 2280  960G', 0, 34, 1.4, {c: '#333'});
  P.end();
}

function* paintBezel(P) {
  // the front panel, left to right as you face it (canvas y runs down; the panel's y runs up)
  const rnd = rng(13), H = 41.45;
  P.begin(R.bezel, 438, H, 219, H / 2);
  P.rect(-219, -H / 2, 438, H, {c: '#26282c', h: 0.5, r: 0.6, m: 0});
  for (let i = 0; i < 2600; i++) {P.circle(-219 + rnd() * 438, -H / 2 + rnd() * H, 0.25 + rnd() * 0.4, {h: 0.5 + (rnd() - 0.5) * 0.05, c: rnd() > 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.05)'}); if (i % 400 === 399) yield;}
  // the ears, with their screws, and the folds where they meet the panel
  for (const s of [-1, 1]) {
    P.rect(s < 0 ? -219 : 202.6, -H / 2, 16.4, H, {c: '#2c2e33'});
    P.rect(s < 0 ? 202.4 * -1 - 0.4 : 202.4, -H / 2, 0.6, H, {c: '#121315', h: 0.44});
    for (const y of [-14, 14]) {P.circle(s * 213.5, y, 1.9, {c: '#121314', h: 0.4}); P.circle(s * 213.5, y, 1.4, {c: '#8f9399', h: 0.55, r: 0.35, m: 1});}
  }
  // drive bays: a dark opening behind the sleds
  P.rect(-184.2, -19, 116.4, 38, {c: '#08090a', h: 0.32, r: 0.9});
  // the honeycomb vent
  const [v0, v1] = FRONT.vent, r = 1.5, px = 3.5, py = 3.03;
  for (let row = 0, y = -16.5; y <= 16.6; row++, y += py) {
    for (let x = v0 + 1.8 + (row % 2) * px / 2; x <= v1 - 1.6; x += px) {
      const hex = Array.from({length: 6}, (_, k) => [x + r * Math.cos(k * Math.PI / 3 + Math.PI / 6), y + r * Math.sin(k * Math.PI / 3 + Math.PI / 6)]);
      P.poly(hex, {c: '#050506', h: 0.18, r: 0.95});
      P.line([...hex, hex[0]], 0.22, {c: '#3a3d43', h: 0.6});
    }
    if (row % 3 === 2) yield;
  }
  // management: the jack's opening, the buttons, the status lights
  const j = FRONT.jack;
  P.rect(j.x - j.w / 2 - 0.4, -j.y - j.h / 2 - 0.4, j.w + 0.8, j.h + 0.8, {c: '#0a0a0b', h: 0.35});
  for (const b of [FRONT.power, FRONT.id]) {P.circle(b.x, -b.y, 3.9, {c: '#0c0c0d', h: 0.35}); P.ring(b.x, -b.y, 4.8, 0.3, {c: '#4a4d53', h: 0.56});}
  P.text('ID', FRONT.id.x + 7.4, -FRONT.id.y, 1.8, {c: '#9aa0a8', h: 0.5}, {weight: 700});
  P.ring(FRONT.power.x + 7.4, -FRONT.power.y, 1.1, 0.35, {c: '#9aa0a8', h: 0.5}); P.line([[FRONT.power.x + 7.4, -FRONT.power.y - 1.6], [FRONT.power.x + 7.4, -FRONT.power.y - 0.4]], 0.35, {c: '#9aa0a8', h: 0.5});
  for (const [y, e] of [[-14, '#2cff6a'], [-17, '#2cff6a']]) {P.rect(34.6, y - 0.6, 2.2, 1.2, {c: '#c8ffd6', e, h: 0.55});}
  P.text('MGMT', j.x, -j.y - j.h / 2 - 1.6, 1.4, {c: '#9aa0a8'}, {weight: 700});
  // network ports: the cages' openings, a link light above each, the port numbers
  FRONT.osfp.forEach((x, i) => {
    P.rect(x - 12, -7.5, 24, 15, {c: '#0a0a0b', h: 0.3});
    P.rect(x - 9.6, -11.4, 2.2, 1.2, {c: '#c8ffd6', e: '#2cff6a', h: 0.55});
    P.text(String(i + 1), x + 8.6, -10.9, 1.6, {c: '#9aa0a8'}, {weight: 700});
  });
  for (const x of FRONT.qsfp) {P.rect(x - 9.8, -5.2, 19.6, 10.4, {c: '#0a0a0b', h: 0.3}); P.rect(x - 7, -8.4, 1.8, 1.0, {c: '#ffe2b0', e: '#ffaa30', h: 0.55});}
  P.text('DPU', 173.5, 9.6, 1.6, {c: '#9aa0a8'}, {weight: 700});
  // the locate light's bezel
  P.circle(FRONT.locate.x, -FRONT.locate.y, 2.8, {c: '#0b0c0d', h: 0.38}); P.ring(FRONT.locate.x, -FRONT.locate.y, 3.4, 0.4, {c: '#4a4d53', h: 0.58});
  for (const y of [-16.8, 16.8]) for (const x of [-196, -64, 46, 150]) {P.circle(x, y, 1.1, {c: '#9a9ea4', h: 0.56, r: 0.35, m: 1}); P.line([[x - 0.6, y], [x + 0.6, y]], 0.25, {c: '#333'});}
  P.end();
}

function paintPatches(P) {
  PATCH_KEYS.forEach((k, i) => {
    const [x, y] = patchXY(i), p = PATCHES[k];
    P.begin([x - 4, y - 4, 32, 32], 32, 32);
    P.rect(0, 0, 32, 32, {c: p.c, h: 0.5, r: p.r, m: p.m || 0, e: p.e || '#000'});
    P.end();
  });
}

let ATLAS = null;
// the board's relief is shallow: solder and parts stand up, the solder mask stays flat (taken from the atlas's size)
const relief = h => (h.width < 1024 ? 2 : 3.2);
// painted in stages, so a caller that awaits between them gives the page its main thread back
// (each painter yields every few dozen strokes or every few blurred shadows: a caller can stop there for the page)
function* atlasStages(P, layout = {}) {
  yield* paintBoard(P, boardParts());
  yield* paintSubstrate(P, R.subG, 76, [53, 59], packageCaps(true), true);
  yield* paintSubstrate(P, R.subC, 52, [38, 38], packageCaps(false), false);
  yield* paintMould(P, layout.mould || []);
  paintChipTops(P); yield;
  paintCover(P); yield;
  paintLabels(P); yield;
  paintM2(P); yield;
  yield* paintBezel(P);
  const s = SMALL_BOARDS;
  yield* paintSmallBoard(P, R.pdb, s.pdb, [[[-200, 20], [-180, 20], [-175, 12], [175, 12], [180, 20], [200, 20]], [[0, -8], [0, 4], [-96, 4]], [[0, 4], [96, 4]]]);
  yield* paintSmallBoard(P, R.nic, s.nic, [[[0, -60], [0, -34]], [[-12, -5], [-12, 66]], [[12, -5], [12, 66]]]);
  yield* paintSmallBoard(P, R.dpu, s.nic, [[[0, -60], [0, -34]], [[-10, -5], [-10, 66]], [[10, -5], [10, 66]]]);
  yield* paintSmallBoard(P, R.mgmt, s.mgmt, [[[22, -8], [22, 40], [30, 50]], [[2, -20], [14, -20]]]);
  paintPatches(P);
}
function finishAtlas(P) {
  const map = tex(P.L.c), rm = tex(P.L.rm, false), e = tex(P.L.e);
  for (const t of [map, rm, e]) {t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;}
  ATLAS = {map, rm, e, h: P.L.h};
}
export function trayAtlas() {
  if (!ATLAS) {const P = new Pen(SMALL ? 1024 : 2048), it = atlasStages(P); while (!it.next().done); finishAtlas(P);}
  return {...ATLAS, normal: bakeNormal(ATLAS.h, relief(ATLAS.h))};
}
// the same, awaiting `pace` (a pacer) at every pause in the painting
// (layout.mould: what stands out of the GPU package's mould, for its contact shadows; see paintMould)
export async function trayAtlasAsync(pace = idle, layout = {}) {
  if (!ATLAS) {
    await pace.now?.();
    const P = new Pen(SMALL ? 1024 : 2048), it = atlasStages(P, layout);
    await pace.now?.();
    while (!it.next().done) await pace();
    finishAtlas(P);
  }
  // (the relief's upload and bake is one piece of work: it gets a turn of its own)
  await pace.now?.();
  return {...ATLAS, normal: bakeNormal(ATLAS.h, relief(ATLAS.h))};
}

// ---------------------------------------------------------------------------------------------------------------
// the sheet steel: plain satin galvanised sheet. Its rolling streaks come in bands, denser in some stretches and nearly
// absent in others, over a slow mottle in tone and sheen, with a few fine scratches (a tile, drawn with strokes)
let STEEL_TILE = null;
const rgba = (rgb, a = 1) => `rgba(${rgb},${Math.max(0, a).toFixed(4)})`;
// a roughness, as the colour that paints it on a roughness/metalness layer (red and blue stay full)
const RG = v => `255,${Math.round(v * 255)},255`, ROUGH = (v, a = 1) => rgba(RG(v), a);
export function steelTile() {
  if (!STEEL_TILE) {const it = steelStages(); while (!it.next().done);}
  return {...STEEL_TILE, normal: bakeNormal(STEEL_TILE.hc, 1.6, {wrap: true})};
}
// the same, awaiting `pace` (a pacer) at every pause in the painting
export async function steelTileAsync(pace = idle) {
  if (!STEEL_TILE) {const it = steelStages(); while (!it.next().done) await pace();}
  await pace.now?.();
  return steelTile();
}
function* steelStages() {
  const N = SMALL ? 256 : 512, u = N / 256, rnd = rng(17), c = canvas(N, N), rm = canvas(N, N), hc = canvas(N, N);
  const a = c.getContext('2d'), r = rm.getContext('2d'), q = hc.getContext('2d');
  a.fillStyle = grey(0.9); a.fillRect(0, 0, N, N);
  r.fillStyle = ROUGH(0.42); r.fillRect(0, 0, N, N);
  q.fillStyle = grey(0.5); q.fillRect(0, 0, N, N);
  // anything drawn near an edge is drawn again across it, so the tile repeats without a seam
  const wrapped = (ctx, fn) => {for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) {ctx.save(); ctx.translate(dx, dy); fn(); ctx.restore();}};
  const blob = (ctx, x, y, rad, rgb, alpha) => wrapped(ctx, () => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, rgba(rgb, alpha)); g.addColorStop(1, rgba(rgb, 0));
    ctx.fillStyle = g; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  });
  // the mottle: lighter patches a little smoother, darker ones a little duller
  for (let i = 0; i < 16; i++) {
    const x = rnd() * N, y = rnd() * N, rad = (24 + rnd() * 70) * u, v = rnd() - 0.5;
    blob(a, x, y, rad, v > 0 ? '255,255,255' : '0,0,0', v > 0 ? 0.06 * v : -0.05 * v);
    blob(r, x, y, rad, RG(v > 0 ? 0.34 : 0.5), 0.7 * Math.abs(v));
    if (i % 4 === 3) yield;
  }
  // the streaks' density along the tile (whole-number frequencies, so it wraps)
  const ph = [rnd(), rnd(), rnd()].map(v => v * Math.PI * 2);
  const dens = y => {const t = y / N * Math.PI * 2; return 0.45 + 0.3 * Math.sin(2 * t + ph[0]) + 0.17 * Math.sin(5 * t + ph[1]) + 0.08 * Math.sin(11 * t + ph[2]);};
  const streak = (ctx, y, h, x0, len, style) => {
    ctx.fillStyle = style;
    for (const dy of [0, -N]) for (const dx of [0, -N]) ctx.fillRect(x0 + dx, y + dy, len, h);
  };
  for (let i = 0; i < 900 * u; i++) {
    const y = rnd() * N, keep = dens(y), h = 0.35 + rnd() * 0.8, x0 = rnd() * N, len = N * (rnd() < 0.7 ? 0.08 + rnd() * 0.35 : 0.4 + rnd() * 0.7), v = rnd();
    if (rnd() > keep) continue;
    streak(a, y, h, x0, len, v > 0.5 ? `rgba(255,255,255,${0.008 + 0.024 * (v - 0.5)})` : `rgba(0,0,0,${0.006 + 0.018 * v})`);
    streak(q, y, h, x0, len, v > 0.5 ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.025)');
    if (rnd() < 0.3) streak(r, y, h, x0, len, ROUGH(v > 0.5 ? 0.34 : 0.5, 0.25));
    if (i % 150 === 149) yield;
  }
  // a few fine scratches at odd angles
  for (let i = 0; i < 7; i++) {
    const x = rnd() * N, y = rnd() * N, ang = (rnd() - 0.5) * 1.2, len = (14 + rnd() * 40) * u;
    for (const [ctx, style] of [[a, 'rgba(255,255,255,0.05)'], [r, ROUGH(0.3, 0.3)]]) wrapped(ctx, () => {
      ctx.strokeStyle = style; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(ang) * len * 0.5, y + Math.sin(ang) * len * 0.5 + 2, x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
    });
  }
  const out = {map: tex(c), rm: tex(rm, false)};
  for (const t of Object.values(out)) {t.wrapS = t.wrapT = THREE.RepeatWrapping;}
  STEEL_TILE = {...out, hc};
}

// The tray's floor: one pressed sheet, painted whole so nothing repeats across it. The rolling streaks wander in density
// across the sheet, the tone and sheen are mottled, two stiffening beads are pressed across its open middle, the sheet
// turns up into the walls at its edges, and it carries a few fingerprints and scuffs from assembly. What stands on it
// or over it darkens it: `casters` lists them in floor mm (x across, z towards the front, origin at the floor's centre):
// {x, z, w, d, gap} a board or card held `gap` mm above the floor, {x, z, w, d, h} a block standing on it,
// {x, z, r, h} a round one, {line: [[x, z]…], gap, width} a cable or pipe over it.
// (painted in pieces, awaiting `pace` between them)
export async function floorTextures(wMM, dMM, casters = [], pace = idle) {
  const kc = SMALL ? 0.9 : 1.5, kr = kc / 2, W = wMM / 2, D = dMM / 2, rnd = rng(29);
  const layer = k => {const c = canvas(wMM * k, dMM * k), x = c.getContext('2d'); x.setTransform(k, 0, 0, k, wMM * k / 2, dMM * k / 2); return x;};
  const a = layer(kc), r = layer(kr), q = layer(kr);
  const all = (ctx, style) => {ctx.fillStyle = style; ctx.fillRect(-W, -D, wMM, dMM);};
  all(a, grey(0.88)); all(r, ROUGH(0.42)); all(q, grey(0.5));
  const blob = (ctx, x, z, rad, rgb, alpha, sy = 1) => {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rad); g.addColorStop(0, rgba(rgb, alpha)); g.addColorStop(1, rgba(rgb, 0));
    ctx.save(); ctx.translate(x, z); ctx.scale(1, sy); ctx.fillStyle = g; ctx.fillRect(-rad, -rad, rad * 2, rad * 2); ctx.restore();
  };
  // the mottle, at two scales
  for (let i = 0; i < 70; i++) {
    const x = (rnd() - 0.5) * wMM, z = (rnd() - 0.5) * dMM, rad = i < 20 ? 70 + rnd() * 120 : 12 + rnd() * 40, v = rnd() - 0.5, sy = 0.6 + rnd() * 1.4;
    blob(a, x, z, rad, v > 0 ? '255,255,255' : '0,0,0', v > 0 ? 0.07 * v : -0.06 * v, sy);
    blob(r, x, z, rad, RG(v > 0 ? 0.33 : 0.52), Math.abs(v) * 0.7, sy);
    await pace();
  }
  // the rolling streaks run along the tray. Their density drifts across it in bands, so some stretches are combed
  // with them and others nearly plain
  const ph = Array.from({length: 4}, () => rnd() * Math.PI * 2);
  const dens = x => Math.max(0.05, 0.4 + 0.28 * Math.sin(x / 41 + ph[0]) + 0.18 * Math.sin(x / 13.7 + ph[1]) + 0.12 * Math.sin(x / 5.3 + ph[2]));
  const fade = (ctx, x, z0, len, w, rgb, alpha) => {
    const g = ctx.createLinearGradient(0, z0, 0, z0 + len);
    g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(0.25, `rgba(${rgb},${alpha})`); g.addColorStop(0.75, `rgba(${rgb},${alpha})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g; ctx.fillRect(x, z0, w, len);
  };
  for (let i = 0; i < 5200; i++) {
    const x = (rnd() - 0.5) * wMM;
    if (rnd() > dens(x)) continue;
    const z0 = -D + (rnd() * 1.2 - 0.1) * dMM, len = rnd() < 0.75 ? 15 + rnd() * 90 : 120 + rnd() * 380, w = 0.12 + rnd() * 0.35, v = rnd();
    fade(a, x, z0, len, w, v > 0.5 ? '255,255,255' : '0,0,0', v > 0.5 ? 0.02 + 0.05 * (v - 0.5) : 0.015 + 0.03 * v);
    if (rnd() < 0.35) fade(r, x, z0, len, w * 2, v > 0.5 ? '255,82,255' : '255,130,255', 0.18);
    if (rnd() < 0.5) fade(q, x, z0, len, w * 2, v > 0.5 ? '255,255,255' : '0,0,0', 0.05);
    if (i % 50 === 49) await pace();
  }
  // the bend where the sheet turns up into each wall and the front flange: a bright line on the round, then the wall's
  // shadow across the floor beside it
  const edge = (x0, z0, x1, z1, nx, nz) => {
    const len = Math.hypot(x1 - x0, z1 - z0);
    for (const [ctx, stops] of [
      [a, [[0, 'rgba(255,255,255,0.10)'], [1.6, 'rgba(0,0,0,0.30)'], [3, 'rgba(0,0,0,0.20)'], [14, 'rgba(0,0,0,0)']]],
      [q, [[0, grey(0.62)], [1.6, grey(0.5)]]],
      [r, [[0, ROUGH(0.3, 0.5)], [2, ROUGH(0.42, 0)]]],
    ]) {
      const far = stops[stops.length - 1][0], g = ctx.createLinearGradient(x0, z0, x0 + nx * far, z0 + nz * far);
      for (const [d, col] of stops) g.addColorStop(d / far, col);
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(x0, z0); ctx.lineTo(x1, z1); ctx.lineTo(x1 + nx * far, z1 + nz * far); ctx.lineTo(x0 + nx * far, z0 + nz * far); ctx.closePath(); ctx.fill();
    }
    return len;
  };
  edge(-W, -D, -W, D, 1, 0); edge(W, -D, W, D, -1, 0); edge(-W, -D, W, -D, 0, 1); edge(-W, D, W, D, 0, -1);
  await pace();
  // two stiffening beads pressed across the open floor between the fans and the front cards
  for (const z of [168, 214]) {
    softShadow(q, kr, kr, ctx => {ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-150, z); ctx.lineTo(150, z); ctx.stroke();}, 2.6, 'rgba(255,255,255,0.4)');
    // (the press leaves its crown a touch smoother, and its back flank, away from the tray's light, a little darker)
    softShadow(r, kr, kr, ctx => {ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-150, z); ctx.lineTo(150, z); ctx.stroke();}, 1.5, ROUGH(0.32, 0.4));
    softShadow(a, kc, kc, ctx => {ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-150, z - 4); ctx.lineTo(150, z - 4); ctx.stroke();}, 1.2, 'rgba(0,0,0,0.06)');
    await pace();
  }
  // handling marks: fingerprints (an oily, smoother whorl and a faint smudge), scuffs, a few long light scratches
  for (let i = 0; i < 9; i++) {
    const x = (rnd() - 0.5) * (wMM - 60), z = 120 + rnd() * (D - 140), ang = rnd() * Math.PI, sx = 1, sy = 1.3 + rnd() * 0.3;
    blob(r, x, z, 9, RG(0.34), 0.35, sy); blob(a, x, z, 10, '0,0,0', 0.012, sy);
    for (const [ctx, style, lw] of [[r, ROUGH(0.3, 0.3), 0.25], [a, 'rgba(0,0,0,0.015)', 0.18]]) {
      ctx.save(); ctx.translate(x, z); ctx.rotate(ang); ctx.scale(sx, sy); ctx.strokeStyle = style; ctx.lineWidth = lw;
      for (let k = 1; k < 15; k++) {ctx.beginPath(); ctx.ellipse(0, 0, k * 0.5, k * 0.42, 0, rnd() * 0.6, Math.PI * 2 - rnd() * 0.8); ctx.stroke();}
      ctx.restore();
    }
    await pace();
  }
  for (let i = 0; i < 14; i++) {
    const x = (rnd() - 0.5) * (wMM - 30), z = (rnd() - 0.4) * dMM, ang = (rnd() - 0.5) * 0.9 + (rnd() < 0.5 ? 0 : Math.PI / 2);
    for (let k = 0; k < 6 + rnd() * 10; k++) {
      const ox = x + (rnd() - 0.5) * 12, oz = z + (rnd() - 0.5) * 12, len = 2 + rnd() * 12, aa = ang + (rnd() - 0.5) * 0.3;
      for (const [ctx, style, lw] of [[a, rgba('255,255,255', 0.05 + rnd() * 0.06), 0.15], [r, ROUGH(0.56, 0.4), 0.3]]) {
        ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(ox, oz); ctx.lineTo(ox + Math.cos(aa) * len, oz + Math.sin(aa) * len); ctx.stroke();
      }
    }
    await pace();
  }
  for (let i = 0; i < 4; i++) {
    const x = (rnd() - 0.5) * wMM * 0.8, z = (rnd() - 0.5) * dMM * 0.8, ang = rnd() * Math.PI, len = 60 + rnd() * 120, bend = (rnd() - 0.5) * 18;
    for (const [ctx, style, lw] of [[a, 'rgba(255,255,255,0.07)', 0.12], [r, ROUGH(0.3, 0.4), 0.3]]) {
      ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(x, z);
      ctx.quadraticCurveTo(x + Math.cos(ang) * len / 2 - Math.sin(ang) * bend, z + Math.sin(ang) * len / 2 + Math.cos(ang) * bend, x + Math.cos(ang) * len, z + Math.sin(ang) * len); ctx.stroke();
    }
  }
  // the shadows of what stands on or over the floor (the tray light's shadow map leaves the floor bare under them)
  const shadow = (draw, sigma, alpha, dx = 0, dz = 0) => softShadow(a, kc, kc, draw, sigma, `rgba(0,0,0,${alpha})`, dx, dz);
  const rect = (o, g = 0) => ctx => {ctx.beginPath(); ctx.rect(o.x - o.w / 2 - g, o.z - o.d / 2 - g, o.w + 2 * g, o.d + 2 * g); ctx.fill();};
  for (const o of casters) {
    if (o.line) {
      const draw = ctx => {ctx.lineWidth = o.width; ctx.lineCap = ctx.lineJoin = 'round'; ctx.beginPath(); o.line.forEach(([x, z], i) => (i ? ctx.lineTo(x, z) : ctx.moveTo(x, z))); ctx.stroke();};
      shadow(draw, 0.6 + 0.45 * o.gap, Math.max(0.12, 0.42 - 0.018 * o.gap), -0.1 * o.gap, -0.2 * o.gap);
    } else if (o.gap !== undefined) {
      // a board on standoffs: dark under it, falling off a little beyond its edge
      shadow(rect(o), 0.55 * o.gap, 0.5, -0.12 * o.gap, -0.24 * o.gap);
      shadow(rect(o, -0.3 * o.gap), 0.3 * o.gap, 0.35);
    } else if (o.r !== undefined) {
      const disc = g => ctx => {ctx.beginPath(); ctx.arc(o.x, o.z, o.r + g, 0, Math.PI * 2); ctx.fill();};
      shadow(disc(0.05), 0.25, 0.6); shadow(disc(0.2 * o.h), 0.3 + 0.35 * o.h, 0.3, -0.1 * o.h, -0.2 * o.h);
    } else {
      const t = Math.min(o.h, 14);
      shadow(rect(o, 0.05), 0.3, 0.6); shadow(rect(o, 0.05 * t), 0.4 + 0.3 * t, Math.min(0.4, 0.15 + 0.03 * t), -0.1 * t, -0.2 * t);
    }
    await pace();
  }
  const map = tex(a.canvas), rm = tex(r.canvas, false);
  for (const t of [map, rm]) {t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;}
  await pace.now?.();
  return {map, rm, normal: bakeNormal(q.canvas, 2.4)};
}

// the lid: the steel tile laid over it, with three pressed stiffening ribs, a row of vent louvres at the back and
// screw dimples along the front (drawn with canvas fills, so it costs a few milliseconds)
export function lidTextures(wMM, dMM) {
  const s = SMALL ? 1.0 : 1.4, w = Math.round(wMM * s), h = Math.round(dMM * s), Z = steelTile();
  const c = canvas(w, h), rm = canvas(w, h), hc = canvas(w, h), a = c.getContext('2d'), r = rm.getContext('2d'), q = hc.getContext('2d');
  // the tile repeats every 120 mm, turned so its rolling streaks run along the lid
  for (const [ctx, img] of [[a, Z.map.image], [r, Z.rm.image]]) {
    const pat = ctx.createPattern(img, 'repeat'), k = 120 * s / img.width;
    pat.setTransform(new DOMMatrix([0, k, k, 0, 0, 0]));
    ctx.fillStyle = pat; ctx.fillRect(0, 0, w, h);
  }
  q.fillStyle = grey(0.5); q.fillRect(0, 0, w, h);
  const X = x => (x + wMM / 2) * s, ribW = 16;
  for (const rx of [-120, 0, 120]) {
    const g = q.createLinearGradient(X(rx - ribW / 2), 0, X(rx + ribW / 2), 0);
    g.addColorStop(0, grey(0.5)); g.addColorStop(0.5, grey(0.68)); g.addColorStop(1, grey(0.5));
    q.fillStyle = g; q.beginPath(); q.roundRect(X(rx - ribW / 2), 70 * s, ribW * s, (dMM - 160) * s, ribW * s / 2); q.fill();
    a.fillStyle = 'rgba(255,255,255,0.05)'; a.beginPath(); a.roundRect(X(rx - ribW / 4), 72 * s, ribW * s / 2, (dMM - 164) * s, ribW * s / 4); a.fill();
  }
  for (let k = 0; k < 14; k++) {
    const lx = X(-182 + k * 28), g = q.createLinearGradient(0, 22 * s, 0, 34 * s);
    g.addColorStop(0, grey(0.5)); g.addColorStop(0.55, grey(0.72)); g.addColorStop(0.85, grey(0.6)); g.addColorStop(0.86, grey(0.25)); g.addColorStop(1, grey(0.4));
    q.fillStyle = g; q.fillRect(lx - 9 * s, 22 * s, 18 * s, 12 * s);
    a.fillStyle = '#1b1c1e'; a.fillRect(lx - 9 * s, 32.2 * s, 18 * s, 1.8 * s);
  }
  for (const sx of [-180, -60, 60, 180]) {
    const cx = X(sx), cy = (dMM - 12) * s, g = q.createRadialGradient(cx, cy, 0, cx, cy, 4.5 * s);
    g.addColorStop(0, grey(0.36)); g.addColorStop(1, grey(0.5));
    q.fillStyle = g; q.beginPath(); q.arc(cx, cy, 4.5 * s, 0, Math.PI * 2); q.fill();
  }
  return {map: tex(c), rm: tex(rm, false), normal: bakeNormal(hc, 4)};
}

// ---------------------------------------------------------------------------------------------------------------
// the die as it is seen in the package: its back. A flip-chip die is mounted face down, so the top is plain polished
// silicon, dark, with a faint grain from the back-grinding and a soft sheen; its floor plan appears only as the drawing
let DIE_TEX = null;
export function dieTexture() {
  if (DIE_TEX) return DIE_TEX;
  const W = 512, H = 640, c = canvas(W, H), a = c.getContext('2d'), rnd = rng(43);
  a.fillStyle = '#1b1d23'; a.fillRect(0, 0, W, H);
  // the grinding marks: faint arcs from a wheel far off to one side
  a.lineWidth = 1;
  for (let i = 0; i < 140; i++) {
    const r = 900 + i * 9 + rnd() * 6;
    a.strokeStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${0.012 + rnd() * 0.018})`;
    a.beginPath(); a.arc(-700, H * 1.6, r, -Math.PI / 2.6, -Math.PI / 5); a.stroke();
  }
  const g = a.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, 'rgba(140,142,148,.07)'); g.addColorStop(0.55, 'rgba(255,255,255,.02)'); g.addColorStop(1, 'rgba(110,112,118,.06)');
  a.fillStyle = g; a.fillRect(0, 0, W, H);
  // the side facing the tray's key light (the front: the canvas's foot) a touch lighter, the far side a touch darker,
  // as a ground wafer catches a light low across it
  const k = a.createLinearGradient(0, 0, 0, H);
  k.addColorStop(0, 'rgba(0,0,0,0.10)'); k.addColorStop(0.45, 'rgba(0,0,0,0)'); k.addColorStop(1, 'rgba(178,184,196,0.09)');
  a.fillStyle = k; a.fillRect(0, 0, W, H);
  // the outermost pixel all round is the die's edge chamfer, polished and paler (detail.js maps the chamfer to it and
  // darkens the edges that face away from the light, so only those facing it show)
  a.strokeStyle = '#5a5f6b'; a.lineWidth = 3; a.strokeRect(0, 0, W, H);
  DIE_TEX = tex(c);
  DIE_TEX.generateMipmaps = true; DIE_TEX.minFilter = THREE.LinearMipmapLinearFilter;
  return DIE_TEX;
}
// the die's finish (a roughness map, read in green): the grinding wheel's arcs leave it a little smoother and a little
// rougher by turns, so what it reflects is streaked along them rather than an even grey; on average it is the same
// ground finish as before (0.34), so the drawing over it gets no more glare
let DIE_RM = null;
export function dieRoughness() {
  if (DIE_RM) return DIE_RM;
  const W = 256, H = 320, c = canvas(W, H), a = c.getContext('2d'), rnd = rng(47), s = W / 512;
  a.fillStyle = ROUGH(0.34); a.fillRect(0, 0, W, H);
  a.lineWidth = 2.2 * s;
  for (let i = 0; i < 70; i++) {
    const r = (900 + i * 18 + rnd() * 10) * s;
    a.strokeStyle = ROUGH(i % 2 ? 0.29 : 0.39, 0.55 + rnd() * 0.3);
    a.beginPath(); a.arc(-700 * s, H * 1.6, r, -Math.PI / 2.6, -Math.PI / 5); a.stroke();
  }
  // (and the edge chamfer polished)
  a.strokeStyle = ROUGH(0.18); a.lineWidth = 1.5; a.strokeRect(0, 0, W, H);
  DIE_RM = tex(c, false);
  DIE_RM.generateMipmaps = true; DIE_RM.minFilter = THREE.LinearMipmapLinearFilter;
  return DIE_RM;
}

// ---------------------------------------------------------------------------------------------------------------
// geometry: every part becomes a non-indexed geometry with a uv into the atlas (or the steel tile) and a vertex colour,
// so the parts of one finish merge into one mesh

// a box with its edges rounded at r. seg 0: each edge one flat chamfer (44 faces) whose normals turn from one face to the
// next across it, so it catches light like a round, not as a facet; seg ≥ 1: a true round of seg facets either side of
// each edge's 45° line, with smooth normals (for the parts the camera comes close to). The flat faces stay flat
export function cbox(w, h, d, r = 0, seg = 0) {
  if (!(r > 0)) return new THREE.BoxGeometry(w, h, d);
  const E = [w / 2, h / 2, d / 2];
  r = Math.min(r, E[0] * 0.98, E[1] * 0.98, E[2] * 0.98);
  const I = E.map(e => e - r), pos = [], nor = [];
  const va = new THREE.Vector3(), vb = new THREE.Vector3(), vc = new THREE.Vector3(), n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  // a triangle of [position, normal] corners, wound to face out (the shape is convex round the origin, so an outward
  // face has the origin behind it)
  const tri = (A, B, C) => {
    va.fromArray(A[0]); vb.fromArray(B[0]); vc.fromArray(C[0]);
    n.crossVectors(e1.subVectors(vb, va), e2.subVectors(vc, va));
    if (n.lengthSq() < 1e-20) return;
    for (const [p, q] of n.dot(e1.copy(va).add(vb).add(vc)) > 0 ? [A, B, C] : [A, C, B]) {pos.push(p[0], p[1], p[2]); nor.push(q[0], q[1], q[2]);}
  };
  if (seg > 0) {
    // each face is a grid over its two other axes: the flat middle, then the round's facets out to the 45° lines
    // (where the next face's grid takes over), spaced evenly in angle
    const t = Array.from({length: seg}, (_, k) => Math.tan((k + 1) / seg * Math.PI / 4));
    const S = [...t.slice().reverse().map(v => [-1, -v]), [-1, 0], [1, 0], ...t.map(v => [1, v])];
    for (let ax = 0; ax < 3; ax++) for (const s of [-1, 1]) {
      const b = (ax + 1) % 3, c = (ax + 2) % 3;
      const G = S.map(([ib, tb]) => S.map(([ic, tc]) => {
        const q = [0, 0, 0], p = [0, 0, 0];
        q[ax] = s; q[b] = tb; q[c] = tc;
        const l = Math.hypot(q[0], q[1], q[2]);
        p[ax] = s * I[ax]; p[b] = ib * I[b]; p[c] = ic * I[c];
        for (let i = 0; i < 3; i++) {q[i] /= l; p[i] += r * q[i];}
        return [p, q];
      }));
      for (let i = 0; i < S.length - 1; i++) for (let j = 0; j < S.length - 1; j++) {tri(G[i][j], G[i + 1][j], G[i + 1][j + 1]); tri(G[i][j], G[i + 1][j + 1], G[i][j + 1]);}
    }
  } else {
    // the vertex of corner (sx, sy, sz) that lies on the face across axis ax, with that face's normal
    const P = (sx, sy, sz, ax) => {const sg = [sx, sy, sz], q = [0, 0, 0]; q[ax] = sg[ax]; return [sg.map((v, i) => v * (i === ax ? E[i] : I[i])), q];};
    const quad = (a, b, c, e) => {tri(a, b, c); tri(a, c, e);}, S = [-1, 1];
    for (const s of S) {
      quad(P(s, -1, -1, 0), P(s, 1, -1, 0), P(s, 1, 1, 0), P(s, -1, 1, 0));
      quad(P(-1, s, -1, 1), P(1, s, -1, 1), P(1, s, 1, 1), P(-1, s, 1, 1));
      quad(P(-1, -1, s, 2), P(1, -1, s, 2), P(1, 1, s, 2), P(-1, 1, s, 2));
    }
    for (const a of S) for (const b of S) {
      quad(P(a, b, -1, 0), P(a, b, 1, 0), P(a, b, 1, 1), P(a, b, -1, 1));
      quad(P(a, -1, b, 0), P(a, 1, b, 0), P(a, 1, b, 2), P(a, -1, b, 2));
      quad(P(-1, a, b, 1), P(1, a, b, 1), P(1, a, b, 2), P(-1, a, b, 2));
    }
    for (const sx of S) for (const sy of S) for (const sz of S) tri(P(sx, sy, sz, 0), P(sx, sy, sz, 1), P(sx, sy, sz, 2));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  return g;
}
// a wedge of solder (mm): a right-angled profile `run` long and `rise` high, `width` across (along z), its slope facing +x
// and its upright face at x = 0
export function wedge(run, rise, width) {
  const z = width / 2, A = [0, 0, -z], B = [run, 0, -z], C = [0, rise, -z], A2 = [0, 0, z], B2 = [run, 0, z], C2 = [0, rise, z];
  // only the slope and the two ends: the upright face is against the part, the bottom on the board
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...C, ...C2, ...B2, ...C, ...B2, ...B, ...A, ...C, ...B, ...A2, ...B2, ...C2], 3));
  g.computeVertexNormals();
  return g;
}
// a triangle's own normal, from its corners (a test on the vertex normals would split a smoothly shaded round)
const _fa = new THREE.Vector3(), _fb = new THREE.Vector3(), _fc = new THREE.Vector3(), _fn = new THREE.Vector3();
function faceNormal(p, i, out = _fn) {
  _fa.fromBufferAttribute(p, i); _fb.fromBufferAttribute(p, i + 1); _fc.fromBufferAttribute(p, i + 2);
  return out.crossVectors(_fb.sub(_fa), _fc.sub(_fa)).normalize();
}
// faces looking straight down are never seen from the camera's side of the tray
export function dropBottoms(g) {
  const p = g.attributes.position, n = g.attributes.normal, keep = [];
  for (let i = 0; i < n.count; i += 3) if (faceNormal(p, i).y > -0.985) keep.push(i);
  if (keep.length * 3 === n.count) return g;
  for (const name of Object.keys(g.attributes)) {
    const a = g.attributes[name], k = a.itemSize, src = a.array, dst = new src.constructor(keep.length * 3 * k);
    keep.forEach((i, t) => dst.set(src.subarray(i * k, (i + 3) * k), t * 3 * k));
    g.setAttribute(name, new THREE.BufferAttribute(dst, k));
  }
  return g;
}
export function prep(geo) {
  const g = geo.index ? geo.toNonIndexed() : geo, n = g.attributes.position.count;
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
  if (!g.attributes.normal) g.computeVertexNormals();
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  if (!g.attributes.color) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  return g;
}
const _c = new THREE.Color();
const regionUV = (name, u, v) => {const [rx, ry, rw, rh] = R[name]; return [(rx + 1.5 + u * (rw - 3)) / A0, 1 - (ry + 1.5 + v * (rh - 3)) / A0];};
// the faces looking up (+y) take `top` (a region or a patch), the rest `side`; colours likewise. flipU mirrors the top
export function skin(geo, {top = 'satin', side, color = '#ffffff', topColor, sideColor, flipU = false} = {}) {
  const g = prep(geo), p = g.attributes.position, uv = g.attributes.uv, col = g.attributes.color;
  g.computeBoundingBox();
  const bb = g.boundingBox, ct = new THREE.Color(topColor ?? (R[top] ? '#ffffff' : color)), cs = new THREE.Color(sideColor ?? color);
  const sidePatch = side || (R[top] ? 'satin' : top);
  for (let i = 0; i < p.count; i += 3) {
    // (a face within 45° of up: a chamfer along a top edge goes with the top, a round's facets split at its 45° line)
    const up = faceNormal(p, i).y > 0.7;
    for (let j = i; j < i + 3; j++) {
      let u, v;
      if (up && R[top]) {
        let fu = (p.getX(j) - bb.min.x) / (bb.max.x - bb.min.x || 1); if (flipU) fu = 1 - fu;
        [u, v] = regionUV(top, fu, (p.getZ(j) - bb.min.z) / (bb.max.z - bb.min.z || 1));
      } else [u, v] = patchUV(up ? top : sidePatch);
      uv.setXY(j, u, v);
      const c = up ? ct : cs; col.setXYZ(j, c.r, c.g, c.b);
    }
  }
  return g;
}
// one colour and one patch for every face
export const solid = (geo, patch, color) => skin(geo, {top: patch, side: patch, color});
// a restrained highlight along a part's upper rounded edges: the round's upward facets (not its flat top, not its sides)
// take a lighter colour and a smoother finish, so the edge catches the light where it turns towards it
// With `dark`, the highlight follows the light: an edge turned towards the tray's key light (from the front right) gets
// the full `color`, one turned away fades to `dark` (the body's own tone), so it is never an outline drawn all round
export const KEY = new THREE.Vector2(0.6, 1.2).normalize();
export const facingKey = n => {const l = Math.hypot(n.x, n.z); return l < 1e-3 ? 1 : Math.max(0, (n.x * KEY.x + n.z * KEY.y) / l);};
const _d = new THREE.Color();
export function rim(geo, color, patch = 'satin', dark = null) {
  const g = prep(geo), p = g.attributes.position, uv = g.attributes.uv, col = g.attributes.color, [u, v] = patchUV(patch);
  _c.set(color); if (dark) _d.set(dark);
  for (let i = 0; i < p.count; i += 3) {
    const n = faceNormal(p, i);
    if (!(n.y > 0.25 && n.y < 0.995)) continue;
    const f = dark ? Math.pow(facingKey(n), 1.5) : 1, r = dark ? _d.r + (_c.r - _d.r) * f : _c.r, gg = dark ? _d.g + (_c.g - _d.g) * f : _c.g, b = dark ? _d.b + (_c.b - _d.b) * f : _c.b;
    for (let j = i; j < i + 3; j++) {uv.setXY(j, u, v); col.setXYZ(j, r, gg, b);}
  }
  return g;
}
// per-face colouring and finish by a test on each triangle's centre and normal
export function paint(geo, fn) {
  const g = prep(geo), p = g.attributes.position, uv = g.attributes.uv, col = g.attributes.color, c = new THREE.Vector3(), nn = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    c.set((p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3, (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3);
    faceNormal(p, i, nn);
    const [patch, color] = fn(c, nn), [u, v] = patchUV(patch);
    _c.set(color);
    for (let j = i; j < i + 3; j++) {uv.setXY(j, u, v); col.setXYZ(j, _c.r, _c.g, _c.b);}
  }
  return g;
}
// plain colour for the steel-textured material (its uv comes later, from where the part ends up)
export function tint(geo, color) {
  const g = prep(geo), col = g.attributes.color; _c.set(color);
  for (let i = 0; i < col.count; i++) col.setXYZ(i, _c.r, _c.g, _c.b);
  return g;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
// place a part: scale s (0.001 for parts drawn in mm), rotate, move to (x, y, z) in metres
export function put(g, x, y, z, {rx = 0, ry = 0, rz = 0, s = 1} = {}) {
  _e.set(rx, ry, rz); _q.setFromEuler(_e); _m.compose(_p.set(x, y, z), _q, _s.set(s, s, s));
  return g.applyMatrix4(_m);
}
// box-projected uvs for a tiling texture, from where the part is (tile = metres per repeat)
// (ou, ov shift the tile, so neighbouring panels don't show the same streaks lined up)
export function boxUV(g, tile, ou = 0, ov = 0) {
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i += 3) {
    const f = faceNormal(p, i), nx = Math.abs(f.x), ny = Math.abs(f.y), nz = Math.abs(f.z);
    for (let j = i; j < i + 3; j++) {
      const x = p.getX(j) / tile, y = p.getY(j) / tile, z = p.getZ(j) / tile;
      if (ny >= nx && ny >= nz) uv.setXY(j, z + ou, x + ov); else if (nx >= nz) uv.setXY(j, z + ou, y + ov); else uv.setXY(j, x + ou, y + ov);
    }
  }
  return g;
}
// reverse a non-indexed geometry's faces (for the inside of an open tube)
export function flipFaces(g) {
  for (const name of ['position', 'normal', 'uv', 'color']) {
    const a = g.attributes[name], k = a.itemSize, arr = a.array;
    for (let i = 0; i < a.count; i += 3) for (let c = 0; c < k; c++) {const t = arr[(i + 1) * k + c]; arr[(i + 1) * k + c] = arr[(i + 2) * k + c]; arr[(i + 2) * k + c] = t;}
  }
  const n = g.attributes.normal.array; for (let i = 0; i < n.length; i++) n[i] = -n[i];
  return g;
}
export const merge = list => mergeGeometries(list.map(prep), false);

// collects parts by finish and merges each finish into one mesh
export class Kit {
  constructor({bottoms = false} = {}) {this.lists = {}; this.bottoms = bottoms;}
  add(key, g) {const p = prep(g); (this.lists[key] ||= []).push(this.bottoms ? p : dropBottoms(p)); return g;}
  mesh(key, material, {shadow = true, tile = 0} = {}) {
    const list = this.lists[key];
    if (!list || !list.length) return null;
    // (each part takes the tile from its own place in it)
    if (tile) list.forEach((g, i) => boxUV(g, tile, (i * 0.618034) % 1, (i * 0.381966 + 0.27) % 1));
    const geo = mergeGeometries(list, false);
    geo.computeBoundingSphere();
    const m = new THREE.Mesh(geo, material);
    m.castShadow = m.receiveShadow = shadow;
    return m;
  }
  // the same, merged a batch at a time, awaiting `pace` between batches (the board's mesh is over a million vertices)
  async meshAsync(key, material, {shadow = true, tile = 0} = {}, pace = idle) {
    const list = this.lists[key];
    if (!list || !list.length) return null;
    if (tile) for (const [i, g] of list.entries()) {boxUV(g, tile, (i * 0.618034) % 1, (i * 0.381966 + 0.27) % 1); if (i % 32 === 31) await pace();}
    // (compact: the atlas's uvs all lie within it; a tiling texture's don't)
    const m = new THREE.Mesh(await mergeAsync(list, pace, {compact: true, uv01: !tile}), material);
    m.castShadow = m.receiveShadow = shadow;
    return m;
  }
}
// merges non-indexed geometries with the same attributes (as prep leaves them), copying a batch at a time and awaiting
// `pace` between; the bounds are gathered as it goes. `compact` stores normals and colours (and uvs, if `uv01`: all
// within 0–1) as 16-bit normalised integers rather than floats, so the merged mesh is little over half the size to
// hold and to upload (positions stay floats)
const COMPACT = {normal: [Int16Array, 32767, -1], color: [Uint16Array, 65535, 0], uv: [Uint16Array, 65535, 0]};
export async function mergeAsync(list, pace = idle, {compact = false, uv01 = false} = {}) {
  const names = Object.keys(list[0].attributes), size = names.map(n => list[0].attributes[n].itemSize);
  const as = names.map(n => (compact && COMPACT[n] && (n !== 'uv' || uv01) ? COMPACT[n] : null));
  let count = 0;
  for (const g of list) count += g.attributes.position.count;
  const arrays = size.map((k, i) => new (as[i] ? as[i][0] : Float32Array)(count * k)), lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  let off = 0, batch = 0;
  for (const g of list) {
    const c = g.attributes.position.count, p = g.attributes.position.array;
    names.forEach((n, k) => {
      const src = g.attributes[n].array, len = c * size[k], o = off * size[k], dst = arrays[k];
      if (!as[k]) {dst.set(src.subarray(0, len), o); return;}
      const scale = as[k][1], min = as[k][2];
      for (let i = 0; i < len; i++) {const v = src[i]; dst[o + i] = Math.round((v < min ? min : v > 1 ? 1 : v) * scale);}
    });
    for (let i = 0; i < c * 3; i += 3) for (let a = 0; a < 3; a++) {const v = p[i + a]; if (v < lo[a]) lo[a] = v; if (v > hi[a]) hi[a] = v;}
    off += c; batch += c;
    if (batch > 12000) {batch = 0; await pace();}
  }
  const geo = new THREE.BufferGeometry();
  names.forEach((n, k) => geo.setAttribute(n, new THREE.BufferAttribute(arrays[k], size[k], !!as[k])));
  geo.boundingBox = new THREE.Box3(new THREE.Vector3(...lo), new THREE.Vector3(...hi));
  geo.boundingSphere = geo.boundingBox.getBoundingSphere(new THREE.Sphere());
  return geo;
}

// a 36 mm square, 56 mm deep fan (the tray's fans are 40 × 40 × 56; the model's tray is 3 mm shy of 1U), drawn in mm
// with its axis along z and the intake face at +z
export function fanGeometry() {
  const parts = [], frame = '#1c1d20', dark = '#121315';
  const flange = () => {
    const s = new THREE.Shape(), r = 2.4, a = -18, b = 18;
    s.moveTo(a + r, a); s.lineTo(b - r, a); s.quadraticCurveTo(b, a, b, a + r); s.lineTo(b, b - r); s.quadraticCurveTo(b, b, b - r, b); s.lineTo(a + r, b); s.quadraticCurveTo(a, b, a, b - r); s.lineTo(a, a + r); s.quadraticCurveTo(a, a, a + r, a);
    const h = new THREE.Path(); h.absarc(0, 0, 17.0, 0, Math.PI * 2, true); s.holes.push(h);
    return new THREE.ExtrudeGeometry(s, {depth: 3.6, bevelEnabled: false, curveSegments: 6});
  };
  parts.push(solid(flange().translate(0, 0, 28 - 3.6), 'satin', frame));
  parts.push(solid(flange().translate(0, 0, -28), 'satin', frame));
  parts.push(solid(new THREE.CylinderGeometry(17.6, 17.6, 50, 24, 1, true).rotateX(Math.PI / 2), 'satin', frame));
  parts.push(flipFaces(solid(new THREE.CylinderGeometry(17.0, 17.0, 50, 24, 1, true).rotateX(Math.PI / 2), 'matte', dark)));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) parts.push(solid(new THREE.BoxGeometry(3, 3, 50).translate(sx * 16.4, sy * 16.4, 0), 'satin', frame));
  // the rotor: hub, a plain label, seven swept blades
  parts.push(solid(new THREE.CylinderGeometry(7.4, 7.4, 11, 20, 1, true).rotateX(Math.PI / 2).translate(0, 0, 20.5), 'satin', '#1a1b1e'));
  parts.push(solid(new THREE.CircleGeometry(7.4, 20).translate(0, 0, 26.0), 'satin', '#1a1b1e'));
  parts.push(solid(new THREE.CircleGeometry(5.6, 20).translate(0, 0, 26.06), 'matte', '#4f5157'));
  const blade = bladeGeometry();
  for (let k = 0; k < 7; k++) parts.push(solid(blade.clone().rotateZ(k * Math.PI * 2 / 7), 'satin', '#18191b'));
  // the rear stage's struts, seen through the blades
  for (let k = 0; k < 4; k++) parts.push(solid(new THREE.BoxGeometry(1.4, 11, 2).translate(0, 12.2, -24).rotateZ(k * Math.PI / 2 + 0.3), 'satin', frame));
  parts.push(solid(new THREE.CircleGeometry(7, 16).translate(0, 0, -22), 'satin', frame));
  return merge(parts);
}
function bladeGeometry() {
  const Rn = 3, Cn = 4, pos = [], idx = [];
  const at = (t, s, back) => {
    const r = 7.6 + (16.7 - 7.6) * t, th = (s - 0.5) * 0.95 * (0.75 + 0.45 * t) + 0.5 * t;
    const z = 25.6 - s * 6.2 * (1 - 0.25 * t) + Math.sin(s * Math.PI) * 0.7 - (back ? 0.55 : 0);
    return [r * Math.cos(th), r * Math.sin(th), z];
  };
  for (const back of [0, 1]) for (let i = 0; i <= Rn; i++) for (let j = 0; j <= Cn; j++) pos.push(...at(i / Rn, j / Cn, back));
  const V = (b, i, j) => b * (Rn + 1) * (Cn + 1) + i * (Cn + 1) + j;
  for (let i = 0; i < Rn; i++) for (let j = 0; j < Cn; j++) {
    const a = V(0, i, j), b = V(0, i + 1, j), c = V(0, i + 1, j + 1), d = V(0, i, j + 1);
    idx.push(a, b, c, a, c, d);
    const a2 = V(1, i, j), b2 = V(1, i + 1, j), c2 = V(1, i + 1, j + 1), d2 = V(1, i, j + 1);
    idx.push(a2, c2, b2, a2, d2, c2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// a hose or cable along points (metres), and short sleeves (tags, clamps) on it
export function tube(points, r, seg = 40, radial = 12) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal');
  return {curve, geo: new THREE.TubeGeometry(curve, seg, r, radial, false)};
}
const _Y = new THREE.Vector3(0, 1, 0);
export function sleeve(curve, t, len, r, radial = 16) {
  const p = curve.getPointAt(t), tg = curve.getTangentAt(t), q = new THREE.Quaternion().setFromUnitVectors(_Y, tg);
  return new THREE.CylinderGeometry(r, r, len, radial, 1, false).applyQuaternion(q).translate(p.x, p.y, p.z);
}
// a pan-head screw (mm): plated head with a dark cross
export function screwGeometry(r = 2.7, h = 1.5) {
  return merge([
    solid(new THREE.CylinderGeometry(r * 0.88, r, h, 18).translate(0, h / 2, 0), 'metal', '#c3c7cc'),
    solid(new THREE.BoxGeometry(r * 1.05, 0.08, 0.42).translate(0, h + 0.02, 0), 'matte', '#1b1b1c'),
    solid(new THREE.BoxGeometry(0.42, 0.08, r * 1.05).translate(0, h + 0.02, 0), 'matte', '#1b1b1c'),
  ]);
}
// an elbow fitting on a cold plate (mm): hex base, a riser, an elbow and a barb pointing +z
export function fittingGeometry() {
  return merge([
    solid(new THREE.CylinderGeometry(4.6, 4.6, 2.4, 6).translate(0, 1.2, 0), 'metal', '#c9ccd0'),
    solid(new THREE.CylinderGeometry(3.4, 3.4, 3.2, 14, 1, true).translate(0, 4.0, 0), 'polish', '#c9ccd0'),
    solid(new THREE.SphereGeometry(3.6, 14, 7).translate(0, 5.6, 0), 'polish', '#c9ccd0'),
    solid(new THREE.CylinderGeometry(3.1, 3.1, 6, 14, 1, true).rotateX(Math.PI / 2).translate(0, 5.6, 3.2), 'polish', '#c9ccd0'),
    solid(new THREE.CylinderGeometry(2.5, 3.8, 2.4, 14).rotateX(Math.PI / 2).translate(0, 5.6, 6.6), 'polish', '#c9ccd0'),
  ]);
}
