// Scroll progress (0–1) → what happens when. Everything on the page is a function of the smoothed progress, so the
// hall can be built and un-built by scrolling either way. The build follows a builder's order (research.md §8):
// shell, power rooms, containment frames and overhead services, plant, and the factory-built racks last. The
// windows are sized so each chapter moves the picture at about the film's average pace (datahall-probe.mjs).
export const T = {
  plan: [0, 0.04],
  slab: [0.035, 0.065], columns: [0.05, 0.085], walls: [0.065, 0.11],
  rooms: [0.105, 0.145], frames: [0.14, 0.175],
  busway: [0.165, 0.205], trays: [0.175, 0.215], pipes: [0.185, 0.23], plant: [0.205, 0.24], lights: [0.225, 0.25],
  racks: [0.245, 0.315], connect: [0.308, 0.34],
  descend: [0.34, 0.47], walk: [0.47, 0.55], power: [0.55, 0.6],
  turn: [0.6, 0.67], slide: [0.67, 0.708], explode: [0.704, 0.77],
  // from the GPU the camera closes in on one die ("back", to the opening's crop of it). On the way the die's drawing
  // draws on it in light lines, the paper fills in behind them, then the paper spreads out to the sheet's edge; at
  // rest, the labels swap to the hall's
  dive: [0.77, 0.842], back: [0.842, 0.962],
  drawDie: [0.848, 0.886], sheet: [0.876, 0.902], paper: [0.902, 0.928], swap: [0.964, 0.984],
};
export const clamp01 = v => Math.min(1, Math.max(0, v));
export const seg = (p, [a, b]) => clamp01((p - a) / (b - a));

export const smoother = t => t * t * t * (t * (t * 6 - 15) + 10);

export const lerp = (a, b, t) => a + (b - a) * t;

// captions: the window they show in, and the words. Every number is in research.md.
export const CAPTIONS = [
  {at: [0, 0.04], title: {en: 'Data Hall 01', zh: '数据中心一号机房'}, body: {en: 'A floor plan, cut 1.2 m above the floor. Scroll to build it.', zh: '一张平面图，在离地 1.2 米处剖切。往下滚，把它盖起来。'}},
  {at: [0.045, 0.105], title: {en: 'Slab, columns, walls', zh: '底板、柱子、墙'}, body: {en: 'The slab goes in first, built for racks of about 1.5 tonnes each. The walls close the hall in before any equipment arrives.', zh: '先浇底板，按每台机柜约 1.5 吨来做。墙砌好、房子封起来，设备才进场。'}},
  {at: [0.11, 0.165], title: {en: 'Power and network rooms', zh: '配电间和网络间'}, body: {en: 'The busways are fed from distribution boards and PDUs in the rooms along the north side, next to the core network room. The UPS, batteries and switchgear are in a separate power building.', zh: '母线槽由北侧几间房里的配电柜和 PDU 供电，旁边是核心网络间。UPS、电池和高压开关设备在另一栋电力楼里。'}},
  {at: [0.17, 0.245], title: {en: 'Frames, busway, trays, pipes', zh: '框架、母线、桥架、管道'}, body: {en: 'The hot-aisle frames go up first and carry the services: busway over the back of each row, fibre over the front, coolant pipes over the hot aisle.', zh: '先立热通道框架，上面挂各种管线：母线槽在每排的背面，光纤在正面，冷却液管在热通道上方。'}},
  {at: [0.245, 0.335], title: {en: 'The racks arrive last', zh: '机柜最后进场'}, body: {en: 'Built and tested at the factory: 48 GPU racks (72 GPUs, about 130 kW and 1.5 tonnes each) and 48 network racks.', zh: '在工厂装好、测好再运来：48 台 GPU 机柜（每台 72 块 GPU、约 130 千瓦、1.5 吨），另有 48 台网络机柜。'}},
  {at: [0.35, 0.465], title: {en: 'Into a cold aisle', zh: '走进冷通道'}, body: {en: 'In this design the supply air is about 28 °C.', zh: '在这个设计里，送风大约 28 °C。'}},
  {at: [0.49, 0.548], title: {en: 'Cold aisle, 1.8 m wide', zh: '冷通道，1.8 米宽'}, body: {en: 'Racks within a few metres of you are real; the rest are still drawn. Network racks at each end of the row, GPU racks in the middle.', zh: '几米之内的机柜是实物，其余的还是图纸。每排两头是网络机柜，中间是 GPU 机柜。'}},
  {at: [0.566, 0.605], title: {en: 'Power on', zh: '通电'}, body: {en: 'The racks are switched on and their status lights turn green. The hall is designed for 7.4\u00a0MW of IT load.', zh: '机柜开机，状态灯变绿。这间机房按 7.4\u00a0兆瓦的 IT 负载设计。'}},
  {at: [0.635, 0.672], title: {en: 'Locate light', zh: '定位灯'}, body: {en: 'A blinking blue light marks the tray to pull.', zh: '一盏闪烁的蓝灯，标出要抽出来的那个托盘。'}},
  {at: [0.676, 0.768], title: {en: 'One compute tray', zh: '一个计算托盘'}, body: {en: 'Eighteen per rack. Two CPUs and four GPUs under liquid cold plates. The reference design supplies the coolant at 40 °C; it comes out at about 54 °C.', zh: '每台机柜 18 个。2 颗 CPU、4 块 GPU，上面压着液冷冷板。参考设计里冷却液 40 °C 进，约 54 °C 出。'}},
  {at: [0.775, 0.844], title: {en: 'One GPU', zh: '一块 GPU'}, body: {en: 'Two dies, 208 billion transistors, joined by a 10\u00a0TB/s link, with eight HBM stacks.', zh: '两颗裸片，2080 亿个晶体管，中间用 10\u00a0TB/s 的链路连起来，旁边是 8 颗 HBM 显存。'}},
  {at: [0.848, 0.973], title: {en: 'Die floor plan', zh: '裸片平面图'}, body: {en: 'Compute blocks in banks, L2 cache between, memory interfaces along the edges. Illustrative layout based on published architecture.', zh: '计算单元成组排列，中间是二级缓存，边上是内存接口。根据公开架构画的示意布局。'}},
  {at: [0.984, 1.01], title: {en: 'Data Hall 01', zh: '数据中心一号机房'}, body: {en: 'Scroll down for how it was built, and the sources.', zh: '往下滚，看怎么做出来的，以及资料来源。'}},
];
