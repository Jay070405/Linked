import {useLayoutEffect,useEffect,useRef} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText as GSAPSplitText} from 'gsap/SplitText';
import './SplitText.css';

// Adapted from the exact React Bits SplitText-JS-CSS registry source.
// Keep GSAPSplitText + staggered fromTo; use a React-owned outer wrapper and
// an imperative inner island so GSAP never replaces React's text/formatting.
// gsap.context replaces @gsap/react; both GSAP plugins are already installed.
gsap.registerPlugin(ScrollTrigger,GSAPSplitText);
const FROM={opacity:0,yPercent:78,rotationX:-18};
const TO={opacity:1,yPercent:0,rotationX:0};

export default function SplitText({text,className='',delay=24,duration=.78,ease='power3.out',splitType='chars',from=FROM,to=TO,threshold=.02,rootMargin='0px',textAlign='inherit',tag:Tag='span',onLetterAnimationComplete,paused=false,reduced=false,initialDelay=0,controlled=false}) {
  const root=useRef(null),content=useRef(null),tween=useRef(null),complete=useRef(onLetterAnimationComplete),pause=useRef(paused);
  complete.current=onLetterAnimationComplete;pause.current=paused;
  const fromKey=JSON.stringify(from),toKey=JSON.stringify(to);
  useLayoutEffect(()=>{
    const node=content.current;if(!node)return;
    let disposed=false,initialized=false,split=null,context=null,trigger=null,fontWait=0;
    node.textContent=String(text??'');
    const start=()=>{
      if(disposed||initialized)return;initialized=true;clearTimeout(fontWait);
      if(reduced||matchMedia('(prefers-reduced-motion: reduce)').matches||!String(text??'').trim()){node.style.visibility='visible';complete.current?.();return;}
      try { context=gsap.context(()=>{
        split=new GSAPSplitText(node,{
          type:splitType,smartWrap:true,autoSplit:false,tag:'span',
          linesClass:'rb-split-line',wordsClass:'rb-split-word',charsClass:'rb-split-char',reduceWhiteSpace:false,aria:'none',
        });
        const targets=splitType.includes('chars')&&split.chars.length?split.chars:splitType.includes('words')&&split.words.length?split.words:split.lines;
        if(!targets.length){node.style.visibility='visible';complete.current?.();return;}
        tween.current=gsap.fromTo(targets,{...from}, {...to,duration,ease,delay:initialDelay,stagger:delay/1000,paused:true,force3D:true,willChange:'transform,opacity',onComplete:()=>complete.current?.()});
        node.style.visibility='visible';
        if(controlled){if(!pause.current)tween.current.play();}
        else{
          const margin=Number.parseFloat(rootMargin)||0;
          trigger=ScrollTrigger.create({trigger:root.current,start:`top ${(1-threshold)*100}%${margin<0?'-='+Math.abs(margin):margin>0?'+='+margin:''}`,once:true,onEnter:()=>{if(!pause.current)tween.current?.play();}});
        }
      },root.current); } catch {
        tween.current?.kill();context?.revert();split?.revert();
        node.textContent=String(text??'');node.style.visibility='visible';complete.current?.();
      }
    };
    if(document.fonts?.status==='loading'){fontWait=setTimeout(start,1200);document.fonts.ready.then(start).catch(start);}else start();
    return()=>{disposed=true;clearTimeout(fontWait);trigger?.kill();tween.current?.kill();tween.current=null;context?.revert();split?.revert();node.textContent='';};
  },[text,delay,duration,ease,splitType,fromKey,toKey,threshold,rootMargin,reduced,initialDelay,controlled]);
  useEffect(()=>{if(controlled)tween.current?.paused(paused);},[paused,controlled]);
  return <Tag ref={root} className={`rb-splittext ${className}`} style={{textAlign}}><span ref={content} className="rb-splittext-content" style={{visibility:reduced?'visible':'hidden'}} /></Tag>;
}
