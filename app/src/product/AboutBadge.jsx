import {Component,Suspense,lazy,useCallback,useEffect,useLayoutEffect,useReducer,useState} from 'react';
import badgeFront from '../components/assets/jay-badge-front.svg';
import badgeBack from '../components/assets/jay-badge-back.svg';
import strap from '../components/assets/jay-lanyard.svg';
import {badgeState,initialBadgeState,badgeEggVisible} from './about-badge-state';

const Lanyard=lazy(()=>import('../components/Lanyard'));
class BadgeBoundary extends Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?this.props.fallback:this.props.children;}
}
function StaticBadge({en,revealed,onReveal,onProjection}) {
  useLayoutEffect(()=>{onProjection(null);},[onProjection]);
  return <button type="button" className={`v16-badge-static-button${revealed?' is-lifted':''}`} aria-pressed={revealed} aria-label={en?(revealed?'Put the badge back':'Lift the badge and look behind it'):(revealed?'放回工牌':'翻开工牌，看看背后')} onClick={()=>onReveal(!revealed)}>
    <img src={badgeFront} alt="Jay Lin — Systems and visual design"/>
    <span>{en?(revealed?'Put it back ↙':'Lift the badge ↗'):(revealed?'放回工牌 ↙':'翻开工牌 ↗')}</span>
  </button>;
}

// Ported from e8577fd's AboutPanel: the same projection, reveal callbacks,
// physics props and reduced-motion/error fallback, without the modal shell.
export default function AboutBadge({lang,reducedMotion=false,imageSrc='/assets/easter-egg-life.png'}) {
  const en=lang==='en';
  const [prefersReduced,setPrefersReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const reduced=reducedMotion||prefersReduced;
  const [state,dispatch]=useReducer(badgeState,initialBadgeState);
  const {revealed,projection}=state,visible=badgeEggVisible(state);
  const reveal=useCallback(value=>dispatch({type:'reveal',value}),[]);
  const placeEasterEgg=useCallback(value=>dispatch({type:'projection',value}),[]);
  useEffect(()=>{dispatch({type:'reset'});},[imageSrc]);
  useEffect(()=>{
    const media=window.matchMedia('(prefers-reduced-motion: reduce)');
    const update=()=>setPrefersReduced(media.matches);
    media.addEventListener('change',update);return ()=>media.removeEventListener('change',update);
  },[]);
  const staticBadge=<StaticBadge en={en} revealed={revealed} onReveal={reveal} onProjection={placeEasterEgg}/>;
  return <div className={`about-badge-card${reduced?' is-quiet':''}`} aria-label={en?'Interactive Jay Lin badge':'可拖动的 Jay Lin 身份牌'}>
    <div className="v15-about-art-label">JAY LIN <span>PERSONAL FILE / 001</span></div>
    <div className="about-name-backdrop" aria-hidden="true">JAY<br/><span>LIN</span></div>
    <div className="about-badge-plinth" aria-hidden="true"/>
    <figure className={`v16-badge-easter${visible?' is-revealed':''}`} aria-hidden={!visible} style={projection?{left:`${projection.x}px`,top:`${projection.y}px`,width:`${projection.width*.9}px`,height:`${projection.height*.94}px`}:undefined}>
      <img key={imageSrc} src={imageSrc} alt={en?'An exhausted grey cat guarding a stack of final-version folders.':'一只疲惫的灰猫守着一叠最终版文件夹。'} onLoad={()=>dispatch({type:'image',value:true})} onError={()=>dispatch({type:'image',value:false})}/>
      <figcaption><span>{en?'final_final_FINAL_v27':'final_final_真的最终版'}</span><small>{en?'One last tiny change.':'这次真的不改了。'}</small></figcaption>
    </figure>
    {reduced?staticBadge:<BadgeBoundary fallback={staticBadge}><Suspense fallback={staticBadge}><Lanyard position={[0,0,23]} fov={25} gravity={[0,-32,0]} frontImage={badgeFront} backImage={badgeBack} lanyardImage={strap} lanyardWidth={.8} imageFit="cover" onReveal={reveal} onRestProjection={placeEasterEgg}/></Suspense></BadgeBoundary>}
    <p className="v15-about-drag">{reduced?(en?'Lift the badge. There is more behind it.':'翻开工牌，后面还有一点我。'):(en?'Pull it down — there’s a bit more of me behind it.':'向下拉一拉，后面还有一点我。')} <span>{reduced?'↗':'↓'}</span></p>
  </div>;
}
