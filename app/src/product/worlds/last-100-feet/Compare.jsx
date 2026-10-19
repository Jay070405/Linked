import {useRef, useState} from 'react';
import {gsap} from '../../v2/motion';

/* Round 1 against round 2, one screen at a time (v2/BeforeAfter.jsx, re-skinned): drag across the phone to move the
   split. The earlier round sits on top, clipped to the left of the handle. Pointer: press anywhere on the screen and
   drag sideways; a tap glides the handle there; a vertical swipe still scrolls the page. Keyboard and screen readers:
   a real range input. Switching screens keeps the handle where it is. */
export default function Compare({pairs, reduced = false, label = 'Compare round 1 with round 2'}) {
  const [index, setIndex] = useState(0);
  const pair = pairs[index];
  const stage = useRef(null), tween = useRef(null), drag = useRef(null), box = useRef({v: 50});
  const [pos, setPos] = useState(50);
  const set = v => { box.current.v = v; setPos(v); };
  const at = e => { const r = stage.current.getBoundingClientRect(); return Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); };
  const glide = v => {
    tween.current?.kill();
    if (reduced) { set(v); return; }
    tween.current = gsap.to(box.current, {v, duration: .22, ease: 'v2out', onUpdate: () => setPos(box.current.v)});
  };
  const down = e => { if (e.button === 0) drag.current = {x: e.clientX, y: e.clientY, id: e.pointerId, moved: false}; };
  const move = e => {
    const d = drag.current; if (!d || d.id !== e.pointerId) return;
    if (!d.moved) {
      const dx = Math.abs(e.clientX - d.x), dy = Math.abs(e.clientY - d.y);
      if (dy > dx && dy > 6) { drag.current = null; return; }
      if (dx < 4) return;
      d.moved = true; stage.current.setPointerCapture(e.pointerId); tween.current?.kill();
    }
    set(at(e));
  };
  const up = e => { const d = drag.current; drag.current = null; if (d && !d.moved && d.id === e.pointerId) glide(at(e)); };
  const share = Math.round(pos);
  return <figure className="w3-compare">
    <div className="w3-tabs" role="group" aria-label="Screen to compare">
      {pairs.map((p, i) => <button key={p.id} type="button" aria-pressed={i === index} onClick={() => setIndex(i)}>{p.tab}</button>)}
    </div>
    <div className="w3-phone is-compare">
      <div className="w3-phone-screen">
        <div ref={stage} className="w3-ba" style={{'--pos': `${pos}%`}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; }}>
          <img key={`a-${pair.id}`} className="w3-ba-img" src={pair.after.src} alt="" width="780" height="1688" draggable="false" decoding="async"/>
          <img key={`b-${pair.id}`} className="w3-ba-img is-top" src={pair.before.src} alt="" width="780" height="1688" draggable="false" decoding="async"/>
          <span className="w3-ba-tag is-before" aria-hidden="true" style={{opacity: pos < 12 ? 0 : 1}}>{pair.before.label}</span>
          <span className="w3-ba-tag is-after" aria-hidden="true" style={{opacity: pos > 88 ? 0 : 1}}>{pair.after.label}</span>
          <input className="w3-ba-input" type="range" min="0" max="100" step="1" value={share} aria-label={`${label}: ${pair.tab}`}
            aria-valuetext={`${share}% ${pair.before.label}, ${100 - share}% ${pair.after.label}`}
            onChange={e => { tween.current?.kill(); set(Number(e.target.value)); }}/>
          <span className="w3-ba-handle" aria-hidden="true"><span className="w3-ba-knob">
            <svg viewBox="0 0 20 20" width="18" height="18"><path d="M7.5 5 3 10l4.5 5M12.5 5 17 10l-4.5 5"/></svg>
          </span></span>
        </div>
      </div>
    </div>
    <figcaption className="w3-small">{pair.caption}</figcaption>
  </figure>;
}
