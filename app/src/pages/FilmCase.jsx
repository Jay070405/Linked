import {useEffect,useRef,useState} from 'react';
import {FILMS,FILM_ORDER} from './product-films-data';
import './brand-motion.css';
import './hako-film.css';
import './film-case.css';

// One page per product launch film. Like Hako's, each plays above its own edit (beats, headlines, shots, and the
// frame-to-frame motion measured from the file itself, since the films are silent), then shows how it was made from
// the film project's own record (aigc-vibecoding/product-films: RESEARCH.md, README, the first cuts, six review rounds).
const FPS=60;
const clock=t=>{const f=Math.round(t*FPS),s=Math.floor(f/FPS);return '00:00:'+String(s).padStart(2,'0')+':'+String(f%FPS).padStart(2,'0');};
const sec=t=>'00:'+t.toFixed(1).padStart(4,'0');
// the first cuts as measured in RESEARCH.md §二: seconds, seconds nearly the same as the second before, big changes
const RESEARCH_FILMS=['Apple Creator Studio','Notion Mail','Figma Motion','Figma Config 2025','Linear Agent','Raycast','Dia','Notion AI','iOS 26 Liquid Glass'];

export default function FilmCase({lang,reduced,onNavigate,slug}){
 const film=FILMS[slug],en=lang==='en',DUR=film.duration,media='/assets/other-project/'+slug,src='/video/'+film.stem+'-film.mp4';
 const pos=t=>t/DUR*100+'%',span=(a,b)=>({left:pos(a),width:(b-a)/DUR*100+'%'});
 const shots=[0,...film.cuts,DUR];
 const video=useRef(null),lanes=useRef(null),scroller=useRef(null),strip=useRef(null),head=useRef(null),tc=useRef(null);
 const beatRef=useRef(0),dragging=useRef(false),paintRef=useRef(null);
 const [beat,setBeat]=useState(0),[failed,setFailed]=useState(false);
 const go=to=>event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();onNavigate(to);
 };
 useEffect(()=>{beatRef.current=0;setBeat(0);setFailed(false);},[slug]);
 // the playhead, timecode and inspector follow the video; while it plays they repaint every frame
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
 const jump=t=>{seek(t);video.current.play().catch(()=>{});video.current.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});};
 const motionMax=Math.max(...film.motion),step=4/FPS;
 const motionD='M'+film.motion.map((v,i)=>((i+.5)*step).toFixed(3)+','+(1-v/motionMax*.92).toFixed(3)).join('L');
 const chartD='M'+film.motion.map((v,i)=>((i+.5)*step/DUR*600).toFixed(1)+','+(100-v/motionMax*92).toFixed(2)).join('L');
 const current=film.beats[beat]||film.beats[0];
 const others=FILM_ORDER.filter(s=>s!==slug&&FILMS[s]);
 const caseHref='/product/'+film.caseSlug;
 return <article className="brand-motion-page hk-page fc-page" data-nav-tone="light" style={{'--fc-accent':film.accent}}>
  <header className="brand-motion-heading">
   <div className="brand-motion-kicker"><a href="/other-project" onClick={go('/other-project')}>← Other Project</a><span>PRODUCT / LAUNCH FILM</span></div>
   <div className="brand-motion-title"><h1 lang="en">{film.name}</h1><p>{film.tagline[0]} <i>{film.tagline[1]}</i></p></div>
   <div className="brand-motion-intro"><span>{en?'PRODUCT LAUNCH FILM':'产品宣传片'}</span><p>{film.intro[lang]}</p></div>
  </header>

  <section className="brand-motion-films hk-cut" aria-labelledby="fc-cut">
   <div className="brand-motion-film">
    <header><span className="brand-motion-number">01 /</span><div><h2 id="fc-cut">{en?'The final cut, on its timeline':'成片，摊开在时间线上'}</h2><p>{en?`The film plays above its own edit: ${shots.length-1} shots, ${film.beats.length} beats and every headline. The film is silent, so the bottom track shows how much the picture changes from frame to frame instead; the spikes in it are the cuts. Click or drag the timeline to jump.`:`成片放在它自己的剪辑时间线上方：${shots.length-1} 个镜头、${film.beats.length} 个段落和每一行标题。片子没有声音，所以最下面一条轨道显示的是逐帧的画面变化量，竖起来的尖峰就是剪辑点。点击或拖动时间线可以跳转。`}</p></div><span className="brand-motion-duration">00:{String(Math.round(DUR)).padStart(2,'0')}</span></header>
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
     <ul className="hk-legend"><li><i className="fc-key-motion"/>{en?'Picture change per frame':'逐帧画面变化'}</li><li><i className="fc-key-cut"/>{en?'Hard cuts':'硬切'} <span>{film.cuts.length}</span></li><li className="hk-legend-grid">{en?'Lines: half seconds':'竖线：每半秒'}</li></ul>
    </div>
    {failed&&<p className="brand-motion-error" role="alert">{en?'The video could not load. Try opening it directly below.':'视频暂时未能加载，请通过下方链接直接打开。'}</p>}
    <div className="brand-motion-film-note"><span>1920 × 1080 / 60 FPS / {en?'NO SOUND':'无声'}</span><span className="fc-links">
     <a href={caseHref} onClick={go(caseHref)}>{film.caseName[lang]} →</a>
     <a href={src} target="_blank" rel="noopener noreferrer">{en?'Open video':'单独打开视频'} ↗</a>
    </span></div>
   </div>
  </section>

  <section className="hk-process" aria-labelledby="fc-process">
   <header className="hk-process-head"><h2 id="fc-process">{en?'How it was made':'制作过程'}</h2><span>04 / {en?'STEPS':'步骤'}</span></header>

   <div className="hk-step hk-step-wide">
    <div className="hk-step-text"><span>01</span><h3>{en?'The first cut read like a slide deck':'第一版像一份幻灯片'}</h3>
     <p>{film.firstCutText[lang]}</p>
     <ul className="hk-specs">{RESEARCH_FILMS.map(name=><li key={name}>{name}</li>)}</ul></div>
    <ol className="fc-pairs">{film.firstCut.map((pair,i)=><li key={i}>
     <figure><img src={`${media}/v1-${i+1}.webp`} width="960" height="540" loading="lazy" decoding="async" alt={(en?'First cut: ':'第一版：')+pair.caption[lang]}/><figcaption>{en?'FIRST CUT':'第一版'}</figcaption></figure>
     <figure><img src={`${media}/final-${i+1}.webp`} width="960" height="540" loading="lazy" decoding="async" alt={(en?'Final: ':'终版：')+pair.caption[lang]}/><figcaption>{en?'FINAL':'终版'} · {sec(pair.final)}</figcaption></figure>
     <p>{pair.caption[lang]}</p>
    </li>)}</ol>
   </div>

   <div className="hk-step hk-step-wide">
    <div className="hk-step-text"><span>02</span><h3>{en?'One line, acted out':'把一句话演出来'}</h3>
     <p>{film.signatureText[lang]}</p></div>
    <ol className="hk-motif">{film.signature.map((m,i)=><li key={m.t}><button type="button" onClick={()=>jump(m.t)} aria-label={(en?'Play from ':'从这里播放：')+sec(m.t)+' · '+m.label[lang]}>
     <img src={`${media}/sig-${i+1}.webp`} width="1600" height="900" loading="lazy" decoding="async" alt=""/>
     <span><b>0{i+1}</b>{m.label[lang]}<em>▶ {sec(m.t)}</em></span>
    </button></li>)}</ol>
   </div>

   <div className="hk-step hk-step-wide">
    <div className="hk-step-text"><span>03</span><h3>{en?'Smooth, frame by frame':'一帧一帧地顺下来'}</h3>
     <p>{film.smoothText[lang]}</p>
     <ul className="hk-specs"><li>60 FPS</li><li>{en?'16-sample motion blur':'16 次采样运动模糊'}</li><li>{en?'Moves placed by transform, not left/top':'用 transform 定位，不用 left/top'}</li><li>{en?'Speed changes only on a cut':'只在剪辑点换速度'}</li></ul></div>
    <figure className="hk-chart">
     <svg viewBox="0 0 600 100" preserveAspectRatio="none" role="img" aria-label={en?'Frame-to-frame picture change across the film':'全片逐帧的画面变化量'}>
      {film.cuts.map(c=><line key={c} className="hk-chart-cut" x1={c/DUR*600} x2={c/DUR*600} y1="0" y2="100"/>)}
      <path d={chartD}/>
     </svg>
     <div className="hk-chart-axis" aria-hidden="true">{Array.from({length:Math.floor(DUR/5)+1},(_,i)=><span key={i} style={{left:i*5/DUR*100+'%'}}>{i*5}s</span>)}</div>
     <figcaption>{en?'Measured from the file on this page: the mean change between each frame and the one before, 64 × 36 greyscale. Dashed lines are the cuts.':'从本页播放的文件量出来：每一帧和上一帧的平均差（64 × 36 灰度）。虚线是剪辑点。'}</figcaption>
    </figure>
   </div>

   <div className="hk-step hk-step-wide">
    <div className="hk-step-text"><span>04</span><h3>{en?'Six rounds of review':'六轮审片'}</h3>
     <p>{en?'Each round went to a separate reviewer that changed nothing and scored the film out of 100: motion 30, craft 30, story 25, finish 15. Its notes became rules for the next round. Three of the notes on this film, and what changed.':'每一轮都交给一个不改文件的独立评审打分，满分 100：动效 30、工艺 30、叙事 25、完成度 15。它的意见变成下一轮的规则。下面是针对这支片子的三条意见，以及怎么改的。'}</p></div>
    <ol className="fc-scores" aria-label={en?'Review scores by round':'各轮评审分数'}>{film.scores.map((s,i)=><li key={i} style={{'--h':(s-50)/50}}><b>{s}</b><i/><span>{en?`R${i+1}`:`第${i+1}轮`}</span></li>)}</ol>
    <ol className="hk-notes">{film.notes.map((n,i)=><li key={i}><span>{en?'NOTE':'意见'} 0{i+1}</span><p>{n.note[lang]}</p><span>{en?'FIX':'修改'}</span><p>{n.fix[lang]}</p></li>)}</ol>
   </div>
  </section>

  <nav className="fc-more" aria-label={en?'More launch films':'更多宣传片'}>
   <span>{en?'MORE LAUNCH FILMS':'更多宣传片'}</span>
   <ul>{others.map(s=>{const f=FILMS[s],href='/other-project/'+s;return <li key={s}><a href={href} onClick={go(href)}><img src={`/assets/other-project/${s}/cover.webp`} width="1274" height="1080" loading="lazy" decoding="async" alt=""/><span lang="en">{f.name}</span><small>{f.tagline.join(' ')}</small></a></li>;})}</ul>
  </nav>
  <footer className="brand-motion-footer"><span>JAY LIN / {film.name.toUpperCase()}</span><p>{en?'A product concept by Jay Lin.':'林世杰的产品概念。'}</p></footer>
 </article>;
}
