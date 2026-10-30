import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {FILMS,nextAfter} from './product-films-data';
import {Hero,SectionHead,Statement,CountUp,Reveal,Decisions,Flipbook,BeforeAfter,NextProject} from './story/Story';
import './brand-motion.css';
import './hako-film.css';
import './film-case.css';

// One story page per product launch film: the problem, the product to try (a demo built on the case's own model), the
// design decisions from its case study, how the film tells it (a scroll-scrubbed key moment and the edit itself), the
// first cut against the final, and a short craft section, from aigc-vibecoding/product-films' own record.
const FPS=60;
const DEMOS={
 'variables-for-agents':lazy(()=>import('./demos/VariablesDemo')),
 'last-100-feet':lazy(()=>import('./demos/LastHundredFeetDemo')),
 'common-ground':lazy(()=>import('./demos/CommonGroundDemo')),
};
const clock=t=>{const f=Math.round(t*FPS),s=Math.floor(f/FPS);return '00:00:'+String(s).padStart(2,'0')+':'+String(f%FPS).padStart(2,'0');};
const RESEARCH_FILMS=['Apple Creator Studio','Notion Mail','Figma Motion','Figma Config 2025','Linear Agent','Raycast','Dia','Notion AI','iOS 26 Liquid Glass'];

/** The edit: the film above its own timeline (beats, headlines, shots, measured motion), clickable and draggable. */
function Desk({film,slug,lang,video}){
 const en=lang==='en',DUR=film.duration,media='/assets/other-project/'+slug,src='/video/'+film.stem+'-film.mp4';
 const pos=t=>t/DUR*100+'%',span=(a,b)=>({left:pos(a),width:(b-a)/DUR*100+'%'});
 const shots=[0,...film.cuts,DUR];
 const lanes=useRef(null),scroller=useRef(null),strip=useRef(null),head=useRef(null),tc=useRef(null);
 const beatRef=useRef(0),dragging=useRef(false),paintRef=useRef(null);
 const [beat,setBeat]=useState(0),[failed,setFailed]=useState(false);
 useEffect(()=>{
  const v=video.current;let raf=0;
  const paint=()=>{
   const t=Math.min(v.currentTime||0,DUR);
   head.current.style.left=pos(t);tc.current.textContent=clock(t);
   lanes.current.setAttribute('aria-valuenow',t.toFixed(1));lanes.current.setAttribute('aria-valuetext',clock(t));
   const i=film.beats.findIndex(b=>t<b.to),index=i<0?film.beats.length-1:i;
   if(index!==beatRef.current){beatRef.current=index;setBeat(index);}
   const s=scroller.current;
   if(!v.paused&&s.scrollWidth>s.clientWidth){const r=lanes.current,x=r.offsetLeft+t/DUR*r.offsetWidth;if(x<s.scrollLeft+r.offsetLeft||x>s.scrollLeft+s.clientWidth-32)s.scrollLeft=x-s.clientWidth/2;}
  };
  const loop=()=>{paint();if(!v.paused&&!v.ended)raf=requestAnimationFrame(loop);};
  const start=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);};
  paintRef.current=paint;paint();
  v.addEventListener('play',start);v.addEventListener('seeked',paint);v.addEventListener('timeupdate',paint);
  const pauseWhenHidden=()=>{if(document.hidden)v.pause();};
  document.addEventListener('visibilitychange',pauseWhenHidden);
  return()=>{cancelAnimationFrame(raf);v.removeEventListener('play',start);v.removeEventListener('seeked',paint);v.removeEventListener('timeupdate',paint);document.removeEventListener('visibilitychange',pauseWhenHidden);};
 },[slug]);
 // V1: each shot tiles its own frames at their true 16:9, like an editor's filmstrip (one sprite frame per 0.5 s)
 useEffect(()=>{
  const canvas=strip.current,sprite=new Image(),last=Math.ceil(DUR/.5)-1;let ready=false;
  const draw=()=>{
   if(!ready)return;
   const ratio=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
   canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
   const g=canvas.getContext('2d');g.setTransform(ratio,0,0,ratio,0,0);g.clearRect(0,0,w,h);
   const tw=h*16/9;
   for(let s=0;s<shots.length-1;s++){
    const x0=shots[s]/DUR*w,x1=shots[s+1]/DUR*w;
    g.save();g.beginPath();g.rect(x0+.5,0,Math.max(0,x1-x0-1),h);g.clip();
    for(let x=x0;x<x1;x+=tw){const i=Math.min(last,Math.floor((x/w*DUR+.26)/.5));g.drawImage(sprite,(i%10)*192,Math.floor(i/10)*108,192,108,x,0,tw,h);}
    g.restore();
   }
  };
  sprite.onload=()=>{ready=true;draw();};sprite.src=media+'/filmstrip.webp';
  const observer=new ResizeObserver(draw);observer.observe(canvas);
  return()=>{observer.disconnect();sprite.onload=null;};
 },[slug]);
 const seek=t=>{const v=video.current;v.currentTime=Math.max(0,Math.min(t,DUR-1/FPS));paintRef.current?.();};
 const seekAt=clientX=>{const r=lanes.current.getBoundingClientRect();seek((clientX-r.left)/r.width*DUR);};
 const keys=event=>{
  const v=video.current,step=event.shiftKey?1/FPS:1;
  const to={ArrowRight:v.currentTime+step,ArrowLeft:v.currentTime-step,Home:0,End:DUR}[event.key];
  if(to!==undefined){event.preventDefault();seek(to);}
  else if(event.key===' '){event.preventDefault();v.paused?v.play().catch(()=>{}):v.pause();}
 };
 const motionMax=Math.max(...film.motion),step=4/FPS;
 const motionD='M'+film.motion.map((v,i)=>((i+.5)*step).toFixed(3)+','+(1-v/motionMax*.92).toFixed(3)).join('L');
 const current=film.beats[beat]||film.beats[0];
 return <>
  <div className="hk-desk">
   <div className="hk-bar"><span className="hk-dots" aria-hidden="true"><i/><i/><i/></span><b>{film.file}</b><span className="hk-bar-meta">1920 × 1080 · 60 FPS · {en?'NO SOUND':'无声'}</span><span ref={tc} className="hk-tc" aria-hidden="true">00:00:00:00</span></div>
   <video key={slug} ref={video} controls muted playsInline preload="metadata" poster={'/video/'+film.stem+'-film.jpg'} aria-label={film.name+(en?' — launch film, no sound':' 宣传片，无声')} onError={()=>setFailed(true)}>
    <source src={src} type="video/mp4"/>
    <a href={src}>{en?'Open video':'打开视频'}</a>
   </video>
   <div className="hk-inspector" aria-live="polite">
    <div><span>{en?'BEAT':'段落'} {String(beat+1).padStart(2,'0')} / {film.beats.length}</span><strong>{current.name}</strong></div>
    <p>{current.what[lang]}</p>
    <div><span>{en?'CAMERA':'镜头'}</span><p>{current.camera[lang]}</p></div>
   </div>
   <div ref={scroller} className="hk-timeline">
    <div className="hk-tl fc-tl">
     <div className="hk-labels" aria-hidden="true"><span/><span>{en?'BEAT':'段落'}</span><span>{en?'TEXT':'字幕'}</span><span>V1</span><span>{en?'MOTION':'运动'}</span></div>
     <div ref={lanes} className="hk-lanes" role="slider" tabIndex={0} aria-label={en?'Timeline: drag or use the arrow keys to move through the film':'时间线：拖动或用方向键在片中跳转'} aria-valuemin={0} aria-valuemax={DUR}
      onPointerDown={event=>{if(event.pointerType!=='mouse'||event.button!==0)return;event.currentTarget.setPointerCapture(event.pointerId);dragging.current=true;seekAt(event.clientX);}}
      onPointerMove={event=>{if(dragging.current)seekAt(event.clientX);}}
      onPointerUp={()=>{dragging.current=false;}} onPointerCancel={()=>{dragging.current=false;}}
      onClick={event=>seekAt(event.clientX)} onKeyDown={keys}>
      <svg className="hk-grid" viewBox={`0 0 ${DUR} 1`} preserveAspectRatio="none" aria-hidden="true">
       {Array.from({length:Math.floor(DUR*2)},(_,i)=><line key={i} className={i%2?undefined:'hk-bar-line'} x1={(i+1)/2} x2={(i+1)/2} y1="0" y2="1"/>)}
      </svg>
      <div className="hk-ruler" aria-hidden="true">{Array.from({length:Math.floor(DUR/5)+1},(_,i)=><span key={i} style={{left:pos(i*5)}}>{String(i*5).padStart(2,'0')}</span>)}</div>
      <div className="hk-lane hk-beats" aria-hidden="true">{film.beats.map((b,i)=>{const from=i?film.beats[i-1].to:0;return <span key={b.name+i} className={(i===beat?'is-on':'')+(b.to-from<1.2?' is-short':'')} style={span(from,b.to)}>{b.name}</span>;})}</div>
      <div className="hk-lane hk-text" aria-hidden="true">{film.headlines.map(([a,b,text])=><span key={a+text} style={span(a,b)}>{text}</span>)}</div>
      <div className="hk-lane hk-v1" aria-hidden="true"><canvas ref={strip}/>{shots.slice(0,-1).map((s,i)=><span key={s} className={shots[i+1]-s<1.2?'is-short':undefined} style={span(s,shots[i+1])}>{String(i+1).padStart(2,'0')}</span>)}</div>
      <div className="hk-lane fc-motion" aria-hidden="true">
       <svg viewBox={`0 0 ${DUR} 1`} preserveAspectRatio="none"><path d={motionD}/>{film.cuts.map(c=><line key={c} x1={c} x2={c} y1="0" y2="1"/>)}</svg>
      </div>
      <div ref={head} className="hk-head" aria-hidden="true"><i/></div>
     </div>
    </div>
   </div>
   <ul className="hk-legend"><li><i className="fc-key-motion"/>{en?'Picture change per frame':'逐帧画面变化'}</li><li><i className="fc-key-cut"/>{en?'Hard cuts':'硬切'} <span>{film.cuts.length}</span></li><li className="hk-legend-grid">{en?'Click or drag the timeline to jump':'点击或拖动时间线跳转'}</li></ul>
  </div>
  {failed&&<p className="brand-motion-error" role="alert">{en?'The video could not load. Try opening it directly.':'视频暂时未能加载，请直接打开。'} <a href={src}>{en?'Open video':'打开视频'} ↗</a></p>}
 </>;
}

export default function FilmCase({lang,reduced,onNavigate,slug}){
 const film=FILMS[slug],en=lang==='en',DUR=film.duration,media='/assets/other-project/'+slug,src='/video/'+film.stem+'-film.mp4';
 const Demo=DEMOS[slug],video=useRef(null),demo=useRef(null);
 const go=to=>event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();onNavigate(to);
 };
 const behavior=reduced?'auto':'smooth';
 const watch=t=>{const v=video.current;if(typeof t==='number')v.currentTime=t;v.play().catch(()=>{});v.scrollIntoView({behavior,block:'center'});};
 const flipFrames=Array.from({length:24},(_,i)=>`${media}/flip-${String(i+1).padStart(2,'0')}.webp`);
 const caseHref='/product/'+film.caseSlug,shots=film.cuts.length+1;
 return <article key={slug} className={'st-page fc-page'+(reduced?' st-still':'')} data-nav-tone="dark" style={{'--accent':film.accent}}>
  <Hero reduced={reduced} video={src} poster={'/video/'+film.stem+'-film.jpg'} title={film.name} tagline={film.tagline}
   back={<a href="/other-project" onClick={go('/other-project')}>← Other Project</a>} kicker={en?'PRODUCT CONCEPT / LAUNCH FILM':'产品概念 / 宣传片'}
   meta={[[en?'FILM':'片长',`${DUR} s · 60 fps`],[en?'SHOTS':'镜头',String(shots)],[en?'PRODUCT':'产品',film.caseName[lang].replace(/^The | case$|案例$/g,'').trim()],[en?'ROLE':'角色',en?'Product design, film':'产品设计、宣传片']]}
   actions={<>
    <button type="button" className="st-btn is-primary" onClick={()=>watch(0)}>▶ {en?'Watch the film':'看片子'}</button>
    <button type="button" className="st-btn" onClick={()=>demo.current.scrollIntoView({behavior,block:'start'})}>{en?'Try the product':'试试这个产品'} ↓</button>
   </>}/>

  <div className="st-wrap">
   <section className="st-section" aria-labelledby="fc-problem">
    <Reveal as="span" className="st-index st-lead-index" id="fc-problem">01 / {en?'THE PROBLEM':'问题'}</Reveal>
    <Statement text={film.problem[lang]} reduced={reduced}/>
    <div className="st-facts">{film.facts.map((f,i)=><Reveal className="st-fact" key={i} delay={i*90}><CountUp to={f.to} prefix={f.prefix} suffix={f.suffix} reduced={reduced}/><p>{f.label[lang]}</p></Reveal>)}</div>
   </section>

   <section ref={demo} className="st-section" aria-labelledby="fc-try">
    <SectionHead index={`02 / ${en?'TRY IT':'试一试'}`} title={<span id="fc-try">{en?'How it works':'它怎么用'}</span>} lead={film.how[lang]}/>
    <Reveal className="st-demo"><Suspense fallback={<div className="st-demo-loading st-mono">{en?'Loading the demo…':'正在加载演示…'}</div>}><Demo lang={lang} reduced={reduced}/></Suspense></Reveal>
   </section>

   <section className="st-section" aria-labelledby="fc-why">
    <SectionHead index={`03 / ${en?'DESIGN DECISIONS':'设计决策'}`} title={<span id="fc-why">{en?'Why it works this way':'为什么这样设计'}</span>}
     lead={film.decisions[0].tried?(en?'Five decisions from the case study. Each card shows what I chose; flip it to see what I tried first.':'案例里的五个设计决策。每张卡片先给最后的选择，切换一下能看到我先试过什么。'):(en?'Five principles the prototype was built to pass, each with the piece of interface that passes it.':'原型必须做到的五条原则，每条都配上做到这一点的那一小块界面。')}/>
    <Decisions items={film.decisions} lang={lang} accent={film.accent}/>
   </section>

   <section className="st-section" aria-labelledby="fc-film">
    <SectionHead index={`04 / ${en?'THE FILM':'宣传片'}`} title={<span id="fc-film">{en?'How the film tells it':'片子怎么讲这件事'}</span>} lead={film.signatureText[lang]}/>
    <ol className="st-ideas">{film.ideas.map((idea,i)=><Reveal as="li" key={i} delay={i*90}><b>{String(i+1).padStart(2,'0')}</b><h3>{idea.title[lang]}</h3><p>{idea.body[lang]}</p></Reveal>)}</ol>
    <Flipbook frames={flipFrames} steps={film.signature} duration={film.flip} reduced={reduced} lang={lang} onPlay={watch}/>
    <Reveal><Desk film={film} slug={slug} lang={lang} video={video}/></Reveal>
    <div className="brand-motion-film-note"><span>{en?'The edit: beats, headlines, shots and measured motion.':'剪辑台：段落、字幕、镜头和量出来的运动曲线。'}</span><span className="fc-links"><a href={caseHref} onClick={go(caseHref)}>{film.caseName[lang]} →</a><a href={src} target="_blank" rel="noopener noreferrer">{en?'Open video':'单独打开视频'} ↗</a></span></div>
   </section>

   <section className="st-section" aria-labelledby="fc-cut">
    <SectionHead index={`05 / ${en?'FIRST CUT → FINAL':'第一版 → 终版'}`} title={<span id="fc-cut">{en?'From slide deck to film':'从幻灯片到片子'}</span>} lead={film.firstCutText[lang]}/>
    <BeforeAfter pairs={film.firstCut} media={media} lang={lang} reduced={reduced}/>
    <Reveal as="ul" className="st-chips st-chips-gap">{RESEARCH_FILMS.map(name=><li key={name}>{name}</li>)}</Reveal>
   </section>

   <section className="st-section" aria-labelledby="fc-craft">
    <SectionHead index={`06 / ${en?'CRAFT':'技术'}`} title={<span id="fc-craft">{en?'Smooth, frame by frame':'一帧一帧地顺下来'}</span>} lead={film.smoothText[lang]}/>
    <ul className="st-stats">
     <Reveal as="li"><b>{shots}</b><span>{en?`shots, ${film.cuts.length} hard cuts on exact frames`:`个镜头，${film.cuts.length} 个硬切，都落在整帧上`}</span></Reveal>
     <Reveal as="li" delay={80}><b>60</b><span>{en?'fps, so slow moves never step':'帧每秒，慢速运动不会一格一格'}</span></Reveal>
     <Reveal as="li" delay={160}><b>16</b><span>{en?'shutter samples of motion blur in every frame':'个快门采样，合成每一帧的运动模糊'}</span></Reveal>
     <Reveal as="li" delay={240}><b>{film.scores[0]}→{film.scores[film.scores.length-1]}</b><span>{en?'independent review score over six rounds':'六轮独立评审的分数变化'}</span></Reveal>
    </ul>
    <Reveal as="figure" className="st-chart">
     <svg viewBox="0 0 600 100" preserveAspectRatio="none" role="img" aria-label={en?'Frame-to-frame picture change across the film':'全片逐帧的画面变化量'}>
      {film.cuts.map(c=><line key={c} x1={c/DUR*600} x2={c/DUR*600} y1="0" y2="100"/>)}
      <path d={'M'+film.motion.map((v,i)=>((i+.5)*4/FPS/DUR*600).toFixed(1)+','+(100-v/Math.max(...film.motion)*92).toFixed(2)).join('L')}/>
     </svg>
     <figcaption>{en?'Picture change from frame to frame, measured from the file on this page. Dashed: the cuts.':'从本页播放的文件量出来的逐帧画面变化。虚线是剪辑点。'}</figcaption>
    </Reveal>
    <ol className="st-notes">{film.notes.map((n,i)=><Reveal as="li" key={i} delay={i*80}><span>{en?'REVIEW NOTE':'评审意见'} 0{i+1}</span><p>{n.note[lang]}</p><span>{en?'WHAT CHANGED':'怎么改的'}</span><p>{n.fix[lang]}</p></Reveal>)}</ol>
   </section>

   <NextProject item={nextAfter(slug)} lang={lang} onNavigate={onNavigate}/>
   <footer className="st-footer"><span>JAY LIN / {film.name.toUpperCase()}</span><p>{en?'A product concept by Jay Lin.':'林世杰的产品概念。'}</p></footer>
  </div>
 </article>;
}
