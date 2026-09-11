import { Children, cloneElement, isValidElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import StrokeText from './StrokeText';
import TextType from './TextType';
import SplitText from './SplitText';
import './ExpressiveTitle.css';

const textContent = children => Children.toArray(children).map(child => isValidElement(child) ? child.type === 'br' ? ' ' : textContent(child.props.children) : String(child ?? '')).join('');
const segments = text => {
  const parts = typeof Intl.Segmenter === 'function' ? [...new Intl.Segmenter(undefined, {granularity:'word'}).segment(String(text))].map(part => part.segment) : String(text).split(/(\s+)/u);
  return parts.flatMap(part => /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/u.test(part) ? Array.from(part) : part).reduce((result,part) => {
    if (/^[.,!?;:，。！？、：；）】”’]+$/u.test(part) && result.length && !/^\s+$/u.test(result.at(-1))) result[result.length-1] += part;
    else result.push(part);
    return result;
  }, []);
};

function canRead(node) {
  if (!node?.isConnected || document.hidden || node.closest('[inert]') || document.body.classList.contains('brand-loading')) return false;
  if (document.body.classList.contains('portfolio-route-open') && !node.closest('.portfolio-page-viewport,dialog[open]')) return false;
  const box = node.getBoundingClientRect();
  if (box.bottom <= 0 || box.top >= innerHeight || box.right <= 0 || box.left >= innerWidth) return false;
  let opacity=1;
  for (let part=node; part && part!==document.body; part=part.parentElement) {
    const style=getComputedStyle(part);
    opacity*=Number(style.opacity);
    if (style.display==='none' || style.visibility==='hidden' || style.contentVisibility==='hidden' || opacity<.015) return false;
  }
  return true;
}

function ExpressiveWord({ text, index, characterOffset, last, state, onComplete }) {
  const word = useRef(null), baseline = useRef(null);
  const [metrics,setMetrics] = useState(null);
  const [failed,setFailed] = useState(false);
  useLayoutEffect(()=>{setFailed(false);},[text,state.run]);
  useLayoutEffect(() => {
    const node=word.current;if (!node) return;
    let disposed=false;
    const measure=()=> {
      if(disposed || !node.clientWidth || !node.clientHeight) return;
      const font=getComputedStyle(node), next={width:parseFloat(font.width)||node.clientWidth,height:parseFloat(font.height)||node.clientHeight,baseline:baseline.current?.offsetTop || node.clientHeight*.8,fontSize:parseFloat(font.fontSize),fontWeight:font.fontWeight,fontFamily:font.fontFamily,fontStyle:font.fontStyle,letterSpacing:parseFloat(font.letterSpacing)||0};
      setMetrics(previous => previous && Object.keys(next).every(key=>previous[key]===next[key]) ? previous : next);
    };
    measure();const resize=new ResizeObserver(measure);resize.observe(node);document.fonts?.ready.then(measure).catch(()=>{});
    return()=>{disposed=true;resize.disconnect();};
  },[text]);
  useEffect(()=>{
    if(!state.playing||!state.visible||metrics||failed)return;
    const fallback=setTimeout(()=>{setFailed(true);onComplete(index);},1200);
    return()=>clearTimeout(fallback);
  },[state.playing,state.visible,state.run,metrics,failed,index,onComplete]);
  const paint=state.playing && !state.quiet && metrics && !failed;
  return <span ref={word} className={`expressive-word${paint?' is-painting':''}${state.pending&&!failed?' is-pending':''}`}>
    <span className="expressive-native">{text}</span><span ref={baseline} className="expressive-baseline" aria-hidden="true" />
    {paint && <span className="expressive-paint" aria-hidden="true" key={state.run}>
      {state.variant==='split' ? <SplitText text={text} tag="span" controlled paused={!state.visible} duration={.78} delay={24} initialDelay={Math.min(characterOffset*.024,.26)} onLetterAnimationComplete={()=>onComplete(index)} /> : state.variant==='type' ? <TextType as="span" text={text} loop={false} typingSpeed={state.typingSpeed} initialDelay={characterOffset*state.typingSpeed} showCursor={last} hideCursorBeforeStart paused={!state.visible} onSentenceComplete={()=>onComplete(index)} /> :
        <StrokeText text={text} trigger="mount" strokeColor="currentColor" fillColor="currentColor" strokeWidth={Math.max(.8,metrics.fontSize*.0105)} drawDuration={state.drawDuration} fillDelay={.12} stagger={.028} delay={Math.min(index*.035,.25)} fillMode="wipe" fontSize={metrics.fontSize} fontWeight={metrics.fontWeight} fontFamily={metrics.fontFamily} fontStyle={metrics.fontStyle} letterSpacing={metrics.letterSpacing} layoutBox={metrics} paused={!state.visible} onComplete={()=>onComplete(index)} />}
    </span>}
  </span>;
}

/** React Bits one-shot entrance with native text preserving layout and access.
 * Default: split characters rise into place once; hover never replays entrance.
 * Explicit stroke/type variants remain available for a few selected moments.
 */
export default function ExpressiveTitle({ children, as:Tag='span', variant='split', reduced=false, active=true, enter=true, hover=true, typingSpeed=42, drawDuration=1.05, className='', ...props }) {
  const root=useRef(null), seen=useRef(false), complete=useRef(new Set()), running=useRef(false), visibleRef=useRef(false);
  const [visible,setVisible]=useState(false), [systemReduced,setSystemReduced]=useState(()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches), [run,setRun]=useState(0), [playing,setPlaying]=useState(false);
  const quiet=reduced||systemReduced;
  const [completed,setCompleted]=useState(quiet||!enter);
  const signature=textContent(children);
  const tokens=useMemo(()=>{
    let index=0, characters=0;
    const collect=nodes=>Children.toArray(nodes).flatMap(child=>{
      if(typeof child==='string'||typeof child==='number') return segments(child).map((part,key)=>{
        if(/^\s+$/u.test(part)){characters+=part.length;return part;}
        const result={text:part,index:index++,characterOffset:characters};characters+=Array.from(part).length;return result;
      });
      if(!isValidElement(child)||!child.props.children)return child;
      return {element:child,children:collect(child.props.children)};
    });
    return {tree:collect(children),count:index};
  },[children]);
  useEffect(()=>{
    const heading=root.current?.closest('h1,h2,h3,h4,h5,h6');
    if(!heading||heading.hasAttribute('aria-label')||heading.hasAttribute('aria-labelledby'))return;
    let label='';
    const read=part=>part.nodeType===3?part.nodeValue:part.getAttribute?.('aria-hidden')==='true'?'':part.nodeName==='BR'?' ':[...part.childNodes].map(read).join('');
    const update=()=>{label=read(heading).replace(/\s+/g,' ').trim();heading.setAttribute('aria-label',label);};
    update();const observer=new MutationObserver(update);observer.observe(heading,{childList:true,characterData:true,subtree:true});
    return()=>{observer.disconnect();if(heading.getAttribute('aria-label')===label)heading.removeAttribute('aria-label');};
  },[signature]);
  const begin=useCallback(()=>{
    if(quiet||!active||seen.current||running.current||!tokens.count||!canRead(root.current))return;
    seen.current=true;complete.current.clear();running.current=true;setRun(value=>value+1);setPlaying(true);
  },[quiet,active,tokens.count]);
  useLayoutEffect(()=>{seen.current=quiet||!enter;running.current=false;complete.current.clear();setPlaying(false);setCompleted(quiet||!enter);},[signature,variant,enter]);
  useEffect(()=>{
    const node=root.current;if(!node)return;
    const media=matchMedia('(prefers-reduced-motion: reduce)');
    const sync=()=>{
      const next=active&&canRead(node);visibleRef.current=next;setVisible(current=>current===next?current:next);
      if(next&&enter&&!seen.current&&!quiet)begin();
    };
    const preference=()=>setSystemReduced(media.matches);
    const intersection=new IntersectionObserver(sync,{root:node.closest('.portfolio-page-viewport'),threshold:0});intersection.observe(node);
    const observer=new MutationObserver(sync);
    for(let ancestor=node.parentElement;ancestor;ancestor=ancestor.parentElement)observer.observe(ancestor,{attributes:true,attributeFilter:['style','class','hidden','inert','open']});
    document.addEventListener('visibilitychange',sync);media.addEventListener('change',preference);sync();
    return()=>{intersection.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',sync);media.removeEventListener('change',preference);};
  },[active,enter,quiet,begin,signature,variant]);
  useLayoutEffect(()=>{if(quiet){seen.current=true;running.current=false;setPlaying(false);setCompleted(true);}},[quiet]);
  const finish=useCallback(index=>{
    complete.current.add(index);
    if(complete.current.size>=tokens.count){running.current=false;setPlaying(false);setCompleted(true);}
  },[tokens.count]);
  const pending=!quiet&&enter&&!completed;
  const state={playing,quiet,visible,run,variant,typingSpeed,drawDuration,pending};
  const render=nodes=>nodes.map((node,index)=>{
    if(node?.element)return cloneElement(node.element,undefined,render(node.children));
    if(node&&typeof node==='object'&&'characterOffset' in node)return <ExpressiveWord key={`word-${node.index}`} {...node} last={node.index===tokens.count-1} state={state} onComplete={finish} />;
    return node;
  });
  return <Tag {...props} ref={root} className={`expressive-title ${className}`} data-expressive={variant} data-expressive-playing={playing?'true':'false'} data-expressive-settled={completed?'true':'false'} data-expressive-hover={hover&&!quiet?'true':'false'}>{render(tokens.tree)}</Tag>;
}
