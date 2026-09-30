import { useCallback, useRef } from 'react';
import Office3D from './office3d/Office3D';
import useLegacyIntro from './useLegacyIntro';
import ExpressiveTitle from './components/ExpressiveTitle';
import './legacy-hero.css';

// The office, and the move into its screen. Once the screen has gone dark the homepage journey takes over
// (onestroke/OneStroke.jsx): the monitor switches on as a line, and the line is the horizon of a lake.
export default function LegacyHero({ lang = 'zh', reduced = false }) {
  const rootRef = useRef(null), progressRef = useRef(0);
  const officeMode = useCallback(mode => {
    if (!rootRef.current) return;
    rootRef.current.dataset.officeRenderer = mode;
    rootRef.current.dispatchEvent(new Event('office:mode'));
  }, []);
  const quiet = reduced, english = lang === 'en';
  const { touring, toggleTour, chapter } = useLegacyIntro({ rootRef, progressRef, reduced: quiet });
  const goToWork = event => {
    event.preventDefault();
    const target = document.getElementById('systems');
    if (target) { target.scrollIntoView({ behavior: 'instant' }); window.dispatchEvent(new Event('journey:jump')); target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  };
  return <section ref={rootRef} id="home" className={`intro-journey legacy-hero${quiet ? ' legacy-static' : ''}`} data-nav-tone="dark" aria-label={english ? 'The studio, and its screen into the work' : '工作室，与通往作品的那块屏幕'}>
    <div className="intro-stage">
      <div className="legacy-office-wrap"><div className="office-camera"><Office3D lang={lang} reducedMotion={quiet} progressRef={progressRef} onMode={officeMode} /><div className="legacy-screen-glint" /></div></div>
      <div className="legacy-blackout" />
      <div className="office-copy legacy-scene-copy"><div className="legacy-signature"><ExpressiveTitle variant="type" typingSpeed={80} reduced={quiet} hover={false}>Jay Lin</ExpressiveTitle></div><p><ExpressiveTitle variant="type" typingSpeed={36} reduced={quiet} hover={false}>{english ? 'SYSTEMS DESIGN / VISUAL ART' : '系统策划 / 视觉创作'}</ExpressiveTitle></p><a className="legacy-text-link" href="#systems" onClick={goToWork}><ExpressiveTitle variant="type" typingSpeed={42} reduced={quiet} hover={false}>{english ? 'Explore the work ↗' : '直接看作品 ↗'}</ExpressiveTitle></a></div>
      <div className="legacy-film-foot"><span className="legacy-chapter"><ExpressiveTitle variant="type" typingSpeed={32} reduced={quiet} hover={false}>{chapter}</ExpressiveTitle></span><button type="button" onClick={toggleTour} aria-pressed={touring}><span aria-hidden="true">{touring ? 'Ⅱ' : '▷'}</span><ExpressiveTitle variant="type" typingSpeed={32} reduced={quiet} hover={false}>{touring ? (english ? 'Pause tour' : '暂停游览') : (english ? 'Guided tour' : '自动游览')}</ExpressiveTitle></button><span className="legacy-scroll-cue"><i /><ExpressiveTitle variant="type" typingSpeed={32} reduced={quiet} hover={false}>{english ? 'Scroll to step inside' : '滚动，走进来'}</ExpressiveTitle></span></div>
      <div className="legacy-film-progress" aria-hidden="true"><i /></div><div className="legacy-pointer" aria-hidden="true"><i /></div>
      <div className="intro-follow" aria-hidden="true" />
    </div>
    <div className="legacy-static-caption" data-nav-tone="light"><p>{english ? 'A world to step into. Rules that create possibilities.' : '想让人走进去的世界，也有值得探索的规则。'}</p><a href="#systems" onClick={goToWork}>{english ? 'Explore the work ↗' : '浏览作品 ↗'}</a></div>
  </section>;
}
