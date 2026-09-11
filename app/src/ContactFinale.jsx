import { useCallback, useEffect, useRef, useState } from 'react';
import { author } from './portfolioData';
import BrandFinale from './components/BrandFinale';
import ExpressiveTitle from './components/ExpressiveTitle';
import './contact-finale.css';

const modalHasPriority = () => [...document.querySelectorAll('dialog[open], [role="dialog"][aria-modal="true"]')]
  .some(dialog => dialog.getClientRects().length && !dialog.hidden);

function Letter({ open }) {
  return <svg className={`cfx-object cfx-letter${open ? ' is-open' : ''}`} viewBox="0 0 64 64" aria-hidden="true">
    <path className="cfx-letter-back" d="M7 29l25-18 25 18v26H7z" />
    <g className="cfx-letter-paper">
      <path className="cfx-paper-sheet" d="M16 22h32v29H16z" />
      <path d="M23 29h18M23 35h18M23 41h11" />
    </g>
    <path className="cfx-letter-front" d="M7 29l25 16 25-16v26H7z" />
    <path d="M7 55l18-15M57 55L39 40" />
  </svg>;
}
function Telephone({ open }) {
  return <svg className={`cfx-object cfx-phone${open ? ' is-open' : ''}`} viewBox="0 0 64 64" aria-hidden="true">
    <path className="cfx-phone-cord cfx-phone-cord-rest" d="M17 36c-6 3-5 11 1 11s4-7 10-6 2 10 9 8 7-7 13-4" />
    <path className="cfx-phone-cord cfx-phone-cord-lifted" d="M14 29c-11 7-1 22 7 18s14-7 18-3 12 6 17 0" />
    <path className="cfx-phone-receiver" d="M8 25C12 12 52 12 56 25l-5 12-11-3v-8c-5-3-11-3-16 0v8l-11 3z" />
  </svg>;
}

// The surface moves its light, not its hit target. Touch keeps the same clear
// disclosure states; reduced motion ignores pointer-driven light updates.
function useContactLight(reduced) {
  const surfaces = useRef(new Set());
  const motionAllowed = useRef(false);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    const reset = () => {
      motionAllowed.current = !reduced && !preference.matches && !document.hidden;
      surfaces.current.forEach(surface => {
        delete surface.dataset.pointer;
        surface.style.removeProperty('--cfx-light-x');
        surface.style.removeProperty('--cfx-light-y');
        if (!surface.isConnected) surfaces.current.delete(surface);
      });
    };
    preference.addEventListener('change', reset);
    document.addEventListener('visibilitychange', reset);
    reset();
    return () => {
      reset(); surfaces.current.clear();
      preference.removeEventListener('change', reset);
      document.removeEventListener('visibilitychange', reset);
    };
  }, [reduced]);
  const move = useCallback(event => {
    if (!motionAllowed.current || event.pointerType === 'touch') return;
    const surface = event.currentTarget;
    const bounds = surface.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    surfaces.current.forEach(previous => { if (!previous.isConnected) surfaces.current.delete(previous); });
    surfaces.current.add(surface);
    surface.style.setProperty('--cfx-light-x', `${Math.max(0, Math.min(100, (event.clientX - bounds.left) / bounds.width * 100))}%`);
    surface.style.setProperty('--cfx-light-y', `${Math.max(0, Math.min(100, (event.clientY - bounds.top) / bounds.height * 100))}%`);
    surface.dataset.pointer = 'true';
  }, []);
  const leave = useCallback(event => { delete event.currentTarget.dataset.pointer; }, []);
  return { onPointerMove: move, onPointerLeave: leave, onPointerCancel: leave };
}

function QuietAtmosphere() {
  return <div className="cfx-atmosphere" aria-hidden="true">
    <svg className="cfx-branch-shadow" viewBox="0 0 1000 760" fill="none">
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1040-70C840 108 810 266 676 347S437 426 310 627" strokeWidth="13" />
        <path d="M849 166C749 134 611 119 515 27M739 297C701 179 726 92 685-25M610 381C531 321 462 215 380 186M464 461C346 429 236 461 137 401M348 571C367 468 331 370 274 331" strokeWidth="5" />
        <path d="M768 146L752 55M647 102L625 5M697 207L586 170M539 307L541 230M449 264L366 298M315 438L251 376M365 477L409 375M293 362L204 325" strokeWidth="2.4" />
      </g>
      <g fill="currentColor">
        <ellipse cx="755" cy="67" rx="12" ry="32" transform="rotate(-30 755 67)" />
        <ellipse cx="584" cy="170" rx="30" ry="11" transform="rotate(18 584 170)" />
        <ellipse cx="540" cy="232" rx="11" ry="28" transform="rotate(9 540 232)" />
        <ellipse cx="364" cy="299" rx="29" ry="11" transform="rotate(-24 364 299)" />
        <ellipse cx="408" cy="378" rx="11" ry="30" transform="rotate(23 408 378)" />
        <ellipse cx="251" cy="377" rx="10" ry="26" transform="rotate(-32 251 377)" />
      </g>
    </svg>
    <div className="cfx-passing-light" />
  </div>;
}

export default function ContactFinale({ lang = 'zh', reduced = false, onNavigate, onAbout }) {
  const en = lang === 'en';
  const [active, setActive] = useState(null);
  const [copyState, setCopyState] = useState('');
  const sectionRef = useRef(null);
  const triggerRef = useRef(null), panelRef = useRef(null), copyRequest = useRef(0), activeRef = useRef(null), restoreFrame = useRef(0);
  const light = useContactLight(reduced);
  useEffect(() => () => { copyRequest.current += 1; cancelAnimationFrame(restoreFrame.current); }, []);
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const sync = () => section.classList.toggle('has-ambient-motion', visible && !reduced && !preference.matches && !document.hidden);
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= 0.025);
      sync();
    }, { threshold: [0, 0.025] });
    observer.observe(section.querySelector('.cfx-atmosphere') || section);
    preference.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      observer.disconnect(); preference.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      section.classList.remove('has-ambient-motion');
    };
  }, [reduced]);
  const close = useCallback((restore = true) => {
    cancelAnimationFrame(restoreFrame.current);
    activeRef.current = null;
    copyRequest.current += 1; setActive(null); setCopyState('');
    if (restore) restoreFrame.current = requestAnimationFrame(() => {
      if (!activeRef.current && !modalHasPriority()) {
        const trigger = triggerRef.current;
        trigger?.focus({ preventScroll: true });
        const bounds = trigger?.getBoundingClientRect();
        if (bounds && (bounds.top < 80 || bounds.bottom > innerHeight - 20)) trigger.scrollIntoView({ block: 'center', behavior: 'instant' });
      }
    });
  }, []);
  useEffect(() => {
    if (!active) return undefined;
    const frame = requestAnimationFrame(() => {
      if (activeRef.current === active && !modalHasPriority()) {
        const panel = panelRef.current;
        panel?.querySelector('[data-primary-action]')?.focus({ preventScroll: true });
        const bounds = panel?.getBoundingClientRect();
        if (bounds && (bounds.top < 80 || bounds.bottom > innerHeight - 20)) panel.scrollIntoView({ block: 'center', behavior: reduced ? 'instant' : 'smooth' });
      }
    });
    const escape = event => {
      if (event.key !== 'Escape' || event.defaultPrevented || activeRef.current !== active) return;
      // A newly opened About/works dialog owns Escape, even before this
      // disclosure's passive effect has finished cleaning up.
      if (modalHasPriority()) return;
      event.preventDefault(); close();
    };
    document.addEventListener('keydown', escape);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('keydown', escape); };
  }, [active, close, reduced]);
  const toggle = (kind, event) => {
    cancelAnimationFrame(restoreFrame.current);
    triggerRef.current = event.currentTarget;
    copyRequest.current += 1; setCopyState('');
    if (active === kind) close(); else { activeRef.current = kind; setActive(kind); }
  };
  const navigate = (id, event) => {
    event?.preventDefault(); close(false);
    if (id === 'about') { onAbout?.(); return; }
    if (onNavigate) { onNavigate(id); return; }
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'instant' : 'smooth' });
  };
  const value = active === 'phone' ? author.phone : author.email;
  const copy = async () => {
    const request = ++copyRequest.current;
    setCopyState('pending');
    try {
      await navigator.clipboard.writeText(value);
      if (copyRequest.current === request) setCopyState('done');
    } catch { if (copyRequest.current === request) setCopyState('failed'); }
  };

  return <section ref={sectionRef} id="contact" data-nav-tone="light" className={`contact-finale${reduced ? ' is-reduced' : ''}`} aria-labelledby="cfx-title">
    <QuietAtmosphere />
    <div className="cfx-topline"><span>LET’S WORK TOGETHER</span><span className="cfx-availability"><i />{en ? 'A conversation starts here' : '从一次交谈开始'}</span></div>
    <div className="cfx-introduction">
      <h2 id="cfx-title" aria-label={en ? 'Good ideas. Real experiences.' : '把想法，做成体验。'} className={`cfx-title${en ? ' cfx-title-en' : ''}`}>
        <span><ExpressiveTitle reduced={reduced}>{en ? 'GOOD IDEAS.' : '把想法，'}</ExpressiveTitle></span>
        <span><ExpressiveTitle reduced={reduced}>{en ? 'REAL EXPERIENCES.' : '做成体验。'}</ExpressiveTitle><i aria-hidden="true">✳</i></span>
      </h2>
      <div className="cfx-note"><p><ExpressiveTitle reduced={reduced} variant="type" typingSpeed={44}>{en ? 'From the first thought to the final detail.' : '从最初的念头，到体验的每一处。'}</ExpressiveTitle></p><span>{en ? 'Systems, visual worlds, and the work that connects them. Let’s talk.' : '关于系统策划、视觉创作，或两者之间的新可能，欢迎聊聊。'}</span></div>
    </div>

    <div className="cfx-grid">
      <div className={`cfx-cell cfx-contact-cell cfx-email${active === 'email' ? ' is-open' : ''}`} {...light}>
        <span className="cfx-label">01 / {en ? 'WRITE' : '留一封信'}</span>
        <button className="cfx-contact-trigger" type="button" aria-expanded={active === 'email'} aria-controls="cfx-action-panel" onClick={event => toggle('email', event)}>
          <span className="cfx-trigger-content"><span className="cfx-contact-value">{author.email}</span><span className="cfx-trigger-invite">{active === 'email' ? (en ? 'Close details' : '收起联系选项') : (en ? 'Open a note' : '展开纸笺')}<i aria-hidden="true">{active === 'email' ? '−' : '↗'}</i></span></span><span className="cfx-object-well"><Letter open={active === 'email'} /></span>
        </button>
        <span className="cfx-cell-note">{en ? 'An idea, a brief, or a simple hello.' : '一个想法，一份需求，或一句你好。'}</span>
      </div>
      <div className={`cfx-cell cfx-contact-cell cfx-phone-cell${active === 'phone' ? ' is-open' : ''}`} {...light}>
        <span className="cfx-label">02 / {en ? 'SAY HELLO' : '打个招呼'}</span>
        <button className="cfx-contact-trigger" type="button" aria-expanded={active === 'phone'} aria-controls="cfx-action-panel" onClick={event => toggle('phone', event)}>
          <span className="cfx-trigger-content"><span className="cfx-contact-value">{author.phone}</span><span className="cfx-trigger-invite">{active === 'phone' ? (en ? 'Close details' : '收起联系选项') : (en ? 'Pick up the receiver' : '拿起听筒')}<i aria-hidden="true">{active === 'phone' ? '−' : '↗'}</i></span></span><span className="cfx-object-well"><Telephone open={active === 'phone'} /></span>
        </button>
        <span className="cfx-cell-note">{en ? 'Good things start with hello.' : '从一句你好开始。'}</span>
      </div>
      <nav className="cfx-cell cfx-nav" aria-label={en ? 'Explore the portfolio' : '浏览作品集'}>
        <span className="cfx-label">03 / {en ? 'EXPLORE' : '继续看看'}</span>
        <a href="#systems" onClick={event => navigate('systems', event)}>{en ? 'Systems' : '系统策划'} <span>↗</span></a>
        <a href="/works" onClick={event => navigate('art', event)}>{en ? 'Art & worlds' : '美术作品'} <span>↗</span></a>
        <button type="button" onClick={event => navigate('about', event)}>{en ? 'About Jay' : '关于我'} <span>↗</span></button>
      </nav>
      <div className="cfx-cell cfx-return">
        <span className="cfx-label">04 / {en ? 'ONCE MORE' : '再走一遍'}</span>
        <a href="#home" className="cfx-backtop" onClick={event => navigate('home', event)}><span aria-hidden="true">↑</span>{en ? 'Back to top' : '回到开场'}</a>
      </div>
    </div>

    <div id="cfx-action-panel" className={`cfx-panel-wrap${active ? ' is-open' : ''}`}>
      {active && <div key={active} ref={panelRef} className="cfx-panel" data-kind={active} role="region" aria-labelledby="cfx-panel-title" {...light}>
        <div className="cfx-panel-heading"><span className="cfx-label" id="cfx-panel-title">{active === 'email' ? (en ? 'A NOTE TO JAY' : '写给林世杰') : (en ? 'IT STARTS WITH HELLO' : '从一句你好开始')}</span><p>{value}</p></div>
        <div className="cfx-panel-actions">
          <a data-primary-action href={active === 'email' ? `mailto:${author.email}` : author.phoneHref}>{active === 'email' ? (en ? 'Write an email' : '写邮件') : (en ? 'Make a call' : '拨打电话')} <span>↗</span></a>
          <button type="button" onClick={copy} disabled={copyState === 'pending'}>{copyState === 'done' ? (en ? 'Copied' : '已复制') : copyState === 'pending' ? (en ? 'Copying' : '复制中') : (en ? 'Copy' : '复制')} <span>{copyState === 'done' ? '✓' : '⧉'}</span></button>
        </div>
        <button className="cfx-close" type="button" aria-label={en ? 'Close contact details' : '关闭联系方式'} onClick={() => close()}>×</button>
        <span className={`cfx-copy-status${copyState === 'done' ? ' is-stamped' : ''}`} role="status" aria-live="polite">{copyState === 'done' ? (en ? 'COPIED ✓' : '已复制 ✓') : copyState === 'failed' ? (en ? 'Please select and copy the address above.' : '请选中上方联系方式复制。') : ''}</span>
      </div>}
    </div>

    <div className="cfx-signature-meta"><span>JAY LIN · {en ? 'SYSTEMS & VISUAL WORLDS' : '系统策划与视觉创作'}</span><span>© {new Date().getFullYear()}</span></div>
    <BrandFinale lang={lang} reduced={reduced} />
    <p className="cfx-last-line">{en ? 'Made with a little logic. And a little wonder.' : '一点逻辑，一点想象。'}</p>
  </section>;
}
