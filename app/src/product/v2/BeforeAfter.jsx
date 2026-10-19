import {useRef, useState} from 'react';
import {gsap} from './motion';
import {Phone} from './Device';

/** The phone (round-2 screens draw their own status bar and island) or a plain panel for desktop UI. */
function Holder({frame, ratio, children}) {
  if (frame === 'phone') return <Phone>{children}</Phone>;
  return <div className="v2-ba-panel" style={{aspectRatio: ratio}}>{children}</div>;
}

/** Drag to compare two versions of one screen. The earlier version sits on top, clipped (clip-path) to the left of
    the handle. Pointer: press anywhere on the screen and drag sideways; a tap glides the handle there. Keyboard and
    screen readers: a real range input (arrow keys, Home/End). Vertical page scrolling still works on touch.
    `wide` gives a whole desktop page the full measure, with the text below it. `pairs` compares several states, one at a time ({id, tab, before, after, caption, ratio?, size?}); switching keeps
    the handle where it is, so the same split reads across states. A single `before`/`after` still works. */
export default function BeforeAfter({id, heading, lede, pairs, before, after, children, reduced = false, label = 'Compare the two versions', frame = 'phone', ratio = '780 / 1688', size = [780, 1688], wide = false}) {
  const list = pairs || [{id: 'only', before, after, caption: `${before.caption} ${after.caption}`}];
  const [index, setIndex] = useState(0);
  const pair = list[index];
  const stage = useRef(null), tween = useRef(null), drag = useRef(null);
  const [pos, setPos] = useState(50);
  const box = useRef({v: 50});
  const set = v => { box.current.v = v; setPos(v); };
  const at = e => { const r = stage.current.getBoundingClientRect(); return Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); };
  const glide = v => {
    tween.current?.kill();
    if (reduced) { set(v); return; }
    tween.current = gsap.to(box.current, {v, duration: .22, ease: 'v2out', onUpdate: () => setPos(box.current.v)});
  };
  const down = e => {
    if (e.button !== 0) return;
    drag.current = {x: e.clientX, y: e.clientY, id: e.pointerId, moved: false};
  };
  const move = e => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      const dx = Math.abs(e.clientX - d.x), dy = Math.abs(e.clientY - d.y);
      if (dy > dx && dy > 6) { drag.current = null; return; }       // a vertical swipe scrolls the page
      if (dx < 4) return;
      d.moved = true; stage.current.setPointerCapture(e.pointerId); tween.current?.kill();
    }
    set(at(e));
  };
  const up = e => {
    const d = drag.current; drag.current = null;
    if (d && !d.moved && d.id === e.pointerId) glide(at(e));
  };
  const share = Math.round(pos);
  const [w, h] = pair.size || size;
  return <section className="v2-compare" aria-labelledby={`${id}-title`}>
    <div className="v2-section-head" data-reveal="">
      <h2 id={`${id}-title`} className="v2-h2">{heading}</h2>
      {lede ? <p className="v2-lede">{lede}</p> : null}
    </div>
    <div className={`v2-compare-body${frame === 'phone' ? '' : ' is-panel'}${wide ? ' is-wide' : ''}`}>
      <figure className={`v2-compare-figure${frame === 'phone' ? '' : ' is-panel'}`} data-reveal="">
        {list.length > 1 ? <div className="v2-ba-tabs" role="group" aria-label="Screen to compare">
          {list.map((p, i) => <button key={p.id} type="button" aria-pressed={i === index} onClick={() => setIndex(i)}>{p.tab}</button>)}
        </div> : null}
        <Holder frame={frame} ratio={pair.ratio || ratio}>
          <div ref={stage} className="v2-ba" style={{'--pos': `${pos}%`}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; }}>
            <img key={`a-${pair.id}`} className="v2-ba-img" src={pair.after.src} alt="" width={w} height={h} draggable="false" decoding="async"/>
            <img key={`b-${pair.id}`} className="v2-ba-img v2-ba-top" src={pair.before.src} alt="" width={w} height={h} draggable="false" decoding="async"/>
            <span className="v2-ba-tag is-before" aria-hidden="true" style={{opacity: pos < 12 ? 0 : 1}}>{pair.before.label}</span>
            <span className="v2-ba-tag is-after" aria-hidden="true" style={{opacity: pos > 88 ? 0 : 1}}>{pair.after.label}</span>
            <input className="v2-ba-input" type="range" min="0" max="100" step="1" value={share}
              aria-label={list.length > 1 ? `${label}: ${pair.tab}` : label}
              aria-valuetext={`${share}% ${pair.before.label}, ${100 - share}% ${pair.after.label}`}
              onChange={e => { tween.current?.kill(); set(Number(e.target.value)); }}/>
            <span className="v2-ba-handle" aria-hidden="true"><span className="v2-ba-knob">
              <svg viewBox="0 0 20 20" width="18" height="18"><path d="M7.5 5 3 10l4.5 5M12.5 5 17 10l-4.5 5"/></svg>
            </span></span>
          </div>
        </Holder>
        <figcaption className="v2-caption">{pair.caption}</figcaption>
      </figure>
      <div className="v2-compare-text" data-reveal="">{children}</div>
    </div>
  </section>;
}

/** What changed between two rounds and why, one line each, from the prototype's own before/after table. */
export function RoundChanges({items, title = 'What changed and why'}) {
  return <div className="v2-changes">
    <h3 className="v2-h3">{title}</h3>
    <ul className="v2-changes-list">
      {items.map(item => <li key={item.what}>
        <p className="v2-change-what">{item.what}</p>
        <p className="v2-change-why">{item.why}</p>
      </li>)}
    </ul>
  </div>;
}
