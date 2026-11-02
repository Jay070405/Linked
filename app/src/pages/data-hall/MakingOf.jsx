import {useEffect, useMemo, useRef, useState} from 'react';
import PROBE from './probe.json';
import {pToScroll, SCROLL_LENGTH} from './camera';
import REVIEWS from './reviews.json';
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
  ['slab', 'Slab', '底板'], ['columns', 'Columns', '柱'], ['walls', 'Walls', '墙'], ['rooms', 'Power rooms', '配电间'],
  ['frames', 'Hot-aisle frames', '热通道框架'], ['busway', 'Busway', '母线槽'], ['trays', 'Fibre trays', '光纤桥架'], ['pipes', 'Coolant pipes', '冷却液管'],
  ['plant', 'CDUs, fan walls', 'CDU、风墙'], ['lights', 'Lights', '照明'], ['racks', 'Racks', '机柜'], ['connect', 'Connections', '接线'],
];
const CHAPTER_NAMES = {plan: ['Plan', '平面图'], build: ['Build', '施工'], descend: ['Descent', '下降'], walk: ['Walk', '步行'], power: ['Power on', '通电'], turn: ['Turn', '转身'], tray: ['Tray', '托盘'], dive: ['Dive', '下潜'], back: ['Die plan', '裸片平面图']};
// what the model sets where nothing is published (research.md marks each as an estimate or a reading)
const CHOICES = [
  ['The cold aisle is 1.8 m wide, so a 0.77 m tray can be pulled out with a person standing beside it. One design guide strongly recommends cold aisles at least 1.22 m wide.', '冷通道宽 1.8 米，抽出 0.77 米长的托盘时，旁边还能站一个人。有一份设计指南强烈建议冷通道至少 1.22 米宽。'],
  ['Columns are only in the outer walls, 5.5 m apart, so the hall is a 22 m clear span.', '柱子只在外墙里，间距 5.5 米，机房内部是 22 米跨度的无柱空间。'],
  ['Network racks at both ends of each row: this is my reading of the reference design’s drawing.', '每排两头放网络机柜：这是我对参考设计图纸的理解。'],
  ['The mounting heights of the busway, fibre trays, coolant pipes and lights. No source gives them.', '母线槽、光纤桥架、冷却液管和灯的安装高度。没有资料给出这些高度。'],
  ['Which rack unit each tray sits in. The order of the trays is published; their exact positions are not.', '每个托盘在机柜里占哪个 U 位。托盘的上下顺序是公开的，具体位置没有公开。'],
  ['Where the parts sit inside the tray. The parts are the ones the maker shows; their positions are approximate.', '托盘里零件的位置。零件种类按厂商公开的资料，摆放位置是近似的。'],
  ['The UPS, batteries and switchgear are in a separate power building, which isn’t drawn. The rooms on the north side hold the boards and PDUs that feed the busways.', 'UPS、电池和开关设备在另一栋电力楼里，图上没有画。北侧几间房里是给母线槽供电的配电柜和 PDU。'],
  ['The layout of the die. The maker hasn’t published a floor plan, so the drawing is illustrative.', '裸片的布局。厂商没有公开版图，所以这张图是示意。'],
];

const ART = '/assets/other-project/data-hall/making/';
const ROUNDS = REVIEWS.rounds;
// the film's chapters as a visitor meets them: a still from the film (datahall-capture.mjs, CLEAN=1) and the moment
// to jump to
const CHAPTERS = [
  [0.02, ['Plan', '平面图'], ['The hall’s floor plan: 96 racks in three pods, cut 1.2 m above the floor.', '机房平面图：三组共 96 台机柜，剖切高度离地 1.2 米。']],
  [0.2, ['Build', '施工'], ['Slab, walls and rooms, then the frames and the services over every row.', '先是底板、墙和房间，再是每排上方的框架和管线。']],
  [0.3, ['Racks', '机柜进场'], ['The racks arrive last, built and tested at the factory.', '机柜最后进场，已在工厂装好、测好。']],
  [0.42, ['Descent', '下降'], ['The camera comes down to eye height at the end of a cold aisle.', '镜头降到一条冷通道的入口，停在人眼高度。']],
  [0.52, ['Walk', '步行'], ['Racks within a few metres of the camera turn real; the rest stay drawn.', '镜头几米之内的机柜变成实物，其余的仍是线稿。']],
  [0.59, ['Power on', '通电'], ['Status lights turn green down the rows. The hall is designed for 7.4 MW.', '状态灯沿着各排依次变绿。机房按 7.4 兆瓦设计。']],
  [0.72, ['Tray', '托盘'], ['A blue locate light marks one tray. The tray slides out and comes apart.', '蓝色定位灯标出一个托盘。托盘滑出来，再拆开。']],
  [0.82, ['GPU', 'GPU'], ['Under the cold plate are two dies and eight memory stacks.', '冷板下面是两颗裸片和 8 颗显存。']],
  [0.9, ['Die plan', '裸片平面图'], ['The die’s floor plan, then the cut back to the hall’s plan.', '裸片的平面图，然后切回机房的平面图。']],
];
// the pulled tray's parts, numbered where they are on its still (tray.webp: the 1600 × 900 frame at p0.72);
// research.md §3
const PARTS = [
  [650, 335, ['Two compute boards, each with one CPU and two GPUs under cold plates', '两块计算板，每块有 1 颗 CPU 和 2 块 GPU，上面压着冷板']],
  [880, 405, ['Coolant: one loop per board, coupled at the back as the tray slides in', '冷却液：每块板一路，托盘推进去时在后部接上']],
  [790, 500, ['Eight 40 mm fans, which cool the network cards, drives and DPUs', '8 个 40 毫米风扇，给网卡、硬盘和 DPU 散热']],
  [995, 612, ['Four cluster network cards and two DPUs', '4 张集群网卡和 2 个 DPU']],
  [1010, 728, ['The cards’ ports, at the front, facing the cold aisle', '网卡和 DPU 的接口，在前面板，朝向冷通道']],
  [680, 655, ['Drive cage: eight E1.S bays, loaded from the front', '硬盘笼：8 个 E1.S 硬盘位，从前面插拔']],
];

const SOURCES = [
  {fact: ['72 GPUs and 36 CPUs per rack; between the power shelves, from top to bottom, 10 compute trays, 9 switch trays and 8 compute trays', '每台机柜 72 块 GPU、36 颗 CPU；在上下两组电源架之间，从上到下依次是 10 个计算托盘、9 个交换托盘和 8 个计算托盘'], src: [['NVIDIA DGX GB200 User Guide', 'https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html'], ['NVIDIA, Hot Chips 2025', 'https://hc2025.hotchips.org/assets/program/tutorials/HC2025.T1DCRacks.S5.Norton.pdf']]},
  {fact: ['132 kW per GPU rack and 22 kW per network rack, three pods of two rows, 7,392 kW in all', '每台 GPU 机柜 132 千瓦、网络机柜 22 千瓦，三组各两排，合计 7,392 千瓦'], src: [['Schneider Electric, Reference Design 109', 'https://www.se.com/ca/en/download/document/RD109DSR0_EN']]},
  {fact: ['In the reference design, coolant goes in at 40 °C and comes out at about 54 °C, and the supply air is about 28 °C', '参考设计里，冷却液 40 °C 进、约 54 °C 出，送风约 28 °C'], src: [['Schneider Electric, Reference Design 109', 'https://www.se.com/ca/en/download/document/RD109DSR0_EN']]},
  {fact: ['The services are installed and tested with load banks before the racks arrive', '管线先装好，并用负载箱测试过，机柜才进场'], src: [['Aggreko', 'https://www.aggreko.com/en-au/case-studies/data-centres/precision-testing-with-liquid-cooled-load-banks'], ['Global Data Center Hub', 'https://www.globaldatacenterhub.com/p/construction-sequencing-qaqc-and']]},
  {fact: ['A compute tray is about 766 × 438 × 44 mm', '一个计算托盘约 766 × 438 × 44 毫米'], src: [['Interplex (reported)', 'https://interplex.com/interplex-on-nvidia-mgx-ecosystem/1ru-chassis-for-nvidia-gb200-nvl72/']]},
  {fact: ['Tray status lights: green when on, amber while a link comes up, blue to locate', '托盘状态灯：绿色表示运行，琥珀色表示链路正在建立，蓝色用于定位'], src: [['Lenovo GB300 NVL72 tray LED table (the nearest published one; this hall is the GB200 generation)', 'https://pubs.lenovo.com/gb300-nvl72/compute_tray_led']]},
  {fact: ['Two dies, 208 billion transistors, 10 TB/s between the dies, eight HBM stacks', '两颗裸片，共 2080 亿个晶体管，裸片之间 10 TB/s，8 颗 HBM'], src: [['NVIDIA, Hot Chips 2024', 'https://www.hc2024.hotchips.org/assets/program/conference/day1/64_HC2024.NVIDIA.TirumalaWong.pdf']]},
  {fact: ['The maker hasn’t published a floor plan of the die, so the layout is illustrative. A third party has published a floor plan analysis', '厂商没有公开裸片版图，所以这里的版图是示意。有第三方发表过版图分析'], src: [['TechInsights, B200 floorplan analysis', 'https://www.techinsights.com/blog/nvidia-blackwell-b200-processor-floorplan-analysis']]},
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
      <span>DATA HALL · OTHER PROJECT · 2026</span>
      <h2 id="dh-making-title">{L(lang, 'How it was built', '制作过程')}</h2>
      <p>{L(lang, 'Data Hall is a 3D film that plays as you scroll. It starts on the floor plan of a 7.4 MW AI data hall and builds the hall in the order a contractor would. Then the camera walks down a cold aisle, one compute tray slides out, and the film ends on the floor plan of a GPU die. The hall follows a published reference design and the maker’s published specifications.', 'Data Hall 是一段随滚动播放的 3D 影片。它从一间 7.4 兆瓦 AI 机房的平面图开始，按施工顺序把机房盖起来。接着镜头走进一条冷通道，一个计算托盘被抽出来，最后停在一颗 GPU 裸片的平面图上。机房依据一份公开的参考设计和厂商公布的规格建模。')}</p>
      <p>{L(lang, 'Everything is drawn live in the browser, with no video and no downloaded model. The geometry and textures are generated in code when the page loads, and the scroll position drives both the construction and the camera. The figures below are read from the code the film runs on, or measured from it.', '画面全部在浏览器里实时绘制，没有视频，也没有下载的模型。几何体和贴图在页面加载时由代码生成，滚动位置同时驱动施工和镜头。下面的数字都取自影片运行的代码，或者从中实测得来。')}</p>
      <dl className="dh-m-meta">{[
        [L(lang, 'Scroll length', '滚动长度'), L(lang, `about ${Math.round(11 * SCROLL_LENGTH)} screens`, `约 ${Math.round(11 * SCROLL_LENGTH)} 屏`)],
        [L(lang, 'Chapters', '章节'), String(CHAPTERS.length)],
        [L(lang, 'Sheets', '图纸'), 'A-101 · C-301'],
        [L(lang, 'Built with', '工具'), 'three.js · React · Vite'],
        [L(lang, 'Downloaded assets', '下载的素材'), L(lang, 'None', '无')],
        [L(lang, 'Reviews', '评审'), L(lang, `${ROUNDS.length} rounds, two reviewers`, `${ROUNDS.length} 轮，两位评审`)],
      ].map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
    </header>
    <Idea lang={lang}/>
    <Chapters lang={lang} onJump={onJump}/>
    <DataFile lang={lang}/>
    <Schedule lang={lang} onJump={onJump}/>
    <Reality lang={lang}/>
    <Tray lang={lang}/>
    <Camera lang={lang}/>
    <Block n="08" title={L(lang, 'Sources and modelling choices', '资料来源和建模时的选择')} body={L(lang, 'The facts in the captions were checked against published specifications and a reference design. The sources are listed first, then the choices I made where nothing is published.', '字幕里的事实都对照过公开的规格和参考设计。下面先列资料来源，再列没有公开资料、由我自己决定的部分。')}>
      <ol className="dh-m-sources">{SOURCES.map((s, i) => <li key={i}><p>{s.fact[en ? 0 : 1]}</p><span>{s.src.length ? s.src.map(([label, url], k) => <a key={k} href={url} target="_blank" rel="noopener noreferrer">{label}<span aria-hidden="true"> ↗</span><span className="dh-sr">{L(lang, ' (opens in a new tab)', '（在新标签页打开）')}</span></a>) : '—'}</span></li>)}</ol>
      <h4 className="dh-m-sub">{L(lang, 'Modelling choices', '建模时的选择')}</h4>
      <ul className="dh-m-choices">{CHOICES.map((c, i) => <li key={i}>{c[en ? 0 : 1]}</li>)}</ul>
    </Block>
    <Reviews lang={lang}/>
    <Cost lang={lang} stats={stats}/>
    <footer className="dh-m-foot"><a href="/other-project" onClick={e => {if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || !onNavigate) return; e.preventDefault(); onNavigate('/other-project');}}>← Other Project</a><span>JAY LIN · 2026</span></footer>
  </section>;
}

function Block({n, title, body, children, wide = false}) {
  return <section className={'dh-m-block' + (wide ? ' is-wide' : '')}>
    <div className="dh-m-text"><span>{n}</span><h3>{title}</h3>{[].concat(body).map((b, i) => <p key={i}>{b}</p>)}</div>
    <div className="dh-m-figure">{children}</div>
  </section>;
}

function Idea({lang}) {
  const sheets = [
    ['plan', ['A-101 · Data Hall 01, plan at +1.20 · 1:200', 'A-101 · 数据中心一号机房，+1.20 平面图 · 1:200'], ['Sheet A-101: the hall’s floor plan, with three pods of racks and the electrical and network rooms along the top', 'A-101 图纸：机房平面图，三组机柜，上方一排是配电间和网络间']],
    ['die', ['C-301 · GPU die 1, floor plan · illustrative', 'C-301 · GPU 1 号裸片，平面图 · 示意'], ['Sheet C-301: the die drawn on the hall’s plan, with L2 cache where the hot aisles were and memory interfaces along the top and bottom', 'C-301 图纸：画在机房平面上的裸片，原来热通道的位置是二级缓存，上下两边是内存接口']],
  ];
  return <Block n="01" title={L(lang, 'The idea: two floor plans', '构思：两张平面图')} body={[
    L(lang, 'A data hall is built from drawings, so the film starts on one: a floor plan with a structural grid, line weights and a title block. The hall goes up in the order a builder would put it up, and the camera keeps moving in until it reaches a single GPU die.', '机房是照着图纸盖的，所以片子从一张图纸开始：一张有轴网、线宽和图签的平面图。机房按施工顺序盖起来，镜头一路往里推，直到一颗 GPU 裸片。'),
    L(lang, 'The film ends on the die’s floor plan, sheet C-301. So that the two drawings line up at the last cut, the building has the die’s proportions: it is 22 × 27.5 m, and the die is drawn 25.5 × 31.5 mm, about 800 mm². The die’s blocks also sit on the hall’s lines: compute where the racks are, L2 cache where the hot aisles are, memory interfaces in the rooms along the north side. At the cut, only the labels change.', '片子最后停在裸片的平面图上，也就是 C-301 图纸。为了让最后一次切换时两张图对得上，整栋建筑按裸片的比例来定：建筑 22 × 27.5 米，裸片画成 25.5 × 31.5 毫米，约 800 平方毫米。裸片上的区块也落在机房的线上：计算单元在机柜的位置，二级缓存在热通道的位置，内存接口在北侧那排房间里。切换时只换标注。'),
  ]}>
    <div className="dh-m-sheets">{sheets.map(([k, cap, alt]) => <figure key={k}><img src={`${ART}${k}.webp`} width={1200} height={675} loading="lazy" decoding="async" alt={L(lang, ...alt)}/><figcaption>{L(lang, ...cap)}</figcaption></figure>)}</div>
  </Block>;
}

function Chapters({lang, onJump}) {
  return <Block n="02" wide title={L(lang, 'The nine chapters', '九个章节')} body={L(lang, 'The film is one continuous camera move, with a single cut at the end. Select a chapter to jump to it in the film.', '整段影片是一个连续的镜头，只在结尾切一次。点击章节，可以跳到片中对应的位置。')}>
    <ol className="dh-m-chapters">{CHAPTERS.map(([p, name, line], i) => <li key={i}><button type="button" onClick={() => onJump(p)}>
      <img src={`${ART}chapter-${i + 1}.webp`} width={640} height={360} loading="lazy" decoding="async" alt=""/>
      <span className="dh-m-ch-name">{String(i + 1).padStart(2, '0')} · {L(lang, ...name)}</span><span className="dh-m-ch-line">{L(lang, ...line)}</span>
    </button></li>)}</ol>
  </Block>;
}

function Tray({lang}) {
  return <Block n="06" wide title={L(lang, 'Inside the compute tray', '计算托盘内部')} body={L(lang, 'Each rack holds 18 of these 1U compute trays, each about 766 × 438 mm. The parts are the ones the maker documents. Their exact positions aren’t published, so the layout is approximate. No part carries a brand name or logo.', '每台机柜装 18 个这样的 1U 计算托盘，每个约 766 × 438 毫米。零件按厂商公开的资料来做；具体位置没有公开，所以摆放是近似的。零件上没有任何品牌名称或标志。')}>
    <figure className="dh-m-tray">
      <div><img src={`${ART}tray.webp`} width={1200} height={675} loading="lazy" decoding="async" alt={L(lang, 'The compute tray pulled out of its rack with the lid off. Its numbered parts are listed below the picture.', '从机柜里抽出、拿掉盖板的计算托盘。图上编号的零件列在图下方。')}/>
        {PARTS.map(([x, y], i) => <b key={i} style={{left: `${x / 16}%`, top: `${y / 9}%`}} aria-hidden="true">{i + 1}</b>)}</div>
      <ol>{PARTS.map(([, , t], i) => <li key={i}><b>{i + 1}</b>{L(lang, ...t)}</li>)}</ol>
    </figure>
  </Block>;
}

function Scores({lang}) {
  // both reviewers' scores out of 100, round by round (reviews.json); the dashed line is the 90 the project aims for
  const W = 560, H = 190, n = ROUNDS.length, lo = 55, hi = 95, x = r => 30 + (r - 1) / (n - 1) * (W - 44), y = v => H - 22 - (v - lo) / (hi - lo) * (H - 34);
  const line = k => ROUNDS.map((r, i) => `${i ? 'L' : 'M'}${x(r.round).toFixed(1)},${y(r[k]).toFixed(1)}`).join('');
  const last = ROUNDS[n - 1];
  return <figure className="dh-m-scores">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={L(lang, `Review scores by round, from ${ROUNDS[0].codex} and ${ROUNDS[0].claude} in round 1 to ${last.codex} and ${last.claude} in round ${n}`, `各轮评审分数，从第 1 轮的 ${ROUNDS[0].codex} 和 ${ROUNDS[0].claude}，到第 ${n} 轮的 ${last.codex} 和 ${last.claude}`)}>
      {[60, 70, 80, 90].map(v => <g key={v}><line x1={30} x2={W - 14} y1={y(v)} y2={y(v)} className={v === 90 ? 'is-goal' : ''}/><text x={24} y={y(v) + 3.5}>{v}</text></g>)}
      {[1, 5, 10, 15, n].map(r => <text key={r} className="is-x" x={x(r)} y={H - 6}>{r}</text>)}
      <path d={line('codex')}/><path className="is-claude" d={line('claude')}/>
    </svg>
    <figcaption>{L(lang, `Scores out of 100, by round. Solid line: GPT. Dashed line: Claude. The pink line marks 90, the target. Round ${n}: ${last.codex} and ${last.claude}.`, `各轮得分（满分 100）。实线是 GPT，虚线是 Claude，粉色线是目标分 90。第 ${n} 轮：${last.codex} 和 ${last.claude}。`)}</figcaption>
  </figure>;
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
  return <Block n="03" title={L(lang, 'One data file for the plan and the model', '平面图和模型共用一份数据')} body={L(lang, 'The floor plan and the 3D model are both generated from one data file, so they share every dimension. If an aisle width changes, the drawing, the racks, the pipes and the camera’s clearance check all change with it.', '平面图和 3D 模型都由同一个数据文件生成，所有尺寸都一致。改一个通道宽度，图纸、机柜、管道，连镜头的避让检查都会跟着变。')}>
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
  return <Block n="04" title={L(lang, 'The build schedule', '施工进度表')} body={L(lang, 'Each part of the building has a start point and a duration on the scroll. A shader grows it up from its base (pipes and trays grow along their length), so scrolling back takes it down again. As on a real site, the overhead services go in before the racks. Select a bar to jump to that point in the film.', '每个构件在滚动进度上都有自己的开始点和时长。着色器让它从底部长上来（管道和桥架沿走向延伸），往回滚动时它会再拆掉。和真实工地一样，顶上的管线先装，机柜后进场。点击横条，可以跳到片中那一刻。')}>
    <svg className="dh-m-gantt" viewBox={`0 0 ${W} ${H}`} role="list" aria-label={L(lang, 'Build schedule, as a share of the film’s scroll', '施工进度表，按影片滚动进度的百分比')}>
      {[0, 0.1, 0.2, 0.3].map(v => <g key={v} aria-hidden="true"><line x1={x(v)} x2={x(v)} y1={0} y2={H - 22}/><text x={x(v)} y={H - 6}>{Math.round(v * 100)}%</text></g>)}
      {SCHEDULE.map(([k, en, zh], i) => {
        const [a, b] = T[k], y = i * rowH + 4, go = () => onJump((a + b) / 2);
        return <g key={k} role="listitem"><g role="button" className="dh-m-bar" tabIndex={0} onClick={go} onKeyDown={e => {if (e.key === 'Enter' || e.key === ' ') {e.preventDefault(); go();}}} aria-label={L(lang, `${en}, ${Math.round(a * 100)}–${Math.round(b * 100)}% of the scroll`, `${zh}，滚动进度 ${Math.round(a * 100)}–${Math.round(b * 100)}%`)}>
          <rect className="dh-m-hit" x={-4} y={y} width={W + 8} height={rowH - 3} rx={4}/>
          <text x={0} y={y + 13}>{lang === 'en' ? en : zh}</text>
          <rect className="dh-m-span" x={x(a)} y={y + 3} width={Math.max(3, x(b) - x(a))} height={rowH - 9} rx={2}/>
        </g></g>;
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
  return <Block n="05" title={L(lang, 'How the drawn racks turn real', '线稿怎样变成实物')} body={[L(lang, 'A circle around the camera decides what is shown real. When the circle reaches a rack’s centre, the rack’s finished surface wipes up from the floor behind a thin ink line, and the cables and fittings on the rack wipe with it. Floors, walls and services change point by point, by each point’s distance from the centre of the circle. The circle grows as the camera walks, so the racks it has passed stay real, and at power-on it widens to the whole hall.', '镜头周围有一个圆，圆里的东西显示为实物。圆碰到一台机柜的中心时，机柜的实物表面从地面往上擦出，前沿是一条细墨线，机柜上的线缆和配件也跟着一起变。地面、墙和管线则逐点过渡，看每一点离圆心有多远。圆随着镜头往前走而变大，走过的机柜保持实物；通电时，圆扩大到整个机房。'), L(lang, 'Move the slider to walk down the aisle.', '拖动滑块，沿通道往前走。')]}>
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
    <label className="dh-m-slider"><span>{L(lang, 'Distance walked', '已走')} {walked.toFixed(1)} m · R {R.toFixed(2)} m</span>
      <small>{L(lang, 'R = 2.4 m + 0.62 × the distance walked. On a phone the frame is too narrow to show the racks beside the camera, so there the circle’s centre is 2.6 m ahead.', 'R = 2.4 米 + 0.62 × 已走距离。手机画面太窄，看不到镜头两侧的机柜，所以在手机上，圆心放在前方 2.6 米处。')}</small>
      <input type="range" min={0} max={6} step={0.1} value={walked} aria-valuetext={L(lang, `${walked.toFixed(1)} m walked, R ${R.toFixed(2)} m`, `已走 ${walked.toFixed(1)} 米，R ${R.toFixed(2)} 米`)} onChange={e => setWalked(+e.target.value)}/></label>
    <pre className="dh-m-code is-small">{'// a rack and what is fixed to it: how far the circle’s edge has passed its centre\nfloat t = 1. - smoothstep(uRealR, uRealR + uRealW, length(vAnchor - uRealC.xz));\n// real below that height, up its 2.3 m face (e: half a pixel)\nfloat h = clamp(vWPos.y / 2.3, 0., 1.);\nreal = 1. - smoothstep(t - e, t + e, h);\n\n// floors, walls, services: from each point\nreal = 1. - smoothstep(uRealR, uRealR + uRealW, length(vWPos.xz - uRealC.xz));'}</pre>
  </Block>;
}

function Camera({lang}) {
  // (speed per unit of scroll against the scroll: what the wheel feels; chapters placed where they fall in the scroll)
  const W = 560, H = 190, curve = PROBE.curveScroll || PROBE.curve, vmax = Math.max(...curve.map(c => c[1])) * 1.05, at = PROBE.curveScroll ? pToScroll : p => p;
  const path = useMemo(() => curve.map(([p, v], i) => `${i ? 'L' : 'M'}${(p * W).toFixed(1)},${(H - v / vmax * H).toFixed(1)}`).join(''), [curve, vmax]);
  const bands = [['plan', 0, T.slab[0]], ['build', T.slab[0], T.connect[1]], ['descend', ...T.descend], ['walk', ...T.walk], ['power', ...T.power], ['turn', ...T.turn], ['tray', T.slide[0], T.explode[1]], ['dive', ...T.dive], ['back', T.dive[1], 1]];
  return <Block n="07" wide title={L(lang, 'Camera speed', '镜头速度')} body={[
    L(lang, `The camera is set by five values: a target point, a distance, a yaw, a pitch and a focal length. The distance, from 106 m over the 42 m sheet down to ${Math.round(106 * DETAIL.sheet / 42 * 100)} cm over a ${Math.round(DETAIL.sheet * 100)} cm one, is interpolated on a log scale. Each value follows a monotone curve through its keyframes, so it never overshoots one. With the path fixed, the timing is then adjusted to smooth out changes in speed. Where the camera moves faster than the film’s typical pace, that stretch gets more scroll, in proportion to the measured speed and up to 1.5 times as much. From the descent to the die, the pace per scroll stays nearly even.`, `镜头由五个量控制：目标点、距离、水平角、俯仰角和焦距。距离从 42 米图纸上方 106 米，一路降到 ${Math.round(DETAIL.sheet * 100)} 厘米裸片图纸上方 ${Math.round(106 * DETAIL.sheet / 42 * 100)} 厘米，按对数插值。每个量都沿一条穿过关键帧的单调曲线变化，所以不会冲过关键帧。路径定下来以后，再调整时间，让速度变化平滑。镜头比全片一般速度快的地方，就多分一些滚动距离，多出的比例按实测速度来定，最多 1.5 倍。从下降到裸片，每单位滚动的画面速度几乎一样。`),
    L(lang, 'Where a curve changes direction, its slope is zero and the camera stops. In one version the yaw, the distance and the target all changed direction at the power-on keyframe, and the camera stopped dead before the turn. Keeping each of them moving in one direction from the walk through the turn removed the stop. The chart and the table come from a script that runs the same camera code and measures it.', '曲线掉头的地方斜率为零，镜头就会停住。有一版里，水平角、距离和目标点在通电那一帧同时掉头，镜头在转身之前完全停住。改成从步行到转身，每个量都只朝一个方向变化，停顿就消失了。下面的图表和表格，来自一个运行同一份镜头代码并测量速度的脚本。'),
  ]}>
    <svg className="dh-m-chart" viewBox={`0 0 ${W} ${H + 34}`} role="img" aria-label={L(lang, 'Chart: the camera’s speed on screen per unit of scroll, chapter by chapter across the film', '图表：整段影片中，每单位滚动的镜头画面速度，按章节分段')}>
      {bands.map(([k, a, b], i) => <g key={k} className={i % 2 ? 'is-odd' : ''}><rect x={at(a) * W} y={0} width={(at(b) - at(a)) * W} height={H}/><text x={(at(a) + at(b)) / 2 * W} y={H + (i % 2 ? 28 : 14)}>{CHAPTER_NAMES[k][lang === 'en' ? 0 : 1]}</text></g>)}
      <line className="dh-m-cut" x1={at(T.swap[1]) * W} x2={at(T.swap[1]) * W} y1={0} y2={H}/>
      <path d={path}/>
    </svg>
    <p className="dh-m-note">{L(lang, 'Speed on screen per unit of scroll (movement relative to distance, plus turn, tilt and zoom), plotted against the scroll. The dashed line marks the cut.', '每单位滚动的画面速度（相对距离的位移，加上转向、俯仰和变焦），横轴是滚动进度。虚线是切换点。')}</p>
    <table className="dh-m-table"><thead><tr><th>{L(lang, 'Chapter', '章节')}</th><th>{L(lang, 'Pace per scroll, × film average', '每单位滚动的速度（相对全片平均）')}</th><th>{L(lang, 'Pace per unit of progress, × film average', '每单位进度的速度（相对全片平均）')}</th><th>{L(lang, 'Peak ÷ chapter average', '峰值 ÷ 本章平均')}</th></tr></thead>
      <tbody>{PROBE.chapters.map(c => <tr key={c.name}><td>{CHAPTER_NAMES[c.name]?.[lang === 'en' ? 0 : 1] ?? c.name}</td><td>{(c.paceVsFilmPerScroll ?? c.paceVsFilm).toFixed(2)}×</td><td>{c.paceVsFilm.toFixed(2)}×</td><td>{c.peakOverMean.toFixed(2)}</td></tr>)}</tbody>
    </table>
    <p className="dh-m-note">{L(lang, `The closest the camera comes to a rack or wall is ${PROBE.clearance.metres.toFixed(2)} m. From the descent to the tray, the script checks the camera’s distance to the racks, walls, overhead services and plant.`, `镜头离机柜或墙最近 ${PROBE.clearance.metres.toFixed(2)} 米。从下降到托盘，脚本会检查镜头与机柜、墙、顶上管线和设备之间的距离。`)}</p>
  </Block>;
}

// (the startup finding compares the same set-up before and after: the phone size with the CPU slowed 4×)
const PHONE4 = PERF.runs.find(r => r.name === 'phone size, CPU ÷4');
const LOAD = {task: Math.max(...PERF.runs.map(r => r.boot.longest || 0)), open: Math.max(...PERF.runs.map(r => r.boot.fonts + r.boot.camera + (r.boot.plan ?? r.boot.scene) + r.boot.first))};
// three findings from the reviews, each with what it measured before and after the change (reviews/log.md has them all)
const FINDINGS = [
  {what: ['On phones, the camera’s push-in during the tray slide slowed down, then sped up again', '在手机上，托盘滑出时镜头推近的速度先变慢、又变快'], before: ['speed over successive 4% windows: 33 → 25 → 30', '连续几个 4% 区间的速度：33 → 25 → 30'], after: ['largest change within 4%: 1.20×', '4% 区间内最大变化：1.20 倍'], unit: ['camera script', '镜头测量脚本']},
  // (the after is the current scripted runs, perf.json: the longest task and the slowest opening across all six set-ups)
  {what: ['The page froze while the scene loaded', '场景加载时页面卡住'], before: ['longest task 568 ms, phone size with the CPU slowed 4× (round 9)', '最长阻塞 568 毫秒，手机尺寸、CPU 降速 4 倍（第 9 轮）'], after: [`longest task ${PHONE4?.boot.longest ?? LOAD.task} ms in the same set-up; ${LOAD.task} ms at worst across all six runs (${PERF.measured})`, `同样设置下最长阻塞 ${PHONE4?.boot.longest ?? LOAD.task} 毫秒；六种设置里最差 ${LOAD.task} 毫秒（${PERF.measured}）`], unit: ['scripted runs', '脚本实测']},
  {what: ['At the cut, labels were sliced in two, half old and half new', '切换时，标注会被切成两半，一半旧、一半新'], before: ['each pixel switched as the wipe line passed it', '每个像素在擦除线经过时切换'], after: ['each label switches whole, at its own anchor point', '每个标注以自己的锚点为准，整体切换'], unit: ['frames at 95.8% of the film', '片中 95.8% 处的画面']},
];
function Reviews({lang}) {
  return <Block n="09" title={L(lang, 'Review rounds', '评审记录')} body={L(lang, 'Each version was checked by two reviewers that did not write the code: GPT, run through Codex, and a separate Claude agent. Both worked from the same brief and looked at the frames, the camera log and the code. Each gave a score out of 100 and a list of fixes, and the next round made the fixes. Three of their findings, measured before and after:', '每一版都由两个没有参与写代码的评审检查：通过 Codex 运行的 GPT，和另一个独立的 Claude。两者按同一份要求，看画面、镜头数据和代码，各自打分（满分 100）并列出要改的地方，下一轮改掉。下面是其中三条，附改动前后的测量：')}>
    <Scores lang={lang}/>
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
  return <div ref={root}><Block n="10" title={L(lang, 'Rendering cost per frame', '每帧的渲染开销')} body={[L(lang, `Repeated parts, such as the ${RACKS.length} racks and the ${fmt(LIGHTS)} status lights, are drawn in instanced batches, and the pulled tray is merged by material. The main pass of the busiest frame takes under a hundred draw calls; the shadow maps, redrawn only when they change, are extra. The textures are painted in code when the page loads, and their relief is baked on the GPU. If moving frames miss the 60 fps budget and the GPU is the bottleneck, the page lowers its pixel ratio.`, `重复的构件，比如 ${RACKS.length} 台机柜和 ${fmt(LIGHTS)} 个状态灯，都用实例化批量绘制；抽出来的托盘按材质合并。最忙的一帧，主画面也不到一百次绘制调用；阴影贴图只在变化时重画，另算。贴图在页面加载时用代码画出来，凹凸在 GPU 上烘焙。画面移动时如果达不到 60 帧，而且瓶颈在 GPU，页面会降低像素比。`), L(lang, 'The figures below are measured in your browser as you scroll the film: the heaviest frame drawn, the time between frames while the picture moves (unclamped, so on a fast machine it equals the screen’s refresh interval), and the CPU time to prepare each frame.', '下面的数字是你滚动上面的影片时，在你的浏览器里实时测的：画过的最重的一帧；画面移动时的帧间隔（不做截断，所以在快的机器上就等于屏幕刷新间隔）；以及准备每一帧所花的 CPU 时间。')]}>
    <dl className="dh-m-counts is-live">
      <div><dt>{s ? s.calls : '—'}</dt><dd>{L(lang, 'draw calls in the main pass, heaviest frame', '次绘制调用（主画面，最重的一帧）')}</dd></div>
      <div><dt>{s ? fmt(s.triangles) : '—'}</dt><dd>{L(lang, 'triangles in the main pass, heaviest frame', '个三角形（主画面，最重的一帧）')}</dd></div>
      <div><dt>{s ? ms(s.median) : '—'}</dt><dd>{L(lang, 'time between moving frames, median (95th percentile: ', '画面移动时的帧间隔，中位数（第 95 百分位：') + (s ? ms(s.p95) : '—') + L(lang, ')', '）')}</dd></div>
      <div><dt>{s ? ms(s.cpu) : '—'}</dt><dd>{L(lang, 'CPU time to prepare a frame, median', '准备一帧的 CPU 时间，中位数')}</dd></div>
    </dl>
    <p className="dh-m-note">{s ? L(lang, `${fmt(s.frames)} frames on ${s.gpu || 'this device'}, at a pixel ratio of ${s.dpr}. ${s.stalls} ${s.stalls === 1 ? 'frame' : 'frames'} took over 50 ms. The opening was drawn after ${Math.round(s.boot.fonts + s.boot.camera + (s.boot.plan || s.boot.scene) + s.boot.first)} ms and the whole film was ready after ${Math.round(s.boot.fonts + s.boot.camera + s.boot.scene)} ms.`, `共 ${fmt(s.frames)} 帧，设备：${s.gpu || '本机'}，像素比 ${s.dpr}。超过 50 毫秒的有 ${s.stalls} 帧。开场画面在 ${Math.round(s.boot.fonts + s.boot.camera + (s.boot.plan || s.boot.scene) + s.boot.first)} 毫秒后画出，全片在 ${Math.round(s.boot.fonts + s.boot.camera + s.boot.scene)} 毫秒后就绪。`) : L(lang, 'The figures appear once you scroll through the film above.', '滚动看过上面的影片后，这里会显示数字。')}</p>
    <h4 className="dh-m-sub">{L(lang, 'Scripted runs', '脚本实测')}</h4>
    <p className="dh-m-note">{L(lang, `A script loads the page cold, waits until the film is built, then scrolls through it at an even rate in ${PERF.seconds} s. All runs are on one machine (${PERF.runs[0].gpu}), in six set-ups: a 1600 × 900 window at a pixel ratio of 2, a 390 × 844 phone size at 3, and the same window with the cheaper set-up that phones, integrated GPUs and unnamed GPUs get; each at full speed and with the CPU slowed 4×.`, `脚本冷启动页面，等全片搭好，再用 ${PERF.seconds} 秒匀速滚完。全部在同一台机器上跑（${PERF.runs[0].gpu}），共六种设置：1600 × 900、像素比 2 的窗口；390 × 844、像素比 3 的手机尺寸；以及同样的窗口，换成手机、集成显卡和不报名称的显卡所用的较省设置。每种都以原速和 CPU 降速 4 倍各跑一次。`)}{PERF.gpuLoad > 10 ? L(lang, ` Other programs were using ${PERF.gpuLoad}% of the GPU just before these runs; their load during the runs wasn’t recorded.`, `测试开始前，其他程序占用了 ${PERF.gpuLoad}% 的 GPU；测试过程中的占用没有记录。`) : ''}</p>
    <details className="dh-m-more"><summary>{L(lang, 'How each figure is measured', '每项数字怎么测')}</summary>
      <p className="dh-m-note">{L(lang, 'Frame times count only moving frames after the film is built. Opening: the time until the paper and the plan are drawn. Film ready: the time until everything is built (in steps, handing the main thread back to the page between them). Longest task: the longest single block of the main thread during loading. GPU / frame: the GPU’s own time per frame, from timer queries. Pixel ratio: the page caps it at 1.5 (1.25 on phones and in the cheaper set-up) and lowers it only when the GPU is near the budget. If frames still miss at the lowest ratio, the film steps between held frames instead of moving.', '帧时间只算全片搭好之后的移动画面。开场：到纸面和平面图画出来为止的时间。全片就绪：到全部搭好为止的时间（分步搭建，每一步之间把主线程还给页面）。最长阻塞：加载过程中主线程被连续占用最长的一次。GPU 每帧：用计时查询测得的 GPU 本身每帧耗时。像素比：页面把它限制在 1.5 以内（手机和较省设置是 1.25），只有 GPU 接近预算时才降低。如果降到最低还是跟不上，就改为在几个定格画面之间切换，不再连续移动。')}</p>
    </details>
    <p className="dh-m-note">{L(lang, 'Not yet measured on an integrated GPU or a physical phone.', '还没有在集成显卡或真实手机上测过。')}</p>
    <div className="dh-m-scroll" role="region" tabIndex={0} aria-label={L(lang, 'Scripted runs table, scrolls sideways', '脚本实测表格，可左右滚动')}>
    <table className="dh-m-table dh-m-wide">
      <thead><tr><th>{L(lang, 'Set-up', '条件')}</th><th>{L(lang, 'Median', '中位数')}</th><th>P95</th><th>{L(lang, 'Over 17.5 ms', '超过 17.5 毫秒')}</th><th>{L(lang, 'Stalls over 50 ms', '超过 50 毫秒的卡顿')}</th><th>{L(lang, 'GPU / frame', 'GPU 每帧')}</th><th>{L(lang, 'Opening', '开场')}</th><th>{L(lang, 'Film ready', '全片就绪')}</th><th>{L(lang, 'Longest task', '最长阻塞')}</th><th>{L(lang, 'Pixel ratio', '像素比')}</th></tr></thead>
      <tbody>{PERF.runs.map(r => <tr key={r.name}><td>{L(lang, r.name.replace('modest set-up', 'cheaper set-up'), r.name.replace('window at 2×', '窗口，像素比 2').replace('phone size', '手机尺寸').replace(', modest set-up', '，较省的设置').replace(', CPU ÷4', '，CPU 降速 4 倍'))}</td><td>{r.median} ms</td><td>{r.p95} ms</td><td>{r.over}%</td><td>{r.stalls}</td><td>{r.gpuFrame ? r.gpuFrame.median + ' ms' : '—'}</td><td>{r.boot.fonts + r.boot.camera + (r.boot.plan ?? r.boot.scene) + r.boot.first} ms</td><td>{r.boot.fonts + r.boot.camera + r.boot.scene} ms</td><td>{r.boot.longest ?? '—'} ms</td><td>{r.endDpr}</td></tr>)}</tbody>
    </table>
    </div>
  </Block></div>;
}
