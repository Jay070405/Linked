import {useEffect, useRef, useState} from 'react';
import {PROJECTS, pick} from '../onestroke/content';
import './systems-index.css';

const T = (zh, en) => ({zh, en});
const COPY = {
  label: T('01 / SYSTEMS — 系统策划', '01 / SYSTEMS — Systems design'),
  lead: T('规则、目标与反馈。', 'Rules, goals and feedback.'),
  body: T('我拆开现有的系统，找到玩家理解断开的地方，提出改动，再把它做成可以试玩、可以验证的原型。',
    'I take existing systems apart, find where players stop following them, propose changes, and build prototypes you can play and test.'),
  hint: T('悬停预览 · 点击进入', 'Hover to preview · click to enter'),
  soon: T('筹备中', 'In progress'),
  footLead: T('另一半，是画面。', 'The other half is pictures.'),
  footLink: T('美术作品 ↗', 'Visual worlds ↗'),
};
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const pad = n => String(n).padStart(2, '0');

/** The systems collection: every systems project in one list. A row answers the pointer with its picture, which follows
    the pointer like a card held up to the light; the list dims around the row you are on. Reduced motion and touch screens
    get the pictures inline instead. */
export default function SystemsIndex({lang = 'zh', reduced = false, onNavigate}) {
  const en = lang === 'en', L = v => pick(v, lang);
  const [hover, setHover] = useState(-1);
  const card = useRef(null);
  const ready = PROJECTS.filter(p => p.ready).length, soon = PROJECTS.length - ready;

  // the picture card trails the pointer on its own easing and leans with the pointer's speed
  useEffect(() => {
    const el = card.current;
    if (!el || reduced || !matchMedia('(pointer: fine)').matches) return undefined;
    let raf = 0, last = 0, x = innerWidth * 0.62, y = innerHeight * 0.5, tx = x, ty = y, lean = 0;
    const tick = t => {
      const dt = Math.min(0.05, (t - (last || t)) / 1000) || 0.016; last = t;
      const k = 1 - Math.exp(-dt / 0.11), nx = x + (tx - x) * k;
      lean += (clamp((nx - x) / dt * 0.0045, -7, 7) - lean) * (1 - Math.exp(-dt / 0.09));
      x = nx; y += (ty - y) * k;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) rotate(${lean.toFixed(2)}deg)`;
      el.classList.toggle('is-left', tx > innerWidth - Math.min(560, innerWidth * 0.3));   // near the right edge it hangs on the other side
      raf = Math.abs(tx - x) + Math.abs(ty - y) + Math.abs(lean) > 0.05 ? requestAnimationFrame(tick) : 0;
      if (!raf) last = 0;
    };
    const move = e => { tx = e.clientX; ty = e.clientY; if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener('pointermove', move, {passive: true});
    return () => { removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, [reduced]);

  const open = (e, p) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault(); onNavigate?.(`/systems/${p.item.slug}`);
  };
  const toWorks = e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; e.preventDefault(); onNavigate?.('/works'); };

  return <div className={`si-page${reduced ? ' si-still' : ''}${hover >= 0 ? ' is-hovering' : ''}`} data-nav-tone="dark" lang={en ? 'en' : 'zh-CN'}>
    <header className="si-head">
      <p className="si-label">{L(COPY.label)}</p>
      <h1 className="si-title">
        <span className="si-sr">{en ? 'Systems design' : '系统策划'}</span>
        <svg viewBox="0 0 1320 250" aria-hidden="true"><text x="4" y="226" textLength="1310" lengthAdjust="spacingAndGlyphs">SYSTEMS</text></svg>
      </h1>
      <i className="si-rule" aria-hidden="true"/>
      <div className="si-intro">
        <p className="si-lead">{L(COPY.lead)}</p>
        <p className="si-body">{L(COPY.body)}</p>
        <p className="si-stats"><b>{pad(ready)}</b> {en ? 'PROJECTS' : '个项目'} <span>·</span> <b>{pad(soon)}</b> {en ? 'IN PROGRESS' : '筹备中'} <span>·</span> {L(COPY.hint)}</p>
      </div>
    </header>

    <ol className="si-list" onPointerLeave={() => setHover(-1)}>
      {PROJECTS.map((p, i) => {
        const inner = <>
          <span className="si-no"><b>{pad(i + 1)}</b>/ {pad(PROJECTS.length)}</span>
          <span className="si-name"><b className={p.serif ? 'is-serif' : ''}>{L(p.title)}</b><small>{L(p.sub)}</small></span>
          <span className="si-meta"><span className="si-cat">{p.cat}</span><span className="si-desc">{L(p.desc)}</span>
            <span className="si-tags">{p.tags.map(t => <i key={L(t)}>{L(t)}</i>)}</span></span>
          <span className="si-cta">{p.ready ? L(p.cta) : L(COPY.soon)}<b aria-hidden="true">{p.ready ? '↗' : '—'}</b></span>
          {p.tex ? <img className="si-thumb" src={p.tex} alt="" loading="lazy" decoding="async"/> : <span className="si-thumb si-thumb--soon" aria-hidden="true"><em>{L(p.title)}</em></span>}
          <i className="si-line" aria-hidden="true"/>
        </>;
        const hoverProps = {onPointerEnter: () => setHover(i), onFocus: () => setHover(i), onBlur: () => setHover(-1)};
        return <li key={p.id} className={`si-row${p.ready ? '' : ' is-soon'}${hover === i ? ' is-on' : ''}`} style={{'--i': i}}>
          {p.ready
            ? <a href={`/systems/${p.item.slug}`} onClick={e => open(e, p)} {...hoverProps}>{inner}</a>
            : <div className="si-soon" tabIndex={0} aria-disabled="true" {...hoverProps}>{inner}</div>}
        </li>;
      })}
    </ol>

    <div className={`si-card${hover >= 0 ? ' is-on' : ''}`} ref={card} aria-hidden="true">
      <div className="si-card-in">
        {PROJECTS.map((p, i) => <figure key={p.id} className={hover === i ? 'is-on' : ''}>
          {p.tex ? <img src={p.tex} alt="" decoding="async"/> : <span className="si-card-soon"><em>{L(p.title)}</em><small>COMING SOON</small></span>}
          <figcaption>{pad(i + 1)} · {p.cat}</figcaption>
        </figure>)}
      </div>
    </div>

    <footer className="si-foot">
      <span>JAY LIN / SYSTEMS</span>
      <p>{L(COPY.footLead)}</p>
      <a href="/works" onClick={toWorks}>{L(COPY.footLink)}</a>
    </footer>
  </div>;
}
