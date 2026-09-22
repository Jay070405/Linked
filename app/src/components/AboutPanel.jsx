import { Component, Suspense, lazy, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { author, otherProjects } from '../portfolioData';
import ExpressiveTitle from './ExpressiveTitle';
import { PortfolioGlass } from './PortfolioSurface';
import badgeFront from './assets/jay-badge-front.svg';
import badgeBack from './assets/jay-badge-back.svg';
import strap from './assets/jay-lanyard.svg';
import './AboutPanel.css';
import './about-experience.css';

const Lanyard = lazy(() => import('./Lanyard'));
class BadgeBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function StaticBadge({ en, revealed, onReveal, onProjection }) {
  useLayoutEffect(() => { onProjection(null); }, [onProjection]);
  return <button type="button" className={`v16-badge-static-button${revealed ? ' is-lifted' : ''}`} aria-pressed={revealed} aria-label={en ? (revealed ? 'Put the badge back' : 'Lift the badge and look behind it') : (revealed ? '放回工牌' : '翻开工牌，看看背后')} onClick={() => onReveal(!revealed)}>
    <img src={badgeFront} alt="Jay Lin — Systems and visual design" />
    <span>{en ? (revealed ? 'Put it back ↙' : 'Lift the badge ↗') : (revealed ? '放回工牌 ↙' : '翻开工牌 ↗')}</span>
  </button>;
}

const EASTER_CAPTION = { zh: 'final_final_真的最终版', en: 'final_final_FINAL_v27' };
const EASTER_NOTE = { zh: '这次真的不改了。', en: 'One last tiny change.' };

export default function AboutPanel({ lang = 'zh', onLanguage, onClose, reducedMotion = false, imageSrc = '/assets/easter-egg-life.png', caption = EASTER_CAPTION, captionNote = EASTER_NOTE }) {
  const dialog = useRef(null);
  const en = lang === 'en';
  const id = useId();
  const [projectIndex, setProjectIndex] = useState(0);
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false), panelAnimation = useRef(null);
  const project = otherProjects[projectIndex];
  const [prefersReduced, setPrefersReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const reduced = reducedMotion || prefersReduced;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const [revealed, setRevealed] = useState(false);
  const [projection, setProjection] = useState(null);
  const [imageReady, setImageReady] = useState(false);
  const reveal = useCallback(value => setRevealed(value), []);
  const placeEasterEgg = useCallback(value => { setProjection(value); setRevealed(false); }, []);
  const visible = revealed && imageReady;
  const captionText = typeof caption === 'string' ? caption : caption[lang] || caption.zh;
  const noteText = typeof captionNote === 'string' ? captionNote : captionNote[lang] || captionNote.zh;
  const staticBadge = <StaticBadge en={en} revealed={revealed} onReveal={reveal} onProjection={placeEasterEgg} />;
  const closePanel = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const element = dialog.current;
    if (reduced || !element) { onClose?.(); return; }
    // Closing during entry continues from the current position without a jump.
    const transform = getComputedStyle(element).transform;
    panelAnimation.current?.cancel();
    panelAnimation.current = element.animate([
      { transform },
      { transform: 'translateX(-100%)' },
    ], { duration: 500, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'forwards' });
    panelAnimation.current.finished.then(() => onClose?.(), () => {});
  }, [onClose, reduced]);
  useEffect(() => { setImageReady(false); setRevealed(false); }, [imageSrc]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReduced(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    const previous = document.activeElement;
    const element = dialog.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    element?.showModal();
    if (element && !reducedRef.current) {
      panelAnimation.current = element.animate([
        { transform: 'translateX(100%)' },
        { transform: 'translateX(0)' },
      ], { duration: 620, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
    return () => {
      panelAnimation.current?.cancel();
      element?.close();
      document.body.style.overflow = previousOverflow;
      const returnTo = previous?.isConnected && !previous.closest('[inert]') ? previous : document.querySelector('.v16-navigation .sm-toggle');
      returnTo?.focus?.({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className={`v15-about about-experience${reduced ? ' v15-about--quiet' : ''}${closing ? ' is-closing' : ''}`} aria-labelledby="v15-about-title" aria-busy={closing || undefined} onCancel={event => { event.preventDefault(); closePanel(); }}>
    <div className="about-toolbar"><PortfolioGlass radius={40}><div>{onLanguage && <div className="about-language" role="group" aria-label={en ? 'Language' : '语言'}><button disabled={closing} aria-pressed={lang === 'zh'} onClick={() => onLanguage('zh')}>中</button><button disabled={closing} aria-pressed={lang === 'en'} onClick={() => onLanguage('en')}>EN</button></div>}<button type="button" className="v15-about-close" onClick={closePanel} disabled={closing} autoFocus aria-label={en ? 'Close about' : '关闭关于我'}><span>{en ? 'Close' : '关闭'}</span> ×</button></div></PortfolioGlass></div>
    <div className="v15-about-art" aria-label={en ? 'Interactive Jay Lin badge' : '可拖动的 Jay Lin 身份牌'}>
      <div className="v15-about-art-label">JAY LIN <span>PERSONAL FILE / 001</span></div>
      <div className="about-name-backdrop" aria-hidden="true">JAY<br /><span>LIN</span></div>
      <div className="about-badge-plinth" aria-hidden="true" />
      <figure className={`v16-badge-easter${visible ? ' is-revealed' : ''}`} aria-hidden={!visible} style={projection ? { left: `${projection.x}px`, top: `${projection.y}px`, width: `${projection.width * .9}px`, height: `${projection.height * .94}px` } : undefined}>
        <img key={imageSrc} src={imageSrc} alt={en ? 'An exhausted grey cat guarding a stack of final-version folders.' : '一只疲惫的灰猫守着一叠最终版文件夹。'} onLoad={() => setImageReady(true)} onError={() => setImageReady(false)} />
        <figcaption><span>{captionText}</span><small>{noteText}</small></figcaption>
      </figure>
      {reduced ? staticBadge : <BadgeBoundary fallback={staticBadge}><Suspense fallback={staticBadge}><Lanyard position={[0, 0, 23]} fov={25} gravity={[0, -32, 0]} frontImage={badgeFront} backImage={badgeBack} lanyardImage={strap} lanyardWidth={0.8} imageFit="cover" onReveal={reveal} onRestProjection={placeEasterEgg} /></Suspense></BadgeBoundary>}
      <p className="v15-about-drag">{reduced ? (en ? 'Lift the badge. There is more behind it.' : '翻开工牌，后面还有一点我。') : (en ? 'Pull the badge down. There is more behind it.' : '向下拉一拉，后面还有一点我。')} <span>{reduced ? '↗' : '↓'}</span></p>
    </div>
    <div className="v15-about-copy">
      <p className="v15-about-eyebrow">ABOUT ME <span>林世杰 / JAY LIN</span></p>
      <h2 id="v15-about-title"><ExpressiveTitle reduced={reduced}>{en ? 'Jay Lin' : '林世杰'}</ExpressiveTitle></h2>
      <p className="about-role">{en ? 'Systems design' : '系统策划'} <span>↔</span> {en ? 'Visual storytelling' : '视觉创作'}</p>
      <p className="v15-about-intro">{en ? author.statementEn : author.statement}</p>
      <section className="about-education-section" aria-labelledby={`${id}-education`}><h3 id={`${id}-education`} className="about-section-label">01 / {en ? 'EDUCATION' : '学习经历'}</h3><div className="v15-about-education">{author.education.map((item, i) => <article key={item.institution}><span className="about-education-no">0{i + 1}</span><div><small>{item.period}</small><h4>{item.institution}</h4><p>{en ? item.qualificationEn : item.qualification}</p></div></article>)}</div></section>
      <section className="about-project-section" aria-labelledby={`${id}-projects`}><h3 id={`${id}-projects`} className="about-section-label">02 / {en ? 'SELECTED EXPERIENCE' : '项目经历'}</h3><PortfolioGlass className="about-project-glass" radius={23}><div className="about-project-tabs" role="group" aria-label={en ? 'Explore project experience' : '查看项目经历'}>{otherProjects.map((item, i) => <button key={item.id} aria-pressed={projectIndex === i} aria-controls={`${id}-project`} onPointerEnter={event => { if (event.pointerType === 'mouse') setProjectIndex(i); }} onClick={() => setProjectIndex(i)}>{projectIndex === i && <motion.span layoutId={`${id}-project-pill`} className="about-project-pill" transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 330, damping: 34 }} />}<span>{item.id === 'isola' ? 'ISOLA' : item.title}</span></button>)}</div><motion.article id={`${id}-project`} key={project.id} className="about-project-detail" initial={reduced ? false : { opacity: .4, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .3 }}><span>{en ? project.classificationEn : project.classification}</span><h4>{en ? project.subtitleEn : project.subtitle}</h4><p>{en ? project.descriptionEn : project.description}</p><details><summary>{en ? 'My contribution' : '我负责的部分'} <span>+</span></summary><p>{en ? project.contributionEn : project.contribution}</p></details></motion.article></PortfolioGlass></section>
      <div className="v15-about-links"><a className="about-resume-link" href={author.resume} target="_blank" rel="noreferrer">{en ? 'Read my résumé' : '阅读简历'} <span>↗</span></a><a href={`mailto:${author.email}`}>{en ? 'Get in touch' : '联系我'} <span>↗</span></a></div>
    </div>
  </dialog>;
}
