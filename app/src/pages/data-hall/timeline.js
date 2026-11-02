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
  {at: [0, 0.04], title: {en: 'Data Hall 01', zh: '数据中心一号机房'}, body: {en: 'The floor plan, cut 1.2 m above the floor. Scroll down to build the hall.', zh: '机房的平面图，剖切高度离地 1.2 米。往下滚动，把机房盖起来。'}},
  {at: [0.045, 0.105], title: {en: 'Slab, columns and walls', zh: '底板、柱和墙'}, body: {en: 'The slab goes in first, designed for racks of about 1.5 tonnes each. The walls close in the hall before any equipment arrives.', zh: '先浇底板，按每台机柜约 1.5 吨设计。墙砌好、机房封闭以后，设备才进场。'}},
  {at: [0.11, 0.165], title: {en: 'Power and network rooms', zh: '配电间和网络间'}, body: {en: 'The rooms along the north side hold the distribution boards and PDUs that feed the busways, and the core network room. The UPS, batteries and switchgear are in a separate power building.', zh: '北侧一排房间里是给母线槽供电的配电柜和 PDU，还有核心网络间。UPS、电池和开关设备在另一栋电力楼里。'}},
  {at: [0.17, 0.245], title: {en: 'Frames and overhead services', zh: '框架和顶部管线'}, body: {en: 'Next the hot-aisle frames go up. They carry the services: busway over the back of each row, fibre trays over the front, coolant pipes over the hot aisle.', zh: '接着立热通道框架，管线都挂在上面：母线槽在每排背面上方，光纤桥架在正面上方，冷却液管在热通道上方。'}},
  {at: [0.245, 0.335], title: {en: 'Racks', zh: '机柜'}, body: {en: 'The racks arrive last, built and tested at the factory: 48 GPU racks (72 GPUs, 132 kW and about 1.5 tonnes each) and 48 network racks.', zh: '机柜最后进场，在工厂装好、测好再运来：48 台 GPU 机柜（每台 72 块 GPU、132 千瓦、约 1.5 吨），另有 48 台网络机柜。'}},
  {at: [0.35, 0.465], title: {en: 'Down into a cold aisle', zh: '降到冷通道'}, body: {en: 'The reference design supplies air to the cold aisles at about 28 °C.', zh: '参考设计里，送进冷通道的空气约 28 °C。'}},
  {at: [0.49, 0.548], title: {en: 'Cold aisle, 1.8 m wide', zh: '冷通道，1.8 米宽'}, body: {en: 'Racks within a few metres of you are real; the rest are still drawn. Each row has network racks at both ends and GPU racks in the middle.', zh: '离你几米之内的机柜是实物，其余的还是线稿。每排两头是网络机柜，中间是 GPU 机柜。'}},
  {at: [0.566, 0.605], title: {en: 'Power on', zh: '通电'}, body: {en: 'The racks are switched on and their status lights turn green. The hall is designed for 7.4 MW of IT load.', zh: '机柜开机，状态灯变绿。这间机房按 7.4 兆瓦的 IT 负载设计。'}},
  {at: [0.635, 0.672], title: {en: 'Locate light', zh: '定位灯'}, body: {en: 'A blinking blue light marks the tray to pull out.', zh: '闪烁的蓝色定位灯标出要抽出的托盘。'}},
  {at: [0.676, 0.768], title: {en: 'One compute tray', zh: '一个计算托盘'}, body: {en: 'A rack holds 18 of these. Each has two CPUs and four GPUs under liquid cold plates. In the reference design the coolant goes in at 40 °C and comes out at about 54 °C.', zh: '每台机柜装 18 个。每个托盘里有 2 颗 CPU 和 4 块 GPU，上面压着液冷冷板。参考设计里，冷却液 40 °C 进，约 54 °C 出。'}},
  {at: [0.775, 0.844], title: {en: 'One GPU', zh: '一块 GPU'}, body: {en: 'Two dies with 208 billion transistors, joined by a 10 TB/s link, and eight HBM memory stacks.', zh: '两颗裸片，共 2080 亿个晶体管，用 10 TB/s 的链路连在一起，旁边是 8 颗 HBM 显存。'}},
  {at: [0.848, 0.973], title: {en: 'Die floor plan', zh: '裸片平面图'}, body: {en: 'Banks of compute blocks with L2 cache between them, and memory interfaces along the edges. The layout is illustrative, based on the published architecture.', zh: '计算单元成组排列，组与组之间是二级缓存，边上是内存接口。布局是根据公开架构画的示意。'}},
  {at: [0.984, 1.01], title: {en: 'Data Hall 01', zh: '数据中心一号机房'}, body: {en: 'Scroll down for how it was built and the sources.', zh: '继续往下滚动，是制作过程和资料来源。'}},
];
