import {useLayoutEffect, useRef} from 'react';
import {gsap, ScrollTrigger, scrollerOf} from '../../v2/motion';
import {GARAGE_GATE, GATE, GEOFENCE_FT, LEGS, WAYPOINTS} from '../../v2/data/l100-route';
import {DuskPlan, REGION} from './DuskPlan';
import Courier from './Courier';
import {AT_WAYPOINT, ROUTE_D, ROUTE_LEN, TOTAL_FEET, bag, walkAt, waypointFor} from './walk';

/* The world behind the page: the dusk site plan, the route, and the courier, in one sticky viewport-sized stage.
   Scrolling through a [data-leg] block walks that leg; the camera follows the courier (a top-down game camera),
   starting from an overview of the whole complex behind the hero. Everything per-frame is written straight to the
   DOM from one gsap.ticker callback: the plan layer only translates and scales, the courier sprite moves on its own
   layer, and only the small route overlay repaints as the red line grows.
   Reduced motion: the courier appears at each waypoint as you reach it, no walk cycle, no glide. */

const R = REGION;
const GLYPH = ['P', 'gate', '4', 'stairs', '214'];

/** Per breakpoint: px per plan unit at walking zoom, where the courier sits on screen, and the overview. */
export function layoutFor(w, h) {
  if (w >= 1000) return {S: 3, walk: [.7, .58], over: [.68, .5], overAt: {x: 222, y: 278}, oz: Math.min(w * .5 / (430 * 3), h * .86 / (600 * 3)), ahead: 16};
  if (w > 760) return {S: 2.6, walk: [.7, .6], over: [.66, .56], overAt: {x: 222, y: 290}, oz: Math.min(w * .52 / (430 * 2.6), h * .8 / (600 * 2.6)), ahead: 14};
  return {S: 2.4, walk: [.5, .7], over: [.5, .7], overAt: {x: 230, y: 300}, oz: Math.min(w * 1.02 / (420 * 2.4), h * .52 / (560 * 2.4)), ahead: 10};
}

function Token({i, at}) {
  const g = GLYPH[i], wide = g === '214', s = 10, w = wide ? 16 : s, r = 2.8;
  return <g className="w3-token" data-token={i} data-state="upcoming">
    <rect x={at.x - w / 2} y={at.y - s / 2 + .8} width={w} height={s} rx={r} className="w3-token-drop"/>
    <rect x={at.x - w / 2} y={at.y - s / 2} width={w} height={s} rx={r} className="w3-token-face"/>
    {g === 'gate' ? <path className="w3-token-ink" d={`M${at.x - 2.6} ${at.y + 2.6} V${at.y - 2.6} M${at.x + 2.6} ${at.y + 2.6} V${at.y - 2.6} M${at.x - 2.6} ${at.y - 1.4} H${at.x + 2.6} M${at.x - .9} ${at.y - 1.4} V${at.y + 2.6} M${at.x + .9} ${at.y - 1.4} V${at.y + 2.6}`}/>
      : g === 'stairs' ? <path className="w3-token-ink" d={`M${at.x - 2.6} ${at.y + 2.6} H${at.x - .9} V${at.y + .9} H${at.x + .9} V${at.y - .9} H${at.x + 2.6} V${at.y - 2.6}`}/>
      : <text className="w3-token-text" x={at.x} y={at.y + .3} fontSize={wide ? 5.4 : 6.2} textAnchor="middle" dominantBaseline="central">{g}</text>}
  </g>;
}

/** The dynamic overlay on the plan: route ahead and walked, waypoint tokens, the courier's car, the gate leaves,
    the gate's 160 ft circle and the pin map apps drop on the garage. Same coordinates and transform as the plan. */
function RouteLayer({width, height, gateOpen}) {
  const pin = GARAGE_GATE, ph = 15, pr = 4.6;
  return <svg className={`w3-route${gateOpen ? ' is-open' : ''}`} viewBox={`${R.x} ${R.y} ${R.w} ${R.h}`} width={width} height={height} aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="w3-headlight"><stop offset="0" stopColor="#fff1d0" stopOpacity=".6"/><stop offset="1" stopColor="#fff1d0" stopOpacity="0"/></radialGradient>
      <radialGradient id="w3-taillight"><stop offset="0" stopColor="#ff3b1f" stopOpacity=".7"/><stop offset="1" stopColor="#ff3b1f" stopOpacity="0"/></radialGradient>
    </defs>
    {/* the gate's geofence: the code can show inside it */}
    <circle className="w3-fence" cx={GATE.x} cy={GATE.y} r={GEOFENCE_FT}/>
    {/* the courier's car at the verified stop, parked facing west, lights on */}
    <g className="w3-car">
      <path d="M184 458 L138 444 L138 486 L184 470 Z" fill="url(#w3-headlight)" opacity=".7"/>
      <circle cx="229" cy="463.5" r="7" fill="url(#w3-taillight)"/>
      <rect x="190" y="458" width="44" height="17" rx="4" fill="#04060d" opacity=".4"/>
      <rect x="184" y="455" width="44" height="17" rx="4" fill="#4a5168"/>
      <rect x={184 + 44 * .62} y="457.5" width={44 * .17} height="12" rx="1.5" fill="#a9bde34d"/>
      <rect x={184 + 44 * .2} y="457.5" width={44 * .12} height="12" rx="1.5" fill="#a9bde34d"/>
      <rect x="184.6" y="457" width="1.4" height="3" rx=".5" fill="#fff4d6"/><rect x="184.6" y="467" width="1.4" height="3" rx=".5" fill="#fff4d6"/>
      <rect x="226.2" y="457" width="1.4" height="3" rx=".5" fill="#ff4a2e"/><rect x="226.2" y="467" width="1.4" height="3" rx=".5" fill="#ff4a2e"/>
    </g>
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path className="w3-ahead" d={ROUTE_D}/>
      <path className="w3-walked-glow w3-walked" d={ROUTE_D} strokeDasharray={ROUTE_LEN} strokeDashoffset={ROUTE_LEN}/>
      <path className="w3-walked-line w3-walked" d={ROUTE_D} strokeDasharray={ROUTE_LEN} strokeDashoffset={ROUTE_LEN}/>
    </g>
    {/* the pedestrian gate: two leaves that swing in when the code works */}
    <g className="w3-leaves">
      <line className="w3-leaf is-left" x1="213" y1="430.5" x2="226" y2="430.5"/>
      <line className="w3-leaf is-right" x1="239" y1="430.5" x2="226" y2="430.5"/>
    </g>
    {WAYPOINTS.map((w, i) => <Token key={w.key} i={i} at={i === 0 ? {x: 206, y: 463} : w.at}/>)}
    <g className="w3-pin">
      <ellipse cx={pin.x} cy={pin.y} rx="3.4" ry="1.4" fill="#04060d" opacity=".5"/>
      <path d={`M${pin.x} ${pin.y} C${pin.x - 1.4} ${pin.y - ph * .38} ${pin.x - pr} ${pin.y - ph * .5} ${pin.x - pr} ${pin.y - ph + pr} A${pr} ${pr} 0 1 1 ${pin.x + pr} ${pin.y - ph + pr} C${pin.x + pr} ${pin.y - ph * .5} ${pin.x + 1.4} ${pin.y - ph * .38} ${pin.x} ${pin.y} Z`} fill="#8b90a6" stroke="#f2ece0" strokeWidth=".9"/>
      <circle cx={pin.x} cy={pin.y - ph + pr} r="1.7" fill="#f2ece0"/>
    </g>
  </svg>;
}

/**
 * root     the page (the engine finds [data-leg], [data-stop], [data-w3-hero] and [data-count] inside it)
 * size     {w, h} of the viewport, from the page
 * onReach  called with the waypoint index when the courier reaches a new one
 */
export default function Stage({root, size, reduced, gateOpen, onReach, children}) {
  const stage = useRef(null), cam = useRef(null), courier = useRef(null), labels = useRef(null);
  const L = layoutFor(size.w || 1440, size.h || 900);
  const reach = useRef(onReach); reach.current = onReach;

  useLayoutEffect(() => {
    const node = root.current, el = stage.current;
    if (!node || !el) return undefined;
    const scroller = scrollerOf(node);
    const legs = [], stops = [];
    let hero = null;
    const ctx = gsap.context(() => {
      node.querySelectorAll('[data-leg]').forEach(t => {
        legs[+t.dataset.leg] = ScrollTrigger.create({trigger: t, scroller, start: 'top 70%', end: 'bottom 62%'});
      });
      const h = node.querySelector('[data-w3-hero]');
      if (h) hero = ScrollTrigger.create({trigger: h, scroller, start: 'top top', end: 'bottom 30%'});
      node.querySelectorAll('[data-stop]').forEach(t => {
        stops.push({el: t, zoom: Number(t.dataset.zoom || 1), st: ScrollTrigger.create({trigger: t, scroller, start: 'top 64%', end: 'bottom 40%', toggleClass: 'is-here'})});
      });
    }, node);

    const turn = courier.current?.firstElementChild?.nextElementSibling;
    const walked = [...el.querySelectorAll('.w3-walked')];
    const tokens = [...el.querySelectorAll('[data-token]')];
    const counts = [...node.querySelectorAll('[data-count]')];
    const lab = [...(labels.current?.children || [])].map(n => ({n, x: +n.dataset.x, y: +n.dataset.y}));
    const ease = gsap.parseEase('power2.inOut');
    const target = () => legs.reduce((s, t, i) => s + (t ? t.progress : 0) * LEGS[i].feet, 0);
    let shown = target(), angle = walkAt(shown).angle, z = null, zoomMul = 1, acc = 0, still = 0, frame = 'stand', wp = -1;
    let last = {count: counts.map(() => null), stop: null};

    const tick = (_, deltaMs) => {
      const dt = Math.min(.05, (deltaMs || 16) / 1000);
      const W = el.clientWidth, H = el.clientHeight, lay = layoutFor(W, H);
      const want = target();
      const before = shown;
      if (reduced) shown = AT_WAYPOINT[waypointFor(want)];
      else { shown += (want - shown) * (1 - Math.exp(-dt * 6)); if (Math.abs(want - shown) < .02) shown = want; }
      const moved = Math.abs(shown - before);
      const w = walkAt(shown);

      // walk cycle: one frame every ~2.2 ft; stand after a short stillness
      if (!reduced && moved > .003) { acc += moved; still = 0; frame = String(Math.floor(acc / 2.2) % 4); }
      else { still += dt; if (still > .14 || reduced) frame = 'stand'; }
      const d = ((w.angle - angle + 540) % 360) - 180;
      angle = reduced ? w.angle : angle + d * (1 - Math.exp(-dt * 10));

      // camera: overview behind the hero, then a game camera that keeps the courier at a fixed point
      const active = stops.find(s => s.st.isActive);
      zoomMul += ((active ? active.zoom : 1) - zoomMul) * (reduced ? 1 : 1 - Math.exp(-dt * 3));
      const hp = hero ? (reduced ? (hero.progress > .5 ? 1 : 0) : ease(hero.progress)) : 1;
      const ahead = walkAt(Math.min(TOTAL_FEET, shown + lay.ahead));
      const look = {x: (w.x + ahead.x) / 2, y: (w.y + ahead.y) / 2};
      const zt = lay.oz + (zoomMul - lay.oz) * hp;
      z = z == null || reduced ? zt : z + (zt - z) * (1 - Math.exp(-dt * 8));
      const px = lay.overAt.x + (look.x - lay.overAt.x) * hp, py = lay.overAt.y + (look.y - lay.overAt.y) * hp;
      const fx = (lay.over[0] + (lay.walk[0] - lay.over[0]) * hp) * W, fy = (lay.over[1] + (lay.walk[1] - lay.over[1]) * hp) * H;
      const k = z * lay.S, tx = fx - (px - R.x) * k, ty = fy - (py - R.y) * k;
      cam.current.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${z.toFixed(4)})`;
      const sx = tx + (w.x - R.x) * k, sy = ty + (w.y - R.y) * k;
      if (courier.current) {
        courier.current.style.transform = `translate3d(${sx.toFixed(2)}px,${sy.toFixed(2)}px,0) scale(${(z * (1 + .14 * w.up)).toFixed(4)})`;
        if (courier.current.dataset.frame !== frame) courier.current.dataset.frame = frame;
      }
      if (turn) turn.style.transform = `rotate(${angle.toFixed(1)}deg)`;
      const off = String(Math.max(0, ROUTE_LEN - w.drawn).toFixed(2));
      walked.forEach(p => { if (p.style.strokeDashoffset !== off) p.style.strokeDashoffset = off; });
      lab.forEach(l => { l.n.style.transform = `translate3d(${(tx + (l.x - R.x) * k).toFixed(1)}px,${(ty + (l.y - R.y) * k).toFixed(1)}px,0)`; });

      // the countdown on each leg card: feet left to the next waypoint
      counts.forEach((c, j) => {
        const i = +c.dataset.count, left = Math.round(Math.max(0, Math.min(LEGS[i].feet, AT_WAYPOINT[i + 1] - shown)));
        if (last.count[j] !== left) { last.count[j] = left; c.textContent = String(left); }
      });
      // waypoints reached: tokens, the HUD, the delivered state
      const now = waypointFor(shown + .01);
      if (now !== wp) {
        wp = now;
        tokens.forEach((t, i) => { t.dataset.state = i < now ? 'done' : i === now ? 'current' : 'upcoming'; });
        reach.current?.(now);
        if (now === WAYPOINTS.length - 1 && shown >= TOTAL_FEET - .5 && !bag.get().delivered) bag.set({delivered: true});
      }
      const stopKey = active ? active.el.dataset.stop : hp < .5 ? 'hero' : 'walk';
      if (last.stop !== stopKey) { last.stop = stopKey; el.dataset.at = stopKey; }
    };
    gsap.ticker.add(tick);

    // modules mount lazily and change the page's height: keep trigger positions honest
    let t = 0;
    const ro = new ResizeObserver(() => { clearTimeout(t); t = setTimeout(() => ScrollTrigger.refresh(), 160); });
    ro.observe(node);
    document.fonts?.ready.then(() => ScrollTrigger.refresh()).catch(() => {});
    return () => { gsap.ticker.remove(tick); ro.disconnect(); clearTimeout(t); ctx.revert(); };
  }, [root, reduced]);

  const pw = R.w * L.S, ph = R.h * L.S;
  return <div ref={stage} className="w3-stage" data-at="hero">
    <div className="w3-world" aria-hidden="true">
      <div ref={cam} className="w3-cam" style={{width: pw, height: ph}}>
        <DuskPlan width={pw} height={ph}/>
        <RouteLayer width={pw} height={ph} gateOpen={gateOpen}/>
      </div>
      <Courier ref={courier} px={L.S}/>
      <div ref={labels} className="w3-labels">
        <span className="w3-label is-pin" data-x={GARAGE_GATE.x} data-y={GARAGE_GATE.y - 15}><span>1450 Elm St, where map apps drop the pin</span></span>
        <span className="w3-label is-fence" data-x={GATE.x - 112} data-y={GATE.y - 118}><span>{GEOFENCE_FT} ft: the code can show</span></span>
        <span className="w3-label is-car" data-x={206} data-y={480}><span>Your stop, curb rules checked</span></span>
      </div>
      <div className="w3-vignette"/>
    </div>
    {children}
  </div>;
}
