import { Component, Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { author, otherProjects } from '../portfolioData';
import ExpressiveTitle from './ExpressiveTitle';
import badgeFront from './assets/jay-badge-front.svg';
import badgeBack from './assets/jay-badge-back.svg';
import strap from './assets/jay-lanyard.svg';
import './AboutPanel.css';

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

export default function AboutPanel({ lang = 'zh', onClose, reducedMotion = false, imageSrc = '/assets/easter-egg-life.png', caption = EASTER_CAPTION, captionNote = EASTER_NOTE }) {
  const dialog = useRef(null);
  const en = lang === 'en';
  const [prefersReduced, setPrefersReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const reduced = reducedMotion || prefersReduced;
  const [revealed, setRevealed] = useState(false);
  const [projection, setProjection] = useState(null);
  const [imageReady, setImageReady] = useState(false);
  const reveal = useCallback(value => setRevealed(value), []);
  const placeEasterEgg = useCallback(value => { setProjection(value); setRevealed(false); }, []);
  const visible = revealed && imageReady;
  const captionText = typeof caption === 'string' ? caption : caption[lang] || caption.zh;
  const noteText = typeof captionNote === 'string' ? captionNote : captionNote[lang] || captionNote.zh;
  const staticBadge = <StaticBadge en={en} revealed={revealed} onReveal={reveal} onProjection={placeEasterEgg} />;
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
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      const returnTo = previous?.isConnected && !previous.closest('[inert]') ? previous : document.querySelector('.v16-navigation .sm-toggle');
      returnTo?.focus?.({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} className={`v15-about${reduced ? ' v15-about--quiet' : ''}`} aria-labelledby="v15-about-title" onCancel={event => { event.preventDefault(); onClose?.(); }}>
    <button type="button" className="v15-about-close" onClick={onClose} autoFocus aria-label={en ? 'Close about' : '关闭关于我'}><span>{en ? 'Close' : '关闭'}</span> ×</button>
    <div className="v15-about-art" aria-label={en ? 'Interactive Jay Lin badge' : '可拖动的 Jay Lin 身份牌'}>
      <div className="v15-about-art-label">JAY LIN · FIELD NOTES</div>
      <figure className={`v16-badge-easter${visible ? ' is-revealed' : ''}`} aria-hidden={!visible} style={projection ? { left: `${projection.x}px`, top: `${projection.y}px`, width: `${projection.width * .9}px`, height: `${projection.height * .94}px` } : undefined}>
        <img key={imageSrc} src={imageSrc} alt={en ? 'An exhausted grey cat guarding a stack of final-version folders.' : '一只疲惫的灰猫守着一叠最终版文件夹。'} onLoad={() => setImageReady(true)} onError={() => setImageReady(false)} />
        <figcaption><span>{captionText}</span><small>{noteText}</small></figcaption>
      </figure>
      {reduced ? staticBadge : <BadgeBoundary fallback={staticBadge}><Suspense fallback={staticBadge}><Lanyard position={[0, 0, 23]} fov={25} gravity={[0, -32, 0]} frontImage={badgeFront} backImage={badgeBack} lanyardImage={strap} lanyardWidth={0.8} imageFit="cover" onReveal={reveal} onRestProjection={placeEasterEgg} /></Suspense></BadgeBoundary>}
      <p className="v15-about-drag">{reduced ? (en ? 'Lift the badge. There is more behind it.' : '翻开工牌，后面还有一点我。') : (en ? 'Move the badge. There is more behind it.' : '拨开工牌，后面还有一点我。')} <span>↗</span></p>
    </div>
    <div className="v15-about-copy">
      <p className="v15-about-eyebrow">ABOUT / {en ? 'A LITTLE CONTEXT' : '世界之外的我'}</p>
      <h2 id="v15-about-title" aria-label={en ? 'Jay Lin. Imagine. Make. Play.' : '林世杰。把想象，做成体验。'}><ExpressiveTitle reduced={reduced}>{en ? 'Jay Lin' : '林世杰'}<em>{en ? 'Imagine. Make. Play.' : '把想象，做成体验。'}</em></ExpressiveTitle></h2>
      <p className="v15-about-intro">{en ? author.statementEn : author.statement}</p>
      <div className="v15-about-education">{author.education.map(item => <article key={item.institution}><small>{item.period}</small><h3>{item.institution}</h3><p>{en ? item.qualificationEn : item.qualification}</p></article>)}</div>
      <details className="v16-about-experience"><summary>{en ? 'Selected experience' : '项目经历'} <span>↗</span></summary><div>{otherProjects.map(project => <article key={project.id}><h3>{en ? project.titleEn : project.title}</h3><p>{en ? project.subtitleEn : project.subtitle}</p><small>{en ? project.contributionEn : project.contribution}</small></article>)}</div></details>
      <div className="v15-about-links"><a href={author.resume} target="_blank" rel="noreferrer">{en ? 'Read my résumé' : '阅读我的简历'} ↗</a><a href={`mailto:${author.email}`}>{en ? 'Start a conversation' : '聊一聊下一幕'} ↗</a></div>
    </div>
  </dialog>;
}
