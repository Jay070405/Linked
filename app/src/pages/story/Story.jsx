import {useEffect,useRef,useState} from 'react';
import './story.css';

// The building blocks Other Project's film pages share: a film hero, a scroll-lit statement, section heads, reveals,
// a before/after slider and the next-project link.
// Motion is transform and opacity only; the page passes `reduced` (the site's motion switch) to turn it all still.
const scrollerOf=el=>el?.closest('.portfolio-page-viewport')||window;

export function useInView(ref,{threshold=.2,once=true,margin='0px'}={}){
 const [inView,setInView]=useState(false);
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  const io=new IntersectionObserver(([entry])=>{
   if(entry.isIntersecting){setInView(true);if(once)io.disconnect();}else if(!once)setInView(false);
  },{threshold,rootMargin:margin});
  io.observe(el);return()=>io.disconnect();
 },[ref,threshold,once,margin]);
 return inView;
}

/** Scroll progress of an element through the viewport (0 as its top reaches the bottom edge, 1 as its bottom leaves the
    top), written to a callback on each animation frame while the page scrolls. */
function useScrollProgress(ref,onProgress,{start=1,end=0}={}){
 const callback=useRef(onProgress);callback.current=onProgress;
 useEffect(()=>{
  const el=ref.current;if(!el)return;
  const scroller=scrollerOf(el);let raf=0;
  const measure=()=>{raf=0;const r=el.getBoundingClientRect(),vh=innerHeight;
   const from=vh*start,to=vh*end-r.height;callback.current(Math.min(1,Math.max(0,(from-r.top)/(from-to))));};
  const queue=()=>{if(!raf)raf=requestAnimationFrame(measure);};
  measure();scroller.addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);
  return()=>{cancelAnimationFrame(raf);scroller.removeEventListener('scroll',queue);removeEventListener('resize',queue);};
 },[ref,start,end]);
}

export function Reveal({as:Tag='div',className='',delay=0,style,children,...rest}){
 const ref=useRef(null),inView=useInView(ref,{threshold:.12});
 return <Tag ref={ref} className={`st-reveal${inView?' is-in':''}${className?' '+className:''}`} style={{...style,'--d':delay+'ms'}} {...rest}>{children}</Tag>;
}

export function SectionHead({index,title,lead}){
 return <Reveal as="header" className="st-head">
  <span className="st-index">{index}</span>
  <h2>{title}</h2>
  {lead&&<p>{lead}</p>}
 </Reveal>;
}

export function Hero({back,kicker,title,tagline,video,poster,meta,actions,reduced}){
 const ref=useRef(null),media=useRef(null),[ready,setReady]=useState(false);
 useEffect(()=>{const id=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(id);},[]);
 // the background film only runs while the hero is on screen
 useEffect(()=>{
  const v=media.current;if(!v||reduced)return;
  const io=new IntersectionObserver(([entry])=>{entry.isIntersecting?v.play().catch(()=>{}):v.pause();},{threshold:.05});
  io.observe(ref.current);return()=>io.disconnect();
 },[reduced,video]);
 const move=event=>{
  if(reduced||event.pointerType!=='mouse')return;
  const r=ref.current.getBoundingClientRect();
  ref.current.style.setProperty('--px',((event.clientX-r.left)/r.width-.5).toFixed(3));
  ref.current.style.setProperty('--py',((event.clientY-r.top)/r.height-.5).toFixed(3));
 };
 return <header ref={ref} className={'st-hero'+(ready?' is-in':'')} onPointerMove={move}>
  <div className="st-hero-media" aria-hidden="true"><video key={video} ref={media} muted loop playsInline preload="metadata" poster={poster}><source src={video} type="video/mp4"/></video></div>
  <div className="st-hero-scrim" aria-hidden="true"/>
  <div className="st-hero-inner">
   <div className="st-kicker">{back}<span>{kicker}</span></div>
   <h1 className="st-title" aria-label={title}>{title.split(' ').map((word,i)=><span className="st-word" key={i} aria-hidden="true"><span style={{'--i':i}}>{word}</span></span>)}</h1>
   <p className="st-tagline">{tagline[0]} <i>{tagline[1]}</i></p>
   <div className="st-actions">{actions}</div>
  </div>
  <dl className="st-meta">{meta.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
  <span className="st-cue" aria-hidden="true"><i/></span>
 </header>;
}

/** A statement that lights up word by word as it scrolls through the middle of the screen. */
export function Statement({text,reduced}){
 const ref=useRef(null),words=text.split(/(\s+)/).filter(w=>w.trim());
 const set=p=>ref.current?.style.setProperty('--p',reduced?1:p.toFixed(4));
 useScrollProgress(ref,set,{start:.9,end:.35});
 return <p ref={ref} className="st-statement" style={{'--n':words.length}}>{words.map((w,i)=><span key={i} style={{'--i':i}}>{w} </span>)}</p>;
}

/** First cut against final: drag the divider (or use the arrow keys) across the same moment. */
export function BeforeAfter({pairs,media,lang,reduced}){
 const en=lang==='en',stage=useRef(null),[pair,setPair]=useState(0),[x,setX]=useState(50),inView=useInView(stage,{threshold:.5});
 // one slow sweep the first time it comes into view, so it reads as something to drag
 useEffect(()=>{
  if(!inView||reduced)return;
  let raf=0,t0;const keys=[[0,50],[700,22],[1500,78],[2200,50]];
  const step=t=>{t0??=t;const e=t-t0;let i=keys.findIndex(k=>k[0]>e);if(i<0){setX(50);return;}
   const [a,va]=keys[i-1],[b,vb]=keys[i],k=(e-a)/(b-a),s=k*k*(3-2*k);setX(va+(vb-va)*s);raf=requestAnimationFrame(step);};
  raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf);
 },[inView,reduced]);
 const p=pairs[pair];
 return <div className="st-ba">
  <div className="st-ba-tabs" role="tablist">{pairs.map((q,i)=><button key={i} type="button" role="tab" aria-selected={i===pair} onClick={()=>setPair(i)}>{String(i+1).padStart(2,'0')}</button>)}</div>
  <div ref={stage} className="st-ba-stage" style={{'--x':x/100}}>
   <img src={`${media}/final-${pair+1}.webp`} width="960" height="540" alt={(en?'Final: ':'终版：')+p.caption[lang]}/>
   <img className="st-ba-before" src={`${media}/v1-${pair+1}.webp`} width="960" height="540" alt={(en?'First cut: ':'第一版：')+p.caption[lang]}/>
   <div className="st-ba-line" aria-hidden="true"><i>↔</i></div>
   <span className="st-ba-label">{en?'FIRST CUT':'第一版'}</span><span className="st-ba-label is-right">{en?'FINAL':'终版'}</span>
   <input type="range" min="0" max="100" step=".1" value={x} onChange={event=>setX(+event.target.value)} aria-label={en?'Drag to compare the first cut with the final':'拖动对比第一版和终版'}/>
  </div>
  <p className="st-ba-caption">{p.caption[lang]}</p>
 </div>;
}

export function NextProject({item,lang,onNavigate}){
 const en=lang==='en';
 const go=event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();onNavigate(item.href);};
 return <Reveal as="nav" className="st-next" aria-label={en?'Next project':'下一个项目'}>
  <a href={item.href} onClick={go}>
   <span className="st-next-k">{en?'NEXT PROJECT':'下一个项目'}</span>
   <span className="st-next-title">{item.name} <b aria-hidden="true">→</b></span>
   <span className="st-next-line">{item.line[lang]}</span>
   <span className="st-next-media" aria-hidden="true"><img src={item.cover} alt="" loading="lazy" decoding="async"/><img src={item.preview} alt="" loading="lazy" decoding="async"/></span>
  </a>
 </Reveal>;
}
