import {useEffect, useRef, useMemo} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import './ScrollReveal.css';
gsap.registerPlugin(ScrollTrigger);

// React Bits ScrollReveal, scoped to its own lifetime and nested scroll container.
export default function ScrollReveal({children, scrollContainerRef, enableBlur=true,
  baseOpacity=.08, baseRotation=0, blurStrength=4, containerClassName='',
  textClassName='', rotationEnd='top center', wordAnimationEnd='top 55%',
  as:Tag='div', reduced=false, revealMode='enter'}) {
  const containerRef=useRef(null);
  const words=useMemo(()=>{
    const text=typeof children==='string'?children:'';
    const parts=typeof Intl.Segmenter==='function'
      ? [...new Intl.Segmenter(undefined,{granularity:'word'}).segment(text)].map(s=>s.segment)
      : text.split(/(\s+)/);
    return parts.map((word,i)=>/^\s+$/.test(word)?word:<span className="word" key={i}>{word}</span>);
  },[children]);
  useEffect(()=>{
    if(reduced)return;
    const el=containerRef.current;
    const context=gsap.context(()=>{
      const scroller=scrollContainerRef?.current||el.closest('.portfolio-page-viewport')||window;
      const trigger={trigger:el,scroller,start:'top 94%',end:wordAnimationEnd,
        ...(revealMode==='scroll'?{scrub:1.1}:{once:true,toggleActions:'play none none none'})};
      gsap.fromTo(el,{rotate:baseRotation},{rotate:0,duration:1.2,ease:'power2.out',scrollTrigger:{...trigger,end:rotationEnd}});
      gsap.fromTo(el.querySelectorAll('.word'),{opacity:baseOpacity,filter:enableBlur?`blur(${blurStrength}px)`:'none',y:6},
        {opacity:1,filter:'blur(0px)',y:0,duration:1.35,stagger:.065,ease:'power2.out',scrollTrigger:trigger});
    },el);
    return()=>context.revert();
  },[children,scrollContainerRef,reduced,revealMode,baseOpacity,baseRotation,blurStrength,enableBlur,rotationEnd,wordAnimationEnd]);
  return <Tag ref={containerRef} className={`scroll-reveal ${containerClassName}`} aria-label={typeof children==='string'?children:undefined}>
    <span className={`scroll-reveal-text ${textClassName}`} aria-hidden="true">{words}</span>
  </Tag>;
}
