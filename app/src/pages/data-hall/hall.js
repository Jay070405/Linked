// The hall, built from plan.js in a builder's order: slab, columns and walls, the power rooms, the hot-aisle frames
// with the busway, fibre trays and coolant pipes they carry, the plant, and the racks last, then their connections.
// Each family of pieces is one instanced draw (plus its edges).
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {CUT, ROOMS, BOUNDS, ROWS, RACKS, RACK, HOT_AISLES, COLD_AISLES, CDUS, FANWALLS, SWITCHBOARDS, UPS, BATTERIES, MDA, COLUMNS, WALL, WALLS, OVERHEAD, ROW_X0, ROW_X1, PICK, PICK_SLOT, U1, RACK_BASE, WALK_Z, STACK, NET_STACK, PER_ROW} from './plan';
import {T} from './timeline';
import {buildable, instances, SHAPES} from './build';
import {rackFronts, rackLights, concrete, fanFace, contact, FRONT} from './textures';

const span = ([a, b]) => b - a;
const std = (color, roughness = 0.8, metalness = 0, extra = {}) => buildable(new THREE.MeshStandardMaterial({color, roughness, metalness, ...extra}));
// a material's real colour broken by slots across it every 14 cm, in x and in z (the fibre trays' perforated floor)
const slotted = mat => {
  const grow = mat.onBeforeCompile, key = mat.customProgramCacheKey;
  mat.onBeforeCompile = (shader, renderer) => {
    grow(shader, renderer);
    shader.fragmentShader = shader.fragmentShader.replace('#include <roughnessmap_fragment>', 'float slot = max(step(.78, fract(vWPos.x / .14)), step(.78, fract(vWPos.z / .14)));\ndiffuseColor.rgb *= 1. - .32 * slot * realM;\n#include <roughnessmap_fragment>');
  };
  mat.customProgramCacheKey = () => key() + 'slot';
  return mat;
};
// a row end's side panel, once real (on a unit box, x its thickness): a little darker and rougher towards the foot, a
// 5 mm chamfer round each edge that turns towards the light, and on the front panel (aLabel, the rack's face) a printed
// asset label, two lines of text-like marks over a barcode, different on every rack (vDH: the panel's depth, height
// and aLabel)
const sidePanel = mat => {
  const grow = mat.onBeforeCompile, key = mat.customProgramCacheKey;
  mat.onBeforeCompile = (shader, renderer) => {
    grow(shader, renderer);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aLabel;\nvarying vec3 vBox;\nvarying vec3 vDH;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvBox = position; vDH = vec3(length(instanceMatrix[2].xyz), length(instanceMatrix[1].xyz), aLabel);');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vBox;\nvarying vec3 vDH;\nfloat sideHash(float n){ return fract(sin(n) * 43758.5453); }')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        float rise = smoothstep(.07, 2., vWPos.y);
        roughnessFactor += .2 * (1. - rise) * realM;
        // (e: metres to the nearest edge of the face, dir: the way that edge faces; never drawn under a pixel and a bit
        // wide, but weaker by as much, so a far or edge-on chamfer is a faint line rather than a broken one)
        float ez = (.5 - abs(vBox.z)) * vDH.x, ey = min(vBox.y, 1. - vBox.y) * vDH.y, e = min(ez, ey), fw = fwidth(e) + 1e-6, bw = max(.005, 1.3 * fw);
        vec3 dir = ez < ey ? vec3(0., 0., sign(vBox.z)) : vec3(0., sign(vBox.y - .5), 0.);
        float bevel = (1. - smoothstep(bw - fw, bw + fw, e)) * .005 / bw * realM;
        // the label: 85 × 50 mm, 70 mm back from the front edge, 1.32 m up, read left to right from outside the row
        vec2 q = vec2(((.5 - vBox.z * vDH.z) * vDH.x - .07) / .085, (vWPos.y - 1.32) / .05);
        if (vDH.z * sign(vWPos.x - vAnchor.x) < 0.) q.x = 1. - q.x;
        vec2 fq = fwidth(q) + 1e-6, b = smoothstep(-fq, fq, q) * smoothstep(-fq, fq, 1. - q);
        float lab = b.x * b.y * step(.5, abs(vDH.z)) * realM, seed = floor(vAnchor.x * 7.1 + vAnchor.y * 3.7);
        float band = smoothstep(.1, .14, q.x) * smoothstep(.1, .14, .92 - q.x);
        float bars = mix(step(fract(q.x * 18.), .3 + .45 * sideHash(floor(q.x * 18.) * 1.7 + seed)), .5, smoothstep(.45, .9, fwidth(q.x * 18.)));
        float words = mix(step(.25, sideHash(floor(q.x * 11.) + seed * 3.1 + step(.65, q.y) * 17.)) * step(fract(q.x * 11.), .8), .6, smoothstep(.3, .7, fwidth(q.x * 11.)));
        float ink = max(bars * band * smoothstep(.1, .14, q.y) * smoothstep(.5, .54, 1. - q.y),
                        words * smoothstep(.1, .14, q.x) * (smoothstep(.72, .75, q.y) * smoothstep(.13, .16, 1. - q.y) * step(q.x, .8) + smoothstep(.56, .59, q.y) * smoothstep(.31, .34, 1. - q.y) * step(q.x, .56)));
        diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(.46, .46, .44), vec3(.02), ink), lab);
        roughnessFactor = mix(roughnessFactor, .62, lab); metalnessFactor = mix(metalnessFactor, 0., lab);
        // (the lower edge faces the floor: half the turn, and no lift)
        float tilt = bevel * (dir.y < -.5 ? .5 : 1.) * (1. - lab);
        diffuseColor.rgb *= 1. + .3 * tilt * step(-.5, dir.y);
        normal = normalize(normal + tilt * normalize((viewMatrix * vec4(dir, 0.)).xyz));`)
      // (the value ramp goes on the light that leaves it: seen this edge-on the steel is mostly a mirror, of the dark
      // ceiling up top and the bright slab lower down, which no change of paint would turn round)
      .replace('#include <opaque_fragment>', 'outgoingLight *= mix(1., mix(.56, 1.2, rise), realM);\n#include <opaque_fragment>');
  };
  mat.customProgramCacheKey = () => key() + 'side';
  return mat;
};
// for a rack and what is fixed to it: real or drawn as a whole, judged from the rack's centre (each item's ax, az)
const onRack =(color, roughness = 0.8, metalness = 0, extra = {}, realOnly = false) => buildable(new THREE.MeshStandardMaterial({color, roughness, metalness, ...extra}), {anchored: true, realOnly});
const BLUE = '#2f6fd6', RED = '#d64a3a', STEEL = '#c2c6cc';

// (built in steps: `step`, awaited between them, gives the page its main thread back; scene.js passes its own)
export async function buildHall(step = async () => {}) {
  const group = new THREE.Group(), H = ROOMS.hall;

  // slab, a little larger than the building
  const slabTex = concrete();
  const sx = BOUNDS.x1 - BOUNDS.x0 + 0.8, sz = BOUNDS.z1 - BOUNDS.z0 + 0.8;
  slabTex.repeat.set(sx / 6, sz / 6);
  // (sealed concrete, with enough gloss to catch the aisle lights)
  const slabMat = buildable(new THREE.MeshStandardMaterial({color: '#c2c2c0', map: slabTex, roughness: 0.3, metalness: 0}), {floorShade: false});
  group.add(instances(SHAPES.box(), slabMat, [{x: (BOUNDS.x0 + BOUNDS.x1) / 2, y: -0.3, z: (BOUNDS.z0 + BOUNDS.z1) / 2, w: sx, h: 0.3, d: sz, start: T.slab[0], dur: span(T.slab)}]));

  // columns and walls
  group.add(instances(SHAPES.box(), std('#cfcdc8', 0.85), COLUMNS.map((c, i) => ({x: c.x, z: c.z, w: 0.5, h: WALL.h, d: 0.5, start: T.columns[0] + i * 0.0011, dur: 0.012})), {shadow: true}));
  group.add(instances(SHAPES.box(), std('#e9e8e4', 0.9), WALLS.flatMap((w, i) => {
    const L = Math.hypot(w.x1 - w.x0, w.z1 - w.z0), ux = (w.x1 - w.x0) / L, uz = (w.z1 - w.z0) / L;
    const base = {x: (w.x0 + w.x1) / 2, z: (w.z0 + w.z1) / 2, w: L + (w.exterior ? 0.4 : 0.3), d: w.exterior ? 0.4 : 0.3, rot: Math.atan2(-uz, ux)};
    return [{...base, h: CUT, start: T.walls[0] + i * 0.0018, dur: 0.02}, {...base, y: CUT, h: WALL.h - CUT, start: T.rooms[1] + 0.02 + i * 0.0012, dur: 0.02}];
  }), {shadow: true}));

  // power rooms
  const eq = (list, color, start, step, rough = 0.6, metal = 0.2) => instances(SHAPES.box(), std(color, rough, metal), list.map((e, i) => ({x: e.x, z: e.z, w: e.w, h: e.h, d: e.d, start: start + i * step, dur: 0.012})), {shadow: true});
  group.add(eq(SWITCHBOARDS, '#c4c8ce', T.rooms[0], 0.004));
  group.add(eq(UPS, '#34373c', T.rooms[0] + 0.01, 0.002));
  group.add(eq(BATTERIES, '#26282c', T.rooms[0] + 0.02, 0.0012));

  // (drawn with ink edges: a 4 cm bar is thinner than a pixel from across the hall, and only a line stays unbroken)
  // hot-aisle frames, which carry the services: a post at each corner, beams along both edges of the aisle, and at
  // five points along the row hanger rods holding a crossbar under each service (busway, fibre, supply, return)
  const frames = [], roofs = [], doors = [], top = OVERHEAD.ret + 0.25;
  HOT_AISLES.forEach((h, p) => {
    const t = T.frames[0] + p * 0.006, zf0 = ROWS[p * 2].z0 + 0.05, zf1 = ROWS[p * 2 + 1].z1 - 0.05;
    for (const z of [h.z0, h.z1]) {
      for (const x of [ROW_X0 - 0.06, ROW_X1 + 0.06]) frames.push({x, z, w: 0.08, h: top, d: 0.08, start: t, dur: 0.01});
      frames.push({x: (ROW_X0 + ROW_X1) / 2, y: top - 0.08, z, w: ROW_X1 - ROW_X0 + 0.2, h: 0.08, d: 0.06, axis: 1, start: t + 0.008, dur: 0.01});
    }
    for (let k = 0; k <= 4; k++) {
      const x = ROW_X0 + k * (ROW_X1 - ROW_X0) / 4, tk = t + 0.016 + k * 0.0015;
      for (const z of [h.z0, h.z1]) frames.push({x, y: OVERHEAD.busway - 0.06, z, w: 0.02, h: top - OVERHEAD.busway + 0.06, d: 0.02, start: tk, dur: 0.006});
      for (const y of [OVERHEAD.busway - 0.05, OVERHEAD.tray - 0.05, OVERHEAD.supply - 0.05, OVERHEAD.ret - 0.05]) frames.push({x, y, z: (zf0 + zf1) / 2, w: 0.04, h: 0.04, d: zf1 - zf0, axis: 3, start: tk + 0.002, dur: 0.006});
    }
    roofs.push({x: (ROW_X0 + ROW_X1) / 2, y: RACK.h, z: (h.z0 + h.z1) / 2, w: ROW_X1 - ROW_X0, h: 0.05, d: h.z1 - h.z0, axis: 1, start: t + 0.008, dur: 0.012});
    // the end doors: dark powder-coated steel, glazed in their top third
    for (const x of [ROW_X0 - 0.03, ROW_X1 + 0.03]) {
      doors.push({x, y: 0, z: (h.z0 + h.z1) / 2, w: 0.05, h: RACK.h * 0.66, d: h.z1 - h.z0, start: t + 0.016, dur: 0.008});
      roofs.push({x, y: RACK.h * 0.66, z: (h.z0 + h.z1) / 2, w: 0.05, h: RACK.h * 0.34, d: h.z1 - h.z0, start: t + 0.02, dur: 0.006});
    }
  });
  const frameMat = std('#8d939b', 0.4, 0.7), thin = f => Math.min(f.w, f.d) < 0.05;
  group.add(instances(SHAPES.box(), frameMat, frames.filter(f => !thin(f)), {shadow: true}));
  group.add(instances(SHAPES.box(), frameMat, frames.filter(thin), {shadow: true, edgeWeight: 0.38}));
  group.add(instances(SHAPES.box(), std('#dfe6ea', 0.25, 0.1, {transparent: true, opacity: 0.86}), roofs));
  group.add(instances(SHAPES.box(), std('#2a2c30', 0.5, 0.3), doors, {shadow: true}));
  await step();
  // the ducted return: clear panels from the containment roof up to the ceiling plenum along both edges
  const ducts = HOT_AISLES.flatMap((h, p) => [h.z0, h.z1].map(z => ({x: (ROW_X0 + ROW_X1) / 2, y: RACK.h + 0.05, z, w: ROW_X1 - ROW_X0, h: OVERHEAD.ceiling - RACK.h - 0.05, d: 0.03, start: T.frames[0] + 0.02 + p * 0.004, dur: 0.012})));
  group.add(instances(SHAPES.box(), std('#e8eef2', 0.15, 0.05, {transparent: true, opacity: 0.26, depthWrite: false}), ducts, {edges: false}));

  // busway over the back of each row, fed from a trunk that comes in from the electrical gallery at the east end
  // (both trunks run at the east end, so the camera's descent at the west end has a clear view down the aisle)
  const bus = [], busX1 = ROW_X1 + 0.9;
  bus.push({x: busX1, y: OVERHEAD.busway, z: (H.z0 + ROWS.at(-1).z1) / 2, w: 0.13, h: 0.2, d: ROWS.at(-1).z1 - H.z0, axis: 3, start: T.busway[0], dur: 0.012});
  ROWS.forEach((row, r) => {
    const z = (row.z0 + row.z1) / 2 - row.face * 0.3;
    bus.push({x: (ROW_X0 - 0.06 + busX1) / 2, y: OVERHEAD.busway, z, w: busX1 - ROW_X0 + 0.06, h: 0.2, d: 0.13, axis: 2, start: T.busway[0] + 0.01 + r * 0.003, dur: span(T.busway) - 0.025});
  });
  group.add(instances(SHAPES.box(), std('#b8bcc2', 0.38, 0.75), bus, {shadow: true}));

  // fibre: a yellow trunk from the network room in the north-east corner, down the east end, then a tray over the
  // front of each row
  const fibre = [], trayX1 = ROW_X1 + 1.3;
  fibre.push({x: trayX1, y: OVERHEAD.tray, z: (H.z0 + ROWS.at(-1).z1) / 2, w: 0.4, h: 0.1, d: ROWS.at(-1).z1 - H.z0, axis: 3, start: T.trays[0], dur: 0.012});
  ROWS.forEach((row, r) => {
    const z = (row.z0 + row.z1) / 2 + row.face * 0.32;
    fibre.push({x: (ROW_X0 - 0.06 + trayX1) / 2, y: OVERHEAD.tray, z, w: trayX1 - ROW_X0 + 0.06, h: 0.08, d: 0.3, axis: 2, start: T.trays[0] + 0.01 + r * 0.003, dur: span(T.trays) - 0.026});
  });
  // (a slotted floor: a darker slot every 14 cm along each run, once the tray is real)
  const fibreMat = slotted(std('#d4a82a', 0.75, 0));
  group.add(instances(SHAPES.box(), fibreMat, fibre, {shadow: true}));
  // the tray's side walls: a lip along both long edges of every run, standing 4 cm above its floor
  const lips = fibre.flatMap(f => (f.axis === 3 ? [-1, 1].map(k => ({...f, x: f.x + k * (f.w / 2 - 0.006), y: OVERHEAD.tray, w: 0.012, h: 0.12})) : [-1, 1].map(k => ({...f, z: f.z + k * (f.d / 2 - 0.006), y: OVERHEAD.tray, d: 0.012, h: 0.12}))));
  group.add(instances(SHAPES.box(), std('#c99f27', 0.7, 0), lips, {edges: false}));

  // coolant: a supply and a return header over every hot aisle, run west from the pod's CDUs, with blue and red
  // collars every 1.2 m (no standard colours the pipes themselves; research.md §9)
  const pipes = [], collars = [], pipeX0 = ROW_X0 - 0.3, pipeX1 = CDUS[0].x;
  HOT_AISLES.forEach((h, p) => {
    const zc = (h.z0 + h.z1) / 2, start = T.pipes[0] + p * 0.006, dur = span(T.pipes) - 0.02;
    for (const [k, y, color] of [[-1, OVERHEAD.supply, BLUE], [1, OVERHEAD.ret, RED]]) {
      const z = zc + k * 0.25;
      pipes.push({x: (pipeX0 + pipeX1) / 2, y, z, w: pipeX1 - pipeX0, h: 0.16, d: 0.16, axis: 2, start, dur, color: STEEL});
      for (let x = pipeX1 - 0.6; x > pipeX0; x -= 1.2) collars.push({x, y: y - 0.01, z, w: 0.06, h: 0.18, d: 0.18, axis: 5, start: start + dur * (pipeX1 - x) / (pipeX1 - pipeX0), dur: 0.004, color});
    }
  });
  group.add(instances(SHAPES.runX(), std('#ffffff', 0.3, 0.6), pipes, {shadow: true, edges: false, outline: true}));
  group.add(instances(SHAPES.runX(), std('#ffffff', 0.45, 0.1), collars, {edges: false}));

  await step();
  // plant: CDUs at the east end of each pod (with risers to the headers) and fan walls on the short walls
  // (the CDU cabinets in a mid grey: in the powered hall a pale cabinet would be the brightest thing in view)
  group.add(eq(CDUS, '#9da1a7', T.plant[0], 0.0025, 0.55, 0.2));
  const fan = fanFace(), fanMat = buildable(new THREE.MeshStandardMaterial({color: '#ffffff', map: fan.map, normalMap: fan.normal, roughness: 0.6, metalness: 0.3}));
  group.add(instances(SHAPES.box(), fanMat, FANWALLS.map((e, i) => ({x: e.x, z: e.z, w: e.w, h: e.h, d: e.d, start: T.plant[0] + 0.01 + i * 0.003, dur: 0.012})), {shadow: true}));
  // each fan of a wall's face into the hall, where the drawn one is (textures.js fanFace: 6 × 4 on a 0.96 m pitch):
  // a shroud standing proud of the face, a hub and five blades, so the face has depth when the aisle looks at it
  const fanShape = (() => {
    const parts = [new THREE.CylinderGeometry(0.385, 0.385, 0.07, 32, 1, true).rotateZ(Math.PI / 2).translate(0.035, 0, 0), new THREE.CylinderGeometry(0.11, 0.12, 0.09, 20).rotateZ(Math.PI / 2).translate(0.03, 0, 0)];
    for (let b = 0; b < 5; b++) parts.push(new THREE.BoxGeometry(0.012, 0.26, 0.1).translate(0.02, 0.24, 0).rotateY(0.35).rotateX(b * Math.PI * 2 / 5));
    return mergeGeometries(parts.map(g => g.index ? g.toNonIndexed() : g));
  })();
  const fans = [];
  FANWALLS.forEach((e, i) => {
    const inward = e.x < 0 ? 1 : -1;
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6; k++) fans.push({x: e.x + inward * e.w / 2, y: e.h * (1 - (36 + r * 72) / 288), z: e.z + ((39 + k * 77) / 464 - 0.5) * e.d, w: 1, h: 1, d: 1, rot: inward > 0 ? 0 : Math.PI, start: T.plant[0] + 0.016 + i * 0.003, dur: 0.012});
  });
  group.add(instances(fanShape, std('#3e4146', 0.55, 0.4), fans, {edges: false}));
  // pipe colour is on collars and tags only (research.md §9): the pipes themselves are steel
  const risers = [], branches = [], bands = [];
  HOT_AISLES.forEach((h, p) => {
    const zc = (h.z0 + h.z1) / 2;
    // every CDU in the pod: a supply and a return riser off its top, and a branch along to the header
    CDUS.filter(c => c.pod === p).forEach((c, n) => {
      for (const [k, y, color] of [[-1, OVERHEAD.supply, BLUE], [1, OVERHEAD.ret, RED]]) {
        const zr = c.z + k * 0.2, zh = zc + k * 0.25, t = T.plant[0] + 0.012 + p * 0.004 + n * 0.002;
        risers.push({x: c.x, y: c.h, z: zr, w: 0.1, h: y - c.h + 0.08, d: 0.1, start: t, dur: 0.008, color: STEEL});
        for (const cy of [c.h + 0.18, y - 0.2]) bands.push({x: c.x, y: cy, z: zr, w: 0.118, h: 0.05, d: 0.118, start: t + 0.006, dur: 0.004, color});
        if (Math.abs(zh - zr) > 0.05) branches.push({x: c.x, y: y + 0.02, z: (zr + zh) / 2, w: 0.1, h: 0.1, d: Math.abs(zh - zr) + 0.1, start: t + 0.006, dur: 0.008, color: STEEL});
      }
    });
  });

  await step();
  // the racks arrive last, row by row from the middle out; body, front panel, the network cables down each side
  // of a GPU rack's front, and the coolant manifolds at the back of the GPU racks
  const rackStart = r => T.racks[0] + r.row * 0.0085 + Math.abs(r.i - 7.5) * 0.0006;
  group.add(instances(SHAPES.box(), onRack('#24262a', 0.5, 0.2), RACKS.map(r => ({x: r.x, z: r.z, w: RACK.w - 0.01, h: RACK.h, d: RACK.d, start: rackStart(r), dur: 0.016})), {shadow: true}));
  // a kick plate at each rack's foot, dark and a few millimetres proud of the body, so the rows sit on the floor
  group.add(instances(SHAPES.box(), onRack('#0b0c0e', 0.8, 0.1), RACKS.map(r => ({x: r.x, z: r.z, w: RACK.w - 0.004, h: 0.05, d: RACK.d + 0.006, start: rackStart(r), dur: 0.01})), {edges: false}));
  // the outer side of each row's end racks, which the walk looks straight at: two satin steel side panels standing 3 mm
  // proud, a dark seam between them and a lifting recess near the top of each, so the side catches the light
  {
    const ends = RACKS.filter(r => r.i === 0 || r.i === PER_ROW - 1), panels = [], seams = [], label = [];
    for (const r of ends) {
      const sx = r.x + (r.i === 0 ? -1 : 1) * (RACK.w / 2 + 0.002);
      for (const k of [-1, 1]) {
        panels.push({x: sx, y: 0.07, z: r.z + k * RACK.d / 4, w: 0.004, h: RACK.h - 0.12, d: RACK.d / 2 - 0.006, start: rackStart(r) + 0.004, dur: 0.012, ax: r.x, az: r.z});
        label.push(k === r.face ? r.face : 0);
        seams.push({x: sx + (r.i === 0 ? -0.0025 : 0.0025), y: RACK.h - 0.32, z: r.z + k * RACK.d / 4, w: 0.002, h: 0.03, d: 0.16, start: rackStart(r) + 0.006, dur: 0.01, ax: r.x, az: r.z});
      }
      seams.push({x: sx, y: 0.07, z: r.z, w: 0.006, h: RACK.h - 0.12, d: 0.008, start: rackStart(r) + 0.006, dur: 0.01, ax: r.x, az: r.z});
    }
    const sideShape = SHAPES.box();
    sideShape.setAttribute('aLabel', new THREE.InstancedBufferAttribute(new Float32Array(label), 1));
    group.add(instances(sideShape, sidePanel(onRack('#5b6168', 0.32, 0.6)), panels, {edges: false}));
    // and the front post's edge, lit
    group.add(instances(SHAPES.box(), onRack('#a9afb6', 0.3, 0.7), ends.map(r => ({x: r.x + (r.i === 0 ? -1 : 1) * (RACK.w / 2 - 0.004), y: 0.05, z: r.z + r.face * (RACK.d / 2 - 0.004), w: 0.012, h: RACK.h - 0.08, d: 0.012, start: rackStart(r) + 0.004, dur: 0.012, ax: r.x, az: r.z})), {edges: false}));
    group.add(instances(SHAPES.box(), onRack('#0b0c0e', 0.8, 0), seams, {edges: false}));
  }
  // the seam between a rack's two side panels, half way back (seen where a row's end rack shows its side)
  group.add(instances(SHAPES.box(), onRack('#0d0e10', 0.7, 0), RACKS.map(r => ({x: r.x, y: 0.05, z: r.z, w: RACK.w - 0.006, h: RACK.h - 0.1, d: 0.004, start: rackStart(r) + 0.004, dur: 0.012})), {edges: false}));
  const fronts = rackFronts();
  for (const [gpu, f] of [[true, fronts.gpu], [false, fronts.net]]) {
    const mat = buildable(new THREE.MeshStandardMaterial({color: '#ffffff', map: f.real, normalMap: f.normal, normalScale: new THREE.Vector2(1.1, 1.1), roughness: 0.55, metalness: 0.35}), {ink: f.ink, anchored: true});
    group.add(instances(SHAPES.box(), mat, RACKS.filter(r => r.gpu === gpu).map(r => ({x: r.x, y: FRONT.y, z: r.z + r.face * (RACK.d / 2 + 0.004), w: FRONT.w, h: FRONT.h, d: 0.008, rot: r.face > 0 ? 0 : Math.PI, start: rackStart(r) + 0.003, dur: 0.016, ax: r.x, az: r.z})), {edges: false}));
  }
  await step();
  // Where the camera comes within a metre or two (the GPU racks either side of the pulled tray and across the aisle
  // from it, and the network racks where the walk begins) each unit's face is its own box standing 12 mm proud of
  // the front, textured with its own slice of the front picture (a GPU tray's face is 438 mm wide and 41.45 mm tall,
  // at the bottom of its U, textures.js), so the seams between units are real gaps and every bezel has an edge that
  // catches the light. Elsewhere the flat front is enough.
  const proudFaces = (front, racks, stack, TW, TH) => {
    const near = [], slices = [];
    racks.forEach(r => stack.forEach((kind, u) => {
      if (kind === 'cable' || (r === PICK && u === PICK_SLOT)) return;
      near.push({x: r.x, y: FRONT.y + u * U1, z: r.z + r.face * (RACK.d / 2 + 0.014), w: TW, h: TH, d: 0.012, rot: r.face > 0 ? 0 : Math.PI, start: rackStart(r) + 0.004, dur: 0.016, ax: r.x, az: r.z});
      slices.push(0.5 - TW / FRONT.w / 2, u * U1 / FRONT.h, 0.5 + TW / FRONT.w / 2, (u * U1 + TH) / FRONT.h);
    }));
    const mat = buildable(new THREE.MeshStandardMaterial({color: '#ffffff', map: front.real, normalMap: front.normal, normalScale: new THREE.Vector2(1.1, 1.1), roughness: 0.5, metalness: 0.4}), {ink: front.ink, anchored: true});
    const grow = mat.onBeforeCompile;
    mat.onBeforeCompile = (shader, renderer) => {
      grow(shader, renderer);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec4 aSlice;\nvarying vec4 vSlice;\nvarying float vFront, vSide;')
        .replace('#include <uv_vertex>', '#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = mix(aSlice.xy, aSlice.zw, vMapUv);\n#endif\n#ifdef USE_NORMALMAP\nvNormalMapUv = mix(aSlice.xy, aSlice.zw, vNormalMapUv);\n#endif\nvSlice = aSlice; vFront = step(.45, position.z) * step(.5, normal.z); vSide = sign(instanceMatrix[0][0]);');
      // the dark parts of the face (the grille's holes, the ports, the gaps) sit 5 mm back: the picture is looked up
      // where the view ray meets that depth (one refined step of parallax), so they slide behind the bezel as the
      // camera moves, and they darken inside
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec4 vSlice;\nvarying float vFront, vSide;')
        .replace('#include <map_fragment>', `
          vec2 puv = vMapUv; float recess = 0.;
          if (vFront > .5) {
            vec3 V = normalize(cameraPosition - vWPos);
            vec2 ray = -vec2(V.x * vSide, V.y) / max(.3, V.z * vSide), toUv = (vSlice.zw - vSlice.xy) / vec2(${TW}, ${TH});
            float d0 = 1. - smoothstep(.015, .09, dot(texture2D(map, vMapUv).rgb, vec3(.3, .59, .11)));
            puv = vMapUv + ray * d0 * .005 * toUv;
            recess = 1. - smoothstep(.015, .09, dot(texture2D(map, puv).rgb, vec3(.3, .59, .11)));
            puv = vMapUv + ray * recess * .005 * toUv;
          }
          diffuseColor *= texture2D(map, puv);
          diffuseColor.rgb *= 1. - .5 * recess;`)
        .replace('#include <normal_fragment_maps>', THREE.ShaderChunk.normal_fragment_maps.replaceAll('vNormalMapUv', 'puv'));
    };
    const key = mat.customProgramCacheKey;
    mat.customProgramCacheKey = () => key() + 'slice-depth';
    const shape = SHAPES.box();
    shape.setAttribute('aSlice', new THREE.InstancedBufferAttribute(new Float32Array(slices), 4));
    return instances(shape, mat, near, {edges: false, shadow: true});
  };
  group.add(proudFaces(fronts.gpu, RACKS.filter(r => r.gpu && proud(r)), STACK, 0.438, 0.04145));
  group.add(proudFaces(fronts.net, RACKS.filter(r => !r.gpu && proud(r)), NET_STACK, FRONT.w - 0.03, U1 - 0.0015));
  // and on those network racks, the patch cords dressed as in a working row: from each port a short drop into a laced
  // bundle under the panel, one per half, which runs out to the rack's own cable manager (0.27 m from its centre), in the
  // panels' muted yellow with a few aqua cords
  {
    const tube = (pts, r, n, m) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), n, r, m, false).translate(0, 0.5, 0);
    const bundle = (side, sag) => tube([[0, 0, 0.016], [side * 0.08, -0.004 - sag, 0.02], [side * 0.17, -0.006 - sag, 0.019], [side * 0.235, -0.004, 0.013], [side * 0.255, -0.002, 0.006]], 0.0036, 16, 6);
    const drop = side => tube([[0, 0.016, 0], [0, 0.012, 0.012], [side * 0.004, 0.004, 0.017], [side * 0.008, 0, 0.016]], 0.0011, 5, 3);
    // (two sags, a tight one and a looser one, by panel)
    const bundles = [[], [], [], []], drops = [[], []];
    RACKS.filter(r => !r.gpu && proud(r)).forEach(r => NET_STACK.forEach((kind, u) => {
      if (kind !== 'patch') return;
      const rot = r.face > 0 ? 0 : Math.PI, z = r.z + r.face * (RACK.d / 2 + 0.014), y = FRONT.y + u * U1 - 0.004 - 0.5;
      for (const side of [-1, 1]) bundles[(side < 0 ? 0 : 1) + ((u + r.i + (side > 0 ? 1 : 0)) % 2) * 2].push({x: r.x + (r.face > 0 ? side : -side) * 0.012, y, z, w: 1, h: 1, d: 1, rot, start: rackStart(r) + 0.012, dur: 0.01, color: (u + r.i) % 3 ? '#55534a' : '#4b4f50', ax: r.x, az: r.z});
      for (let k = 0; k < 14; k++) {
        if ((k * 7 + u * 3 + r.i) % 3 === 0) continue;
        const lx = (k - 6.5) * 0.03, side = lx < 0 ? -1 : 1;
        drops[side < 0 ? 0 : 1].push({x: r.x + (r.face > 0 ? lx : -lx), y, z, w: 1, h: 1, d: 1, rot, start: rackStart(r) + 0.012, dur: 0.01, color: (k + u) % 4 ? '#5f5c50' : '#46555a', ax: r.x, az: r.z});
      }
    }));
    const cordMat = onRack('#ffffff', 0.6, 0.05, {}, true);
    [-1, 1].forEach((side, v) => {
      for (const [sag, list] of [[0, bundles[v]], [0.005, bundles[v + 2]]]) if (list.length) group.add(instances(bundle(side, sag), cordMat, list, {edges: false}));
      group.add(instances(drop(side), cordMat, drops[v], {edges: false}));
    });
  }
  await step();
  // the network cables down each side of a GPU rack's front: a loose bundle of round cables in slightly different
  // blacks, held by straps, from the lowest compute tray to the top
  const cables = [], straps = [], manifold = [], manifoldBands = [];
  const CABLE_TONES = ['#1d1f23', '#27292e', '#18191c', '#2c2e33', '#212327'];
  const BUNDLE = [[-0.010, -0.008, 0.0095], [0.009, -0.010, 0.0085], [0.001, 0.008, 0.0105], [-0.012, 0.011, 0.0075], [0.013, 0.010, 0.008]];
  RACKS.filter(r => r.gpu).forEach(r => {
    const by = RACK_BASE + 15 * U1 - 0.01, bh = RACK.h - by;
    for (const k of [-1, 1]) {
      const cx = r.x + k * 0.255, cz = r.z + r.face * (RACK.d / 2 + 0.03);
      BUNDLE.forEach(([dx, dz, rad], n) => cables.push({x: cx + k * dx, y: by, z: cz + r.face * dz, w: rad * 2, h: bh, d: rad * 2, start: rackStart(r) + 0.008, dur: 0.012, color: CABLE_TONES[(n + r.i) % 5], ax: r.x, az: r.z}));
      for (let ty = by + 0.1 + (r.i % 3) * 0.03; ty < RACK.h - 0.06; ty += 0.29) straps.push({x: cx, y: ty, z: cz, w: 0.049, h: 0.009, d: 0.047, start: rackStart(r) + 0.01, dur: 0.01, color: '#101012', ax: r.x, az: r.z});
    }
    for (const [k, color] of [[-1, BLUE], [1, RED]]) {
      manifold.push({x: r.x + k * 0.2, y: 0.15, z: r.z - r.face * (RACK.d / 2 + 0.035), w: 0.045, h: RACK.h + 0.03 - 0.15, d: 0.045, start: rackStart(r) + 0.01, dur: 0.012, color: STEEL, ax: r.x, az: r.z});
      for (const cy of [0.3, RACK.h - 0.25]) manifoldBands.push({x: r.x + k * 0.2, y: cy, z: r.z - r.face * (RACK.d / 2 + 0.035), w: 0.056, h: 0.04, d: 0.056, start: rackStart(r) + 0.02, dur: 0.004, color, ax: r.x, az: r.z});
    }
  });
  // (the cables and their straps appear with their rack's real material: in the plaster model they'd only flicker)
  group.add(instances(SHAPES.post(), onRack('#ffffff', 0.62, 0.05, {}, true), cables, {edges: false}));
  group.add(instances(SHAPES.box(), onRack('#ffffff', 0.8, 0.05, {}, true), straps, {edges: false}));
  // along the walk the cables are geometry: a jumper from each of a compute tray's four network ports (its OSFP
  // modules at 56, 80, 106 and 130 mm right of centre, closeup.js FRONT.osfp; the port's centre is 2.8 mm below the
  // U's middle) sags out and runs into the bundle at the rack's side. Not on the tray that slides out.
  const PORTS = [0.056, 0.080, 0.106, 0.130];
  const jumperShape = v => mergeGeometries(PORTS.map((lx, k) => {
    const out = 0.008 + 0.004 * k + 0.004 * ((k + v) % 3), sag = 0.006 + 0.004 * ((k * 2 + v) % 3);
    const curve = new THREE.CatmullRomCurve3([[lx, -0.0028, 0.019], [lx, -0.005, 0.03 + out], [lx + (0.25 - lx) * (0.5 + 0.08 * v), -sag - 0.003 * k, 0.04 + out], [0.25, 0.002 - 0.002 * v, 0.036], [0.255, 0.03 + 0.004 * v, 0.03]].map(p => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, 12, 0.0026, 5);
  }));
  // tray handles, the pair on the front of each compute and switch tray (drawn on the texture as well): a grip
  // standing 17 mm proud, 207 mm either side of centre, as on the pulled tray
  const jumpers = [[], [], []], handles = [];
  RACKS.filter(r => r.gpu && Math.abs(r.z + r.face * RACK.d / 2 - WALK_Z) < 1.2).forEach(r => STACK.forEach((kind, u) => {
    if ((kind !== 'compute' && kind !== 'switch') || (r === PICK && u === PICK_SLOT)) return;
    const y = RACK_BASE + (u + 0.5) * U1, rot = r.face > 0 ? 0 : Math.PI, z = r.z + r.face * (RACK.d / 2 + 0.004);
    for (const k of [-1, 1]) {
      const hx = r.x + r.face * k * 0.207, hy = y - 0.0015, t = {rot, start: rackStart(r) + 0.006, dur: 0.012};
      handles.push({x: hx, y: hy - 0.015, z: z + r.face * 0.0125, w: 0.009, h: 0.03, d: 0.017, ...t, ax: r.x, az: r.z});
    }
    if (kind === 'compute') jumpers[(r.i * 7 + u * 3) % 3].push({x: r.x, y, z, w: 1, h: 1, d: 1, rot, start: rackStart(r) + 0.01, dur: 0.012, ax: r.x, az: r.z});
  }));
  const jumperMat = onRack('#24262a', 0.62, 0.05, {}, true);
  jumpers.forEach((list, v) => group.add(instances(jumperShape(v), jumperMat, list, {edges: false})));
  group.add(instances(SHAPES.box(), onRack('#a3a7ae', 0.35, 0.8), handles, {edges: false}));

  await step();
  // connections once the racks are in: hoses from the headers to each GPU rack's manifolds, power whips from the
  // busway, and fibre down from the tray to every rack's front
  const drops = [...risers], whips = [], joins = [], taps = [];
  RACKS.forEach((r, n) => {
    const t = T.connect[0] + n / RACKS.length * (span(T.connect) - 0.012);
    const back = r.z - r.face * (RACK.d / 2 + 0.035), front = r.z + r.face * (RACK.d / 2 - 0.05);
    if (r.gpu) for (const [k, y, color] of [[-1, OVERHEAD.supply, BLUE], [1, OVERHEAD.ret, RED]]) {
      drops.push({x: r.x + k * 0.2, y: RACK.h + 0.03, z: back, w: 0.05, h: y - RACK.h - 0.03, d: 0.05, start: t, dur: 0.01, color: STEEL});
      bands.push({x: r.x + k * 0.2, y: RACK.h + 0.16, z: back, w: 0.062, h: 0.04, d: 0.062, start: t + 0.008, dur: 0.004, color});
      // and across to its header over the hot aisle
      const ha = HOT_AISLES[ROWS[r.row].pod], zc = (ha.z0 + ha.z1) / 2 + k * 0.25;
      joins.push({x: r.x + k * 0.2, y: y - 0.025, z: (back + zc) / 2, w: 0.05, h: 0.05, d: Math.abs(zc - back), start: t + 0.006, dur: 0.008, color: STEEL});
    }
    taps.push({x: r.x, y: OVERHEAD.busway - 0.26, z: r.z - r.face * 0.3, w: 0.2, h: 0.26, d: 0.2, start: t, dur: 0.008});
    whips.push({x: r.x, y: RACK.h, z: r.z - r.face * 0.3, w: 0.035, h: OVERHEAD.busway - 0.26 - RACK.h, d: 0.035, start: t + 0.002, dur: 0.008, color: '#1c1d20'});
    whips.push({x: r.x + 0.18, y: RACK.h, z: front, w: 0.024, h: OVERHEAD.tray - RACK.h, d: 0.024, start: t + 0.004, dur: 0.008, color: '#c9a62a'});
  });
  group.add(instances(SHAPES.post(), onRack('#ffffff', 0.35, 0.3), manifold, {edges: false}));
  group.add(instances(SHAPES.post(), std('#ffffff', 0.35, 0.3), drops, {edges: false, outline: true}));
  group.add(instances(SHAPES.post(), std('#ffffff', 0.6, 0.1), whips, {edges: false, outline: true}));
  group.add(instances(SHAPES.box(), std('#ffffff', 0.35, 0.3), [...joins, ...branches], {edges: false, outline: true}));
  group.add(instances(SHAPES.post(), std('#ffffff', 0.45, 0.1), bands, {edges: false}));
  group.add(instances(SHAPES.post(), onRack('#ffffff', 0.45, 0.1), manifoldBands, {edges: false}));
  // contact shading on the slab under every rack and piece of plant
  const shadowMat = buildable(new THREE.MeshBasicMaterial({color: '#000000', map: contact(), transparent: true, depthWrite: false, opacity: 0.75}), {floorShade: false, keepColor: true});
  // (and along each row's two faces, a soft strip 0.3 m deep, so a powered row sits on the floor rather than floating)
  const rowFeet = ROWS.flatMap(row => [-1, 1].map(k => ({x: (ROW_X0 + ROW_X1) / 2, y: 0.003, z: (row.z0 + row.z1) / 2 + k * (RACK.d / 2 + 0.1), w: ROW_X1 - ROW_X0 + 0.3, h: 1, d: 0.3, axis: 5, start: T.racks[0] + 0.03, dur: 0.02})));
  const pads = [...rowFeet, ...RACKS.map(r => ({x: r.x, y: 0.003, z: r.z, w: RACK.w * 1.7, h: 1, d: RACK.d * 1.35, axis: 5, start: rackStart(r), dur: 0.016})), ...[...CDUS, ...FANWALLS].map(e => ({x: e.x, y: 0.003, z: e.z, w: e.w * 1.6, h: 1, d: e.d * 1.25, axis: 5, start: T.plant[0], dur: 0.02}))];
  const padGroup = instances(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), shadowMat, pads, {edges: false});
  padGroup.userData.mesh.renderOrder = 1; group.add(padGroup);
  group.add(instances(SHAPES.box(), std('#8f949b', 0.5, 0.6), taps));
  group.add(instances(SHAPES.box(), std('#17181b', 0.5, 0.5), MDA.map((e, i) => ({x: e.x, z: e.z, w: e.w, h: e.h, d: e.d, start: T.racks[0] + i * 0.002, dur: 0.014})), {shadow: true}));

  // light lines over the aisle centrelines (4000 K), and the ceiling, which only shows from below
  const lights = COLD_AISLES.map((c, i) => ({x: (ROW_X0 + ROW_X1) / 2, y: OVERHEAD.light, z: (c.z0 + c.z1) / 2, w: ROW_X1 - ROW_X0 + 4, h: 0.05, d: 0.18, axis: 1, start: T.lights[0] + i * 0.004, dur: 0.012}));
  const lightMat = std('#ffffff', 0.4, 0, {emissive: '#fff4e6', emissiveIntensity: 2.4});
  group.add(instances(SHAPES.box(), lightMat, lights));
  const ceiling = new THREE.PlaneGeometry(1, 1).rotateX(Math.PI / 2);
  group.add(instances(ceiling, std('#2b2c2f', 0.9), [{x: (H.x0 + H.x1) / 2, y: OVERHEAD.ceiling, z: (H.z0 + H.z1) / 2, w: H.x1 - H.x0, h: 1, d: H.z1 - H.z0, axis: 5, start: T.lights[0], dur: 0.01}], {edges: false}));

  return {group, lightMat};
}

// the racks whose unit faces stand proud of the front (above): GPU racks round the pulled tray, network racks where the
// walk begins
const proud = r => Math.abs(r.z + r.face * RACK.d / 2 - WALK_Z) < 1.2 && (r.gpu ? Math.abs(r.x - PICK.x) < 2 : r.x < ROW_X0 + 2.4);

// status lights on every rack front (on the racks with proud tray faces, on the faces). They come on in a wave that runs away from the camera down the walk aisle;
// each kind behaves as research.md §2.5 describes (the picked tray's blue locate light is on the tray, detail.js)
export function buildLights(glowTex) {
  const items = [], x0 = ROW_X0 + 2;
  RACKS.forEach(r => rackLights(r.gpu).forEach(l => {
    const x = r.x + (r.face > 0 ? l.x : -l.x) * FRONT.w;
    const d = Math.hypot(Math.max(0, x - x0) + Math.max(0, x0 - x) * 1.6, (r.z - WALK_Z) * 0.9);
    items.push({x, y: l.y, z: r.z + r.face * (RACK.d / 2 + (proud(r) ? 0.021 : 0.012)), face: r.face, on: T.power[0] + 0.006 + d / 18 * 0.032 + (l.kind === 0 ? 0 : 0.004), kind: l.kind});
  }));
  const n = items.length;
  const pos = new Float32Array(n * 3), face = new Float32Array(n), on = new Float32Array(n), kind = new Float32Array(n);
  items.forEach((it, k) => {pos.set([it.x, it.y, it.z], k * 3); face[k] = it.face; on[k] = it.on; kind[k] = it.kind;});
  const quad = new THREE.PlaneGeometry(1, 1), mk = (size, alpha, map, mirror = false) => {
    const g = new THREE.InstancedBufferGeometry();
    g.index = quad.index; g.setAttribute('position', quad.getAttribute('position')); g.setAttribute('uv', quad.getAttribute('uv'));
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(pos, 3));
    g.setAttribute('iFace', new THREE.InstancedBufferAttribute(face, 1));
    g.setAttribute('iOn', new THREE.InstancedBufferAttribute(on, 1));
    g.setAttribute('iKind', new THREE.InstancedBufferAttribute(kind, 1));
    g.instanceCount = n;
    // where the quad goes: on the rack's face; or, for the reflections, where the line from the camera to the light
    // mirrored below the slab crosses the floor, sized for the mirrored distance and laid on the slab as a streak, as on
    // sealed concrete: 3 sizes across the line of sight and 15 along it, drawn out by how flat the floor is seen so in
    // the picture it's as long as it would be standing up (and the half nearer the camera isn't lost under the floor),
    // so the reflections down a rack's face run together into one soft streak under it. Fainter and a little wider the
    // further out from the rack it lands, where a polished floor blurs it away (and each far fainter than the old dash,
    // uMirror, since now they all overlap).
    const place = mirror
      ? `vec3 m = vec3(iPos.x, -iPos.y, iPos.z), c = cameraPosition;
          vec3 f = c + (m - c) * (c.y / max(.001, c.y + iPos.y)); f.y = .003;
          float k = s * length(f - c) / length(m - c), d = abs(f.z - iPos.z);
          vec2 to = normalize(c.xz - f.xz + vec2(1e-4, 0.));
          vec3 p = f + vec3(-to.y, 0., to.x) * position.x * k * 3. * (1. + d) + vec3(to.x, 0., to.y) * position.y * k * 15. * length(f - c) / max(.2, c.y);
          vOn *= 1. - smoothstep(0., .8, d);
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);`
      : `vec3 p = vec3(position.x * s * iFace, position.y * s, 0.) + iPos;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);`;
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: map ? THREE.AdditiveBlending : THREE.NormalBlending, toneMapped: false,
      uniforms: {uProgress: {value: 0}, uTime: {value: 0}, uMap: {value: map}, uSize: {value: size}, uAlpha: {value: alpha}, uLocate: {value: map ? 9 : 2.4}, uFocus: {value: 0}, uMirror: {value: mirror ? 0.045 : 1}},
      vertexShader: /* glsl */`
        attribute vec3 iPos; attribute float iFace, iOn, iKind;
        uniform float uProgress, uTime, uSize, uLocate, uFocus; varying vec3 vCol; varying float vOn; varying vec2 vUv;
        float hash(float n){ return fract(sin(n) * 43758.5453); }
        void main(){
          vec3 green = vec3(.24, 1., .45), amber = vec3(1., .62, .12), blue = vec3(.25, .45, 1.);
          float age = uProgress - iOn, on = smoothstep(0., .002, age);
          float seed = hash(iPos.x * 13.1 + iPos.y * 71.7 + iPos.z * 3.3);
          vec3 col = green; float lit = 1.;
          if (iKind > .5 && iKind < 1.5) lit = age < .007 ? step(.5, fract(uTime * 4. + seed)) : 1.;            // booting, then on
          else if (iKind > 1.5 && iKind < 2.5) col = age < .009 ? amber : green;                            // link coming up
          else if (iKind > 2.5 && iKind < 3.5) {col = blue; lit = .55 + .45 * step(.5, fract(uTime));}       // locate
          else if (iKind > 3.5) lit = .45 + .55 * step(.3, fract(uTime * (1.5 + seed * 4.) + seed));        // traffic
          vOn = on * lit; vCol = col; vUv = uv;
          // the locate light is drawn larger and brighter, so it can be found from down the aisle
          float locate = iKind > 2.5 && iKind < 3.5 ? 1. : 0.;
          float s = uSize * mix(1., uLocate, locate);
          vOn *= mix(1. - .6 * uFocus, 3., locate);
          ${place}
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uMap; uniform float uAlpha, uMirror; varying vec3 vCol; varying float vOn; varying vec2 vUv;
        void main(){
          // round dots up close; the halos take their falloff from the glow texture's alpha; the reflections have no core
          // (a bright centre would leave a dash per light), falling off smoothly across and slowly along
          ${mirror ? 'vec2 q = abs(vUv - .5) * 2.; float a = (1. - q.x * q.x) * (1. - q.x * q.x) * smoothstep(1., 0., q.y);' : map ? 'float a = texture2D(uMap, vUv).a;' : 'float a = smoothstep(.5, .38, length(vUv - .5));'}
          if (vOn * a < .004) discard;
          gl_FragColor = vec4(vCol, a * uAlpha * vOn * uMirror);
        }`,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
    return mesh;
  };
  const group = new THREE.Group();
  const dots = mk(0.0055, 1, null), halos = mk(0.02, 0.22, glowTex), reflections = mk(0.02, 0.22, glowTex, true);
  group.add(dots, halos, reflections);
  group.userData.materials = [dots.material, halos.material, reflections.material];
  return group;
}
