// What the pages behind the home take from it, so a visitor who leaves the machine is still in its world:
//   PageHead  the page's name in the machine's dot matrix, where the page change just wrote it (head.js). Its letters answer
//             the pointer, and Jay hops onto the one you point at.
//   JayPerch  Jay, small, sitting on something. Poke him and he answers; where a cat is about, the third time he says so.
//   CatPeek   the cat: Jay Lin's own (sprite.js). Hidden under the head's lower edge; it looks out when Jay says there is a cat.
// No three.js here: these are plain elements, drawn by the page.
import React, {useEffect, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {drawJay, drawCat} from './sprite';
import {headMetrics, readSide} from './head';
import './kit.css';

const WORDS = {
  zh: {quips: ['啾', '别戳', '有猫'], alone: ['啾', '别戳', '啾啾'], hint: '字母可以碰', cart: {product: '产品卡带', game: '策划卡带'}},
  en: {quips: ['Chirp.', 'Don’t.', 'Cat.'], alone: ['Chirp.', 'Don’t.', 'Chirp chirp.'], hint: 'Touch the letters', cart: {product: 'Product cartridge', game: 'Game cartridge'}},
};

/** The cat. It is the easter egg, so it is out of sight under the head's lower edge until `wake` changes (Jay has just said there
    is a cat). Then it comes up as far as its nose, half asleep, has a look, and sinks back. `size` is its height in pixels:
    give it Jay's, and their pixels match. */
export function CatPeek({size = 40, wake = 0}) {
  const cv = useRef(), [up, setUp] = useState(false), [open, setOpen] = useState(false), hov = useRef(false);
  useEffect(() => { drawCat(cv.current.getContext('2d'), 1, open); }, [open]);
  useEffect(() => {
    if (!wake) return undefined;
    setUp(true); setOpen(false); // up with its eyes shut; then a look; then shut again; then down
    const ids = [setTimeout(() => setOpen(true), 800), setTimeout(() => { if (!hov.current) setOpen(false); }, 2500), setTimeout(() => { setUp(false); setOpen(false); }, 4200)];
    return () => ids.forEach(clearTimeout);
  }, [wake]);
  return <span className="jlk-cat" data-up={up ? '' : undefined} style={{'--h': size + 'px'}} aria-hidden="true"
    onPointerEnter={() => { hov.current = true; if (up) setOpen(true); }} onPointerLeave={() => { hov.current = false; }}>
    <canvas ref={cv} width={17} height={14}/>
  </span>;
}

/** Jay, sitting. `size` is his height in pixels (leave it out and the page's own sheet sizes him); `lang` picks his words. He is a button: poke him.
    `onCat`: there is a cat on this page, and this is called when he mentions it. */
export function JayPerch({size = 44, lang = 'zh', onCat, className = '', style}) {
  const cv = useRef(), n = useRef(0), timer = useRef(0), [say, setSay] = useState(null), [hop, setHop] = useState(0);
  const T = WORDS[lang === 'en' ? 'en' : 'zh'], Q = onCat ? T.quips : T.alone;
  useEffect(() => { drawJay(cv.current.getContext('2d'), 1, 0, false); }, [hop]); // a hop starts the little animation again, on a fresh canvas
  useEffect(() => () => clearTimeout(timer.current), []);
  const poke = e => {
    e.stopPropagation(); const i = n.current++ % Q.length; setSay(Q[i]); setHop(h => h + 1);
    clearTimeout(timer.current); timer.current = setTimeout(() => setSay(null), 1900);
    if (i === Q.length - 1 && onCat) onCat();
  };
  return <button type="button" className={'jlk-jay ' + className} style={size ? {...style, '--h': size + 'px'} : style} onClick={poke} aria-label="Jay">
    <span key={hop} className={hop ? 'is-hop' : ''}><canvas ref={cv} width={17} height={14}/></span>
    {say && <i key={say + hop} lang={lang === 'en' ? 'en' : 'zh-CN'}>{say}</i>}
  </button>;
}

/** A page's head: its name in dots, standing where the page change wrote it. `paper`: the page under it is a light sheet,
    and comes out of the head the way the receipt comes out of the machine. */
export function PageHead({word, lang = 'zh', paper = false, label}) {
  const side = useMemo(readSide, []), T = WORDS[lang === 'en' ? 'en' : 'zh'], [wake, setWake] = useState(0);
  const [m, setM] = useState(() => headMetrics(innerWidth, innerHeight, word.length));
  const line = useRef(), [spots, setSpots] = useState([]), [at, setAt] = useState(word.length - 1);
  useEffect(() => { const fit = () => setM(headMetrics(innerWidth, innerHeight, word.length)); addEventListener('resize', fit); return () => removeEventListener('resize', fit); }, [word]);
  // where each letter stands, so Jay can land on it
  useLayoutEffect(() => {
    const measure = () => { const el = line.current; if (!el) return; setSpots([...el.querySelectorAll('span[data-ch]')].map(s => s.offsetLeft + s.offsetWidth / 2)); };
    measure(); document.fonts?.ready.then(measure); document.fonts?.addEventListener?.('loadingdone', measure); // the dot face may arrive after the first layout
    return () => document.fonts?.removeEventListener?.('loadingdone', measure);
  }, [m, word]);
  // while the head is what lies under the site's bar, the bar is clear glass over it (a page's own sheet may give the bar a ground of its own)
  const head = useRef();
  useEffect(() => {
    const el = head.current; if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver(([e]) => document.body.classList.toggle('jlk-over-head', e.isIntersecting), {rootMargin: '-96px 0px 0px 0px'});
    io.observe(el); return () => { io.disconnect(); document.body.classList.remove('jlk-over-head'); };
  }, []);
  // The bar takes its ink from the head while the head is under it. The mark is set after the head is in the page, not with it:
  // the bar listens for this mark changing, and would not notice a head that simply arrived with it
  useEffect(() => { if (head.current) head.current.dataset.navTone = side === 'game' ? 'light' : 'dark'; }, [side]);
  return <header ref={head} className="jlk-head" data-side={side} data-paper={paper ? '' : undefined} style={{height: m.band, '--size': m.size + 'px', '--y': m.y + 'px'}}>
    <div className="jlk-word" ref={line} aria-hidden="true">
      {[...word].map((ch, i) => <span key={i} data-ch="" data-at={at === i ? '' : undefined} style={{'--i': i}} onPointerEnter={() => setAt(i)} onPointerDown={() => setAt(i)}>{ch}</span>)}
      <JayPerch size={Math.max(30, Math.round(m.size * .4))} lang={lang} onCat={() => setWake(w => w + 1)} className="on-word" style={{left: (spots[at] ?? 0) + 'px', visibility: spots.length ? 'visible' : 'hidden'}}/>
    </div>
    <p className="jlk-line"><span>JL-01 — {label || word}</span><span>{T.cart[side]}</span><span>{T.hint}</span></p>
    <CatPeek size={Math.max(30, Math.round(m.size * .4))} wake={wake}/>
    {paper && <i className="jlk-tear" aria-hidden="true"/>}
  </header>;
}
