import { useEffect, useRef, useState } from 'react';
import { featuredWorks } from '../portfolioData';
import ExpressiveTitle from '../components/ExpressiveTitle';
import './art-desk.css';

const PRINT_IDS = ['world-tree', 'background-painting', 'character-vis-dev'];
const PRINTS = PRINT_IDS.map(id => featuredWorks.find(work => work.id === id));
const ASPECTS = [1760 / 688, 4096 / 2160, 4800 / 2700];
const PAPER_WIDTH = 1200;
const BOARD = { width: 1587, height: 991 };
const SLOTS = [
  { corners: [[337, 221], [1435, 77], [1597, 511], [355, 657]], referenceHeight: 534 },
  { corners: [[449, 420], [1256, 279], [1408, 705], [510, 866]], referenceHeight: 692 },
  { corners: [[646, 837], [1427, 724], [1558, 1236], [682, 1348]], referenceHeight: 732 },
];

// Project the native print, caption and paper edge together into the photographed
// desk. Each original keeps its own aspect ratio before the camera projection.
function paperProjection(rank, aspect, selectedAspect) {
  const height = (PAPER_WIDTH - 58) / aspect + 84;
  const { corners, referenceHeight } = SLOTS[rank];
  const [p0, p1, bottomRight, bottomLeft] = corners;
  const ratio = height / referenceHeight;
  const p2 = [bottomRight[0], p1[1] + (bottomRight[1] - p1[1]) * ratio];
  const p3 = [bottomLeft[0], p0[1] + (bottomLeft[1] - p0[1]) * ratio];
  // A panorama under a taller selected drawing still needs a visible paper lip.
  // Slide the second print down so it never disappears entirely beneath it.
  const frontHeight = (PAPER_WIDTH - 58) / selectedAspect + 84;
  const offsetY = rank === 1 ? 866 + Math.max(0, frontHeight - 534) * .24 - p3[1] : 0;
  const dx1 = p1[0] - p2[0], dx2 = p3[0] - p2[0];
  const dy1 = p1[1] - p2[1], dy2 = p3[1] - p2[1];
  const dx3 = p0[0] - p1[0] + p2[0] - p3[0];
  const dy3 = p0[1] - p1[1] + p2[1] - p3[1];
  const denominator = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;
  const a = p1[0] - p0[0] + g * p1[0];
  const b = p3[0] - p0[0] + h * p3[0];
  const d = p1[1] - p0[1] + g * p1[1];
  const e = p3[1] - p0[1] + h * p3[1];
  return {
    '--print-aspect': aspect,
    '--print-height': `${height}px`,
    '--print-projection': `translateY(${offsetY}px) matrix3d(${a / PAPER_WIDTH},${d / PAPER_WIDTH},0,${g / PAPER_WIDTH},${b / height},${e / height},0,${h / height},0,0,1,0,${p0[0]},${p0[1]},0,1)`,
  };
}

function initialSelection() {
  try {
    const saved = Number(sessionStorage.getItem('jay-art-desk-selection'));
    return Number.isInteger(saved) && saved >= 0 && saved < PRINTS.length ? saved : 0;
  } catch { return 0; }
}

function PlainLink({ href, onNavigate, children, ...props }) {
  return <a href={href} {...props} onClick={event => {
    if (!onNavigate || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onNavigate(href);
  }}>{children}</a>;
}

/** Full-screen Art entrance. Routing stays with the parent; this page preserves
 * the selected print during a detail visit and provides ordinary URL fallbacks. */
export default function ArtDesk({ lang = 'zh', reduced = false, onNavigate }) {
  const english = lang === 'en';
  const root = useRef(null);
  const tabs = useRef([]);
  const timer = useRef(0);
  const [selected, setSelected] = useState(initialSelection);
  const [moving, setMoving] = useState(false);
  const [lamp, setLamp] = useState(true);
  const [failedImages, setFailedImages] = useState({});
  const [photoFailed, setPhotoFailed] = useState(false);
  const current = PRINTS[selected];

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      const scale = Math.max(width / BOARD.width, height / BOARD.height);
      element.style.setProperty('--desk-scale', scale.toFixed(6));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // A few physical millimetres of paper movement, only while a fine pointer is
  // present. No continuous RAF, no interception of the page's scrolling input.
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const fine = matchMedia('(pointer: fine)');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, last = 0, x = 0, y = 0, tx = 0, ty = 0;
    const allowed = () => !reduced && fine.matches && !motion.matches && !document.hidden;
    const paint = () => {
      element.style.setProperty('--desk-x', `${x.toFixed(3)}px`);
      element.style.setProperty('--desk-y', `${y.toFixed(3)}px`);
    };
    const tick = time => {
      frame = 0;
      const dt = Math.min((time - (last || time)) / 1000, .05);
      last = time;
      const ease = 1 - Math.exp(-dt * 7);
      x += (tx - x) * ease;
      y += (ty - y) * ease;
      paint();
      if (Math.abs(tx - x) + Math.abs(ty - y) > .015 && allowed()) frame = requestAnimationFrame(tick);
      else last = 0;
    };
    const start = () => { if (!frame && allowed()) frame = requestAnimationFrame(tick); };
    const move = event => {
      if (!allowed()) return;
      const box = element.getBoundingClientRect();
      tx = ((event.clientX - box.left) / box.width - .5) * 5;
      ty = ((event.clientY - box.top) / box.height - .5) * 4;
      start();
    };
    const leave = () => { tx = 0; ty = 0; start(); };
    const reset = () => {
      cancelAnimationFrame(frame); frame = 0; last = 0;
      x = y = tx = ty = 0; paint();
    };
    element.addEventListener('pointermove', move, { passive: true });
    element.addEventListener('pointerleave', leave, { passive: true });
    document.addEventListener('visibilitychange', reset);
    motion.addEventListener('change', reset);
    fine.addEventListener('change', reset);
    return () => {
      reset();
      element.removeEventListener('pointermove', move);
      element.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', reset);
      motion.removeEventListener('change', reset);
      fine.removeEventListener('change', reset);
    };
  }, [reduced]);

  function selectPrint(index, focus = false) {
    if (index !== selected) {
      clearTimeout(timer.current);
      setSelected(index);
      setMoving(!reduced);
      try { sessionStorage.setItem('jay-art-desk-selection', String(index)); } catch { /* Selection works without storage. */ }
      timer.current = setTimeout(() => setMoving(false), 900);
    }
    if (focus) tabs.current[index]?.focus({ preventScroll: true });
  }

  function navigateTabs(event) {
    let next = selected;
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (selected + 1) % PRINTS.length;
    else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (selected + PRINTS.length - 1) % PRINTS.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = PRINTS.length - 1;
    else return;
    event.preventDefault();
    selectPrint(next, true);
  }

  return <section ref={root} className={`art-desk${reduced ? ' art-desk--quiet' : ''}${lamp ? '' : ' art-desk--lamp-off'}${photoFailed ? ' art-desk--no-photo' : ''}`} style={{ '--front-aspect': ASPECTS[selected] }} lang={english ? 'en' : 'zh'} aria-labelledby="art-desk-heading" data-nav-tone="light">
    <div className="art-desk__scene" aria-hidden="true">
      <img className="art-desk__environment" src="/assets/art-desk/desk-environment.png" alt="" onError={() => setPhotoFailed(true)} fetchPriority="high" />
      <div className="art-desk__room-shade" />
    </div>

    <div className="art-desk__prints" aria-label={english ? 'Selected original artwork' : '精选原作'}>
      <div className="art-desk__board">
        {PRINTS.map((work, index) => {
          const rank = (index - selected + PRINTS.length) % PRINTS.length;
          const front = rank === 0;
          const name = english ? work.titleEn : work.title;
          return <div key={work.id} className={`art-desk__print art-desk__print--${rank}${front && moving ? ' is-settling' : ''}`} style={paperProjection(rank, ASPECTS[index], ASPECTS[selected])} data-slot={rank} aria-hidden={!front}>
            <div className="art-desk__paper">
              <button type="button" className="art-desk__sheet-button" onClick={() => {
                if (front) onNavigate ? onNavigate(work.href) : window.location.assign(work.href);
                else selectPrint(index);
              }} tabIndex={front ? 0 : -1} aria-label={front ? (english ? `Open the complete original: ${name}` : `查看完整原作：${name}`) : (english ? `Bring ${name} to the front` : `将${name}置顶`)}>
                <span className="art-desk__picture" style={{ aspectRatio: ASPECTS[index] }}>
                  <img src={work.image} alt={name} decoding="async" draggable="false" loading="eager" onError={() => setFailedImages(previous => ({ ...previous, [work.id]: true }))} />
                  {failedImages[work.id] && <span className="art-desk__image-fallback">{name}<small>{english ? 'Open original artwork ↗' : '查看原作 ↗'}</small></span>}
                  <span className="art-desk__paper-light" />
                </span>
                <span className="art-desk__print-caption"><span>{work.titleEn.toUpperCase()}<b> / </b>{work.title}</span><span>{String(index + 1).padStart(2, '0')} / 03</span></span>
                <span className="art-desk__sheet-corner" aria-hidden="true">↗</span>
              </button>
            </div>
          </div>;
        })}
      </div>
    </div>

    <div className="art-desk__lamp-front" aria-hidden="true" />
    <div className="art-desk__foreground" aria-hidden="true" />
    <div className="art-desk__left-shade" aria-hidden="true" />

    <header className="art-desk__intro">
      <p className="art-desk__chapter">03 / ART</p>
      <h1 id="art-desk-heading" aria-label="VISUAL WORLDS"><span><ExpressiveTitle reduced={reduced}>VISUAL</ExpressiveTitle></span><span><ExpressiveTitle reduced={reduced}>WORLDS</ExpressiveTitle></span></h1>
      <p className="art-desk__subtitle">{english ? 'Art & visual development' : '美术作品'}</p>
      <div className="art-desk__index" role="tablist" aria-label={english ? 'Select a print' : '选择画稿'} aria-orientation="vertical" onKeyDown={navigateTabs}>
        {PRINTS.map((work, index) => <button key={work.id} ref={element => { tabs.current[index] = element; }} id={`art-desk-tab-${work.id}`} role="tab" type="button" aria-selected={index === selected} aria-controls="art-desk-selection" tabIndex={index === selected ? 0 : -1} className={index === selected ? 'is-active' : ''} onClick={() => selectPrint(index)}><span>{String(index + 1).padStart(2, '0')}</span><span>{english ? work.titleEn : work.title}</span></button>)}
      </div>
    </header>

    <div className="art-desk__selection" role="tabpanel" id="art-desk-selection" aria-labelledby={`art-desk-tab-${current.id}`}>
      <span className="art-desk__selection-category">{english ? current.categoryEn : current.category}</span>
      <PlainLink href={current.href} onNavigate={onNavigate} className="art-desk__original-link">{english ? 'View original' : '查看原作'}<span aria-hidden="true">↗</span></PlainLink>
    </div>

    <PlainLink className="art-desk__archive" href="/works/archive" onNavigate={onNavigate}><span>{english ? 'All works' : '全部作品'}</span><span aria-hidden="true">↗</span></PlainLink>
    <button className="art-desk__lamp-control" type="button" aria-pressed={lamp} onClick={() => setLamp(value => !value)} aria-label={english ? (lamp ? 'Turn the desk lamp off' : 'Turn the desk lamp on') : (lamp ? '关闭台灯' : '打开台灯')}><span className="art-desk__power" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M12 3v9M7.3 5.9a8 8 0 1 0 9.4 0"/></svg></span><span>{english ? 'DESK LIGHT' : '台灯'}<b>{lamp ? 'ON' : 'OFF'}</b></span></button>
    <button className="art-desk__lamp-hotspot" type="button" tabIndex={-1} aria-hidden="true" onClick={() => setLamp(value => !value)} title={english ? 'Switch the desk lamp' : '开关台灯'} />
    <p className="art-desk__hint" aria-live="polite">{english ? `0${selected + 1} / 03 · Select a print. Look a little closer.` : `0${selected + 1} / 03 · 翻一张画稿，走近一点。`}</p>
  </section>;
}
