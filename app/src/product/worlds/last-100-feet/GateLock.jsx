import {useEffect, useRef, useState} from 'react';
import {scrollerOf} from '../../v2/motion';
import {ADDRESS, GEOFENCE_FT, HOLD_MS, REVEAL_SECONDS} from '../../v2/data/l100-route';
import {StopGlyph} from './Hud';
import {bag} from './walk';

/* Signature moment 1: the walk stops at the Elm St gate. The page holds its scroll at the gate until the visitor
   shows the code the way the prototype's courier does (hold the red button 0.9 s, or tap with "Tap instead of
   hold"); then the code shows in keypad order, the gate swings open and the walk continues. "Skip the gate" is
   always visible, a jump from a link or the route rail passes straight through, and with reduced motion or in the
   reading mode nothing holds the scroll: the gate is just a thing to try. The bag cools a little while you wait. */

const Lock = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/></svg>;

export default function GateLock({reduced, plain, state, onOpen, onSkip}) {
  const sec = useRef(null), btn = useRef(null), timer = useRef(0), since = useRef(0);
  const [tap, setTap] = useState(false);
  const [holding, setHolding] = useState(false);
  const [shown, setShown] = useState(false);       // the code is on screen
  const [seen, setSeen] = useState(false);
  const [left, setLeft] = useState(REVEAL_SECONDS);
  const [hiding, setHiding] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const enforce = state === 'closed' && !reduced && !plain;
  const open = state !== 'closed';

  // the lock: hold the scroll at the gate until it opens
  useEffect(() => {
    if (!enforce) return undefined;
    const node = sec.current, scroller = scrollerOf(node), win = scroller === window;
    const getY = () => (win ? scrollY : scroller.scrollTop);
    const view = () => (win ? innerHeight : scroller.clientHeight);
    const lockY = () => node.getBoundingClientRect().top - (win ? 0 : scroller.getBoundingClientRect().top) + getY();
    let last = getY(), keyed = false;
    const engage = () => {
      if (since.current) return;
      since.current = performance.now();
      setEngaged(true);
      if (keyed) btn.current?.focus({preventScroll: true});
    };
    const atGate = () => getY() >= lockY() - 4;
    const onScroll = () => {
      const y = getY(), ly = lockY();
      if (y > ly + 2) {
        // a jump from far above (a link, find in page) passes through: that is a skip, not a walk
        if (y - last > view() * 1.6) { onSkip('jump'); return; }
        if (win) scrollTo(0, ly); else scroller.scrollTop = ly;
        engage();
      } else if (y >= ly - 4) engage();
      last = getY();
    };
    const wheel = e => { if (e.deltaY > 0 && atGate()) { e.preventDefault(); engage(); } };
    let ty = 0;
    const touchStart = e => { ty = e.touches[0]?.clientY ?? 0; };
    const touchMove = e => { if ((e.touches[0]?.clientY ?? 0) < ty - 2 && atGate()) { e.preventDefault(); engage(); } };
    const key = e => {
      keyed = true;
      if (!['PageDown', ' ', 'ArrowDown', 'End'].includes(e.key) || e.target.closest?.('input,textarea,select,button,a,[contenteditable]')) return;
      if (atGate()) { e.preventDefault(); engage(); }
    };
    const pointer = () => { keyed = false; };
    const target = win ? window : scroller;
    target.addEventListener('scroll', onScroll, {passive: true});
    target.addEventListener('wheel', wheel, {passive: false});
    target.addEventListener('touchstart', touchStart, {passive: true});
    target.addEventListener('touchmove', touchMove, {passive: false});
    addEventListener('keydown', key);
    addEventListener('pointerdown', pointer);
    onScroll();
    return () => {
      target.removeEventListener('scroll', onScroll); target.removeEventListener('wheel', wheel);
      target.removeEventListener('touchstart', touchStart); target.removeEventListener('touchmove', touchMove);
      removeEventListener('keydown', key); removeEventListener('pointerdown', pointer);
    };
  }, [enforce, onSkip]);

  // waiting at the gate cools the bag (illustrative), down to a point
  useEffect(() => {
    if (!engaged || open) return undefined;
    const t = setInterval(() => { if (bag.get().warmth > .5) bag.cool(.004, 'Waited at the gate'); }, 330);
    return () => clearInterval(t);
  }, [engaged, open]);

  // the prototype's 20-second reveal, then the code hides; one tap brings it back
  useEffect(() => {
    if (!shown) return undefined;
    setLeft(REVEAL_SECONDS); setHiding(false);
    const t = setInterval(() => setLeft(v => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [shown]);
  useEffect(() => {
    if (!shown || left > 0) return undefined;
    setHiding(true);
    const t = setTimeout(() => setShown(false), reduced ? 0 : 220);
    return () => clearTimeout(t);
  }, [left, shown, reduced]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const reveal = () => {
    setShown(true); setSeen(true);
    if (!open) {
      const s = since.current ? Math.max(1, Math.round((performance.now() - since.current) / 1000)) : null;
      bag.set({gateSeconds: s});
      onOpen(s);
    }
  };
  const start = () => { if (holding) return; setHolding(true); timer.current = setTimeout(() => { setHolding(false); reveal(); }, HOLD_MS); };
  const cancel = () => { clearTimeout(timer.current); setHolding(false); };
  const quick = tap || seen;
  const label = seen ? 'Show code again' : tap ? 'Show gate code' : 'Hold to show gate code';
  const secs = bag.get().gateSeconds;

  return <section ref={sec} id="w3-gate" className={`w3-lock${open ? ' is-open' : ''}${engaged ? ' is-engaged' : ''}`} data-stop="1" data-zoom=".74" aria-labelledby="w3-gate-title">
    <div className="w3-col w3-lock-col">
      <p className="w3-step"><StopGlyph i={1}/><span>Step 2 of 5, Elm St gate</span></p>
      <h2 id="w3-gate-title" className="w3-h2" tabIndex={-1}>{open ? 'The gate is open' : 'The gate is locked'}</h2>
      <p className="w3-lede">{open
        ? state === 'skipped' ? 'You skipped the gate. A courier can’t: they need the code, and the prototype gives it to them like this.'
          : `${secs ? `Through in ${secs} s. ` : ''}The code came from the order; standing at the gate only revealed it.`
        : 'Hot bag in one hand, phone in the other. In the door route the code is part of the order; walking up to the gate only reveals it.'}</p>

      <div className="w3-gatebox" aria-live="polite">
        {shown ? <div className="w3-code" data-hiding={hiding || undefined}>
          <p className="w3-code-label">Enter on the call box</p>
          <div className="w3-keys" role="img" aria-label={`Gate code ${ADDRESS.code.split('').join(' ')}, then pound`}>
            {[...ADDRESS.code, '#'].map((d, i) => <span key={i} className="w3-key" data-pound={d === '#' || undefined} style={{'--i': i}} aria-hidden="true">{d}</span>)}
          </div>
          <div className="w3-timer">
            <span className="w3-bar" aria-hidden="true"><span style={{animationDuration: `${REVEAL_SECONDS}s`}}/></span>
            <span className="w3-left">Hides in {left} s</span>
          </div>
        </div> : <button ref={btn} type="button" className={`w3-hold${holding ? ' is-holding' : ''}`} style={{'--hold': `${HOLD_MS}ms`}}
          aria-label={quick ? label : `${label}. Press and hold.`}
          onClick={quick ? reveal : undefined}
          onPointerDown={quick ? undefined : e => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* released */ } start(); }}
          onPointerUp={quick ? undefined : cancel} onPointerCancel={quick ? undefined : cancel} onContextMenu={e => e.preventDefault()}
          onKeyDown={quick ? undefined : e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start(); } }}
          onKeyUp={quick ? undefined : e => { if (e.key === ' ' || e.key === 'Enter') cancel(); }} onBlur={cancel}>
          <span className="w3-hold-face"><Lock/>{label}</span>
          {quick ? null : <span className="w3-hold-fill" aria-hidden="true"><Lock/>{label}</span>}
        </button>}
      </div>

      <div className="w3-lock-tools">
        <label className="w3-tap"><input type="checkbox" checked={tap} onChange={e => setTap(e.target.checked)}/>Tap instead of hold <small>for gloves or switch control</small></label>
        {state === 'closed' && enforce ? <button type="button" className="w3-textbtn" onClick={() => onSkip('button')}>Skip the gate</button> : null}
      </div>
      <p className="w3-small">The prototype’s gate step: a {GEOFENCE_FT} ft circle (about 50 m) around the gate, a 0.9-second hold, a code that hides after 20 seconds.{open ? ' Keep scrolling: the walk goes on through the courtyard.' : enforce ? ' The walk continues once the gate opens.' : ''}</p>
    </div>
  </section>;
}
