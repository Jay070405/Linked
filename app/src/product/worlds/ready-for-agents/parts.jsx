import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {gsap, PHONE, useMedia} from '../../v2/motion';
import {Ask, Takeaway, useInputMode} from '../../v2/Try';
import {Browser, ProtoScreen, RFA_KIT, rfaShot, rfaUrl} from '../../v2/Device';
import {zoomable} from '../../v2/zoom';
import {L, UI, useCaseLang} from '../../i18n';
import {A, AGENT_NOTE, DIRECTIONS, FLAT, PRINCIPLES} from './data';
import {useArrive, useWorld} from './context';
import {FigIcon} from './icons';

/* The frames' own modules, re-made for the canvas. Where the v4 page waited for a ScrollTrigger, these wait for the
   camera to come to rest on their frame (useArrive); in stack and plain modes, for the frame to be on screen. */

const ADDRESS = L('Ready for agents, concept prototype', 'Ready for agents，概念原型');
const LEVELS = [L('L0 Raw', 'L0 原始'), L('L1 Structured', 'L1 结构化'), L('L2 Systematized', 'L2 系统化')];

/** Result 1: the pre-registered checks came out the same at every level. Bars grow once, together. */
export function FlatResult({reduced, id}) {
  const {t} = useCaseLang();
  const root = useRef(null);
  const go = useArrive(id, root);
  useLayoutEffect(() => {
    const node = root.current;
    if (!node || reduced) return undefined;
    const bars = node.querySelectorAll('.rfaw-flat-bar i');
    if (!go) { gsap.set(bars, {scaleX: 0}); return undefined; }
    const tw = gsap.to(bars, {scaleX: 1, duration: .9, ease: 'v2out', stagger: .03, delay: .15});
    return () => tw.kill();
  }, [reduced, go]);
  return <figure ref={root} className="rfaw-flat" data-jay=".96,.04">
    <div className="rfaw-flat-grid" role="table" aria-label={t(L('Pre-registered measures, median per level', '预先登记的指标，各层级中位数'))}>
      <div role="row" className="rfaw-flat-head"><span role="columnheader">{t(L('Median per level', '各层级中位数'))}</span>{LEVELS.map(l => <span key={l.en} role="columnheader">{t(l)}</span>)}</div>
      {FLAT.map(row => <div role="row" key={row.name.en} className="rfaw-flat-row" data-agent={t(L('Row', '行'))}>
        <span role="rowheader">{t(row.name)}</span>
        {row.values.map((v, i) => <span role="cell" key={i} className="rfaw-flat-bar"><i style={{'--w': row.share[i]}} aria-hidden="true"/><b>{v}</b></span>)}
      </div>)}
    </div>
    <figcaption className="rfaw-caption"><Ev label="Measured"/><span>{t(L('Medians of 9, 9 and 10 builds. These checks hit a ceiling, so the honest reading is “no detectable difference”, not “identical”.',
      '分别是 9、9、10 次构建的中位数。这些指标都碰到了上限，所以只能说“测不出差别”，不能说“完全一样”。'))}</span></figcaption>
  </figure>;
}

export function Principles() {
  const {t} = useCaseLang();
  return <ol className="rfaw-principles">
    {PRINCIPLES.map(p => <li key={p.img} className="rfaw-principle" data-agent={t(L('Principle', '原则'))}>
      <div className="rfaw-principle-img" aria-hidden="true"><img src={A + p.img} width={Math.round(p.dw * 1.25)} height={Math.round(p.dh * 1.25)} style={{width: p.dw}} alt="" loading="lazy" decoding="async"/></div>
      <h4 className="rfaw-principle-title">{t(p.title)}</h4>
      <p className="rfaw-principle-test">{t(p.test)}</p>
    </li>)}
  </ol>;
}

/** Three directions as tabs over one large preview (the v4 module, in the editor's tab style). */
export function Directions({reduced}) {
  const {t, zh, lang} = useCaseLang();
  const [at, setAt] = useState(0);
  const [seen, setSeen] = useState(false);
  const mode = useInputMode();
  const tabs = useRef(null);
  const d = DIRECTIONS[at];
  const pick = i => { setAt(i); setSeen(true); };
  const onKey = e => {
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
    const next = step ? (at + step + DIRECTIONS.length) % DIRECTIONS.length : e.key === 'Home' ? 0 : e.key === 'End' ? DIRECTIONS.length - 1 : null;
    if (next == null) return;
    e.preventDefault();
    pick(next);
    tabs.current?.querySelectorAll('[role=tab]')[next]?.focus();
  };
  const instant = reduced || mode.keyed.current;
  const altOf = x => (zh ? `方向 ${x.id.toUpperCase()}：${t(x.name)}，用在同一个 Home frame 上` : `Direction ${x.id.toUpperCase()}, ${t(x.name)}, on the same Home frame`);
  return <div className="rfaw-dirs" {...mode.bind}>
    <div className="rfaw-dirs-top">
      <Ask>{t(L('Pick a direction.', '选一个方向。'))}</Ask>
      <div ref={tabs} className="rfaw-seg" role="tablist" aria-label={t(L('Directions', '方向'))} onKeyDown={onKey}>
        {DIRECTIONS.map((x, i) => <button key={x.id} type="button" role="tab" id={`rfaw-dir-tab-${x.id}`} aria-selected={i === at} aria-controls="rfaw-dir-panel"
          tabIndex={i === at ? 0 : -1} onClick={() => pick(i)}>
          <b>{x.id.toUpperCase()}</b><span className="rfaw-dir-long">{t(x.name)}</span><span className="rfaw-dir-short" aria-hidden="true">{t(x.short)}</span>
        </button>)}
      </div>
    </div>
    <div id="rfaw-dir-panel" className={`rfaw-dir${instant ? ' is-instant' : ''}`} role="tabpanel" aria-labelledby={`rfaw-dir-tab-${d.id}`}>
      <div className="rfaw-dir-shot" data-zoom-group="" data-jay=".9,.06">
        {DIRECTIONS.map((x, i) => <img key={x.id} className={i === at ? 'is-on' : ''} src={`${A}explore-${x.id}.webp`} width="965" height="1008"
          alt={altOf(x)} loading="lazy" decoding="async"
          {...(i === at ? zoomable(altOf(x), {lang}) : {'data-zoom': '', 'data-zoom-alt': altOf(x), 'aria-hidden': true})}/>)}
      </div>
      <div className="rfaw-dir-text">
        <p className="rfaw-dir-tag" data-agent="Text"><b>{d.id.toUpperCase()}</b>{t(d.name)}</p>
        <p className="rfaw-dir-idea">{t(d.idea)}</p>
        <ul className="rfaw-pm">
          {d.plus.map(p => <li key={p.en} className="is-plus"><span className="v2-sr">{t(L('Strength: ', '优点：'))}</span>{t(p)}</li>)}
          {d.minus.map(m => <li key={m.en} className="is-minus"><span className="v2-sr">{t(L('Weakness: ', '缺点：'))}</span>{t(m)}</li>)}
        </ul>
        <p className="rfaw-verdict"><span>{t(L('Verdict', '结论'))}</span>{t(d.role)}</p>
      </div>
    </div>
    <p className="rfaw-caption rfaw-decision"><Ev label="Hypothesis"/><span>{zh
      ? <><b>目前的判断：</b>以 A 为主入口。B 并进 A：悬停在某一行上，画布会描出对应的图层。section 标为 ready for dev 时，C 复用 A 的那一行。成不成立，五场测试说了算。</>
      : <><b>The call so far:</b> A is the home. B moves inside A, so hovering a row outlines its layers on the canvas. C reuses A’s row when a section is marked ready for dev. The five sessions decide whether it holds.</>}</span></p>
    <Takeaway show={seen} instant={instant}>{t(L('One home for the check, with the other two folded into it.', '检查只有一个入口，另外两个方向并了进去。'))}</Takeaway>
  </div>;
}

/** One state of the prototype, cropped to the part a step is about (the same framing as the v4 scrolly's camera). */
export function Crop({step, alt}) {
  const {lang} = useCaseLang();
  const phone = useMedia(PHONE);
  const cam = (phone && step.phoneCamera) || step.camera;
  const W = 1440, H = 900, w = cam.w, h = w * H / W;
  const x = Math.min(Math.max(0, cam.x), W - w), y = Math.min(Math.max(0, cam.y), H - h);
  return <div className="rfaw-crop" {...zoomable(alt, {src: rfaShot(step.screen), w: 1800, h: 1125, lang})}>
    <img src={rfaShot(step.screen)} width="1800" height="1125" alt={alt} loading="lazy" decoding="async"
      style={{width: `${W / w * 100}%`, left: `${-x / w * 100}%`, top: `${-y / h * 100}%`}}/>
  </div>;
}

/** The same review state in both themes. It flips to dark once when the camera arrives, then the switch is yours. */
export function ThemeMoment({reduced, id}) {
  const {t, lang} = useCaseLang();
  const root = useRef(null);
  const [dark, setDark] = useState(false);
  const touched = useRef(false);
  const go = useArrive(id, root);
  useEffect(() => {
    if (!go || reduced) return undefined;
    const tm = setTimeout(() => { if (!touched.current) setDark(true); }, 700);
    return () => clearTimeout(tm);
  }, [go, reduced]);
  const pick = v => { touched.current = true; setDark(v); };
  const lightAlt = t(L('Check designs in the light theme', '浅色主题下的 Check designs')), darkAlt = t(L('Check designs in the dark theme', '深色主题下的 Check designs'));
  return <div ref={root} className="rfaw-theme">
    <div className="rfaw-theme-copy">
      <h3 className="rfaw-h3" data-agent="Text">{t(L('Light and dark from the same tokens', '浅色、深色，同一套 token'))}</h3>
      <p className="rfaw-body">{t(L('Every surface uses Figma’s published theme tokens, so the dark theme needed no second design. One deliberate change: blue fills that carry text use #0A78D1, for 4.6:1 contrast instead of 3.0:1.',
        '所有界面都用 Figma 公开的主题 token，所以深色主题不用再设计一遍。只有一处是特意改的：上面压着文字的蓝色填充改用 #0A78D1，对比度从 3.0:1 提到 4.6:1。'))}</p>
      <div className="rfaw-seg is-small" role="group" aria-label={t(L('Theme', '主题'))} data-jay=".9,.5">
        <button type="button" aria-pressed={!dark} onClick={() => pick(false)}>{t(UI.light)}</button>
        <button type="button" aria-pressed={dark} onClick={() => pick(true)}>{t(UI.dark)}</button>
      </div>
    </div>
    <div className="rfaw-theme-shot">
      <Browser address={t(ADDRESS)}>
        <div className="rfaw-theme-stack" data-zoom-group="">
          <img src={rfaShot('review')} width="1800" height="1125" alt={lightAlt} className={dark ? '' : 'is-on'} loading="lazy" decoding="async"
            {...(dark ? {'data-zoom': '', 'aria-hidden': true} : zoomable(lightAlt, {lang}))}/>
          <img src={rfaShot('review-dark')} width="1800" height="1125" alt={darkAlt} className={dark ? 'is-on' : ''} loading="lazy" decoding="async"
            {...(dark ? zoomable(darkAlt, {lang}) : {'data-zoom': '', 'aria-hidden': true})}/>
        </div>
      </Browser>
    </div>
  </div>;
}

export function AgentSide() {
  const {t, lang} = useCaseLang();
  const designerAlt = t(L('Figma’s Agents tab: the note says Home has 3 unbound values and asks which variable FFFFFF should use as a frame fill', 'Figma 的 Agents 标签页：说明里写着 Home 有 3 个未绑定的值，并询问 FFFFFF 作为 frame 填充应该用哪个 variable'));
  const terminalAlt = t(L('A Claude Code session: get_design_context returns a readiness note listing 3 unbound values, then the agent asks which variable FFFFFF should use as a frame fill', '一个 Claude Code 会话：get_design_context 返回一份说明，列出 3 个未绑定的值，随后 agent 询问 FFFFFF 作为 frame 填充应该用哪个 variable'));
  return <div className="rfaw-agent">
    <div className="rfaw-agent-grid">
      <figure data-jay=".94,.06"><div className="rfaw-agent-img"><img src={`${A}agent-designer.webp`} width="775" height="825" loading="lazy" decoding="async" alt={designerAlt} {...zoomable(designerAlt, {lang})}/></div>
        <figcaption className="rfaw-caption"><span>{t(L('Designer: the Agents tab, inside the editor.', '设计师：编辑器里的 Agents 标签页。'))}</span></figcaption></figure>
      <figure><div className="rfaw-agent-img is-dark"><img src={`${A}agent-terminal.webp`} width="1400" height="965" loading="lazy" decoding="async" alt={terminalAlt} {...zoomable(terminalAlt, {lang})}/></div>
        <figcaption className="rfaw-caption"><span>{t(L('Agent: a Claude Code session calling get_design_context (my mock of the response).', 'Agent：一个 Claude Code 会话调用 get_design_context（返回内容是我模拟的）。'))}</span></figcaption></figure>
    </div>
    <blockquote className="rfaw-quote" data-agent={t(L('Agent note', 'Agent 说明'))}>
      <p>“{t(AGENT_NOTE)}”</p>
      <footer>{t(L('The agent’s note, generated from the same summary as the designer’s row', 'agent 的说明，和设计师看到的那一行出自同一份汇总'))}</footer>
    </blockquote>
  </div>;
}

/** The live prototype, life-size in the last frame: tasks along the top, the editor below at the frame's width. */
// The prototype reads ?theme=dark; dark captures exist for two of its states.
const DARK_SHOTS = {review: 'review-dark', picker: 'picker-dark'};
const RFA_DARK_KIT = {...RFA_KIT, url: s => `${rfaUrl(s)}&theme=dark`, shot: s => rfaShot(DARK_SHOTS[s] || s)};

export function LiveEditor({tasks, reduced, head}) {
  const {t} = useCaseLang();
  const live = !useMedia(PHONE);
  const dark = useWorld().theme === 'dark';
  const kit = dark ? RFA_DARK_KIT : RFA_KIT;
  const [state, setState] = useState({task: null, screen: 'row', reload: 0});
  // a theme change reloads the editor in that theme, on the same state
  const first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } setState(s => ({...s, reload: s.reload + 1})); }, [dark]);
  const run = (task, i) => { setState(s => ({task: i, screen: task.screen, reload: s.reload + 1})); setOn(true); };
  const reset = () => setState(s => ({task: null, screen: 'row', reload: s.reload + 1}));
  const current = state.task == null ? null : tasks[state.task];
  // like an embedded file: the editor takes the wheel and the pointer only after you click into it
  const [on, setOn] = useState(false);
  const device = useRef(null);
  const activate = () => { setOn(true); requestAnimationFrame(() => device.current?.querySelector('iframe')?.focus()); };
  const name = t(L('Ready for agents prototype', 'Ready for agents 原型'));
  return <div className="rfaw-live">
    <div className="rfaw-live-top">
      {head}
      <div className="rfaw-live-side">
        <ol className="rfaw-tasks" aria-label={t(L('Things to try', '可以试试的事'))}>
          {tasks.map((task, i) => <li key={task.id}>
            {live ? <button type="button" className={`rfaw-task${state.task === i ? ' is-current' : ''}`} aria-pressed={state.task === i} onClick={() => run(task, i)} data-agent={t(L('Task', '任务'))}>
              <span className="rfaw-task-n">{i + 1}</span><span>{t(task.title)}</span></button>
              : <p className="rfaw-task is-static"><span className="rfaw-task-n">{i + 1}</span><span>{t(task.title)}</span></p>}
          </li>)}
        </ol>
        {live ? <div className="rfaw-live-tools">
          <button type="button" className="rfaw-btn" onClick={reset}><FigIcon name="reset"/>{t(L('Reset the prototype', '重置原型'))}</button>
          <a className="rfaw-btn is-quiet" href={kit.url(current?.screen || 'row')} target="_blank" rel="noopener"><FigIcon name="arrow-up-right"/>{t(L('Open it in a new tab', '在新标签页打开'))}<span className="v2-sr">{t(UI.opensInNewTab)}</span></a>
        </div> : null}
        <p className="rfaw-live-hint" aria-live="polite">{live
          ? (current ? t(current.hint) : t(L('Pick a task, or click around: Check, Apply and Undo all work. Everything runs in your browser.', '选一个任务，或者随便点点：Check、Apply 和 Undo 都能用。全部在你的浏览器里运行。')))
          : t(L('The prototype is a desktop editor. Open this page on a screen at least 1024 px wide to try it.', '这个原型是桌面编辑器，请在至少 1024 px 宽的屏幕上打开本页试用。'))}</p>
      </div>
    </div>
    <div ref={device} className={`rfaw-live-device${on || !live ? ' is-on' : ''}`} data-jay=".5,.02" onPointerLeave={e => { if (e.pointerType === 'mouse') setOn(false); }}>
      {live && !on ? <button type="button" className="rfaw-live-cover" onClick={activate} aria-label={t(L('Use the editor', '使用编辑器'))}><span><FigIcon name="move"/>{t(L('Click to use the editor', '点一下，开始操作编辑器'))}</span></button> : null}
      <Browser label={name} address={t(ADDRESS)}>
        <ProtoScreen kit={kit} screen={state.screen} reload={state.reload} load={live ? 'near' : 'never'} interactive={live}
          reduced={reduced} title={t(L('Ready for agents prototype, live and clickable', 'Ready for agents 原型，可以直接点'))} alt={live ? '' : t(L('Ready for agents prototype, first screen', 'Ready for agents 原型，第一屏'))}/>
      </Browser>
    </div>
  </div>;
}
