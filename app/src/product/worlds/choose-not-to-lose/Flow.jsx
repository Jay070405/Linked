import {useLayoutEffect, useRef, useState} from 'react';
import {gsap, ScrollTrigger, scrollerOf} from '../../v2/motion';
import {CNTL_PAGE_KIT, ProtoScreen} from '../../v2/Device';
import {zoomable} from '../../v2/zoom';
import {L, useCaseLang} from '../../i18n';
import {Window} from './Window';

const T = {
  step: (i, n) => L(`Step ${i} of ${n}`, `第 ${i} 步，共 ${n} 步`),
  showing: (i, label) => L(`Prototype showing step ${i}: ${label.en}`, `原型正在显示第 ${i} 步：${label.zh}`),
  title: L('Choose Not to Lose prototype, following the steps', 'Choose Not to Lose 原型，跟随步骤移动'),
  rail: L('Steps of the redesign', '重新设计的步骤'),
  note: L('The live prototype, moved by your scroll.', '真实原型，随你的滚动移动。'),
};

/* The redesign, step by step (D4 world). On wide screens the steps print down the receipt while the live prototype
   lies on the desk beside it, held in view (CSS sticky); as a step crosses the middle of the screen the prototype
   moves to that state and its camera frames the part the step is about (ProtoScreen from the shared kit, imported
   as is). Narrow screens and the plain reading mode print each step with its own capture instead.
   (Re-skin of v2/Scrolly.jsx: the same steps, data and prototype states.) */

function StepText({step, i, n}) {
  const {t} = useCaseLang();
  return <>
    <p className="cnr-step-n">{t(T.step(i + 1, n))}<span className="cnr-step-label">{t(step.label)}</span></p>
    <h3 className="cnr-step-title">{t(step.title)}</h3>
    <div className="cnr-step-body"><p>{t(step.body)}</p></div>
  </>;
}

/** Wide screens: the steps (paper) and the pinned prototype (desk) are the two cells of one receipt row. */
export function useFlow(steps, still) {
  const [active, setActive] = useState(0);
  const list = useRef(null);
  useLayoutEffect(() => {
    const node = list.current;
    if (!node) return undefined;
    const ctx = gsap.context(() => {
      const scroller = scrollerOf(node);
      node.querySelectorAll('[data-step]').forEach((el, i) => ScrollTrigger.create({
        trigger: el, scroller, start: 'top 55%', end: 'bottom 55%',
        onToggle: self => { if (self.isActive) setActive(i); },
      }));
    }, node);
    return () => ctx.revert();
  }, [steps, still]);
  return {active, list, setActive};
}

export function FlowSteps({steps, flow}) {
  const {active, list} = flow;
  return <ol ref={list} className="cnr-steps">
    {steps.map((s, i) => <li key={s.id} data-step={i} className={`cnr-step${i === active ? ' is-active' : ''}`} aria-current={i === active ? 'step' : undefined} data-print="">
      <StepText step={s} i={i} n={steps.length}/>
    </li>)}
  </ol>;
}

export function FlowDevice({steps, flow, still}) {
  const {t} = useCaseLang();
  const {active} = flow;
  const step = steps[active];
  const jump = (i, e) => flow.list.current?.querySelector(`[data-step="${i}"]`)?.scrollIntoView({behavior: still || e?.detail === 0 ? 'auto' : 'smooth', block: 'center'});
  return <div className="cnr-flow-device">
    <Window label={t(T.showing(active + 1, step.label))}>
      <ProtoScreen kit={CNTL_PAGE_KIT} screen={step.screen} camera={step.camera} load="near" reduced={still}
        title={t(T.title)} alt={t(step.alt)}/>
    </Window>
    <nav className="cnr-flow-rail" aria-label={t(T.rail)}>
      <ol>{steps.map((s, i) => <li key={s.id}>
        <button type="button" className={i === active ? 'is-active' : ''} aria-current={i === active ? 'step' : undefined} onClick={e => jump(i, e)}>
          <span className="cnr-flow-rail-n" aria-hidden="true">{i + 1}</span><span>{t(s.label)}</span>
        </button>
      </li>)}</ol>
    </nav>
    <p className="cnr-desk-note">{t(T.note)}</p>
  </div>;
}

/** Narrow screens and plain mode: each step printed with its capture. */
export function FlowPrinted({steps}) {
  const {t, lang} = useCaseLang();
  return <ol className="cnr-steps is-printed">
    {steps.map((s, i) => <li key={s.id} className="cnr-step" data-print="">
      <StepText step={s} i={i} n={steps.length}/>
      <div className="cnr-step-shot" {...zoomable(t(s.alt), {src: CNTL_PAGE_KIT.shot(s.screen), w: CNTL_PAGE_KIT.shotW, h: CNTL_PAGE_KIT.shotH, lang})}>
        <Window small>
          <ProtoScreen kit={CNTL_PAGE_KIT} screen={s.screen} camera={s.phoneCamera || s.camera} load="never" reduced alt={t(s.alt)}/>
        </Window>
      </div>
    </li>)}
  </ol>;
}
