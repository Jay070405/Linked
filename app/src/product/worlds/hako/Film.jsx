import {createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {L, UI, useCaseLang} from '../../i18n';
import {Build} from './Build';
import {FILM_LENGTH, FILM_SRC, STEPS, T, still as stillSrc} from './content';

/* The launch film, played in place: a modal <dialog> (the page behind is inert, Esc closes, focus returns to the
   button that opened it) that can start at any moment of the film. Nothing loads until it opens. With reduced motion
   it waits for Play. And the flow of use, told with eight frames of the film: on wide screens a sticky frame beside
   the steps shows the step being read (a crossfade, and a playhead on the film's 50-second line); on narrow screens and
   in the plain page each step carries its own frame. */

const FilmCtx = createContext(null);
export const useFilm = () => useContext(FilmCtx);
export const clock = s => `0:${String(Math.floor(s)).padStart(2, '0')}`;

export function FilmProvider({reduced, children}) {
  const [shown, setShown] = useState(null);   // {at, opener}
  const open = useCallback((at = 0, opener = null) => setShown({at, opener}), []);
  return <FilmCtx.Provider value={open}>
    {children}
    {shown ? <FilmDialog at={shown.at} opener={shown.opener} reduced={reduced} onClose={() => setShown(null)}/> : null}
  </FilmCtx.Provider>;
}

function FilmDialog({at, opener, reduced, onClose}) {
  const {t} = useCaseLang();
  const dialog = useRef(null), video = useRef(null), closer = useRef(null);
  useLayoutEffect(() => {
    const d = dialog.current;
    if (!d.open) d.showModal();
    closer.current?.focus();
    const scroller = d.closest('.portfolio-page-viewport'), html = document.documentElement;
    const before = {html: html.style.overflow, sc: scroller?.style.overflow};
    html.style.overflow = 'hidden'; if (scroller) scroller.style.overflow = 'hidden';
    const done = () => { onClose(); opener?.focus?.({preventScroll: true}); };
    d.addEventListener('close', done);
    return () => { d.removeEventListener('close', done); html.style.overflow = before.html; if (scroller) scroller.style.overflow = before.sc; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const ready = () => {
    const v = video.current;
    if (!v) return;
    if (at) v.currentTime = at;
    if (!reduced) v.play?.()?.catch?.(() => { /* the browser wants a click on Play */ });
  };
  return <dialog ref={dialog} className="hw-film" aria-labelledby="hw-film-title" onClick={e => { if (e.target === dialog.current) dialog.current.close(); }}>
    <div className="hw-film-panel">
      <div className="hw-film-head">
        <p id="hw-film-title" className="hw-film-title"><span lang="en">Hako</span> · {t(L('launch film', '发布片'))}<span className="hw-film-meta">{t(T.filmNote)}</span></p>
        <button ref={closer} type="button" className="hw-film-close" onClick={() => dialog.current.close()} aria-label={t(UI.close)}>
          <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true"><path d="M5 5l10 10M15 5L5 15"/></svg>
        </button>
      </div>
      <video ref={video} className="hw-film-video" src={FILM_SRC} poster={stillSrc('poster')} controls playsInline preload="metadata" onLoadedMetadata={ready} width="1920" height="1080"/>
    </div>
  </dialog>;
}

/** A button that plays the film from `at` seconds. */
export function PlayFrom({at = 0, className = '', children}) {
  const open = useFilm();
  return <button type="button" className={className} onClick={e => open?.(at, e.currentTarget)} aria-haspopup="dialog">{children}</button>;
}

const Img = ({s, sizes, eager = false}) => {
  const {t} = useCaseLang();
  return <img src={stillSrc(s.img)} srcSet={`${stillSrc(s.img, 960)} 960w, ${stillSrc(s.img)} 1600w`} sizes={sizes} width="1600" height="900" alt={t(s.alt)} loading={eager ? 'eager' : 'lazy'} decoding="async"/>;
};

/** The code the inspector writes, set as code inside a sentence. */
const withCode = text => text.split(/(highlight="sat")/).map((part, i) => (i % 2 ? <code key={i} className="hw-inline-code" lang="en">{part}</code> : part));

const PlayIcon = () => <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>;

/** The eight moments of the film. */
export function FilmSteps({wide}) {
  const {t} = useCaseLang();
  const [active, setActive] = useState(0);
  const list = useRef(null);
  useEffect(() => {
    if (!wide || !list.current) return undefined;
    const items = [...list.current.querySelectorAll('[data-step]')];
    const io = new IntersectionObserver(entries => {
      for (const e of entries) if (e.isIntersecting) setActive(Number(e.target.dataset.step));
    }, {rootMargin: '-42% 0px -48% 0px', threshold: 0});
    items.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [wide]);
  const s = STEPS[active];

  return <div className={`hw-steps${wide ? ' is-wide' : ''}`}>
    {wide ? <div className="hw-steps-view" aria-hidden="true">
      <p className="hw-frame-label"><span lang="en">hako.mp4</span><code>{clock(s.t)} / 0:50</code></p>
      <div className="hw-steps-frame">{STEPS.map((x, i) => <span key={x.img} className={`hw-steps-img${i === active ? ' is-on' : ''}`}><Img s={x} sizes="(min-width: 1280px) 720px, 56vw"/></span>)}
        <span className="hw-steps-sel"><i/><i/><i/><i/></span>
      </div>
      <div className="hw-line"><i className="hw-line-bar"/>{STEPS.map((x, i) => <b key={x.img} className={i === active ? 'is-on' : undefined} style={{left: `${x.t / FILM_LENGTH * 100}%`}}/>)}
        <span className="hw-line-head" style={{transform: `translate3d(calc(${s.t / FILM_LENGTH} * 100cqw), 0, 0)`}}/></div>
    </div> : null}
    <ol ref={list} className="hw-steps-list">{STEPS.map((x, i) => <li key={x.img} data-step={i} className={wide && i === active ? 'is-on' : undefined}>
      <Build className="hw-step">
        {wide ? null : <PlayFrom at={x.t} className="hw-step-shot"><Img s={x} sizes="(max-width: 1023px) 92vw, 600px"/><span className="hw-step-play"><PlayIcon/></span></PlayFrom>}
        <p className="hw-step-n"><span>{String(i + 1).padStart(2, '0')}</span><code>{clock(x.t)}</code></p>
        <h4 className="hw-step-title">{t(x.title)}</h4>
        <p className="hw-step-body">{withCode(t(x.body))}</p>
        <PlayFrom at={x.t} className="hw-btn is-ghost is-small"><PlayIcon/>{t(T.playFrom(clock(x.t)))}</PlayFrom>
      </Build>
    </li>)}</ol>
  </div>;
}
