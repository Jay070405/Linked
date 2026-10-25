import {Component, Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useReducer} from 'react';
import badgeFront from '../components/assets/jay-badge-product.svg';
import badgeBack from '../components/assets/jay-badge-systems.svg';
import {COPY} from './about-content';
import {badgeState, initialBadgeState, badgeEggVisible} from './about-badge-state';

const Lanyard = lazy(() => import('../components/Lanyard'));
class BadgeBoundary extends Component {
  state = {failed: false};
  static getDerivedStateFromError() { return {failed: true}; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
function StaticBadge({en, side, revealed, onReveal, onProjection, height, scroll}) {
  const image = useRef(null);
  useLayoutEffect(() => {
    const r = image.current.getBoundingClientRect();
    onProjection({x: r.x + r.width / 2, y: r.y + r.height / 2, width: r.width, height: r.height, tilt: 0, yaw: 0});
  }, [onProjection, height, scroll, revealed]);
  return <button type="button" className={`about-static${revealed ? ' is-lifted' : ''}`} aria-pressed={revealed} aria-label={en ? (revealed ? 'Put the badge back' : 'Lift the badge and look behind it') : (revealed ? '放回工牌' : '翻开工牌，看看背后')} onClick={() => onReveal(!revealed)}>
    <img ref={image} src={side === 'game' ? badgeBack : badgeFront} alt={`Jay Lin — ${side === 'game' ? 'GAME SYSTEMS DESIGNER' : 'PRODUCT MANAGER'}`}/>
    <span>{en ? (revealed ? 'Put it back ↙' : 'Lift the badge ↗') : (revealed ? '放回工牌 ↙' : '翻开工牌 ↗')}</span>
  </button>;
}
export default function AboutBadge({lang, t, side, onSideChange, onCenter, reducedMotion, phone, height, scroll, strapColor}) {
  const lastProjection = useRef(null);
  const root = useRef(null), egg = useRef(null), shadow = useRef(null);
  const [state, dispatch] = useReducer(badgeState, initialBadgeState);
  const {revealed} = state, visible = badgeEggVisible(state);
  const setRevealed = useCallback(value => dispatch({type: 'reveal', value}), []);
  const setImageReady = useCallback(value => dispatch({type: 'image', value}), []);
  const project = useCallback(value => {
    if (!value || !root.current) return;
    onCenter(value);
    const r = root.current.getBoundingClientRect(), x = value.x - r.left, y = value.y - r.top;
    lastProjection.current = {...value, x, y};
    const size = value.width * 1.25;
    Object.assign(egg.current.style, {left: `${x}px`, top: `${y - value.height / 2 - size * .18}px`, width: `${size}px`});
    egg.current.style.setProperty('--caption-width', `${Math.max(75, Math.min(170, value.x - size / 2 - 16))}px`);
    egg.current.classList.toggle('caption-below', phone && value.x - size / 2 < 170);
    Object.assign(shadow.current.style, {left: `${x + 13}px`, top: `${y + 18}px`, width: `${value.width * 1.5}px`, height: `${value.height * 1.25}px`,
      transform: `translate(-50%,-50%) rotate(${-value.tilt}rad) scaleX(${Math.max(.05, Math.abs(Math.cos(value.yaw)))})`});
  }, [onCenter, phone]);
  useLayoutEffect(() => {
    const p = lastProjection.current;
    if (!p || !root.current) return;
    const rect = root.current.getBoundingClientRect();
    onCenter({...p, x: rect.left + p.x, y: rect.top + p.y});
  }, [scroll, height, phone, onCenter]);
  useEffect(() => { setRevealed(false); }, [reducedMotion]);
  const fallback = <StaticBadge en={lang === 'en'} side={side} revealed={revealed} onReveal={setRevealed} onProjection={project} height={height} scroll={scroll}/>;
  return <div ref={root} className="about-badge" style={{'--badge-height': `${height}px`, '--anchor': phone ? '24px' : '150px'}}>
    <div ref={shadow} className="about-badge-shadow" aria-hidden="true"/>
    <figure ref={egg} className={`about-badge-egg${visible ? ' is-revealed' : ''}`} aria-hidden={!visible}>
      <img src="/assets/easter-egg-life.png" alt={t(COPY.eggAlt)} onLoad={() => setImageReady(true)} onError={() => setImageReady(false)}/>
      <figcaption>{t(COPY.egg.title)}<small>{t(COPY.egg.note)}</small></figcaption>
    </figure>
    {reducedMotion ? fallback : <BadgeBoundary fallback={fallback}><Suspense fallback={fallback}>
      <Lanyard variant="about" side={side} onFlipStart={onSideChange} onReveal={setRevealed} onCardProjection={project}
        cardHeight={height} anchorTop={phone ? 24 : 150} scrollOffset={phone ? 0 : scroll} strapColor={strapColor}
        frontImage={badgeFront} backImage={badgeBack} position={[0, 0, 23]} fov={25} gravity={[0, -32, 0]}/>
    </Suspense></BadgeBoundary>}
  </div>;
}
