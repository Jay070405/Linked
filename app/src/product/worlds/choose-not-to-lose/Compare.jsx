import {useRef, useState} from 'react';
import {gsap} from '../../v2/motion';

/* Before and after (D4 world): drag to compare two versions of the same page, laid on the desk like two printouts,
   the earlier one on top and torn back to the handle (clip-path). Pointer: press anywhere and drag sideways; a tap
   glides the handle there. Keyboard and screen readers: a real range input. Vertical page scrolling still works on
   touch. Switching pairs keeps the handle where it is. (Re-skin of v2/BeforeAfter.jsx: the same pairs.) */
export default function Compare({pairs, still = false, label = 'Compare the two versions'}) {
  const [index, setIndex] = useState(0);
  const pair = pairs[index];
  const stage = useRef(null), tween = useRef(null), drag = useRef(null), box = useRef({v: 50});
  const [pos, setPos] = useState(50);
  const set = v => { box.current.v = v; setPos(v); };
  const at = e => { const r = stage.current.getBoundingClientRect(); return Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100)); };
  const glide = v => {
    tween.current?.kill();
    if (still) { set(v); return; }
    tween.current = gsap.to(box.current, {v, duration: .22, ease: 'v2out', onUpdate: () => setPos(box.current.v)});
  };
  const down = e => { if (e.button !== 0) return; drag.current = {x: e.clientX, y: e.clientY, id: e.pointerId, moved: false}; };
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
  const [w, h] = pair.size;
  return <figure className="cnr-cmp">
    <div className="cnr-cmp-tabs" role="group" aria-label="Pages to compare">
      {pairs.map((p, i) => <button key={p.id} type="button" aria-pressed={i === index} onClick={() => setIndex(i)}>{p.tab}</button>)}
    </div>
    <div className="cnr-cmp-sheet" style={{aspectRatio: pair.ratio}}>
      <div ref={stage} className="cnr-cmp-stage" style={{'--pos': `${pos}%`}} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={() => { drag.current = null; }}>
        <img key={`a-${pair.id}`} className="cnr-cmp-img" src={pair.after.src} alt="" width={w} height={h} draggable="false" decoding="async" loading="lazy"/>
        <img key={`b-${pair.id}`} className="cnr-cmp-img is-top" src={pair.before.src} alt="" width={w} height={h} draggable="false" decoding="async" loading="lazy"/>
        <span className="cnr-cmp-tag is-before" aria-hidden="true" style={{opacity: pos < 14 ? 0 : 1}}>{pair.before.label}</span>
        <span className="cnr-cmp-tag is-after" aria-hidden="true" style={{opacity: pos > 86 ? 0 : 1}}>{pair.after.label}</span>
        <input className="cnr-cmp-input" type="range" min="0" max="100" step="1" value={share}
          aria-label={`${label}: ${pair.tab}`} aria-valuetext={`${share}% ${pair.before.label}, ${100 - share}% ${pair.after.label}`}
          onChange={e => { tween.current?.kill(); set(Number(e.target.value)); }}/>
        <span className="cnr-cmp-handle" aria-hidden="true"><span className="cnr-cmp-knob">
          <svg viewBox="0 0 20 20" width="16" height="16"><path d="M7.5 5 3 10l4.5 5M12.5 5 17 10l-4.5 5"/></svg>
        </span></span>
      </div>
    </div>
    <figcaption className="cnr-desk-note">{pair.caption}</figcaption>
  </figure>;
}
