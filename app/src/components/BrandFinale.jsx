import {useEffect,useRef,useState} from 'react';
import BrandConstruction from './BrandConstruction';
import LiquidSignature from '../LiquidSignature';

export default function BrandFinale({lang='zh',reduced=false}) {
 const host=useRef(null),[entered,setEntered]=useState(false),[replay,setReplay]=useState(0);
 useEffect(()=>{
  const node=host.current;
  let started=false;
  const check=()=>{
   if(started||document.hidden||document.body.classList.contains('portfolio-route-open')||document.body.classList.contains('brand-loading'))return;
   const rect=node.getBoundingClientRect(),visible=Math.max(0,Math.min(rect.bottom,innerHeight)-Math.max(rect.top,0));
   if(visible>=rect.height*.35&&rect.height>0){started=true;setEntered(true);}
  };
  const observer=new IntersectionObserver(check,{threshold:.35});
  const covers=new MutationObserver(check);covers.observe(document.body,{attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',check);observer.observe(node);check();
  return()=>{observer.disconnect();covers.disconnect();document.removeEventListener('visibilitychange',check);};
 },[]);
 return <div className="brand-finale" ref={host}>
  <BrandConstruction play={entered} reduced={reduced} replayKey={replay}><LiquidSignature reduced={reduced} vectorWordmark/></BrandConstruction>
  <div className="brand-finale-bottom"><span>LOGIC × IMAGINATION</span>{!reduced&&<button type="button" onClick={()=>{setEntered(true);setReplay(value=>value+1);}}>{lang==='en'?'Replay the signature':'重播字标'} <span aria-hidden="true">↺</span></button>}</div>
 </div>;
}
