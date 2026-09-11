import {useEffect,useRef,useState} from 'react';
import ParticleText from './ParticleText';
import './PhilosophyParticles.css';

function isVisible(element,intersecting){
 if(!intersecting||!element?.isConnected||document.hidden)return false;
 if(document.body.classList.contains('brand-loading')||document.body.classList.contains('portfolio-route-open')||element.closest('[inert]'))return false;
 const bounds=element.getBoundingClientRect();
 if(bounds.width<=0||bounds.height<=0||bounds.bottom<=0||bounds.top>=innerHeight||bounds.right<=0||bounds.left>=innerWidth)return false;
 let opacity=1;
 for(let ancestor=element;ancestor;ancestor=ancestor.parentElement){
  const style=getComputedStyle(ancestor);
  if(ancestor.hidden||style.display==='none'||style.visibility==='hidden'||style.visibility==='collapse'||style.contentVisibility==='hidden')return false;
  opacity*=Number(style.opacity);
  if(opacity<.05)return false;
 }
 return true;
}

/** A supplementary particle word. Keep the original reading paragraph beside it. */
export default function PhilosophyParticles({lang='zh',reduced=false,active=true,className=''}){
 const root=useRef(null);
 const [visible,setVisible]=useState(false);
 const [systemReduced,setSystemReduced]=useState(()=>typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 const [replay,setReplay]=useState(0);
 const english=lang==='en',quiet=reduced||systemReduced;
 const running=active&&visible&&!quiet;
 const word=english?'RULES & WONDER':'规则与想象';

 useEffect(()=>{
  const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const sync=()=>setSystemReduced(preference.matches);
  sync();preference.addEventListener('change',sync);
  return()=>preference.removeEventListener('change',sync);
 },[]);

 useEffect(()=>{
  const element=root.current;if(!element)return;
  let intersecting=false;
  const sync=()=>setVisible(isVisible(element,intersecting));
  const intersection=new IntersectionObserver(entries=>{intersecting=entries[0].isIntersecting;sync();},{threshold:0});
  intersection.observe(element);
  // The scroll timeline changes opacity/visibility without crossing an IO edge.
  // Observing only ancestor attributes avoids a second render loop.
  const attributes=new MutationObserver(sync);
  for(let ancestor=element;ancestor;ancestor=ancestor.parentElement){
   attributes.observe(ancestor,{attributes:true,attributeFilter:['style','class','hidden','inert']});
  }
  document.addEventListener('visibilitychange',sync);
  return()=>{intersection.disconnect();attributes.disconnect();document.removeEventListener('visibilitychange',sync);};
 },[]);

 return <div ref={root} className={`philosophy-particles ${className}`} data-lang={english?'en':'zh'} data-particles-running={running?'true':'false'}>
  <div className="philosophy-particles__stage" aria-hidden="true">
   {running?<ParticleText
    key={`${lang}:${replay}`}
    text={word}
    trigger="mount"
    particleSize={1.9}
    density={2}
    color="#ffffff"
    highlightColor="#dce5f2"
    scatter={75}
    gatherDuration={1450}
    stagger={220}
    pointerRepel={92}
    repelRadius={105}
    idleDrift={.45}
    fontSize="var(--philosophy-particles-font-size)"
    fontWeight={600}
    fontFamily="inherit"
    glow={true}
   />:<span className="philosophy-particles__still">{word}</span>}
  </div>
  <div className="philosophy-particles__foot">
   <p className="philosophy-particles__hint">{quiet?(english?'Logic meets imagination.':'规则，遇见想象。'):(english?'Move through the letters.':'移动指针，让文字散开。')}</p>
   {!quiet&&<button type="button" className="philosophy-particles__replay" disabled={!running} tabIndex={running?0:-1} onClick={()=>setReplay(value=>value+1)} aria-label={english?'Gather RULES AND WONDER again':'再次聚拢“规则与想象”'}><span aria-hidden="true">↻</span>{english?'Gather again':'再次聚拢'}</button>}
  </div>
 </div>;
}
