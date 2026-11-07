// Page choreography: one live chair (chair3d.js) behind every section. Each section is a scene that sets the camera,
// the light, the chair's pose and its three zones from its own scroll progress; the stage eases toward whatever the
// active scene asks for, so moving between sections is one continuous camera move.
import { ChairStage, THREE } from './chair3d.js?v=14';
import { initApp } from './app.js?v=14';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
// lang.js: the page in Chinese or, with ?lang=en, in English
const tr = window.MC ? window.MC.T : (zh) => zh;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ss = (a, b, t) => { const x = clamp((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const narrow = () => innerWidth < 760 || innerWidth / innerHeight < .95;

document.body.dataset.tone = 'dark';
const st = new ChairStage($('#stage'), { base: './assets/' });
window.__chair = st;
const LOOK = {
  dark: { env: .8, key: 1.5, rim: 2.6, shadow: .55, floor: 1 },
  light: { env: 1, key: 1.6, rim: .9, shadow: .6, floor: 0 },
};
const ZONES = ['A', 'B', 'C'];
let ambT = 24;
const zonesTo = (spec, amb = 24) => { ambT = amb; for (const z of ZONES) { const s = spec[z] || ['off', 0]; st.setZone(z, s[0], s[1]); } };
// the thermal story is scrubbed, not timed: each zone's clock is set from the scroll, so any scroll speed shows the same picture
const scrub = (t) => { for (const z of ZONES) if (st.zones[z].mode !== 'off') st.zones[z].t = t; };

// ---- scenes --------------------------------------------------------------------------------------------------------
const posture = { recl: 8, lum: 205, lumD: 0, busy: false };
const want = { focus: null, xray: null };      // what the scene wants lit or see-through this frame; applied once at the end
let frameDt = 0, lumSeen = -1e9;
let partsPath = 'all', thUser = null, thStep = -1, appZones = null, appPosture = { recl: 8, lum: 205 }, exBox = null;
// opening, once the model is in: the chair sits in the dark, the rim light draws its outline, the key and the studio
// come up while the camera settles in from further round, then the words rise. Nothing is switched on: no zone heats
// until someone turns it on further down the page
const intro = { t: -1, len: 3.4 };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const SCENES = {
  hero(p) {
    const T = intro.t < 0 ? 0 : clamp(intro.t / intro.len), e = 1 - Math.pow(1 - T, 3), u = 1 - e;
    st.setView(narrow() ? { az: 26 - 16 * p + 30 * u, el: 7 - 3 * u, dist: 5.3 + 1.6 * u, tgt: [0, .66, 0], fov: 28, sx: 0, sy: -.19 }
                        : { az: 36 - 22 * p + 34 * u, el: 7 + 3 * p - 4 * u, dist: 3.5 + 1.3 * u, tgt: [0, .64, 0], fov: 26, sx: .2, sy: .02 });
    const D = LOOK.dark;
    st.setLook(T >= 1 ? D : { env: D.env * ss(.3, .9, T), key: D.key * ss(.2, .7, T), rim: D.rim * ss(0, .35, T), shadow: D.shadow * ss(.3, .9, T), floor: D.floor * ss(.15, .8, T) });
    st.setThermal(0); st.state.explode = 0; st.state.recl = 0; st.state.lum = 205; st.setHighlight(null); st.setFlows([]);
    zonesTo({});
  },
  zones(p) {
    st.setView(narrow() ? { az: 18, el: 6, dist: 5.4, tgt: [0, .64, 0], fov: 28, sx: -.04, sy: .15 }
                        : { az: 22 - 8 * p, el: 6, dist: 3.75, tgt: [0, .67, 0], fov: 26, sx: .2, sy: .01 });
    st.setLook(LOOK.light); st.setThermal(0); st.state.explode = 0; st.state.recl = 0; st.state.lum = 205; st.setHighlight(null); st.setFlows([]);
    zonesTo({});
    $$('.callout').forEach((c, i) => c.classList.toggle('on', p > .08 + i * .16));
  },
  thermal(p) {
    st.setView(narrow() ? { az: 14, el: 8, dist: 5.4, tgt: [0, .67, 0], fov: 28, sx: 0, sy: .04 }
                        : { az: 14 + 6 * p, el: 9, dist: 3.85, tgt: [0, .67, 0], fov: 26, sx: .03, sy: .02 });
    st.setLook(LOOK.dark); st.state.explode = 0; st.state.recl = 0; st.state.lum = 205; st.setHighlight(null); st.setFlows([]);
    const B = [0, .17, .39, .57, .8, 1.01]; let step = 0; while (step < 4 && p >= B[step + 1]) step++;
    const q = clamp((p - B[step]) / (B[step + 1] - B[step]));
    if (step !== thStep) { const lis = $$('.th-steps li'); clockTo(lis[step], lis[thStep]); thStep = step; thUser = null; lis.forEach((li, i) => li.classList.toggle('on', i === step)); }
    if (step === 0) zonesTo({});
    if (step === 1) { zonesTo({ A: ['heat', 1], C: ['heat', 2] }); scrub(.3 + 16 * q); }
    if (step === 2) { zonesTo({ A: ['after', 1], C: ['after', 2] }); scrub(9 * q); }
    if (step === 3) { zonesTo({ B: ['air', 1], C: ['air', 2] }, 27); scrub(.3 + 12 * q); }
    if (step === 4) zonesTo({}, 27);
    const auto = p > .02 && p < .93 ? 1 : 0, on = thUser === null ? auto : thUser;
    st.setThermal(on); setSeg(on);
  },
  posture(p) {
    st.setView(narrow() ? { az: 90, el: 4, dist: 6.2, tgt: [0, .72, -.08], fov: 28, sx: -.04, sy: -.02 }
                        : { az: 90, el: 4, dist: 4.25, tgt: [0, .7, -.08], fov: 25, sx: .17, sy: .02 });
    st.setLook(LOOK.light); st.setThermal(0); st.state.explode = 0; st.setHighlight(null); st.setFlows([]);
    st.state.recl = posture.recl; st.state.lum = posture.lum; st.state.lumD = posture.lumD;
    zonesTo({});
    // while the lumbar height moves, the pad goes see-through so the spring-steel plate carrying the bump can be seen
    if (Math.abs(st.state.lum - st.cs.lum) > .15 || (hold && hold.axis === 'lum')) lumSeen = performance.now();
    if (performance.now() - lumSeen < 1400) want.xray = [LUMG, LUMS];
  },
  adjust(p) { adjustScene(p, frameDt); },
  specs() { specsScene(); },
  finish(p) {
    const f = FIN.user || (p < .5 ? 'white' : 'black');
    FIN.cur = f; $$('.swatches button').forEach((b) => { const on = String(b.dataset.fin === f); if (b.getAttribute('aria-checked') !== on) b.setAttribute('aria-checked', on); });
    st.setFinish(f);
    st.setView(narrow() ? { az: 34 - 44 * p, el: 7, dist: 7.4, tgt: [0, .64, 0], fov: 28, sx: 0, sy: -.06 }
                        : { az: 38 - 50 * p, el: 8, dist: 3.6, tgt: [0, .64, 0], fov: 26, sx: .2, sy: .02 });
    st.setLook(LOOK.light); st.setThermal(0); st.state.explode = 0; st.state.recl = 0; st.state.lum = 205; st.setHighlight(null); st.setFlows([]);
    zonesTo({});
  },
  parts(p) {
    const k = ss(.02, .4, p);
    if (!exBox) { st.applyExplode(1); exBox = new THREE.Box3().setFromObject(st.root); st.applyExplode(st.cs.explode); }
    // at full explode the camera backs off until the whole stack fits, aimed at its middle
    const ey = exBox.getCenter(new THREE.Vector3()).y, eh = exBox.max.y - exBox.min.y, fit = (fov, m) => eh * m / (2 * Math.tan(fov / 2 * Math.PI / 180));
    st.setView(narrow() ? { az: 30 - 50 * k, el: 12 + 6 * k, dist: lerp(5.4, fit(28, 1.78), k), tgt: [0, lerp(.66, ey, k), 0], fov: 28, sx: 0, sy: lerp(.1, .13, k) }
                        : { az: 32 - 58 * k, el: 10 + 8 * k, dist: lerp(3.4, fit(26, 1.42), k), tgt: [0, lerp(.64, ey, k), 0], fov: 26, sx: .19, sy: .02 });
    st.setLook({ ...LOOK.light, shadow: LOOK.light.shadow * (1 - ss(0, .3, k)) }); st.setThermal(0); st.state.recl = 0; st.state.lum = 205; st.state.explode = k;
    applyPath(k > .55 ? partsPath : 'all');
    // the line under the tabs says what to do next: keep scrolling while the chair is whole, pick a route once it is apart
    const apart = String(k > .55), pt = $('#pathText');
    if (partsPath === 'all' && pt.dataset.apart !== apart) { pt.dataset.apart = apart; typeIn(pt, apart === 'true' ? PATHS.all.text : PATH0); }
  },
  app() {
    st.setView({ az: 24, el: 7, dist: 4.1, tgt: [0, .64, 0], fov: 26, sx: .3, sy: .03 });
    st.setLook(LOOK.light); st.setThermal(0); st.state.explode = 0; st.state.recl = appPosture.recl; st.state.lum = appPosture.lum; st.setHighlight(null); st.setFlows([]);
    if (appZones) zonesTo(appZones); else zonesTo({});
  },
};

// ---- parts paths ---------------------------------------------------------------------------------------------------
const PATHS = {
  all: { hl: null, flows: [], zones: {}, text: tr('点热、风、电、动，看每条线路经过哪几块零件。', "Pick Heat, Air, Power or Motion to see which parts each route runs through.") },
  heat: { hl: ['battery', 'main_board', 'heat_', 'zone_led'], zones: { A: ['heat', 2], B: ['heat', 2], C: ['heat', 2] },
    flows: [{ color: '#ff6a2b', chain: ['battery', 'main_board', 'heat_C'] }, { color: '#ff6a2b', chain: ['main_board', 'main_board_spine', 'heat_B', 'heat_A'] }],
    text: tr('电池 → 主板 → 三个区的电热丝。座垫的线直接从底仓出来，上背和腰的线从脊柱里走。', "Battery → main board → the heating wire in each zone. The seat’s cable comes straight out of the pod; the cables for the upper and lower back run up through the spine.") },
  air: { hl: ['fan_', 'vent_', 'pod_grille', 'seat_cushion', 'upper_pad', 'lumbar_pad'], zones: { A: ['air', 2], B: ['air', 2], C: ['air', 2] },
    flows: [{ color: '#1fb2e0', chain: ['pod_grille', 'fan_seat_housing', 'fan_seat_bellows', 'seat_cushion'] }, { color: '#1fb2e0', chain: ['vent_lumbar', 'fan_lumbar', 'lumbar_pad'] }, { color: '#1fb2e0', chain: ['vent_upper', 'fan_upper', 'upper_pad'] }],
    text: tr('三个离心风扇。座垫的风扇在底仓里，从底部格栅吸风；腰和上背的风扇在垫子后面。', "Three centrifugal fans. The seat’s sits in the pod and draws air through the grille underneath; the lower and upper back’s sit behind their pads.") },
  power: { hl: ['battery', 'main_board', 'pod_port', 'ctrl_', 'arm_pad', 'zone_led', 'wire_arm', 'wire_seat'], zones: {},
    flows: [{ color: '#30c75b', chain: ['battery', 'main_board', 'ctrl_screen'] }, { color: '#30c75b', chain: ['main_board', 'main_board_spine', 'zone_led'] }],
    text: tr('80 Wh 电池插在底仓里，能拔出来充电。主板管加热、风扇、三个电机和扶手面板。', "The 80 Wh battery slots into the pod and comes out to charge. The main board runs the heating, the fans, three motors and the armrest panel.") },
  motion: { hl: ['recline_', 'lumbar_bow', 'lumbar_basket', 'lumbar_depth', 'lumbar_core', 'lumbar_dock', 'jbar', 'main_board'], zones: {},
    flows: [{ color: '#6e6bf2', chain: ['main_board', 'recline_motor', 'recline_worm_wheel'] }, { color: '#6e6bf2', chain: ['main_board', 'main_board_spine', 'lumbar_bow_motor', 'lumbar_basket'] }, { color: '#6e6bf2', chain: ['main_board_spine', 'lumbar_depth_motor', 'lumbar_core'] }],
    text: tr('靠背：电机经蜗轮蜗杆转动转轴上的两个调角器。腰托高度：电机拉钢丝，移动垫子里的弹簧钢片。腰托前后：底座里的小电机转丝杆，推着腰托整块走。', "Recline: a motor turns the two recliners on the pivot through a worm gear. Lumbar height: a motor pulls a cable that moves the spring-steel plate inside the pad. Lumbar depth: a small motor in the dock turns a lead screw and pushes the whole lumbar forward or back.") },
};
let curPath = null;
const PATH0 = $('#pathText').textContent;
function applyPath(name) {
  const P = PATHS[name];
  if (curPath !== name) { curPath = name; st.setHighlight(P.hl); st.setFlows(P.flows); }
  zonesTo(P.zones);
}
$$('.tabs button').forEach((b) => b.addEventListener('click', () => {
  partsPath = b.dataset.path;
  $$('.tabs button').forEach((x) => x.setAttribute('aria-selected', x === b ? 'true' : 'false'));
  typeIn($('#pathText'), PATHS[partsPath].text);
  const sec = $('#parts'), r = sec.getBoundingClientRect(), need = sec.offsetTop + (sec.offsetHeight - innerHeight) * .62;
  if (-r.top / (r.height - innerHeight) < .56) window.scrollTo({ top: need, behavior: 'smooth' });
}));

// ---- thermal: segmented control, readouts, spot meter ---------------------------------------------------------------
function setSeg(on) { $$('.seg button').forEach((b) => b.setAttribute('aria-checked', String(+b.dataset.th === on))); $('#thermal').classList.toggle('thermal-on', !!on); }
$$('.seg button').forEach((b) => b.addEventListener('click', () => { thUser = +b.dataset.th; }));
const spot = $('.spot'), spotT = $('.spot b'), thPin = $('#thermal .pin'), thFrame = $('.th-frame');
let pointer = null;
thPin.addEventListener('pointermove', (e) => { pointer = { x: e.clientX, y: e.clientY, t: performance.now() }; });
thPin.addEventListener('pointerleave', () => { pointer = null; });
thPin.addEventListener('pointerdown', (e) => { pointer = { x: e.clientX, y: e.clientY, t: performance.now() }; });
let lastPick = 0, pickHit = null;
function thermalHud() {
  for (const z of ZONES) { const el = $(`.th-zones [data-z="${z}"] b`); el.textContent = st.zv[z].T.toFixed(1) + '°'; }
  const r = thPin.getBoundingClientRect(); let x, y, T = null;
  if (pointer && performance.now() - pointer.t < 6000) {
    const now = performance.now();
    if (now - lastPick > 90) { lastPick = now; pickHit = st.pick(pointer.x / innerWidth * 2 - 1, -(pointer.y / innerHeight * 2 - 1), true); }
    if (pickHit) { x = pointer.x; y = pointer.y; T = pickHit.zone ? st.tempAt(pickHit.hit) : pickHit.T; }
  } else {
    const pr = st.probe('C', .5, .5); if (pr) { const q = st.project(pr.point); x = q.x; y = q.y; T = pr.T; }
  }
  // the camera's corner marks sit just outside the chair, wherever the chair is on screen
  // (heights taken through the chair's middle: the box's front corners would hang below the casters)
  const cs = [], b = st.box, zc = (b.min.z + b.max.z) / 2;
  for (let i = 0; i < 8; i++) cs.push(st.project(new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z)));
  const ch = [0, 1, 2, 3].map((i) => st.project(new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, zc)));
  const fx0 = Math.min(...cs.map((c) => c.x)) - r.left, fx1 = Math.max(...cs.map((c) => c.x)) - r.left;
  const fy0 = Math.min(...ch.map((c) => c.y)) - r.top, fy1 = Math.max(...ch.map((c) => c.y)) - r.top, pad = narrow() ? 14 : 30;
  thFrame.style.cssText = `inset:auto;left:${fx0 - pad}px;top:${fy0 - pad}px;width:${fx1 - fx0 + 2 * pad}px;height:${fy1 - fy0 + 2 * pad}px`;
  const show = T !== null && st.thermalK > .6;
  spot.classList.toggle('on', show);
  if (show) { spot.style.transform = `translate(${x - r.left}px, ${y - r.top}px)`; spotT.textContent = T.toFixed(1) + '°C'; }
}

// ---- zone callouts ----------------------------------------------------------------------------------------------------
let padBox = null, leaderG = null;
function callouts() {
  const pin = $('#zones .pin'), r = pin.getBoundingClientRect(), nar = narrow();
  if (!padBox) {
    padBox = {}; for (const z of ZONES) padBox[z] = new THREE.Box3().setFromObject(st.padMesh[z]);
    leaderG = $('svg.leaders g'); leaderG.innerHTML = ZONES.map(() => '<path pathLength="1"/><circle class="halo" r="9"/><circle r="4.5"/>').join('');
  }
  // labels line up in a column just right of the chair; a leader runs from each pad's middle
  const b = st.box, cs = [];
  for (let i = 0; i < 8; i++) cs.push(st.project(new THREE.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z)));
  const right = Math.max(...cs.map((q) => q.x)) - r.left;
  const els = $$('.callout'), paths = leaderG.querySelectorAll('path'), dots = leaderG.querySelectorAll('circle');
  els.forEach((c, i) => {
    const z = c.dataset.zone, bb = padBox[z], ctr = bb.getCenter(new THREE.Vector3());
    const anchor = z === 'C' ? new THREE.Vector3(ctr.x + .08, bb.max.y, ctr.z + .04) : new THREE.Vector3(ctr.x + .1, ctr.y, bb.max.z);
    const q = st.project(anchor), ax = q.x - r.left, ay = q.y - r.top, on = c.classList.contains('on');
    const lx = nar ? ax + 16 : Math.min(right + 28, r.width - 150), ly = ay;
    c.style.transform = `translate(${lx + 10}px, ${ly - 14}px)`;
    paths[i].setAttribute('d', nar ? '' : `M${ax} ${ay} L${lx} ${ly}`);
    dots[i * 2].setAttribute('cx', ax); dots[i * 2].setAttribute('cy', ay); dots[i * 2 + 1].setAttribute('cx', ax); dots[i * 2 + 1].setAttribute('cy', ay);
    for (const e of [paths[i], dots[i * 2], dots[i * 2 + 1]]) e.classList.toggle('on', on);
  });
}

// ---- posture: rockers, AI demo, angle overlay ------------------------------------------------------------------------
const status = $('#aiStatus'), aiKey = $('#aiKey');
let hold = null, aiRun = null;
const RANGE = { recl: [0, 30], lum: [180, 252], lumD: [0, 20] }, RATE = { recl: 6, lum: 22, lumD: 8 };
function stopAI(msg) { if (aiRun) { aiRun.stop = true; aiRun = null; aiKey.setAttribute('aria-pressed', 'false'); if (msg) typeIn(status, msg); } }
$$('.rocker button').forEach((b) => {
  const axis = b.dataset.axis || b.closest('.rocker').dataset.axis, dir = +b.dataset.dir;
  const start = (e) => { e.preventDefault(); stopAI(); hold = { axis, dir }; b.classList.add('hold'); try { b.setPointerCapture(e.pointerId); } catch (_) { /* synthetic or already released */ } };
  const end = () => { if (hold && hold.axis === axis) hold = null; b.classList.remove('hold'); };
  b.addEventListener('pointerdown', start); b.addEventListener('pointerup', end); b.addEventListener('pointercancel', end); b.addEventListener('lostpointercapture', end);
  b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); stopAI(); posture[axis] = clamp(posture[axis] + dir * (axis === 'recl' ? 1 : 2), ...RANGE[axis]); } });
});
const wait = (ms, run) => new Promise((res) => { const t0 = performance.now(); const f = () => { if (run.stop) return res(false); if (performance.now() - t0 >= ms) return res(true); requestAnimationFrame(f); }; f(); });
const moveTo = (axis, target, run) => new Promise((res) => {
  let last = performance.now();
  const f = (now) => { if (run.stop) return res(false); const dt = Math.min(.05, (now - last) / 1000); last = now;
    const d = target - posture[axis], step = Math.sign(d) * Math.min(Math.abs(d), (axis === 'recl' ? 2.6 : 7) * dt); posture[axis] += step;
    if (Math.abs(target - posture[axis]) < .01) { posture[axis] = target; return res(true); } requestAnimationFrame(f); };
  requestAnimationFrame(f);
});
aiKey.addEventListener('click', async () => {
  if (aiRun) return;
  const run = aiRun = { stop: false }; aiKey.setAttribute('aria-pressed', 'true');
  const r0 = posture.recl, rT = clamp(16, r0 - 8, r0 + 8), l0 = posture.lum, lT = clamp(195, l0 - 10, l0 + 10);
  typeIn(status, tr(`AI：你看书时常把靠背放到 16°。先调靠背，${r0.toFixed(0)}° → ${rT.toFixed(0)}°。`, `AI: when you read, you usually have the back at 16°. Recline first, ${r0.toFixed(0)}° → ${rT.toFixed(0)}°.`));
  if (!(await moveTo('recl', rT, run))) return;
  typeIn(status, tr('靠背到位，停稳 5 秒再调腰托。', "Recline done. The lumbar follows after 5 seconds."));
  if (!(await wait(2200, run))) return;
  typeIn(status, tr(`腰托 ${l0.toFixed(0)} → ${lT.toFixed(0)} mm。`, `Lumbar ${l0.toFixed(0)} → ${lT.toFixed(0)} mm.`));
  if (!(await moveTo('lum', lT, run))) return;
  typeIn(status, rT !== 16 || lT !== 195 ? tr('这次只动到上限，剩下的至少 10 分钟后再调。', "That is as far as it moves in one go; the rest waits at least 10 minutes.") : tr('调好了。下次调整至少隔 10 分钟。', "Done. The next change is at least 10 minutes away."));
  aiRun = null; aiKey.setAttribute('aria-pressed', 'false');
});
$('#stopKey').addEventListener('click', () => {
  if (aiRun) stopAI(tr(`停在 ${posture.recl.toFixed(1)}°，腰托 ${posture.lum.toFixed(0)} mm。AI 已暂停。`, `Stopped at ${posture.recl.toFixed(1)}°, lumbar ${posture.lum.toFixed(0)} mm. AI paused.`));
  else typeIn(status, tr('AI 已暂停。按 AI 键恢复。', "AI paused. Press the AI key to resume."));
});
const arc = $('.angle-arc'), ref = $('.angle-ref'), cur = $('.angle-cur'), atxt = $('.angle-t');
let backPts = null;
function postureHud(dt) {
  if (hold) posture[hold.axis] = clamp(posture[hold.axis] + hold.dir * RATE[hold.axis] * dt, ...RANGE[hold.axis]);
  $('#rRecl').textContent = Math.round(st.cs.recl) + '°';
  $('#rLum').firstChild.textContent = Math.round(st.cs.lum);
  $('#rLumD').firstChild.textContent = Math.round(st.cs.lumD);
  const bk = st.nodes.back_g; if (!bk || !st.padMesh.A || !st.padMesh.B) return;
  bk.updateMatrixWorld(true);
  // two points on the backrest in the back's own frame (middle of the lumbar pad, middle of the upper pad)
  if (!backPts) backPts = [st.padCentre('B'), st.padCentre('A')].map((w) => bk.worldToLocal(w));
  // where they are now and where they would be with the back upright, drawn as a guide just behind the back
  const rest = new THREE.Matrix4().compose(bk.position, bk.userData.q0, bk.scale).premultiply(bk.parent.matrixWorld);
  const pin = $('#posture .pin').getBoundingClientRect();
  const S = (v) => { const q = st.project(v); return [q.x - pin.left, q.y - pin.top]; };
  const [b1, t1] = backPts.map((p) => S(p.clone().applyMatrix4(bk.matrixWorld))), [b0, t0] = backPts.map((p) => S(p.clone().applyMatrix4(rest)));
  const d1 = [t1[0] - b1[0], t1[1] - b1[1]], d0 = [t0[0] - b0[0], t0[1] - b0[1]], l1 = Math.hypot(...d1), l0 = Math.hypot(...d0);
  let nx = -d1[1] / l1, ny = d1[0] / l1; if (nx < 0) { nx = -nx; ny = -ny; }
  const nar = narrow(), off = nar ? 34 : 92, ox = b1[0] + nx * off, oy = b1[1] + ny * off, L = l1 * (nar ? 1.45 : 1.55);
  const u1 = [d1[0] / l1, d1[1] / l1], u0 = [d0[0] / l0, d0[1] / l0];
  ref.setAttribute('d', `M${ox} ${oy} L${ox + u0[0] * L} ${oy + u0[1] * L}`);
  cur.setAttribute('d', `M${ox} ${oy} L${ox + u1[0] * L} ${oy + u1[1] * L}`);
  const R = L * .92, a0 = Math.atan2(u0[1], u0[0]), a1 = Math.atan2(u1[1], u1[0]);
  const p = (ang) => `${ox + R * Math.cos(ang)} ${oy + R * Math.sin(ang)}`, on = st.cs.recl > .3;
  arc.setAttribute('d', on ? `M${p(a0)} A${R} ${R} 0 0 ${a1 > a0 ? 1 : 0} ${p(a1)}` : '');
  atxt.setAttribute('x', ox + (R + 16) * Math.cos(a1) + 4); atxt.setAttribute('y', oy + (R + 16) * Math.sin(a1) + 5);
  atxt.textContent = Math.round(st.cs.recl) + '°';
}

// ---- parts labels ---------------------------------------------------------------------------------------------------
const MODS = [['head', tr('头枕', "Headrest")], ['upper', tr('上背', "Upper back")], ['lumbar', tr('腰托', "Lumbar")], ['dock', tr('腰托支架', "Lumbar dock")], ['spine', tr('脊柱', "Spine")], ['cushion', tr('座垫', "Seat")],
  ['seatplate', tr('座板', "Seat plate")], ['arm+', tr('左扶手', "Left arm")], ['arm-', tr('右扶手', "Right arm")], ['pod', tr('底仓：电池、主板、风扇', "Pod: battery, board, fans")], ['gas', tr('气杆', "Gas lift")], ['base', tr('椅脚', "Base")]];
const PATH_MODS = { heat: ['upper', 'lumbar', 'cushion', 'pod', 'spine'], air: ['upper', 'lumbar', 'cushion', 'pod'], power: ['pod', 'arm+', 'arm-', 'spine'],
  motion: ['pod', 'lumbar', 'dock', 'spine'], all: null };
let modMeshes = null, leadSvg = null; const plabels = [];
const SVGNS = 'http://www.w3.org/2000/svg';
function partLabels(show) {
  if (!modMeshes) {
    modMeshes = {}; for (const [k] of MODS) modMeshes[k] = [];
    for (const m of st.meshes) { let mod = m.userData.module; if (mod === 'arm') mod = new THREE.Box3().setFromObject(m).getCenter(new THREE.Vector3()).x > 0 ? 'arm+' : 'arm-'; (modMeshes[mod] || []).push(m); }
    leadSvg = document.createElementNS(SVGNS, 'svg'); leadSvg.setAttribute('class', 'pleads'); $('#labels').appendChild(leadSvg);
    MODS.forEach(([k, name], i) => { const d = document.createElement('div'); d.className = 'plabel'; d.style.setProperty('--k', i); d.innerHTML = `<i>${i + 1}</i><span>${name}</span>`; $('#labels').appendChild(d); plabels.push(d);
      const g = document.createElementNS(SVGNS, 'g'); g.innerHTML = '<path/><circle r="3"/>'; leadSvg.appendChild(g); });
  }
  const on = PATH_MODS[curPath || 'all'], nar = narrow(), gs = leadSvg.children;
  leadSvg.classList.toggle('on', !!show && !nar);
  if (!show) { plabels.forEach((d) => d.classList.remove('on', 'dim', 'named', 'left')); return; }
  // an anchor on each module, and the screen extent of the whole exploded chair
  const items = [], b = new THREE.Box3(), t = new THREE.Box3(); let x0 = 1e9, x1 = -1e9;
  MODS.forEach(([k], i) => {
    b.makeEmpty(); for (const m of modMeshes[k]) { t.setFromObject(m); b.union(t); }
    if (b.isEmpty()) return;
    for (let j = 0; j < 8; j++) { const q = st.project(new THREE.Vector3(j & 1 ? b.max.x : b.min.x, j & 2 ? b.max.y : b.min.y, j & 4 ? b.max.z : b.min.z)); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); }
    const c = b.getCenter(new THREE.Vector3()); if (k.startsWith('arm')) c.y = b.max.y;
    if (k === 'pod') c.x = b.max.x; if (k === 'base') c.x = b.max.x * .7;
    const q = st.project(c); items.push({ i, k, x: q.x, y: q.y });
  });
  for (const it of items) {
    const d = plabels[it.i], dim = !!on && !on.includes(it.k);
    d.classList.add('on'); d.classList.toggle('dim', dim); d.classList.toggle('named', !!on && on.includes(it.k)); gs[it.i].classList.toggle('dim', dim);
  }
  if (nar) {      // numbers only, on the parts; two that land on each other are nudged apart
    items.sort((a, c) => a.y - c.y);
    for (let j = 1; j < items.length; j++) for (let m = 0; m < j; m++) {
      const a = items[m], c = items[j]; if (Math.abs(a.x - c.x) < 22 && c.y - a.y < 22) c.y = a.y + 22;
    }
    for (const it of items) { plabels[it.i].classList.remove('left'); plabels[it.i].style.transform = `translate(${it.x - 10}px, ${it.y - 10}px)`; }
    return;
  }
  // labels in a column each side of the chair, in the order the parts stack, pushed apart so none overlap;
  // the left column is used only when it clears the words on the left
  const copy = $$('.parts-copy > *').reduce((m, e) => Math.max(m, e.getBoundingClientRect().right), 0);
  const mid = (x0 + x1) / 2, xl = x0 - 36, xr = Math.min(x1 + 36, innerWidth - 190);
  const lw = Math.max(0, ...items.filter((it) => it.x < mid).map((it) => plabels[it.i].offsetWidth)), useLeft = xl - lw > copy + 24;
  const cols = [[], []]; for (const it of items) cols[useLeft && it.x < mid ? 0 : 1].push(it);
  cols.forEach((col, side) => {
    col.sort((a, c) => a.y - c.y);
    const ys = col.map((it) => it.y), gap = 30, top = 76, bot = innerHeight - 26;
    for (let j = 1; j < ys.length; j++) ys[j] = Math.max(ys[j], ys[j - 1] + gap);
    if (ys.length) ys[ys.length - 1] = Math.min(ys[ys.length - 1], bot);
    for (let j = ys.length - 2; j >= 0; j--) ys[j] = Math.min(ys[j], ys[j + 1] - gap);
    if (ys.length && ys[0] < top) { const sh = top - ys[0]; for (let j = 0; j < ys.length; j++) ys[j] += sh; }
    col.forEach((it, j) => {
      const d = plabels[it.i], y = ys[j], x = side ? xr : xl, g = gs[it.i];
      d.classList.toggle('left', !side);
      d.style.transform = side ? `translate(${x}px, ${y - 10}px)` : `translate(${x}px, ${y - 10}px) translateX(-100%)`;
      const ex = side ? x - 6 : x + 6, kx = side ? x - 24 : x + 24;
      g.firstChild.setAttribute('d', `M${it.x} ${it.y} L${kx} ${y} L${ex} ${y}`);
      g.lastChild.setAttribute('cx', it.x); g.lastChild.setAttribute('cy', it.y);
    });
  });
}

// ---- adjustments: every way the chair moves, the control that moves it, and the part going through its range ---------
// (ranges, controls and where they are: the design table, blender/r9d/diagrams/d6_adjustments.py)
const REST = { seat: .5, depth: 0, armH: 0, armW: 0, armD: 0, armR: 0, lumD: 0, headU: 0, headT: 0, levH: 0, levD: 0, door: 0, batt: 0 };
const U1 = (ph) => .5 - .5 * Math.cos(ph), S1 = (ph) => Math.sin(ph);         // a one-sided sweep from rest, a two-sided one
const two = (s, lo, hi) => (s < 0 ? lo * s : hi * s);                          // two-sided sweep with different ends
const LUMG = /^lumbar_(pad|rim|shell|pocket)/, LUMS = /^lumbar_basket/;
let RA = null;                                                                 // rest-pose anchors, taken once the model is in
const off = (v, dx = 0, dy = 0, dz = 0) => [v.x + dx, v.y + dy, v.z + dz];
const ADJ = [
  { g: '手动', name: tr('座高', "Seat height"), range: '405–535 mm', where: tr('座下右侧，靠后的拨杆', "The rear lever, under the right of the seat"),
    how: tr('往上拉拨杆，气杆松开：人不坐时座面往上升，坐着往下压，松手就锁住。', "Pull the lever up to release the gas lift: the seat rises when you’re off it and sinks under you when you sit. Let go and it locks."),
    view: () => ({ az: -34, el: 5, dist: 4.1, tgt: [0, .62, 0] }), ctl: /^lever_height/, ctlAt: 'lever_height_paddle', ctlText: tr('拨杆', "Lever"),
    run: (ph, s) => { s.seat = .5 + .5 * S1(ph); s.levH = 1; }, read: (c) => [Math.round(405 + 130 * c.seat), 'mm', tr('座面离地', "seat above the floor")], readAt: 'seat_cushion', ro: [210, -30] },
  { g: '手动', name: tr('座深', "Seat depth"), range: '0–80 mm', where: tr('座下右侧，靠前的拨杆', "The front lever, under the right of the seat"),
    how: tr('拉住拨杆，前后推座面，座盘和坐垫一起滑。', "Hold the lever and push the seat forward or back; the pan and cushion slide together."),
    view: () => ({ az: -70, el: 12, dist: 2.6, tgt: [0, .44, .06] }), ctl: /^lever_depth/, ctlAt: 'lever_depth_paddle', ctlText: tr('拨杆', "Lever"),
    run: (ph, s) => { s.depth = 80 * U1(ph); s.levD = 1; }, read: (c) => [Math.round(c.depth), 'mm', tr('座面往前', "seat forward")], readAt: 'seat_cushion', ro: [190, -70] },
  { g: '手动', name: tr('扶手高度', "Arm height"), range: '110 mm', where: tr('扶手竖管内侧的按键', "The button on the inside of the arm post"),
    how: tr('按住按键，上下拉扶手，扶手面离座面 190–300 mm。', "Hold the button and move the arm up or down. The pad sits 190–300 mm above the seat."),
    view: () => ({ az: -40, el: 6, dist: 2.1, tgt: off(RA.armR, 0, -.12, 0) }), ctl: /^arm_button/, ctlAt: ['arm_button', -1], ctlText: tr('按键', "Button"),
    run: (ph, s) => { s.armH = 110 * U1(ph); }, read: (c) => [190 + Math.round(c.armH), 'mm', tr('扶手面离座面', "pad above the seat")], readAt: ['arm_pad', -1], ro: [160, -30] },
  { g: '手动', name: tr('扶手宽度', "Arm width"), range: tr('向内 47 mm，向外 20 mm', "47 mm in, 20 mm out"), where: tr('扶手面', "The arm pad"),
    how: tr('直接左右推扶手面。', "Push the pad in or out."),
    view: () => ({ az: -8, el: 16, dist: 2.1, tgt: off(RA.armR, .12, -.06, 0) }),
    run: (ph, s) => { s.armW = two(S1(ph), 47, 20); }, read: (c) => [Math.round(Math.abs(c.armW)), 'mm', c.armW < 0 ? tr('往里', "in") : tr('往外', "out")], readAt: ['arm_pad', -1], ro: [-210, -40] },
  { g: '手动', name: tr('扶手前后', "Arm depth"), range: '±25 mm', where: tr('扶手面', "The arm pad"),
    how: tr('直接前后推扶手面。', "Push the pad forward or back."),
    view: () => ({ az: -88, el: 12, dist: 1.9, tgt: RA.armR }),
    run: (ph, s) => { s.armD = 25 * S1(ph); }, read: (c) => [Math.round(Math.abs(c.armD)), 'mm', c.armD >= 0 ? tr('往前', "forward") : tr('往后', "back")], readAt: ['arm_pad', -1], ro: [170, -50] },
  { g: '手动', name: tr('扶手转角', "Arm angle"), range: tr('前端向内 20°，向外 10°', "Front 20° in, 10° out"), where: tr('扶手面', "The arm pad"),
    how: tr('直接转扶手面。', "Turn the pad."),
    view: () => ({ az: -30, el: 58, dist: 1.7, tgt: RA.armR }),
    run: (ph, s) => { s.armR = two(S1(ph), 20, 10); }, read: (c) => [Math.round(Math.abs(c.armR)), '°', c.armR < 0 ? tr('前端往里', "front in") : tr('前端往外', "front out")], readAt: ['arm_pad', -1], ro: [170, -40] },
  { g: '手动', name: tr('头枕高度', "Headrest height"), range: '0–100 mm', where: tr('头枕', "Headrest"),
    how: tr('直接上下推拉头枕，下沿离座面 630–730 mm。', "Push or pull the headrest. Its lower edge sits 630–730 mm above the seat."),
    view: () => ({ az: -55, el: 6, dist: 2.1, tgt: off(RA.head, 0, -.03, 0) }),
    run: (ph, s) => { s.headU = 100 * U1(ph); }, read: (c) => [630 + Math.round(c.headU), 'mm', tr('下沿离座面', "lower edge above the seat")], readAt: 'head_pad', ro: [180, 0] },
  { g: '手动', name: tr('头枕角度', "Headrest angle"), range: '0–20°', where: tr('头枕', "Headrest"),
    how: tr('扳头枕往前翻，棘轮一格一格定位。', "Tip the headrest forward; a ratchet holds it at each step."),
    view: () => ({ az: -92, el: 4, dist: 1.8, tgt: RA.head }),
    run: (ph, s) => { s.headT = 20 * U1(ph); }, read: (c) => [Math.round(c.headT), '°', tr('往前翻', "tipped forward")], readAt: 'head_pad', ro: [190, -20] },
  { g: '电动', name: tr('靠背后仰', "Recline"), range: '0–30°', where: tr('右扶手内侧的「靠背」拨键', "The Back key inside the right armrest"),
    how: tr('按住拨键，靠背往后仰，松开就停；后仰 30° 时座面跟着后倾 10°。靠背是电机带的，拨键只是个电开关，线从扶手竖管里走到底仓主板，所以能放在扶手上，不用像机械椅那样在座下拉杆。', "Hold the key and the back reclines; let go and it stops. At 30° the seat tilts back 10° with it. A motor drives the back, so the key is only a switch, wired down the arm post to the board in the pod. That is why it can sit on the armrest instead of being a lever under the seat."),
    view: () => ({ az: -90, el: 4, dist: 4.4, tgt: [0, .7, -.08] }), ctlAt: 'ctrl_glass', ctlText: tr('拨键在扶手内侧', "Key inside the armrest"),
    run: (ph, s) => { s.recl = 30 * U1(ph); }, read: (c) => [Math.round(c.recl), '°', tr('后仰', "reclined")], readAt: 'head_pad', ro: [170, 10] },
  { g: '电动', name: tr('腰托高度', "Lumbar height"), range: '72 mm', where: tr('右扶手内侧的「腰托」拨键（四向）', "The four-way Lumbar key inside the right armrest"),
    how: tr('上下推拨键，软包里的弹簧钢支撑片由拉线电机带着上下移，腰托的凸起跟着走。', "Push the key up or down: a cable motor moves the spring-steel plate inside the pad, and the lumbar bulge moves with it."),
    view: () => ({ az: -48, el: 4, dist: 1.45, tgt: RA.lumbar }), xray: [LUMG, LUMS],
    run: (ph, s) => { s.lum = 205 + two(S1(ph), 25, 47); }, read: (c) => [Math.round(c.lum), 'mm', tr('支撑点离座面', "support above the seat")], readAt: 'lumbar_basket', ro: [200, -10] },
  { g: '电动', name: tr('腰托深度', "Lumbar depth"), range: '0–20 mm', where: tr('右扶手内侧的「腰托」拨键（四向）', "The four-way Lumbar key inside the right armrest"),
    how: tr('前后推拨键，腰托底座里的小电机转丝杆，腰托整块沿铝芯柱往前伸或往后退；丝杆自锁，靠上去不会退。AI 也能调它。', "Push the key forward or back: a small motor in the dock turns a lead screw, and the whole lumbar slides along its aluminium core. The screw is self-locking, so leaning on it won’t push it back. The AI can set it too."),
    view: () => ({ az: -115, el: 6, dist: 1.5, tgt: RA.lumbar }), xray: [/^lumbar_dock/, /^lumbar_depth_motor/],
    run: (ph, s) => { s.lumD = 20 * U1(ph); }, read: (c) => [Math.round(c.lumD), 'mm', tr('腰托往前', "lumbar forward")], readAt: 'lumbar_pad', ro: [190, -60] },
  { g: '面板和电池', name: tr('扶手控制面板', "Armrest panel"), range: tr('右扶手内侧', "Inside the right armrest"), where: tr('右扶手内侧', "Inside the right armrest"),
    how: tr('三区键选区，旋钮往左是风、往右是热，按下确认；靠背拨键上下推；腰托拨键是四向的，上下调高度、前后调深度；AI 键开关自动调节，长按进菜单；暂停接管让正在走的自动动作停住。', "The zone key picks a zone; turn the knob left for air or right for heat, and press it to confirm. Push the Back key up or down. The Lumbar key moves four ways: up and down for height, forward and back for depth. The AI key turns automatic adjustment on and off; hold it for the menu. Pause AI stops any automatic move in progress."),
    view: () => ({ az: 80, el: 26, dist: .5, tgt: RA.panel }), keys: true },
  { g: '面板和电池', name: tr('电池', "Battery"), range: '80 Wh', where: tr('底仓左侧', "The left side of the pod"),
    how: tr('推开滑扣，电池门往下翻开，电池沿两条导轨抽出来单独充电。不拔也行，充电口在底仓前面。没电时手动的照常调，靠背和腰托停在原位。', "Slide the catch and the battery door drops open; the pack slides out on two rails to charge on its own. Or leave it in: the charging port is on the front of the pod. With a flat battery the manual adjustments still work, and the back and lumbar stay where they are."),
    view: () => ({ az: 24, el: 12, dist: 2.45, tgt: off(RA.pod, .05, -.04, 0) }), ctl: /^pod_door_latch/, ctlAt: 'pod_door_latch', ctlText: tr('滑扣', "Catch"), T: 6.4,
    run: (ph, s) => { const u = U1(ph); s.door = clamp(u * 2.2); s.batt = clamp(u * 2.2 - 1.1); } },
];
const KEYS = [
  { re: /^ctrl_screen/, at: 'ctrl_screen', t: tr('状态屏', "Status screen") }, { re: /^ctrl_knob/, at: 'ctrl_knob', t: tr('旋钮：往左风，往右热，按下确认', "Knob: left for air, right for heat, press to confirm") },
  { re: /^ctrl_zone/, at: 'ctrl_zone1', t: tr('三区键：上背、腰、座垫', "Zone key: upper back, lower back, seat") }, { re: /^ctrl_toggle0/, at: 'ctrl_toggle0', t: tr('靠背拨键', "Back key") },
  { re: /^ctrl_toggle1/, at: 'ctrl_toggle1', t: tr('腰托拨键：上下调高度，前后调深度', "Lumbar key: up and down for height, forward and back for depth") }, { re: /^ctrl_ai/, at: 'ctrl_ai', t: tr('AI 键', "AI key") }, { re: /^ctrl_stop/, at: 'ctrl_stop', t: tr('暂停接管', "Pause AI") },
];
// where a part is now: a name prefix, or [prefix, side] for parts that come in a left and a right copy
const _b = new THREE.Box3(), _t = new THREE.Box3(), _v = new THREE.Vector3();
function liveAt(spec) {
  if (!Array.isArray(spec)) return st.anchor(spec);
  const [pre, sg] = spec; _b.makeEmpty();
  for (const m of st.meshes) { const n = (m.userData.obj || '').replace(/\.\d+$/, ''); if (!n.startsWith(pre)) continue; _t.setFromObject(m); if (Math.sign(_t.getCenter(_v).x) === sg) _b.union(_t); }
  return _b.isEmpty() ? null : _b.getCenter(new THREE.Vector3());
}
let adjI = -1, adjT = 0, keyOn = -1;
const GN = { 手动: tr('手动', 'By hand'), 电动: tr('电动', 'By motor'), 面板和电池: tr('面板和电池', 'Panel and battery') };
const adjPin = $('#adjust .pin'), adjRd = $('.adj-read'), adjRing = $('.adj-ring'), adjSvg = $('.adj-svg'), adjKeys = $('.adj-keys'), adjCard = $('.adj-card');
function adjBuild() {
  let html = '', g = '';
  ADJ.forEach((a, i) => {
    if (a.g !== g) { g = a.g; html += `<p class="adj-g">${GN[g]}</p>`; }
    html += `<button class="adj-row" data-i="${i}" aria-pressed="false"><span class="an">${a.name}</span><span class="ar">${a.range}</span></button>` +
            `<div class="adj-det"><div><p>${a.how}</p><p class="aw">${tr("在哪：", "Where: ")}${a.where}</p></div></div>`;
  });
  $('#adjList').innerHTML = html;
  $$('.adj-row').forEach((b) => b.addEventListener('click', () => {
    const sec = $('#adjust'), i = +b.dataset.i;
    window.scrollTo({ top: sec.offsetTop + (sec.offsetHeight - innerHeight) * ((i + .5) / ADJ.length), behavior: 'smooth' });
  }));
  adjKeys.innerHTML = KEYS.map((k) => `<span>${k.t}</span>`).join('');
  adjSvg.innerHTML = '<path class="rl"/><circle class="rd" r="3.5"/>' + KEYS.map(() => '<path class="kl"/>').join('');
}
function adjShow(i) {
  $$('.adj-row').forEach((b, j) => { b.setAttribute('aria-pressed', String(j === i)); b.classList.toggle('on', j === i); });
  const a = ADJ[i];
  adjCard.innerHTML = `<div class="ac-top"><b>${a.name}</b><span>${a.range}</span><i class="${a.g === '电动' ? 'e' : ''}">${a.g === '面板和电池' ? '' : GN[a.g]}</i></div><p>${a.how}</p><p class="aw">${tr("在哪：", "Where: ")}${a.where}</p><span class="ac-n">${i + 1} / ${ADJ.length}</span>`;
  $$('p', adjCard).forEach((p) => typeIn(p, p.textContent));
  adjPin.classList.toggle('keys', !!a.keys);
}
function adjustScene(p, dt) {
  const n = ADJ.length, i = Math.min(n - 1, Math.floor(p * n * .9999)), A = ADJ[i], nar = narrow();
  if (i !== adjI) { adjI = i; adjT = 0; adjShow(i); }
  adjT += dt;
  const v = A.view();
  // on a phone the part sits between the headline and the card; close-ups back off further (the screen is narrow)
  st.setView(nar ? { ...v, dist: v.dist * (v.dist > 3.5 ? 2 : 3), fov: 28, sx: 0, sy: -.09 } : { fov: 26, sx: .2, sy: .02, ...v });
  st.setLook(LOOK.light); st.setThermal(0); st.state.explode = 0; st.state.recl = 0; st.state.lum = 205; st.setHighlight(null); st.setFlows([]); zonesTo({});
  if (A.run) A.run(2 * Math.PI * adjT / (A.T || 4.6), st.state);
  if (A.ctl) want.focus = A.ctl;
  if (A.xray) want.xray = A.xray;
  if (A.keys) { keyOn = Math.floor(adjT / 1.4) % KEYS.length; want.focus = KEYS[keyOn].re; }
}
function adjustHud() {
  const A = ADJ[adjI]; if (!A) return;
  const pin = adjPin.getBoundingClientRect(), nar = narrow(), k = nar ? .5 : 1;
  const P = (spec) => { const w = liveAt(spec); if (!w) return null; const q = st.project(w); return [q.x - pin.left, q.y - pin.top]; };
  const rl = adjSvg.querySelector('.rl'), rd = adjSvg.querySelector('.rd');
  const r = A.read && P(A.readAt);
  adjRd.classList.toggle('on', !!r);
  if (r) {
    const [num, unit, label] = A.read(st.cs), dy = A.ro[1] * k, w = adjRd.offsetWidth;
    let dx = A.ro[0] * k;
    if ((dx < 0 && r[0] + dx - w < 8) || (dx > 0 && r[0] + dx + w > pin.width - 8)) dx = -dx;    // keep it on screen
    const x = r[0] + dx, y = r[1] + dy;
    adjRd.children[0].textContent = num; adjRd.children[1].textContent = unit; adjRd.children[2].textContent = label;
    adjRd.style.transform = dx < 0 ? `translate(${x}px, ${y}px) translate(-100%, -50%)` : `translate(${x}px, ${y}px) translateY(-50%)`;
    rl.setAttribute('d', `M${r[0]} ${r[1]} L${x - Math.sign(dx) * 8} ${y}`); rd.setAttribute('cx', r[0]); rd.setAttribute('cy', r[1]);
  } else { rl.setAttribute('d', ''); rd.setAttribute('cx', -99); }
  const c = A.ctlAt && P(A.ctlAt);
  adjRing.classList.toggle('on', !!c);
  if (c) { adjRing.style.transform = `translate(${c[0]}px, ${c[1]}px)`; adjRing.children[1].textContent = A.ctlText || ''; }
  // the panel: a label for every key, above and below the row in turn; the one lit on the chair is the one in ink
  const kls = adjSvg.querySelectorAll('.kl'), spans = adjKeys.children;
  if (A.keys) {
    const pts = KEYS.map((kk) => P(kk.at)), order = pts.map((q, j) => j).filter((j) => pts[j]).sort((a, b) => pts[a][0] - pts[b][0]);
    // a staircase under the panel: the leftmost key's label lowest, so every label runs right past shorter leaders
    order.forEach((j, o) => {
      const q = pts[j], ly = q[1] + (nar ? 52 : 46 + (order.length - 1 - o) * 30);
      const s = spans[j]; s.classList.toggle('on', j === keyOn); s.classList.toggle('hide', nar && j !== keyOn);
      s.style.transform = `translate(${q[0] + 7}px, ${ly}px) translateY(-50%)`;
      kls[j].setAttribute('d', nar && j !== keyOn ? '' : `M${q[0]} ${q[1]} L${q[0]} ${ly}`); kls[j].classList.toggle('on', j === keyOn);
    });
  } else kls.forEach((e) => e.setAttribute('d', ''));
}

// ---- specs: the chair as a side elevation with its dimensions, drawn from the model ---------------------------------
let SPEC = null, dimSvg = null, dimT0 = 0;
const r5 = (m) => Math.round(m * 1000 / 5) * 5;
function specGeo() {
  const b = st.box, box = (re) => { const B = new THREE.Box3(), T = new THREE.Box3(); for (const m of st.meshes) if (re.test(m.userData.obj || '')) { T.setFromObject(m); B.union(T); } return B; };
  const cu = box(/^seat_cushion/), ar = box(/^arm_pad/), ba = box(/^(base_|caster)/);
  const H = r5(b.max.y - b.min.y);
  SPEC = { floor: b.min.y, top: b.max.y, zF: b.max.z, zB: b.min.z, seatY: cu.max.y, seatZ: cu.max.z, armY: ar.max.y, armZ: (ar.min.z + ar.max.z) / 2,
    bz0: ba.min.z, bz1: ba.max.z, base: r5(Math.max(ba.max.x - ba.min.x, ba.max.z - ba.min.z)), hMin: H - 65, hMax: H + 65 + 100, mid: (b.min.y + b.max.y) / 2 + .03,
    pivot: st.nodes.back_g.getWorldPosition(new THREE.Vector3()), upper: st.padCentre('A') };
}
function specsScene() {
  const d = $('.spec-draw').getBoundingClientRect(), nar = narrow(), fov = nar ? 12 : 9;
  const need = (SPEC.top - SPEC.floor + .2) / (nar ? .52 : .82), V = need / Math.max(.25, d.height / innerHeight);
  const sx = (d.left + d.width * (nar ? .58 : .5)) / innerWidth - .5, sy = (d.top + d.height / 2) / innerHeight - .5;
  st.setView({ az: 90, el: 0, dist: V / (2 * Math.tan(fov / 2 * Math.PI / 180)), tgt: [0, SPEC.mid, 0], fov, sx, sy });
  st.cur.sx = sx; st.cur.sy = sy;           // the drawing area scrolls with the page on phones: the chair stays in it, no easing
  st.setLook({ ...LOOK.light, shadow: 0 }); st.setThermal(0); st.state.explode = 0; st.state.recl = 0; st.state.lum = 205; st.setHighlight(null); st.setFlows([]); zonesTo({});
}
function dims(show) {
  if (!dimSvg) { dimSvg = document.createElementNS(SVGNS, 'svg'); dimSvg.setAttribute('class', 'dims'); $('#labels').appendChild(dimSvg); }
  // on the way in, the drawing is measured up from the floor
  if (show && !dimT0) dimT0 = performance.now(); if (!show) dimT0 = 0;
  dimSvg.style.setProperty('--d', reduced || !show ? 1 : ss(0, 1, (performance.now() - dimT0) / 1300).toFixed(3));
  dimSvg.classList.toggle('on', show); if (!show) return;
  const S = SPEC, nar = narrow(), o1 = nar ? 26 : 44, P = (y, z) => { const q = st.project(new THREE.Vector3(0, y, z)); return [q.x, q.y]; };
  const F = P(S.floor, S.zF), B = P(S.floor, S.zB), dir = Math.sign(F[0] - B[0]) || 1;
  const seat = P(S.seatY, S.seatZ), arm = P(S.armY, S.armZ), top = P(S.top, S.zB), fy = F[1];
  const fx = Math.max(F[0] * dir, seat[0] * dir) * dir, bx = Math.min(B[0] * dir, top[0] * dir) * dir, hx = fx + dir * (nar ? 70 : 150);
  const tick = (x, y) => `M${x - 5} ${y + 5}L${x + 5} ${y - 5}`;
  const vdim = (x, y0, y1, num, lab, cls, side) => {
    const ty = (y0 + y1) / 2, tx = x + side * 12, an = side > 0 ? 'start' : 'end';
    return `<g class="${cls}"><path d="M${x} ${y0}V${y1}${tick(x, y0)}${tick(x, y1)}"/><text x="${tx}" y="${ty - 2}" text-anchor="${an}" class="n">${num}</text><text x="${tx}" y="${ty + 16}" text-anchor="${an}" class="l">${lab}</text></g>`;
  };
  const base0 = P(S.floor, S.bz0), base1 = P(S.floor, S.bz1), by = fy + 34;
  // the back's 0-30 degree sweep, drawn from the recline pivot through the top of the headrest
  const pv = S.pivot, hv = S.upper.clone().sub(pv).setX(0), arc = [];
  for (let i = 0; i <= 24; i++) { const w = hv.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), -THREE.MathUtils.degToRad(30 * i / 24)).add(pv); const q = st.project(w); arc.push(`${i ? 'L' : 'M'}${q.x} ${q.y}`); }
  const ae = st.project(hv.clone().applyAxisAngle(new THREE.Vector3(1, 0, 0), -THREE.MathUtils.degToRad(30)).add(pv));
  // the sweep's label sits outside the arc, behind the chair; on a phone there is no room beside it, so it goes under the arc's end against the edge
  const W = innerWidth, rx = nar ? (dir < 0 ? W - 16 : 16) : ae.x - dir * 10, ra = (dir > 0) !== nar ? 'end' : 'start';
  dimSvg.innerHTML =
    `<path class="floor" d="M${Math.min(F[0], B[0]) - 70} ${fy}H${Math.max(F[0], B[0]) + 70}"/>` +
    `<path class="ext" d="M${seat[0]} ${seat[1]}H${fx + dir * (o1 + 6)}M${top[0]} ${top[1]}H${hx + dir * 6}"/>` +
    vdim(fx + dir * o1, fy, seat[1], '405–535', tr('座高', "Seat height"), 'mv', dir) +
    // overall height outside the seat height, its figures above the line (the back side keeps the recline sweep)
    `<g class="mv"><path d="M${hx} ${fy}V${top[1]}${tick(hx, fy)}${tick(hx, top[1])}"/><text x="${hx}" y="${top[1] - 30}" text-anchor="${nar ? 'start' : 'middle'}" dx="${nar ? -6 : 0}" class="n">${S.hMin}–${S.hMax}</text><text x="${hx}" y="${top[1] - 13}" text-anchor="${nar ? 'start' : 'middle'}" dx="${nar ? -6 : 0}" class="l">${tr("整高", "Overall height")}</text></g>` +
    `<g class="st"><path d="M${base0[0]} ${by}H${base1[0]}${tick(base0[0], by)}${tick(base1[0], by)}"/><text x="${(base0[0] + base1[0]) / 2}" y="${by + 20}" text-anchor="middle" class="n">${S.base}</text><text x="${(base0[0] + base1[0]) / 2}" y="${by + 37}" text-anchor="middle" class="l">${tr("椅脚直径", "Base diameter")}</text></g>` +
    `<g class="mv"><path class="arc" d="${arc.join('')}"/><text x="${rx}" y="${ae.y + (nar ? 24 : -12)}" text-anchor="${ra}" class="n">0–30°</text><text x="${rx}" y="${ae.y + (nar ? 40 : 5)}" text-anchor="${ra}" class="l">${tr("靠背后仰", "Recline")}</text></g>` +
    `<text class="unit" x="${Math.min(F[0], B[0]) - 70}" y="${by + 37}">${tr("单位 mm", "mm")}</text>`;
}
// the small figures beside the numbers: each one is a scale with the real values on it
function specCharts() {
  const fig = (k, svg) => { const e = $(`.sb-fig[data-fig="${k}"]`); if (e) e.innerHTML = svg; };
  const hx = (T) => 14 + (T - 20) / 30 * 432;
  let h = `<svg viewBox="0 0 460 96" role="img" aria-label="${tr('加热温度刻度：三档 33、35、37°C，面料最高 43°C，45°C 断电', 'Heat scale: three levels at 33, 35 and 37°C; the fabric at most 43°C; cut-off at 45°C')}">` +
    '<defs><linearGradient id="hg" x1="0" x2="1"><stop offset="0" stop-color="#cfd3da"/><stop offset=".42" stop-color="#ffb27a"/><stop offset=".7" stop-color="#ff6a2b"/><stop offset="1" stop-color="#d9302a"/></linearGradient></defs>' +
    `<rect class="grow" x="${hx(20)}" y="52" width="${hx(50) - hx(20)}" height="5" rx="2.5" fill="url(#hg)"/>`;
  for (let T = 20; T <= 50; T += 5) h += `<path d="M${hx(T)} 61v5" class="tk"/><text x="${hx(T)}" y="81" text-anchor="middle" class="tl">${T}</text>`;
  [33, 35, 37].forEach((T, i) => { h += `<circle cx="${hx(T)}" cy="54.5" r="5.5" class="lv"/><text x="${hx(T)}" y="42" text-anchor="middle" class="lvt">${i + 1}</text>`; });
  h += `<path d="M${hx(43)} 26V58" class="mx"/><text x="${hx(43) - 6}" y="22" text-anchor="end" class="ml">${tr("面料最高 43", "Fabric max 43")}</text>`;
  h += `<path d="M${hx(45)} 26V58" class="cut"/><text x="${hx(45) + 6}" y="22" class="cl">${tr("45 断电", "45 cut-off")}</text></svg>`;
  fig('heat', h);
  let a = `<svg viewBox="0 0 460 96" role="img" aria-label="${tr('通风三档：40%、70%、100% 风机转速', 'Air: three fan speeds, 40%, 70% and 100%')}">`;
  [40, 70, 100].forEach((v, i) => { const y = 8 + i * 30; a += `<text x="0" y="${y + 13}" class="tl2">${tr(i + 1 + ' 档', 'Fan ' + (i + 1))}</text><rect x="48" y="${y + 2}" width="${360}" height="14" rx="7" class="trk"/><rect x="48" y="${y + 2}" width="${3.6 * v}" height="14" rx="7" class="air grow" style="opacity:${.45 + .55 * v / 100}"/><text x="${416}" y="${y + 13}" class="tv">${v}%</text>`; });
  fig('air', a + '</svg>');
  const bxh = (hrs) => 104 + hrs / 14 * 316;
  let p = `<svg viewBox="0 0 460 104" role="img" aria-label="${tr('80 Wh 电池续航估算：控温加热约 4 小时，只吹风约 14 小时', '80 Wh battery, estimated: about 4 hours of heating, about 14 hours of air only')}">`;
  p += `<text x="0" y="23" class="tl2">${tr("控温加热", "Heating")}</text><rect x="104" y="10" width="${bxh(14) - 104}" height="16" rx="8" class="trk"/><rect x="104" y="10" width="${bxh(4) - 104}" height="16" rx="8" class="heat grow"/><text x="${bxh(4) + 8}" y="23" class="tv">${tr("约 4 h", "about 4 h")}</text>`;
  p += `<text x="0" y="57" class="tl2">${tr("只吹风", "Air only")}</text><rect x="104" y="44" width="${bxh(14) - 104}" height="16" rx="8" class="trk"/><rect x="104" y="44" width="${bxh(14) - 104}" height="16" rx="8" class="air grow"/><text x="${bxh(14) - 8}" y="57" text-anchor="end" class="tv in">${tr("约 14 h", "about 14 h")}</text>`;
  for (const t of [0, 4, 8, 12]) p += `<path d="M${bxh(t)} 70v5" class="tk"/><text x="${bxh(t)}" y="92" text-anchor="middle" class="tl">${t} h</text>`;
  fig('power', p + '</svg>');
  const gx = (mm) => 14 + mm / 40 * 432;
  let g = `<svg viewBox="0 0 460 96" role="img" aria-label="${tr('防夹手：电动部件之间的缝不大于 8 毫米或不小于 25 毫米', 'Finger gaps: gaps between powered parts are 8 mm or less, or 25 mm or more')}">` +
    '<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V6" class="hp"/></pattern></defs>' +
    `<rect x="${gx(0)}" y="40" width="${gx(8) - gx(0)}" height="14" rx="3" class="ok"/><rect x="${gx(8)}" y="40" width="${gx(25) - gx(8)}" height="14" fill="url(#hatch)" class="no"/><rect x="${gx(25)}" y="40" width="${gx(40) - gx(25)}" height="14" rx="3" class="ok"/>` +
    `<text x="${(gx(8) + gx(25)) / 2}" y="30" text-anchor="middle" class="nl">${tr("8–25 mm 会夹手", "8–25 mm can trap a finger")}</text>`;
  for (const t of [0, 8, 25, 40]) g += `<path d="M${gx(t)} 58v5" class="tk"/><text x="${gx(t)}" y="80" text-anchor="middle" class="tl">${t}</text>`;
  fig('gap', g + '</svg>');
}

const FIN = { cur: 'white', user: null };
$$('.swatches button').forEach((b) => b.addEventListener('click', () => { FIN.user = b.dataset.fin; }));

// ---- words in motion ------------------------------------------------------------------------------------------------
// a headline is split into pieces: one character each, a closing punctuation mark riding with the character before it, a
// run of Latin letters or digits kept whole. Each piece carries its index (--i) and the headline its count (--n); one
// custom property on the headline (--p, 0..1, from where it is on screen) then drives the whole reveal from style.css
const TAIL = '，。；：、！？）」』”’》%°,;:!?)';      // punctuation stays on the word before it, in either language
const UNIT = new RegExp(`[A-Za-z0-9.+/–-]+[${TAIL}]*|\\s+|[^\\s][${TAIL}]*`, 'g');
function split(el, hide = true) {
  const text = el.textContent; let n = 0;
  const walk = (node) => {
    for (const c of [...node.childNodes]) {
      if (c.nodeType === 3) {
        const f = document.createDocumentFragment();
        for (const u of c.textContent.match(UNIT) || []) {
          if (/^\s+$/.test(u)) { f.append(u); continue; }
          const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', n++); s.textContent = u;
          if (hide) s.setAttribute('aria-hidden', 'true');
          f.append(s);
        }
        c.replaceWith(f);
      } else if (c.nodeType === 1 && c.tagName !== 'svg') walk(c);
    }
  };
  walk(el); el.style.setProperty('--n', n);
  // screen readers get the sentence whole
  if (hide) { const sr = document.createElement('span'); sr.className = 'sr'; sr.textContent = text; el.prepend(sr); }
  return el;
}
// a line that changes while you watch (the AI's status, a route through the parts) types itself in
const typeIn = (el, text) => { el.textContent = text; split(el, false); el.classList.add('typed'); };

// everything that reveals with the scroll: --p from where the element (or, inside a pinned section, its pin) is on screen,
// so it plays forward on the way down and back on the way up. a/b: p starts at a*vh from the top, takes b*vh to reach 1
const RV = [];
const rv = (el, o = {}) => { if (el) RV.push({ el, v: -1, a: .94, b: .42, ...o }); return el; };
function reveals() {
  const vh = innerHeight;
  const got = RV.map((r) => { const t = (r.ref || r.el).getBoundingClientRect().top; return reduced ? 1 : clamp((vh * r.a - t) / (vh * r.b)); });
  RV.forEach((r, i) => {
    const v = Math.round(got[i] * 400) / 400; if (v === r.v) return;
    r.v = v; r.el.style.setProperty('--p', v); r.el.classList.toggle('rv-in', v >= 1); if (r.on) r.on(v);
  });
}
// a number counts up to itself as it comes in (every number in the element's first line of text)
function counter(el) {
  const node = el && el.firstChild; if (!node || node.nodeType !== 3) return null;
  const src = node.textContent;
  return (p) => { const e = 1 - Math.pow(1 - clamp(p * 1.3 - .15), 3); node.textContent = src.replace(/\d+/g, (m) => String(Math.round(+m * e))); };
}
// a pinned section's words lift away over the last stretch of it, as the next one comes up underneath (--x on the pin);
// the thermal story keeps its last step on screen longer and only lets go at the very end
const EXITS = $$('.pin').map((el) => ({ el, sec: el.closest('section'), v: -1, a: el.closest('#thermal') ? .96 : .86 }));
const heroIn = $('.hero-in');
let heroX = -1;
function exits() {
  const vh = innerHeight;
  for (const x of EXITS) {
    const r = x.sec.getBoundingClientRect(), p = clamp(-r.top / Math.max(1, r.height - vh)), v = reduced ? 0 : Math.round(ss(x.a, 1, p) * 400) / 400;
    if (v !== x.v) { x.v = v; x.el.style.setProperty('--x', v); }
  }
  const h = $('#hero').getBoundingClientRect(), hx = reduced ? 0 : Math.round(ss(.15, 1, clamp(-h.top / Math.max(1, h.height - vh))) * 400) / 400;
  if (hx !== heroX) { heroX = hx; heroIn.style.setProperty('--x', hx); }
}
function motionInit() {
  split($('#hero h1'));
  for (const s of $$('.pin')) {
    const sec = s.closest('section'), d = (el, k) => { if (el) { el.classList.add('rb'); el.style.setProperty('--d', k); rv(el, { ref: s, a: 1, b: .7 }); } };
    $$('.statement, .th-top h2', s).forEach((h) => rv(split(h), { ref: s, a: 1, b: .7 }));
    if (sec.id === 'zones') d($('.zones-note', s), .4);
    if (sec.id === 'thermal') { d($('.seg', s), .35); d($('.th-hud', s), .5); }
    if (sec.id === 'posture') { d($('.readouts', s), .35); d($('.panel', s), .45); d($('.posture-note', s), .55); }
    if (sec.id === 'adjust') d($('.adj-list', s), .35);
    if (sec.id === 'finish') { d($('.swatches', s), .35); d($('.mats', s), .45); }
    if (sec.id === 'parts') { d($('.tabs', s), .35); d($('.path-text', s), .45); }
    if (sec.id === 'app') { d($('.app-copy p', s), .35); d($('.iphone', s), .2); }
  }
  $$('.title, .glance-head').forEach((h) => rv(split(h)));
  $$('.sub, .glance-sub, .mk-h').forEach((el) => { el.classList.add('rb'); rv(el, { b: .3 }); });
  $$('.mk-r').forEach((el) => rv(el, { a: .98, b: .3 }));
  $$('.sb').forEach((el) => rv(el, { a: .95, b: .45, on: counter($('.big', el)) }));
  // cards in a row come in one after another: the delay is the card's place in its row
  const stagger = (els) => { let top = null, k = 0; for (const el of els) { const t = el.offsetTop; k = t === top ? k + 1 : 0; top = t; el.style.setProperty('--d', k * .1); } };
  const cards = () => { stagger($$('.versions li')); stagger($$('.glance-row > *')); stagger($$('.foot-in > div')); };
  $$('.versions li').forEach((el) => rv(el, { a: .98, b: .4 }));
  $$('.glance-row > *, .foot-in > div').forEach((el) => { el.classList.add('rb'); rv(el, { a: 1, b: .35 }); });
  cards(); addEventListener('resize', cards);
  // the lines that change on their own: the steps of the heat story, an adjustment's text, the route through the parts
  $$('.th-steps h3').forEach((h) => split(h));
  $$('.adj-det p').forEach((p) => split(p, false));
  split($('#pathText'), false);
}
// the thermal story's clock runs on to the next step's time instead of jumping there
const clock = { el: null, from: 0, to: 0, t0: 0 };
const mins = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
function clockTo(li, prevLi) {
  if (clock.el) clock.el.textContent = clock.el.dataset.t;          // a run cut short by a quick scroll ends on its own time
  const t = li.querySelector('time'); t.dataset.t = t.dataset.t || t.textContent;
  clock.el = t; clock.to = mins(t.dataset.t); clock.from = prevLi ? mins(prevLi.querySelector('time').dataset.t || prevLi.querySelector('time').textContent) : clock.to; clock.t0 = performance.now();
}
function clockTick() {
  if (!clock.el) return;
  const k = reduced ? 1 : ss(0, 1, (performance.now() - clock.t0) / 900), m = Math.round(lerp(clock.from, clock.to, k));
  clock.el.textContent = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  if (k >= 1) clock.el = null;
}
// the nav's underline slides to the section you are in
const navInd = document.createElement('i'); navInd.className = 'nav-ind'; navInd.setAttribute('aria-hidden', 'true'); $('.nav nav').appendChild(navInd);
function navMark(id) {
  const a = $$('.nav nav a').find((x) => x.getAttribute('href') === '#' + id);
  $$('.nav nav a').forEach((x) => x.setAttribute('aria-current', String(x === a)));
  if (!a) { navInd.style.opacity = 0; return; }
  navInd.style.opacity = 1; navInd.style.width = a.offsetWidth + 'px'; navInd.style.transform = `translateX(${a.offsetLeft}px)`;
}
// while you look at it, the chair turns a little on its own: a slow sway, a few degrees, in the scenes that show it whole
const SWAY = { hero: 1, zones: .7, finish: .6, app: 1, parts: .5 };

// ---- scroll -> active scene ------------------------------------------------------------------------------------------
const sections = $$('main > section[data-scene]');
let active = null, activeId = null, lastTone = null, hideTimer = null;
const NAV_OF = { make: 'parts', glance: 'app' };      // sections without a nav entry keep their topic's
function frame(dt) {
  frameDt = dt; want.focus = null; want.xray = null;
  if (intro.t >= 0 && intro.t < intro.len) {
    intro.t += dt; st.camK = intro.t < intro.len ? 2.2 : 3.4;
    if (intro.t > 1.4) document.body.classList.add('lit');
  }
  const vh = innerHeight; let pick = null, prog = 0;
  for (const s of sections) { const r = s.getBoundingClientRect(); if (r.top <= vh * .5 && r.bottom > vh * .5) { pick = s; prog = clamp(-r.top / Math.max(1, r.height - vh)); break; } }
  if (!pick) pick = sections[0];
  const scene = pick.dataset.scene, tone = pick.dataset.tone;
  st.timeScale = scene === 'thermal' ? 0 : 1;
  st.G.uAmbT.value += (ambT - st.G.uAmbT.value) * (1 - Math.exp(-3 * dt));
  if (tone !== lastTone) {
    document.body.dataset.tone = tone; lastTone = tone;
    // inside the portfolio, the site's header above the frame takes the same tone
    if (window.MC && window.MC.embedded) parent.postMessage({ mc: 'tone', tone }, location.origin);
  }
  const stageOn = scene !== 'none' && !(scene === 'app' && narrow());
  $('#stage').classList.toggle('off', !stageOn);
  if (stageOn) { clearTimeout(hideTimer); hideTimer = null; st.visible = true; }
  else if (st.visible && !hideTimer) hideTimer = setTimeout(() => { st.visible = false; hideTimer = null; }, 700);
  Object.assign(st.state, REST);            // every scene starts from the chair as built; the adjustments scene moves one thing
  if (SCENES[scene]) SCENES[scene](prog);
  const sw = SWAY[scene];
  if (sw && !reduced) { const t = performance.now() / 1000; st.view.az += sw * 2.6 * Math.sin(t * .24); st.view.el += sw * .6 * Math.sin(t * .17 + 1.3); }
  if (pick.id !== activeId) { activeId = pick.id; navMark(NAV_OF[pick.id] || pick.id); }
  if (scene !== active) {
    active = scene; if (scene === 'specs') st.jumpView();
    FIN.user = null;     // a choice made in a section lasts while you are in it
  }
  if (scene !== 'finish') { st.setFinish('white'); FIN.cur = 'white'; }
  if (scene === 'thermal') thermalHud(); else spot.classList.remove('on');
  if (scene === 'zones') callouts();
  if (scene === 'posture') postureHud(dt);
  partLabels(scene === 'parts' && st.cs.explode > .6);
  if (scene === 'adjust') adjustHud();
  dims(scene === 'specs');
  st.setFocus(want.focus); st.setXray(want.xray ? want.xray[0] : null, want.xray ? want.xray[1] : null);
}

// ---- boot -----------------------------------------------------------------------------------------------------------
const bar = $('.ld-bar i');
st.load((f) => { bar.style.width = (f * 100).toFixed(0) + '%'; }).then(() => {
  bar.style.width = '100%'; $('#loader').classList.add('done');
  RA = { armR: liveAt(['arm_pad', -1]), lumbar: st.anchor('lumbar_pad'), head: st.anchor('head_pad'), panel: st.anchor('ctrl_glass'), pod: st.anchor('pod_door') };
  specGeo(); st.warm();
  // the opening plays only when the page starts at the top
  if (!reduced && scrollY < innerHeight * .3) { intro.t = 0; st.curLook = { env: 0, key: 0, rim: 0, shadow: 0, floor: 0 }; }
  else { intro.t = intro.len; document.body.classList.add('lit'); }
  frame(0); st.jumpView();
  st.onFrame = frame;
  // keep scenes running while the stage is hidden (labels, tone)
  let last = performance.now(); const idle = (now) => { requestAnimationFrame(idle); if (!st.visible) { frame((now - last) / 1000); } last = now; }; requestAnimationFrame(idle);
}).catch((e) => { $('.ld-text').textContent = tr('模型没有载入：', "The model didn’t load: ") + e.message; console.error(e); document.body.classList.add('lit'); });
setTimeout(() => document.body.classList.add('lit'), 7000);     // on a slow connection the words don't wait for the model
addEventListener('pointermove', (e) => { if (!narrow()) st.parallax.set(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1); }, { passive: true });

adjBuild(); specCharts();
initApp($('#iphone'), $('#glanceRow'), (z) => { appZones = z; }, (r, l) => { appPosture = { recl: r, lum: l }; });
motionInit();
// the reveals only move when the page does: measure on a scroll or resize, and twice a second for layout that shifts
let mY = -1, mH = -1, mT = 0;
const motion = (now) => {
  requestAnimationFrame(motion); clockTick();
  if (scrollY === mY && innerHeight === mH && now - mT < 500) return;
  mY = scrollY; mH = innerHeight; mT = now; reveals(); exits();
};
requestAnimationFrame(motion);
