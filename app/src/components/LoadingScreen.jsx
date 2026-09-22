import {useCallback,useEffect,useLayoutEffect,useRef,useState} from 'react';
import gsap from 'gsap';
import BrandConstruction from './BrandConstruction';
import {preloadOffice} from '../office3d/model';

export default function LoadingScreen({lang='zh',reduced=false,onDone}) {
 const dialog=useRef(null),done=useRef(onDone),construction=useRef(null);
 const [resources,setResources]=useState(false),[constructed,setConstructed]=useState(false),[leaving,setLeaving]=useState(false);
 const en=lang==='en';done.current=onDone;
 const leave=useCallback(()=>setLeaving(true),[]);
 useLayoutEffect(()=>{
  const node=dialog.current,previous=document.activeElement,overflow=document.body.style.overflow;
  document.body.classList.add('brand-loading');document.body.style.overflow='hidden';
  node.showModal();node.focus({preventScroll:true});
  return()=>{
   node.close();document.body.classList.remove('brand-loading','brand-arrived');document.body.style.overflow=overflow;
   if(previous?.isConnected&&previous!==document.body)previous.focus({preventScroll:true});
  };
 },[]);
 useEffect(()=>{
  let alive=true;const disposers=[];
  const picture=src=>new Promise(resolve=>{
   const img=new Image();img.onload=img.onerror=()=>resolve();img.src=src;
   disposers.push(()=>{img.onload=img.onerror=null;});
  });
  // The film still owns its original independent readiness and seek timeline.
  const sources=location.pathname.startsWith('/works')?['/assets/logo.png']:['/assets/logo.png','/assets/studio-clean.png','/assets/studio-fantasy-anime.png'];
  const ready=()=>{if(alive)setResources(true);};
  const timeout=setTimeout(ready,5500);
  Promise.allSettled([document.fonts.ready,...sources.map(picture),...(!reduced&&!location.pathname.startsWith('/works')?[preloadOffice()]:[])]).then(ready);
  return()=>{alive=false;clearTimeout(timeout);disposers.forEach(dispose=>dispose());};
 },[]);
 useEffect(()=>{if(resources&&constructed)leave();},[resources,constructed,leave]);
 useLayoutEffect(()=>{
  if(!leaving)return;
  const node=dialog.current,symbol=node.querySelector('.brand-symbol');
  const target=document.querySelector('.v16-wordmark .v16-original-logo');
  construction.current?.kill();
  if(reduced||!target||!symbol){done.current?.();return;}
  const center=node.querySelector('.loading-center');
  const start=symbol.getBoundingClientRect(),centerBounds=center.getBoundingClientRect();
  const progress={value:0};let removeVisibility;
  const context=gsap.context(()=>{
   // Keep the same drawn symbol. Remove its ancestor's centering transform
   // without moving the content, then fly in viewport coordinates to the nav.
   gsap.set(center,{left:centerBounds.left,top:centerBounds.top,width:centerBounds.width,height:centerBounds.height,transform:'none'});
   // GSAP normalizes "none" to an identity matrix, which still creates a fixed
   // containing block. A literal none is essential for a viewport-exact flight.
   center.style.transform='none';
   gsap.set(symbol,{position:'fixed',left:start.left,top:start.top,width:start.width,height:start.height,x:0,y:0,scale:1,autoAlpha:1,transformOrigin:'50% 50%'});
   gsap.set(node.querySelector('.brand-symbol-solid'),{opacity:1});
   const place=()=>{
    const end=target.getBoundingClientRect(),p=progress.value;
    gsap.set(symbol,{
     autoRound:false,
     left:start.left+(end.left-start.left)*p,top:start.top+(end.top-start.top)*p,
     width:start.width+(end.width-start.width)*p,height:start.height+(end.height-start.height)*p,
    });
    if(p>.72)symbol.style.color=getComputedStyle(target).color;
   };
   const timeline=gsap.timeline({onComplete:()=>{
    place();document.body.classList.add('brand-arrived');
    gsap.set(symbol,{visibility:'hidden'});done.current?.();
   }});
   timeline.to(node.querySelectorAll('.loading-top,.loading-bottom,.loading-caption,.brand-name,.brand-word-drawing,.brand-symbol-trace'),{opacity:0,duration:.22},0)
    .to(node.querySelector('.loading-veil'),{opacity:0,duration:.8,ease:'power2.inOut'},.12)
    .to(progress,{value:1,duration:1.15,ease:'power3.inOut',onUpdate:place},0);
   const visibility=()=>document.hidden?timeline.pause():timeline.resume();
   document.addEventListener('visibilitychange',visibility);visibility();
   removeVisibility=()=>document.removeEventListener('visibilitychange',visibility);
  },node);
  return()=>{removeVisibility?.();context.revert();};
 },[leaving,reduced]);
 return <dialog ref={dialog} tabIndex={-1} className={`studio-loading${leaving?' is-leaving':''}${reduced?' is-reduced':''}`} aria-labelledby="loading-title" onCancel={event=>{event.preventDefault();leave();}}>
  <div className="loading-veil" aria-hidden="true"/>
  <div className="loading-top"><span>PORTFOLIO / 2026</span></div>
  <h1 id="loading-title" className="loading-accessible">{en?'Welcome to Jay Lin’s portfolio':'欢迎来到 Jay Lin 的作品集'}</h1>
  <div className="loading-center"><BrandConstruction reduced={reduced} handoff onTimeline={timeline=>{construction.current=timeline;}} onComplete={()=>setConstructed(true)}/><p className="loading-caption">{en?'A world is taking shape.':'一个世界，正在成形。'}</p></div>
  <div className="loading-bottom"><div><span>{en?'SYSTEMS THINKING. VISUAL WORLDS.':'系统思考，视觉造境。'}</span><div className="loading-resource-line" aria-hidden="true"><i className={resources?'is-ready':''}/></div></div><button type="button" onClick={leave} aria-label={en?'Skip introduction and enter the portfolio':'跳过加载动画，进入作品集'}>{en?'Enter the studio':'进入作品集'} <span>↗</span></button></div>
 </dialog>;
}
