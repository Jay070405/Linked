import {useEffect,useRef,useState} from 'react';
import './story.css';

// The building blocks of Other Project's story pages (the product films and Hako): a film hero, scroll-lit statements,
// count-ups, a tried/chose deck, a scroll-scrubbed flipbook, a before/after slider and the next-project link.
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

export function CountUp({to,prefix='',suffix='',reduced}){
 const ref=useRef(null),inView=useInView(ref,{threshold:.6}),[value,setValue]=useState(reduced?to:0);
 useEffect(()=>{
  if(!inView)return;
  if(reduced){setValue(to);return;}
  let raf=0,t0;
  const step=t=>{t0??=t;const k=Math.min(1,(t-t0)/1400);setValue(Math.round(to*(1-Math.pow(1-k,4))));if(k<1)raf=requestAnimationFrame(step);};
  raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf);
 },[inView,to,reduced]);
 return <span ref={ref} className="st-count">{prefix}{value.toLocaleString('en-US')}{suffix}</span>;
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

/** What was tried and what was chosen, one card per decision; each card flips between the two. */
export function Decisions({items,lang,accent}){
 const en=lang==='en',deck=useRef(null),[side,setSide]=useState({});
 const scroll=dir=>{const el=deck.current,card=el.querySelector('li');el.scrollBy({left:dir*(card?card.offsetWidth+20:400),behavior:'smooth'});};
 return <div className="st-decisions">
  <div className="st-deck-nav"><button type="button" onClick={()=>scroll(-1)} aria-label={en?'Previous decision':'上一条'}>←</button><button type="button" onClick={()=>scroll(1)} aria-label={en?'Next decision':'下一条'}>→</button></div>
  <ol ref={deck} className="st-deck" style={{'--accent':accent}}>{items.map((d,i)=>{
   const tried=side[i]==='tried'&&d.tried,img=d.img;
   return <Reveal as="li" key={i} delay={i*70} className={'st-card st-card-'+img.kind}>
    <div className="st-card-media">{img.kind==='snippet'?<img src={img.src} width={img.w} height={img.h} loading="lazy" decoding="async" alt=""/>:<img src={img.src} loading="lazy" decoding="async" alt="" style={{objectPosition:img.position}}/>}</div>
    <div className="st-card-body">
     <span className="st-card-n">{String(i+1).padStart(2,'0')}</span>
     <h3>{d.title[lang]}</h3>
     <p className="st-card-verdict">{d.verdict[lang]}</p>
     {d.tried&&<>
      <div className="st-switch" role="radiogroup" aria-label={en?'What was tried and what was chosen':'试过的和最后选的'}>
       <button type="button" role="radio" aria-checked={!tried} onClick={()=>setSide(s=>({...s,[i]:'chose'}))}>{en?'Chose':'选了'}</button>
       <button type="button" role="radio" aria-checked={tried} onClick={()=>setSide(s=>({...s,[i]:'tried'}))}>{en?'Tried first':'先试过'}</button>
       <i className={tried?'is-right':''} aria-hidden="true"/>
      </div>
      <div className="st-card-swap"><p key={tried?'t':'c'} className={tried?'is-tried':'is-chose'}>{(tried?d.tried:d.chose)[lang]}</p></div>
     </>}
    </div>
   </Reveal>;
  })}</ol>
 </div>;
}

/** A pinned stage that steps through a run of frames as the page scrolls past it. */
export function Flipbook({frames,steps,duration,reduced,lang,onPlay}){
 const en=lang==='en',ref=useRef(null),[frame,setFrame]=useState(0),[near,setNear]=useState(false);
 const set=p=>{setFrame(Math.min(frames.length-1,Math.round(p*(frames.length-1))));ref.current?.style.setProperty('--fp',p.toFixed(4));};
 useScrollProgress(ref,set,{start:0,end:1});
 // load the frames only once the section is close
 useEffect(()=>{const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){setNear(true);io.disconnect();}},{rootMargin:'800px 0px'});io.observe(ref.current);return()=>io.disconnect();},[]);
 const t=duration[0]+(duration[1]-duration[0])*frame/(frames.length-1);
 const current=steps.reduce((k,s,i)=>t>=s.t-.04?i:k,0);
 return <section ref={ref} className={'st-flip'+(reduced?' is-still':'')} aria-label={en?'The key moment, frame by frame':'关键镜头，逐帧'}>
  <div className="st-flip-stage">
   <div className="st-flip-frame">{near&&frames.map((src,i)=><img key={src} src={src} alt="" decoding="async" className={i===frame?'is-on':undefined}/>)}
    <span className="st-flip-tc">{en?'FRAME':'帧'} {String(frame+1).padStart(2,'0')} / {frames.length} · {t.toFixed(2)} s</span>
   </div>
   <ol className="st-flip-steps">{steps.map((s,i)=><li key={i} className={i===current?'is-on':i<current?'is-past':undefined}>
    <button type="button" onClick={()=>onPlay(s.t)}><b>{String(i+1).padStart(2,'0')}</b><span>{s.label[lang]}</span><em>▶ {s.t.toFixed(2)}s</em></button>
   </li>)}</ol>
   <div className="st-flip-bar" aria-hidden="true"><i/></div>
  </div>
 </section>;
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
