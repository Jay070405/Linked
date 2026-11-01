// The one tray that slides out of the picked rack, and the GPU the camera dives into. Positions are fixed numbers
// derived from plan.js so the camera can aim at them; the tray's motion is a function of progress like everything else.
// The hardware is built part by part (closeup.js has the textures and shapes): parts of one finish merge into one
// mesh, so the whole tray, plates, lid and rails draw in about a dozen calls.
import * as THREE from 'three';
import {glow} from './textures';
import {PICK, RACK, PICK_SLOT, U1, RACK_BASE, SHEET_SIZE, BOUNDS} from './plan';
import {T, seg, smoother, lerp} from './timeline';
import {
  trayAtlasAsync, steelTileAsync, lidTextures, floorTextures, dieTexture, dieRoughness, boardParts, packageCaps, SMALL_BOARDS, FRONT, pacer, mergeAsync,
  cbox, wedge, skin, solid, rim, facingKey, paint, tint, put, prep, Kit, fanGeometry, tube, sleeve, screwGeometry, fittingGeometry, merge, dropBottoms,
} from './closeup';

// a 1U compute tray, about 766 × 438 × 44 mm (research.md §3)
export const TRAY = {w: 0.438, d: 0.766, h: U1 - 0.003};
const slotY = RACK_BASE + PICK_SLOT * U1;
const frontZ = PICK.z + RACK.d / 2;
// in its slot the tray's front sits just proud of the rack's front panel
const inZ = frontZ + 0.009 - TRAY.d / 2;
const SLIDE = 0.7, LIFT = 0;
const outZ = inZ + SLIDE, outY = slotY + LIFT + TRAY.h / 2;
// on the tray (local x across, z towards the front): two boards side by side in the rear half, each a CPU in front
// of two GPUs; fans across the middle; network cards and drive bays at the front (the arrangement is approximate)
const BOARDS = [-0.105, 0.105];
const GPU_Z = [-0.18, -0.29], CPU_Z = -0.065;
export const PKG = {w: 0.076, d: 0.076, h: 0.0035};
export const DIE = {w: 0.0255, d: 0.0315, h: 0.0009, gap: 0.0006};
export const HBM = {w: 0.0105, d: 0.0115, h: 0.0012};
const floorY = -TRAY.h / 2 + 0.003 + 0.004 + 0.002;          // tray floor, standoffs, board
const gpuLocal = {x: BOARDS[1], y: floorY + PKG.h, z: GPU_Z[0]};
// the square drawing laid over the two dies: drawDie() draws a die 11.6 sheet units wide, so the drawn dies sit on
// the real ones; its dies are centred one unit north of the sheet centre
// the die's drawing is the hall's plan at this scale: the building's 22 m across the die's 25.5 mm
const UNIT = DIE.w / (BOUNDS.x1 - BOUNDS.x0), DIE_SHEET = UNIT * SHEET_SIZE;
const heroX = DIE.w / 2 + DIE.gap / 2;
const fovMatch = 32 * Math.PI / 180;
export const DETAIL = {
  slotY, frontZ, outY, outZ,
  gpu: {x: PICK.x + gpuLocal.x, y: outY + gpuLocal.y, z: outZ + gpuLocal.z},
  die: {x: PICK.x + gpuLocal.x, y: outY + gpuLocal.y + DIE.h, z: outZ + gpuLocal.z},
  // the drawing lies 2.7 mm above the die, clear of the tallest parts on the board (the power-stage chokes)
  sheetCenter: {x: PICK.x + gpuLocal.x + heroX, y: outY + gpuLocal.y + DIE.h + 0.0027, z: outZ + gpuLocal.z},
  sheet: DIE_SHEET,
  // the sheet fills two thirds of the view at the cut, so the hall's plan is still far enough away to keep closing in
  // on the opening view afterwards
  matchDist: DIE_SHEET / (2 * Math.tan(fovMatch / 2) * 0.66),
  matchScale: SHEET_SIZE / DIE_SHEET,
};

const MM = 0.001;
const y0 = -TRAY.h / 2, floorTop = y0 + 0.0025, lidY = TRAY.h / 2;
const BOARD_Z = -0.18;
// the tray's own coolant headers behind the boards: supply low, return above it
const SUP_Y = floorY + 0.0045, RET_Y = floorY + 0.0185, HEAD_Z = -TRAY.d / 2 + 0.0095;
// the sheet steel's tint (the steel texture carries the streaks)
const STEEL = '#a2a8ae';

// metals and glossy parts reflect the room more strongly than the hall does, as under a studio light: the scene's
// environment is taken at the first render and given to these materials with their own strength
function reflect(mesh, intensity) {
  if (!mesh) return mesh;
  mesh.onBeforeRender = (renderer, scene) => {
    const m = mesh.material;
    if (!m.envMap && scene.environment) {m.envMap = scene.environment; m.envMapIntensity = intensity; m.needsUpdate = true;}
  };
  return mesh;
}

// ---------------------------------------------------------------------------------------------------------------
// parts, drawn in mm with the board's top at y = 0

// a chip capacitor or resistor: body with tinned terminals, its long side along x or z as given, soldered down: a
// fillet of solder runs from each terminal's face down to the end of its pad
const SOLDER = '#b4b7b9';
function chipCap(w, d, h, body) {
  const L = Math.max(w, d), S = Math.min(w, d), t = Math.min(L * 0.2, 0.55);
  const g = new THREE.BoxGeometry(L, h, S, 3, 1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {const x = p.getX(i); if (Math.abs(Math.abs(x) - L / 6) < L * 1e-3) p.setX(i, Math.sign(x) * (L / 2 - t));}
  const box = paint(g, c => (Math.abs(c.x) > L / 2 - t - 1e-6 ? ['metal', '#cfd1d3'] : ['satin', body]));
  box.translate(0, h / 2, 0);
  const run = Math.min(0.26, L * 0.13), rise = h * 0.62;
  const out = merge([box, ...[-1, 1].map(s => solid(wedge(run, rise, S * 0.94), 'metal', SOLDER).rotateY(s < 0 ? Math.PI : 0).translate(s * L / 2, 0.004, 0))]);
  if (d > w) out.rotateY(Math.PI / 2);
  return out;
}

function partGeo(p) {
  const out = [], A = g => out.push(g), {w, d, h} = p;
  // (finishes: moulded bodies and plastics matte, plated metal bright and smooth; edges rounded tight, as moulded and
  // stamped parts are, and the parts by the GPUs rounded for real)
  switch (p.k) {
    case 'choke':
      // matte dark ferrite, its upper edges catching a little light
      A(rim(skin(cbox(w, h, d, 0.3, 1), {top: 'choke', side: 'matte', sideColor: '#2a2b2f'}), '#313236', 'plain', '#2a2b2e').translate(0, h / 2, 0));
      // its terminals: a band of satin tinned metal across the foot of each end, folded under and soldered to the pads
      for (const s of [-1, 1]) {
        A(solid(cbox(0.28, 1.7, d * 0.86, 0.1, 1), 'rough', '#a3a7ab').translate(s * (w / 2 + 0.14), 0.85, 0));
        A(solid(wedge(0.42, 0.95, d * 0.8), 'metal', SOLDER).rotateY(s < 0 ? Math.PI : 0).translate(s * (w / 2 + 0.28), 0.004, 0));
      }
      break;
    case 'stage': A(skin(cbox(w, h, d, 0.08), {top: 'ic', side: 'plain', sideColor: '#141517'}).translate(0, h / 2, 0)); break;
    case 'cap': A(chipCap(w, d, h, Math.max(w, d) > 2 ? '#a48b64' : '#927c5f')); break;
    case 'res': A(chipCap(w, d, h, '#202022')); break;
    case 'poscap': {
      const L = Math.max(w, d), S = Math.min(w, d), parts = [skin(cbox(L, h, S, 0.18, 1), {top: 'poscap', side: 'plain', sideColor: '#1c1916'}).translate(0, h / 2, 0)];
      // the anode and cathode tabs at its ends, soldered down
      for (const s of [-1, 1]) {
        parts.push(solid(new THREE.BoxGeometry(0.12, 0.6, S * 0.45), 'metal', '#a9acae').translate(s * (L / 2 + 0.06), 0.3, 0));
        parts.push(solid(wedge(0.36, 0.45, S * 0.45), 'metal', SOLDER).rotateY(s < 0 ? Math.PI : 0).translate(s * (L / 2 + 0.12), 0.004, 0));
      }
      const g = merge(parts);
      if (d > w) g.rotateY(Math.PI / 2);
      A(g); break;
    }
    case 'ic': A(skin(cbox(w, h, d, 0.1), {top: 'ic', side: 'plain', sideColor: '#141517'}).translate(0, h / 2, 0)); break;
    case 'bga':
      A(solid(cbox(w, 0.5, d, 0.06), 'satin', '#2b3b31').translate(0, 0.25, 0));
      A(skin(cbox(w - 1.6, h - 0.5, d - 1.6, 0.12), {top: 'ic', side: 'plain', sideColor: '#141517'}).translate(0, 0.5 + (h - 0.5) / 2, 0));
      break;
    case 'lpddr':
      A(solid(cbox(w, 0.3, d, 0.06), 'satin', '#2b3b31').translate(0, 0.15, 0));
      A(skin(cbox(w - 0.3, h - 0.3, d - 0.3, 0.12), {top: 'lp', side: 'plain', sideColor: '#151618'}).translate(0, 0.3 + (h - 0.3) / 2, 0));
      break;
    case 'soic':
      A(skin(cbox(w, h - 0.2, d, 0.12), {top: 'ic', side: 'plain', sideColor: '#151618'}).translate(0, 0.2 + (h - 0.2) / 2, 0));
      for (let k = 0; k < 4; k++) for (const s of [-1, 1]) A(solid(new THREE.BoxGeometry(1.3, 0.2, 0.42), 'metal', '#c9cbcc').translate(s * (w / 2 + 0.55), 0.35, (k - 1.5) * 1.27));
      break;
    case 'xtal':
      A(solid(cbox(w, 0.25, d), 'satin', '#b49a74').translate(0, 0.125, 0));
      A(solid(cbox(w - 0.2, h - 0.25, d - 0.2, 0.12, 1), 'metal', '#c8cbce').translate(0, 0.25 + (h - 0.25) / 2, 0));
      break;
    case 'led': A(skin(new THREE.BoxGeometry(w, h, d), {top: 'ledG', side: 'gloss', color: '#e8f5ec'}).translate(0, h / 2, 0)); break;
    case 'ecap':
      A(solid(new THREE.CylinderGeometry(w / 2 + 0.3, w / 2 + 0.3, 0.5, 4).rotateY(Math.PI / 4).translate(0, 0.25, 0), 'satin', '#18181a'));
      A(solid(new THREE.CylinderGeometry(w / 2, w / 2, h - 0.8, 24).translate(0, 0.5 + (h - 0.8) / 2, 0), 'satin', '#232a3a'));
      A(solid(new THREE.CylinderGeometry(w / 2 - 0.35, w / 2 - 0.15, 0.3, 24).translate(0, h - 0.15, 0), 'metal', '#c3c7cc'));
      for (const r of [0, Math.PI / 2]) A(solid(new THREE.BoxGeometry(w * 0.6, 0.06, 0.3).rotateY(r).translate(0, h + 0.02, 0), 'matte', '#55585d'));
      break;
    case 'header':
      A(solid(cbox(w, 2.5, d, 0.15), 'plain', '#18191b').translate(0, 1.25, 0));
      for (let i = 0; i < 5; i++) for (const s of [-1, 1]) A(solid(new THREE.BoxGeometry(0.64, 6, 0.64), 'polish', '#dcb766').translate(-5.08 + i * 2.54, 3, s * 1.27));
      break;
    case 'post':
      A(solid(new THREE.CylinderGeometry(2.8, 2.8, h, 6), 'metal', '#d4d6d9').translate(0, h / 2, 0));
      A(solid(new THREE.CylinderGeometry(1.3, 1.3, 0.05, 12), 'matte', '#141414').translate(0, h + 0.02, 0));
      break;
    case 'hole': A(screwGeometry()); break;
    case 'pwr':
      A(solid(cbox(w, h, d, 0.3), 'plain', '#1b1c1f').translate(0, h / 2, 0));
      A(solid(cbox(w - 4, 1.2, 3, 0.2), 'plain', '#26272b').translate(0, h + 0.6, -1.5));
      break;
    case 'mcio':
      A(solid(cbox(w, h, d, 0.25), 'plain', '#1c1d20').translate(0, h / 2, 0));
      A(solid(new THREE.BoxGeometry(w - 2.4, 0.3, d - 3), 'metal', '#c4c7cb').translate(0, h + 0.15, -0.6));
      break;
    case 'nvl':
      A(solid(cbox(w, 6, d, 0.35), 'plain', '#1c1d20').translate(0, 3, 0));
      A(solid(cbox(w - 0.6, 2.5, d - 0.6, 0.3, 1), 'metal', '#c3c7cc').translate(0, 7.25, 0));
      for (let k = 0; k < 6; k++) A(solid(new THREE.BoxGeometry(0.4, 0.1, d - 4), 'matte', '#45484d').translate((k - 2.5) * 7, 8.52, 0));
      for (const s of [-1, 1]) A(solid(new THREE.CylinderGeometry(1.5, 1.5, 6, 14).rotateX(Math.PI / 2).translate(s * (w / 2 - 2.5), 4, -d / 2 - 2.5), 'polish', '#d8dbde'));
      break;
    case 'conn': A(solid(cbox(w, h, d, 0.25), 'plain', '#1b1c1f').translate(0, h / 2, 0)); break;
    case 'fanhdr':
      A(solid(cbox(w, h, d, 0.2), 'plain', '#e1dac6').translate(0, h / 2, 0));
      A(solid(cbox(w - 1.4, 0.6, d - 1.2, 0.15), 'matte', '#16161a').translate(0, h + 0.05, 0));
      break;
    case 'brick':
      A(solid(cbox(w, 8.5, d, 0.35, 1), 'plain', '#19191c').translate(0, 4.25, 0));
      A(skin(cbox(w, 2.5, d, 0.3, 1), {top: 'brick', side: 'metal', sideColor: '#b9bdc2'}).translate(0, 8.5 + 1.25, 0));
      break;
    case 'm2':
      A(skin(cbox(w, 0.8, d, 0.2), {top: 'm2', side: 'edge'}).translate(0, 2.9, 0));
      A(solid(cbox(w, 4.2, 5, 0.3), 'satin', '#1a1b1e').translate(0, 2.1, -d / 2 - 1.5));
      for (const z of [-17, 1]) A(skin(cbox(12, 1.2, 14, 0.2), {top: 'ic', sideColor: '#151618'}).translate(0, 3.3 + 0.6, z));
      A(skin(cbox(9, 1.0, 9, 0.2), {top: 'ic', sideColor: '#151618'}).translate(0, 3.3 + 0.5, 18));
      A(screwGeometry(2.2, 1.2).translate(0, 3.3, d / 2 + 2));
      break;
    default: break;
  }
  return out;
}
// identical parts are built once and cloned: a board has hundreds of the same capacitor
const MEMO = new Map();
// (faces that look straight down are dropped, unless the part turns over: the cold plates swing up on their way out)
// (a copy's bounds are left unset: placing it would otherwise measure them again, for nothing)
const keep = (g, keepBottoms) => {if (!g) return g; const k = keepBottoms ? g : dropBottoms(g); k.boundingBox = k.boundingSphere = null; return k;};
const once = (key, make, keepBottoms = false) => {
  if (!MEMO.has(key)) MEMO.set(key, keep(make(), keepBottoms));
  const g = MEMO.get(key);
  return g ? g.clone() : null;
};
// (the same for an assembly built in paced pieces)
const onceAsync = async (key, make, keepBottoms = false) => {
  if (!MEMO.has(key)) MEMO.set(key, keep(await make(), keepBottoms));
  const g = MEMO.get(key);
  return g ? g.clone() : null;
};
// every part of a board onto the kit, the board's top-centre at (x, y, z) in tray metres (the package outlines in
// the list have no part of their own: the packages are built separately)
// (`pace`, a pacer, is awaited after every part)
async function populate(K, parts, x, y, z, pace) {
  for (const p of parts) {
    const g = once(`${p.k}:${p.w}:${p.d}:${p.h}`, () => {const list = partGeo(p); return list.length ? merge(list) : null;});
    if (g) K.add('board', put(g, x + p.x * MM, y, z + p.z * MM, {ry: p.rot === 90 ? Math.PI / 2 : 0, s: MM}));
    await pace();
  }
}

// what stands out of the GPU package's mould (package-local mm, h above the mould's top at 4.25 mm), for the shadows
// painted at their feet (closeup.js's paintMould): the two dies and the eight HBM stacks, where gpuPackage puts them
function mouldLayout() {
  const dd = DIE.d / MM, hx = heroX / MM, out = [];
  for (const k of [-1, 1]) {
    out.push({x: k * hx, z: 0, w: DIE.w / MM, d: dd, h: 3.5 + DIE.h / MM - 4.25});
    for (const kz of [-1, 1]) for (const kx of [-1, 1]) out.push({x: k * hx + kx * (HBM.w / MM / 2 + 0.4), z: kz * (dd / 2 + HBM.d / MM / 2 + 1.2), w: HBM.w / MM, d: HBM.d / MM, h: 3.5 + HBM.h / MM - 4.25});
  }
  return out;
}

// one GPU package (research.md §7): substrate, interposer, the two dies and eight HBM stacks in mould, capacitors.
// Built once in package-local mm, then placed four times.
async function gpuPackage(K, x, z, pace) {
  const at = g => put(g, x, floorY, z, {s: MM});
  K.add('board', at(await onceAsync('gpu-pkg', async () => {
    // (the substrate's edges are sawn, the mould's and the stacks' moulded: all tight rounds, smooth-shaded, their
    // upper edges a shade lighter so they catch the light; the mould's top is painted with the shadows at the stacks'
    // and dies' feet)
    const parts = [
      rim(skin(cbox(76, 2.4, 76, 0.22, 1), {top: 'subG', side: 'satin', sideColor: '#3a3a2d'}), '#454a37', 'satin', '#33372a').translate(0, 1.2, 0),
      solid(cbox(54, 0.3, 60, 0.1), 'satin', '#16171a').translate(0, 2.55, 0),
      solid(cbox(53, 1.1, 59, 0.1, 1), 'rough', '#62666c').translate(0, 2.95, 0),
      rim(skin(cbox(53, 0.75, 59, 0.15, 1), {top: 'mould', side: 'mold'}), '#34363b', 'satin', '#1c1d20').translate(0, 3.875, 0),
    ];
    const dd = DIE.d / MM, hx = heroX / MM;
    for (const k of [-1, 1]) for (const kz of [-1, 1]) for (const kx of [-1, 1]) {
      const hxp = k * hx + kx * (HBM.w / MM / 2 + 0.4), hzp = kz * (dd / 2 + HBM.d / MM / 2 + 1.2);
      parts.push(rim(skin(cbox(HBM.w / MM, HBM.h / MM, HBM.d / MM, 0.18, 1), {top: 'hbm', side: 'mold'}), '#5b606a', 'satin', '#25272c').translate(hxp, 3.5 + HBM.h / MM / 2, hzp));
    }
    for (const c of packageCaps(true)) {parts.push(chipCap(c.w, c.d, 0.5, '#8d785c').translate(c.x, 2.4, c.z)); await pace();}
    return mergeAsync(parts.map(prep), pace);
  })));
  await pace();
  // the dies' tops, the left one mirrored so both dies' link edges face each other. Each die's top edge is a narrow
  // polished chamfer: it takes the texture's pale outermost pixel, and its vertex colour leaves it bright on the edges
  // that face the tray's key light and dark on those that face away
  K.add('die', at(once('gpu-dies', () => {
    const dw = DIE.w / MM, dd = DIE.d / MM, dh = DIE.h / MM, hx = heroX / MM, n = new THREE.Vector3();
    return merge([-1, 1].map(k => {
      const g = prep(cbox(dw, dh, dd, 0.12)), p = g.attributes.position, uv = g.attributes.uv, col = g.attributes.color;
      for (let i = 0; i < p.count; i += 3) {
        const a = new THREE.Vector3().fromBufferAttribute(p, i), b = new THREE.Vector3().fromBufferAttribute(p, i + 1), c = new THREE.Vector3().fromBufferAttribute(p, i + 2);
        n.crossVectors(b.sub(a), c.sub(a)).normalize();
        const up = n.y > 0.5, chamfer = up && n.y < 0.995, lit = chamfer ? 0.3 + 0.7 * Math.pow(facingKey(n), 1.5) : 1;
        for (let j = i; j < i + 3; j++) {
          if (up) {const u = (p.getX(j) + dw / 2) / dw; uv.setXY(j, k < 0 ? 1 - u : u, 1 - (p.getZ(j) + dd / 2) / dd);} else uv.setXY(j, 0.5, 0.5);
          col.setXYZ(j, lit, lit, lit);
        }
      }
      return g.translate(k * hx, 3.5 + dh / 2, 0);
    }));
  })));
}
async function cpuPackage(K, x, z, pace) {
  K.add('board', put(await onceAsync('cpu-pkg', async () => {
    const parts = [
      skin(cbox(52, 2.2, 52, 0.22, 1), {top: 'subC', side: 'satin', sideColor: '#3a3a2d'}).translate(0, 1.1, 0),
      // the lid: nickel-plated copper with a lapped (not polished) top, darker than the steel round it, its edges rounded
      solid(cbox(41, 0.5, 41, 0.2, 1), 'metal', '#9a9fa4').translate(0, 2.45, 0),
      rim(solid(cbox(37, 1.6, 37, 0.8, 2), 'rough', '#767c83'), '#8e949b', 'metal', '#737980').translate(0, 3.5, 0),
    ];
    for (const c of packageCaps(false)) {parts.push(chipCap(c.w, c.d, 0.5, '#8d785c').translate(c.x, 2.2, c.z)); await pace();}
    return mergeAsync(parts.map(prep), pace);
  }), x, floorY, z, {s: MM}));
}

// ---------------------------------------------------------------------------------------------------------------
// the chassis: walls with a folded lip, the slide's inner member, the rear wall (the floor is a mesh of its own, below).
// Each panel is cut from a different stretch of sheet, so each is a shade apart
function chassis(K) {
  const Z = STEEL, add = (w, h, d, x, y, z, r = 0, c = Z) => K.add('metal', put(tint(cbox(w, h, d, r), c), x, y, z));
  for (const s of [-1, 1]) {
    add(0.0015, TRAY.h - 0.0012, TRAY.d, s * (TRAY.w / 2 - 0.00075), -0.0006, 0, 0.0005, s < 0 ? '#9fa5ab' : '#a5abb1');
    add(0.0075, 0.0012, TRAY.d - 0.024, s * (TRAY.w / 2 - 0.0048), lidY - 0.0018, 0, 0.0005, s < 0 ? '#a7adb2' : '#a3a9af');
    // the slide's inner member, riveted to the wall
    add(0.0012, 0.0125, TRAY.d - 0.03, s * (TRAY.w / 2 + 0.0006), y0 + 0.006, 0, 0, '#a3a9af');
    for (const dy of [-1, 1]) add(0.0062, 0.001, TRAY.d - 0.03, s * (TRAY.w / 2 + 0.0037), y0 + 0.006 + dy * 0.0058, 0, 0, '#a3a9af');
    for (let k = 0; k < 6; k++) K.add('board', put(solid(new THREE.CylinderGeometry(1.6, 1.8, 0.8, 12).rotateZ(Math.PI / 2), 'metal', '#d0d3d6'), s * (TRAY.w / 2 + 0.0016), y0 + 0.006, -0.33 + k * 0.13, {s: MM}));
  }
  add(TRAY.w - 0.003, TRAY.h - 0.0012, 0.0015, 0, -0.0006, -TRAY.d / 2 + 0.00075, 0, '#9ca2a8');
  // pressed standoffs in the floor at the front, where the front cards stand
  for (const [x, z] of STANDOFFS) K.add('metal', put(tint(new THREE.CylinderGeometry(0.0028, 0.0032, 0.0016, 16), STEEL), x, floorTop + 0.0008, z));
}
const STANDOFFS = [[-0.18, 0.25], [-0.07, 0.25], [0.045, 0.25], [0.14, 0.25], [0.195, 0.25], [-0.05, 0.37], [0.03, 0.37]];

// the floor: one sheet with a texture of its own, painted whole, so nothing on it repeats (closeup.js), uv'd straight
// down onto it
function floorMesh(F) {
  const w = TRAY.w - 0.003, d = TRAY.d - 0.003, g = dropBottoms(prep(new THREE.BoxGeometry(w, 0.0025, d))), p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / w + 0.5, 0.5 - p.getZ(i) / d);
  g.translate(0, y0 + 0.00125, 0);
  // (vertex colours, all white, only so that it shares the steel's shader rather than compiling one of its own)
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({map: F.map, normalMap: F.normal, normalScale: new THREE.Vector2(0.45, 0.45), roughnessMap: F.rm, color: '#a4aab0', vertexColors: true, roughness: 1, metalness: 1}));
  // (it shades nothing in the tray, so it stays out of the shadow map)
  m.receiveShadow = true;
  return m;
}
// what stands on the floor or over it, for the floor's painted shadows: in floor mm (x across, z towards the front),
// as floorTextures takes them
function floorCasters() {
  const mm = v => v / MM, gap = y => mm(y - floorTop), fz = TRAY.d / 2, boardGap = gap(floorY - 0.0016), busZ0 = -TRAY.d / 2 + 0.008, busZ1 = 0.0115;
  return [
    // the boards and the distribution board on their standoffs, the fans on theirs
    ...BOARDS.map(bx => ({x: mm(bx), z: mm(BOARD_Z), w: 200, d: 370, gap: boardGap})),
    {x: 0, z: 41, w: 410, d: 58, gap: boardGap},
    {x: 0, z: mm(0.105), w: 310, d: 56, h: 36},
    // the front: management board, cards, the drive cage (its top, its walls, its backplane)
    {x: -12, z: mm(fz - 0.061), w: 104, d: 116, gap: gap(-0.0105 - 0.0016)},
    ...[[68, -0.0075], [118, -0.0075], [173.5, -0.0053]].map(([x, py]) => ({x, z: mm(fz - 0.072), w: 50, d: 140, gap: gap(py - 0.0016)})),
    {x: -126.5, z: mm(fz - 0.062), w: 121.5, d: 118, gap: gap(lidY - 0.0026)},
    ...[-1, 1].map(s => ({x: -126.5 + s * 60.75, z: mm(fz - 0.062), w: 0.8, d: 118, h: 35})),
    {x: -126.5, z: mm(fz - 0.123), w: 120, d: 1.6, h: 30},
    // the bus bar along the gap between the boards, the coolant headers across the back, the pressed standoffs
    {x: 0, z: mm((busZ0 + busZ1) / 2), w: 6.4, d: mm(busZ1 - busZ0), h: mm(floorY + 0.0022 - floorTop)},
    ...[SUP_Y, RET_Y].map(y => ({line: [[-200, mm(HEAD_Z)], [200, mm(HEAD_Z)]], width: 10, gap: gap(y - 0.005)})),
    ...STANDOFFS.map(([x, z]) => ({x: mm(x), z: mm(z), r: 3.2, h: 1.6})),
    // the front cards' cables along the walls
    ...[-1, 1].flatMap(s => [0, 1, 2].map(i => {const {pts, r} = frontCable(s, i); return {line: pts.map(([x, , z]) => [mm(x), mm(z)]), width: mm(2 * r), gap: gap(pts[4][1] - r)};})),
  ];
}

// eight 40 mm fans across the middle (research.md §3), in a sheet-metal cage, wired to the distribution board
async function fans(K, pace) {
  await pace.now();
  const fan = fanGeometry(), fy = floorTop + 0.018, fz = 0.105;
  await pace();
  for (let k = 0; k < 8; k++) {
    await pace();
    const x = (k - 3.5) * 0.0385;
    K.add('board', put(fan.clone(), x, fy, fz, {s: MM}));
    // its four wires down to the header on the distribution board
    const hx = x + 0.012;
    ['#16171a', '#b8322a', '#d2b23a', '#2f5fae'].forEach((c, i) => {
      const dx = (i - 1.5) * 0.0011, {geo} = tube([[hx + dx, fy + 0.012, fz - 0.028], [hx + dx, fy + 0.01, fz - 0.033], [hx + dx, floorY + 0.012, 0.0695], [hx + dx, floorY + 0.0065, 0.0652]], 0.00055, 10, 4);
      K.add('board', solid(geo, 'satin', c));
    });
  }
  for (let k = 0; k <= 8; k++) K.add('metal', put(tint(new THREE.BoxGeometry(0.0007, 0.035, 0.05), k % 2 ? '#a6acb2' : '#a0a6ac'), (k - 4) * 0.0385, fy - 0.0005, fz));
  K.add('metal', put(tint(new THREE.BoxGeometry(0.312, 0.0008, 0.058), '#aab0b5'), 0, floorTop + 0.0004, fz));
  for (const s of [-1, 1]) K.add('metal', put(tint(cbox(0.312, 0.003, 0.0012, 0.0004), '#a8aeb4'), 0, fy + 0.0165, fz + s * 0.0285));
}

// the drive cage's cover, punched with rows of vent slots: the sheet as strips between the rows and bars between the
// slots, each slot's edge pressed down into a short collar, and the drives' dark tops below, so each vent is an opening
// with walls, not a mark on the sheet. Built in cover mm (its top at y = 0, centred) and placed at (x, y, z), metres
function driveCageCover(x, y, z, w, d) {
  const T = 0.8, slotW = 8.5, slotD = 3.2, depth = 3.2, t = 0.35, cols = Array.from({length: 9}, (_, i) => -48 + i * 12), rows = [-16, -5, 6, 17, 28];
  const sheet = [], collar = [], below = [];
  const box = (list, x0, x1, z0, z1, y0, y1) => list.push(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2));
  const zs = [-d / 2, ...rows.flatMap(r => [r - slotD / 2, r + slotD / 2]), d / 2], xs = [-w / 2, ...cols.flatMap(c => [c - slotW / 2, c + slotW / 2]), w / 2];
  for (let i = 0; i < zs.length; i += 2) box(sheet, -w / 2, w / 2, zs[i], zs[i + 1], -T, 0);
  for (const r of rows) {
    for (let i = 0; i < xs.length; i += 2) box(sheet, xs[i], xs[i + 1], r - slotD / 2, r + slotD / 2, -T, 0);
    for (const c of cols) {
      const x0 = c - slotW / 2, x1 = c + slotW / 2, z0 = r - slotD / 2, z1 = r + slotD / 2;
      box(collar, x0 - t, x1 + t, z0 - t, z0, -depth, -T); box(collar, x0 - t, x1 + t, z1, z1 + t, -depth, -T);
      box(collar, x0 - t, x0, z0, z1, -depth, -T); box(collar, x1, x1 + t, z0, z1, -depth, -T);
    }
  }
  box(below, cols[0] - 7, cols[8] + 7, rows[0] - 3, rows[4] + 3, -depth - 0.4, -depth);
  // (the collars' inner faces lighter, where the punch bared the metal, so the far wall of each opening catches the
  // light; the drives below near black: the tray's shadow map is far too coarse to darken a hole 3 mm deep)
  return put(merge([solid(merge(sheet), 'satin', '#33363b'), solid(merge(collar), 'satin', '#5d6168'), solid(merge(below), 'matte', '#050506')]), x, y, z, {s: MM});
}

// the front: panel, handles, drive sleds and blanks, drive cage, management board and jacks, network and DPU cards
async function front(K, pace) {
  const fz = TRAY.d / 2;
  K.add('board', put(skin(cbox(TRAY.w, 0.0024, TRAY.h - 0.001, 0.0006), {top: 'bezel', side: 'satin', color: '#26282c'}), 0, -0.0005, fz - 0.0012, {rx: Math.PI / 2}));
  // pull handles in brushed aluminium
  for (const hx of FRONT.handles) {
    for (const dy of [-11, 11]) K.add('board', put(solid(cbox(8, 5, 18, 1.6, 2), 'metal', '#b9bec4'), hx * MM, dy * MM, fz + 0.009, {s: MM}));
    K.add('board', put(solid(cbox(9, 30, 6, 2.6, 2), 'metal', '#c3c8cd'), hx * MM, 0, fz + 0.0175, {s: MM}));
  }
  // drive sleds in four bays, blanks in the other four (four drives in eight bays, research.md §3)
  FRONT.sleds.forEach((x, i) => {
    const X = x * MM;
    if (i < 4) {
      K.add('board', put(skin(cbox(13, 1.5, 36, 0.4), {top: 'sled', sideColor: '#2a2c30'}), X, 0, fz + 0.0008, {rx: Math.PI / 2, s: MM}));
      K.add('board', put(solid(cbox(9.5, 3.4, 4.0, 0.9), 'satin', '#8f5a44'), X, 0.0138, fz + 0.0024, {s: MM}));
      K.add('board', put(skin(new THREE.BoxGeometry(2.4, 1.2, 0.6), {top: 'ledG', side: 'ledG'}), X, 0.00715, fz + 0.0017, {s: MM}));
    } else {
      K.add('board', put(solid(cbox(13, 1.2, 36, 0.4), 'satin', '#2b2d31'), X, 0, fz + 0.0006, {rx: Math.PI / 2, s: MM}));
      for (let k = 0; k < 6; k++) K.add('board', put(solid(new THREE.BoxGeometry(8, 1.1, 0.3), 'matte', '#0b0b0c'), X, (-9 + k * 3.6) * MM, fz + 0.0012, {s: MM}));
    }
  });
  await pace();
  // the drive cage behind them, its backplane, vent slots in its top
  const cx = -0.1265, cw = 0.1215;
  K.add('board', driveCageCover(cx, lidY - 0.0022, fz - 0.062, cw / MM, 118));
  for (const s of [-1, 1]) K.add('board', put(solid(new THREE.BoxGeometry(0.0008, 0.0355, 0.118), 'satin', '#2f3237'), cx + s * cw / 2, floorTop + 0.0178, fz - 0.062));
  K.add('board', put(solid(cbox(0.034, 0.0002, 0.022, 0.0005), 'matte', '#dedcd5'), cx + 0.03, lidY - 0.0021, fz - 0.095));
  K.add('board', put(solid(cbox(0.12, 0.03, 0.0016, 0.0004), 'satin', '#183e2e'), cx, floorTop + 0.016, fz - 0.123));
  // the management board with its jack, buttons and boot drive
  const mx = -0.012, mz = fz - 0.061, my = -0.0105;
  K.add('board', put(skin(cbox(104, 1.6, 116, 0.4), {top: 'mgmt', side: 'edge'}), mx, my - 0.0008, mz, {s: MM}));
  await populate(K, SMALL_BOARDS.mgmt.parts, mx, my, mz, pace);
  const j = FRONT.jack;
  K.add('board', put(solid(cbox(j.w, j.h, 20, 0.5), 'metal', '#c6cacf'), j.x * MM, j.y * MM, fz - 0.0095, {s: MM}));
  K.add('board', put(solid(new THREE.BoxGeometry(11.6, 9.2, 0.6), 'matte', '#08080a'), j.x * MM, (j.y - 5.4) * MM, fz + 0.0006, {s: MM}));
  for (const [dx, led] of [[-4.8, 'ledG'], [4.8, 'ledA']]) K.add('board', put(skin(new THREE.BoxGeometry(2.2, 1.4, 0.4), {top: led, side: led}), (j.x + dx) * MM, (j.y - 0.2) * MM, fz + 0.0006, {s: MM}));
  K.add('board', put(solid(new THREE.BoxGeometry(12.4, 4.8, 0.6), 'matte', '#08080a'), j.x * MM, (j.y + 6.6) * MM, fz + 0.0006, {s: MM}));
  K.add('board', put(solid(new THREE.BoxGeometry(10.2, 1.7, 0.7), 'satin', '#2e5fb6'), j.x * MM, (j.y + 6.0) * MM, fz + 0.0006, {s: MM}));
  for (const [b, c] of [[FRONT.power, '#2b2d31'], [FRONT.id, '#34466e']]) {
    K.add('board', put(solid(new THREE.CylinderGeometry(3.1, 3.3, 2.0, 24).rotateX(Math.PI / 2), 'gloss', c), b.x * MM, b.y * MM, fz + 0.001, {s: MM}));
  }
  // two network cards, two OSFP ports each, and the DPU with two QSFP ports (research.md §3)
  const card = async (cxMM, region, cageW, cageH, cageD, ports, py) => {
    const X = cxMM * MM, Z = fz - 0.072;
    K.add('board', put(skin(cbox(50, 1.6, 140, 0.4), {top: region, side: 'edge'}), X, py - 0.0008, Z, {s: MM}));
    await populate(K, SMALL_BOARDS.nic.parts, X, py, Z, pace);
    // each device on the card (two NICs, one per port, or two DPUs) under a heatsink of its own, fins along the airflow,
    // in the card's free half behind the port cages (research.md §3: four NICs and two DPUs per tray)
    // (24 mm deep, so the rear one clears the cable connector at the card's back edge)
    for (const dz of [-0.048, -0.018]) {
      K.add('board', put(solid(cbox(30, 2, 24, 0.3), 'metal', '#b8bdc3'), X, py + 0.0026, Z + dz, {s: MM}));
      for (let k = 0; k < 11; k++) K.add('board', put(solid(new THREE.BoxGeometry(0.8, 10.5, 24), 'metal', '#c0c5ca'), X + (k - 5) * 0.0028, py + 0.0088, Z + dz, {s: MM}));
    }
    for (const px of ports) {
      K.add('board', put(solid(cbox(cageW, cageH, cageD, 0.4), 'rough', '#959ba2'), px * MM, py + cageH / 2 * MM, fz - cageD / 2 * MM - 0.0003, {s: MM}));
      K.add('board', put(solid(cbox(cageW + 0.8, cageH + 0.8, 3, 0.3), 'metal', '#aab0b6'), px * MM, py + cageH / 2 * MM, fz - 0.0018, {s: MM}));
    }
  };
  await card(68, 'nic', FRONT.osfpW + 1, FRONT.osfpH + 1.4, 72, FRONT.osfp.slice(0, 2), -0.0075);
  await card(118, 'nic', FRONT.osfpW + 1, FRONT.osfpH + 1.4, 72, FRONT.osfp.slice(2), -0.0075);
  await card(173.5, 'dpu', FRONT.qsfpW + 1, FRONT.qsfpH + 1, 56, FRONT.qsfp, -0.0053);
  // OSFP modules plugged into the network ports: finned bodies, the fibre receptacle, a pull tab
  for (const px of FRONT.osfp) {
    const X = px * MM, by = -0.0013;
    K.add('board', put(solid(cbox(22.6, 10.4, 16, 0.7), 'metal', '#aab0b7'), X, by, fz + 0.008, {s: MM}));
    for (let k = 0; k < 9; k++) K.add('board', put(solid(new THREE.BoxGeometry(0.6, 2.4, 16), 'metal', '#b7bcc2'), X + (k - 4) * 0.0024, by + 0.0064, fz + 0.008, {s: MM}));
    K.add('board', put(solid(cbox(10, 3.6, 0.8, 0.2), 'matte', '#0c0c0d'), X, by, fz + 0.0161, {s: MM}));
    K.add('board', put(solid(cbox(6.4, 1.0, 10, 0.45), 'satin', '#2a2c30'), X, by - 0.0043, fz + 0.021, {s: MM}));
    K.add('board', put(solid(cbox(9, 1.4, 4.5, 0.6), 'satin', '#7d8a96'), X, by - 0.0043, fz + 0.0275, {s: MM}));
  }
}

// the power distribution board between the boards and the fans
async function pdb(K, pace) {
  const z = 0.041;
  K.add('board', put(skin(cbox(410, 1.6, 58, 0.4), {top: 'pdb', side: 'edge'}), 0, floorY - 0.0008, z, {s: MM}));
  await populate(K, SMALL_BOARDS.pdb.parts, 0, floorY, z, pace);
}

// the rear: coolant headers and their quick disconnects, the bus-bar connector
async function rear(K, pace) {
  const steel = '#c9ccd0', rz = -TRAY.d / 2;
  for (const [y, x, band] of [[SUP_Y, -0.05, '#3569c4'], [RET_Y, 0.05, '#c4473a']]) {
    await pace();
    // the header across the tray, capped at both ends
    K.add('board', put(solid(new THREE.CylinderGeometry(0.005, 0.005, 0.4, 24).rotateZ(Math.PI / 2), 'metal', steel), 0, y, HEAD_Z));
    for (const s of [-1, 1]) K.add('board', put(solid(new THREE.CylinderGeometry(0.0056, 0.0056, 0.004, 24).rotateZ(Math.PI / 2), 'metal', steel), s * 0.2, y, HEAD_Z));
    // the quick disconnect through the rear wall
    const qd = [
      [new THREE.CylinderGeometry(0.0058, 0.0058, 0.009, 24), HEAD_Z - 0.003, 'metal', steel],
      [new THREE.CylinderGeometry(0.011, 0.011, 0.004, 6), rz - 0.002, 'metal', '#b8bcc1'],
      [new THREE.CylinderGeometry(0.009, 0.009, 0.016, 28), rz - 0.012, 'metal', steel],
      [new THREE.CylinderGeometry(0.0102, 0.0102, 0.01, 40), rz - 0.024, 'rough', '#aeb3b8'],
      [new THREE.CylinderGeometry(0.0104, 0.0104, 0.0024, 40), rz - 0.0178, 'satin', band],
      [new THREE.CylinderGeometry(0.007, 0.007, 0.007, 28), rz - 0.0325, 'metal', steel],
      [new THREE.CylinderGeometry(0.0042, 0.0042, 0.0004, 20), rz - 0.0362, 'matte', '#141414'],
    ];
    for (const [g, gz, f, c] of qd) K.add('board', put(solid(g.rotateX(Math.PI / 2), f, c), x, y, gz));
    // a barb for each board's loop: supply in the board's middle, return near its outer edge
    BOARDS.forEach(bx => {
      const s = Math.sign(bx), bxp = y === SUP_Y ? bx : bx + s * 0.09;
      K.add('board', put(solid(new THREE.CylinderGeometry(0.0032, 0.0032, 0.009, 18).rotateX(Math.PI / 2), 'metal', steel), bxp, y, HEAD_Z + 0.0085));
      K.add('board', put(solid(new THREE.CylinderGeometry(0.0026, 0.0039, 0.0024, 18).rotateX(Math.PI / 2), 'metal', steel), bxp, y, HEAD_Z + 0.0115));
      K.add('board', put(solid(new THREE.CylinderGeometry(0.0058, 0.0058, 0.003, 24).rotateX(Math.PI / 2), 'satin', band), bxp, y, HEAD_Z + 0.0055));
    });
  }
  // the bus-bar connector: a housing through the rear wall with its copper contacts, and a laminated bus bar (two
  // copper conductors in insulating film) along the gap between the boards to the distribution board
  K.add('board', put(solid(cbox(44, 16, 22, 1), 'satin', '#1b1c1f'), 0, -0.002, rz - 0.003, {s: MM}));
  for (let k = 0; k < 4; k++) for (const dy of [-3, 3]) K.add('board', put(solid(cbox(4.5, 2.2, 12, 0.4), 'metal', '#c98a5c'), (k - 1.5) * 0.009, -0.002 + dy * MM, rz - 0.016, {s: MM}));
  const busTop = floorY + 0.0022, busH = busTop - floorTop, busZ0 = rz + 0.008, busZ1 = 0.0115;
  K.add('board', put(paint(cbox(0.0064, busH, busZ1 - busZ0, 0.0006), (c, n) => (n.y > 0.5 ? ['satin', '#1e1c1b'] : Math.abs(c.y) < busH * 0.1 ? ['matte', '#151515'] : ['gloss', '#4e3022'])), 0, floorTop + busH / 2, (busZ0 + busZ1) / 2));
  // bolted ends: a riser into the connector at the back, a tab onto the distribution board at the front
  K.add('board', put(solid(cbox(0.012, 0.0065, 0.008, 0.0008), 'metal', '#c98a5c'), 0, busTop - 0.002, busZ0 + 0.002));
  K.add('board', put(solid(cbox(0.016, 0.0016, 0.022, 0.0006), 'metal', '#c98a5c'), 0, floorY + 0.0102, 0.022));
  K.add('board', put(solid(cbox(0.0064, 0.0115, 0.002, 0.0005), 'metal', '#c98a5c'), 0, floorY + 0.0045, 0.0118));
  for (const z of [busZ0 + 0.002, 0.018, 0.026]) K.add('board', put(screwGeometry(2.6, 1.6), 0, z < 0 ? busTop + 0.0012 : floorY + 0.011, z, {s: MM}));
}

// one of the front cards' cables: from the board's cable connector, along the wall, to its card at the front
function frontCable(s, i) {
  const bx = 0.105 * s, tx = bx + s * (0.064 + i * 0.011), cy = -0.0118 + i * 0.0042, wx = s * (0.2095 - i * 0.0005);
  const end = s > 0 ? [[0.068, 0.118, 0.1735][i], -0.0043, 0.383 - 0.135] : [[-0.126, -0.03, -0.1][i], -0.004, 0.383 - 0.123];
  return {r: 0.0019, pts: [[tx, floorY + 0.0072, -0.0048], [tx, floorY + 0.008, 0.004], [s * 0.2, cy, 0.012], [wx, cy, 0.03], [wx, cy, 0.2], [s * 0.195, cy + 0.002, 0.225], [end[0] + s * 0.02, end[1], end[2] - 0.004], [end[0], end[1], end[2]]]};
}
// cables: the front cards' cables along the side walls to the boards, the power jumpers from the distribution board
async function cables(K, pace) {
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const {pts, r} = frontCable(s, i), {geo} = tube(pts, r, 60, 6);
    K.add('board', solid(geo, 'satin', '#1a1b1e'));
    await pace();
  }
  // power jumpers: distribution board to each board's power connector
  BOARDS.forEach(bx => {
    for (const dx of [-0.006, 0.006]) {
      const sx = bx - 0.040 + dx, ex = Math.sign(bx) * 0.105 + dx;
      const {geo} = tube([[sx, floorY + 0.0095, -0.0025], [sx, floorY + 0.014, 0.004], [ex, floorY + 0.013, 0.01], [ex, floorY + 0.0085, 0.0172]], 0.0033, 20, 8);
      K.add('board', solid(geo, 'rubber', dx < 0 ? '#151619' : '#3a2220'));
    }
  });
}

// ---------------------------------------------------------------------------------------------------------------
// cold plates with their fittings and hoses: one loop per board, supply from the rear header through both GPUs and
// the CPU and back along the board's outer edge to the return header (research.md §3, §5)
async function coldPlates(K, pace) {
  const fit = fittingGeometry();
  const nickel = '#a6acb2', machined = '#959ba2';
  const plate = async (bx, z, gpu) => {
    const by = gpu ? 4.8 : 4.5, bh = 3.5, bodyH = gpu ? 5 : 4.5, ch = gpu ? 3.5 : 3, top = by + bh + bodyH + ch, pz = gpu ? 18 : 13;
    // built once per kind in plate-local mm: a nickel base with screw ears, the machined fin block, the black cover
    // with its two elbow fittings
    K.add('board', put(await onceAsync(gpu ? 'plate-gpu' : 'plate-cpu', async () => {
      const base = gpu ? [84, 84] : [112, 64], body = gpu ? [68, 72] : [60, 50], cover = gpu ? [50, 56] : [34, 38];
      const at = (g, px, py, pz2, ry = 0) => put(g, px, py, pz2, {ry});
      const P = [at(solid(cbox(base[0], bh, base[1], 1.0, 2), 'metal', nickel), 0, by + bh / 2, 0)];
      const [ex, ez] = gpu ? [44, 44] : [58, 34];
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        P.push(at(solid(new THREE.CylinderGeometry(5, 5, bh, 18), 'metal', nickel), sx * ex, by + bh / 2, sz * ez));
        // a captive screw on a spring
        const helix = [];
        for (let t = 0; t <= 1.0001; t += 1 / 30) helix.push(new THREE.Vector3(Math.cos(t * Math.PI * 10) * 2.5, by + bh + t * 3.6, Math.sin(t * Math.PI * 10) * 2.5));
        P.push(at(solid(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), 30, 0.32, 3, false), 'metal', '#9fa4aa'), sx * ex, 0, sz * ez));
        P.push(at(solid(new THREE.CylinderGeometry(3.2, 3.4, 2.8, 16), 'rough', '#2a2c30'), sx * ex, by + bh + 3.6 + 1.4, sz * ez));
        P.push(at(solid(new THREE.CylinderGeometry(1.4, 1.4, 0.06, 6), 'matte', '#0e0e0f'), sx * ex, by + bh + 3.6 + 2.83, sz * ez));
        await pace();
      }
      P.push(at(solid(cbox(body[0], bodyH, body[1], 1.4, 2), 'rough', machined), 0, by + bh + bodyH / 2, 0));
      // the fin block's machining shows as fine grooves round the body
      for (let k = 1; k < 4; k++) P.push(at(solid(cbox(body[0] + 0.2, 0.25, body[1] + 0.2, 0.1), 'rough', '#9ea3a8'), 0, by + bh + k * bodyH / 4, 0));
      P.push(at(skin(cbox(cover[0], ch, cover[1], 1.0, 2), {top: 'cover', side: 'satin', sideColor: '#17181b'}), 0, top - ch / 2, 0));
      P.push(at(fit.clone(), 0, top, -pz, Math.PI), at(fit.clone(), 0, top, pz, 0));
      return merge(P);
    }, true), bx, floorY, z, {s: MM}));
    // where each hose starts: the barb's tip, in tray metres
    return {inlet: [bx, floorY + (top + 5.6) * MM, z - (pz + 6.5) * MM], outlet: [bx, floorY + (top + 5.6) * MM, z + (pz + 6.5) * MM]};
  };
  const hose = (pts, tags = [], r = 0.0042) => {
    const {curve, geo} = tube(pts, r, Math.max(20, Math.round(curve0Len(pts) / 0.005)), 10);
    K.add('board', solid(geo, 'rubber', '#141517'));
    for (const t of [0.012, 0.988]) K.add('board', solid(sleeve(curve, t, 0.0028, r + 0.0005, 14), 'metal', '#c8cbd0'));
    for (const [t, c] of tags) K.add('board', solid(sleeve(curve, t, 0.012, r + 0.00055, 14), 'satin', c));
  };
  const BLUE = '#3569c4', RED = '#c4473a';
  for (const bx of BOARDS) {
    const s = Math.sign(bx);
    const gB = await plate(bx, GPU_Z[1], true), gA = await plate(bx, GPU_Z[0], true), cpu = await plate(bx, CPU_Z, false);
    await pace();
    const sup = [bx, SUP_Y, HEAD_Z + 0.012], ret = [bx + s * 0.09, RET_Y, HEAD_Z + 0.012], yH = gB.inlet[1], yC = cpu.inlet[1];
    hose([sup, [bx, SUP_Y + 0.0006, sup[2] + 0.01], [bx, SUP_Y + 0.008, sup[2] + 0.022], [bx, yH - 0.002, gB.inlet[2] - 0.012], gB.inlet], [[0.3, BLUE]]);
    hose([gB.outlet, [bx, yH + 0.0018, (gB.outlet[2] + gA.inlet[2]) / 2], gA.inlet]);
    hose([gA.outlet, [bx, (yH + yC) / 2 + 0.0012, (gA.outlet[2] + cpu.inlet[2]) / 2], cpu.inlet]);
    hose([cpu.outlet, [bx, yC + 0.0004, cpu.outlet[2] + 0.012], [bx + s * 0.03, yC + 0.0008, cpu.outlet[2] + 0.02], [bx + s * 0.074, yC + 0.0008, cpu.outlet[2] + 0.004], [bx + s * 0.086, yC + 0.0008, -0.08], [bx + s * 0.086, yC + 0.0006, -0.3], [bx + s * 0.089, RET_Y + 0.001, ret[2] + 0.02], ret], [[0.03, RED], [0.965, RED]]);
    await pace();
  }
}
const curve0Len = pts => {let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]); return l;};

// ---------------------------------------------------------------------------------------------------------------
// (built in small pieces: `step`, scene.js's, gives the page its main thread back and stops a cancelled build. It is
// taken whenever a few milliseconds of work have gone by (closeup.js's pacer), so no piece blocks the page for long)
export async function buildTray(step = async () => {}) {
  const tray = new THREE.Group(), lid = new THREE.Group(), plates = new THREE.Group(), pace = pacer(step);
  const A = await trayAtlasAsync(pace, {mould: mouldLayout()});
  await pace();
  const Z = await steelTileAsync(pace);
  await pace();
  const floor = floorMesh(await floorTextures((TRAY.w - 0.003) / MM, (TRAY.d - 0.003) / MM, floorCasters(), pace));
  await pace();
  // (the atlas's roughness layer is an occlusion-roughness-metalness map: its red is the parts' contact shadows)
  const boardMat = new THREE.MeshStandardMaterial({
    map: A.map, normalMap: A.normal, normalScale: new THREE.Vector2(0.55, 0.55), roughnessMap: A.rm, metalnessMap: A.rm, aoMap: A.rm, aoMapIntensity: 1,
    emissiveMap: A.e, emissive: '#ffffff', emissiveIntensity: 2.2, vertexColors: true, roughness: 1, metalness: 1,
  });
  const steelMat = new THREE.MeshStandardMaterial({map: Z.map, normalMap: Z.normal, normalScale: new THREE.Vector2(0.3, 0.3), roughnessMap: Z.rm, vertexColors: true, roughness: 1, metalness: 1});
  // (ground silicon: dark and neutral, with a soft sheen, so the light lines drawn on it stay legible)
  // (ground silicon: its finish streaked along the grinding arcs, averaging the same 0.34, so the drawing over it gets no glare)
  const dieMat = new THREE.MeshPhysicalMaterial({map: dieTexture(), roughnessMap: dieRoughness(), roughness: 1, metalness: 0.3, clearcoat: 0.2, clearcoatRoughness: 0.3, vertexColors: true});

  const K = new Kit(), parts = boardParts(), packages = [];
  chassis(K);
  await pace();
  for (const [bi, bx] of BOARDS.entries()) {
    K.add('board', put(skin(cbox(200, 1.6, 370, 0.4), {top: 'board', side: 'edge'}), bx, floorY - 0.0008, BOARD_Z, {s: MM}));
    await populate(K, parts, bx, floorY, BOARD_Z, pace);
    for (const [gi, gz] of GPU_Z.entries()) {
      await gpuPackage(K, bx, gz, pace);
      const anchor = new THREE.Group();
      anchor.position.set(bx, floorY, gz); anchor.userData.hero = bi === 1 && gi === 0;
      tray.add(anchor); packages.push(anchor);
    }
    await cpuPackage(K, bx, CPU_Z, pace);
  }
  await fans(K, pace); await front(K, pace); await pdb(K, pace); await rear(K, pace); await cables(K, pace);
  await pace();
  const board = await K.meshAsync('board', boardMat, {}, pace), metal = await K.meshAsync('metal', steelMat, {tile: 0.12}, pace), dies = await K.meshAsync('die', dieMat, {}, pace);
  tray.add(reflect(board, 0.9), reflect(metal, 1.1), reflect(dies, 0.8), reflect(floor, 1.1));

  // the blue locate light on the front, and its glow
  const locate = new THREE.Group();
  locate.add(new THREE.Mesh(new THREE.CircleGeometry(0.0024, 20), new THREE.MeshBasicMaterial({color: '#4a74ff', toneMapped: false, transparent: true})));
  locate.add(new THREE.Sprite(new THREE.SpriteMaterial({map: glow(true), color: '#4a74ff', blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true})));
  locate.children[1].scale.setScalar(0.08);
  // and its light spilling on the face round it
  locate.add(new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.035), new THREE.MeshBasicMaterial({map: glow(), color: '#3a5fd8', blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, transparent: true})));
  locate.children[2].position.z = 0.0004;
  locate.position.set(FRONT.locate.x * MM, FRONT.locate.y * MM, TRAY.d / 2 + 0.0008); tray.add(locate);

  // cold plates on every package, screwed down at the corners, with their hose loops back to the rear headers. The
  // assembly lifts off, holds over the boards, then swings up about its back edge (where its hoses meet the headers)
  // and out of the camera's way; it has a material of its own
  await pace();
  const KP = new Kit({bottoms: true});
  await coldPlates(KP, pace);
  plates.add(reflect(await KP.meshAsync('board', boardMat.clone(), {}, pace), 0.75));
  await pace();

  // the lid: steel with pressed ribs, louvres and a service label. It slides off forward, as 1U lids do, and lifts away
  await pace.now();
  const L = lidTextures(TRAY.w * 1000, TRAY.d * 1000);
  await pace.now();
  const lidMat = new THREE.MeshStandardMaterial({map: L.map, normalMap: L.normal, normalScale: new THREE.Vector2(0.6, 0.6), roughnessMap: L.rm, color: '#a1a7ad', roughness: 1, metalness: 1});
  const lidGeo = merge([
    new THREE.BoxGeometry(TRAY.w + 0.0016, 0.001, TRAY.d).translate(0, -0.0005, TRAY.d / 2),
    ...[-1, 1].map(s => new THREE.BoxGeometry(0.0008, 0.006, TRAY.d - 0.004).translate(s * (TRAY.w / 2 + 0.0004), -0.003, TRAY.d / 2)),
    new THREE.BoxGeometry(TRAY.w + 0.0016, 0.006, 0.0008).translate(0, -0.003, TRAY.d - 0.0004),
  ]);
  const lidMesh = new THREE.Mesh(lidGeo, lidMat);
  lidMesh.castShadow = lidMesh.receiveShadow = true;
  const KL = new Kit();
  KL.add('board', put(skin(cbox(60, 0.2, 40, 0.05), {top: 'label', side: 'matte', color: '#e9e7e1'}), 0.115, 0.0001, TRAY.d - 0.085, {s: MM}));
  for (const sx of [-0.18, -0.06, 0.06, 0.18]) KL.add('board', put(screwGeometry(2.4, 0.35), sx, -0.0003, TRAY.d - 0.012, {s: MM}));
  const labelMesh = KL.mesh('board', boardMat);
  lid.add(reflect(lidMesh, 1.0), reflect(labelMesh, 0.9));
  lid.position.set(0, TRAY.h / 2, -TRAY.d / 2);
  lid.userData.casters = [lidMesh, labelMesh];
  tray.add(plates, lid);
  tray.userData = {lid, plates, packages, locate};

  // the slides, fixed to the rack (built here, placed in poseTray): an outer member that ends at the rack's face, and
  // an intermediate member that telescopes out half as far as the tray, so it never leads it. The tray's own inner
  // member is part of the chassis. Both in the chassis's steel, a shade darker
  const rails = new THREE.Group(), mid = new THREE.Group(), KR = new Kit(), KM = new Kit(), ry = -TRAY.h / 2 + 0.006, W = TRAY.w / 2;
  for (const s of [-1, 1]) {
    KR.add('metal', tint(new THREE.BoxGeometry(0.0012, 0.019, 0.74).translate(s * (W + 0.0135), ry, -0.37), '#858b91'));
    for (const dy of [-1, 1]) KR.add('metal', tint(new THREE.BoxGeometry(0.0105, 0.0012, 0.74).translate(s * (W + 0.0083), ry + dy * 0.0089, -0.37), '#858b91'));
    KM.add('metal', tint(new THREE.BoxGeometry(0.001, 0.0145, 0.69).translate(s * (W + 0.0118), ry, -0.355), '#90969c'));
    for (const dy of [-1, 1]) KM.add('metal', tint(new THREE.BoxGeometry(0.0042, 0.001, 0.69).translate(s * (W + 0.0099), ry + dy * 0.0068, -0.355), '#90969c'));
    // the member's front stop, and the rivets that hold its bearing cage
    KM.add('metal', tint(cbox(0.0034, 0.0145, 0.004, 0.0006).translate(s * (W + 0.0101), ry, -0.012), '#6c7278'));
    for (let k = 0; k < 4; k++) KM.add('metal', tint(new THREE.CylinderGeometry(0.0012, 0.0012, 0.0008, 10).rotateZ(Math.PI / 2).translate(s * (W + 0.0126), ry, -0.06 - k * 0.09), '#b3b8bd'));
  }
  const railMat = steelMat.clone();
  rails.add(reflect(KR.mesh('metal', railMat, {tile: 0.12}), 0.7));
  mid.add(reflect(KM.mesh('metal', railMat, {tile: 0.12}), 0.7));
  rails.add(mid);
  rails.userData.mid = mid;
  tray.userData.rails = rails;
  return tray;
}

// where the cold-plate assembly turns as it swings up: its back edge, over the rear of the boards (tray-local)
const PIVOT = {y: floorY + 0.012, z: -0.315};
// the tray's pose at progress p: slides out on its rails, the lid slides off and lifts away, the cold plates lift,
// hold, then swing up clear of the dive
export function poseTray(tray, p, time = 0) {
  const e0 = T.explode[0], e1 = T.explode[1];
  const slide = smoother(seg(p, T.slide)), lift = smoother(seg(p, [T.slide[1] - 0.012, e0 + 0.02]));
  tray.visible = p > T.power[1] - 0.006 && p < T.swap[1];
  tray.position.set(PICK.x, lerp(slotY + TRAY.h / 2, outY, lift), lerp(inZ, outZ, slide));
  const {lid, plates, locate, rails} = tray.userData;
  if (!rails.parent && tray.parent) tray.parent.add(rails);
  rails.position.set(PICK.x, slotY + TRAY.h / 2, frontZ);
  rails.visible = p > T.slide[0] && p < T.swap[1];
  rails.userData.mid.position.z = 0.5 * SLIDE * slide;
  locate.visible = p > T.power[1] - 0.004 && p < e0;
  // bright for most of each second, then dim (the lens, its glow and the spill on the face never go out, so it reads as a
// light in a still frame too)
  const blink = time % 1 < 0.7 ? 1 : 0;
  locate.children[0].material.opacity = 0.5 + 0.5 * blink;
  locate.children[1].material.opacity = 0.3 + 0.7 * blink; locate.children[2].material.opacity = 0.3 + 0.25 * blink;
  // the lid unlatches and rises clear of the front panel, slides forward until its back edge is off the rack's face,
  // then lifts away above the frame
  const pop = smoother(seg(p, [e0, e0 + 0.003])), fwd = smoother(seg(p, [e0 + 0.0025, e0 + 0.009])), away = smoother(seg(p, [e0 + 0.006, e0 + 0.016]));
  lid.position.set(0, TRAY.h / 2 + 0.008 * pop + 1.2 * away * away, -TRAY.d / 2 + 0.1 * fwd);
  lid.visible = away < 0.999;
  for (const m of lid.userData.casters) m.castShadow = away < 0.02;
  // the cold plates lift 70 mm and hold there for the exploded view, then swing up about their back edge
  const up = smoother(seg(p, [e0 + 0.018, e0 + 0.034])), swing = smoother(seg(p, [e1 + 0.006, e1 + 0.04]));
  const a = -1.33 * swing, c = Math.cos(a), s = Math.sin(a);
  plates.rotation.x = a;
  plates.position.set(0, 0.07 * up + PIVOT.y - (PIVOT.y * c - PIVOT.z * s), PIVOT.z - (PIVOT.y * s + PIVOT.z * c));
  plates.visible = p < T.dive[1] + 0.01;
}
export {frontZ, slotY};
