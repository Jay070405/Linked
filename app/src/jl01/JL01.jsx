// JL-01, the home page: one machine and the things you do with it. The page's scroll is the only clock.
// wake it (the name) -> open it up (about) -> turn it over (the changelog on its back: where he has worked) -> play it (goal, rules, feedback)
// -> read the score (his numbers, as tall as the room) -> feed it a cartridge (selected work) -> let it print (let's work)
// Every act is its own shot: a different lens, a different room, a different place for the camera. What carries you from one
// to the next is always a thing: the machine coming apart, a cartridge passing the lens, the screen you fall into, the dots.
// Jay, the pixel bird, is in every one of them (jay.jsx) and does the talking: what to do next hangs over his head, not in a caption.
// The two cartridges set the page differently, not only repaint it, and the receipt at the end hands the visit back: what was played, what was opened, how long it took.
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {Canvas, useFrame, useThree} from '@react-three/fiber';
import {RoundedBox, Environment, Lightformer, ContactShadows, MeshReflectorMaterial, Html} from '@react-three/drei';
import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {createScreen, drawJay} from './screen';
import {createWipe} from './wipe';
import {sfx} from './sfx';
import {createRunner} from './game';
import {createGovernor} from './governor';
import VoxelJay from './jay';
import {COPY, pick as pickLang} from './copy';
import {useMusic} from '../components/BackgroundMusic';
import {SIDES} from '../product/about-content.js';
import {author} from '../portfolioData';
import './jl01.css';

const W = 3.4, H = 2.2, D = .5, PZ = D / 2, FZ = PZ + .03; // PZ: the body's front; FZ: the face of the glass, where the controls sit
const SCR = {x: -.62, y: .07, w: 1.74, h: 1.16}, KNOB = {x: 1.02, y: .47}, TOG = {x: .6, y: -.25}, KEYX = [.5, .82, 1.14, 1.46], KEYY = -.78;
const MONO = 'ui-monospace,"SF Mono","JetBrains Mono",Menlo,monospace';
const damp = THREE.MathUtils.damp, HALF = Math.PI / 2;
const post = {bloom: null}; // the bloom pass, so the stage can turn the glow down when the room is bright
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const pad = n => String(n).padStart(2, '0');
const lum = c => { const n = parseInt(c.slice(1), 16); return (.299 * (n >> 16) + .587 * (n >> 8 & 255) + .114 * (n & 255)) / 255; };

// how far each layer travels when the machine comes apart, and where it rests when it is whole
const LAYER = {face: [0, 2.3], lcd: [0, 1.36], pad: [-.05, .54], pcb: [-.1, -.22], cell: [-.08, -1.1], shell: [0, -1.78]}; // at rest everything is inside the shell: the back is seen too
// about: the machine's five parts are the five things Jay is made of. [layer, label, what, where the label is pinned]
const PARTS = [['face', 'VISUAL', 'ArtCenter 插画', [-1.45, 1.05, FZ]], ['lcd', 'SYSTEMS', '目标 · 规则 · 反馈', [-1.6, .8, PZ]], ['pad', 'PRODUCT', '5 个可试用的原型', [-1.35, .95, 0]],
  ['pcb', 'CODE', 'Claude Code · Codex', [-1.3, .9, 0]], ['cell', 'BUSINESS', 'Duke Fuqua · 商科', [-1.2, .56, 0]]];

// where each act sits on the scroll, counted in screen heights. about: YA..YAE. the changelog on the machine's back: its first entry at YC,
// one entry every STEPC. play: YP..YPE. the numbers: the first at YS, one every STEPS. the first work sits at YW, one work every STEP
const YA = 1, YAE = 2.5, YC = 3.1, STEPC = .28, NC = 7, YCE = YC + (NC - 1) * STEPC + .12, YP = YCE + .6, YPE = YP + 1.1;
const YS = YPE + .6, STEPS = .42, NS = 4, YSE = YS + (NS - 1) * STEPS + .1, YW = YSE + .9, STEP = .6;
const SEC = {hero: 0, about: 1, log: 2, play: 3, score: 4, work: 5, end: 6}; // the acts, in order
// One shot per act. x/ry: the machine. d: how far the camera stands (measured as if through the 26 degree lens, so a longer lens
// pulls it back and the machine keeps its size while the perspective flattens). el: how high it looks from. fov: the lens. lx/ly: where it looks.
//   hero   a product photograph: long lens, eye level
//   about  a technical drawing: almost no perspective, seen from above, the parts pulled apart
//   log    the machine turned round: its back, where the label is
//   play   straight on and close: the screen is what you look at
//   score  very far back and dead centre: the one shot where the machine is the small thing, under numbers as tall as the room
//   work   a wide lens down low and close: the cartridges pass right over the camera
//   print  the first shot again, in another light: a wall of dots on one side, the machine printing on the other
const POSE = {
  hero: {x: 1.5, ry: -.4, d: 12.6, el: .04, fov: 26, lx: .4, ly: .55},
  about: {x: 2.5, ry: -.8, d: 15.5, el: .5, fov: 8, lx: .35, ly: 0},
  log: {x: 1.95, ry: -2.74, d: 9.6, el: .08, fov: 22, lx: .45, ly: .62},
  play: {x: 1.75, ry: -.14, d: 8.8, el: .03, fov: 30, lx: .4, ly: .34},
  score: {x: 0, ry: 0, d: 24, el: .05, fov: 30, lx: 0, ly: 2.35},
  work: {x: 1.4, ry: -.14, d: 8.1, el: -.1, fov: 40, lx: .3, ly: 1.1},
  print: {x: 2, ry: -.22, d: 13.2, el: .02, fov: 26, lx: .4, ly: 1.15},
};
// The game cartridge does not only repaint these shots, it sets them up differently: taken apart, the machine stands on the other side
// and keeps its perspective; it is played from the other side too; the works lie on the floor and are looked down on; the last shot is mirrored.
const GAME = {about: {x: -2.55, ry: .72, d: 13.8, el: .34, fov: 20, lx: -.2, ly: .05}, log: {x: -1.95, ry: 2.74, lx: -.45}, play: {x: -1.75, ry: .14, lx: -.4}, work: {x: 0, ry: 0, d: 12.5, el: .6, fov: 34, lx: 0, ly: -1.36}, print: {x: -2, ry: .22, lx: -.4}};
// the same shots on a tall screen: the machine in the middle, the words above or below it
const TALL = {hero: {x: 0, lx: 0, d: 18.5, ly: 1.6}, about: {x: 0, lx: 0, d: 28, ly: -3, ry: -.62}, log: {x: 0, lx: 0, ry: -Math.PI, d: 14.5, ly: -1.5}, play: {x: 0, lx: 0, ry: 0, d: 14, ly: -1.35}, score: {d: 19, ly: .55}, work: {x: 0, lx: 0, d: 20, ly: -.7}, print: {x: 0, lx: 0, ry: 0, d: 19, ly: 4.65}};
const TALL_G = {about: {ry: .62}, log: {ry: Math.PI}, work: {d: 19, ly: -2.2}};
const both = (a, b) => Object.fromEntries(Object.keys(a).map(k => [k, {...a[k], ...b[k]}]));
const SHOTS = {product: [POSE, both(POSE, TALL)], game: [both(POSE, GAME), both(both(both(POSE, GAME), TALL), TALL_G)]};
const shots = (game, tall) => SHOTS[game ? 'game' : 'product'][tall ? 1 : 0];
const RAD = Math.PI / 180, LENS = Math.tan(13 * RAD);
const RES_MAX = 1.5, RES_MIN = .7; // the canvas's pixels per page pixel: where it starts (never above the screen's own), and how far it may fall on a slow machine
const TOPS = {face: 1.03, lcd: .77, pad: .93, pcb: .88, cell: .55}; // the top edge of each part, where Jay perches when it is being read
const SEAT = {face: 1.28, lcd: .1, pad: .95, pcb: .95, cell: .3};   // and how far along it: the callout is pinned to the other end
const mixPose = (a, b, t, o) => { for (const k in a) o[k] = a[k] + (b[k] - a[k]) * t; return o; };

// The room follows the cartridge: dark and precise for product, warm and bright for game.
// plan/grid: the drafting sheet the machine is taken apart on. play/beat: the room of the game, and the dots that run past in it.
// log: the room the machine is turned over in. score: the room of the numbers; the game cartridge's one dark room, an arcade at night.
// flood/dots: the colour the room is flooded with at the end, and the colour of the dots that build the last wall.
const STAGE = {
  product: {bg: '#0A0B0D', floor: '#0c0d10', env: .85, key: 80, rim: 230, rimC: '#cfe0ff', top: 70, bloom: .32, mirror: 5, plan: '#0B1019', grid: '#5E7399', log: '#0C0D11', play: '#0A0C11', beat: '#2A3654', score: '#050608', flood: '#FF5A1F', dots: '#101216'},
  game: {bg: '#EFE3CB', floor: '#dccfb5', env: .86, key: 118, rim: 60, rimC: '#ffe2b8', top: 30, bloom: .07, mirror: 1.5, plan: '#F5EDDA', grid: '#3566FF', log: '#D3E6D2', play: '#F6C445', beat: '#FFF1C2', score: '#1D1E24', flood: '#3566FF', dots: '#F7F0DF'},
};
// the machine follows it too. [colour, metalness, roughness]
const SKIN = {
  raw: {body: ['#C6C9CE', 1, .4], face: ['#0a0b0d', .25, .07], coat: 1, knob: ['#C2C5CA', 1, .32], ring: '#FF5A1F', keys: ['#BDC0C5', '#BDC0C5', '#BDC0C5', '#BDC0C5'], keyM: 1, keyH: .42, ink: 1, toy: 0},
  product: {body: ['#25272c', 1, .36], face: ['#070809', .25, .06], coat: 1, knob: ['#2b2d32', 1, .3], ring: '#FF5A1F', keys: ['#2d2f34', '#2d2f34', '#2d2f34', '#FF5A1F'], keyM: 1, keyH: .42, ink: 1, toy: 0},
  game: {body: ['#ECE4D3', 0, .6], face: ['#F1EADB', 0, .56], coat: .12, knob: ['#FF7226', 0, .44], ring: '#E8571A', keys: ['#3566FF', '#FFC933', '#FF6233', '#222327'], keyM: 0, keyH: 1, ink: 0, toy: 1},
};

// selected work: every case is a cartridge. Titles, lines, pictures and links come from the site's own about page.
const mk = (side, i, more) => { const w = SIDES[side].work[i]; return {side, title: w.title, sub: w.sub, img: w.img, href: w.href, ...more}; };
const WORKS = {
  game: [mk('game', 0, {short: 'ROCO', stat: '6,632', color: '#3566FF'}), mk('game', 1, {short: 'LOL', stat: '54', color: '#E0A81C'}),
    mk('game', 2, {short: 'MAOXIANJIA', stat: 'v0.8', color: '#FF6233'}), mk('game', 3, {short: 'NEXUS', color: '#2FA36B'})],
  product: [mk('product', 0, {short: 'ATELIER', color: '#FF5A1F'}), mk('product', 1, {short: 'LAST 100 FT', color: '#8C9BFF'}), mk('product', 2, {short: 'AGENTS', color: '#5FD4C4'}),
    mk('product', 3, {short: 'ARDEN', color: '#E6E8EB'}), mk('product', 4, {short: 'CHOOSE', color: '#C5F04A'})],
};
const MIXED = [WORKS.game[0], WORKS.product[0], WORKS.game[1], WORKS.product[1], WORKS.game[2], WORKS.product[2]]; // before a cartridge is chosen: three of each
// the changelog on the back is set the way a device labels itself: capitals, and dates as numbers where the source has them
const plateDate = x => (/^[\d.\s–-]+$/.test(x.date.zh) ? x.date.zh : x.date.en.toUpperCase());
const plateOrg = x => pickLang(x.org, 'en').toUpperCase();
const clockOf = t => pad(Math.floor(t / 60)) + ':' + pad(Math.floor(t % 60));
const layout = list => { const contact = YW + (list.length - 1) * STEP + .45; return {list, n: list.length, contact, end: contact + 2.4}; };

// ?to=公司·岗位 : who this visit is for. The role decides which cartridge is already waiting above the slot.
function parseTo() {
  const raw = new URLSearchParams(location.search).get('to');
  if (!raw) return {company: '', role: '', side: null};
  const [company, role = ''] = raw.split(/[·•|/_]/).map(s => s.trim());
  const side = /策划|game|系统/i.test(role) ? 'game' : /产品|product|pm/i.test(role) ? 'product' : null;
  return {company, role, side};
}

const texture = cv => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

/* ---------- geometry made once ---------- */
function roundRect(p, x, y, w, h, r) {
  p.moveTo(x + r, y); p.lineTo(x + w - r, y); p.absarc(x + w - r, y + r, r, -HALF, 0); p.lineTo(x + w, y + h - r); p.absarc(x + w - r, y + h - r, r, 0, HALF);
  p.lineTo(x + r, y + h); p.absarc(x + r, y + h - r, r, HALF, Math.PI); p.lineTo(x, y + r); p.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return p;
}
// a plate with round corners, an optional window and a small bevel, so its edges catch the light like a machined part
function plate(w, h, r, depth, bevel = 0, hole) {
  const s = roundRect(new THREE.Shape(), -w / 2, -h / 2, w, h, r);
  if (hole) s.holes.push(roundRect(new THREE.Path(), hole.x - hole.w / 2, hole.y - hole.h / 2, hole.w, hole.h, hole.r));
  return new THREE.ExtrudeGeometry(s, {depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 18});
}
// the knob's grip: every other column of the cylinder is pulled in, which makes real ridges
function knurl() {
  const n = 132, g = new THREE.CylinderGeometry(.33, .334, .24, n, 1, true), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) if ((i % (n + 1)) % 2) { p.setX(i, p.getX(i) * .98); p.setZ(i, p.getZ(i) * .98); }
  g.computeVertexNormals(); return g;
}
const WIN = {x: SCR.x, y: SCR.y, w: SCR.w + .1, h: SCR.h + .1, r: .06};
const GEO = {
  face: plate(W - .14, H - .14, .1, .018, .006, WIN),
  cavity: plate(W - .2, H - .2, .08, .002),
  bezel: plate(WIN.w, WIN.h, WIN.r, .008),
  module: plate(SCR.w + .3, SCR.h + .24, .04, .03, .003),
  pad: plate(W - .36, H - .34, .1, .014, .004),
  pcb: plate(W - .46, H - .44, .05, .02, .003),
  knurl: knurl(),
  cap: new THREE.LatheGeometry([[.105, 0], [.104, .04], [.098, .062], [.082, .078], [.05, .086], [0, .088]].map(([x, y]) => new THREE.Vector2(x, y)), 48),
};

/* ---------- textures drawn once ---------- */
// engraving, the toggle's two words and the knob's scale; drawn in the ink the current skin needs
function inkDecal(ink) {
  const S = 640, cv = document.createElement('canvas'); cv.width = Math.round(W * S); cv.height = Math.round(H * S);
  const g = cv.getContext('2d'), X = x => (x + W / 2) * S, Y = y => (H / 2 - y) * S;
  g.fillStyle = g.strokeStyle = ink; g.textBaseline = 'middle'; g.letterSpacing = '4px';
  g.font = `500 ${.078 * S}px ${MONO}`; g.fillText('JAY LIN  JL-01', X(-1.5), Y(-.82));
  g.font = `500 ${.062 * S}px ${MONO}`; g.fillText('PRODUCT', X(TOG.x + .2), Y(TOG.y + .085)); g.fillText('GAME', X(TOG.x + .2), Y(TOG.y - .085));
  g.lineWidth = 2; g.lineCap = 'round';
  for (let i = 0; i <= 20; i++) { const a = Math.PI * 1.25 - i * Math.PI * 1.5 / 20, c = Math.cos(a), s = Math.sin(a), len = i % 5 === 0 ? .05 : .024;
    g.globalAlpha = i % 5 === 0 ? 1 : .55; g.beginPath(); g.moveTo(X(KNOB.x + c * .4), Y(KNOB.y + s * .4)); g.lineTo(X(KNOB.x + c * (.4 + len)), Y(KNOB.y + s * (.4 + len))); g.stroke(); }
  return texture(cv);
}
// the soft streak a studio light leaves on the screen's glass
function streak() {
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 340; const g = cv.getContext('2d');
  const l = g.createLinearGradient(0, 0, 512, 340);
  l.addColorStop(0, 'rgba(255,255,255,.3)'); l.addColorStop(.22, 'rgba(255,255,255,.08)'); l.addColorStop(.4, 'rgba(255,255,255,0)'); l.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = l; g.fillRect(0, 0, 512, 340);
  return texture(cv);
}
// the printed sticker on a cartridge
function cartLabel(side, to) {
  const cv = document.createElement('canvas'); cv.width = 800; cv.height = 320; const g = cv.getContext('2d');
  const who = (to.company || 'PLAYER 1').toUpperCase(), role = side === 'game' ? 'GAME DESIGNER' : 'PRODUCT MANAGER';
  g.textBaseline = 'alphabetic';
  if (side === 'game') {
    g.fillStyle = '#F4EBD8'; g.beginPath(); g.roundRect(0, 0, 800, 320, 26); g.fill(); g.save(); g.clip();
    g.fillStyle = '#2FA36B'; g.beginPath(); g.ellipse(560, 420, 420, 190, 0, 0, 7); g.fill();
    g.fillStyle = '#2F5BFF'; g.beginPath(); g.moveTo(560, 96); g.lineTo(632, 30); g.lineTo(640, 110); g.fill();
    g.beginPath(); g.roundRect(510, 86, 160, 160, 46); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.ellipse(590, 222, 58, 38, 0, 0, 7); g.fill();
    g.fillStyle = '#16171a'; g.fillRect(540, 138, 28, 28); g.beginPath(); g.arc(624, 152, 15, 0, 7); g.fill();
    g.fillStyle = '#FF8A2B'; g.beginPath(); g.moveTo(574, 160); g.lineTo(606, 160); g.lineTo(590, 188); g.fill();
    g.restore();
    g.fillStyle = '#E9452A'; g.font = `800 92px ${MONO}`; g.fillText('GAME', 40, 118);
    g.fillStyle = '#3a342c'; g.font = `600 30px ${MONO}`; g.fillText('FOR: ' + who, 44, 190); g.fillText('ROLE: ' + role, 44, 234);
    g.fillStyle = '#8b8170'; g.font = `500 24px ${MONO}`; g.fillText('JL-01', 44, 284);
  } else {
    g.fillStyle = 'rgba(255,255,255,.94)'; g.font = `600 78px ${MONO}`; g.letterSpacing = '6px'; g.fillText('PRODUCT', 40, 112);
    g.fillStyle = '#FF5A1F'; g.fillRect(44, 142, 300, 4);
    g.letterSpacing = '2px'; g.fillStyle = 'rgba(255,255,255,.72)'; g.font = `500 30px ${MONO}`; g.fillText('FOR: ' + who, 44, 196); g.fillText('ROLE: ' + role, 44, 240);
    g.fillStyle = 'rgba(255,255,255,.42)'; g.font = `500 24px ${MONO}`; g.fillText('JL-01', 44, 288);
  }
  return texture(cv);
}
// copper traces: seen through the smoked product cartridge, and on the machine's own board
function circuit(wide) {
  const cv = document.createElement('canvas'); cv.width = 760; cv.height = 480; const g = cv.getContext('2d');
  g.strokeStyle = 'rgba(214,170,74,.6)'; g.lineWidth = 3; g.lineCap = 'round'; g.lineJoin = 'round';
  let seed = wide ? 11 : 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < (wide ? 46 : 26); i++) { let x = (wide ? 30 : 420) + rnd() * (wide ? 700 : 300), y = 40 + rnd() * 400; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 3; k++) { if (k % 2) y += (rnd() - .5) * 160; else x += (rnd() - .3) * 200; g.lineTo(x, y); } g.stroke();
    g.fillStyle = 'rgba(214,170,74,.85)'; g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
  if (!wide) { g.fillStyle = 'rgba(12,13,16,.9)'; g.fillRect(560, 250, 130, 130); g.strokeStyle = 'rgba(190,196,208,.5)'; g.lineWidth = 2; g.strokeRect(560, 250, 130, 130); }
  return texture(cv);
}

/* ---------- the picture: bloom on what glows, then product-render tone mapping ---------- */
function Post() {
  const {gl, scene, camera, size} = useThree(), dpr = useThree(st => st.viewport.dpr);
  const composer = useMemo(() => {
    const c = new EffectComposer(gl, new THREE.WebGLRenderTarget(1, 1, {type: THREE.HalfFloatType, samples: 4}));
    c.addPass(new RenderPass(scene, camera));
    post.bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), .32, .6, 1.04); c.addPass(post.bloom);
    c.addPass(new OutputPass());
    if (import.meta.env.DEV) window.__jl = Object.assign(window.__jl || {}, {composer: c}); // development only: lets a check time each pass
    return c;
  }, [gl, scene, camera]);
  useEffect(() => { composer.setPixelRatio(gl.getPixelRatio()); composer.setSize(size.width, size.height); }, [composer, gl, size, dpr]);
  useEffect(() => () => composer.dispose(), [composer]);
  useFrame(() => composer.render(), 1);
  return null;
}

function Cartridge({side, to, innerRef, on}) {
  const label = useMemo(() => cartLabel(side, to), [side, to]);
  const traces = useMemo(() => (side === 'product' ? circuit(false) : null), [side]);
  const dark = side === 'product';
  const body = <meshPhysicalMaterial color={dark ? '#191c22' : '#F0562B'} roughness={dark ? .16 : .4} clearcoat={dark ? 1 : .45} clearcoatRoughness={.1}/>;
  return <group ref={innerRef} name={'cart-' + side} position={[dark ? -.78 : .78, 4.4, .15]} scale={.001}
    onPointerOver={e => { e.stopPropagation(); on.pickSide(side); on.tipKey(side === 'game' ? 'insertGame' : 'insertProduct'); }}
    onPointerOut={() => on.tip('')}
    onClick={e => { e.stopPropagation(); on.choose(side); }}>
    <RoundedBox args={[1.2, .78, .12]} radius={.04} smoothness={6}>{body}</RoundedBox>
    {[0, 1, 2].map(i => <RoundedBox key={i} args={[.56, .016, .13]} radius={.005} smoothness={2} position={[0, .352 - i * .034, 0]}>{body}</RoundedBox>)}
    {traces && <mesh position={[0, 0, .0612]}><planeGeometry args={[1.14, .72]}/><meshBasicMaterial map={traces} transparent opacity={.55}/></mesh>}
    <mesh position={[0, .06, .0616]}><planeGeometry args={[1.06, .424]}/>
      {dark ? <meshBasicMaterial map={label} transparent/> : <meshStandardMaterial map={label} transparent roughness={.7}/>}
    </mesh>
    <mesh position={[0, -.43, 0]}><boxGeometry args={[.92, .12, .04]}/><meshStandardMaterial color="#DDB04A" metalness={1} roughness={.24}/></mesh>
    {Array.from({length: 11}, (_, i) => <mesh key={i} position={[-.4 + i * .08, -.43, 0]}><boxGeometry args={[.012, .121, .042]}/><meshStandardMaterial color="#5c4513" roughness={.6}/></mesh>)}
  </group>;
}

// a work cartridge's sticker: the case's own picture over a name strip
const labels = new Map();
function workLabel(w, n) {
  const id = w.side + w.short + n; if (labels.has(id)) return labels.get(id);
  const cv = document.createElement('canvas'); cv.width = 848; cv.height = 496; const g = cv.getContext('2d'), t = texture(cv), dark = w.side === 'product';
  const paint = im => {
    g.fillStyle = dark ? '#0f1114' : '#F4EBD8'; g.fillRect(0, 0, 848, 496);
    g.fillStyle = w.color; g.fillRect(0, 0, 848, 388);
    if (im) { const tall = im.height > im.width, k = tall ? 356 / im.height : Math.max(848 / im.width, 380 / im.height), iw = im.width * k, ih = im.height * k;
      g.save(); g.beginPath(); g.rect(0, 0, 848, 380); g.clip(); g.drawImage(im, (848 - iw) / 2, (380 - ih) / 2, iw, ih); g.restore(); }
    g.textBaseline = 'middle'; g.letterSpacing = '3px'; g.fillStyle = dark ? 'rgba(255,255,255,.94)' : '#26221c'; g.font = `700 52px ${MONO}`; g.fillText(w.short, 30, 446);
    g.textAlign = 'right'; g.fillStyle = dark ? 'rgba(255,255,255,.5)' : '#8b8170'; g.font = `500 28px ${MONO}`; g.fillText((dark ? 'PRODUCT ' : 'GAME ') + pad(n), 818, 448); g.textAlign = 'left';
    t.needsUpdate = true;
  };
  paint(null);
  if (w.img) { const im = new Image(); im.onload = () => paint(im); im.src = w.img; }
  labels.set(id, t); return t;
}

// where a work cartridge sits on the carousel, d places away from the front
const RING = 2.6, ringAt = (d, o) => { const th = d * .46; o.x = RING * Math.sin(th); o.z = .12 - RING * (1 - Math.cos(th)); o.ry = th; return o; };

function WorkCart({w, n, i, innerRef, on}) {
  const label = useMemo(() => workLabel(w, n), [w, n]);
  const dark = w.side === 'product';
  // the game room floods with the work's own colour, so a game cartridge is cream and keeps the colour for its grip
  const body = <meshPhysicalMaterial color={dark ? '#191c22' : '#F3ECDC'} roughness={dark ? .18 : .5} clearcoat={dark ? 1 : .3} clearcoatRoughness={.1}/>;
  return <group ref={innerRef} name={'work-' + i} position={[0, 5, 0]} scale={.001}
    onPointerOver={e => { e.stopPropagation(); on.over(i); on.workTip(i, w); }} onPointerOut={() => { on.over(-1); on.tip(''); }}
    onClick={e => { e.stopPropagation(); on.work(i); }}>
    <RoundedBox args={[1.2, .98, .12]} radius={.04} smoothness={6}>{body}</RoundedBox>
    <mesh position={[0, .135, .0612]}><planeGeometry args={[1.06, .62]}/><meshBasicMaterial map={label}/></mesh>
    {[0, 1, 2].map(k => <RoundedBox key={k} args={[.5, .016, .13]} radius={.005} smoothness={2} position={[0, -.27 - k * .034, 0]}>
      {dark ? body : <meshStandardMaterial color={w.color} roughness={.5}/>}</RoundedBox>)}
    <mesh position={[0, -.53, 0]}><boxGeometry args={[.92, .12, .04]}/><meshStandardMaterial color="#DDB04A" metalness={1} roughness={.24}/></mesh>
  </group>;
}

/* ---------- the room ---------- */
// One sheet behind everything. It is the studio's dark, the drafting grid of the teardown, the pool of light a work throws,
// and the colour that pours out of the machine at the end. The colour spreads the way the screen draws: dot by dot.
function Backdrop({U}) {
  const mat = useMemo(() => new THREE.ShaderMaterial({uniforms: U, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform vec3 uA, uGridCol, uC, uGlowCol; uniform float uGrid, uFlood, uGlow, uShift, uRun, uRunX; uniform vec2 uO, uG, uRes; varying vec2 vUv;
      void main(){
        vec2 px = vUv * uRes, asp = vec2(uRes.x / uRes.y, 1.);
        vec3 col = uA;
        float g = length((vUv - uG) * asp); col += uGlowCol * uGlow * exp(-g * g * 4.6);
        vec2 gp = px + vec2(0., uShift), a = abs(fract(gp / 32. - .5) - .5) * 32., b = abs(fract(gp / 160. - .5) - .5) * 160.;
        col = mix(col, uGridCol, uGrid * ((1. - smoothstep(.4, 1.3, min(a.x, a.y))) * .15 + (1. - smoothstep(.5, 1.7, min(b.x, b.y))) * .3));
        if (uRun > .001) { // the play room: dots that run past at the speed of the game, larger towards the floor
          vec2 q = px + vec2(uRunX * (.4 + .6 * (1. - vUv.y)), 0.), c2 = (floor(q / 46.) + .5) * 46.; float rr = 3. + 9. * (1. - vUv.y);
          col = mix(col, uGridCol, uRun * (1. - smoothstep(rr - 1., rr + 1., length(q - c2))) * .55); }
        if (uFlood > .0005) {
          vec2 cell = (floor(px / 22.) + .5) * 22.;
          float k = clamp((uFlood * 2.7 - length((cell / uRes - uO) * asp)) / .42, 0., 1.);
          if (k > 0. && length(px - cell) / 11. <= k * 1.5) col = uC;
        }
        gl_FragColor = vec4(col, 1.);
      }`}), [U]);
  return <mesh frustumCulled={false} renderOrder={-1000} position={[0, 400, 0]} material={mat}><planeGeometry args={[2, 2]}/></mesh>;
}

// The cut from "about" to "work" is a cartridge. It drops past the lens, close enough to fill the frame, with the name of the next act
// printed on it; behind it the room, the lens and the camera all change at once.
function coverLabel(side, n, title, sub, cjk) { // the works are the fifth act
  const cv = document.createElement('canvas'); cv.width = 1272; cv.height = 744; const g = cv.getContext('2d'), dark = side !== 'game';
  g.fillStyle = dark ? '#0d0f13' : '#F4EBD8'; g.fillRect(0, 0, 1272, 744);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = dark ? '#FF5A1F' : '#E9452A'; g.font = '900 250px "JL Dot",ui-monospace,monospace'; g.fillText('05', 636, 318);
  g.fillStyle = dark ? '#F2F2EF' : '#26221c'; g.font = `700 ${cjk ? 74 : 60}px "Songti SC","JL Song",serif`; try { g.letterSpacing = cjk ? '26px' : '12px'; } catch { /* older canvas */ } g.fillText(title, cjk ? 649 : 642, 500);
  g.fillStyle = dark ? 'rgba(255,255,255,.5)' : '#8b8170'; g.font = `500 24px ${MONO}`; try { g.letterSpacing = '7px'; } catch { /* older canvas */ }
  g.fillText(sub, 640, 584);
  g.fillStyle = dark ? '#FF5A1F' : '#3566FF'; g.fillRect(586, 634, 100, 4);
  return texture(cv);
}
function Occluder({innerRef, side, n, words, cjk}) {
  const [ready, setReady] = useState(false);
  useEffect(() => { document.fonts?.ready.then(() => setReady(true)); }, []);
  const label = useMemo(() => coverLabel(side, n, words.cover, words.coverSub(pad(n)), cjk), [side, n, ready, words, cjk]); // eslint-disable-line react-hooks/exhaustive-deps
  const dark = side !== 'game';
  const body = <meshPhysicalMaterial color={dark ? '#14161b' : '#F0562B'} roughness={dark ? .2 : .42} clearcoat={dark ? 1 : .45} clearcoatRoughness={.12}/>;
  return <group ref={innerRef} visible={false}>
    <RoundedBox args={[1.2, .98, .12]} radius={.04} smoothness={6}>{body}</RoundedBox>
    <mesh position={[0, .135, .0612]}><planeGeometry args={[1.06, .62]}/><meshBasicMaterial map={label} toneMapped={false}/></mesh>
    {[0, 1, 2].map(k => <RoundedBox key={k} args={[.5, .016, .13]} radius={.005} smoothness={2} position={[0, -.27 - k * .034, 0]}>{body}</RoundedBox>)}
    <mesh position={[0, -.53, 0]}><boxGeometry args={[.92, .12, .04]}/><meshStandardMaterial color="#DDB04A" metalness={1} roughness={.24}/></mesh>
  </group>;
}

// Two walls of square dots stand in the room: the name on the first screen, LET'S WORK on the last. They are a pair on purpose,
// the page ends where it began, in another light. A wall stands on the studio floor, so the floor mirrors it, the fog takes it and
// the camera can move against it; the dots under the pointer swell.
//   name  lights up dot by dot when the machine wakes, and switches itself off column by column when the page scrolls on
//   end   is built by the dots the work cartridges break into, and a click throws its dots about before they settle again
const GLYPH = {J: ['..XXX', '...X.', '...X.', '...X.', '...X.', 'X..X.', '.XX..'], A: ['..X..', '.X.X.', 'X...X', 'X...X', 'XXXXX', 'X...X', 'X...X'], Y: ['X...X', 'X...X', '.X.X.', '..X..', '..X..', '..X..', '..X..'],
  L: ['X....', 'X....', 'X....', 'X....', 'X....', 'X....', 'XXXXX'], I: ['.XXX.', '..X..', '..X..', '..X..', '..X..', '..X..', '.XXX.'], N: ['X...X', 'XX..X', 'X.X.X', 'X.X.X', 'X..XX', 'X...X', 'X...X'],
  E: ['XXXXX', 'X....', 'X....', 'XXXX.', 'X....', 'X....', 'XXXXX'], T: ['XXXXX', '..X..', '..X..', '..X..', '..X..', '..X..', '..X..'], S: ['.XXXX', 'X....', 'X....', '.XXX.', '....X', '....X', 'XXXX.'],
  W: ['X...X', 'X...X', 'X...X', 'X.X.X', 'X.X.X', 'XX.XX', 'X...X'], O: ['.XXX.', 'X...X', 'X...X', 'X...X', 'X...X', 'X...X', '.XXX.'], R: ['XXXX.', 'X...X', 'X...X', 'XXXX.', 'X.X..', 'X..X.', 'X...X'],
  K: ['X...X', 'X..X.', 'X.X..', 'XX...', 'X.X..', 'X..X.', 'X...X'], "'": ['X', 'X', '.', '.', '.', '.', '.'],
  0: ['.XXX.', 'X...X', 'X..XX', 'X.X.X', 'XX..X', 'X...X', '.XXX.'], 1: ['..X..', '.XX..', '..X..', '..X..', '..X..', '..X..', '.XXX.'], 2: ['.XXX.', 'X...X', '....X', '...X.', '..X..', '.X...', 'XXXXX'],
  3: ['XXXX.', '....X', '....X', '.XXX.', '....X', '....X', 'XXXX.'], 4: ['...X.', '..XX.', '.X.X.', 'X..X.', 'XXXXX', '...X.', '...X.'], 5: ['XXXXX', 'X....', 'XXXX.', '....X', '....X', 'X...X', '.XXX.'],
  6: ['.XXX.', 'X....', 'X....', 'XXXX.', 'X...X', 'X...X', '.XXX.'], 7: ['XXXXX', '....X', '...X.', '..X..', '..X..', '..X..', '..X..'], 8: ['.XXX.', 'X...X', 'X...X', '.XXX.', 'X...X', 'X...X', '.XXX.'],
  9: ['.XXX.', 'X...X', 'X...X', '.XXXX', '....X', '....X', '.XXX.'], '+': ['.....', '..X..', '..X..', 'XXXXX', '..X..', '..X..', '.....'], ',': ['..', '..', '..', '..', '..', '.X', 'X.']};
// lines of text -> dots. x: column, y: height (the last line is at the bottom), k: which letter, cx/cy: that letter's middle
const wallOf = lines => { const wide = lines.map(l => [...l].reduce((a, ch) => a + GLYPH[ch][0].length + 1, -1)), cols = Math.max(...wide), dots = []; let k = 0;
  lines.forEach((l, row) => { let x = (cols - wide[row]) / 2; const base = (lines.length - 1 - row) * 8.4;
    [...l].forEach(ch => { const g = GLYPH[ch]; g.forEach((line, j) => [...line].forEach((c, i) => { if (c === 'X') dots.push({x: x + i, y: base + 6 - j, k, cx: x + (g[0].length - 1) / 2, cy: base + 3}); })); x += g[0].length + 1; k++; }); });
  return {dots, cols, rows: lines.length * 8.4 - 1.4}; };
const WALLS = {name: wallOf(['JAY', 'LIN']), end: wallOf(["LET'S", 'WORK'])};
// his numbers, from the site's about page, each as one line of dots; they share one set of dots, which re-forms from one number into the next
const scoreText = n => String(n.value).replace(/\B(?=(\d{3})+$)/g, ',') + n.suffix;
const SCORES = Object.fromEntries(['product', 'game'].map(k => [k, SIDES[k].numbers.slice(0, NS).map(n => { const w = wallOf([scoreText(n)]), top = w.dots.filter(d => d.k === 0 && d.y === 6);
  return {...w, text: scoreText(n), perch: top.reduce((a, d) => (Math.abs(d.x - d.cx) < Math.abs(a.x - a.cx) ? d : a), top[0]).x}; })])); // perch: the dot on top of the first figure, where Jay sits
const NDOT = Math.max(...Object.values(SCORES).flat().map(w => w.dots.length)), SCOLS = Math.max(...Object.values(SCORES).flat().map(w => w.cols));
// The numbers stand far behind the machine and take the width of the frame
function scorePlace(game, aspect, o) {
  const tall = aspect < .9, T = shots(game, tall).score, z = -4, half = (T.d + (tall ? Math.max(0, .9 - aspect) * 11.5 : aspect < 1.55 ? 1.1 : 0) - z) * LENS;
  o.p = Math.min(.56, half * aspect * (tall ? 1.8 : 1.42) / (SCOLS + .8)); o.x = T.lx; o.y = tall ? 2.5 : 2.15; o.z = z; return o;
}
// the game cartridge paints one letter per key colour, and knocks every letter a little askew
const TOY = ['#3566FF', '#FFC933', '#FF6233', '#2FA36B', '#26262B', '#3566FF'], TOY_END = ['#F7F0DF', '#FFC933', '#FF6233', '#F7F0DF', '#7BE0A6', '#FFC933', '#F7F0DF', '#FF6233', '#7BE0A6'];
const TILT = [-.1, .07, -.06, .09, -.08, .06, -.07, .08, -.05];
// A bird sits on things: once the last wall is built, Jay sits on top of the letter nearest the machine (S for product, E for game)
const ROOST = [4, 1].map(k => { const d = WALLS.end.dots.find(q => q.k === k); return {x: d.cx, y: 14.4, k, cx: d.cx, cy: d.cy}; });

// Where a wall stands, for this screen. p is the distance between two dots. Wide screen: on the floor against one side of the frame,
// turned a little towards the middle (the last wall of the game cartridge stands on the other side). Tall screen: over the machine.
function wallPlace(kind, game, aspect, o) {
  const tall = aspect < .9, name = kind === 'name', W0 = WALLS[kind].cols - 1, T = shots(game, tall)[name ? 'hero' : 'print'], z = tall ? -1.6 : -2.6;
  const half = (T.d + (tall ? Math.max(0, .9 - aspect) * 11.5 : aspect < 1.55 ? 1.1 : 0) - z) * LENS, hw = half * aspect, right = !name && game;
  if (tall) { o.p = name ? Math.min(.25, hw * 1.66 / (W0 + .8), (T.ly + half * .8 - 2.75) / 14.8) : Math.min(.2, hw * 1.6 / (W0 + .8));
    o.x = -W0 / 2 * o.p; o.y = name ? 2.75 : T.ly + half * .66 - WALLS[kind].rows * o.p; o.z = z; o.ry = 0; } // the last wall leaves room above it: Jay sits on top
  else { o.p = Math.min(name ? .25 : .2, hw * (name ? .8 : .84) / (W0 + .8)); o.ry = right ? -.17 : .18; o.y = -H / 2 + .4 * o.p;
    o.x = right ? T.lx + hw * .9 - .4 * o.p - W0 * o.p * Math.cos(o.ry) : T.lx - hw * .9 + .4 * o.p; o.z = right ? z + W0 * o.p * Math.sin(o.ry) : z; }
  o.cs = Math.cos(o.ry); o.sn = Math.sin(o.ry); return o;
}
// one dot of a wall, in the room; returns how far its letter is tilted. toy: how much of the game cartridge's askew setting is on
function wallDot(pl, d, toy, now, v) {
  let gx = d.x, gy = d.y, a = 0;
  if (toy > .001) { a = TILT[d.k % TILT.length] * toy; const c = Math.cos(a), s = Math.sin(a), dx = d.x - d.cx, dy = d.y - d.cy;
    gx = d.cx + dx * c - dy * s; gy = d.cy + dx * s + dy * c + (1 + Math.sin(now * 1.7 + d.k * 1.3)) * .2 * toy; }
  v.set(pl.x + gx * pl.p * pl.cs, pl.y + gy * pl.p, pl.z - gx * pl.p * pl.sn); return a;
}
// every dot of a wall glows in its own colour: bright enough on the dark stage to bloom
function dotMat(fog) {
  const m = new THREE.MeshStandardMaterial({color: '#fff', roughness: .62, fog}); m.userData.glow = {value: .16};
  m.onBeforeCompile = sh => { sh.uniforms.uGlow = m.userData.glow;
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uGlow;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uGlow;'); };
  return m;
}
function DotWall({S, kind}) {
  const ref = useRef(), lamp = useRef(), W = WALLS[kind].dots, name = kind === 'name';
  const mat = useMemo(() => dotMat(name), [name]); // the last wall keeps its own colour: the flooded room's haze would turn black blocks brown
  const K = useMemo(() => ({o: new THREE.Object3D(), c: new THREE.Color(), white: new THREE.Color('#fff'), v: new THREE.Vector3(), q: new THREE.Vector3(), pl: {}, sw: W.map(() => 0), rnd: W.map(() => Math.random()), t0: null, toy: 0}), [W]);
  useFrame((state, dt) => {
    const s = S.current, m = ref.current; if (!m) return;
    dt = Math.min(dt, .05);
    const {width, height} = state.size, aspect = width / height, now = performance.now() / 1000, cols = WALLS[kind].cols;
    const awake = s.phase !== 'standby', game = s.choice === 'game', off = name ? sm(.03, .36, s.y) : 1 - sm(.64, .7, s.m);
    if (!awake) K.t0 = null; else if (K.t0 == null) K.t0 = now;
    m.visible = off < .999; if (!m.visible) { if (lamp.current) lamp.current.intensity = 0; return; }
    const pl = wallPlace(kind, game, aspect, K.pl), since = K.t0 == null ? -1 : now - K.t0;
    K.toy = damp(K.toy, game ? 1 : 0, 4, dt);
    mat.userData.glow.value = damp(mat.userData.glow.value, name ? (game ? .34 : awake ? .72 : .16) : game ? .3 : .03, 5, dt);
    if (name) { // on the dark stage the name is a lamp: it lights the side of the machine that faces it, and the floor in between
      lamp.current.position.set(pl.x + 9 * pl.p * pl.cs, pl.y + 6 * pl.p, pl.z + 1.1);
      lamp.current.intensity = damp(lamp.current.intensity, game || !awake ? 0 : 34 * clamp(since / 1.2) * (1 - off), 5, dt); }
    for (let i = 0; i < W.length; i++) { const d = W[i], a = wallDot(pl, d, K.toy, now, K.q); let lit = 1, size, spin = 0;
      if (name) { lit = awake ? clamp((since - d.x * .03 - K.rnd[i] * .14) / .22) : 0; size = (1 - clamp(off * 1.6 - (1 - d.x / cols) * .6)) * (.7 + .3 * lit); }
      else size = clamp((s.m - .7 - K.rnd[i] * .2) / .1); // a dot of the last wall is there once the dots flying in have reached it
      K.v.copy(K.q).project(state.camera);
      K.sw[i] = damp(K.sw[i], 1 - sm(0, .26, Math.hypot((K.v.x - state.pointer.x) * aspect, K.v.y - state.pointer.y)), 10, dt);
      if (!name && s.bk > .003) { const bx = (K.v.x - s.bx) * aspect, by = K.v.y - s.by, len = Math.hypot(bx, by) + 1e-4, amt = s.bk * Math.exp(-len * 1.9) * (.5 + K.rnd[i]); // a click: thrown outward, and it settles again
        K.q.x += bx / len * amt * 1.3; K.q.y += by / len * amt * 1.3 + amt * .4; K.q.z += (K.rnd[i] - .4) * amt * 2; spin = amt * 5; }
      K.o.position.set(K.q.x + pl.sn * K.sw[i] * pl.p * .5, K.q.y, K.q.z + pl.cs * K.sw[i] * pl.p * .5); K.o.rotation.set(spin, pl.ry + spin * .7, a);
      K.o.scale.setScalar(Math.max(1e-4, pl.p * size * (1 + K.sw[i] * .34))); K.o.updateMatrix(); m.setMatrixAt(i, K.o.matrix);
      if (game) K.c.set(name ? TOY[d.k % TOY.length] : TOY_END[d.k % TOY_END.length]).multiplyScalar(name ? .45 + .55 * lit + K.sw[i] * .25 : 1 + K.sw[i] * .2);
      else if (name) { const b = (.2 + .8 * lit) * (.9 + .1 * Math.sin(now * 1.3 - d.x * .4 + d.y * .25)) * (1 + K.sw[i] * .7); K.c.setRGB(b, b, b); }
      else K.c.set('#08090b').lerp(K.white, K.sw[i] * .9); // the dark machine's last wall: black blocks in an orange room, white where the pointer is
      m.setColorAt(i, K.c); }
    m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true;
  });
  return <>
    <instancedMesh ref={ref} name={'wall-' + kind} args={[null, null, W.length]} material={mat} frustumCulled={false}><boxGeometry args={[.8, .8, .3]}/></instancedMesh>
    {name && <pointLight ref={lamp} intensity={0} color="#eaf1ff" decay={2}/>}
  </>;
}

// The cut into the last act is made of dots. Every work cartridge breaks into the dots it was printed with; they cross the frame,
// each on its own arc, and where they land a block of the last wall appears.
const DOTS = 5200;
function Dots({S, works, game}) {
  const laid = useRef('');
  const {geo, mat, K} = useMemo(() => {
    const geo = new THREE.BufferGeometry(), rnd = new Float32Array(DOTS * 4);
    for (let i = 0; i < rnd.length; i++) rnd[i] = Math.random();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(DOTS * 3), 3)); // where a dot starts, inside a cartridge (in the machine's space)
    geo.setAttribute('aDst', new THREE.BufferAttribute(new Float32Array(DOTS * 3), 3));     // where it lands, on the wall (in the room's space)
    geo.setAttribute('aCol', new THREE.BufferAttribute(new Float32Array(DOTS * 3), 3));
    geo.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
    const mat = new THREE.ShaderMaterial({depthTest: false, depthWrite: false, transparent: true,
      uniforms: {uM: {value: 0}, uSize: {value: 5}, uInk: {value: new THREE.Color('#0A0B0D')}},
      vertexShader: `attribute vec3 aDst, aCol; attribute vec4 aRnd; uniform float uM, uSize; uniform vec3 uInk; varying vec3 vCol; varying float vOn;
        void main(){
          vec4 c = projectionMatrix * modelViewMatrix * vec4(position, 1.), d = projectionMatrix * viewMatrix * vec4(aDst, 1.);
          float t = clamp((uM - aRnd.x * .45) / .55, 0., 1.), e = t * t * (3. - 2. * t);  // each dot leaves at its own moment
          vec2 p = mix(c.xy / c.w, d.xy / d.w, e) + vec2((aRnd.y - .5) * .7, (aRnd.z - .5) * .5 + .16) * sin(e * 3.14159); // and takes its own arc
          gl_Position = vec4(p, 0., 1.);
          gl_PointSize = uSize * (1. + sin(e * 3.14159) * (1.2 + aRnd.w * 2.2)) * (1. - smoothstep(.88, 1., e));
          vCol = mix(aCol, uInk, smoothstep(.55, 1., e)); vOn = step(.0001, t) * step(e, .998);
        }`,
      fragmentShader: 'varying vec3 vCol; varying float vOn; void main(){ if (vOn < .5) discard; gl_FragColor = vec4(vCol, 1.); }'});
    return {geo, mat, K: {pl: {}, v: new THREE.Vector3()}};
  }, []);
  useEffect(() => { // sources: scattered through the cartridges as they stand when the last work is in front
    const pos = geo.attributes.position, col = geo.attributes.aCol, o = {}, c = new THREE.Color(), n = works.length;
    for (let k = 0; k < DOTS; k++) { const i = k % n, u = (Math.random() - .5) * 1.1, v = (Math.random() - .5) * .9;
      if (game) pos.setXYZ(k, (i - (n - 1)) * 1.45 + u, -H / 2 + .12, 1.5 + v);
      else { ringAt(i - (n - 1), o); pos.setXYZ(k, o.x + u * Math.cos(o.ry), 2.12 + v, o.z - u * Math.sin(o.ry)); }
      c.set(works[i].color); if (works[i].side === 'product' && Math.random() < .45) c.set('#E9EEF5'); col.setXYZ(k, c.r, c.g, c.b); }
    pos.needsUpdate = true; col.needsUpdate = true;
  }, [geo, works, game]);
  useFrame(state => {
    const s = S.current, u = mat.uniforms, aspect = state.size.width / state.size.height, key = game + '|' + aspect.toFixed(3);
    if (key !== laid.current) { laid.current = key; const d = geo.attributes.aDst, W = WALLS.end.dots, pl = wallPlace('end', game, aspect, K.pl);
      for (let k = 0; k < DOTS; k++) { wallDot(pl, W[k % W.length], game ? 1 : 0, 0, K.v); d.setXYZ(k, K.v.x + (Math.random() - .5) * pl.p * .6, K.v.y + (Math.random() - .5) * pl.p * .6, K.v.z); } d.needsUpdate = true; }
    u.uM.value = s.m; u.uSize.value = 4.6 * state.viewport.dpr; u.uInk.value.set(STAGE[s.choice || 'product'].dots);
  });
  return <points geometry={geo} material={mat} frustumCulled={false} renderOrder={60}/>;
}

// The numbers. One set of dots, as many as the longest number needs. Between two numbers every dot leaves its place at its own moment,
// takes its own arc towards the camera and lands in the next figure, so a number is not replaced: it comes apart and re-forms.
// The scroll does it (S.n is the number the scroll is at, with its fraction), a click throws the dots about, the pointer swells them.
function ScoreWall({S, content}) {
  const ref = useRef(), lamp = useRef(), walls = SCORES[content], mat = useMemo(() => dotMat(false), []);
  const K = useMemo(() => ({o: new THREE.Object3D(), c: new THREE.Color(), v: new THREE.Vector3(), q: new THREE.Vector3(), pl: {}, sw: new Float32Array(NDOT), rnd: Array.from({length: NDOT}, () => [Math.random(), Math.random(), Math.random()]), f: 0, toy: 0}), []);
  useFrame((state, dt) => {
    const s = S.current, m = ref.current; if (!m) return;
    dt = Math.min(dt, .05); if (import.meta.env.DEV && window.__jl?.fast) dt = .4;
    const on = s.ts * (1 - s.t2); m.visible = on > .02;
    if (!m.visible) { lamp.current.intensity = 0; s.roost = null; K.f = s.n; return; }
    const {width, height} = state.size, aspect = width / height, now = performance.now() / 1000, game = s.choice === 'game', pl = scorePlace(game, aspect, K.pl);
    K.f = damp(K.f, s.n, 7, dt); K.toy = damp(K.toy, game ? 1 : 0, 4, dt);
    const f = clamp(K.f, 0, NS - 1), i0 = Math.min(NS - 2, Math.floor(f)), t = f - i0, A = walls[i0], B = walls[i0 + 1];
    mat.userData.glow.value = damp(mat.userData.glow.value, game ? .42 : .5, 5, dt);
    for (let k = 0; k < NDOT; k++) { const a = A.dots[k % A.dots.length], b = B.dots[k % B.dots.length], [r1, r2, r3] = K.rnd[k];
      const u = clamp((t - r1 * .4) / .6), e = u * u * (3 - 2 * u), arc = Math.sin(Math.PI * e), ax = a.x - (A.cols - 1) / 2, bx = b.x - (B.cols - 1) / 2;
      K.q.set(pl.x + (ax + (bx - ax) * e + (r2 - .5) * 9 * arc) * pl.p, pl.y + (a.y + (b.y - a.y) * e + (r3 - .3) * 5 * arc) * pl.p, pl.z + arc * (1 + r2 * 5) * pl.p * 1.6);
      K.v.copy(K.q).project(state.camera);
      K.sw[k] = damp(K.sw[k], 1 - sm(0, .2, Math.hypot((K.v.x - state.pointer.x) * aspect, K.v.y - state.pointer.y)), 10, dt);
      let spin = arc * 3;
      if (s.bk > .003) { const bx2 = (K.v.x - s.bx) * aspect, by2 = K.v.y - s.by, len = Math.hypot(bx2, by2) + 1e-4, amt = s.bk * Math.exp(-len * 1.9) * (.5 + r1); // a click: thrown outward, and it settles again
        K.q.x += bx2 / len * amt * 3; K.q.y += by2 / len * amt * 3 + amt; K.q.z += (r2 - .3) * amt * 5; spin += amt * 5; }
      const born = clamp((on - .3 - r1 * .45) / .2); // the dots come on one by one while the camera pulls back
      K.o.position.set(K.q.x, K.q.y, K.q.z + K.sw[k] * pl.p * .5); K.o.rotation.set(spin * (r2 - .5), spin * (r3 - .5), 0);
      K.o.scale.setScalar(Math.max(1e-4, pl.p * born * (1 - .3 * arc) * (1 + K.sw[k] * .34))); K.o.updateMatrix(); m.setMatrixAt(k, K.o.matrix);
      if (K.toy > .5) K.c.set(TOY_END[(e < .5 ? a.k : b.k) % TOY_END.length]).multiplyScalar(1 + K.sw[k] * .25);
      else { const br = (.86 + .14 * Math.sin(now * 1.3 - a.x * .4 + r1 * 6)) * (1 + K.sw[k] * .6); K.c.setRGB(br, br, br); if (arc > .05) K.c.lerp(K.v.set(1, .35, .12), arc * .8); } // in flight a dot burns orange
      m.setColorAt(k, K.c); }
    m.instanceMatrix.needsUpdate = true; m.instanceColor.needsUpdate = true;
    // where Jay sits: on top of the first figure of the number the scroll is nearest to
    const N = walls[Math.round(f)]; s.roost = {x: pl.x + (N.perch - (N.cols - 1) / 2) * pl.p, y: pl.y + 6.4 * pl.p, z: pl.z, p: pl.p};
    lamp.current.position.set(pl.x, pl.y + 3 * pl.p, pl.z + 2.2); lamp.current.intensity = damp(lamp.current.intensity, game ? 0 : 110 * on, 5, dt);
  });
  return <>
    <instancedMesh ref={ref} name="wall-score" args={[null, null, NDOT]} material={mat} frustumCulled={false} visible={false}><boxGeometry args={[.8, .8, .3]}/></instancedMesh>
    <pointLight ref={lamp} intensity={0} color="#eaf1ff" decay={2}/>
  </>;
}

// The back of the machine. A device says where it comes from on its back, so this one carries his changelog there (patch notes, for the
// game cartridge): where he has worked, newest first. The entry the scroll is at is marked; a row can be pointed at and pressed.
const BK = {w: 1550, h: 950, top: 250, row: 82};
function drawBack(g, choice, logs, cur, hot) {
  const dark = choice === 'product', ink = dark ? '236,238,240' : '46,40,33', a = v => `rgba(${ink},${v})`, acc = choice === 'game' ? '#E9452A' : '#FF5A1F';
  g.clearRect(0, 0, BK.w, BK.h); g.textBaseline = 'middle'; g.textAlign = 'left'; try { g.letterSpacing = '3px'; } catch { /* older canvas */ }
  g.fillStyle = a(.92); g.font = `900 96px "JL Dot",${MONO}`; g.fillText(choice === 'game' ? 'PATCH NOTES' : 'CHANGELOG', 40, 96);
  g.font = `500 26px ${MONO}`; g.fillStyle = a(.55); g.fillText('JL-01  ·  JAY LIN', 44, 178);
  g.textAlign = 'right'; g.fillText(pad(cur + 1) + ' / ' + pad(logs.length), BK.w - 44, 178); g.textAlign = 'left';
  g.fillStyle = a(.3); g.fillRect(40, 216, BK.w - 80, 2);
  logs.forEach((x, i) => { const y = BK.top + i * BK.row + BK.row / 2, on = i === cur;
    if (on) { g.fillStyle = acc; g.fillRect(40, y - 30, 10, 60); }
    g.fillStyle = a(on ? 1 : i === hot ? .8 : .42); g.font = `${on ? 700 : 500} 40px ${MONO}`;
    g.fillText(plateDate(x), 78, y); g.fillText(plateOrg(x), 410, y);
    if (x.href) { g.textAlign = 'right'; g.fillText('↗', BK.w - 46, y); g.textAlign = 'left'; } });
  const yb = BK.top + logs.length * BK.row + 20; g.fillStyle = a(.3); g.fillRect(40, yb, BK.w - 80, 2);
  g.fillStyle = a(.5); g.font = `500 24px ${MONO}`; g.fillText('ARTCENTER BFA 2026  ·  DUKE FUQUA MMS 2027', 44, yb + 44);
  g.textAlign = 'right'; g.fillText('LOS ANGELES', BK.w - 44, yb + 44); g.textAlign = 'left';
}
function BackPlate({S, logs, on}) {
  const K = useMemo(() => { const cv = document.createElement('canvas'); cv.width = BK.w; cv.height = BK.h; return {g: cv.getContext('2d'), tex: texture(cv), key: ''}; }, []);
  useFrame(() => { const s = S.current, key = [s.choice, Math.round(s.c), s.lh, plateOrg(logs[0]), document.fonts && document.fonts.check('900 40px "JL Dot"')].join();
    if (key !== K.key) { K.key = key; drawBack(K.g, s.choice, logs, Math.round(s.c), s.lh); K.tex.needsUpdate = true; } });
  const row = e => clamp(Math.floor(((1 - e.uv.y) * BK.h - BK.top) / BK.row), 0, logs.length - 1), live = () => S.current.tl > .6 && S.current.tp < .4; // only while the back is what you see
  return <group position-z={-PZ} rotation-y={Math.PI}>
    <mesh position-z={.002} onPointerMove={e => { if (live()) { e.stopPropagation(); on.logOver(row(e)); } }} onPointerOut={() => on.logOver(-1)} onClick={e => { if (live()) { e.stopPropagation(); on.log(row(e)); } }}>
      <planeGeometry args={[W - .3, H - .3]}/><meshBasicMaterial map={K.tex} transparent depthWrite={false}/></mesh>
    {[[-1.52, .93], [1.52, .93], [-1.52, -.93], [1.52, -.93]].map(([x, y], i) => <group key={i} position={[x, y, 0]} rotation-z={i * 1.3}>
      <mesh rotation-x={HALF} position-z={.004}><cylinderGeometry args={[.04, .04, .01, 24]}/><meshStandardMaterial color="#8E9095" metalness={1} roughness={.35}/></mesh>
      <mesh position-z={.01}><boxGeometry args={[.056, .011, .004]}/><meshStandardMaterial color="#1c1c20" roughness={.5}/></mesh>
    </group>)}
  </group>;
}

// A case's picture arrives the way the machine would draw it: coarse dots first, then finer, then the picture itself.
function CaseArt({src, alt}) {
  const cv = useRef(), im = useRef();
  useEffect(() => {
    const c = cv.current, img = im.current; if (!c || !img) return undefined;
    let stop = false, timer = 0;
    const run = () => {
      const w = c.width = img.clientWidth, h = c.height = img.clientHeight; if (!w || stop) return;
      const g = c.getContext('2d'), small = document.createElement('canvas'), sg = small.getContext('2d'), steps = [30, 17, 9, 5]; let k = 0;
      g.imageSmoothingEnabled = false; c.style.opacity = 1;
      const draw = () => { if (stop) return; if (k >= steps.length) { c.style.opacity = 0; return; }
        const b = steps[k++], sw = Math.ceil(w / b), sh = Math.ceil(h / b), r = Math.max(sw / img.naturalWidth, sh / img.naturalHeight), iw = img.naturalWidth * r, ih = img.naturalHeight * r;
        small.width = sw; small.height = sh; sg.drawImage(img, (sw - iw) / 2, (sh - ih) / 2, iw, ih);
        g.fillStyle = '#0b0c0f'; g.fillRect(0, 0, w, h); const gap = Math.max(1, Math.round(b * .14));
        for (let y = 0; y < sh; y++) g.drawImage(small, 0, y, sw, 1, 0, y * b, sw * b, b - gap); // rows of dots: a line of the page shows between them
        g.fillStyle = '#0b0c0f'; for (let x = 0; x < sw; x++) g.fillRect(x * b + b - gap, 0, gap, h);
        timer = setTimeout(draw, 120); };
      draw(); };
    if (img.complete && img.naturalWidth) run(); else img.addEventListener('load', run, {once: true});
    return () => { stop = true; clearTimeout(timer); };
  }, [src]);
  return <><img ref={im} src={src} alt={alt}/><canvas ref={cv} className="jl-mosaic"/></>;
}

function Stage({S, to, on, tick, works, side, content, logs, runner, words, lang}) {
  const screen = useMemo(createScreen, []);
  const rig = useRef(), knob = useRef(), lever = useRef(), keys = useRef([]), caps = useRef([]), toys = useRef([]), floor = useRef(), rim = useRef(), key = useRef(), top = useRef(), glow = useRef(), occ = useRef();
  const layer = {face: useRef(), lcd: useRef(), pad: useRef(), pcb: useRef(), cell: useRef(), shell: useRef()};
  const product = useRef(), game = useRef(), wc = useRef([]);
  // scratch values the frame loop reuses. P: the shot the scroll asks for. C: the shot the camera is actually at.
  const K = useMemo(() => ({bg: new THREE.Color(STAGE.product.bg), tmp: new THREE.Color(), aim: new THREE.Color(), wcol: new THREE.Color(), look: new THREE.Vector3(.4, .55, 0),
    pos: new THREE.Vector3(), v: new THREE.Vector3(), n: new THREE.Vector3(), P: {...POSE.hero}, C: {...POSE.hero}, o: {}, wp: {}, push: 0, floor: 1, floorOn: true, gov: null}), []);
  const U = useMemo(() => ({uA: {value: new THREE.Color(STAGE.product.bg)}, uGridCol: {value: new THREE.Color(STAGE.product.grid)}, uC: {value: new THREE.Color(STAGE.product.flood)}, uGlowCol: {value: new THREE.Color('#000')},
    uGrid: {value: 0}, uFlood: {value: 0}, uGlow: {value: 0}, uShift: {value: 0}, uRun: {value: 0}, uRunX: {value: 0}, uO: {value: new THREE.Vector2(.5, .4)}, uG: {value: new THREE.Vector2(.6, .5)}, uRes: {value: new THREE.Vector2(1, 1)}}), []);
  const acc = useRef(1), axis = useRef([]), num = useRef();
  const [floorOn, setFloorOn] = useState(true); // the floor's mirror is a second render of the whole scene, so it only exists while there is a floor to see
  // the centre lines of an exploded drawing: one through each corner screw, as long as the machine is far apart
  const axisGeo = useMemo(() => { const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, 1)]); g.setAttribute('lineDistance', new THREE.Float32BufferAttribute([0, 1], 1)); return g; }, []);
  // the number of the work in front, as tall as the room, on the wall behind the carousel
  const numeral = useMemo(() => { const cv = document.createElement('canvas'); cv.width = 800; cv.height = 500; return {cv, g: cv.getContext('2d'), tex: texture(cv), shown: -1}; }, []);
  // development only: a preview pane that sits in the background gets no animation frames, so the checks drive the loop by hand
  const advance = useThree(st => st.advance), three = useThree(st => st.get);
  useEffect(() => { if (import.meta.env.DEV) window.__jl = Object.assign(window.__jl || {}, {S, three, THREE, pump: (n = 4) => { for (let i = 0; i < n; i++) advance(performance.now()); }}); }, [advance, three, S]);
  // the machine's materials are kept here so a cartridge can change them while you watch
  const M = useMemo(() => {
    const Ph = o => new THREE.MeshPhysicalMaterial(o), s = SKIN.raw;
    const metal = ([color, metalness, roughness], more) => Ph({color, metalness, roughness, ...more});
    return {
      body: metal(s.body), face: metal(s.face, {clearcoat: 1, clearcoatRoughness: .08}),
      knurl: metal(s.knob, {flatShading: true}), knob: metal(s.knob), ring: Ph({color: s.ring, roughness: .4}),
      keys: s.keys.map(c => Ph({color: c, metalness: 1, roughness: .34, clearcoat: .4, clearcoatRoughness: .2, side: THREE.DoubleSide})),
      inkL: new THREE.MeshBasicMaterial({map: inkDecal('rgba(236,238,240,.78)'), transparent: true, depthWrite: false}),
      inkD: new THREE.MeshBasicMaterial({map: inkDecal('rgba(54,47,38,.9)'), transparent: true, depthWrite: false, opacity: 0}),
      chrome: new THREE.MeshStandardMaterial({color: '#E4E6E9', metalness: 1, roughness: .16}),
      streak: streak(), traces: circuit(true),
      axis: new THREE.LineDashedMaterial({color: STAGE.product.grid, dashSize: .016, gapSize: .013, transparent: true, opacity: 0}),
    };
  }, []);

  useFrame((state, dt) => {
    // the picture's resolution follows the machine it runs on (governor.js): fewer pixels when frames run long, if that helps
    if (!(import.meta.env.DEV && window.__jl?.res === 0)) { // (development: window.__jl.res = 0 switches it off for measurements)
      if (!K.gov) K.gov = createGovernor({max: clamp(window.devicePixelRatio || 1, 1, RES_MAX), min: RES_MIN}); // the ceiling is the screen's own, never whatever the canvas happens to be at
      const v = K.gov.frame(performance.now(), document.hidden); if (v != null) on.res(v);
      if (import.meta.env.DEV) window.__jl.gov = K.gov; }
    dt = Math.min(dt, .05); if (import.meta.env.DEV && window.__jl?.fast) dt = .4;
    if (import.meta.env.DEV && window.__jl?.dt) { dt = window.__jl.dt; window.__jl.skew = (window.__jl.skew || 0) + dt; } // development only: a clock the checks can step by hand
    const now = performance.now() / 1000 + ((import.meta.env.DEV && window.__jl?.skew) || 0); tick(now, dt);
    const s = S.current, t = now - s.t0, awake = s.phase !== 'standby';
    const {width, height} = state.size, aspect = width / height, portrait = aspect < .9, narrow = !portrait && aspect < 1.55;
    const snap = s.snap; s.snap = false; // a cut: under a wipe or behind the passing cartridge the new world is simply there
    const st = STAGE[s.choice || 'product'], sk = SKIN[s.choice || 'raw'], gameOn = s.choice === 'game';
    const ease = snap ? 1 : 1 - Math.exp(-3 * dt), slow = snap ? 1 : 1 - Math.exp(-2.2 * dt), k3 = snap ? 1e3 : 3, k6 = snap ? 1e3 : 6;
    const {bg, tmp, aim, wcol, look, pos, v, n, P, C, o} = K;
    s.explode = damp(s.explode, s.explodeTo, snap ? 1e3 : 7, dt);
    // plan: how much of this is the drafting sheet. lg: the room the machine is turned over in. pl: the room of the game. nr: the room of the numbers.
    // wk: the room the works live in. flood: the colour of the last act.
    const open = s.explode, plan = s.t1 * (1 - s.tl) * (1 - s.t2), lg = s.tl * (1 - s.tp) * (1 - s.t2), pl = s.tp * (1 - s.ts) * (1 - s.t2), nr = s.ts * (1 - s.t2), wk = s.t2 * (1 - s.t3), flood = s.flood, flat = plan;

    // the room. A work lends it its colour: the game room floods with it, the product room only takes it as light
    const wi = clamp(s.w, 0, works.length - 1), i0 = Math.floor(wi), i1 = Math.min(works.length - 1, i0 + 1);
    wcol.set(works[i0].color).lerp(tmp.set(works[i1].color), wi - i0);
    aim.set(st.bg).lerp(tmp.set(st.plan), plan).lerp(tmp.set(st.log), lg).lerp(tmp.set(st.play), pl).lerp(tmp.set(st.score), nr); if (gameOn) aim.lerp(wcol, wk * .94);
    bg.lerp(aim, snap ? 1 : 1 - Math.exp(-5 * dt)); U.uA.value.copy(bg); state.scene.fog.color.copy(bg).lerp(tmp.set(st.flood), flood);
    U.uRes.value.set(width, height); U.uShift.value = s.y * 46;
    U.uGrid.value = damp(U.uGrid.value, plan, k6, dt); U.uGridCol.value.set(pl > plan ? st.beat : st.grid);
    U.uRun.value = damp(U.uRun.value, pl, k6, dt); U.uRunX.value = runner.dist * 3;
    U.uGlowCol.value.copy(wcol); U.uGlow.value = damp(U.uGlow.value, gameOn ? 0 : wk * .24, k3, dt);
    U.uFlood.value = flood; U.uC.value.set(st.flood);
    const floorTo = 1 - plan, fl = floor.current; K.floor = damp(K.floor, floorTo, k6, dt); // the last room is flooded with colour, floor and all, but it is still a room
    const need = K.floor > .01 || floorTo > .01; if (need !== K.floorOn) { K.floorOn = need; setFloorOn(need); }
    if (fl) { fl.opacity = K.floor; aim.set(st.floor).lerp(tmp.set(st.log).multiplyScalar(.9), lg).lerp(tmp.set(st.play).multiplyScalar(.8), pl).lerp(tmp.set(st.score).multiplyScalar(gameOn ? 1.2 : 1.7), nr); if (gameOn) aim.lerp(tmp.copy(wcol).multiplyScalar(.8), wk * .94); aim.lerp(tmp.set(st.flood).multiplyScalar(.78), flood);
      fl.color.lerp(aim, fl.userData.seen ? ease : 1); fl.mixStrength = damp(fl.userData.seen ? fl.mixStrength : st.mirror, st.mirror, k3, dt); fl.userData.seen = true; }
    state.scene.environmentIntensity = damp(state.scene.environmentIntensity, st.env * (1 + .2 * flat), k3, dt);
    key.current.intensity = damp(key.current.intensity, (awake ? st.key : 54) * (1 - .15 * flat), k3, dt);
    rim.current.intensity = damp(rim.current.intensity, st.rim * (1 - .7 * flat), k3, dt);
    aim.set(st.rimC); if (!gameOn) aim.lerp(wcol, wk * .7); rim.current.color.lerp(aim, ease);
    top.current.intensity = damp(top.current.intensity, st.top, k3, dt);
    if (post.bloom) post.bloom.strength = damp(post.bloom.strength, (st.bloom + nr * (gameOn ? .24 : -.06)) * (1 - .55 * flat), k3, dt);

    // skin
    const mix = (m, [c, metal, rough]) => { m.color.lerp(tmp.set(c), slow); m.metalness += (metal - m.metalness) * slow; m.roughness += (rough - m.roughness) * slow; };
    mix(M.body, sk.body); mix(M.face, sk.face); M.face.clearcoat += (sk.coat - M.face.clearcoat) * slow;
    mix(M.knurl, sk.knob); mix(M.knob, sk.knob); M.ring.color.lerp(tmp.set(sk.ring), slow);
    M.keys.forEach((m, i) => { m.color.lerp(tmp.set(sk.keys[i]), slow); m.metalness += (sk.keyM - m.metalness) * slow; });
    M.inkL.opacity += (sk.ink - M.inkL.opacity) * slow; M.inkD.opacity += (1 - sk.ink - M.inkD.opacity) * slow;
    caps.current.forEach(c => { if (c) c.scale.z = damp(c.scale.z, sk.keyH, k3 * 2, dt); });
    toys.current.forEach(c => { if (c) c.scale.setScalar(damp(c.scale.x, sk.toy, k3 * 2, dt)); });

    // the shot. hero -> about is one long move (the lens gets longer while the camera climbs). about -> log: the machine closes and turns its back.
    // log -> play: it turns round again and the camera comes in. play -> score: the camera backs away as far as the room goes.
    // score -> work is a cut, behind a cartridge; work -> print is a move again
    const T = shots(gameOn, portrait);
    mixPose(T.hero, T.about, s.t1, P); if (s.tl > 0) mixPose(P, T.log, s.tl, P); if (s.tp > 0) mixPose(P, T.play, s.tp, P); if (s.ts > 0) mixPose(P, T.score, s.ts, P);
    if (s.t2 > 0) mixPose(P, T.work, s.t2, P); if (s.t3 > 0) mixPose(P, T.print, s.t3, P);
    // The tall shots are set for a phone. A screen that is only just taller than wide (a tablet, a small window) has much less height for
    // the same width: there the camera stands further back and looks a little higher, so Jay on top of the machine stays under the bar
    if (portrait) { const sq = clamp((aspect - .5) / .4), top = lg + pl + nr * .6; P.d += 2.6 * sq * top; P.ly += .25 * sq * (lg + pl) + .1 * sq * nr; }
    if (!K.ready) { K.ready = true; Object.assign(C, P); rig.current.rotation.y = P.ry; } // the first frame starts in its shot instead of sliding into it
    for (const k in P) C[k] = damp(C[k], P[k], k6, dt);
    const r = rig.current, cam = state.camera, calm = (1 - .6 * s.t3) * (1 - .55 * plan), mx = state.pointer.x, my = state.pointer.y;
    // a narrower frame: the machine moves a little further to its side. Not in the close shot of the game, which has no room to give,
    // and after the first screen not for the game cartridge, whose shots already stand as far to their side as they can
    r.position.x = C.x + (narrow ? .35 * clamp(C.x, -1, 1) * (1 - s.t3) * (1 - pl) * (gameOn ? 1 - s.t1 : 1) : 0);
    r.rotation.y = damp(r.rotation.y, C.ry + (mx * .09 + Math.sin(now * .55) * .016) * calm, k6, dt);
    r.rotation.x = damp(r.rotation.x, -my * .04 * calm, k6, dt);
    s.shake = damp(s.shake, 0, 9, dt); s.flash = damp(s.flash, 0, 4, dt); s.bk = damp(s.bk, 0, 2.2, dt); glow.current.color.setScalar(1.45 + s.flash * 1.7);
    if (!window.__jlFirstFrame) window.__jlFirstFrame = Math.round(performance.now());
    K.push = damp(K.push, s.phase === 'boot' ? .6 : 0, 5, dt);
    const fit = portrait ? Math.max(0, .9 - aspect) * 11.5 : narrow ? 1.1 : 0;
    const dist = (C.d + fit) * LENS / Math.tan(C.fov * RAD / 2) - K.push;
    let fov = C.fov;
    const ly = C.ly - (portrait ? plan * Math.max(0, .9 - aspect) * 1.8 : 0); // a narrow phone has the words lower down: lift the drawing clear of them
    look.set(C.lx + Math.sin(now * 90) * .02 * s.shake, ly + Math.cos(now * 70) * .035 * s.shake, 0);
    pos.set(mx * .22 * calm, ly + Math.sin(C.el) * dist + my * .1 * calm, Math.cos(C.el) * dist); // the camera leans a little with the pointer
    // falling into the screen: when a work cartridge goes in, the camera goes in after it, and the lens opens up as it falls
    s.dive = s.ins ? (s.ins.t0 === 0 ? 1 : Math.pow(clamp((now - s.ins.t0 - .42) / .8), 3)) : damp(s.dive, 0, 3.4, dt);
    if (import.meta.env.DEV && window.__jl?.dive != null) s.dive = window.__jl.dive;
    r.updateWorldMatrix(true, false);
    if (s.dive > .001) {
      v.set(SCR.x, SCR.y, PZ).applyMatrix4(r.matrixWorld); n.set(0, 0, 1).transformDirection(r.matrixWorld);
      const dz = Math.min(SCR.h, SCR.w / aspect) * .86 / (2 * Math.tan(26 * RAD));
      pos.lerp(n.multiplyScalar(dz).add(v), s.dive); look.lerp(v, s.dive); fov += (52 - fov) * s.dive;
    }
    cam.position.copy(pos); if (Math.abs(cam.fov - fov) > .001) { cam.fov = fov; cam.updateProjectionMatrix(); } cam.lookAt(look);
    state.scene.fog.near = dist * .95; state.scene.fog.far = dist + 17;

    // the machine's parts: they come apart with the scroll, and the one being talked about steps forward
    PARTS.forEach(([k], i) => { s.lift[i] = damp(s.lift[i], s.part === i ? .4 * open : 0, 8, dt); });
    for (const k in LAYER) layer[k].current.position.z = LAYER[k][0] + open * LAYER[k][1];
    PARTS.forEach(([k], i) => { layer[k].current.position.z += s.lift[i]; });
    const z0 = LAYER.shell[1] * open - .3, z1 = LAYER.face[1] * open + .3;
    M.axis.opacity = plan * sm(.45, 1, open) * .75; M.axis.color.set(st.grid);
    axis.current.forEach(l => { if (l) { l.visible = M.axis.opacity > .01; l.position.z = z0; l.scale.z = z1 - z0; } });
    s.knob = damp(s.knob, s.knobTo, 10, dt); knob.current.rotation.z = -s.knob;
    lever.current.rotation.x = damp(lever.current.rotation.x, s.choice === 'game' ? .5 : s.choice === 'product' ? -.5 : 0, 12, dt);
    keys.current.forEach((b, i) => { s.press[i] = damp(s.press[i], 0, 9, dt); if (b) b.position.z = FZ - s.press[i] * .035; });

    // The two role cartridges belong to the first screen. Jay keeps the left end of the machine, so they wait to the right of him.
    // The one that is chosen comes over the slot and drops once the slot is empty; the other parks high on the right. Whenever two
    // of them have to pass, the one that is leaving takes the lane behind, so they never go through each other (or through him).
    const hero = 1 - sm(.12, .5, s.y);
    [[product, 'product', -1, game], [game, 'game', 1, product]].forEach(([ref, k, sgn, other]) => {
      const c = ref.current, o2 = other.current, bob = Math.sin(now * 1.4 + sgn) * .04;
      let x = sgn < 0 ? -.1 : 1.18, y = 2.08 + bob, z = .12, rz = -sgn * .12, rx = -.2, ry = 0, sc = .92 * hero, speed = 6, lane = 6;
      if (!awake) { y = 4.4; sc = 0; if (to.side === k) { x = .12; y = 1.9 + bob; z = .08; rz = -.1; rx = -.26; sc = 1; } } // a visit that arrives with ?to= sees its cartridge waiting
      else if (s.choice === k) { // chosen: a beat to let the other one step back, then over the slot, then down into it
        const go = now - s.tc > .16, free = o2.scale.x < .05 || o2.position.y > 1.66 || Math.abs(o2.position.x) > .7, drop = now - s.tc > .4 && free && Math.abs(c.position.x) < .12;
        x = go ? 0 : c.position.x; z = open * LAYER.shell[1] + (drop ? 0 : .12); rz = 0; rx = 0; y = (drop ? 1.13 : go ? 2.04 : c.position.y + .02) + s.ring * 2.6; sc = 1 - s.t2; speed = drop ? 18 : 10; lane = 12; }
      else if (s.choice) { // the spare: straight up out of the slot first, then along the lane behind to where it parks
        if (c.position.y < 1.64 && Math.abs(c.position.x) < .5 && c.scale.x > .5) { x = 0; y = 2.1; z = c.position.z; rz = 0; rx = 0; sc = 1; speed = 14; }
        else { x = 1.5; y = 2.3 + bob; z = Math.abs(c.position.x - 1.5) > .35 ? -.62 : .1; rz = -.2; rx = -.08; sc = .66 * hero; lane = 14; } }
      else if (s.pick === k) { y += .14; sc = 1.04 * hero; rz *= .3; rx = -.1 - my * .12; ry = (mx - sgn * .2) * .3; } // the one under the pointer turns to face it
      c.position.set(damp(c.position.x, x, speed, dt), damp(c.position.y, y, speed, dt), damp(c.position.z, z, lane, dt));
      c.rotation.set(damp(c.rotation.x, rx, 9, dt), damp(c.rotation.y, ry, 7, dt), damp(c.rotation.z, rz, 7, dt));
      c.scale.setScalar(damp(c.scale.x, Math.max(.001, sc), snap ? 1e3 : 8, dt)); c.visible = c.scale.x > .02;
    });

    // selected work: the cartridges ride a carousel above the slot; the scroll turns it, the one in front can go in
    wc.current.forEach((c, i) => { if (!c) return;
      const d = i - s.w, ad = Math.abs(d), near = ad < .5, far = sm(.12, .45, ad), ins = s.ins && s.ins.i === i, hot = s.hv === i && !s.ins, come = sm(0, 1, clamp(s.ring * 1.5 - ad * .17));
      ringAt(d, o);
      let x = o.x, z = o.z, ry = o.ry, rx = hot && !near ? -.14 : 0, y = 2.12 + (1 - come) * 3.4 + Math.sin(now * 1.3 + i) * .03 - .06 + .16 * far + (hot ? .1 : 0), speed = 9;
      let sc = i < works.length && ad < 3.3 ? Math.min(1, s.ring * 3) * (1 - .14 * far) * (hot ? 1.06 : 1) * (1 - s.gone) : 0; // at the end they shrink where they stand, as their dots leave
      if (gameOn) { const up = 1 - sm(.18, .5, ad); x = d * 1.45; z = 1.5; ry = 0; rx = -HALF + .55 * up; y = -H / 2 + .08 + .52 * up + (1 - come) * 3.4 + (hot && !near ? .12 : 0); } // the game cartridge lays them on the floor like stepping stones; the one in front stands up
      if (ins) { x = 0; z = 0; ry = 0; rx = 0; sc = 1; y = now - s.ins.t0 > .26 ? 1.2 : 2.0; speed = 18; }
      c.position.set(damp(c.position.x, x, speed, dt), damp(c.position.y, y, speed, dt), damp(c.position.z, z, speed, dt));
      c.rotation.y = damp(c.rotation.y, ry, 9, dt); c.rotation.x = damp(c.rotation.x, rx, 9, dt);
      c.scale.setScalar(damp(c.scale.x, Math.max(.001, sc), 9, dt)); c.visible = c.scale.x > .02;
    });

    // Jay's perch. He is always somewhere, and always on something: the left end of the machine (he rides its shell when it comes apart),
    // the part being read, the top of a number, the knob (it turns under him while the works go round), the stepping stone behind the
    // cartridge in front, a cartridge on its way into the slot, and at the end the top of the last wall.
    let jx = -1.3, jy = H / 2, jz = layer.shell.current.position.z, jr = r.rotation.y, jk = 1, walk = 0;
    if (s.m > .93) { const pw = wallPlace('end', gameOn, aspect, K.wp); wallDot(pw, ROOST[gameOn || portrait ? 1 : 0], gameOn ? 1 : 0, now, v); v.y += (gameOn ? .54 : .4) * pw.p; jr = pw.ry; jk = clamp(pw.p / .2, .62, 1); } // the blocks are down: up he goes (a small wall gets a smaller bird)
    else if (nr > .5 && s.roost) { v.set(s.roost.x, s.roost.y, s.roost.z); jr = 0; jk = clamp(s.roost.p / .3, 1, 1.6); } // a long way off and small in the frame: a bigger bird
    else { if (s.t2) { const c = wc.current[Math.min(works.length - 1, Math.round(s.w))];
        if (gameOn) { const j = Math.round(s.w) - 1; jx = (j - s.w) * 1.45; jy = -H / 2 + (j >= 0 ? .146 + (s.hv === j && !s.ins ? .12 : 0) : 0); jz = 1.5; } // one stone behind the cartridge in front: he crosses the floor with the scroll
        else if (c && s.ins) { jx = c.position.x; jy = c.position.y + .49 * c.scale.y; jz = c.position.z; } // he rides a cartridge only on its way into the slot
        else { jx = KNOB.x; jy = KNOB.y + .3; jz = FZ + .15; walk = Math.abs(s.knobTo - s.knob) > .012 ? 1 : 0; } }
      else if (plan > .5 && s.part >= 0) { const k = PARTS[s.part][0]; jx = SEAT[k]; jy = TOPS[k]; jz = layer[k].current.position.z + (k === 'face' || k === 'lcd' ? PZ : 0); }
      else if (lg > .5) jr += Math.PI; // the machine has its back to the camera; he does not
      v.set(jx, jy, jz).applyMatrix4(r.matrixWorld); }
    s.jay.x = v.x; s.jay.y = v.y; s.jay.z = v.z; s.jay.ry = jr; s.jay.walk = walk; s.jay.k = damp(s.jay.k || 1, jk, 6, dt); s.jay.hide = s.dive > .4 || (s.cover > .3 && s.cover < .7);

    // where things are on the page: the screen (dot wipes start there), the paper slot (the receipt and the flood come out of it), the light pool
    cam.updateMatrixWorld();
    const px = (x, y, z) => { v.set(x, y, z).applyMatrix4(r.matrixWorld).project(cam); return [(v.x * .5 + .5) * width, (-v.y * .5 + .5) * height]; };
    [s.sx, s.sy] = px(SCR.x, SCR.y, PZ);
    const a = px(-1.36, H / 2, 0), b = px(1.36, H / 2, 0), g2 = px(0, 2.2, -1.4);
    if (s.t3 > .001) on.slot((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, b[0] - a[0]);
    U.uO.value.set((a[0] + b[0]) / 2 / width, 1 - (a[1] + b[1]) / 2 / height); U.uG.value.set(g2[0] / width, 1 - g2[1] / height);

    // the cartridge that passes the lens between "about" and "work". It rides with the camera, so the cut behind it cannot be seen
    const oc = occ.current, cv = s.cover;
    if (cv > 0 && cv < 1) {
      // big enough to hide the whole frame while its label, which sits above its middle, is centred in it
      const zc = 2.2, hV = 2 * zc * Math.tan(cam.fov * RAD / 2), sc = Math.max(1.14 * hV * aspect / 1.2, 1.46 * hV), travel = hV / 2 + .64 * sc;
      oc.visible = true; oc.position.copy(cam.position); oc.quaternion.copy(cam.quaternion);
      oc.translateZ(-zc); oc.translateY(travel * (1 - 2 * cv) - .135 * sc); oc.rotateZ((.5 - cv) * .1); oc.rotateX((.5 - cv) * .5); oc.scale.setScalar(sc);
    } else oc.visible = false;

    // the numeral behind the carousel, white on the dark room. The game cartridge looks down at the floor, where a wall behind the machine
    // would only show its bottom edge, so there it is left out: the count is on the machine's screen
    const nm = num.current;
    // On a tall screen the carousel and the machine stand in front of it and only scraps of the figure would show: left out there too
    nm.material.opacity = damp(nm.material.opacity, gameOn || portrait ? 0 : wk * (1 - s.gone) * (1 - s.dive) * .06, k6, dt); nm.visible = nm.material.opacity > .004;
    nm.position.set(-1.9, 1.75, -3.6);

    const playing = pl > .5 && s.phase === 'on';
    if (playing) runner.step(Math.min(dt, .05)).forEach(on.run);
    acc.current += dt; // a dot matrix does not need more than 15 frames a second, except when there is a game on it
    if (acc.current > 1 / (playing ? 30 : 15)) { acc.current = 0;
      const i = Math.round(s.w), part = Math.max(0, s.part);
      const want = i + (document.fonts && document.fonts.check('900 40px "JL Dot"') ? 100 : 0);
      if (numeral.shown !== want) { numeral.shown = want; const g = numeral.g; g.clearRect(0, 0, 800, 500); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.font = '900 520px "JL Dot",ui-monospace,monospace'; g.fillText(pad(i + 1), 400, 262); numeral.tex.needsUpdate = true; }
      const mode = s.phase !== 'on' ? s.phase : s.ins ? (now - s.ins.t0 < .9 ? 'load' : 'work') : playing ? 'run' : nr > .5 ? 'score' : s.print > .01 || s.gone > .6 ? 'print' : s.ring > .5 ? 'work' : open > .3 && s.part >= 0 ? 'who' : s.choice ? 'hello' : 'choose';
      screen.draw({phase: mode, t: mode === 'load' ? now - s.ins.t0 : t, now, side: s.choice, pick: s.pick, company: to.company, part, label: PARTS[part][1], work: works[i], index: i, total: works.length, print: s.print, run: runner, score: SCORES[content][Math.round(s.n)].text, num: Math.round(s.n)}); }
  });

  const tag = i => <group position={PARTS[i][3]}><Html zIndexRange={[4, 0]} style={{pointerEvents: 'none'}}><div className="jl-tag" data-i={i}><b>{pad(i + 1)}<em> {PARTS[i][1]}</em></b><span>{words.about.parts[i]}</span></div></Html></group>;
  const point = (k, arg) => ({onPointerOver: e => { e.stopPropagation(); on.tipKey(k, arg); }, onPointerOut: () => on.tip('')});
  // once the machine is apart, pointing at a part is the same as reading its line in the list
  const part = i => ({onPointerOver: e => { if (S.current.explode > .6) { e.stopPropagation(); on.part(i); } }, onPointerOut: () => on.part(null)});
  return <>
    <fog attach="fog" args={[STAGE.product.bg, 12, 30]}/>
    <Backdrop U={U}/>
    {/* the studio: softboxes that only exist as reflections and soft fill */}
    <Environment resolution={512} frames={1}>
      <color attach="background" args={['#030304']}/>
      <Lightformer form="rect" intensity={4} position={[0, 7, 1]} scale={[12, 7, 1]} target={[0, 0, 0]}/>
      <Lightformer form="rect" intensity={14} color="#cfe0ff" position={[7, 2, -6]} scale={[1.4, 9, 1]} target={[0, 0, 0]}/>
      <Lightformer form="rect" intensity={7} color="#dfe8ff" position={[-8, 3, -4]} scale={[1.2, 9, 1]} target={[0, 0, 0]}/>
      <Lightformer form="rect" intensity={2.6} color="#fff2e0" position={[-6, 2.5, 7]} scale={[7, 5, 1]} target={[0, 0, 0]}/>
      <Lightformer form="rect" intensity={1.6} position={[6, .5, 8]} scale={[3, 6, 1]} target={[0, 0, 0]}/>
    </Environment>
    <ambientLight intensity={.06}/>
    <spotLight ref={rim} position={[5.5, 3.6, -4.5]} angle={.42} penumbra={1} intensity={230} color="#cfe0ff"/>
    <spotLight ref={top} position={[-4, 5.5, -3.5]} angle={.45} penumbra={1} intensity={70} color="#dfe8ff"/>
    <spotLight ref={key} position={[-5, 5, 7]} angle={.5} penumbra={1} intensity={54} color="#fff1dd"/>

    {/* a polished studio floor: it reflects the machine and fades into the backdrop */}
    {floorOn && <mesh rotation-x={-HALF} position-y={-H / 2 - .003} renderOrder={-10}><planeGeometry args={[70, 70]}/>
      <MeshReflectorMaterial ref={floor} transparent opacity={0} resolution={1024} blur={[360, 110]} mixBlur={1} mixStrength={5} mirror={.55} roughness={.82} metalness={.25}
        depthScale={.9} minDepthThreshold={.5} maxDepthThreshold={1.3} color={STAGE.product.floor}/></mesh>}
    <ContactShadows position={[0, -H / 2, 0]} opacity={.7} scale={16} blur={2.2} far={3.4} resolution={512}/>

    <group ref={rig} position={[1.5, 0, 0]} rotation={[0, -.4, 0]}>
      {/* back shell */}
      <group ref={layer.shell} name="L-shell">
        <RoundedBox args={[W, H, D]} radius={.15} smoothness={12} material={M.body}/>
        <mesh geometry={GEO.cavity} position-z={PZ + .0005}><meshStandardMaterial color="#0b0c0e" roughness={.8}/></mesh>
        <mesh position={[0, H / 2 + .001, 0]}><boxGeometry args={[1.28, .02, .16]}/><meshStandardMaterial color="#060607" roughness={.7}/></mesh>
        <BackPlate S={S} logs={logs} on={on}/>
      </group>
      {/* battery */}
      <group ref={layer.cell} name="L-cell" position-z={PZ} {...part(4)}>
        <RoundedBox args={[1.9, 1.1, .14]} radius={.04} smoothness={5} position={[-.3, 0, -.07]}><meshStandardMaterial color="#C3C6CB" metalness={.9} roughness={.34}/></RoundedBox>
        <mesh position={[.52, 0, -.07]}><boxGeometry args={[.07, 1.1, .144]}/><meshStandardMaterial color="#FF5A1F" roughness={.5}/></mesh>
        {tag(4)}
      </group>
      {/* main board */}
      <group ref={layer.pcb} name="L-pcb" position-z={PZ} {...part(3)}>
        <mesh geometry={GEO.pcb}><meshStandardMaterial color="#0e1c17" roughness={.55} metalness={.1}/></mesh>
        <mesh position={[0, 0, .025]}><planeGeometry args={[W - .56, H - .54]}/><meshBasicMaterial map={M.traces} transparent opacity={.75}/></mesh>
        <mesh position={[.3, .1, .05]}><boxGeometry args={[.5, .5, .05]}/><meshStandardMaterial color="#0a0a0c" roughness={.4}/></mesh>
        <mesh position={[.3, .1, .076]}><planeGeometry args={[.34, .34]}/><meshStandardMaterial color="#8d9096" metalness={1} roughness={.4}/></mesh>
        {[[-.9, .5, .3, .14], [-.4, -.55, .18, .18], [-1.1, -.3, .12, .3], [1.0, -.5, .26, .12], [.95, .55, .14, .14]].map(([x, y, w, h], i) =>
          <mesh key={i} position={[x, y, .04]}><boxGeometry args={[w, h, .04]}/><meshStandardMaterial color={i % 2 ? '#1b1c20' : '#b9bbc0'} metalness={i % 2 ? .2 : 1} roughness={.4}/></mesh>)}
        {tag(3)}
      </group>
      {/* button membrane */}
      <group ref={layer.pad} name="L-pad" position-z={PZ} {...part(2)}>
        <mesh geometry={GEO.pad}><meshPhysicalMaterial color="#ECEAE4" roughness={.7} transparent opacity={.93}/></mesh>
        {KEYX.map((x, i) => <mesh key={i} position={[x, KEYY, .018]} scale={[1, 1, .4]}><sphereGeometry args={[.1, 24, 14]}/><meshPhysicalMaterial color="#F4F2EC" roughness={.6}/></mesh>)}
        <mesh position={[KNOB.x, KNOB.y, .019]}><ringGeometry args={[.1, .3, 48]}/><meshStandardMaterial color="#DAD8D1" roughness={.7}/></mesh>
        {tag(2)}
      </group>
      {/* display module */}
      <group ref={layer.lcd} name="L-lcd" {...part(1)}>
        <mesh geometry={GEO.module} position={[SCR.x, SCR.y, PZ - .045]}><meshStandardMaterial color="#17191d" roughness={.5} metalness={.3}/></mesh>
        <mesh position={[SCR.x - .3, SCR.y - SCR.h / 2 - .2, PZ - .03]}><boxGeometry args={[.42, .26, .008]}/><meshStandardMaterial color="#D9A441" metalness={1} roughness={.35}/></mesh>
        <mesh geometry={GEO.bezel} position={[0, 0, PZ + .002]}><meshStandardMaterial color="#060708" roughness={.3} metalness={.3}/></mesh>
        <mesh position={[SCR.x, SCR.y, PZ + .0115]} onPointerDown={e => { if (on.playing()) { e.stopPropagation(); on.jump(); } }}><planeGeometry args={[SCR.w, SCR.h]}/><meshBasicMaterial ref={glow} map={screen.tex} color={[1.45, 1.45, 1.45]}/></mesh>
        {tag(1)}
      </group>
      {/* the face: glass, knob, toggle, keys */}
      <group ref={layer.face} name="L-face" {...part(0)}>
        <mesh geometry={GEO.face} position-z={PZ + .006} material={M.face}/>
        <mesh position={[SCR.x, SCR.y, FZ - .001]}><planeGeometry args={[WIN.w, WIN.h]}/><meshPhysicalMaterial color="#000" transparent opacity={.08} roughness={.03} clearcoat={1} envMapIntensity={2.4}/></mesh>
        <mesh position={[SCR.x, SCR.y, FZ]}><planeGeometry args={[WIN.w, WIN.h]}/><meshBasicMaterial map={M.streak} transparent opacity={.45} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh>
        <mesh position={[0, 0, FZ + .0012]} material={M.inkL}><planeGeometry args={[W, H]}/></mesh>
        <mesh position={[0, 0, FZ + .0014]} material={M.inkD}><planeGeometry args={[W, H]}/></mesh>

        <group position={[KNOB.x, KNOB.y, FZ]} {...point('knob')}>
          <mesh rotation-x={HALF} position-z={.012} material={M.ring}><cylinderGeometry args={[.365, .365, .024, 72]}/></mesh>
          <group ref={knob}>
            <mesh rotation-x={HALF} position-z={.145} geometry={GEO.knurl} material={M.knurl}/>
            <mesh rotation-x={HALF} position-z={.2825} material={M.knob}><cylinderGeometry args={[.296, .33, .035, 72, 1, true]}/></mesh>
            <mesh position-z={.3} material={M.knob}><circleGeometry args={[.296, 72]}/></mesh>
            <mesh position={[0, .18, .303]}><boxGeometry args={[.022, .1, .006]}/><meshStandardMaterial color="#FFF6EC" roughness={.4}/></mesh>
          </group>
        </group>

        <group position={[TOG.x, TOG.y, FZ]} {...point('swap')} onClick={e => { e.stopPropagation(); on.flip(); }}>
          <mesh rotation-x={HALF} position-z={.003}><cylinderGeometry args={[.1, .1, .006, 40]}/><meshStandardMaterial color="#8E9095" metalness={1} roughness={.4}/></mesh>
          <mesh rotation-x={HALF} rotation-z={.5} position-z={.018} material={M.chrome}><cylinderGeometry args={[.078, .078, .026, 6]}/></mesh>
          <mesh rotation-x={HALF} position-z={.04}><cylinderGeometry args={[.042, .048, .028, 28]}/><meshStandardMaterial color="#C2C4C8" metalness={1} roughness={.3}/></mesh>
          <group ref={lever} position-z={.036}>
            <mesh rotation-x={HALF} position-z={.09} material={M.chrome}><cylinderGeometry args={[.031, .019, .18, 28]}/></mesh>
            <mesh position-z={.18} scale={[1, 1, .85]} material={M.chrome}><sphereGeometry args={[.031, 28, 18]}/></mesh>
          </group>
        </group>

        {KEYX.map((x, i) => <group key={i} position={[x, KEYY, 0]}>
          <mesh position-z={FZ + .002}><ringGeometry args={[.102, .122, 48]}/><meshBasicMaterial color="#000" transparent opacity={.35}/></mesh>
          <group ref={el => { keys.current[i] = el; }} position-z={FZ} {...point('key', i + 1)} onPointerDown={e => { e.stopPropagation(); on.button(i); }}>
            <mesh ref={el => { caps.current[i] = el; }} rotation-x={HALF} geometry={GEO.cap} material={M.keys[i]} scale={[1, 1, .42]}/>
          </group>
        </group>)}

        {/* screws only show on the game skin: a toy is allowed to show how it is put together */}
        {[[-1.52, .93], [1.52, .93], [-1.52, -.93], [1.52, -.93]].map(([x, y], i) => <group key={i} ref={el => { toys.current[i] = el; }} position={[x, y, FZ]} rotation-z={i * 1.1} scale={.001}>
          <mesh rotation-x={HALF} position-z={.004}><cylinderGeometry args={[.045, .045, .012, 28]}/><meshStandardMaterial color="#B4B5B3" metalness={1} roughness={.3}/></mesh>
          <mesh position-z={.011}><boxGeometry args={[.064, .012, .004]}/><meshStandardMaterial color="#26262a" roughness={.5}/></mesh>
          <mesh position-z={.011}><boxGeometry args={[.012, .064, .004]}/><meshStandardMaterial color="#26262a" roughness={.5}/></mesh>
        </group>)}
        {tag(0)}
      </group>

      <Cartridge side="product" to={to} innerRef={product} on={on}/>
      <Cartridge side="game" to={to} innerRef={game} on={on}/>
      {works.map((w, i) => <WorkCart key={w.side + w.short} w={w} n={i + 1} i={i} innerRef={el => { wc.current[i] = el; }} on={on}/>)}
      <Dots S={S} works={works} game={side === 'game'}/>
      {[[-1.52, .93], [1.52, .93], [-1.52, -.93], [1.52, -.93]].map(([x, y], i) => <line key={'axis' + i} ref={el => { axis.current[i] = el; }} geometry={axisGeo} material={M.axis} position={[x, y, 0]} visible={false}/>)}
    </group>
    <DotWall S={S} kind="name"/>
    <DotWall S={S} kind="end"/>
    <ScoreWall S={S} content={content}/>
    <VoxelJay S={S} on={on}/>
    <mesh ref={num} position={[-1.9, 1.75, -3.6]} visible={false}><planeGeometry args={[5.6, 3.5]}/><meshBasicMaterial map={numeral.tex} transparent opacity={0} depthWrite={false} toneMapped={false}/></mesh>
    <Occluder innerRef={occ} side={side} n={works.length} words={words.work} cjk={lang !== 'en'}/>
    <Post/>
  </>;
}

const show = (el, o, ty = 0) => { if (!el) return; el.style.opacity = o.toFixed(3); el.style.visibility = o < .01 ? 'hidden' : 'visible'; el.style.transform = `translate3d(0,${ty.toFixed(1)}px,0)`; };

// The cartridge switch. Its key carries a small pixel picture, a prompt for product and a d-pad for game;
// when the key crosses over, the picture breaks into its dots and comes back together as the other one.
const ICON = {
  product: ['.......', '.X.....', '..X....', '...X...', '..X....', '.X..XXX', '.......'],
  game: ['.......', '...X...', '...X...', '.XXXXX.', '...X...', '...X...', '.......'],
  none: ['.......', '.......', '.X.X.X.', '.......', '.X.X.X.', '.......', '.......'],
};
const iconDots = k => { const out = []; ICON[k].forEach((row, y) => [...row].forEach((c, x) => { if (c === 'X') out.push([x, y]); })); return out; };
function RoleSwitch({choice, onChoose, labels, swap}) {
  const cv = useRef(), mem = useRef({at: iconDots('none'), raf: 0});
  useEffect(() => {
    const m = mem.current, g = cv.current.getContext('2d'), a = m.at, b = iconDots(choice || 'none'), n = Math.max(a.length, b.length), t0 = performance.now();
    const seed = Array.from({length: n}, () => [Math.random() * 6.28, .5 + Math.random() * 1.7, Math.random() * .3]);
    m.at = b; cancelAnimationFrame(m.raf);
    const frame = now => {
      const T = Math.min(1, (now - t0) / 640); g.clearRect(0, 0, 84, 84); g.fillStyle = choice === 'game' ? '#1A1612' : '#F4F5F6';
      for (let i = 0; i < n; i++) { const p = a[i % a.length], q = b[i % b.length], [ang, far, late] = seed[i], t = clamp((T - late) / (1 - late)), e = t * t * (3 - 2 * t), out = Math.sin(e * Math.PI) * far;
        g.fillRect(Math.round((p[0] + (q[0] - p[0]) * e + Math.cos(ang) * out) * 12 + 1), Math.round((p[1] + (q[1] - p[1]) * e + Math.sin(ang) * out) * 12 + 1), 10, 10); }
      if (T < 1) m.raf = requestAnimationFrame(frame);
    };
    m.raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(m.raf);
  }, [choice]);
  return <div className="jl-role" data-on={choice || ''}>
    <button className="lab" aria-pressed={choice === 'product'} onClick={e => onChoose('product', e)}>{labels.product}</button>
    <button className="sw" aria-label={swap} data-cur={swap} onClick={e => onChoose(choice === 'product' ? 'game' : 'product', e)}><i><canvas ref={cv} width={84} height={84}/></i></button>
    <button className="lab" aria-pressed={choice === 'game'} onClick={e => onChoose('game', e)}>{labels.game}</button>
  </div>;
}

// lang: the site's language. embedded: this is the site's home (the site's own bar is above it, pages open over it). covered: one of those pages is open.
// onOpen(path): open a page of the site the way the site does; answers whether it took the path.
export default function JL01({lang = 'zh', embedded = false, covered = false, onOpen}) {
  const T = COPY[lang === 'en' ? 'en' : 'zh'], music = useMusic();
  const to = useMemo(parseTo, []);
  const saved = useMemo(() => { try { const v = sessionStorage.getItem('jl-side'); return v === 'game' || v === 'product' ? v : null; } catch { return null; } }, []);
  const [phase, setPhase] = useState(saved ? 'on' : 'standby'), [choice, setChoice] = useState(saved), [pick, setPick] = useState(saved || to.side || 'product'), [muted, setMuted] = useState(false);
  const [sec, setSec] = useState(0), [part, setPart] = useState(-1), [wi, setWi] = useState(0), [open, setOpen] = useState(null), [copied, setCopied] = useState(false);
  const [got, setGot] = useState([false, false, false]), [demo, setDemo] = useState(true), [cleared, setCleared] = useState(false); // the game: which letters have been taken, and who is playing
  // Jay's words. quip: what he says when poked. nap: he has dozed off. printed: the receipt is out. seen / clock: what this visit did, for the receipt
  const [ci, setCi] = useState(0), [ni, setNi] = useState(0); // which entry of the changelog, which number
  const [res, setRes] = useState(() => clamp(window.devicePixelRatio || 1, 1, RES_MAX)); // the canvas's resolution; the stage lowers it when frames run long
  const [quip, setQuip] = useState(null), [nap, setNap] = useState(false), [printed, setPrinted] = useState(false), [seen, setSeen] = useState(0), [clock, setClock] = useState('00:00');
  const touch = useMemo(() => matchMedia('(hover: none)').matches, []), tall = useMemo(() => matchMedia('(max-aspect-ratio: 9/10)'), []);
  const list = useMemo(() => (choice ? WORKS[choice] : MIXED), [choice]);
  const lay = useRef(null); lay.current = useMemo(() => layout(list), [list]);
  const S = useRef(null);
  if (!S.current) S.current = {phase: saved ? 'on' : 'standby', t0: performance.now() / 1000, tb: performance.now() / 1000, last: performance.now() / 1000, nap: false, poke: 0, tc: 0, pick: saved || to.side || 'product', choice: saved, press: [0, 0, 0, 0], lift: [0, 0, 0, 0, 0],
    knob: 0, knobTo: 0, kick: 0, shake: 0, flash: 0, bx: 0, by: 0, bk: 0, explode: 0, explodeTo: 0, t1: 0, tl: 0, tp: 0, ts: 0, t2: 0, t3: 0, c: 0, n: 0, lh: -1, roost: null, jay: {x: 0, y: 0, z: 0, ry: 0, hide: false, sx: 0, sy: 0, on: 0}, jayKick: 0, jaySay: null, jayFlip: 0, cover: 0, flood: 0, m: 0, dive: 0, ring: 0, gone: 0, w: 0, hv: -1, print: 0, part: -1, y: 0, ins: null, busy: false, hop: 0, sx: 0, sy: 0};
  const el = useRef({}).current, grab = k => n => { el[k] = n; }; // the nodes the frame loop writes to without asking React
  const hov = useRef(null), wipe = useRef(() => {}), timers = useRef([]), live = useRef({}), runner = useRef(null), opened = useRef(new Set()), quipT = useRef(0);
  if (!runner.current) runner.current = createRunner();
  if (import.meta.env.DEV) window.__jl = Object.assign(window.__jl || {}, {runner: runner.current, setRes}); // development only, see Stage
  live.current = {open, sec, T, lang, embedded, covered};

  // everything the visitor can do. The scene reads S every frame; React only redraws the words.
  const act = useMemo(() => {
    const now = () => performance.now() / 1000 + ((import.meta.env.DEV && window.__jl?.skew) || 0), later = (ms, fn) => timers.current.push(setTimeout(fn, ms));
    const top = y => scrollTo({top: y * innerHeight, behavior: 'smooth'});
    const inkOn = c => (lum(c) > .5 ? '#14110D' : '#F2F2EF');
    const see = w => { opened.current.add(w.side + w.short); setSeen(opened.current.size); }; // the receipt counts the cartridges that were actually opened
    const a = {
      boot() {
        const s = S.current; if (s.phase !== 'standby') return;
        sfx.click(); sfx.boot(); s.press[2] = 1; s.flash = 1; s.phase = 'boot'; s.t0 = s.tb = now(); setPhase('boot');
        later(1500, () => { s.phase = 'on'; s.t0 = now(); s.jayKick = 1; s.jaySay = '!'; setPhase('on'); if (to.side && !s.choice) a.choose(to.side); });
      },
      pickSide(side) { const s = S.current; if (s.choice || s.pick === side) return; sfx.hover(); s.pick = side; setPick(side); },
      // a cartridge decides which Jay this is. On the first screen you watch it go in; anywhere else the dots carry the change.
      choose(side, at) {
        const s = S.current; if (s.phase === 'standby') { a.boot(); return; } if (s.phase !== 'on' || s.choice === side || s.busy) return;
        const set = () => { s.choice = side; s.pick = side; s.tc = now(); setChoice(side); setPick(side); try { sessionStorage.setItem('jl-side', side); } catch { /* private window */ } };
        sfx.click();
        if (s.y < .35) { set(); later(430, () => { sfx.thunk(); s.shake = 1; s.flash = .8; s.jayKick = 1; s.jaySay = 'note'; }); }
        else { s.busy = true; sfx.wipe(); const c = STAGE[side].bg;
          wipe.current({color: c, ink: inkOn(c), label: side === 'game' ? 'GAME' : 'PRODUCT', sub: live.current.T.wipe[side], x: at ? at.x : innerWidth - 150, y: at ? at.y : 44,
            mid: () => { set(); s.tc = 0; s.snap = true; sfx.thunk(); s.flash = .8; }, done: () => { s.busy = false; }}); }
      },
      flip() { const s = S.current; a.choose(s.choice === 'product' ? 'game' : 'product', {x: s.sx, y: s.sy}); },
      button(i) { const s = S.current; if (s.phase === 'standby') { a.boot(); return; } s.press[i] = 1; if (a.playing()) { a.jump(); return; } sfx.click(); s.kick += Math.PI / 12; },
      // the game on the screen: any press is a jump, and the first one takes over from Jay playing by himself
      playing: () => live.current.sec === SEC.play && S.current.phase === 'on' && live.current.open == null,
      jump() { const s = S.current, what = runner.current.jump(); if (!what) return; s.press[2] = 1; if (what === 'jump') sfx.step(); else sfx.click();
        if (what !== 'again') s.jayKick = 1; // the bird on the machine jumps with the one on the screen
        if (what !== 'jump') setDemo(false); if (what === 'again') { setCleared(false); setGot([false, false, false]); } },
      run([what, i]) { const s = S.current;
        if (what === 'jump') s.jayKick = 1;
        else if (what === 'got') { sfx.chirp(); s.flash = .7; s.jayKick = 1; s.jaySay = 'note'; setGot(g => g.map((v, k) => v || k === i)); }
        else if (what === 'hit') { sfx.thunk(); s.shake = .5; }
        else if (what === 'clear') { sfx.clear(); s.jayKick = 1; s.jaySay = 'heart'; setCleared(true); } },
      near: i => Math.round(S.current.w) === i,
      over(i) { S.current.hv = i; if (i >= 0) sfx.hover(); },
      part(i) { hov.current = i; },
      // the changelog on the back: go to an entry (a row on the plate, a date in the list, the arrow keys), and say which row is under the pointer
      log(i) { top(YC + clamp(i, 0, NC - 1) * STEPC); },
      stepLog(d) { a.log(Math.round(S.current.c) + d); },
      logOver(i) { const s = S.current; if (s.lh === i) return; s.lh = i; if (i >= 0) { sfx.hover(); a.tipKey('log'); } else a.tip(''); },
      stepNum(d) { top(YS + clamp(Math.round(S.current.n) + d, 0, NS - 1) * STEPS); },
      // selected work: go to a cartridge, or, if it is already in front, push it in
      work(i) { const s = S.current; if (a.near(i) && s.ring > .8 && s.gone < .2) a.insert(); else top(YW + i * STEP); },
      step(d) { const s = S.current, i = clamp(Math.round(s.w) + d, 0, lay.current.n - 1); if (i !== Math.round(s.w)) top(YW + i * STEP); },
      // the cartridge drops in, the camera falls into the screen after it, and the screen's dots become the page
      insert() {
        const s = S.current; if (s.ins || s.ring < .8 || s.gone > .2 || s.busy) return;
        const i = Math.round(s.w), w = lay.current.list[i]; sfx.click(); a.tip(''); s.busy = true; s.ins = {i, t0: now()};
        later(330, () => { sfx.thunk(); s.shake = 1; s.flash = 1; });
        later(800, () => { sfx.wipe(); wipe.current({color: w.side === 'product' ? '#0B0C0F' : w.color, x: innerWidth / 2, y: innerHeight / 2, mid: () => { setOpen(i); see(w); }, done: () => { s.busy = false; }}); });
      },
      // leave a case (the camera backs out of the screen), or, with a number, go straight to another one
      close(to2) {
        const s = S.current, L = lay.current; if (s.busy) return; s.busy = true; sfx.wipe();
        const j = to2 == null ? null : (to2 + L.n) % L.n, w = j == null ? null : L.list[j], c = w ? (w.side === 'product' ? '#0B0C0F' : w.color) : STAGE[s.choice || 'product'].bg;
        wipe.current({color: c, ink: w && w.side === 'product' ? w.color : inkOn(c), label: w ? pad(j + 1) : '', sub: w ? w.short : '', mid: () => {
          if (j == null) { setOpen(null); s.ins = null; } else { setOpen(j); see(w); s.ins = {i: j, t0: 0}; scrollTo({top: (YW + j * STEP) * innerHeight}); }
        }, done: () => { s.busy = false; }});
      },
      // the three places in the menu: the dots cover the page, say where you are going, and you are there
      go(id, at) {
        const s = S.current, L = lay.current; if (s.phase === 'standby') { a.boot(); return; } if (s.busy) return;
        const st = STAGE[s.choice || 'product'];
        const W = live.current.T.wipe, [y, label, sub, c] = id === 'top' ? [0, 'JL-01', W.top, st.bg] : id === 'about' ? [YA + .06, 'ABOUT', W.about, st.plan] : id === 'log' ? [YC, s.choice === 'game' ? 'PATCH' : 'LOG', W.log, st.log]
          : id === 'play' ? [YP + .12, 'PLAY', W.play, st.play] : id === 'score' ? [YS, 'SCORE', W.score, st.score] : id === 'work' ? [YW, 'WORK', W.work, st.bg] : [L.end, 'HELLO', W.contact, st.flood];
        if (Math.abs(scrollY / innerHeight - y) < .06) return;
        s.busy = true; sfx.wipe();
        wipe.current({color: c, ink: inkOn(c), label, sub, x: at ? at.x : innerWidth / 2, y: at ? at.y : 44, mid: () => { scrollTo({top: y * innerHeight, behavior: 'instant'}); s.snap = true; }, done: () => { s.busy = false; }});
      },
      again() {
        const s = S.current; if (s.busy) return; s.busy = true; sfx.wipe();
        wipe.current({color: '#0A0B0D', ink: '#F2F2EF', label: 'JL-01', sub: live.current.T.wipe.again, mid: () => {
          scrollTo({top: 0, behavior: 'instant'}); try { sessionStorage.removeItem('jl-side'); } catch { /* private window */ }
          s.phase = 'standby'; s.choice = null; s.t0 = now(); s.snap = true; s.poke = 0; setPhase('standby'); setChoice(null);
          runner.current.reset(); opened.current.clear(); setSeen(0); setGot([false, false, false]); setDemo(true); setCleared(false); // a new visit: the game and the receipt start from nothing
        }, done: () => { s.busy = false; }});
      },
      copy() { sfx.click(); navigator.clipboard?.writeText(author.email).then(() => { setCopied(true); later(1600, () => setCopied(false)); }).catch(() => {}); },
      hop() { const s = S.current; s.hop = 1; s.jayKick = 1; s.jaySay = 'note'; sfx.chirp(); },
      // poke him and he answers; keep poking and he gives in
      poke() { const s = S.current, Q = live.current.T.quips, n = s.poke = s.poke % Q.length + 1, last = n === Q.length; s.hop = 1;
        if (last) { s.jayFlip = 1; s.jaySay = 'heart'; sfx.clear(); } else { s.jayKick = 1; s.jaySay = 'note'; sfx.chirp(); }
        setQuip(Q[n - 1]); clearTimeout(quipT.current); quipT.current = setTimeout(() => setQuip(null), last ? 2600 : 1700); },
      // on the last screen (and in front of the numbers) a click anywhere throws the dots about, and the bird off them
      burst(e) { const s = S.current, score = live.current.sec === SEC.score && s.ts > .9; if ((!score && (s.flood < .95 || s.m < .98)) || s.busy) return; // the numbers can be thrown about too
        s.bx = e.clientX / innerWidth * 2 - 1; s.by = 1 - e.clientY / innerHeight * 2; s.bk = 1; s.jayKick = 1; s.jaySay = '!'; sfx.tick(); },
      res(v) { setRes(v); },
      // the pointer's own label, for things in the scene (by name, so it follows the language)
      tipKey(k, arg) { const v = live.current.T.tip[k]; a.tip(typeof v === 'function' ? v(arg) : v); },
      workTip(i, w) { a.tip(a.near(i) ? live.current.T.tip.insert : pickLang(w.title, live.current.lang)); },
      tip(text) { if (el.tip) el.tip.textContent = text; if (el.cur) el.cur.dataset.on = text ? 'tip' : ''; },
      // the scene reports where the paper slot is; the receipt is a real piece of the page clipped at that line
      slot(x, y) { const r = el.root; if (!r) return; const top = innerWidth < innerHeight * .9 ? innerHeight * .52 : 76, h = el.paper ? el.paper.offsetHeight : 600; // a tall screen keeps its upper part for the wall
        r.style.setProperty('--sx', x.toFixed(1) + 'px'); r.style.setProperty('--sy', y.toFixed(1) + 'px'); r.style.setProperty('--rt', top + 'px');
        r.style.setProperty('--roll', h * S.current.print > y - top + 4 ? 1 : 0); }, // more paper than room: the top of it rolls up
    };
    return a;
  }, [to, el]);

  // once a frame: read the scroll, tell the scene what act this is, and move the words that belong to it
  const tick = useMemo(() => {
    const last = {sec: -1, part: -2, wi: -1, ci: -1, ni: -1, pr: 0, y: 0, jay: -1, ink: '', tint: '?', vig: -1, first: true}; let dir = 1, walk = 0;
    return (now, dt) => {
      const s = S.current, L = lay.current, y = scrollY / (innerHeight || 1); s.y = y;
      if (s.phase === 'standby' && y > .05) act.boot();
      s.t1 = sm(.08, .92, y); s.tl = sm(YAE + .1, YC - .14, y); s.tp = sm(YCE + .08, YP - .06, y); s.ts = sm(YPE + .08, YS - .1, y); s.t3 = sm(L.contact, L.contact + .5, y);
      s.c = clamp((y - YC) / STEPC, 0, NC - 1); s.n = clamp((y - YS) / STEPS, 0, NS - 1);
      // score -> work is a cut hidden behind a passing cartridge: cover runs 0..1 across the gap, and the world changes at its middle
      const cover = clamp((y - YSE - .2) / (YW - YSE - .3)), t2 = cover >= .5 ? 1 : 0;
      if (t2 !== s.t2) { s.t2 = t2; s.snap = true; if (!last.first) sfx.wipe(); }
      last.first = false; s.cover = cover;
      s.explodeTo = t2 ? 0 : sm(.22, .95, y) * (1 - sm(YAE - .02, YAE + .3, y));
      const part = y > .82 && y < YAE + .08 ? (hov.current ?? clamp(Math.floor((y - YA) / ((YAE - YA) / 5)), 0, 4)) : -1;
      s.part = part;
      s.ring = t2 * sm(.52, .96, cover); s.gone = sm(L.contact + .02, L.contact + .34, y);
      s.w = clamp((y - YW) / STEP, 0, L.n - 1);
      s.flood = sm(L.contact + .04, L.contact + .62, y); s.m = sm(L.contact - .04, L.contact + .7, y);
      s.print = clamp((y - L.contact - .5) / 1.65);
      s.knobTo = y * 2.4 + s.kick; s.hop = damp(s.hop, 0, 7, dt);
      // which act this is (SEC)
      const wi2 = Math.round(s.w), ci2 = Math.round(s.c), ni2 = Math.round(s.n), sec2 = y < .6 ? 0 : y < YAE + .3 ? 1 : y < YCE + .3 ? 2 : y < YPE + .3 ? 3 : !t2 ? 4 : y < L.contact + .2 ? 5 : 6;
      if (sec2 !== last.sec) { last.sec = sec2; setSec(sec2); if (sec2 === SEC.end) setClock(clockOf(now - s.tb)); } // the receipt is stamped with how long the visit took to get here
      if (ci2 !== last.ci) { if (sec2 === SEC.log && last.ci >= 0) { sfx.tick(); s.jayKick = 1; } last.ci = ci2; setCi(ci2); }
      if (ni2 !== last.ni) { if (sec2 === SEC.score && last.ni >= 0) { sfx.chirp(); s.jayKick = 1; s.jaySay = 'note'; } last.ni = ni2; setNi(ni2); }
      if (part !== last.part) { if (part >= 0 && last.part >= 0) sfx.tick(); last.part = part; setPart(part); }
      if (wi2 !== last.wi) { if (sec2 === SEC.work && last.wi >= 0) { sfx.tick(); s.jayKick = 1; } last.wi = wi2; setWi(wi2); }
      const pr = Math.floor(s.print * 30); if (pr !== last.pr) { if (pr > last.pr) sfx.print(); if (pr === 30 && last.pr < 30) { s.jayKick = 1; s.jaySay = 'heart'; } if ((pr === 30) !== (last.pr === 30)) setPrinted(pr === 30); last.pr = pr; }
      // nobody has moved, pressed or scrolled for a while: Jay dozes off (not during the game, which he may be playing himself)
      const nap = s.phase === 'on' && sec2 !== SEC.play && now - s.last > 22; if (nap !== s.nap) { s.nap = nap; setNap(nap); }
      // his words hang over his head, wherever he is
      if (el.say) { const J = s.jay, tight = J.sy < 118, side = J.sx > innerWidth * .6 ? -1 : 1; // no room over his head (he is at the top of the frame, under the bar): the words go beside it
        const beside = sec2 === SEC.work && s.choice !== 'game' && !s.ins && s.m < .9; // on the knob the cartridges hang right over him: there the words go beside his face
        const bx = beside ? J.sx - (J.sh || 80) * .5 - 64 : J.sx + (tight ? side * 84 : 0), by = beside ? J.sy + (J.sh || 80) * .66 : J.sy;
        if ((el.say.dataset.side === '1') !== beside) el.say.dataset.side = beside ? '1' : '';
        el.say.style.opacity = J.on.toFixed(2); el.say.style.transform = `translate3d(${clamp(bx, 96, innerWidth - 96).toFixed(1)}px,${Math.max(112, by).toFixed(1)}px,0)`; }

      // the words follow the room: dark ink on a bright room, light ink on a dark one, and no grey on a flood of colour
      const r = el.root, side = s.choice || 'product', game = s.choice === 'game';
      const tint = s.flood > .5 ? 'flood' : game && t2 && s.t3 < .5 ? 'work' : '';
      const night = game && s.ts * (1 - t2) > .5; // the game cartridge's one dark room: the numbers
      const ink = (tint === 'flood' ? lum(STAGE[side].flood) > .5 : tint === 'work' ? lum(L.list[Math.min(wi2, L.n - 1)].color) > .5 : game && !night) ? 'dark' : 'light';
      const vig = (game ? (night ? .5 : .08) : 1) * (1 - s.t1 * (1 - s.tl) * (1 - t2)) * (1 - s.flood * .7);
      if (r) { if (ink !== last.ink) { last.ink = ink; r.dataset.ink = ink; if (live.current.embedded && !live.current.covered) document.body.dataset.navTone = ink === 'dark' ? 'light' : 'dark'; } // the site's bar reads its ink from the room too
        if (tint !== last.tint) { last.tint = tint; r.dataset.tint = tint; }
        if (Math.abs(vig - last.vig) > .01) { last.vig = vig; r.style.setProperty('--vig', vig.toFixed(2)); } r.style.setProperty('--pr', s.print.toFixed(4)); }

      const a1 = sm(.74, 1, y), a2 = sm(YAE, YAE + .22, y), c1 = sm(YC - .3, YC - .04, y), c2 = sm(YCE + .02, YCE + .24, y), p1 = sm(YP - .32, YP - .04, y), p2 = sm(YPE + .02, YPE + .24, y), n1 = sm(YS - .34, YS - .06, y), n2 = sm(YSE + .04, YSE + .22, y), w1 = t2 * sm(.62, .97, cover), w2 = sm(L.contact - .1, L.contact + .15, y), e1 = sm(L.contact + .34, L.contact + .72, y);
      show(el.title, 1 - sm(.06, .34, y), -y * 60); show(el.about, a1 * (1 - a2), (1 - a1) * 40 - a2 * 40); show(el.log, c1 * (1 - c2), (1 - c1) * 40 - c2 * 40); show(el.play, p1 * (1 - p2), (1 - p1) * 40 - p2 * 40); show(el.score, n1 * (1 - n2), (1 - n1) * 30 - n2 * 30);
      show(el.work, w1 * (1 - w2) * (1 - clamp(s.dive * 3)), (1 - w1) * 40 - w2 * 40); show(el.end, e1, (1 - e1) * 24);
      if (el.rec) el.rec.toggleAttribute('data-on', s.t3 > .01); // the paper only exists while the machine is in its printing position

      // Jay walks the rail: he is the scrollbar
      const prog = clamp(y / L.end), moving = Math.abs(y - last.y) > .0004;
      if (moving) { dir = y > last.y ? 1 : -1; walk += dt * 10; } last.y = y;
      if (el.fill) el.fill.style.width = (prog * 100).toFixed(2) + '%';
      if (el.jay) { el.jay.style.left = (prog * 100).toFixed(2) + '%'; el.jay.style.bottom = (1 + s.hop * 12).toFixed(1) + 'px';
        const f = (moving ? Math.floor(walk) % 2 : 0) + (dir < 0 ? 2 : 0); if (f !== last.jay) { last.jay = f; drawJay(el.jay.getContext('2d'), 3, f % 2, dir < 0); } }
    };
  }, [act, el]);

  useEffect(() => {
    wipe.current = createWipe(el.wipe);
    if (el.stamp) drawJay(el.stamp.getContext('2d'), 4, 0, false); // the shop's mark on the receipt
    const stir = () => { S.current.last = performance.now() / 1000; }; // anything the visitor does keeps Jay awake
    const key = e => {
      stir(); if (e.metaKey || e.ctrlKey || e.altKey) return;
      // a page of the site is open over the machine, or the keys are being used in the site's own bar: they are not for the machine
      if (live.current.covered || (e.target.closest && e.target.closest('.v16-navigation,input,textarea,select,[contenteditable]'))) return;
      const s = S.current, k = e.key.toLowerCase(), o = live.current.open, lr = k === 'arrowright' ? 1 : k === 'arrowleft' ? -1 : 0;
      if (s.phase === 'standby') { if (k === ' ') e.preventDefault(); act.boot(); return; } // waking it must not also page down
      if (o != null) { if (k === 'escape' || k === 'x') act.close(); else if (lr) act.close(o + lr); return; }
      const i = '1234'.indexOf(k); if (k.length === 1 && i >= 0) { act.button(i); return; }
      if (k === 'r') { act.again(); return; }
      const at = live.current.sec;
      if (at === 0) { if (lr) act.pickSide(lr < 0 ? 'product' : 'game'); else if (k === 'enter') act.choose(s.pick); }
      else if (at === 1 && lr) scrollBy({top: lr * (YAE - YA) / 5 * innerHeight, behavior: 'smooth'});
      else if (at === SEC.log && lr) act.stepLog(lr);
      else if (at === SEC.play && (k === ' ' || k === 'arrowup' || k === 'w' || k === 'enter')) { e.preventDefault(); act.jump(); } // in the play act the space bar belongs to the game
      else if (at === SEC.score && lr) act.stepNum(lr);
      else if (at === SEC.work) { if (lr) act.step(lr); else if (k === 'enter') act.insert(); }
    };
    // when the scroll comes to rest among the cartridges, the entries of the changelog or the numbers, settle on the nearest one
    let idle, mag = null;
    const scroll = () => { stir(); clearTimeout(idle); idle = setTimeout(() => {
      const s = S.current, L = lay.current, y = scrollY / innerHeight; if (live.current.open != null || s.busy) return;
      const near = (y0, step, n) => y0 + clamp(Math.round((y - y0) / step), 0, n - 1) * step;
      const ty = y > YW - .12 && y < L.contact - .22 ? near(YW, STEP, L.n) : y > YC - .08 && y < YCE + .04 ? near(YC, STEPC, NC) : y > YS - .08 && y < YSE + .04 ? near(YS, STEPS, NS) : null;
      if (ty != null && Math.abs(scrollY - ty * innerHeight) > 6) scrollTo({top: ty * innerHeight, behavior: 'smooth'});
    }, 170); };
    // the pointer: its own mark follows it, a button leans towards it, the receipt tilts under it
    const move = e => {
      stir(); if (el.cur) { el.cur.style.transform = `translate3d(${e.clientX}px,${e.clientY}px,0)`; el.cur.dataset.live = '1'; }
      if (mag) { const r = mag.getBoundingClientRect(); mag.style.translate = `${((e.clientX - r.left - r.width / 2) * .22).toFixed(1)}px ${((e.clientY - r.top - r.height / 2) * .3).toFixed(1)}px`; }
      if (live.current.sec === SEC.end && el.paper) { el.paper.style.setProperty('--tx', ((e.clientX / innerWidth - .5) * 7).toFixed(2) + 'deg'); el.paper.style.setProperty('--ty', ((.5 - e.clientY / innerHeight) * 5).toFixed(2) + 'deg'); }
    };
    const over = e => {
      const t = e.target.closest ? e.target.closest('a,button,li,[data-cur]') : null, m = t && t.closest('.jl-btn');
      if (mag && mag !== m) mag.style.translate = ''; mag = m || null;
      if (el.cur && !(el.cur.dataset.on === 'tip' && !t)) { el.cur.dataset.on = t ? (t.dataset.cur ? 'tip' : 'hot') : ''; if (el.tip) el.tip.textContent = t && t.dataset.cur ? t.dataset.cur : ''; }
    };
    addEventListener('keydown', key); addEventListener('scroll', scroll, {passive: true}); addEventListener('pointermove', move, {passive: true}); addEventListener('pointerover', over, {passive: true}); addEventListener('pointerdown', stir, {passive: true});
    const jump = () => { S.current.snap = true; }; addEventListener('journey:jump', jump); // the site moved the page (its menu, a link with a hash): the scene is simply there
    const pending = timers.current;
    return () => { removeEventListener('keydown', key); removeEventListener('scroll', scroll); removeEventListener('pointermove', move); removeEventListener('pointerover', over); removeEventListener('pointerdown', stir); removeEventListener('journey:jump', jump); clearTimeout(idle); clearTimeout(quipT.current); pending.forEach(clearTimeout); };
  }, [act, el]);

  const L = lay.current, w = list[Math.min(wi, list.length - 1)], side = choice || 'product', who = choice || 'none';
  const tr = v => pickLang(v, lang), unit = x => T.work.units[x.short];
  const resume = SIDES[choice || 'game'].resume.href, all = SIDES[choice || 'game'].allWork.href;
  const marks = [['top', 0], ['about', YA / L.end], ['log', YC / L.end], ['play', YP / L.end], ['score', YS / L.end], ['work', YW / L.end], ['contact', 1]];
  const content = choice || 'game', loop = SIDES[content].loop, exp = SIDES[content].experience.slice(0, 5), logs = SIDES[content].experience.slice(0, NC), nums = SIDES[content].numbers.slice(0, NS);
  const lg = logs[Math.min(ci, logs.length - 1)], nm = nums[Math.min(ni, nums.length - 1)];
  const at = e => { const r = e.currentTarget.getBoundingClientRect(); return {x: r.left + r.width / 2, y: r.top + r.height / 2}; };
  const cs = open != null ? list[open] : null;
  // a link into the rest of the site opens the way the site opens its pages; anything it does not take stays a plain link
  const follow = href => e => { if (!onOpen || !href || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; if (onOpen(href)) e.preventDefault(); };
  // What Jay says. The hints of every act are his: [words, stays until the situation changes]. Asleep he says nothing.
  const say = quip ? [quip, 0] : phase !== 'on' || nap ? null
    : sec === 0 ? (choice ? [to.company ? T.say.hello(to.company) : T.say.scroll, 1] : [T.say.pick, 1])
    : sec === 1 ? [T.say.layers, 0]
    : sec === SEC.log ? [T.say.log, 0]
    : sec === SEC.play ? (cleared ? [T.say.clear, 0] : demo ? [touch ? T.say.demoTouch : T.say.demo, 1] : [T.say.jump, 0])
    : sec === SEC.score ? [T.say.score, 0]
    : sec === SEC.work ? (choice === 'game' && tall.matches ? null : [T.say.choose, 0]) // on a tall screen the stones lie right under the machine: no room for words there
    : [printed ? T.say.printed : T.say.printing, printed ? 0 : 1];
  const score = got.filter(Boolean).length;
  // As the site's home: the old home's places keep their names, so the site's menu and old links with a hash still land somewhere
  const anchors = embedded ? [['home', 0], ['journey-about', YA + .06], ['journey-timeline', YC], ['systems', YW], ['product', YW], ['worlds', YW], ['contact', L.end]] : [];
  // the 3D scene is not built while a page of the site covers the home (a visit that lands on a case), only once the home is seen
  const [armed, setArmed] = useState(!covered);
  useEffect(() => { if (!covered) setArmed(true); }, [covered]);
  // the page's own canvas colour and hidden scrollbar only while the machine is the page
  useEffect(() => { const h = document.documentElement; h.classList.add('jl-home'); return () => { h.classList.remove('jl-home'); delete document.body.dataset.navTone; }; }, []);
  // the machine's sounds follow the site's one sound switch (music is off until the visitor turns it on)
  useEffect(() => { if (music) sfx.setMuted(!music.enabled); }, [music, music?.enabled]);
  // the site's bar takes its ink from what is under it: the room, an opened cartridge, or (covered) the page that says so itself
  useEffect(() => { if (!embedded) return; const b = document.body;
    if (covered) delete b.dataset.navTone;
    else if (cs) b.dataset.navTone = cs.side === 'product' || lum(cs.color) <= .55 ? 'dark' : 'light';
    else b.dataset.navTone = el.root && el.root.dataset.ink === 'dark' ? 'light' : 'dark';
  }, [embedded, covered, cs, el]);
  const switcher = <RoleSwitch choice={choice} labels={T.side} swap={T.swap} onChoose={(k, e) => act.choose(k, at(e))}/>;

  return <div className="jl" ref={grab('root')} lang={lang === 'en' ? 'en' : 'zh-CN'} data-lang={lang === 'en' ? 'en' : 'zh'} data-side={side} data-phase={phase} data-sec={sec} data-part={part} data-open={open != null ? '' : undefined}
    data-embedded={embedded ? '' : undefined} data-covered={covered ? '' : undefined} onPointerDown={e => { act.boot(); act.burst(e); }}>
    {anchors.map(([id, y]) => <i key={id} id={id} className="jl-anchor" style={{top: y * 100 + 'vh'}}/>)}
    <div className="jl-stage">
      {armed && <Canvas frameloop={covered || open != null ? 'never' : 'always'} dpr={res} camera={{fov: 26, position: [0, 1.05, 12.6], near: .1, far: 120}} gl={{antialias: false}}
        onCreated={({scene, gl}) => { scene.environmentIntensity = STAGE.product.env; gl.toneMapping = THREE.NeutralToneMapping; gl.toneMappingExposure = 1.05; }}>
        <Stage S={S} to={to} on={act} tick={tick} works={list} side={side} content={content} logs={logs} runner={runner.current} words={T} lang={lang}/>
      </Canvas>}
    </div>

    {/* On the site the bar belongs to the site (its name, its pages, language, sound): the machine only adds its cartridge switch to it.
        Standing alone (jl01.html) it brings its own bar. */}
    {embedded ? <div className="jl-switch" onPointerDown={e => e.stopPropagation()}>{switcher}</div>
      : <header className="jl-top" onPointerDown={e => e.stopPropagation()}>
        <button className="jl-mark" onClick={e => act.go('top', at(e))}>JAY LIN</button>
        <nav className="jl-nav">{[['about', SEC.about], ['work', SEC.work], ['contact', SEC.end]].map(([id, i]) => <button key={id} aria-current={sec === i} onClick={e => act.go(id, at(e))}>{T.rail[i]}</button>)}</nav>
        {switcher}
        <button className="jl-snd" onClick={() => { sfx.setMuted(!muted); setMuted(!muted); }}>{muted ? 'SND OFF' : 'SND ON'}</button>
      </header>}

    {/* the name itself stands in the scene (DotWall); the page only adds what it is for and what to do next */}
    <section className="jl-ui jl-title" ref={grab('title')}>
      <h1 className="jl-sr">{T.h1}</h1>
      <div className="jl-roles">{T.roles}</div>
      <div className="jl-start">
        {phase === 'on' && <div className="jl-pick" onPointerDown={e => e.stopPropagation()}>
          {['product', 'game'].map(k => <button key={k} aria-pressed={choice === k} data-pick={!choice && pick === k} onPointerEnter={() => act.pickSide(k)} onClick={() => act.choose(k)}>{T.side[k]}</button>)}
        </div>}
        {phase !== 'on' && <div className="jl-hint jl-label">{phase === 'standby' ? T.standby : 'JL-01'}</div>}
      </div>
    </section>

    <section className="jl-ui jl-col jl-about" ref={grab('about')}>
      <div className="jl-kick jl-label">{T.about.kick}{to.company ? T.about.for(to.company) : ''}</div>
      <h2 className="jl-han">{T.about.title[0]}<br/>{T.about.title[1]}</h2>
      <p className="jl-sub" key={who + 'lead'}>{T.about.lead[who]}</p>
      <ol className="jl-spec">{PARTS.map(([k, name], i) => <li key={k} aria-current={part === i} onPointerEnter={() => { hov.current = i; }} onPointerLeave={() => { hov.current = null; }}><i>{pad(i + 1)}</i><b>{name}</b><span>{T.about.parts[i]}</span></li>)}</ol>
      <div className="jl-facts jl-label">{T.about.facts.map(f => <span key={f}>{f}</span>)}</div>
    </section>

    {/* 02 the changelog. The machine has turned its back, where a device says where it comes from: the entry the scroll is at, set large */}
    <section className="jl-ui jl-col jl-log" ref={grab('log')}>
      <div className="jl-kick jl-label">{T.log.kick[who]} <b>{pad(ci + 1)}</b>/ {pad(logs.length)}</div>
      <div className="jl-swap" key={content + ci}>
        <div className="jl-stat"><b>{plateDate(lg)}</b></div>
        <h2 className="jl-han">{tr(lg.org)}</h2>
        <p className="jl-sub">{tr(lg.note)}</p>
      </div>
      <div className="jl-acts jl-label">{lg.href && <a className="jl-btn" href={lg.href} onClick={follow(lg.href)}>{T.log.open}</a>}<span>{T.log.swap}</span></div>
      <ol className="jl-list">{logs.map((x, i) => <li key={i} aria-current={i === ci} onPointerEnter={() => act.logOver(i)} onPointerLeave={() => act.logOver(-1)} onClick={() => act.log(i)}>{plateDate(x)}</li>)}</ol>
    </section>

    {/* 03 play: the three things every piece of his work starts from, as a game you can take over. Nothing is locked: the lines can be read without playing */}
    <section className="jl-ui jl-col jl-play" ref={grab('play')}>
      <div className="jl-kick jl-label">{T.play.kick}</div>
      <h2 className="jl-han">{T.play.title[0]}<br/>{T.play.title[1]}</h2>
      <ol className="jl-how">{loop.map((h, i) => <li key={h.key} data-got={got[i] || undefined}><i>{h.key[0]}</i><b>{tr(h.title)}</b><span>{tr(h.meta)}</span>{h.href && <a href={h.href} aria-label={tr(h.meta)} onClick={follow(h.href)}>↗</a>}</li>)}</ol>
      <div className="jl-acts jl-label"><button className="jl-btn" onClick={() => act.jump()}>{T.play.jump}</button><span className="jl-score"><b>{score}</b> / 3</span></div>
    </section>

    {/* 04 the numbers. The figure itself stands in the scene, as tall as the room; the page says what was counted */}
    <section className="jl-ui jl-score" ref={grab('score')}>
      <div className="jl-kick jl-label">{T.score.kick} <b>{pad(ni + 1)}</b>/ {pad(nums.length)}</div>
      <p className="jl-han" key={content + ni}>{tr(nm.what)}</p>
      <div className="jl-acts jl-label" onPointerDown={e => e.stopPropagation()}><button className="jl-ghost" disabled={ni === 0} onClick={() => act.stepNum(-1)}>←</button><button className="jl-ghost" disabled={ni === nums.length - 1} onClick={() => act.stepNum(1)}>→</button><span>{T.score.hint}</span></div>
    </section>

    <section className="jl-ui jl-col jl-work" ref={grab('work')}>
      <div className="jl-kick jl-label">{T.work.kick} <b>{pad(wi + 1)}</b>/ {pad(list.length)}</div>
      <div className="jl-swap" key={w.side + w.short}>
        <h2 className="jl-han">{tr(w.title)}</h2>
        <p className="jl-sub">{tr(w.sub)}</p>
        {w.stat && <div className="jl-stat"><b>{w.stat}</b><span>{unit(w)}</span></div>}
      </div>
      <div className="jl-acts jl-label"><button className="jl-btn" onClick={() => act.insert()}>{T.work.insert}</button><span>{T.work.swap}</span></div>
      <ol className="jl-list">{list.map((x, i) => <li key={x.side + x.short} aria-current={i === wi} onPointerEnter={() => act.over(i)} onPointerLeave={() => act.over(-1)} onClick={() => act.work(i)}>{pad(i + 1)} {x.short}</li>)}</ol>
    </section>

    {/* 04 the last screen. LET'S WORK stands in the scene as a wall of dots; the page adds one line, and the machine prints the rest */}
    <section className="jl-ui jl-end" ref={grab('end')}>
      <div className="jl-kick jl-label">{T.end.kick}</div>
      <h2 className="jl-han">{T.end.title[who][0]}<br/>{T.end.title[who][1]}</h2>
      {/* a window too short to show the receipt's lines (a phone on its side) gets the two that matter here */}
      <div className="jl-end-links jl-label" onPointerDown={e => e.stopPropagation()}><a href={'mailto:' + author.email}>{T.rec.mail} ↗</a><a href={resume} target="_blank" rel="noreferrer">{T.rec.resume} ↓</a></div>
    </section>
    <div className="jl-rec" ref={grab('rec')}><i className="jl-roll"/><div className="jl-paper" ref={grab('paper')} onPointerDown={e => e.stopPropagation()}>
      <canvas className="jl-stamp" ref={grab('stamp')} width={68} height={56}/>
      <b>JAY LIN</b>
      <div className="jl-row"><span>JL-01</span><span>{T.rec.place}</span></div><hr/>
      <div className="jl-row"><span>{T.rec.guest}</span><span>{to.company || 'PLAYER 1'}</span></div>
      <div className="jl-row"><span>{T.rec.role}</span><span>{T.role[who]}</span></div><hr/>
      {/* what this visit did: the page gives the visitor's own run back to them */}
      <div className="jl-row"><span>{T.rec.play}</span><span>{score} / 3</span></div>
      <div className="jl-row"><span>{T.rec.seen}</span><span>{pad(seen)} / {pad(list.length)}</span></div>
      <div className="jl-row"><span>{T.rec.time}</span><span>{clock}</span></div><hr/>
      <ol className="jl-items">{exp.map((x, i) => <li key={i}><time>{tr(x.date)}</time><b>{tr(x.org)}</b><span>{tr(x.note).split(' · ')[0]}</span></li>)}</ol><hr/>
      <div className="jl-row"><span>{T.rec.items}</span><span>{pad(exp.length)}</span></div>
      <div className="jl-row"><span>{T.rec.avail}</span><span>{T.rec.when}</span></div><hr/>
      <a href={resume} target="_blank" rel="noreferrer">{T.rec.resume}<i>↓</i></a>
      <a href={'mailto:' + author.email}>{T.rec.mail}<i>↗</i></a>
      <button onClick={() => act.copy()}><small>{copied ? T.rec.copied : author.email}</small><i>{copied ? '✓' : T.rec.copy}</i></button>
      <a href={all} onClick={follow(all)}>{T.rec.all}<i>↗</i></a>
      <div className="jl-code"/>
      <button className="jl-again" onClick={() => act.again()}>{T.rec.again}</button>
    </div></div>

    <nav className="jl-rail" onPointerDown={e => e.stopPropagation()}>
      <div className="jl-rail-line"><i ref={grab('fill')}/></div>
      {marks.map(([id, x], i) => <button key={id} style={{left: x * 100 + '%'}} aria-current={sec === i} onClick={e => act.go(id, at(e))}>{T.rail[i]}</button>)}
      <canvas ref={grab('jay')} width={51} height={42} data-cur="JAY" onPointerEnter={() => act.hop()} onClick={() => act.poke()}/>
    </nav>

    {/* Jay's words, hung over his head by the frame loop */}
    <div className="jl-say" ref={grab('say')} aria-live="polite">{say && <span key={say[0]} data-hold={say[1] ? '' : undefined}>{say[0]}</span>}</div>

    {cs && <div className="jl-case" onPointerDown={e => e.stopPropagation()} style={cs.side === 'product' ? {'--c': '#0B0C0F', '--ci': '#F2F2EF', '--ca': cs.color} // product: the room stays dark and only the type takes the colour
      : {'--c': cs.color, '--ci': lum(cs.color) > .55 ? '#14110D' : '#F7F4EC'}}>
      <header className="jl-label"><button onClick={() => act.close()}>{T.work.eject}</button><span>{pad(open + 1)} / {pad(list.length)}</span></header>
      <figure className={cs.img && /atelier/.test(cs.img) ? 'tall' : ''}
        onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(), f = e.currentTarget.style; f.setProperty('--fx', (((e.clientX - r.left) / r.width - .5) * 14).toFixed(2) + 'deg'); f.setProperty('--fy', ((.5 - (e.clientY - r.top) / r.height) * 12).toFixed(2) + 'deg'); }}
        onPointerLeave={e => { e.currentTarget.style.setProperty('--fx', '0deg'); e.currentTarget.style.setProperty('--fy', '0deg'); }}>
        {cs.img && <CaseArt src={cs.img} alt={tr(cs.title)}/>}</figure>
      <div className="jl-marq" aria-hidden="true"><div>{Array.from({length: 8}, (_, i) => <span key={i}>{tr(cs.title)} ✱ </span>)}</div></div>
      <footer><p>{tr(cs.sub)}</p>{cs.stat ? <div className="jl-stat"><b>{cs.stat}</b><span>{unit(cs)}</span></div> : <span/>}
        <div className="jl-acts">{cs.href && <a className="jl-btn" href={cs.href} onClick={follow(cs.href)}>{T.work.open}</a>}<button className="jl-ghost" onClick={() => act.close(open + 1)}>{T.work.next}</button></div></footer>
    </div>}

    <canvas className="jl-wipe" ref={grab('wipe')}/>
    <div className="jl-cur" ref={grab('cur')} aria-hidden="true"><i/><span ref={grab('tip')}/></div>
    <div className="jl-space" style={{height: (L.end + 1) * 100 + 'vh'}}/>
  </div>;
}
