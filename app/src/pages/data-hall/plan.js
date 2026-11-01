// One data file for Data Hall: the floor plan drawing and the 3D model are both generated from these numbers.
// Units are metres. The plan lies on the x–z ground plane, north is −z, y is up. The hall follows the structure of a
// published reference design for 132 kW liquid-cooled racks: three pods of two rows sharing a ducted hot aisle,
// eight GPU racks in the middle of each row and four network racks at each end. Sources: data-hall/research.md.

export const RACK = {w: 0.6, d: 1.2, h: 2.236};
// the rack's front, bottom to top, in rack units (1U = 44.45 mm). The order is published; the U positions are not,
// so this map is illustrative (research.md §2.2)
export const U1 = 0.04445, RACK_BASE = 0.05;
export const STACK = [
  ...Array(11).fill('cable'), ...Array(4).fill('power'), ...Array(8).fill('compute'), ...Array(9).fill('switch'),
  ...Array(10).fill('compute'), ...Array(4).fill('power'), 'mgmt', 'mgmt',
];
export const NET_STACK = Array.from({length: 48}, (_, u) => (u < 4 ? 'cable' : u % 6 === 5 ? 'cable' : u % 2 ? 'patch' : 'netsw'));
// the tray that slides out: the fourth compute tray of the upper group
export const PICK_SLOT = STACK.indexOf('switch') + 9 + 3;
export const COLD_AISLE = 1.8, HOT_AISLE = 1.83, PODS = 3, PER_ROW = 16, NET_EACH_END = 4;
export const EYE = 1.6, CUT = 1.2;
// the drawing sheet is a square this many metres across, centred on the building
export const SHEET_SIZE = 42;
export const isGpu = i => i >= NET_EACH_END && i < PER_ROW - NET_EACH_END;

const HALF = 11, rowLength = PER_ROW * RACK.w, podDepth = RACK.d * 2 + HOT_AISLE;
const used = COLD_AISLE * (PODS + 1) + podDepth * PODS, z0 = -HALF + (2 * HALF - used) / 2;

// rooms: the data hall, and a gallery of rooms along its north side for power and the core network. The building
// is 22 × 27.5 m, the proportions of one GPU die (25.5 × 31.5 mm), so the die's schematic can share its plan
export const ROOMS = {
  hall: {x0: -HALF, x1: HALF, z0: -HALF, z1: HALF, name: 'DATA HALL 01', zh: '一号机房'},
  switchgear: {x0: -HALF, x1: -4, z0: -HALF - 5.5, z1: -HALF, name: 'SWITCHGEAR', zh: '开关柜室'},
  ups: {x0: -4, x1: 3, z0: -HALF - 5.5, z1: -HALF, name: 'UPS', zh: 'UPS 室'},
  battery: {x0: 3, x1: 7, z0: -HALF - 5.5, z1: -HALF, name: 'BATTERY', zh: '电池室'},
  mda: {x0: 7, x1: HALF, z0: -HALF - 5.5, z1: -HALF, name: 'MDA', zh: '主配线区'},
};
export const BOUNDS = {x0: -HALF, x1: HALF, z0: ROOMS.ups.z0, z1: HALF};
export const WALL = {t: 0.3, h: 6.5};

// rows: each pod's two rows face away from each other across its hot aisle; the fronts face the cold aisles
export const ROWS = [];
for (let p = 0; p < PODS; p++) {
  const z = z0 + COLD_AISLE * (p + 1) + podDepth * p;
  ROWS.push({pod: p, side: 0, z0: z, z1: z + RACK.d, face: -1});
  ROWS.push({pod: p, side: 1, z0: z + RACK.d + HOT_AISLE, z1: z + podDepth, face: 1});
}
export const HOT_AISLES = Array.from({length: PODS}, (_, p) => ({z0: ROWS[p * 2].z1, z1: ROWS[p * 2].z1 + HOT_AISLE}));
export const COLD_AISLES = Array.from({length: PODS + 1}, (_, i) => {
  const z1 = i < PODS ? ROWS[i * 2].z0 : ROWS[PODS * 2 - 1].z1 + COLD_AISLE;
  return {z0: z1 - COLD_AISLE, z1};
});
export const ROW_X0 = -rowLength / 2, ROW_X1 = rowLength / 2;

// racks in plan order; GPU racks in the middle of each row, network racks at the ends
export const RACKS = [];
ROWS.forEach((row, r) => {
  for (let i = 0; i < PER_ROW; i++) RACKS.push({row: r, i, gpu: isGpu(i), x: ROW_X0 + RACK.w * (i + 0.5), z: (row.z0 + row.z1) / 2, face: row.face});
});

// the walk: down the cold aisle between pod A and pod B, west to east
export const WALK_AISLE = COLD_AISLES[1];
export const WALK_Z = (WALK_AISLE.z0 + WALK_AISLE.z1) / 2;
// the rack that opens: a GPU rack on the north side of the walk aisle, its front facing the aisle (+z)
export const PICK = RACKS.find(r => r.row === 1 && r.i === 9);

// plant in the hall: three CDUs at the east end of each pod, three fan walls on each short wall
export const CDUS = [];
HOT_AISLES.forEach((a, p) => {
  const zc = (a.z0 + a.z1) / 2;
  for (const k of [-1, 0, 1]) CDUS.push({x: ROW_X1 + 2.2, z: zc + k * 1.05, w: 1.24, d: 0.9, h: 2.12, pod: p});
});
export const FANWALLS = [];
for (const x of [-HALF + 0.55, HALF - 0.55]) for (const k of [-1, 0, 1]) FANWALLS.push({x, z: k * 6.6, w: 0.9, d: 5.8, h: 3.6});
// the power rooms: four switchboard lineups, eight UPS modules, rows of battery cabinets
export const SWITCHBOARDS = [0, 1, 2, 3].map(k => ({x: -9.2 + (k % 2) * 3.4, z: -HALF - 4.1 + Math.floor(k / 2) * 2.6, w: 3.0, d: 0.9, h: 2.3}));
export const UPS = Array.from({length: 8}, (_, k) => ({x: -3.1 + (k % 4) * 1.65, z: -HALF - 4.1 + Math.floor(k / 4) * 2.6, w: 1.5, d: 1.0, h: 2.0}));
export const BATTERIES = Array.from({length: 8}, (_, k) => ({x: 3.6 + (k % 4) * 0.85, z: -HALF - 4.2 + Math.floor(k / 4) * 2.7, w: 0.75, d: 0.8, h: 2.0}));
export const MDA = Array.from({length: 10}, (_, i) => ({x: 7.7 + (i % 5) * 0.6, z: -HALF - 4.2 + Math.floor(i / 5) * 2.5, w: 0.6, d: 1.2, h: 2.236}));

// columns on the perimeter only: the hall itself is a 22 m clear span
export const GRID_X = [-HALF, -HALF / 2, 0, HALF / 2, HALF];
export const GRID_Z = [ROOMS.ups.z0, -HALF, -HALF / 2, 0, HALF / 2, HALF];
export const COLUMNS = [];
for (const x of GRID_X) for (const z of GRID_Z) if (x === -HALF || x === HALF || z === GRID_Z[0] || z === GRID_Z.at(-1) || z === -HALF || z === HALF) COLUMNS.push({x, z});

// walls as centre lines, with door openings cut out; a door is [distance along the wall, width], placed clear of the columns
const H = ROOMS.hall;
export const DOORS = [];
const wall = (x0, z0, x1, z1, doors = [], exterior = false) => {
  const L = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / L, uz = (z1 - z0) / L, out = [];
  let a = 0;
  for (const [d, w] of doors) {
    if (d > a) out.push({x0: x0 + ux * a, z0: z0 + uz * a, x1: x0 + ux * d, z1: z0 + uz * d, exterior});
    DOORS.push({x: x0 + ux * d, z: z0 + uz * d, ux, uz, w});
    a = d + w;
  }
  if (a < L) out.push({x0: x0 + ux * a, z0: z0 + uz * a, x1, z1, exterior});
  return out;
};
export const WALLS = [
  // exterior, clockwise from the north-west corner: a loading door and a door for people in the south wall
  ...wall(BOUNDS.x0, BOUNDS.z0, BOUNDS.x1, BOUNDS.z0, [], true),
  ...wall(BOUNDS.x1, BOUNDS.z0, BOUNDS.x1, BOUNDS.z1, [], true),
  ...wall(BOUNDS.x1, BOUNDS.z1, BOUNDS.x0, BOUNDS.z1, [[1.4, 3.6], [HALF * 2 - 4.4, 1.2]], true),
  ...wall(BOUNDS.x0, BOUNDS.z1, BOUNDS.x0, BOUNDS.z0, [], true),
  // the hall's north wall to the gallery, a door into each room, and the walls between the rooms
  ...wall(H.x0, H.z0, H.x1, H.z0, [[3.0, 1.2], [11.6, 1.2], [14.6, 1.2], [19.6, 1.2]]),
  ...wall(-4, ROOMS.ups.z0, -4, H.z0),
  ...wall(3, ROOMS.ups.z0, 3, H.z0),
  ...wall(7, ROOMS.ups.z0, 7, H.z0),
];

// overhead layers (research.md §0: the rack top is 2.24 m; busway over the back of each row, fibre over the front,
// coolant headers over the hot aisle; mounting heights are estimates)
export const OVERHEAD = {busway: 2.72, tray: 3.0, supply: 3.42, ret: 3.7, light: 4.5, ceiling: 6.0};
export const CENTER = {x: (BOUNDS.x0 + BOUNDS.x1) / 2, z: (BOUNDS.z0 + BOUNDS.z1) / 2};
// headline numbers, all from research.md
export const FACTS = {gpuRacks: 48, netRacks: 48, gpus: 48 * 72, rackKw: 132, netKw: 22, itMw: (48 * 132 + 48 * 22) / 1000};
