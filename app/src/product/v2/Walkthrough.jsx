import {createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {UI, useCaseLang} from '../i18n';
import './walkthrough.css';

/* The walkthrough videos (public/video, served as plain URLs so the build never depends on them):
   for each case, "the case" (the page explained, about a minute) and "the app" (the prototype in use, about a minute
   and a half), each as MP4 (H.264, first, for Safari), WebM (VP9) and a JPG poster, 1440 × 900.

   A world wraps its page in <WalkthroughProvider>, inside its own root element, so the player is drawn with that
   world's tokens (--wt-*, set in each world's stylesheet) and follows its light or dark theme. <WatchButton> opens the
   player on the case video; <WatchCard> sits beside the live prototype and opens it on the app video.
   Nothing touches /video/ until the player opens (or, for the card's poster, until the card is near the screen). */

const STEMS = {
  'ready-for-agents': 'd1-ready-for-agents',
  atelier: 'd2-atelier',
  'last-100-feet': 'd3-last-100-feet',
  'choose-not-to-lose': 'd4-choose-not-to-lose',
};
const OPTIONS = [
  {id: 'page', label: UI.caseVideo, length: UI.oneMin},
  {id: 'app', label: UI.appVideo, length: UI.oneAndHalfMin},
];

/** {mp4, webm, poster} for a case's `which` video ('page' or 'app'), or null for a case without videos. */
export function videoOf(slug, which) {
  const stem = STEMS[slug];
  if (!stem) return null;
  const base = `/video/${stem}-${which}`;
  return {mp4: `${base}.mp4`, webm: `${base}.webm`, poster: `${base}.jpg`};
}

const Ctx = createContext(null);
/** {slug, open(which, opener)} from the nearest provider. */
export const useWalkthrough = () => useContext(Ctx);

/** Holds the player for one case page. `title` names the case in the player's heading. */
export function WalkthroughProvider({slug, title, reduced = false, children}) {
  const [shown, setShown] = useState(null);     // {which, opener} while the player is open
  const open = useCallback((which = 'page', opener = null) => setShown({which, opener}), []);
  const value = useMemo(() => ({slug, open}), [slug, open]);
  if (!STEMS[slug]) return children;
  return <Ctx.Provider value={value}>
    {children}
    {shown ? <Player slug={slug} title={title} start={shown.which} opener={shown.opener} reduced={reduced} onClose={() => setShown(null)}/> : null}
  </Ctx.Provider>;
}

/** The button near the top of a case page. Pass the world's own button classes; the icon and the words are the same
    everywhere unless `children` says otherwise. */
export function WatchButton({className = '', which = 'page', icon = <PlayIcon/>, children, ...rest}) {
  const {t} = useCaseLang();
  const ctx = useWalkthrough();
  if (!ctx) return null;
  return <button type="button" className={`wt-watch ${className}`} aria-haspopup="dialog" {...rest}
    onClick={e => ctx.open(which, e.currentTarget)}>{icon}<span>{children ?? t(UI.watch)}</span></button>;
}

/** Beside the live prototype: the app video's poster (only once the card is near the screen) and a line of text. It
    opens the same player, on the app video. */
export function WatchCard({className = ''}) {
  const {t} = useCaseLang();
  const ctx = useWalkthrough();
  if (!ctx) return null;
  const v = videoOf(ctx.slug, 'app');
  return <button type="button" className={`wt-card ${className}`} aria-haspopup="dialog" onClick={e => ctx.open('app', e.currentTarget)}>
    <span className="wt-card-shot" aria-hidden="true">
      <img src={v.poster} width="1440" height="900" alt="" loading="lazy" decoding="async"/>
      <span className="wt-card-play"><PlayIcon/></span>
    </span>
    <span className="wt-card-text">
      <span className="wt-card-title">{t(UI.watchApp)}</span>
      <span className="wt-card-meta">{t(UI.appVideoMeta)}</span>
    </span>
  </button>;
}

/** Stop the page behind the player from scrolling (the window, or the full site's page viewport), without the page
    shifting when a classic scrollbar goes away. Returns the undo. */
function lockScroll(node) {
  const html = document.documentElement, scroller = node.closest('.portfolio-page-viewport');
  const before = {overflow: html.style.overflow, gutter: html.style.scrollbarGutter, inner: scroller?.style.overflow};
  const bar = innerWidth > html.clientWidth;
  html.style.overflow = 'hidden';
  if (bar) html.style.scrollbarGutter = 'stable';
  if (scroller) scroller.style.overflow = 'hidden';
  let undone = false;
  return () => {
    if (undone) return;
    undone = true;
    html.style.overflow = before.overflow;
    html.style.scrollbarGutter = before.gutter;
    if (scroller) scroller.style.overflow = before.inner;
  };
}

const FOCUSABLE = 'button:not([disabled]), [href], video[controls], [tabindex]:not([tabindex="-1"]):not(.wt-guard)';

/** The player: a modal <dialog> with the case's name, a switch between the two videos, and the video. Focus goes to
    the close button and stays inside (Tab wraps); Esc, the close button or a click outside the panel close it, and
    focus goes back to the button that opened it. The page behind is inert and doesn't scroll. The chosen video plays
    at once (it was asked for with a click), except with reduced motion, where it waits for Play. */
function Player({slug, title, start, opener, reduced, onClose}) {
  const {t, zh} = useCaseLang();
  const id = useId();
  const dialog = useRef(null), video = useRef(null), closer = useRef(null), downOutside = useRef(false);
  const [which, setWhich] = useState(start);
  const [failed, setFailed] = useState(null);
  const v = videoOf(slug, which);
  const option = OPTIONS.find(o => o.id === which);

  useLayoutEffect(() => {
    const d = dialog.current;
    if (!d.open) d.showModal();
    closer.current?.focus();
    const unlock = lockScroll(d);
    const done = () => { unlock(); onClose(); opener?.focus?.({preventScroll: true}); };
    d.addEventListener('close', done);
    return () => { d.removeEventListener('close', done); unlock(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // play what was asked for; with reduced motion, nothing starts by itself
  useEffect(() => {
    if (reduced) return;
    video.current?.play?.()?.catch?.(() => { /* the browser wants a click on Play first */ });
  }, [which, reduced]);

  const close = () => dialog.current?.close();
  const choose = next => { if (next !== which) { setFailed(null); setWhich(next); } };
  // the fallback button goes away with the missing video: keep focus on the switch, now on the app
  const chooseApp = () => { choose('app'); requestAnimationFrame(() => dialog.current?.querySelector('.wt-opt[aria-pressed="true"]')?.focus()); };
  // the two guards keep Tab inside: tabbing past either end lands on the control at the other end; focus that
  // arrives from outside (opening, or coming back from the browser's own UI) lands on the nearest real control
  const guard = atStart => e => {
    const all = [...dialog.current.querySelectorAll(FOCUSABLE)].filter(el => !el.closest('[inert]'));
    const fromInside = dialog.current.contains(e.relatedTarget);
    (atStart === fromInside ? all.at(-1) : all[0])?.focus();
  };

  return <dialog ref={dialog} className={`wt${reduced ? ' is-still' : ''}`} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-note`}
    // the player keeps its keys: nothing on the page behind (paging, shortcuts) reacts while it's open
    onKeyDown={e => e.stopPropagation()}
    onPointerDown={e => { downOutside.current = e.target === dialog.current; }}
    onClick={e => { if (e.target === dialog.current && downOutside.current) close(); }}>
    <span className="wt-guard" tabIndex={0} onFocus={guard(true)}/>
    <div className="wt-panel">
      <div className="wt-head">
        <h2 id={`${id}-title`} className="wt-title">
          <span className="wt-kicker">{t(UI.walkthrough)}</span><span className="wt-sr">{zh ? '：' : ': '}</span>
          <span className="wt-name" lang="en">{title}</span>
        </h2>
        <button ref={closer} type="button" className="wt-close" onClick={close}>
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15"/></svg>
          <span className="wt-close-label">{t(UI.close)}</span>
        </button>
      </div>
      <div className="wt-switch" role="group" aria-label={t(UI.whichVideo)}>
        {OPTIONS.map(o => <button key={o.id} type="button" className="wt-opt" aria-pressed={which === o.id} onClick={() => choose(o.id)}>
          <span className="wt-opt-label">{t(o.label)}</span><span className="wt-opt-len">{zh ? `（${t(o.length)}）` : ` (${t(o.length)})`}</span>
        </button>)}
      </div>
      <div className="wt-stage">
        <video key={which} ref={video} className="wt-video" controls playsInline preload="none" poster={v.poster} inert={failed === which || undefined}
          aria-label={`${t(option.label)}${zh ? '，' : ', '}${t(option.length)}`} aria-describedby={`${id}-note`}>
          <source src={v.mp4} type="video/mp4"/>
          <source src={v.webm} type="video/webm" onError={() => setFailed(which)}/>
        </video>
        {failed === which ? <div className="wt-missing">
          <p aria-hidden="true">{t(UI.videoMissing)}</p>
          {which === 'page' ? <button type="button" className="wt-alt" onClick={chooseApp}>{t(UI.watchAppInstead)}</button> : null}
        </div> : null}
      </div>
      <p id={`${id}-note`} className="wt-sr">{t(UI.captionsBurnedIn)}</p>
      <p className="wt-sr" aria-live="polite">{failed === which ? t(UI.videoMissing) : ''}</p>
    </div>
    <span className="wt-guard" tabIndex={0} onFocus={guard(false)}/>
  </dialog>;
}

export function PlayIcon({size = 18}) {
  return <svg className="wt-icon" viewBox="0 0 20 20" width={size} height={size} aria-hidden="true" focusable="false">
    <circle cx="10" cy="10" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8.25 6.6v6.8L13.6 10z" fill="currentColor"/>
  </svg>;
}
