import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {gsap, PHONE, ScrollTrigger, scrollerOf, useMedia} from './kit/motion';
import {Takeaway, Tween, useInputMode, useNear} from './kit/Try';
import {L, useCaseLang} from '../../i18n';
import {checkLine, fullSrc, inches, INKS, named, px, thumbSrc, workOf, WORKS} from './data';
import {dimensions, largestSharp, printCheck, sizes} from './model';
import {composite, loadImage, separate} from './separations';
import {ArrowDown} from './kit/icons';

/* The press. The chosen painting is printed the way a print is built: four passes of a roller, cyan, magenta, yellow,
   then black, each laying its plate over the last (a plain RGB-to-CMYK split, multiplied on white paper). Scroll runs
   the press: the section pins and the roller sweeps across the sheet once per ink, back and forth. Then the print
   check by hand: pick any of the six sizes and a loupe shows one square inch of the print, drawn from the file's
   own pixels at that size's dpi; below 300 dpi the printer has to stretch the file and the inch goes soft.
   Reduced motion: no pinning; the four passes are shown side by side. */

// scroll progress windows for the four passes (the rest is a short hold before and after)
const PASSES = [[.05, .25], [.28, .48], [.51, .71], [.74, .94]];
const clamp01 = v => Math.min(1, Math.max(0, v));

/** Where the painting sits on its paper: the full image inside a quarter-inch white border, centered (percent). */
function placement(a, d) {
  const k = Math.min((d.w - .5) / a.originalWidth, (d.h - .5) / a.originalHeight);
  const iw = a.originalWidth * k, ih = a.originalHeight * k;
  return {iw, ih, x: (d.w - iw) / 2, y: (d.h - ih) / 2, style: {left: `${(d.w - iw) / 2 / d.w * 100}%`, top: `${(d.h - ih) / 2 / d.h * 100}%`, width: `${iw / d.w * 100}%`, height: `${ih / d.h * 100}%`}};
}

export default function Press({reduced, artId, setArtId, sizeId, setSizeId}) {
  const {t, zh} = useCaseLang();
  const phone = useMedia(PHONE);
  const a = workOf(artId), top = largestSharp(a), d = dimensions(a, top), r = printCheck(a, top);
  const root = useRef(null), pin = useRef(null), area = useRef(null), roller = useRef(null), plates = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const near = useNear(root, '900px 0px');
  const [img, setImg] = useState(null);
  const [sep, setSep] = useState(null);
  const [pass, setPass] = useState(-1);
  const progress = useRef(0), passRef = useRef(-1), areaW = useRef(0);

  // load the original file and split it into plates once the press comes near (and again for another painting)
  useEffect(() => {
    if (!near) return undefined;
    let live = true;
    setSep(null);
    loadImage(fullSrc(artId)).then(im => {
      if (!live) return;
      setImg(im);
      // let the browser paint first: the split takes a few frames on the largest file
      requestAnimationFrame(() => { if (live) setSep(separate(im, artId, phone ? 760 : 1100)); });
    }).catch(() => {});
    return () => { live = false; };
  }, [near, artId, phone]);

  const render = useCallback(p => {
    progress.current = p;
    let current = p >= PASSES[3][1] ? 4 : -1;
    PASSES.forEach(([s, e], i) => {
      const q = clamp01((p - s) / (e - s)), el = plates[i].current;
      if (el) el.style.clipPath = i % 2 ? `inset(0 0 0 ${(1 - q) * 100}%)` : `inset(0 ${(1 - q) * 100}% 0 0)`;
      if (p >= s && p < (PASSES[i + 1]?.[0] ?? 1)) current = q >= 1 && i === 3 ? 4 : i;
    });
    const ro = roller.current;
    if (ro) {
      const i = Math.max(0, Math.min(3, current === 4 ? 3 : current));
      const [s, e] = PASSES[i], q = clamp01((p - s) / (e - s)), x = i % 2 ? 1 - q : q;
      ro.style.transform = `translate3d(${x * areaW.current}px, 0, 0)`;
      ro.style.setProperty('--ink', INKS[i].color);
      ro.classList.toggle('is-off', current === 4);
    }
    if (current !== passRef.current) { passRef.current = current; setPass(current); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // copy the plates into the page's canvases, then redraw the current state
  useLayoutEffect(() => {
    if (!sep) return;
    plates.forEach((ref, i) => {
      const c = ref.current; if (!c) return;
      c.width = sep.w; c.height = sep.h;
      c.getContext('2d').drawImage(sep.plates[i], 0, 0);
    });
    render(reduced ? 1 : progress.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sep, reduced]);

  // the roller's travel is the image's width
  useLayoutEffect(() => {
    const el = area.current; if (!el) return undefined;
    const ro = new ResizeObserver(() => { areaW.current = el.clientWidth; render(progress.current); });
    ro.observe(el);
    return () => ro.disconnect();
  }, [render, artId]);

  // scroll runs the press
  useLayoutEffect(() => {
    const node = pin.current;
    if (!node || reduced) return undefined;
    const ctx = gsap.context(() => {
      const state = {p: progress.current};
      gsap.to(state, {
        p: 1, ease: 'none', onUpdate: () => render(state.p),
        scrollTrigger: {trigger: node, scroller: scrollerOf(node), pin: true, start: 'top top', end: () => `+=${Math.round(innerHeight * (phone ? 2.4 : 2.8))}`, scrub: .35, invalidateOnRefresh: true, anticipatePin: 1},
      });
    }, node);
    return () => ctx.revert();
  }, [reduced, render, phone]);

  const place = placement(a, d);
  const imageInches = (a.originalWidth / (1 / Math.min((d.w - .5) / a.originalWidth, (d.h - .5) / a.originalHeight))).toFixed(1);

  return <section ref={root} id="at-press" className={`atw-press${reduced ? ' is-still' : ''}`} aria-labelledby="at-press-title">
    <div className="atw-room-head">
      <h2 id="at-press-title" className="atw-h2">{t(L("The press", "印刷机"))}</h2>
      <p className="atw-lede">{t(L("The print check is the heart of Atelier, so here it is by hand. Choose a painting and keep scrolling: the press lays down its four inks one pass at a time, then the file’s pixels decide how big the print can go.", "印前检查是 Atelier 的核心，所以这里手动走一遍。选一幅画，继续往下滚：印刷机一次印一种墨，四遍印完，再由文件的像素决定这张画能印多大。"))}</p>
    </div>
    {reduced || phone ? <Picker a={a} setArtId={setArtId} className="atw-press-picker"/> : null}
    {reduced ? <StillPasses a={a} d={d} sep={sep} place={place}/> : <div ref={pin} className="atw-press-pin">
      <div className="atw-press-stage">
        <div className="atw-bed">
          <div className="atw-sheet" style={{'--pa': d.w / d.h}} role="img"
            aria-label={zh ? `${named(a, zh)}，印在 ${d.w} × ${d.h} 英寸的纸上${pass >= 0 ? `：${pass >= 4 ? '四种墨都已印完' : `正在印${t(INKS[pass].name)}`}` : ''}` : `${a.title}, printing on a ${d.w} by ${d.h} inch sheet${pass >= 0 ? `: ${pass >= 4 ? 'all four inks down' : `${t(INKS[pass].name).toLowerCase()} pass`}` : ''}`}>
            <div ref={area} className="atw-sheet-image" style={place.style}>
              {plates.map((ref, i) => <canvas key={INKS[i].id} ref={ref} className="atw-plate"/>)}
              {sep ? null : <span className="atw-sheet-wait">{t(L("Preparing the plates", "正在制版"))}</span>}
              <span ref={roller} className="atw-roller" aria-hidden="true"><i/></span>
            </div>
          </div>
        </div>
        <ol className="atw-fountain" aria-hidden="true">
          {INKS.map((ink, i) => <li key={ink.id} className={pass > i ? 'is-done' : pass === i ? 'is-now' : ''} style={{'--ink': ink.color}}><i/>{t(ink.name)}</li>)}
        </ol>
      </div>
      <div className="atw-press-text">
        {phone ? null : <Picker a={a} setArtId={setArtId}/>}
        <ol className={`atw-passes${pass >= 4 ? ' is-over' : ''}`}>
          {INKS.map((ink, i) => <li key={ink.id} className={pass > i ? 'is-done' : pass === i ? 'is-now' : ''} style={{'--ink': ink.color}} aria-current={pass === i ? 'step' : undefined}>
            <span className="atw-pass-n" aria-hidden="true">{i + 1}</span>
            <p><b>{t(ink.name)}{zh ? '。' : '.'}</b> {t(ink.text)}</p>
          </li>)}
        </ol>
        <div className={`atw-check-note${pass >= 4 ? ' is-on' : ''}`}>
          {zh
            ? <p><b>接着是检查。</b>{named(a, zh)}宽 {px(a.originalWidth)} 像素。在 {d.w} × {d.h} 英寸的纸上，画面宽 {imageInches} 英寸，所以每英寸纸能分到 {r.dpi} 个像素。</p>
            : <p><b>Then the check.</b> {a.title} is {px(a.originalWidth)} pixels wide. On a {d.w} × {d.h} in sheet the image spans {imageInches} in, so every inch of paper gets {r.dpi} of the file’s pixels.</p>}
          <p>{t(L("A sharp print needs about 300. Fewer, and the printer has to stretch the file to fill the paper, and the print goes soft. Atelier does this arithmetic before an artist can offer a size.", "要印得清楚，大约需要 300。少于这个数，打印机就得把文件拉伸到铺满纸面，印出来就会发虚。Atelier 在画师上架一个尺寸之前，就先把这笔账算好。"))}</p>
        </div>
        <p className="atw-caption">{t(L("A plain RGB-to-CMYK split of the file, drawn as ink on paper: how a print is built, not a printer’s real plates.", "把文件简单地从 RGB 拆成 CMYK，再画成纸上的墨：示意一张印品怎么叠出来，并不是印厂真实的印版。"))}</p>
      </div>
    </div>}
    <SizeCheck a={a} img={img} sizeId={sizeId} setSizeId={setSizeId} reduced={reduced}/>
  </section>;
}

/** The eight paintings as a radio group (arrow keys move and choose). */
export function Picker({a, setArtId, className = ''}) {
  const {t, zh} = useCaseLang();
  const group = useRef(null);
  const onKey = e => {
    const i = WORKS.findIndex(x => x.id === a.id);
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
    if (!step) return;
    e.preventDefault();
    const next = WORKS[(i + step + WORKS.length) % WORKS.length];
    setArtId(next.id);
    group.current?.querySelector(`[data-art="${next.id}"]`)?.focus();
  };
  return <div className={`atw-picker ${className}`}>
    <div ref={group} className="atw-picker-row" role="radiogroup" aria-label={t(L('Painting to print', '要印的画'))} onKeyDown={onKey}>
      {WORKS.map(x => <button key={x.id} type="button" role="radio" data-art={x.id} aria-checked={x.id === a.id} tabIndex={x.id === a.id ? 0 : -1}
        onClick={() => setArtId(x.id)} title={zh ? `${x.title}（${x.zh}）` : x.title}>
        <img src={thumbSrc(x.id)} alt={zh ? `${x.title}（${x.zh}）` : x.title} loading="lazy" decoding="async"/>
      </button>)}
    </div>
    <p className="atw-picker-name"><b lang="en">{a.title}</b>{zh ? <span>{a.zh}，原图 {px(a.originalWidth)} × {px(a.originalHeight)} px</span> : <span>{px(a.originalWidth)} × {px(a.originalHeight)} px, the original file</span>}</p>
  </div>;
}

/** Reduced motion: the four passes side by side, each sheet with one more ink than the last. */
function StillPasses({a, d, sep, place}) {
  const {t, zh} = useCaseLang();
  const refs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  useLayoutEffect(() => { if (sep) refs.forEach((ref, i) => ref.current && composite(ref.current, sep, i + 1)); }, [sep]);  // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="atw-still">
    <ol className="atw-still-row">
      {INKS.map((ink, i) => <li key={ink.id} style={{'--ink': ink.color}}>
        <div className="atw-sheet is-small" style={{'--pa': d.w / d.h}} role="img" aria-label={zh ? `${named(a, zh)}，印完${t(ink.name)}之后` : `${a.title} after the ${t(ink.name).toLowerCase()} pass`}>
          <div className="atw-sheet-image" style={place.style}><canvas ref={refs[i]} className="atw-plate is-flat"/></div>
        </div>
        <p><span className="atw-pass-n" aria-hidden="true">{i + 1}</span><span><b>{t(ink.name)}{zh ? '。' : '.'}</b> {t(ink.text)}</span></p>
      </li>)}
    </ol>
    <p className="atw-caption">{t(L("A plain RGB-to-CMYK split of the file, drawn as ink on paper: how a print is built, not a printer’s real plates.", "把文件简单地从 RGB 拆成 CMYK，再画成纸上的墨：示意一张印品怎么叠出来，并不是印厂真实的印版。"))}</p>
  </div>;
}

/* ---------- the print check, by hand ---------- */
const LOUPE = 300;   // canvas px: one inch of paper at 300 dpi fills it exactly

function SizeCheck({a, img, sizeId, setSizeId, reduced}) {
  const {t, zh} = useCaseLang();
  const w = workOf(a.id);
  const [focus, setFocus] = useState(w.focus);
  const [seen, setSeen] = useState(false);
  const mode = useInputMode();
  const canvas = useRef(null);
  useEffect(() => { setFocus(workOf(a.id).focus); }, [a.id]);
  const s = sizes.find(z => z.id === sizeId) || largestSharp(a), d = dimensions(a, s), r = printCheck(a, s), top = largestSharp(a);
  const exact = 1 / Math.min((d.w - .5) / a.originalWidth, (d.h - .5) / a.originalHeight);
  const zoomX = (LOUPE / exact);
  const instant = reduced || mode.keyed.current;

  // one square inch of paper, from the file's own pixels: `exact` source pixels squeezed (or stretched) into 300
  useEffect(() => {
    const c = canvas.current; if (!c || !img) return;
    c.width = LOUPE; c.height = LOUPE;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    const side = Math.min(exact, a.originalWidth, a.originalHeight);
    const sx = Math.min(Math.max(0, focus[0] * a.originalWidth - side / 2), a.originalWidth - side);
    const sy = Math.min(Math.max(0, focus[1] * a.originalHeight - side / 2), a.originalHeight - side);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, LOUPE, LOUPE);
    ctx.drawImage(img, sx, sy, side, side, 0, 0, LOUPE * side / exact, LOUPE * side / exact);
  }, [img, exact, focus, a]);

  const choose = id => { setSizeId(id); setSeen(true); };
  // the wall is the next room: a pointer glides there, Enter jumps
  const hang = e => {
    const target = document.getElementById('at-wall'); if (!target) return;
    e.preventDefault();
    target.scrollIntoView({behavior: reduced || e.detail === 0 ? 'auto' : 'smooth', block: 'start'});
    target.querySelector('.atw-pc-sizes button[aria-pressed=true]')?.focus({preventScroll: true});
  };
  const onKey = e => {
    const i = sizes.findIndex(z => z.id === s.id);
    const step = {ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1}[e.key];
    if (!step) return;
    e.preventDefault();
    const next = sizes[Math.min(sizes.length - 1, Math.max(0, i + step))];
    choose(next.id);
    e.currentTarget.querySelector(`[data-size="${next.id}"]`)?.focus();
  };

  // the sheets to scale: every size outlined, the chosen one printed, the loupe's inch marked
  const S = {w: 27, h: a.originalWidth >= a.originalHeight ? 20.6 : 26};
  const floor = S.h - .8, sx0 = 1.2, sy0 = floor - d.h;
  const pl = placement(a, d);
  const ix = sx0 + pl.x + focus[0] * pl.iw - .5, iy = sy0 + pl.y + focus[1] * pl.ih - .5;
  const pick = e => {
    const svg = e.currentTarget, pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM().inverse());
    const fx = (p.x - sx0 - pl.x) / pl.iw, fy = (p.y - sy0 - pl.y) / pl.ih;
    if (fx >= 0 && fx <= 1 && fy >= 0 && fy <= 1) { setFocus([fx, fy]); setSeen(true); }
  };

  return <div className={`atw-check${r.ok ? '' : ' is-soft'}`} {...mode.bind}>
    <div className="atw-check-head">
      <h3 className="atw-h3">{t(L("How big can it go?", "能印多大？"))}</h3>
      <p className="atw-check-ask">{t(L("Pick a size. The loupe shows one square inch of the print, made from the file’s own pixels.", "选一个尺寸。放大镜里是印品上的一平方英寸，用的是文件本身的像素。"))}</p>
    </div>
    <div className="atw-check-grid">
      <figure className="atw-loupe-fig">
        <div className="atw-loupe-lens">
          <canvas ref={canvas} className="atw-loupe-canvas" role="img"
            aria-label={zh ? `${named(a, zh)}印成 ${d.w} × ${d.h} 英寸时的一平方英寸：每英寸 ${r.dpi} 个像素，${r.ok ? '印得清楚' : '发虚'}` : `One square inch of ${a.title} printed at ${d.w} by ${d.h} inches: ${r.dpi} of the file’s pixels per inch${r.ok ? ', sharp' : ', soft'}`}/>
          {img ? null : <span className="atw-sheet-wait">{t(L("Loading the original file", "正在加载原图"))}</span>}
        </div>
        <figcaption className="atw-caption">{zh
          ? `放大后的一英寸纸面。这里由文件的 ${Math.round(exact)} 个像素铺满${zoomX > 1.05 ? `，每个像素被拉伸了约 ${zoomX.toFixed(1)} 倍` : ''}。`
          : `One inch of paper, enlarged. Here ${Math.round(exact)} pixels of the file fill it${zoomX > 1.05 ? `, each stretched about ${zoomX.toFixed(1)} times` : ''}.`}</figcaption>
      </figure>
      <div className="atw-check-read">
        <div className="atw-sizes" role="radiogroup" aria-label={t(L('Print size', '印刷尺寸'))} onKeyDown={onKey}>
          {sizes.map(z => { const ok = printCheck(a, z).ok;
            return <button key={z.id} type="button" role="radio" data-size={z.id} aria-checked={z.id === s.id} tabIndex={z.id === s.id ? 0 : -1}
              className={ok ? '' : 'is-no'} onClick={() => choose(z.id)}>{inches(a, z)}<span className="atw-sr">{zh ? (ok ? ' 英寸，印得清楚' : ' 英寸，低于 300 dpi') : (ok ? ' inches, sharp' : ' inches, below 300 dpi')}</span></button>; })}
        </div>
        <p className="atw-dpi"><Tween value={r.dpi} instant={instant}/><span>dpi</span></p>
        <p className="atw-sentence" aria-live="polite">{checkLine(a, s, zh)}</p>
        <p className="atw-offer">{zh ? `Atelier 为${named(a, zh)}提供的最大尺寸是 ${inches(a, top)} 英寸。` : `Atelier offers ${a.title} up to ${inches(a, top)} in.`}</p>
        <svg className="atw-scale" viewBox={`0 0 ${S.w} ${S.h}`} onClick={pick} role="img" aria-label={zh ? `按比例画出的 ${d.w} × ${d.h} 英寸纸张，旁边是其他尺寸；标出的小方块就是放大镜里的那一英寸` : `The ${d.w} by ${d.h} inch sheet drawn to scale against the other sizes; the marked square is the loupe’s inch`}>
          <path className="atw-scale-floor" d={`M0 ${floor} H${S.w}`}/>
          {sizes.map(z => { const q = dimensions(a, z); return <rect key={z.id} className={`atw-scale-ghost${printCheck(a, z).ok ? '' : ' is-no'}`} x={sx0} y={floor - q.h} width={q.w} height={q.h}/>; })}
          <rect className="atw-scale-paper" x={sx0} y={sy0} width={d.w} height={d.h}/>
          <image href={fullSrc(a.id)} x={sx0 + pl.x} y={sy0 + pl.y} width={pl.iw} height={pl.ih} preserveAspectRatio="none"/>
          <rect className="atw-scale-inch" x={ix} y={iy} width="1" height="1"/>
        </svg>
        <p className="atw-caption">{t(L("Drawn to scale: every size the app offers, outlined. Click the print to move the loupe.", "按比例绘制：线框是 app 提供的全部尺寸。点击画面可以移动放大镜。"))}</p>
        <a className="atw-link atw-hang-link" href="#at-wall" onClick={hang}><span className="atw-link-text">{zh ? (r.ok ? `按 ${inches(a, s)} 英寸挂上墙` : `挂上能印清楚的最大尺寸，${inches(a, top)} 英寸`) : (r.ok ? `Hang it on the wall at ${inches(a, s)} in` : `Hang the largest sharp size, ${inches(a, top)} in`)}</span><ArrowDown/></a>
      </div>
    </div>
    <Takeaway show={seen} instant={instant}>{t(L("The file sets the ceiling, and the artist sees it before anything is on sale.", "上限由文件决定，画师在上架之前就能看到。"))}</Takeaway>
  </div>;
}
