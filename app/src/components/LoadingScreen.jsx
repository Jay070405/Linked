import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import BrandConstruction from './BrandConstruction';
import OriginalLogo from './OriginalLogo';

export default function LoadingScreen({lang='zh',reduced=false,onDone}) {
 const dialog=useRef(null),done=useRef(onDone),[resources,setResources]=useState(false),[constructed,setConstructed]=useState(false),[leaving,setLeaving]=useState(false);
 const en=lang==='en';done.current=onDone;
 const leave=useCallback(()=>setLeaving(true),[]);
 useLayoutEffect(()=>{
  const node=dialog.current,previous=document.activeElement,overflow=document.body.style.overflow;
  document.body.classList.add('brand-loading');document.body.style.overflow='hidden';
  node.showModal();node.focus({preventScroll:true});
  return()=>{node.close();document.body.classList.remove('brand-loading');document.body.style.overflow=overflow;if(previous?.isConnected&&previous!==document.body)previous.focus({preventScroll:true});};
 },[]);
 useEffect(()=>{
  let alive=true;const disposers=[];
  const picture=src=>new Promise(resolve=>{
   const img=new Image();img.onload=img.onerror=()=>resolve();img.src=src;
   disposers.push(()=>{img.onload=img.onerror=null;});
  });
  // Wait only for the first view. The film keeps its own existing seek/ready logic.
  const sources=location.pathname==='/works'?['/assets/logo.png']:location.pathname.startsWith('/works/')?['/assets/logo.png']:['/assets/logo.png','/assets/studio-clean.png','/assets/studio-portfolio-screen-off.png'];
  const ready=()=>{if(alive)setResources(true);};
  const timeout=setTimeout(ready,5500);
  Promise.allSettled([document.fonts.ready,...sources.map(picture)]).then(ready);
  return()=>{alive=false;clearTimeout(timeout);disposers.forEach(dispose=>dispose());};
 },[]);
 useEffect(()=>{if(resources&&constructed)leave();},[resources,constructed,leave]);
 useEffect(()=>{if(!leaving)return;const id=setTimeout(()=>done.current?.(),reduced?40:650);return()=>clearTimeout(id);},[leaving,reduced]);
 return <dialog ref={dialog} tabIndex={-1} className={`studio-loading${leaving?' is-leaving':''}${reduced?' is-reduced':''}`} aria-labelledby="loading-title" onCancel={event=>{event.preventDefault();leave();}}>
  <div className="loading-top"><span><OriginalLogo className="loading-corner-logo"/> JAY LIN</span><span>PORTFOLIO / 2026</span></div>
  <h1 id="loading-title" className="loading-accessible">{en?'Welcome to Jay Lin’s portfolio':'欢迎来到 Jay Lin 的作品集'}</h1>
  <div className="loading-center"><BrandConstruction reduced={reduced} onComplete={()=>setConstructed(true)}/><p className="loading-caption">{en?'A world is taking shape.':'让想象，慢慢成形。'}</p></div>
  <div className="loading-bottom"><div><span>{en?'SYSTEMS THINKING. VISUAL WORLDS.':'系统思考，视觉造境。'}</span><div className="loading-resource-line" aria-hidden="true"><i className={resources?'is-ready':''}/></div></div><button type="button" onClick={leave} aria-label={en?'Skip introduction and enter the portfolio':'跳过加载动画，进入作品集'}>{en?'Enter the studio':'进入作品集'} <span>↗</span></button></div>
 </dialog>;
}
