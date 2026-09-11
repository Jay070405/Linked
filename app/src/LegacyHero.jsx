import { useRef, useState } from 'react';
import LiquidOffice from './LiquidOffice';
import VideoRefraction from './VideoRefraction';
import useLegacyIntro from './useLegacyIntro';
import EditorialMotion,{FocusLine} from './components/EditorialMotion';
import ExpressiveTitle from './components/ExpressiveTitle';
import './legacy-hero.css';

function ReactiveType({ children, className = '' }) {
  return <span className={`legacy-reactive ${className}`} aria-label={children}>{[...children].map((letter, index) => letter === ' ' ? ' ' : <span className="legacy-letter" key={index} aria-hidden="true">{letter}</span>)}</span>;
}

function LegacyCreativeTitle() {
  // Match the actual V13 post-split DOM: CREATIVE letters are direct children,
  // while portfolio letters have one extra span ancestor and inherit its scale.
  const letters = text => [...text].map((letter, index) => <span className="legacy-letter" key={index} aria-hidden="true">{letter}</span>);
  return <h1 className="legacy-reactive" aria-label="CREATIVE portfolio.">{letters('CREATIVE')}<span className="legacy-italic" aria-hidden="true">{letters('portfolio.')}</span></h1>;
}

function Marquee({ text, reverse = false }) {
  return <div className={`legacy-marquee ${reverse ? 'legacy-marquee-reverse' : ''}`} aria-hidden="true"><div className="legacy-marquee-track">{[0, 1].map(index => <span key={index}>{text} · {text} ·&nbsp;</span>)}</div></div>;
}

export default function LegacyHero({ lang = 'zh', reduced = false, onMediaError }) {
  const rootRef = useRef(null), videoRef = useRef(null), progressRef = useRef(0);
  const [mediaFailed, setMediaFailed] = useState(false);
  const [videoSource] = useState(() => matchMedia('(max-width: 699px)').matches ? '/assets/courtyard-scrub-mobile.mp4' : '/assets/courtyard-scrub.mp4');
  const quiet = reduced || mediaFailed, english = lang === 'en';
  const { touring, toggleTour } = useLegacyIntro({ rootRef, videoRef, progressRef, reduced: quiet });
  const fail = () => { setMediaFailed(true); onMediaError?.(); };
  const goToWork = event => {
    event.preventDefault();
    const target = document.getElementById('systems');
    if (target) { target.scrollIntoView({ behavior: 'instant' }); window.dispatchEvent(new Event('journey:jump')); target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
  };
  return <section ref={rootRef} id="home" className={`intro-journey legacy-hero${quiet ? ' legacy-static' : ''}`} data-nav-tone="dark" aria-label={english ? 'From the studio into a world of imagination' : '从工作室进入幻想庭院'}>
    <div className="intro-stage">
      <div className="after-video" data-running="false" data-nav-tone="light">
        <div className="legacy-center-label">A NOTE FROM JAY</div>
        <Marquee text="CRAFTING WORLDS" />
        <Marquee text="SHAPING POSSIBILITIES" reverse />
        <div className="legacy-center-caption"><i>Between rules &amp; wonder.</i><p>{english ? 'Every world starts with a possibility.' : '每个世界，都从一种可能开始。'}</p></div>
      </div>
      <div className="film-window">
        <video ref={videoRef} id="journey-video" muted playsInline controls={quiet && !mediaFailed} preload="auto" poster="/assets/courtyard-poster-first.png" onError={fail} aria-label={english ? 'Fantasy courtyard film' : '幻想庭院影片'}><source src={videoSource} type="video/mp4" onError={fail} /></video>
        <VideoRefraction videoRef={videoRef} progressRef={progressRef} reduced={quiet} />
        <div className="legacy-film-shade" />
      </div>
      <div className="legacy-office-wrap"><div className="office-camera"><LiquidOffice reducedMotion={quiet} progressRef={progressRef} /><div className="legacy-screen-glint" /></div></div>
      <div className="legacy-blackout" />
      <div className="office-copy legacy-scene-copy"><div className="legacy-signature"><EditorialMotion reduced={quiet} enter={false}>Jay Lin</EditorialMotion></div><p>{english ? 'SYSTEMS DESIGN / VISUAL ART' : '系统策划 / 视觉创作'}</p><a className="legacy-text-link" href="#systems" onClick={goToWork}>{english ? 'Explore the work ↗' : '直接看作品 ↗'}</a></div>
      <div className="film-copy film-creative legacy-scene-copy"><p className="legacy-eyebrow">AN INVITATION INTO MY WORLD</p><LegacyCreativeTitle /></div>
      <div className="film-copy film-believe legacy-scene-copy"><p className="legacy-eyebrow"><ExpressiveTitle variant="type" typingSpeed={25} reduced={quiet}>01 — THE WAY I SEE</ExpressiveTitle></p><h2><EditorialMotion reduced={quiet} enter={false}>{english ? <>See a world.<br />Discover its possibilities.</> : <>看见世界，<br />也看见其中的可能。</>}</EditorialMotion></h2><p>{english ? <>I care how a world looks.<br />And what you can do inside it.</> : <>我关心它长什么样，<br />也关心人在其中能做什么。</>}</p></div>
      <div className="film-copy film-intro legacy-scene-copy"><p className="legacy-eyebrow"><ExpressiveTitle variant="type" typingSpeed={25} reduced={quiet}>02 — A BIT ABOUT ME</ExpressiveTitle></p><h2><EditorialMotion reduced={quiet} enter={false}>{english ? 'It starts with design.' : '从设计出发。'}</EditorialMotion></h2><p>{english ? <>Illustration and entertainment design at ArtCenter.<br />A curiosity that led me to business, too.</> : <>在 ArtCenter 学习插画与娱乐设计，<br />也把对世界的好奇带进了商科。</>}</p></div>
      <div className="film-copy film-skills legacy-scene-copy"><p className="legacy-eyebrow">03 — THE WAY I MAKE</p><h2><ReactiveType>A little logic.</ReactiveType><br /><ReactiveType className="legacy-italic">A little magic.</ReactiveType></h2><div className="legacy-skill-lines"><FocusLine reduced={quiet}>{english ? 'Systems & progression · Meaningful choices' : '规则与推进 · 让选择产生后果'}</FocusLine><FocusLine reduced={quiet}>{english ? 'Playtesting & analysis · Gaps in understanding' : '试玩与分析 · 找到理解断层'}</FocusLine><FocusLine reduced={quiet}>{english ? 'Visuals & feedback · Clear communication' : '视觉与反馈 · 让信息清楚可见'}</FocusLine></div></div>
      <div className="film-copy film-timeline legacy-scene-copy"><p className="legacy-eyebrow">04 — STILL EXPLORING</p><h2><EditorialMotion reduced={quiet} enter={false}>{english ? <>Bring creative thinking<br />to bigger questions.</> : <>把创作，<br />带进更大的问题。</>}</EditorialMotion></h2><FocusLine as="div" reduced={quiet} className="legacy-path-line"><span>2023 — 2026</span><p>ArtCenter<span>{english ? 'Illustration & entertainment design / Business minor' : '插画 · 娱乐设计 / 商科辅修'}</span></p></FocusLine><FocusLine as="div" reduced={quiet} className="legacy-path-line"><span>2026 — 2027</span><p>Duke Fuqua<span>{english ? 'Master’s in Management · Candidate' : '商业管理学硕士 · 在读'}</span></p></FocusLine></div>
      <div className="film-copy film-final legacy-scene-copy"><p className="legacy-eyebrow">FROM AN IDEA TO AN EXPERIENCE</p><h2><ReactiveType>I BRING</ReactiveType><br /><ReactiveType className="legacy-italic">craft &amp; vision</ReactiveType><br /><ReactiveType>TO DIGITAL WORLDS.</ReactiveType></h2></div>
      <div className="legacy-film-foot"><span className="legacy-chapter">00 / OUTSIDE</span><button type="button" onClick={toggleTour} aria-pressed={touring}><span aria-hidden="true">{touring ? 'Ⅱ' : '▷'}</span>{touring ? (english ? 'Pause tour' : '暂停游览') : (english ? 'Guided tour' : '自动游览')}</button><span className="legacy-scroll-cue"><i />{english ? 'Scroll to step inside' : '滚动，走进来'}</span></div>
      <div className="legacy-film-progress" aria-hidden="true"><i /></div><div className="legacy-pointer" aria-hidden="true"><i /></div>
      <div className="intro-follow" aria-hidden="true" />
    </div>
    <div className="legacy-static-caption" data-nav-tone="light"><p>{mediaFailed ? (english ? 'The film could not load. You can explore the work directly.' : '影片暂时无法加载，可以直接浏览作品。') : (english ? 'A world to step into. Rules that create possibilities.' : '想让人走进去的世界，也有值得探索的规则。')}</p><a href="#systems" onClick={goToWork}>{english ? 'Explore the work ↗' : '浏览作品 ↗'}</a></div>
  </section>;
}
