import {useLayoutEffect,useRef} from 'react';
import gsap from 'gsap';
import OriginalLogo from './OriginalLogo';
import BrandWordmark,{geometry} from './BrandWordmark';
import './brand-motion.css';

/** Draw the actual logo and font contours before their matching solid shapes. */
export default function BrandConstruction({children,reduced=false,play=true,replayKey=0,onComplete,onTimeline,handoff=false,className=''}) {
 const host=useRef(null),complete=useRef(onComplete),timelineReady=useRef(onTimeline);complete.current=onComplete;timelineReady.current=onTimeline;
 useLayoutEffect(()=>{
  const el=host.current;if(!el)return;
  const q=s=>el.querySelector(s),qa=s=>[...el.querySelectorAll(s)];
  let timeline,finished=false,visible=true;
  const finish=()=>{if(!finished){finished=true;el.dataset.constructed='true';complete.current?.();}};
  const context=gsap.context(()=>{
   el.dataset.constructed='false';
   if(reduced){gsap.set([q('.brand-symbol'),q('.brand-word-drawing')],{autoAlpha:0});gsap.set(q('.brand-name'),{autoAlpha:1});finish();return;}
   gsap.set(q('.brand-symbol'),{autoAlpha:1,x:0,y:0,scale:1});
   gsap.set(q('.brand-symbol-solid'),{opacity:0});
   gsap.set(q('.brand-name'),{autoAlpha:0});
   gsap.set(q('.brand-word-drawing'),{autoAlpha:1});
   gsap.set(qa('.brand-symbol-stroke,.brand-glyph-stroke'),{strokeDasharray:1,strokeDashoffset:1});
   gsap.set(qa('.brand-word-drawing .brand-glyph-fill'),{opacity:0});
   timeline=gsap.timeline({paused:!play,onComplete:finish,defaults:{ease:'power2.inOut',autoRound:false}})
    .to(qa('.brand-symbol-stroke'),{strokeDashoffset:0,duration:1.15,stagger:.10,ease:'power1.inOut'},0)
    .to(q('.brand-symbol-solid'),{opacity:1,duration:.5},1.32)
    .to(q('.brand-symbol'),{x:()=>handoff?0:-el.clientWidth*.42,y:()=>-el.clientHeight*(handoff?.6:.28),scale:handoff?.42:.19,duration:.8},1.85)
    .to(qa('.brand-glyph-stroke'),{strokeDashoffset:0,duration:1.12,stagger:.09,ease:'power1.inOut'},1.95)
    .to(qa('.brand-word-drawing .brand-glyph-fill'),{opacity:1,duration:.4,stagger:.04},3.55)
    .to(q(handoff?'.brand-symbol-trace':'.brand-symbol'),{autoAlpha:0,duration:.4},2.62)
    .set(q('.brand-name'),{autoAlpha:1},4.22)
    .set(q('.brand-word-drawing'),{autoAlpha:0},4.22);
   timelineReady.current?.(timeline);
  },host);
  const sync=()=>{if(!timeline||finished||el.closest('.studio-loading.is-leaving'))return;const covered=el.closest('.home-journey')&&(document.body.classList.contains('portfolio-route-open')||document.body.classList.contains('brand-loading'));if(document.hidden||!play||!visible||covered)timeline.pause();else timeline.resume();};
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();});observer.observe(el);
  const pageObserver=new MutationObserver(sync);pageObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',sync);sync();
  return()=>{observer.disconnect();pageObserver.disconnect();document.removeEventListener('visibilitychange',sync);context.revert();};
 },[reduced,play,replayKey,handoff]);
 return <div ref={host} className={`brand-construction ${className}`}>
  <div className="brand-symbol" aria-hidden="true">
   <svg className="brand-symbol-trace" viewBox={geometry.logo.viewBox} fill="none" stroke="currentColor">
    {geometry.logo.paths.map((d,i)=><path key={i} d={d} pathLength="1" className="brand-symbol-stroke" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/>)}
   </svg>
   <div className="brand-symbol-solid"><OriginalLogo className="brand-logo"/></div>
  </div>
  <div className="brand-word-drawing" aria-hidden="true"><BrandWordmark outline/><BrandWordmark/></div>
  <div className="brand-name">{children||<><span className="loading-accessible">JAY LIN</span><BrandWordmark/></>}</div>
 </div>;
}
