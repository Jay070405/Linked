import {useEffect,useRef,useState} from 'react';
import '../brand-motion.css';
import '../hako-film.css';
import '../film-case.css';

// The edit desk shared by the product-film pages: the silent film above its own timeline (beats, headlines, shots as a
// filmstrip, the frame-to-frame motion measured from the file), clickable, draggable and steppable with the arrow keys.
export const FPS=60;
const clock=t=>{const f=Math.round(t*FPS),s=Math.floor(f/FPS);return '00:00:'+String(s).padStart(2,'0')+':'+String(f%FPS).padStart(2,'0');};

/** The edit: the film above its own timeline (beats, headlines, shots, measured motion), clickable and draggable. */
export function Desk({film,slug,lang,video}){
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
