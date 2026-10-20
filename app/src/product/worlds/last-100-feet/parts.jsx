import {createContext, Suspense, useCallback, useContext, useEffect, useRef, useState} from 'react';
import {scrollRootOf} from '../../v2/motion';
import {StopGlyph} from './Hud';
import {ThemeContext} from './theme';
import {L, UI, useCaseLang} from '../../i18n';
import {AI, WAYPOINT_NAMES, photoLarge, photoSmall, shot, stepOf} from './content';

/* Small pieces the walk is built from: the step label (the route's own token), a resident's photo card, a phone
   showing one prototype screen, a decision (what I tried, what I chose), a lazy mount, and one photo viewer. */

export function Step({i}) {
  const {t} = useCaseLang();
  return <p className="w3-step"><StopGlyph i={i}/><span>{t(stepOf(i, WAYPOINT_NAMES[i]))}</span></p>;
}

// ---------- the photo viewer: a native <dialog> (focus trap, Esc, inert page) ----------
const ViewerContext = createContext(() => {});
export const useViewer = () => useContext(ViewerContext);
export function PhotoViewer({children}) {
  const dialog = useRef(null), opener = useRef(null);
  const [item, setItem] = useState(null);
  const theme = useContext(ThemeContext);
  const {t} = useCaseLang();
  const open = useCallback((next, from) => { opener.current = from || document.activeElement; setItem(next); }, []);
  useEffect(() => {
    const d = dialog.current;
    if (item && d && !d.open) d.showModal();
  }, [item]);
  const close = () => { dialog.current?.close(); };
  return <ViewerContext.Provider value={open}>
    {children}
    <dialog ref={dialog} className={`w3-viewer is-${theme === 'dark' ? 'dusk' : 'day'}`} aria-label={t(item?.title) || t(L('Photo', '照片'))}
      onClose={() => { setItem(null); opener.current?.focus?.({preventScroll: true}); }}
      onClick={e => { if (e.target === dialog.current) close(); }}>
      {item ? <figure>
        <img src={item.src} alt={t(item.alt)} width={item.w || 1280} height={item.h || 960}/>
        <figcaption><b>{t(item.title)}</b>{item.text ? <span>{t(item.text)}</span> : null}<small>{t(item.note || AI)}</small></figcaption>
        <button type="button" className="w3-viewer-close" onClick={close} autoFocus>{t(UI.close)}</button>
      </figure> : null}
    </dialog>
  </ViewerContext.Provider>;
}

/** The resident's photo for a stop, as the courier's card frames it: photo, the stop, one sentence. */
export function PhotoCard({stop, i}) {
  const view = useViewer();
  const {t} = useCaseLang();
  const title = L(`Step ${i + 1}, ${stop.name.en}`, `第 ${i + 1} 步，${stop.name.zh}`);
  return <figure className="w3-photo">
    <button type="button" className="w3-photo-btn" aria-label={t(L(`Enlarge the resident’s photo: ${stop.name.en}`, `放大住户拍的照片：${stop.name.zh}`))}
      onClick={e => view({src: photoLarge(stop.photo), alt: stop.alt, title, text: stop.card}, e.currentTarget)}>
      <img src={photoSmall(stop.photo)} srcSet={`${photoSmall(stop.photo)} 480w, ${photoLarge(stop.photo)} 1280w`} sizes="(max-width: 760px) 92vw, 320px"
        width="480" height="360" alt={t(stop.alt)} loading="lazy" decoding="async"/>
    </button>
    <figcaption><b>{t(stop.name)}</b><span>{t(stop.card)}</span><small>{t(L('The resident’s photo. AI-generated, illustrative.', '住户拍的照片。AI 生成，仅作示意。'))}</small></figcaption>
  </figure>;
}

/** A phone showing one prototype screen (a capture of the prototype build). */
export function PhoneShot({screen, alt, focus, className = ''}) {
  return <div className={`w3-phone ${className}`}>
    <div className="w3-phone-screen"><img src={shot(screen)} width="780" height="1688" alt={alt} loading="lazy" decoding="async" style={focus ? {objectPosition: focus} : undefined}/></div>
  </div>;
}

/** A step of the prototype told at its place on the route. */
export function Beat({beat}) {
  const {t} = useCaseLang();
  return <div className="w3-beat">
    <PhoneShot screen={beat.screen} alt={t(beat.alt)}/>
    <div className="w3-beat-text">
      <p className="w3-kicker">{t(beat.label)}</p>
      <h3 className="w3-h3">{t(beat.title)}</h3>
      <p>{t(beat.body)}</p>
    </div>
  </div>;
}

/** A decision: the choice and its one-line reason up front, what it replaced underneath. */
export function Decision({d}) {
  const {t} = useCaseLang();
  return <div className="w3-decision">
    <h3 className="w3-h3">{t(d.title)}</h3>
    {d.verdict ? <p className="w3-verdict">{t(d.verdict)}</p> : null}
    <dl className="w3-tc">
      <div><dt>{t(L('Tried first', '先试过'))}</dt><dd>{t(d.tried)}</dd></div>
      <div><dt>{t(L('Chose', '选定'))}</dt><dd>{t(d.chose)}</dd></div>
    </dl>
  </div>;
}

/** Mounts a lazy module only when its place on the page comes near, holding its space meanwhile. */
export function Deferred({children, minHeight = 480, label}) {
  const ref = useRef(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return undefined;
    if (typeof IntersectionObserver !== 'function') { setNear(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); io.disconnect(); } }, {root: scrollRootOf(el), rootMargin: '700px 0px'});
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  return <div ref={ref} className="w3-deferred" style={near ? undefined : {minHeight}} aria-label={near ? undefined : label}>
    {near ? <Suspense fallback={<div style={{minHeight}}/>}>{children}</Suspense> : null}
  </div>;
}
