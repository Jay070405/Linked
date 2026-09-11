import {Children,cloneElement,isValidElement,useEffect,useMemo,useRef} from 'react';
import './EditorialMotion.css';

function splitText(value,mode){
 const text=String(value);
 // Keep Latin words intact at line breaks, and use graphemes for CJK/emoji.
 const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:mode==='chars'?'grapheme':'word'}):null;
 const chunks=segmenter?[...segmenter.segment(text)].map(item=>item.segment):text.split(/(\s+)/u);
 const tokens=chunks.flatMap(chunk=>mode!=='words'&&/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/u.test(chunk)?[...chunk]:[chunk]);
 return tokens.reduce((result,token)=>{if(/^[.,!?;:，。！？、：；）】”’]+$/u.test(token)&&result.length&&!/^\s+$/u.test(result.at(-1)))result[result.length-1]+=token;else result.push(token);return result;},[]);
}

const contentSignature=children=>Children.toArray(children).map(child=>isValidElement(child)?`${String(child.type)}:${child.props.className||''}[${contentSignature(child.props.children)}]`:String(child)).join('|');

function wrapText(children,mode,counter={value:0}){
 return Children.map(children,child=>{
  if(typeof child==='string'||typeof child==='number')return splitText(child,mode).map(chunk=>{
   if(/^\s+$/u.test(chunk))return chunk;
   const index=counter.value++;
   return <span className="edm-cut" key={`letter-${index}`}><span className="edm-ink">{chunk}</span></span>;
  });
  if(!isValidElement(child)||!child.props.children||['svg','img','button','input','textarea'].includes(child.type))return child;
  return cloneElement(child,undefined,wrapText(child.props.children,mode,counter));
 });
}

function readable(node){
 if(!node?.isConnected||document.hidden||node.closest('[inert]'))return false;
 if(document.body.classList.contains('brand-loading'))return false;
 if(document.body.classList.contains('portfolio-route-open')&&!node.closest('.portfolio-page-viewport, dialog[open]'))return false;
 const rect=node.getBoundingClientRect();if(rect.bottom<=0||rect.top>=innerHeight||rect.right<=0||rect.left>=innerWidth)return false;
 let parent=node;
 while(parent&&parent!==document.body){const style=getComputedStyle(parent);if(style.display==='none'||style.visibility==='hidden'||Number(style.opacity)<.035)return false;parent=parent.parentElement;}
 return true;
}

/** Inner-only motion. Preserve the outer heading and its GSAP transform.
 * enter=false is intended for film/timeline-controlled headings.
 * active=false can hold a reveal until a parent's existing state is ready.
 */
export default function EditorialMotion({children,as:Tag='span',className='',reduced=false,enter=true,hover=true,active=true,mode='auto',duration=620,stagger=22,replayKey,...props}){
 const node=useRef(null),controls=useRef(null);
 const wrapped=useMemo(()=>wrapText(children,mode),[children,mode]);
 const contentKey=contentSignature(children);
 useEffect(()=>{
  const heading=node.current?.closest('h1,h2,h3,h4,h5,h6');
  if(!heading||heading.hasAttribute('aria-label')||heading.hasAttribute('aria-labelledby'))return;
  let label='';
  const read=part=>part.nodeName==='BR'?' ':part.nodeType===3?part.nodeValue:[...part.childNodes].map(read).join('');
  const update=()=>{label=read(heading).replace(/\s+/g,' ').trim();heading.setAttribute('aria-label',label);};
  update();const observer=new MutationObserver(update);observer.observe(heading,{childList:true,characterData:true,subtree:true});
  return()=>{observer.disconnect();if(heading.getAttribute('aria-label')===label)heading.removeAttribute('aria-label');};
 },[contentKey]);
 useEffect(()=>{
  const element=node.current;if(!element)return;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  let disposed=false,entered=!enter,intersecting=false,animations=[];
  const ink=[...element.querySelectorAll('.edm-ink')];
  const permitted=()=>!disposed&&!reduced&&!preference.matches&&active;
  const cancel=()=>{animations.forEach(animation=>animation.cancel());animations=[];};
  const run=kind=>{
   if(!permitted()||!readable(element)||typeof ink[0]?.animate!=='function')return;
   if(animations.some(animation=>animation.playState==='running'))return;
   cancel();entered=true;
   const length=Math.max(1,ink.length-1);
   animations=ink.map((part,index)=>part.animate(kind==='enter'?
    [{transform:'translateY(108%) rotate(3deg)',opacity:0},{transform:'translateY(0) rotate(0)',opacity:1}]:
    [{transform:'translateY(0) rotateX(0deg)'},{transform:'translateY(-.105em) rotateX(-12deg)',offset:.42},{transform:'translateY(0) rotateX(0deg)'}],
    {duration:kind==='enter'?Math.max(200,duration):470,delay:kind==='enter'?Math.min(index*stagger,110):index/length*70,easing:'cubic-bezier(.2,.75,.25,1)',fill:kind==='enter'?'backwards':'none'}));
  };
  const sync=()=>{
   if(!permitted()){cancel();return;}
   if(entered&&!animations.some(animation=>animation.playState==='running'||animation.playState==='paused'))return;
   const visible=intersecting&&readable(element);
   for(const animation of animations){if(visible&&animation.playState==='paused')animation.play();else if(!visible&&animation.playState==='running')animation.pause();}
   if(visible&&!entered)run('enter');
  };
  controls.current={hover:()=>{if(hover&&intersecting)run('hover');}};
  const observer=new IntersectionObserver(entries=>{intersecting=entries[0].isIntersecting;sync();},{root:element.closest('.portfolio-page-viewport'),threshold:0});
  observer.observe(element);
  // GSAP changes ancestor visibility/opacity without a new intersection event.
  // Watch attributes only; no per-frame animation loop and no DOM replacement.
  const visibilityObserver=new MutationObserver(sync);
  for(let ancestor=element.parentElement;ancestor&&ancestor!==document.body;ancestor=ancestor.parentElement)visibilityObserver.observe(ancestor,{attributes:true,attributeFilter:['style','class','hidden','inert','open']});
  visibilityObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',sync);preference.addEventListener('change',sync);
  return()=>{disposed=true;controls.current=null;cancel();observer.disconnect();visibilityObserver.disconnect();document.removeEventListener('visibilitychange',sync);preference.removeEventListener('change',sync);};
 },[contentKey,mode,reduced,enter,hover,active,duration,stagger,replayKey]);
 const pointer=event=>{if(event.pointerType!=='touch')controls.current?.hover();};
 return <Tag {...props} ref={node} className={`editorial-motion ${className}`} data-edm-reduced={reduced?'true':undefined} onPointerEnter={pointer} onFocus={()=>controls.current?.hover()}>{wrapped}</Tag>;
}

/** Informational text with keyboard-equivalent feedback; deliberately not a link. */
export function FocusLine({children,as:Tag='span',className='',reduced=false,...props}){
 const node=useRef(null);
 useEffect(()=>{
  const element=node.current,scene=element?.closest('.legacy-scene-copy');if(!element||!scene)return;
  const update=()=>{element.tabIndex=readable(element)?0:-1;};
  const observer=new MutationObserver(update);observer.observe(scene,{attributes:true,attributeFilter:['style','class','hidden']});
  const intersection=new IntersectionObserver(update);intersection.observe(element);
  update();return()=>{observer.disconnect();intersection.disconnect();};
 },[]);
 return <Tag {...props} ref={node} className={`editorial-focus-line ${className}`} tabIndex={0} data-edm-reduced={reduced?'true':undefined}>{children}</Tag>;
}
