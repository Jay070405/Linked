import {useRef, useState} from 'react';
import {gsap} from './motion';
import {Phone} from './Device';

/** Drag to compare two versions of one screen. The earlier version sits on top, clipped (clip-path) to the left of
    the handle. Pointer: press anywhere on the screen and drag sideways; a tap glides the handle there. Keyboard and
    screen readers: a real range input (arrow keys, Home/End). Vertical page scrolling still works on touch. */
export default function BeforeAfter({id, heading, lede, before, after, children, reduced = false, label = 'Compare the two versions'}) {
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
  return <section className="v2-compare" aria-labelledby={`${id}-title`}>
    <div className="v2-section-head" data-reveal="">
      <h2 id={`${id}-title`} className="v2-h2">{heading}</h2>
      {lede ? <p className="v2-lede">{lede}</p> : null}
    </div>
    <div className="v2-compare-body">
      <figure className="v2-compare-figure" data-reveal="">
        <Phone>
          <div ref={stage} className="v2-ba" style={{'--pos': `${pos}%`}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; }}>
            <img className="v2-ba-img" src={after.src} alt="" width={780} height={1688} draggable="false"/>
            <img className="v2-ba-img v2-ba-top" src={before.src} alt="" width={780} height={1688} draggable="false"/>
            <span className="v2-ba-tag is-before" aria-hidden="true" style={{opacity: pos < 12 ? 0 : 1}}>{before.label}</span>
            <span className="v2-ba-tag is-after" aria-hidden="true" style={{opacity: pos > 88 ? 0 : 1}}>{after.label}</span>
            <input className="v2-ba-input" type="range" min="0" max="100" step="1" value={share} aria-label={label}
              aria-valuetext={`${share}% ${before.label}, ${100 - share}% ${after.label}`}
              onChange={e => { tween.current?.kill(); set(Number(e.target.value)); }}/>
            <span className="v2-ba-handle" aria-hidden="true"><span className="v2-ba-knob">
              <svg viewBox="0 0 20 20" width="18" height="18"><path d="M7.5 5 3 10l4.5 5M12.5 5 17 10l-4.5 5"/></svg>
            </span></span>
          </div>
        </Phone>
        <figcaption className="v2-caption">{before.caption} {after.caption}</figcaption>
      </figure>
      <div className="v2-compare-text" data-reveal="">{children}</div>
    </div>
  </section>;
}
