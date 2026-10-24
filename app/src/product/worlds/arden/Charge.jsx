import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Ev} from '../../CaseKit';
import {useCaseLang} from '../../i18n';
import {ASSETS, BASE, photoSrc} from './media';
import {Pic} from './Pic';
import {drawFit, filmFor, filmInfo, useFilm} from './film';
import {CHARGE} from './content';
import {Statement} from './Type';

/* How it charges (site-spec/WORLD-ARDEN-V3.md). Drag the glasses down into the case, or press the button: they settle
   into the seat with a small magnetic snap, the contacts light up, the case's status light comes on, and the numbers
   count: the glasses 31% to 100% (one number with the time it lasts: they're one device, though there are two cells),
   the case 96% to 74% (Estimate). The folded glasses lie in a moulded insert (two soft pockets for the lenses), the bridge
   on a small saddle: two gold pads under the bridge meet its spring contacts and a magnet seats them. Uses renders/charge
   when it exists (the empty case, the lowering sequence, the seated case with its light on, the contacts macro, and
   charge.json for where the saddle, the status light and the USB-C port are); until then the case renders stand in.
   Keyboard: the button. Reduced motion: an instant swap, the numbers at their end. */

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = u => 1 - (1 - u) ** 3;
const FROM = {g: 31, c: 96}, TO = {g: 100, c: 74};
const HOURS = 4.4;                                   // mixed use on a full charge (Estimate; Believe, power)

/** charge.json's points (any key with x_pct / y_pct), sorted into the saddle's contacts, the status light and USB-C. */
function pointsOf(data) {
  const pts = Object.entries(data || {}).filter(([, v]) => v && typeof v === 'object' && v.x_pct != null && v.visible !== false)
    .map(([key, v]) => ({key, x: v.x_pct, y: v.y_pct}));
  return {
    contacts: pts.filter(p => /contact|saddle|bridge|pogo/i.test(p.key)),
    light: pts.find(p => /status|light|led/i.test(p.key)) || null,
    usb: pts.find(p => /usb/i.test(p.key)) || null,
  };
}

function useCharge() {
  const C = ASSETS.charge || {stills: [], films: [], data: null};
  const find = re => C.stills.find(n => re.test(n));
  const empty = find(/empty/), lit = find(/light|lit|on$/), contacts = find(/contact/);
  const seq = C.films[0] || null;
  return {real: !!(empty && seq), empty, lit, contacts, seq, data: C.data};
}

export default function Charge({reduced}) {
  const {t} = useCaseLang();
  const R = useCharge();
  const stage = useRef(null), canvas = useRef(null);
  const name = useMemo(() => (R.seq ? filmFor(R.seq) : null), [R.seq]);
  const info = name ? filmInfo(name) : null;
  const {store, loaded} = useFilm(name, stage, {when: 'near', enabled: R.real && !reduced});
  const [k, setK] = useState(0);              // 0: in your hand, 1: in the seat
  const [pct, setPct] = useState(FROM);
  const anim = useRef(0), drag = useRef(null);
  const seated = k >= 1;

  // the lowering sequence follows k
  useEffect(() => {
    if (!R.real || !info || !store) return;
    const img = store.nearest(Math.round(clamp(k) * (info.count - 1)));
    if (img) drawFit(canvas.current, img, 'contain');
  }, [k, loaded, store, info, R.real]);

  const go = useCallback((to, ms = 700) => {
    cancelAnimationFrame(anim.current);
    if (reduced) { setK(to); return; }
    const from = kRef.current, t0 = performance.now();
    const step = now => {
      const u = clamp((now - t0) / ms);
      // a small magnetic snap at the end of the way in
      const v = to > from ? from + (to - from) * (u < .85 ? ease(u / .85) * .97 : .97 + .03 * ease((u - .85) / .15)) : from + (to - from) * ease(u);
      setK(v);
      if (u < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  }, [reduced]);
  const kRef = useRef(0);
  kRef.current = k;
  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  // in the seat: count the batteries up (the case pays for it)
  useEffect(() => {
    if (!seated) { setPct(FROM); return undefined; }
    if (reduced) { setPct(TO); return undefined; }
    let raf = 0;
    const t0 = performance.now();
    const step = now => {
      const u = ease(clamp((now - t0 - 500) / 2600));
      setPct({g: Math.round(FROM.g + (TO.g - FROM.g) * u), c: Math.round(FROM.c + (TO.c - FROM.c) * u)});
      if (u < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seated, reduced]);

  const onDown = e => {
    if (seated) return;
    cancelAnimationFrame(anim.current);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const r = stage.current.getBoundingClientRect();
    drag.current = {id: e.pointerId, x: e.clientX, y: e.clientY, k: kRef.current, span: r.height * .42};
  };
  const onMove = e => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    // down (and, for the stand-in, toward the case on the right) puts them in
    const along = R.real ? e.clientY - d.y : Math.max(e.clientY - d.y, (e.clientX - d.x) * .8);
    setK(clamp(d.k + along / d.span, 0, .97));
  };
  const onUp = e => {
    const d = drag.current;
    if (!d || e.pointerId !== d.id) return;
    drag.current = null;
    go(kRef.current > .45 ? 1 : 0, 380);
  };

  const P = R.real ? pointsOf(R.data) : {contacts: [], light: null, usb: null};
  const lightAt = P.light ? [P.light.x, P.light.y] : [50, 86];
  const full = pct.g >= TO.g;
  // where it goes before it's in (the saddle); once it's in, the light says what it's doing, and where the cable goes
  const callouts = [
    ...P.contacts.map((p, i) => ({...p, text: i ? null : t(CHARGE.callouts.contacts), show: k < .25})),
    ...(P.light ? [{...P.light, text: t(full ? CHARGE.full : CHARGE.charging), show: seated, led: true}] : []),
    ...(P.usb ? [{...P.usb, text: t(CHARGE.callouts.usb), show: seated}] : []),
  ];
  const macro = R.contacts || (ASSETS.stills['detail-bridge-contacts'] ? 'detail-bridge-contacts' : null);
  const base = R.real ? ASSETS.stills[R.empty] : null;
  // the frame is the render's own box, so charge.json's percentages land where they should; the stage shows all of it on
  // a wide screen, and on a phone a square crop of its middle, where the case is
  const rar = R.real && R.data?.width ? R.data.width / R.data.height : 1.5;
  const stageStyle = {'--k': k.toFixed(4), '--rar': rar.toFixed(4), ...(base?.plate ? {background: base.plate} : {})};
  const pills = [['g', CHARGE.glasses], ['c', CHARGE.case]];

  return <section id="ar-charge" className="ar-chapter ar-black ar-charge has-say" aria-labelledby="ar-charge-h">
    <Statement id="ar-charge-h" label={CHARGE.eyebrow} text={CHARGE.heading} lede={CHARGE.lede} reduced={reduced}/>
    <div className="ar-charge-grid">
      <div ref={stage} className={`ar-charge-stage${R.real ? ' is-real' : ' is-standin'}`} data-seated={seated || undefined} style={stageStyle}>
        <div className="ar-charge-frame">
        {R.real ? <>
          <Pic name={R.empty} alt={t(CHARGE.stageAlt)} className="ar-charge-base"/>
          <canvas ref={canvas} className="ar-charge-film" aria-hidden="true" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}/>
          {R.lit ? <Pic name={R.lit} alt={t(CHARGE.seatedAlt)} className="ar-charge-lit"/> : null}
        </> : <>
          {/* stand-in until renders/charge exists: the closed case and the glasses; in the case, the open case with them inside */}
          <Pic name="case-closed" alt="" className="ar-charge-case"/>
          <Pic name="case-open" alt={seated ? t(CHARGE.seatedAlt) : ''} className="ar-charge-lit"/>
          <img className="ar-charge-glasses" src={`${BASE}/renders-app/glasses-natural-800.webp`} alt={seated ? '' : t(CHARGE.stageAlt)} draggable={false}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}/>
        </>}
        <span className="ar-charge-led" aria-hidden="true" style={{left: `${lightAt[0]}%`, top: `${lightAt[1]}%`}}/>
        {callouts.map(c => <span key={c.key} className={`ar-charge-callout${c.x > 62 ? ' is-left' : ''}${c.led ? ' is-led' : ''}`} data-show={c.show || undefined} aria-hidden="true"
          style={{left: `${c.x}%`, top: `${c.y}%`}}><i/>{c.text ? <span>{c.text}</span> : null}</span>)}
        </div>
        {!seated ? <p className="ar-charge-drag" aria-hidden="true">{t(CHARGE.drag)}</p> : null}
      </div>
      <div className="ar-charge-side">
        <button type="button" className="ar-btn is-light" aria-pressed={seated} onClick={() => go(seated ? 0 : 1)}>{t(seated ? CHARGE.out : CHARGE.button)}</button>
        <ul className="ar-charge-bat" aria-live="polite">
          {pills.map(([key, label]) => <li key={key}>
            <span className="ar-charge-bat-name">{t(label)}</span>
            <span className="ar-charge-bat-val"><b className="ar-num">{pct[key]}%</b>{key === 'g' ? <span className="ar-num"> · {t(CHARGE.lasts(pct.g, HOURS))}</span> : null}</span>
            <span className="ar-charge-bat-bar" aria-hidden="true"><span style={{width: `${pct[key]}%`}}/></span>
          </li>)}
        </ul>
        <p className="ar-charge-note">{t(CHARGE.note)} <Ev label="Estimated"/></p>
        {macro ? <figure className="ar-charge-macro">
          <Pic name={macro} alt={t(CHARGE.contactsAlt)}/>
          <figcaption>{t(CHARGE.contacts)}</figcaption>
        </figure> : <p className="ar-charge-note">{t(CHARGE.contacts)}</p>}
        <ul className="ar-charge-facts">{CHARGE.facts.map(([h, text]) => <li key={h.en}><b>{t(h)}</b> {t(text)}</li>)}</ul>
      </div>
    </div>
  </section>;
}
