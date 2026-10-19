import {useEffect, useLayoutEffect, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {gsap, PHONE, useMedia} from '../../v2/motion';
import {Ask, Takeaway, useInputMode} from '../../v2/Try';
import {Browser, ProtoScreen, RFA_KIT, rfaShot} from '../../v2/Device';
import {zoomable} from '../../v2/zoom';
import {A, DIRECTIONS, FLAT, PRINCIPLES} from './data';
import {useArrive} from './context';
import {FigIcon} from './icons';

/* The frames' own modules, re-made for the canvas. Where the v4 page waited for a ScrollTrigger, these wait for the
   camera to come to rest on their frame (useArrive); in stack and plain modes, for the frame to be on screen. */

/** Result 1: the pre-registered checks came out the same at every level. Bars grow once, together. */
export function FlatResult({reduced, id}) {
  const root = useRef(null);
  const go = useArrive(id, root);
  useLayoutEffect(() => {
    const node = root.current;
    if (!node || reduced) return undefined;
    const bars = node.querySelectorAll('.rfaw-flat-bar i');
    if (!go) { gsap.set(bars, {scaleX: 0}); return undefined; }
    const t = gsap.to(bars, {scaleX: 1, duration: .9, ease: 'v2out', stagger: .03, delay: .15});
    return () => t.kill();
  }, [reduced, go]);
  return <figure ref={root} className="rfaw-flat" data-jay=".96,.04">
    <div className="rfaw-flat-grid" role="table" aria-label="Pre-registered measures, median per level">
      <div role="row" className="rfaw-flat-head"><span role="columnheader">Median per level</span>{['L0 Raw', 'L1 Structured', 'L2 Systematized'].map(l => <span key={l} role="columnheader">{l}</span>)}</div>
      {FLAT.map(row => <div role="row" key={row.name} className="rfaw-flat-row" data-agent="Row">
        <span role="rowheader">{row.name}</span>
        {row.values.map((v, i) => <span role="cell" key={i} className="rfaw-flat-bar"><i style={{'--w': row.share[i]}} aria-hidden="true"/><b>{v}</b></span>)}
      </div>)}
    </div>
    <figcaption className="rfaw-caption"><Ev label="Measured"/><span>Medians of 9, 9 and 10 builds. These checks hit a ceiling, so the honest reading is “no detectable difference”, not “identical”.</span></figcaption>
  </figure>;
}

export function Principles() {
  return <ol className="rfaw-principles">
    {PRINCIPLES.map(p => <li key={p.title} className="rfaw-principle" data-agent="Principle">
      <div className="rfaw-principle-img" aria-hidden="true"><img src={A + p.img} width={Math.round(p.dw * 1.25)} height={Math.round(p.dh * 1.25)} style={{width: p.dw}} alt="" loading="lazy" decoding="async"/></div>
      <h4 className="rfaw-principle-title">{p.title}</h4>
      <p className="rfaw-principle-test">{p.test}</p>
    </li>)}
  </ol>;
}

/** Three directions as tabs over one large preview (the v4 module, in the editor's tab style). */
export function Directions({reduced}) {
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
  return <div className="rfaw-dirs" {...mode.bind}>
    <div className="rfaw-dirs-top">
      <Ask>Pick a direction.</Ask>
      <div ref={tabs} className="rfaw-seg" role="tablist" aria-label="Directions" onKeyDown={onKey}>
        {DIRECTIONS.map((x, i) => <button key={x.id} type="button" role="tab" id={`rfaw-dir-tab-${x.id}`} aria-selected={i === at} aria-controls="rfaw-dir-panel"
          tabIndex={i === at ? 0 : -1} onClick={() => pick(i)}>
          <b>{x.id.toUpperCase()}</b><span className="rfaw-dir-long">{x.name}</span><span className="rfaw-dir-short" aria-hidden="true">{x.short}</span>
        </button>)}
      </div>
    </div>
    <div id="rfaw-dir-panel" className={`rfaw-dir${instant ? ' is-instant' : ''}`} role="tabpanel" aria-labelledby={`rfaw-dir-tab-${d.id}`}>
      <div className="rfaw-dir-shot" data-zoom-group="" data-jay=".9,.06">
        {DIRECTIONS.map((x, i) => <img key={x.id} className={i === at ? 'is-on' : ''} src={`${A}explore-${x.id}.webp`} width="965" height="1008"
          alt={`Direction ${x.id.toUpperCase()}, ${x.name}, on the same Home frame`} loading="lazy" decoding="async"
          {...(i === at ? zoomable(`Direction ${x.id.toUpperCase()}, ${x.name}, on the same Home frame`)
            : {'data-zoom': '', 'data-zoom-alt': `Direction ${x.id.toUpperCase()}, ${x.name}, on the same Home frame`, 'aria-hidden': true})}/>)}
      </div>
      <div className="rfaw-dir-text">
        <p className="rfaw-dir-tag" data-agent="Text"><b>{d.id.toUpperCase()}</b>{d.name}</p>
        <p className="rfaw-dir-idea">{d.idea}</p>
        <ul className="rfaw-pm">
          {d.plus.map(t => <li key={t} className="is-plus"><span className="v2-sr">Strength: </span>{t}</li>)}
          {d.minus.map(t => <li key={t} className="is-minus"><span className="v2-sr">Weakness: </span>{t}</li>)}
        </ul>
        <p className="rfaw-verdict"><span>Verdict</span>{d.role}</p>
      </div>
    </div>
    <p className="rfaw-caption rfaw-decision"><Ev label="Hypothesis"/><span><b>The call so far:</b> A is the home. B moves inside A, so hovering a row outlines its layers on the canvas. C reuses A’s row when a section is marked ready for dev. The five sessions decide whether it holds.</span></p>
    <Takeaway show={seen} instant={instant}>One home for the check, with the other two folded into it.</Takeaway>
  </div>;
}

/** One state of the prototype, cropped to the part a step is about (the same framing as the v4 scrolly's camera). */
export function Crop({step, alt}) {
  const phone = useMedia(PHONE);
  const cam = (phone && step.phoneCamera) || step.camera;
  const W = 1440, H = 900, w = cam.w, h = w * H / W;
  const x = Math.min(Math.max(0, cam.x), W - w), y = Math.min(Math.max(0, cam.y), H - h);
  return <div className="rfaw-crop" {...zoomable(alt, {src: rfaShot(step.screen), w: 1800, h: 1125})}>
    <img src={rfaShot(step.screen)} width="1800" height="1125" alt={alt} loading="lazy" decoding="async"
      style={{width: `${W / w * 100}%`, left: `${-x / w * 100}%`, top: `${-y / h * 100}%`}}/>
  </div>;
}

/** The same review state in both themes. It flips to dark once when the camera arrives, then the switch is yours. */
export function ThemeMoment({reduced, id}) {
  const root = useRef(null);
  const [dark, setDark] = useState(false);
  const touched = useRef(false);
  const go = useArrive(id, root);
  useEffect(() => {
    if (!go || reduced) return undefined;
    const t = setTimeout(() => { if (!touched.current) setDark(true); }, 700);
    return () => clearTimeout(t);
  }, [go, reduced]);
  const pick = v => { touched.current = true; setDark(v); };
  return <div ref={root} className="rfaw-theme">
    <div className="rfaw-theme-copy">
      <h3 className="rfaw-h3" data-agent="Text">Light and dark from the same tokens</h3>
      <p className="rfaw-body">Every surface uses Figma’s published theme tokens, so the dark theme needed no second design. One deliberate change: blue fills that carry text use #0A78D1, for 4.6:1 contrast instead of 3.0:1.</p>
      <div className="rfaw-seg is-small" role="group" aria-label="Theme" data-jay=".9,.5">
        <button type="button" aria-pressed={!dark} onClick={() => pick(false)}>Light</button>
        <button type="button" aria-pressed={dark} onClick={() => pick(true)}>Dark</button>
      </div>
    </div>
    <div className="rfaw-theme-shot">
      <Browser>
        <div className="rfaw-theme-stack" data-zoom-group="">
          <img src={rfaShot('review')} width="1800" height="1125" alt="The review popover in the light theme" className={dark ? '' : 'is-on'} loading="lazy" decoding="async"
            {...(dark ? {'data-zoom': '', 'aria-hidden': true} : zoomable('Check designs in the light theme'))}/>
          <img src={rfaShot('review-dark')} width="1800" height="1125" alt="The review popover in the dark theme" className={dark ? 'is-on' : ''} loading="lazy" decoding="async"
            {...(dark ? zoomable('Check designs in the dark theme') : {'data-zoom': '', 'aria-hidden': true})}/>
        </div>
      </Browser>
    </div>
  </div>;
}

export function AgentSide() {
  return <div className="rfaw-agent">
    <div className="rfaw-agent-grid">
      <figure data-jay=".94,.06"><div className="rfaw-agent-img"><img src={`${A}agent-designer.webp`} width="775" height="825" loading="lazy" decoding="async"
        alt="Figma's Agents tab: the note says Home has 3 unbound values and asks which variable FFFFFF should use as a frame fill"
        {...zoomable("Figma's Agents tab: the note says Home has 3 unbound values and asks which variable FFFFFF should use as a frame fill")}/></div>
        <figcaption className="rfaw-caption"><span>Designer: the Agents tab, inside the editor.</span></figcaption></figure>
      <figure><div className="rfaw-agent-img is-dark"><img src={`${A}agent-terminal.webp`} width="1400" height="965" loading="lazy" decoding="async"
        alt="A Claude Code session: get_design_context returns a readiness note listing 3 unbound values, then the agent asks which variable FFFFFF should use as a frame fill"
        {...zoomable("A Claude Code session: get_design_context returns a readiness note listing 3 unbound values, then the agent asks which variable FFFFFF should use as a frame fill")}/></div>
        <figcaption className="rfaw-caption"><span>Agent: a Claude Code session calling get_design_context (my mock of the response).</span></figcaption></figure>
    </div>
    <blockquote className="rfaw-quote" data-agent="Agent note">
      <p>“Home has 3 unbound values: FFFFFF as frame fill and FFFFFF as text each match more than one; C9A66B matches none. I’ll use variables where they’re bound and ask about the rest instead of inventing names.”</p>
      <footer>The agent’s note, generated from the same summary as the designer’s row</footer>
    </blockquote>
  </div>;
}

/** The live prototype, life-size in the last frame: tasks along the top, the editor below at the frame's width. */
export function LiveEditor({tasks, reduced, head}) {
  const live = !useMedia(PHONE);
  const [state, setState] = useState({task: null, screen: 'row', reload: 0});
  const run = (task, i) => { setState(s => ({task: i, screen: task.screen, reload: s.reload + 1})); setOn(true); };
  const reset = () => setState(s => ({task: null, screen: 'row', reload: s.reload + 1}));
  const current = state.task == null ? null : tasks[state.task];
  // like an embedded file: the editor takes the wheel and the pointer only after you click into it
  const [on, setOn] = useState(false);
  const device = useRef(null);
  const activate = () => { setOn(true); requestAnimationFrame(() => device.current?.querySelector('iframe')?.focus()); };
  return <div className="rfaw-live">
    <div className="rfaw-live-top">
      {head}
      <div className="rfaw-live-side">
        <ol className="rfaw-tasks" aria-label="Things to try">
          {tasks.map((task, i) => <li key={task.id}>
            {live ? <button type="button" className={`rfaw-task${state.task === i ? ' is-current' : ''}`} aria-pressed={state.task === i} onClick={() => run(task, i)} data-agent="Task">
              <span className="rfaw-task-n">{i + 1}</span><span>{task.title}</span></button>
              : <p className="rfaw-task is-static"><span className="rfaw-task-n">{i + 1}</span><span>{task.title}</span></p>}
          </li>)}
        </ol>
        {live ? <div className="rfaw-live-tools">
          <button type="button" className="rfaw-btn" onClick={reset}><FigIcon name="reset"/>Reset the prototype</button>
          <a className="rfaw-btn is-quiet" href={RFA_KIT.url(current?.screen || 'row')} target="_blank" rel="noopener"><FigIcon name="arrow-up-right"/>Open it in a new tab<span className="v2-sr"> (opens in a new tab)</span></a>
        </div> : null}
        <p className="rfaw-live-hint" aria-live="polite">{live ? (current?.hint || 'Pick a task, or click around: Check, Apply and Undo all work. Everything runs in your browser.') : 'The prototype is a desktop editor. Open this page on a screen at least 1024 px wide to try it.'}</p>
      </div>
    </div>
    <div ref={device} className={`rfaw-live-device${on || !live ? ' is-on' : ''}`} data-jay=".5,.02" onPointerLeave={e => { if (e.pointerType === 'mouse') setOn(false); }}>
      {live && !on ? <button type="button" className="rfaw-live-cover" onClick={activate} aria-label="Use the editor"><span><FigIcon name="move"/>Click to use the editor</span></button> : null}
      <Browser label="Ready for agents prototype">
        <ProtoScreen kit={RFA_KIT} screen={state.screen} reload={state.reload} load={live ? 'near' : 'never'} interactive={live}
          reduced={reduced} title="Ready for agents prototype, live and clickable" alt={live ? '' : 'Ready for agents prototype, first screen'}/>
      </Browser>
    </div>
  </div>;
}
