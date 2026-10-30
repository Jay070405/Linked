import {useEffect, useRef, useState} from 'react';
import {L, useCaseLang} from '../../i18n';

/* The six small working models beside the six design choices. Each shows its rule with Hako's own parts (the
   selection box, the agents' frames, the teammates' cursors, the inspector, the deploy track); none of them is data.
   Keyboard: every control is a real button. `still` (reduced motion or the plain page): the end state, no motion. */

const PROMPT = 'Make it real — dark, live data';
const Cursor = ({color}) => <svg viewBox="0 0 14 18" aria-hidden="true"><path d="M1 1 L13 9.5 L7.6 10.6 L5 16.5 Z" fill={color}/></svg>;
const Handles = () => <><i className="hw-hd is-tl"/><i className="hw-hd is-tr"/><i className="hw-hd is-bl"/><i className="hw-hd is-br"/></>;

/** A small wireframe of the Daybreak sketch, drawn in the mini's own 320 × 200 units. */
function MiniSketch() {
  return <svg className="hw-mini-sketch" viewBox="0 0 320 200" aria-hidden="true">
    <rect x="12" y="12" width="296" height="22" rx="4"/><line x1="22" y1="23" x2="70" y2="23"/><circle cx="292" cy="23" r="6"/>
    {[0, 1, 2].map(i => <g key={i}><rect x={12 + i * 100} y="44" width="96" height="44" rx="5"/><line x1={22 + i * 100} y1="58" x2={60 + i * 100} y2="58"/><line x1={22 + i * 100} y1="74" x2={48 + i * 100} y2="74" strokeWidth="4"/></g>)}
    <rect x="12" y="98" width="190" height="90" rx="5"/><path d="M22 176 C 60 172, 80 112, 108 116 S 160 174, 194 172"/>
    <rect x="210" y="98" width="98" height="90" rx="5"/>{[0, 1, 2].map(i => <g key={i}><line x1="218" y1={116 + i * 24} x2="262" y2={116 + i * 24}/><rect x="276" y={110 + i * 24} width="22" height="11" rx="5.5"/></g>)}
  </svg>;
}

/** 1. Point instead of describe: the same request, as a description and as a box. */
export function PointMini() {
  const {t} = useCaseLang();
  const [mode, setMode] = useState('point');
  const describe = t(L('A dark dashboard for home energy. A header with a greeting and a Live badge. Three cards: power produced now, battery level with a ring, money saved this month. A weekly solar bar chart, today highlighted, the rest a forecast. A list of devices with on/off toggles…',
    '一个深色的家庭能源仪表盘。顶部是问候语和 Live 标记。三张卡片：当前发电功率、带圆环的电池电量、本月省下的钱。一张每周太阳能柱状图，今天高亮，其余几天是预测。一列带开关的设备……'));
  const n = [...(mode === 'point' ? PROMPT : describe)].length;
  return <div className={`hw-mini hw-point is-${mode}`}>
    <div className="hw-seg" role="group" aria-label={t(L('Show the request as', '请求的方式'))}>
      <button type="button" aria-pressed={mode === 'describe'} onClick={() => setMode('describe')}>{t(L('Describe it', '描述出来'))}</button>
      <button type="button" aria-pressed={mode === 'point'} onClick={() => setMode('point')}>{t(L('Point at it', '指出来'))}</button>
    </div>
    <div className="hw-mini-canvas">
      <MiniSketch/>
      <div className="hw-point-sel" aria-hidden="true"><Handles/><span>296 × 176</span></div>
      <p className="hw-point-prompt is-describe" aria-hidden={mode !== 'describe'}><span aria-hidden="true">✦ </span>{describe}</p>
      <p className="hw-point-prompt is-point" aria-hidden={mode !== 'point'} lang="en"><span aria-hidden="true">✦ </span>{PROMPT}</p>
    </div>
    <p className="hw-mini-read" aria-live="polite">{mode === 'point'
      ? t(L(`Prompt: ${n} characters. Scope: the box.`, `提示：${n} 个字符。范围：这个框。`))
      : t(L(`Prompt: ${n} characters. Scope: whatever the words say; the sketch goes unused.`, `提示：${n} 个字符。范围：全凭文字；草图用不上。`))}</p>
  </div>;
}

const ACTORS = [
  {id: 'you', name: L('You', '你'), color: '#FF5A1F', rule: L('Persimmon: only your own selection, and the brand.', '柿子橙：只用在你自己的选框上，以及品牌。')},
  {id: 'agents', name: L('Agents', 'Agent'), color: '#5B4BFF', rule: L('Ultraviolet: agents, and nothing else.', '紫外色：只给 agent，别无他用。')},
  {id: 'mia', name: 'Mia', color: '#E8467C', rule: L('Mia’s pink: only on her cursor and her frames.', 'Mia 的粉色：只在她的光标和选框上。')},
  {id: 'theo', name: 'Theo', color: '#0FA3A3', rule: L('Theo’s teal: only on his cursor and his frames.', 'Theo 的青色：只在他的光标和选框上。')},
  {id: 'ren', name: 'Ren', color: '#E8A21A', rule: L('Ren’s amber: only on his cursor and his frames.', 'Ren 的琥珀色：只在他的光标和选框上。')},
  {id: 'live', name: L('Live', '上线'), color: '#17B26A', rule: L('Green: only what has shipped.', '绿色：只给已经发布的东西。')},
];

/** 2. Colour says who is acting: pick someone, and only their marks stay lit. */
export function ColourMini() {
  const {t} = useCaseLang();
  const [focus, setFocus] = useState(null);
  const dim = who => (focus && focus !== who ? ' is-dim' : '');
  const actor = ACTORS.find(a => a.id === focus);
  return <div className="hw-mini hw-colour">
    <div className="hw-who" role="group" aria-label={t(L('Show one actor', '只看一位'))}>
      {ACTORS.map(a => <button key={a.id} type="button" aria-pressed={focus === a.id} style={{'--c': a.color}} onClick={() => setFocus(f => (f === a.id ? null : a.id))}><i aria-hidden="true"/>{t(a.name)}</button>)}
    </div>
    <div className="hw-mini-canvas hw-colour-canvas" aria-hidden="true">
      <div className="hw-db">
        <div className="hw-db-head"><b><i/>daybreak</b><em className={`hw-live${dim('live')}`}>● Live</em></div>
        <div className="hw-db-kpis">{['4.8 kW', '86 %', '€142.60'].map(v => <span key={v}>{v}</span>)}
          <div className={`hw-c-sel${dim('you')}`}><Handles/></div>
          <div className={`hw-c-cur is-you${dim('you')}`}><Cursor color="#0E0E11"/></div>
        </div>
        <div className="hw-db-row">
          <div className="hw-db-chart">{[38, 12, 34, 41, 28, 45, 40].map((v, i) => <i key={i} style={{'--h': v / 48}}/>)}
            <div className={`hw-c-agent-frame${dim('agents')}`}><span>✦ Metrics</span></div>
            <div className={`hw-c-cur is-agent${dim('agents')}`} style={{'--c': '#5B4BFF'}}><Cursor color="#5B4BFF"/><span>Hako · Metrics</span></div>
          </div>
          <div className="hw-db-list">{[1, 1, 1, 0].map((on, i) => <span key={i} className={on ? 'is-on' : undefined}/>)}
            <div className={`hw-c-theo${dim('theo')}`}/>
            <div className={`hw-c-cur is-theo${dim('theo')}`} style={{'--c': '#0FA3A3'}}><Cursor color="#0FA3A3"/><span>Theo</span></div>
          </div>
        </div>
      </div>
      <div className={`hw-c-cur is-mia${dim('mia')}`} style={{'--c': '#E8467C'}}><Cursor color="#E8467C"/><span>Mia</span></div>
      <div className={`hw-c-cur is-ren${dim('ren')}`} style={{'--c': '#E8A21A'}}><Cursor color="#E8A21A"/><span>Ren</span></div>
    </div>
    <p className="hw-mini-read" aria-live="polite">{actor ? t(actor.rule) : t(L('Everyone at once: five colours, each with one job, each with a name beside it.', '所有人一起看：五种颜色，各管一件事，旁边都带着名字。'))}</p>
  </div>;
}

/* 3. Agents work in frames you can see. The same build, as a chat log and as frames on the canvas. The log lines are
   an illustration of a chat interface, written for this comparison. */
const SEQ = [
  {Layout: 'think'},
  {Layout: 'think', Metrics: 'think'},
  {Layout: 'build', Metrics: 'think', Devices: 'think'},
  {Layout: 'done', Metrics: 'build', Devices: 'think'},
  {Layout: 'done', Metrics: 'build', Devices: 'build'},
  {Layout: 'done', Metrics: 'done', Devices: 'build'},
  {Layout: 'done', Metrics: 'done', Devices: 'done'},
];
const LOG = [
  ['Layout', L('Taking the header.', '我来做顶部。')], ['Metrics', L('Working on the chart…', '在做图表……')], ['Devices', L('On it.', '开始了。')],
  ['Layout', L('Header done.', '顶部做好了。')], ['Devices', L('Toggles wired to live data…', '开关接上实时数据……')], ['Metrics', L('Chart done.', '图表做好了。')], ['Devices', L('Device list done.', '设备列表做好了。')],
];
export function FramesMini({still}) {
  const {t} = useCaseLang();
  const root = useRef(null), timer = useRef(0);
  const [step, setStep] = useState(SEQ.length - 1);
  const play = () => {
    clearInterval(timer.current);
    if (still) { setStep(SEQ.length - 1); return; }
    setStep(0);
    let i = 0;
    timer.current = setInterval(() => { i++; setStep(i); if (i >= SEQ.length - 1) clearInterval(timer.current); }, 620);
  };
  useEffect(() => () => clearInterval(timer.current), []);
  // run once when it first comes into view
  useEffect(() => {
    if (still || !root.current) return undefined;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); play(); } }, {threshold: 0.6});
    io.observe(root.current);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [still]);
  const s = SEQ[step];
  return <div ref={root} className="hw-mini hw-frames">
    <div className="hw-frames-pair">
      <div className="hw-frames-log">
        <p className="hw-frames-cap">{t(L('In a chat', '聊天记录里'))}</p>
        <ol aria-hidden="true">{LOG.slice(0, step + 1).map(([who, line], i) => <li key={i}><b>{who}</b> {t(line)}</li>)}</ol>
      </div>
      <div className="hw-frames-canvas">
        <p className="hw-frames-cap">{t(L('On the canvas', '画布上'))}</p>
        <div className="hw-frames-board" aria-hidden="true">
          {[['Layout', 'is-head'], ['Metrics', 'is-chart'], ['Devices', 'is-list']].map(([who, cls]) => <div key={who} className={`hw-fr ${cls} is-${s[who] || 'idle'}`}>
            <span className="hw-fr-sk"/><span className="hw-fr-ui"/><i className="hw-fr-scan"/>
            {s[who] && s[who] !== 'done' ? <em>✦ {who}</em> : null}
          </div>)}
        </div>
      </div>
    </div>
    <div className="hw-mini-foot">
      <p className="hw-mini-read">{t(L('The log says what was said. The canvas shows where the work is.', '聊天记录告诉你说了什么，画布告诉你活儿在哪儿。'))}</p>
      <button type="button" className="hw-mini-btn" onClick={play}>{t(L('Replay', '再放一遍'))}</button>
    </div>
  </div>;
}

/** 4. The team stays in the loop: notes ticked by their authors, a comment answered in its own thread (the film's). */
export function TeamMini() {
  const {t} = useCaseLang();
  return <div className="hw-mini hw-team">
    <ul className="hw-team-notes" aria-label={t(L('The team’s notes, each ticked by its author', '团队的便签，各自由作者勾掉'))}>
      {[['Mia', '#E8467C', '#FFD9E5', 'dark mode please!'], ['Theo', '#0FA3A3', '#CFEFEF', 'chart = the hero'], ['Ren', '#E8A21A', '#FFE9B8', 'show € saved']].map(([who, c, bg, text]) => <li key={who} style={{'--who': c, '--bg': bg}}>
        <p lang="en">{text}</p><span><i aria-hidden="true"/>{who} <b>✓ {t(L('ticked', '已勾掉'))}</b></span>
      </li>)}
    </ul>
    <div className="hw-thread" role="group" aria-label={t(L('A comment thread on the canvas', '画布上的讨论串'))}>
      <p className="hw-msg"><span className="hw-av" style={{background: '#E8467C'}} aria-hidden="true">M</span><span><b>Mia</b> <em>· now</em><br/><span lang="en">Can we see this per room?</span></span></p>
      <p className="hw-msg"><span className="hw-av is-agent" aria-hidden="true">✦</span><span><b>Hako</b> <u>agent</u><br/><span lang="en">Added a per-room breakdown</span></span></p>
    </div>
  </div>;
}

// Daybreak's week (ui/Daybreak.tsx WEEK): Monday measured, today (Tuesday) so far, the rest a forecast
const WEEK = [
  {d: 'mon', name: L('Monday', '周一'), v: 38.2, kind: 'actual'}, {d: 'tue', name: L('Tuesday, today', '周二（今天）'), v: 12.2, est: 42, kind: 'today'},
  {d: 'wed', name: L('Wednesday', '周三'), v: 34, kind: 'forecast'}, {d: 'thu', name: L('Thursday', '周四'), v: 41, kind: 'forecast'},
  {d: 'fri', name: L('Friday', '周五'), v: 28, kind: 'forecast'}, {d: 'sat', name: L('Saturday', '周六'), v: 45, kind: 'forecast'},
  {d: 'sun', name: L('Sunday', '周日'), v: 40, kind: 'forecast'},
];

/** 5. The canvas is the code: pick a day on the data layer and the inspector writes the prop (the film's code). */
export function CodeMini({still}) {
  const {t} = useCaseLang();
  const [pick, setPick] = useState(still ? 'sat' : null);
  const day = WEEK.find(w => w.d === pick);
  return <div className="hw-mini hw-code">
    <div className="hw-code-chart">
      <p className="hw-code-layer" aria-hidden="true"><span>04</span> Data · /api/solar/week · live</p>
      <div className="hw-code-bars" role="group" aria-label={t(L('Solar this week: pick a day to highlight', '本周太阳能：选一天高亮'))}>
        {WEEK.map(w => <button key={w.d} type="button" className={`is-${w.kind}${pick === w.d ? ' is-picked' : ''}`} aria-pressed={pick === w.d}
          aria-label={`${t(w.name)}, ${w.kind === 'forecast' ? t(L('forecast', '预测')) : w.kind === 'today' ? t(L('so far', '目前')) : t(L('measured', '实测'))} ${w.v} kWh`} onClick={() => setPick(p => (p === w.d ? null : w.d))}>
          <i style={{'--h': (w.est || w.v) / 48}}>{w.kind === 'today' ? <u style={{'--p': w.v / w.est}}/> : null}{pick === w.d ? <span className="hw-code-sel"><Handles/></span> : null}</i>
          <em>{w.d[0].toUpperCase() + w.d.slice(1)}</em>
        </button>)}
      </div>
    </div>
    <div className="hw-code-card" aria-live="polite">
      <p className="hw-code-head"><span>Chart · solar.week</span><span>04 Data</span></p>
      <pre lang="en"><span className="hw-ln is-c">{'// built by Hako · Metrics'}</span><span className="hw-ln">{'<BarChart'}</span><span className="hw-ln">{'  data={'}<span className="is-a">solar.week</span>{'}'}</span><span className="hw-ln">{'  forecast'}</span>{day ? <span key={pick} className="hw-ln is-new">{'  highlight='}<span className="is-s">"{pick}"</span></span> : null}<span className="hw-ln">{'/>'}</span></pre>
      <p className="hw-mini-read">{day ? t(L(`You picked ${day.name.en.split(',')[0]}; the prop is written into the chart’s code.`, `你选了${day.name.zh.replace('（今天）', '')}，属性就写进了图表代码。`)) : t(L('Pick a day on the chart.', '在图表上选一天。'))}</p>
    </div>
  </div>;
}

/* 6. What you select is what ships: the box rides the deploy track. The stage readouts are the film's fictional
   ones (film/acts/ship/Pipeline.tsx). */
const STAGES = [['Build', '11.8 s'], ['Checks', '214 passed'], ['Edge', '38 regions'], ['Live', 'daybreak.energy']];
export function ShipMini({still}) {
  const {t} = useCaseLang();
  const [at, setAt] = useState(still ? STAGES.length : 0);   // how many stages have passed
  const timers = useRef([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const run = () => {
    timers.current.forEach(clearTimeout); timers.current = [];
    if (still) { setAt(STAGES.length); return; }
    setAt(0);
    STAGES.forEach((_, i) => timers.current.push(setTimeout(() => setAt(i + 1), 160 + i * 560)));
  };
  const done = at >= STAGES.length;
  const pos = at ? (at - 0.5) / STAGES.length : 0;     // over the stage it last passed (its column's middle)
  return <div className={`hw-mini hw-ship${done ? ' is-live' : ''}`}>
    <div className="hw-ship-track" style={{'--at': at}}>
      <span className="hw-ship-rail" aria-hidden="true"><i style={{transform: `scaleX(${pos})`}}/></span>
      <span className="hw-ship-box" aria-hidden="true" style={{transform: `translate3d(calc(${pos} * 100cqw - ${at ? 20 : 0}px), 0, 0)`}}><svg viewBox="0 0 100 100"><rect x="19" y="19" width="62" height="62" fill="none" stroke="#fff" strokeWidth="11"/>{[[19, 19], [81, 19], [81, 81], [19, 81]].map(([x, y]) => <rect key={x + '' + y} x={x - 13} y={y - 13} width="26" height="26" rx="4.5" fill="#fff"/>)}</svg></span>
      <ol>{STAGES.map(([name, value], i) => <li key={name} className={i < at ? 'is-passed' : i === at && at > 0 ? 'is-running' : ''}>
        <b><i aria-hidden="true">{i < at ? '✓' : ''}</i>{name}</b><span lang="en">{i < at ? value : i === at && at > 0 ? '…' : 'queued'}</span>
      </li>)}</ol>
    </div>
    <div className="hw-mini-foot">
      <p className="hw-mini-read" aria-live="polite">{done ? t(L('Live. The readouts are the film’s, from a fictional deploy.', '上线了。这些读数来自片子里一次虚构的部署。')) : t(L('Press Ship: the selection rides the track.', '按 Ship：选框沿着轨道走。'))}</p>
      <button type="button" className="hw-mini-btn is-ship" onClick={run}>{done ? t(L('Ship again', '再发一次')) : 'Ship ↗'}</button>
    </div>
  </div>;
}

export const MINIS = {point: PointMini, colour: ColourMini, frames: FramesMini, team: TeamMini, code: CodeMini, ship: ShipMini};
