import {useEffect, useMemo, useRef, useState} from 'react';
import PROBE from './probe.json';
import {pToScroll} from './camera';
import {T} from './timeline';
import {RACK, RACKS, ROWS, COLD_AISLE, HOT_AISLE, PODS, PER_ROW, NET_EACH_END, FACTS, ROW_X0, ROW_X1, WALK_Z, WALK_AISLE, ROOMS} from './plan';
import PERF from './perf.json';
import {rackLights} from './textures';
import {DETAIL} from './detail';

// How the film was made. Every number here is read from the project: plan.js and timeline.js (the same modules the
// film runs on), probe.json (scripts/datahall-probe.mjs), reviews.json (aigc-vibecoding/data-hall/reviews) and the
// live renderer. Sources for the facts are in aigc-vibecoding/data-hall/research.md.
const L = (lang, en, zh) => (lang === 'en' ? en : zh);
const fmt = n => n.toLocaleString('en-US');
const LIGHTS = RACKS.reduce((n, r) => n + rackLights(r.gpu).length, 1);

const SCHEDULE = [
  ['slab', 'Slab', '底板'], ['columns', 'Columns', '柱子'], ['walls', 'Walls', '墙'], ['rooms', 'Power rooms', '配电间'],
  ['frames', 'Hot-aisle frames', '热通道框架'], ['busway', 'Busway', '母线槽'], ['trays', 'Fibre trays', '光纤桥架'], ['pipes', 'Coolant pipes', '冷却液管'],
  ['plant', 'CDUs, fan walls', 'CDU、风墙'], ['lights', 'Lights', '灯'], ['racks', 'Racks', '机柜'], ['connect', 'Connections', '接线'],
];
const CHAPTER_NAMES = {plan: ['Plan', '平面图'], build: ['Build', '施工'], descend: ['Descent', '下降'], walk: ['Walk', '步行'], power: ['Power on', '通电'], turn: ['Turn', '转身'], tray: ['Tray', '托盘'], dive: ['Dive', '下潜'], back: ['Sheet', '图纸']};
// what the model sets where nothing is published (research.md marks each as an estimate or a reading)
const CHOICES = [
  ['Cold aisle 1.8 m wide, so a 0.77 m tray can be pulled out with a person beside it. The cited guide strongly recommends cold aisles at least 1.22 m wide.', '冷通道 1.8 米宽，抽出 0.77 米的托盘时旁边还能站人。所引的指南强烈建议冷通道至少 1.22 米宽。'],
  ['Columns only in the outer walls, 5.5 m apart, so the hall is a 22 m clear span.', '柱子只在外墙里，间距 5.5 米，机房内是 22 米的无柱空间。'],
  ['Network racks at both ends of each row: my reading of the reference design’s drawing.', '每排两头放网络机柜：这是我对参考设计图纸的理解。'],
  ['The heights of the busway, fibre trays, coolant pipes and lights. No source gives mounting heights.', '母线槽、光纤桥架、冷却液管和灯的安装高度。没有资料给出这些高度。'],
  ['Which rack unit each tray sits in. The order of the trays is published; their positions are not.', '每个托盘在机柜里的具体 U 位。托盘的上下顺序是公开的，具体位置不是。'],
  ['The positions of parts inside the tray. The parts are the ones the maker shows; where they sit is approximate.', '托盘内部零件的位置。零件种类按厂商公开的来，摆放位置是近似的。'],
  ['The UPS, batteries and switchgear are in a separate power building, not drawn; the rooms on the north side hold the boards and PDUs that feed the busways.', 'UPS、电池和开关设备放在另一栋电力楼里，没有画出来；北侧的几间房放给母线槽供电的配电柜和 PDU。'],
  ['The layout of the die. The maker hasn’t published a floor plan, so the drawing is illustrative.', '芯片裸片的布局。厂商没有公开版图，所以这张图是示意。'],
];

const SOURCES = [
  {fact: ['72 GPUs and 36 CPUs per rack; from top to bottom between the power shelves, 10 compute trays, 9 switch trays and 8 compute trays', '每台机柜 72 块 GPU、36 颗 CPU；在上下两组电源之间，从上到下是 10 个计算托盘、9 个交换托盘、8 个计算托盘'], src: [['NVIDIA DGX GB200 User Guide', 'https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html'], ['NVIDIA, Hot Chips 2025', 'https://hc2025.hotchips.org/assets/program/tutorials/HC2025.T1DCRacks.S5.Norton.pdf']]},
  {fact: ['132 kW per GPU rack and 22 kW per network rack, three pods of two rows, 7,392 kW in all', '每台 GPU 机柜 132 千瓦、网络机柜 22 千瓦，三组各两排，合计 7,392 千瓦'], src: [['Schneider Electric, Reference Design 109', 'https://www.se.com/ca/en/download/document/RD109DSR0_EN']]},
  {fact: ['Coolant goes in at 40 °C and comes out at about 54 °C; the reference design supplies air at about 28 °C', '冷却液 40 °C 进、约 54 °C 出；参考设计的送风约 28 °C'], src: [['Schneider Electric, Reference Design 109', 'https://www.se.com/ca/en/download/document/RD109DSR0_EN']]},
  {fact: ['The services are installed and tested with load banks before the racks arrive', '管线先装好、用假负载测过，机柜才进场'], src: [['Aggreko', 'https://www.aggreko.com/en-au/case-studies/data-centres/precision-testing-with-liquid-cooled-load-banks'], ['Global Data Center Hub', 'https://www.globaldatacenterhub.com/p/construction-sequencing-qaqc-and']]},
  {fact: ['A compute tray is about 766 × 438 × 44 mm', '一个计算托盘约 766 × 438 × 44 毫米'], src: [['Interplex (reported)', 'https://interplex.com/interplex-on-nvidia-mgx-ecosystem/1ru-chassis-for-nvidia-gb200-nvl72/']]},
  {fact: ['Green when on, amber while a link comes up, blue to locate', '绿灯表示运行，琥珀色表示链路正在建立，蓝灯用来定位'], src: [['Lenovo GB300 NVL72 tray LED table (the nearest published one; this hall is the GB200 generation)', 'https://pubs.lenovo.com/gb300-nvl72/compute_tray_led']]},
  {fact: ['Two dies, 208 billion transistors, 10 TB/s between them, eight HBM stacks', '两颗裸片，2080 亿个晶体管，裸片之间 10 TB/s，8 颗 HBM'], src: [['NVIDIA, Hot Chips 2024', 'https://www.hc2024.hotchips.org/assets/program/conference/day1/64_HC2024.NVIDIA.TirumalaWong.pdf']]},
  {fact: ['The maker hasn’t published a floor plan of the die, so the layout is illustrative; a third-party floor plan analysis exists', '厂商没有公开裸片版图，所以版图是示意；有第三方做过版图分析'], src: [['TechInsights, B200 floorplan analysis', 'https://www.techinsights.com/blog/nvidia-blackwell-b200-processor-floorplan-analysis']]},
];

export default function MakingOf({lang, onJump, onNavigate, stats}) {
  const en = lang === 'en';
  // (while this section is on screen the page's Back button steps aside, so it never covers a figure)
  const making = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => document.body.classList.toggle('dh-making-on', e.isIntersecting), {rootMargin: '-120px 0px 0px 0px'});
    io.observe(making.current);
    return () => {io.disconnect(); document.body.classList.remove('dh-making-on');};
  }, []);
  return <section ref={making} className="dh-making" data-nav-tone="light" aria-labelledby="dh-making-title">
    <header className="dh-m-head">
      <span>{L(lang, 'DATA HALL', '数据中心')}</span>
      <h2 id="dh-making-title">{L(lang, 'How it was built', '怎么做出来的')}</h2>
      <p>{L(lang, 'The geometry and textures are generated in the browser when the page loads; the scroll drives the construction and the camera. These are the parts that took the most work, with numbers measured from this page.', '几何体和贴图在页面加载时由浏览器生成，滚动驱动施工过程和镜头。下面是最费功夫的几处，数字都是从这个页面实测的。')}</p>
    </header>
    <DataFile lang={lang}/>
    <Schedule lang={lang} onJump={onJump}/>
    <Reality lang={lang}/>
    <Camera lang={lang}/>
    <Block n="05" title={L(lang, 'Where the numbers come from', '数字从哪来')} body={L(lang, 'Every caption was checked against published specifications and a reference design. The sources are listed first, then the dimensions I chose where nothing is published.', '每一句字幕都对照过公开的规格和参考设计。下面先列资料来源，再列没有公开资料、由我自己定的尺寸。')}>
      <ol className="dh-m-sources">{SOURCES.map((s, i) => <li key={i}><p>{s.fact[en ? 0 : 1]}</p><span>{s.src.length ? s.src.map(([label, url], k) => <a key={k} href={url} target="_blank" rel="noopener noreferrer">{label} ↗</a>) : '—'}</span></li>)}</ol>
      <h3 className="dh-m-sub">{L(lang, 'Modelling choices', '建模时自己定的')}</h3>
      <ul className="dh-m-choices">{CHOICES.map((c, i) => <li key={i}>{c[en ? 0 : 1]}</li>)}</ul>
    </Block>
    <Reviews lang={lang}/>
    <Cost lang={lang} stats={stats}/>
    <footer className="dh-m-foot"><a href="/other-project" onClick={e => {if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !onNavigate) return; e.preventDefault(); onNavigate('/other-project');}}>← Other Project</a><span>JAY LIN · 2026</span></footer>
  </section>;
}

function Block({n, title, body, children, wide = false}) {
  return <article className={'dh-m-block' + (wide ? ' is-wide' : '')}>
    <div className="dh-m-text"><span>{n}</span><h3>{title}</h3>{[].concat(body).map((b, i) => <p key={i}>{b}</p>)}</div>
    <div className="dh-m-figure">{children}</div>
  </article>;
}

function DataFile({lang}) {
  const rows = [
    ['RACK', `${RACK.w.toFixed(2)} × ${RACK.d.toFixed(2)} × ${RACK.h} m`, '48U'],
    ['COLD_AISLE', `${COLD_AISLE.toFixed(2)} m`, ''],
    ['HOT_AISLE', `${HOT_AISLE.toFixed(2)} m`, L(lang, 'ducted', '封闭')],
    ['PODS', String(PODS), L(lang, 'two rows each', '每组两排')],
    ['PER_ROW', String(PER_ROW), L(lang, `${PER_ROW - 2 * NET_EACH_END} GPU + ${NET_EACH_END} + ${NET_EACH_END} network`, `${PER_ROW - 2 * NET_EACH_END} 台 GPU + 两头各 ${NET_EACH_END} 台网络`)],
    ['HALL', `${ROOMS.hall.x1 - ROOMS.hall.x0} × ${ROOMS.hall.z1 - ROOMS.hall.z0} m`, L(lang, 'clear span', '无柱')],
  ];
  return <Block n="01" title={L(lang, 'One data file', '一份数据')} body={L(lang, 'The drawing and the 3D model share the same dimensions, from one data file. Change an aisle width and the drawing, the racks, the pipes and the camera’s clearance check all move with it.', '图纸和 3D 模型用的是同一组尺寸，来自同一个数据文件。改一个通道宽度，图纸、机柜、管道，连镜头的避让检查都会跟着变。')}>
    <pre className="dh-m-code">{rows.map(([k, v, c]) => <span key={k}><b>{k.padEnd(11)}</b>= {v}{c && <i>  // {c}</i>}{'\n'}</span>)}</pre>
    <dl className="dh-m-counts">
      <div><dt>{RACKS.length}</dt><dd>{L(lang, 'racks', '台机柜')}</dd></div>
      <div><dt>{fmt(FACTS.gpus)}</dt><dd>{L(lang, 'GPUs', '块 GPU')}</dd></div>
      <div><dt>{FACTS.itMw.toFixed(1)}</dt><dd>{L(lang, 'MW of IT load, by design', '兆瓦 IT 负载（设计值）')}</dd></div>
    </dl>
  </Block>;
}

function Schedule({lang, onJump}) {
  const max = T.connect[1], W = 560, rowH = 22, H = SCHEDULE.length * rowH + 30, x = v => 128 + v / max * (W - 140);
  return <Block n="02" title={L(lang, 'The build schedule', '施工进度表')} body={L(lang, 'Each piece has a start and a length on the scroll. A shader grows it up from its base, or along its run for pipes and trays, so scrolling back takes it down again. Overhead services are installed before the racks, as on a real site. Click a bar to go to that moment.', '每个构件在滚动上都有开始时间和长度。着色器让它从底部往上长，管道和桥架则顺着走向延伸，所以往回滚它会再拆掉。和真实工地一样，顶上的管线先装，机柜后进场。点一条横条，跳到那一刻。')}>
    <svg className="dh-m-gantt" viewBox={`0 0 ${W} ${H}`} role="list" aria-label={L(lang, 'Build schedule', '施工进度表')}>
      {[0, 0.1, 0.2, 0.3].map(v => <g key={v}><line x1={x(v)} x2={x(v)} y1={0} y2={H - 22}/><text x={x(v)} y={H - 6}>{Math.round(v * 100)}%</text></g>)}
      {SCHEDULE.map(([k, en, zh], i) => {
        const [a, b] = T[k], y = i * rowH + 4;
        return <g key={k} role="listitem" className="dh-m-bar" tabIndex={0} onClick={() => onJump((a + b) / 2)} onKeyDown={e => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault(); onJump((a + b) / 2);}}} aria-label={`${lang === 'en' ? en : zh}: ${Math.round(a * 100)}–${Math.round(b * 100)}%`}>
          <text x={0} y={y + 13}>{lang === 'en' ? en : zh}</text>
          <rect x={x(a)} y={y + 3} width={Math.max(3, x(b) - x(a))} height={rowH - 9} rx={2}/>
        </g>;
      })}
    </svg>
  </Block>;
}

function Reality({lang}) {
  // the aisle from above: the walk aisle and the two rows that face it, with the same formula the shader uses
  const [walked, setWalked] = useState(2);
  const near = ROWS.map((r, i) => ({...r, i})).filter(r => Math.abs((r.z0 + r.z1) / 2 - WALK_Z) < 2);
  const R = 2.4 + walked * 0.62, Wd = 0.3, camX = ROW_X0 - 1.6 + walked;
  const sx = 46, x = v => (v - (ROW_X0 - 2.2)) * sx, z = v => (v - (WALK_Z - 2.6)) * sx, Wpx = (ROW_X1 - ROW_X0 + 3.4) * sx;
  // how far up its face a rack has turned real (0–1): the shader's wipeT, from the rack's centre
  const real = (px, pz) => {const d = Math.hypot(px - camX, pz - WALK_Z), t = Math.min(1, Math.max(0, (d - R) / Wd)); return 1 - t * t * (3 - 2 * t);};
  return <Block n="03" title={L(lang, 'What turns real, and when', '什么时候变真实')} body={[L(lang, 'A circle round the camera decides what is real. When it reaches a rack’s centre, the rack’s real material wipes upward from the floor, behind a thin ink line; the cables and fittings on it follow the same wipe. Floors, walls and services blend by each point’s own distance. The circle grows as you walk, so what you have passed stays real, and at power-on it opens to the whole hall.', '镜头周围的一个圆决定什么是实物。圆到达一台机柜的中心时，实物从地面沿着机柜往上擦出，前沿是一条细墨线；机柜上的线缆和配件跟着一起变。地面、墙和管线按每一点自己的距离过渡。圆随着往前走变大，走过的地方保持真实；通电时它扩到整个机房。'), L(lang, 'Drag the slider to walk the aisle.', '拖动滑块，沿通道走。')]}>
    <svg className="dh-m-aisle" viewBox={`0 0 ${Wpx} ${5.2 * sx}`} aria-hidden="true">
      {RACKS.filter(r => near.some(n => n.i === r.row)).map((r, k) => {
        const m = real(r.x, r.z), h = RACK.d * sx * m, front = r.z + r.face * RACK.d / 2;
        return <g key={k}><rect className="dh-m-plaster" x={x(r.x - RACK.w / 2) + 1} y={z(r.z - RACK.d / 2)} width={RACK.w * sx - 2} height={RACK.d * sx}/>
          {m > 0 && <rect x={x(r.x - RACK.w / 2) + 1} y={r.face > 0 ? z(front) - h : z(front)} width={RACK.w * sx - 2} height={h} style={{fill: '#16171a'}}/>}</g>;
      })}
      <circle className="dh-m-soft" cx={x(camX)} cy={z(WALK_Z)} r={(R + Wd) * sx}/>
      <circle className="dh-m-ring" cx={x(camX)} cy={z(WALK_Z)} r={R * sx}/>
      <circle className="dh-m-cam" cx={x(camX)} cy={z(WALK_Z)} r={6}/>
      <text x={x(ROW_X1)} y={z(WALK_AISLE.z0) + COLD_AISLE * sx / 2 + 4} textAnchor="end">COLD AISLE</text>
    </svg>
    <label className="dh-m-slider"><span>{L(lang, 'Walked', '步行')} {walked.toFixed(1)} m · R {R.toFixed(2)} m</span>
      <small>{L(lang, 'R = 2.4 m + 0.62 × the distance walked. On a phone, whose narrow frame doesn’t show the racks beside you, the circle sits 2.6 m ahead.', 'R = 2.4 米 + 0.62 × 步行距离。手机画面窄，看不到身边的机柜，所以手机上这个圆放在前方 2.6 米处。')}</small>
      <input type="range" min={0} max={6} step={0.1} value={walked} onChange={e => setWalked(+e.target.value)}/></label>
    <pre className="dh-m-code is-small">{'// a rack and what is fixed to it: how far the circle’s edge has passed its centre\nfloat t = 1. - smoothstep(uRealR, uRealR + uRealW, length(vAnchor - uRealC.xz));\n// real below that height, up its 2.3 m face (e: half a pixel)\nfloat h = clamp(vWPos.y / 2.3, 0., 1.);\nreal = 1. - smoothstep(t - e, t + e, h);\n\n// floors, walls, services: from each point\nreal = 1. - smoothstep(uRealR, uRealR + uRealW, length(vWPos.xz - uRealC.xz));'}</pre>
  </Block>;
}

function Camera({lang}) {
  // (speed per unit of scroll against the scroll: what the wheel feels; chapters placed where they fall in the scroll)
  const W = 560, H = 190, curve = PROBE.curveScroll || PROBE.curve, vmax = Math.max(...curve.map(c => c[1])) * 1.05, at = PROBE.curveScroll ? pToScroll : p => p;
  const path = useMemo(() => curve.map(([p, v], i) => `${i ? 'L' : 'M'}${(p * W).toFixed(1)},${(H - v / vmax * H).toFixed(1)}`).join(''), [curve, vmax]);
  const bands = [['plan', 0, T.slab[0]], ['build', T.slab[0], T.connect[1]], ['descend', ...T.descend], ['walk', ...T.walk], ['power', ...T.power], ['turn', ...T.turn], ['tray', T.slide[0], T.explode[1]], ['dive', ...T.dive], ['back', T.dive[1], 1]];
  return <Block n="04" wide title={L(lang, 'Camera speed', '镜头速度')} body={[
    L(lang, `The camera is a rig: a target, a distance, a yaw, a pitch and a lens. The distance, from 106 m over the 42 m sheet down to ${Math.round(106 * DETAIL.sheet / 42 * 100)} cm over a ${Math.round(DETAIL.sheet * 100)} cm one, is interpolated in log space. Each is a monotone curve through its keys, so it never overshoots a key. Then the path stays fixed and its timing is adjusted, to smooth the changes in speed. Where the camera moves faster than the film's typical pace, each step takes more scroll, in proportion to the camera's measured speed (up to 1.5×), so under the wheel the pace stays nearly even from the descent to the die. The chart shows it by scroll.`, `镜头由五个量控制：一个目标点、一个距离、水平角、俯仰角和焦距。距离从 42 米图纸上方的 106 米，一直到 ${Math.round(DETAIL.sheet * 100)} 厘米芯片图纸上方 ${Math.round(106 * DETAIL.sheet / 42 * 100)} 厘米，按对数插值。每一项都是穿过关键帧的单调曲线，所以不会冲过头。然后路径不变，只调整时间，让速度的变化平滑。镜头比全片一般速度快的地方，每一段要滚得更多，多出的比例按测出来的镜头速度定（最多 1.5 倍），所以从下降到裸片，滚轮下的速度几乎一样。图表按滚动来画。`),
    L(lang, 'Where a curve turns back, its slope is zero. In one version the yaw, the distance and the target all turned back at the power-on key, and the camera stopped dead before the turn. Letting each of them keep one direction from the walk through the turn removed the stop. The chart is this page’s camera, measured by a script that runs the same code.', '曲线掉头的地方，速度为零。有一版里，水平角、距离和目标点在通电那一帧同时掉头，镜头在转身之前停死了。改成从走路到转身，每一项都只朝一个方向变，停顿就没了。下面这张图是这个页面的镜头，用跑同一份代码的脚本量出来的。'),
  ]}>
    <svg className="dh-m-chart" viewBox={`0 0 ${W} ${H + 34}`} aria-label={L(lang, 'Visual speed of the camera across the film', '镜头在整段里的画面速度')}>
      {bands.map(([k, a, b], i) => <g key={k} className={i % 2 ? 'is-odd' : ''}><rect x={at(a) * W} y={0} width={(at(b) - at(a)) * W} height={H}/><text x={(at(a) + at(b)) / 2 * W} y={H + (i % 2 ? 28 : 14)}>{CHAPTER_NAMES[k][lang === 'en' ? 0 : 1]}</text></g>)}
      <line className="dh-m-cut" x1={at(T.swap[1]) * W} x2={at(T.swap[1]) * W} y1={0} y2={H}/>
      <path d={path}/>
    </svg>
    <p className="dh-m-note">{L(lang, 'Speed on screen per unit of scroll (travel over distance, turn, tilt and zoom), across the scroll; the dashed line is the cut.', '每单位滚动的画面速度（相对距离的位移、转向、俯仰和变焦），横轴是滚动；虚线是切换。')}</p>
    <table className="dh-m-table"><thead><tr><th>{L(lang, 'Chapter', '段落')}</th><th>{L(lang, 'Pace per scroll', '每段滚动的速度')}</th><th>{L(lang, 'Per unit of progress', '每单位进度的速度')}</th><th>{L(lang, 'Peak / own mean', '峰值 / 本段平均')}</th></tr></thead>
      <tbody>{PROBE.chapters.map(c => <tr key={c.name}><td>{CHAPTER_NAMES[c.name]?.[lang === 'en' ? 0 : 1] ?? c.name}</td><td>{(c.paceVsFilmPerScroll ?? c.paceVsFilm).toFixed(2)}×</td><td>{c.paceVsFilm.toFixed(2)}×</td><td>{c.peakOverMean.toFixed(2)}</td></tr>)}</tbody>
    </table>
    <p className="dh-m-note">{L(lang, `Nearest the camera comes to a rack or wall: ${PROBE.clearance.metres.toFixed(2)} m. The probe checks this clearance against the racks, walls, overhead services and plant from the descent to the tray.`, `镜头离机柜或墙最近 ${PROBE.clearance.metres.toFixed(2)} 米。从下降到托盘，探针都会检查镜头和机柜、墙、顶上管线、设备之间的距离。`)}</p>
  </Block>;
}

const LOAD = {task: Math.max(...PERF.runs.map(r => r.boot.longest || 0)), open: Math.max(...PERF.runs.map(r => r.boot.fonts + r.boot.camera + (r.boot.plan ?? r.boot.scene) + r.boot.first))};
// three findings from the reviews, each with what it measured before and after the change (reviews/log.md has them all)
const FINDINGS = [
  {what: ['The camera pushed into the slide, eased off and pushed again on phones', '手机上镜头滑出托盘时先推近、放慢、再推近'], before: ['4% windows 33 → 25 → 30', '每 4% 的速度 33 → 25 → 30'], after: ['largest change over 4%: 1.20×', '4% 内最大变化 1.20 倍'], unit: ['camera probe', '镜头测量']},
  // (the after is the current scripted runs, perf.json: the longest task and the slowest opening across all six set-ups)
  {what: ['The page froze while the scene loaded', '场景加载时页面卡住'], before: ['longest task 568 ms, phone size with the CPU slowed 4× (round 9)', '最长阻塞 568 毫秒，手机尺寸、CPU 降速 4 倍（第 9 轮）'], after: [`longest task ${LOAD.task} ms; the opening draws within ${LOAD.open} ms (${PERF.measured})`, `最长阻塞 ${LOAD.task} 毫秒；开场在 ${LOAD.open} 毫秒内画出（${PERF.measured}）`], unit: ['scripted runs', '脚本实测']},
  {what: ['At the cut, labels were sliced into half-words', '切换时标注被切成半个字'], before: ['each pixel switched where the wipe was', '每个像素在硬切线经过时切换'], after: ['each label switches whole, at its own anchor', '每个标注按自己的锚点整体切换'], unit: ['frames p0.958', '画面 p0.958']},
];
function Reviews({lang}) {
  return <Block n="06" title={L(lang, 'Reviews', '评审')} body={L(lang, 'Every version was checked by two reviewers who did not write the code, GPT (through Codex) and a separate Claude agent, against the same brief: the frames, the camera log and the code. Three of their findings:', '每一版都由两个没写代码的评审，通过 Codex 调用的 GPT 和另一个独立的 Claude，按同一份要求检查画面、镜头数据和代码。其中三条：')}>
    <ol className="dh-m-findings">{FINDINGS.map((f, i) => <li key={i}><p>{L(lang, ...f.what)}</p><dl><div><dt>{L(lang, 'Before', '之前')}</dt><dd>{L(lang, ...f.before)}</dd></div><div><dt>{L(lang, 'After', '之后')}</dt><dd>{L(lang, ...f.after)}</dd></div></dl><span>{L(lang, ...f.unit)}</span></li>)}</ol>
  </Block>;
}

function Cost({lang, stats}) {
  const [s, setS] = useState(null), root = useRef(null);
  useEffect(() => {
    let on = false;
    const io = new IntersectionObserver(([e]) => {on = e.isIntersecting;});
    io.observe(root.current);
    const t = setInterval(() => {if (on) setS(stats.current && {...stats.current});}, 600);
    return () => {clearInterval(t); io.disconnect();};
  }, [stats]);
  const ms = v => (v ? v.toFixed(1) + ' ms' : '—');
  return <div ref={root}><Block n="07" title={L(lang, 'Frame cost', '一帧的开销')} body={[L(lang, `Repeated parts, such as the ${RACKS.length} racks and the ${fmt(LIGHTS)} status lights, are drawn in instanced batches, and the pulled tray is merged by material, so the busiest frame’s main pass is under a hundred draw calls (the shadow maps, drawn only while they change, come on top). The textures are painted in code at load and their relief is baked on the GPU. If moving frames miss the 60 fps budget and the GPU is the slow part, the page lowers its pixel ratio.`, `重复的构件，像 ${RACKS.length} 台机柜、${fmt(LIGHTS)} 个状态灯，都按实例批量绘制，抽出来的那个托盘按材质合并，所以最忙的一帧主画面也不到一百次绘制调用（阴影贴图只在变化时才画，另算）。贴图在加载时用代码画出来，凹凸用 GPU 算。画面移动时如果达不到 60 帧，而且慢在 GPU，页面会降低像素比。`), L(lang, 'These numbers are measured in your browser while you scroll the film: the heaviest frame it drew, the time between frames while the picture moves (not clamped; on a fast machine this is the screen’s refresh), and the CPU time spent preparing each frame.', '下面的数字是你滚动上面那段画面时，在你的浏览器里量的：画过的最重的一帧；画面移动时帧与帧之间的实际间隔（没有截断，在快的机器上就是屏幕的刷新间隔）；以及准备每一帧花的 CPU 时间。')]}>
    <dl className="dh-m-counts is-live">
      <div><dt>{s ? s.calls : '—'}</dt><dd>{L(lang, 'draw calls in the main pass, heaviest frame', '次绘制（主画面，最重的一帧）')}</dd></div>
      <div><dt>{s ? fmt(s.triangles) : '—'}</dt><dd>{L(lang, 'triangles in the main pass, heaviest frame', '个三角形（主画面，最重的一帧）')}</dd></div>
      <div><dt>{s ? ms(s.median) : '—'}</dt><dd>{L(lang, 'time between moving frames, median (95th: ', '画面移动时的帧间隔，中位数（第 95 百分位：') + (s ? ms(s.p95) : '—') + L(lang, ')', '）')}</dd></div>
      <div><dt>{s ? ms(s.cpu) : '—'}</dt><dd>{L(lang, 'CPU time to prepare a frame, median', '准备一帧的 CPU 时间，中位数')}</dd></div>
    </dl>
    <p className="dh-m-note">{s ? L(lang, `${fmt(s.frames)} frames on ${s.gpu || 'this device'}, at ${s.dpr} device pixel${s.dpr === 1 ? '' : 's'} per CSS pixel; ${s.stalls} over 50 ms; the opening drew after ${Math.round(s.boot.fonts + s.boot.camera + (s.boot.plan || s.boot.scene) + s.boot.first)} ms, the whole film was ready after ${Math.round(s.boot.fonts + s.boot.camera + s.boot.scene)} ms.`, `共 ${fmt(s.frames)} 帧，设备：${s.gpu || '本机'}，像素比 ${s.dpr}；超过 50 毫秒的 ${s.stalls} 帧；开场在 ${Math.round(s.boot.fonts + s.boot.camera + (s.boot.plan || s.boot.scene) + s.boot.first)} 毫秒后画出，全片在 ${Math.round(s.boot.fonts + s.boot.camera + s.boot.scene)} 毫秒后就绪。`) : L(lang, 'Scroll through the film above to measure.', '先滚动看完上面的画面，这里才有数字。')}</p>
    <h3 className="dh-m-sub">{L(lang, 'Scripted runs', '脚本实测')}</h3>
    <p className="dh-m-note">{L(lang, `A script loads the page cold, waits until the film is built, then scrolls through it in ${PERF.seconds} s at an even rate. One machine (${PERF.runs[0].gpu}), six set-ups: a 1600 × 900 window at 2 device pixels per CSS pixel and a 390 × 844 phone size at 3, each as it is and with the CPU slowed 4×, and the window again with the cheaper set-up that phones, integrated GPUs and unnamed GPUs get.`, `脚本冷启动页面，等全片搭好，再用 ${PERF.seconds} 秒匀速滚完。同一台机器（${PERF.runs[0].gpu}），六种设置：1600 × 900、像素比 2 的窗口，和 390 × 844、像素比 3 的手机尺寸，各自原速和 CPU 降速 4 倍；再加上窗口用手机、集成显卡和不报名称的显卡所用的较省设置。`)}{PERF.gpuLoad > 10 ? L(lang, ` Other programs were using ${PERF.gpuLoad}% of the GPU just before these runs; their load during the runs wasn’t recorded.`, ` 测试开始前，其他程序占用了 ${PERF.gpuLoad}% 的 GPU；测试过程中的占用没有记录。`) : ''}</p>
    <details className="dh-m-more"><summary>{L(lang, 'What the numbers count', '这些数字怎么算')}</summary>
      <p className="dh-m-note">{L(lang, 'Frame times count moving frames once the film is built. Opening: until the paper and the plan draw. Film ready: until everything is built (in steps that hand the main thread back to the page). Longest task: the longest the main thread was blocked while it all loaded. GPU / frame: the GPU’s own time, from timer queries. The page caps itself at a pixel ratio of 1.5 (1.25 on phones and the cheaper set-up), lowers it only when the GPU is near the budget, and if frames still miss at the lowest ratio, steps between held frames instead of moving.', '帧时间只算全片搭好之后的移动画面。开场：到纸面和平面图画出来为止。全片就绪：到全部搭好为止（分步搭建，每一步之间把主线程还给页面）。最长阻塞：整个加载过程中主线程被占住最长的一次。GPU 每帧：用计时查询量的 GPU 自己的时间。页面自己把像素比限制在 1.5（手机和较省设置是 1.25），只有 GPU 接近预算时才降低；如果降到最低还是跟不上，就改成在几个定格画面之间切换，不再移动。')}</p>
    </details>
    <p className="dh-m-note">{L(lang, 'Not yet measured on an integrated GPU or a physical phone.', '还没有在集成显卡或真实手机上量过。')}</p>
    <div className="dh-m-scroll" role="region" tabIndex={0} aria-label={L(lang, 'Scripted runs, scrolls sideways', '脚本实测，可左右滑动')}>
    <table className="dh-m-table dh-m-wide">
      <thead><tr><th>{L(lang, 'SET-UP', '条件')}</th><th>{L(lang, 'MEDIAN', '中位数')}</th><th>P95</th><th>{L(lang, 'OVER 17.5 MS', '超过 17.5 毫秒')}</th><th>{L(lang, 'STALLS', '卡顿')}</th><th>{L(lang, 'GPU / FRAME', 'GPU 每帧')}</th><th>{L(lang, 'OPENING', '开场')}</th><th>{L(lang, 'FILM READY', '全片就绪')}</th><th>{L(lang, 'LONGEST TASK', '最长阻塞')}</th><th>{L(lang, 'PIXEL RATIO', '像素比')}</th></tr></thead>
      <tbody>{PERF.runs.map(r => <tr key={r.name}><td>{L(lang, r.name, r.name.replace('window at 2×', '窗口，像素比 2').replace('phone size', '手机尺寸').replace(', modest set-up', '，较省的设置').replace(', CPU ÷4', '，CPU 降速 4 倍'))}</td><td>{r.median} ms</td><td>{r.p95} ms</td><td>{r.over}%</td><td>{r.stalls}</td><td>{r.gpuFrame ? r.gpuFrame.median + ' ms' : '—'}</td><td>{r.boot.fonts + r.boot.camera + (r.boot.plan ?? r.boot.scene) + r.boot.first} ms</td><td>{r.boot.fonts + r.boot.camera + r.boot.scene} ms</td><td>{r.boot.longest ?? '—'} ms</td><td>{r.endDpr}</td></tr>)}</tbody>
    </table>
    </div>
  </Block></div>;
}
