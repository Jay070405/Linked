import {useLayoutEffect,useEffect,useRef} from 'react';
import {transitionMark} from './projectTransitionProbe';

// Start the compositor animation immediately. Model parsing must never gate it.
// The live iframe stays mounted through the route commit and fades into the move.
export default function SharedProjectTransition({capture,hostRef,galleryRef,onFinish,onCancel,ready,lang}){
 const root=useRef(null),reveal=useRef(()=>{}),readyRef=useRef(ready);
 readyRef.current=ready;
 useLayoutEffect(()=>{
  const node=root.current,cover=node.querySelector('.vc-shared-card'),status=node.querySelector('.vc-shared-status');
  const host=hostRef.current,content=host.querySelector('.vc-project-content');
  const gallery=galleryRef.current?.querySelector('.vc-gallery');
  const rect=capture.rect,top=innerWidth<=600?140:146;
  const destination={left:0,top,width:innerWidth,height:innerHeight-top};
  const scale=Math.max(rect.width/destination.width,rect.height/destination.height);
  const coverScale=Math.max(destination.width/rect.width,destination.height/rect.height);
  const outline=capture.outline||[{u:0,v:0},{u:1,v:0},{u:1,v:1},{u:0,v:1}].map(p=>({...p,x:rect.left+p.u*rect.width,y:rect.top+p.v*rect.height}));
  const polygon=points=>`polygon(${points.map(p=>`${p.x.toFixed(2)}px ${p.y.toFixed(2)}px`).join(',')})`;
  const animations=[];let disposed=false,revealing=false,completed=false;
  const animate=(element,keyframes,options={})=>{
   if(!element)return null;
   const animation=element.animate(keyframes,{duration:1050,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both',...options});
   animations.push(animation);return animation;
  };
  Object.assign(cover.style,{left:`${rect.left}px`,top:`${rect.top}px`,width:`${rect.width}px`,height:`${rect.height}px`});
  if(capture.surface)cover.appendChild(capture.surface);
  content.style.transformOrigin=`0px ${top}px`;
  const expansion=animate(cover,[
   {transform:'translate3d(0,0,0) scale(1)'},
   {transform:`translate3d(${(destination.width-rect.width*coverScale)/2-rect.left}px,${top+(destination.height-rect.height*coverScale)/2-rect.top}px,0) scale(${coverScale})`}
  ]);
  animate(host,[{clipPath:polygon(outline)},{clipPath:polygon(outline.map(p=>({x:p.u*innerWidth,y:96+p.v*(innerHeight-96)})))}]);
  animate(content,[
   {transform:`translate3d(${rect.left+(rect.width-destination.width*scale)/2}px,${rect.top-top+(rect.height-destination.height*scale)/2}px,0) scale(${scale})`},
   {transform:'translate3d(0,0,0) scale(1)'}
  ]);
  animate(gallery,[{opacity:1},{opacity:0}],{duration:650});
  animate(status,[{opacity:0},{opacity:1}],{duration:180,delay:1300});
  transitionMark('expand');
  reveal.current=()=>{
   if(disposed||revealing||!readyRef.current)return;
   revealing=true;transitionMark('model-ready');
   // These opacity animations also run independently of the page's JS frames.
   const shown=animate(host,[{opacity:0},{opacity:1}],{duration:260,easing:'ease-out'});
   animate(cover,[{opacity:1},{opacity:0}],{duration:260,easing:'ease-out'});
   animate(status,[{opacity:0},{opacity:0}],{duration:1});
   Promise.all([expansion.finished,shown.finished]).then(()=>{
    if(disposed)return;completed=true;transitionMark('finish');onFinish();
   }).catch(()=>{}); // Cancellation is the normal Escape / navigation path.
  };
  node.focus({preventScroll:true});
  const escape=e=>{if(e.key==='Escape'){e.preventDefault();onCancel();}};
  const wheel=e=>e.preventDefault();
  node.addEventListener('keydown',escape);node.addEventListener('wheel',wheel,{passive:false});
  window.addEventListener('resize',onCancel,{once:true});
  reveal.current();
  return()=>{
   disposed=true;reveal.current=()=>{};
   if(!completed)transitionMark('cancel');
   node.removeEventListener('keydown',escape);node.removeEventListener('wheel',wheel);window.removeEventListener('resize',onCancel);
   animations.forEach(animation=>animation.cancel());capture.surface?.remove();content.style.removeProperty('transform-origin');
  };
 },[capture,hostRef,galleryRef,onFinish,onCancel]);
 useEffect(()=>{if(ready)reveal.current();},[ready]);
 return <div ref={root} className="vc-shared-layer" role="dialog" aria-modal="true" aria-label={lang==='en'?'Opening FIELD / 01':'正在打开 FIELD / 01'} tabIndex={-1}>
  <div className="vc-shared-card" aria-hidden="true">{!capture.surface&&<img src={capture.image} alt=""/>}</div>
  <div className="vc-shared-status"><span role="status">{lang==='en'?'Preparing FIELD / 01…':'正在准备 FIELD / 01…'}</span><button onClick={onCancel}>{lang==='en'?'Cancel':'取消'}</button></div>
 </div>;
}
