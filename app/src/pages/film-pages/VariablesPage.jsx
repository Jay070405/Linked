import {memo,useCallback,useEffect,useId,useMemo,useRef,useState} from 'react';
import {FILMS,nextAfter} from '../product-films-data';
import {NextProject,Reveal,useInView} from '../story/Story';
import {Desk as FilmDesk} from '../story/FilmDesk';
import * as CAM from '../films/variables-camera';
import './variables-page.css';

// How the Variables for agents film was made, drawn as a set of technical sheets on white drafting paper in the film's
// blue. Its spine is the camera path: for its first 20.4 s the film has no cut, and from 6.9 s one monotone spline flies
// the camera through twelve framings of the file. Every curve here is computed in the browser from the film's own keys
// (films/variables-camera.js, copied from aigc-vibecoding/product-films/src/films/VariablesForAgents2.tsx); the frames
// are the site's own file (public/video/d1-ready-for-agents-film.mp4). The product has its own case under /product.
const Desk=memo(FilmDesk);
const MEDIA='/assets/other-project/variables-for-agents';
const T0=6.9,T1=20.4,SPAN=T1-T0;
const {clamp}=CAM;

const tc=t=>{const f=Math.round(t*60),s=Math.floor(f/60);return '00:00:'+String(s).padStart(2,'0')+':'+String(f%60).padStart(2,'0');};
const num=(n,d=0)=>n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const pad2=n=>String(n).padStart(2,'0');
const scrollerOf=el=>el?.closest('.portfolio-page-viewport')||document.scrollingElement;
const keyIndex=t=>{let i=0;while(i<CAM.KEYS.length-2&&t>=CAM.KEYS[i+1].t)i++;return i;};
const stageAt=t=>[...CAM.STAGES].reverse().find(s=>t>=s.at)||CAM.STAGES[0];

/* ---------- the file drawing: camera footprints over the file, in the file's own pixels ---------- */

const VB={x:-330,y:-285,w:2150,h:1275};
const px=x=>(x-VB.x)/VB.w*100+'%',py=y=>(y-VB.y)/VB.h*100+'%';
const pts=q=>q&&q.every(Boolean)?q.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' '):'';
// the film's frames along the path, every 0.1 s from 6.9 s, plus its last frame before the cut (frame 1223)
const SEQ=136,seqTime=i=>i<135?T0+i/10:1223/60;
const seqAt=t=>{
 if(t>=seqTime(134))return [134,135,clamp((t-seqTime(134))/(seqTime(135)-seqTime(134)))];
 const f=clamp((t-T0)*10,0,134),a=Math.floor(f+1e-6);return [a,a+1,f-a];
};
const seqSrc=i=>`${MEDIA}/path/${String(i).padStart(3,'0')}.webp`;

let planCache=null;
/** Everything static about the drawing, computed once from the keys. */
function plan(){
 if(planCache)return planCache;
 const centre=t=>CAM.unproject(CAM.winAt(t),960,540);
 const path=[];for(let f=Math.round(T0*60);f<=T1*60;f++)path.push(centre(f/60));
 const dots=Array.from({length:SEQ},(_,i)=>centre(Math.min(seqTime(i),T1)));
 const keys=CAM.KEYS.map((k,i)=>({...k,i,c:CAM.unproject(k.w,960,540),q:i?CAM.footprint(k.w):null}));
 const entry=path.find(p=>p&&p[1]>VB.y+40);
 planCache={path:'M'+path.filter(Boolean).map(p=>p[0].toFixed(1)+' '+p[1].toFixed(1)).join('L'),dots,keys,entry};
 return planCache;
}

function Plan({P,mini,liveRef,altRef,headRef,dotRefs,keyRefs}){
 const clip=useId().replace(/:/g,'');
 return <svg className="vf-plan-svg" viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
  <defs><clipPath id={clip}><rect x={VB.x+12} y={VB.y+12} width={VB.w-24} height={VB.h-24}/></clipPath></defs>
  {/* dimension lines, with the architect's slash at each end */}
  {!mini&&<g className="vf-dim">
   <path d="M0 -130V-205M1440 -130V-205M-30 -168H1470M-14 -154L14 -182M1426 -154L1454 -182"/>
   <path d="M-130 -40H-205M-130 900H-205M-168 -70V930M-182 -26L-154 -54M-182 914L-154 886"/>
  </g>}
  <g clipPath={`url(#${clip})`}>
   {/* the file: the 1440 x 900 page under the window's 40 px bar */}
   <rect className="vf-file" x="0" y="-40" width="1440" height="940"/>
   <path className="vf-file-bar" d="M0 0H1440"/>
   {CAM.REGIONS.map(r=><rect key={r.id} className="vf-region" x={r.x} y={r.y} width={r.w} height={r.h}/>)}
   {/* every framing's footprint, faint; the pair being flown between is drawn stronger */}
   {P.keys.map((k,i)=>k.q&&<polygon key={i} ref={keyRefs?el=>{keyRefs.current[i]=el;}:undefined} className="vf-kq" points={pts(k.q)}/>)}
   <path className="vf-path" d={P.path}/>
   {!mini&&P.dots.map((d,i)=>d&&<circle key={i} ref={dotRefs?el=>{dotRefs.current[i]=el;}:undefined} className="vf-dot" cx={d[0].toFixed(1)} cy={d[1].toFixed(1)} r="7"/>)}
   {P.keys.map((k,i)=>k.c&&i>0&&<path key={i} className="vf-node" d={`M${k.c[0].toFixed(1)} ${(k.c[1]-15).toFixed(1)}l15 15l-15 15l-15 -15z`}/>)}
   {altRef&&<polygon ref={altRef} className="vf-cam is-alt"/>}
   <polygon ref={liveRef} className="vf-cam"/>
   {headRef&&<g ref={headRef} className="vf-head"><circle r="15"/><path d="M-34 0H-19M19 0H34M0 -34V-19M0 19V34"/></g>}
  </g>
  <rect className="vf-plan-border" x={VB.x+12} y={VB.y+12} width={VB.w-24} height={VB.h-24}/>
 </svg>;
}

/** Fits a box of the drawing's aspect inside its parent and reports its pixel size (for labels that follow points). */
function usePlane(box,plane,onSize){
 const cb=useRef(onSize);cb.current=onSize;
 useEffect(()=>{
  const el=box.current;if(!el)return undefined;
  const fit=()=>{
   const W=el.clientWidth,H=el.clientHeight,a=VB.w/VB.h;let w=W,h=W/a;if(h>H){h=H;w=H*a;}
   if(plane.current){plane.current.style.width=w+'px';plane.current.style.height=h+'px';}
   cb.current?.(w,h);
  };
  fit();const ro=new ResizeObserver(fit);ro.observe(el);return()=>ro.disconnect();
 },[box,plane]);
}

/* ---------- sheet 1: the path, flown by scrolling ---------- */

function PathPlot({film,lang,reduced,onWatch,onSkip}){
 const en=lang==='en',L=en?'en':'zh',P=useMemo(plan,[]);
 const sec=useRef(null),box=useRef(null),plane=useRef(null),mon=useRef(null),canvas=useRef(null),ruler=useRef(null),range=useRef(null);
 const live=useRef(null),head=useRef(null),dotRefs=useRef([]),keyRefs=useRef([]),tag=useRef(null),rhead=useRef(null);
 const r={t:useRef(null),tc:useRef(null),key:useRef(null),keyT:useRef(null),x:useRef(null),s:useRef(null),tilt:useRef(null),screen:useRef(null),speed:useRef(null),bar:useRef(null),cut:useRef(null),klabels:useRef([])};
 const imgs=useRef([]),size=useRef({w:0,h:0,rw:0}),last=useRef({dot:-1,key:-1,stage:''}),tRef=useRef(T0);
 const [rt,setRt]=useState(T0);

 const drawMonitor=useCallback(t=>{
  const c=canvas.current;if(!c||!c.width)return;
  const g=c.getContext('2d'),[a,b,k]=seqAt(t),im=imgs.current;
  const near=i=>{for(let d=0;d<SEQ;d++){if(im[i-d])return im[i-d];if(im[i+d])return im[i+d];}return null;};
  const A=im[a]||near(a);if(!A)return;
  g.globalAlpha=1;g.drawImage(A,0,0,c.width,c.height);
  if(k>.02&&im[b]&&im[a]){g.globalAlpha=k;g.drawImage(im[b],0,0,c.width,c.height);g.globalAlpha=1;}
 },[]);

 const paint=useCallback(t=>{
  tRef.current=t;
  const w=CAM.winAt(t),q=CAM.footprint(w),c=CAM.unproject(w,960,540);
  live.current?.setAttribute('points',pts(q));
  if(head.current&&c)head.current.setAttribute('transform',`translate(${c[0].toFixed(1)} ${c[1].toFixed(1)})`);
  // dots already flown past turn solid
  const di=Math.floor(clamp((t-T0)*10,0,135)+1e-6);
  if(di!==last.current.dot){const was=last.current.dot,lo=Math.min(was,di)+1,hi=Math.max(was,di);for(let i=Math.max(0,lo);i<=hi;i++)dotRefs.current[i]?.classList.toggle('is-past',i<=di);if(was<0)dotRefs.current[0]?.classList.add('is-past');last.current.dot=di;}
  const ki=keyIndex(t);
  if(ki!==last.current.key){
   keyRefs.current.forEach((p,i)=>{if(!p)return;p.classList.toggle('is-from',i===ki);p.classList.toggle('is-to',i===ki+1);});
   r.klabels.current.forEach((el,i)=>el&&el.classList.toggle('is-on',i===ki||i===ki+1));
   last.current.key=ki;
  }
  // the CAM tag rides the footprint's top edge, kept on the sheet
  const {w:pw,h:ph}=size.current;
  if(tag.current&&pw&&q.every(Boolean)){
   const top=q.slice(0,2),mx=(top[0][0]+top[1][0])/2,my=(top[0][1]+top[1][1])/2;
   const x=clamp((mx-VB.x)/VB.w,.04,.86)*pw,y=clamp((my-VB.y)/VB.h,.05,.93)*ph;
   tag.current.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
  }
  const speed=CAM.pictureSpeed(CAM.winAt,clamp(t,T0+1e-3,T1-1e-3)),st=stageAt(t);
  const K=CAM.KEYS;
  if(r.t.current)r.t.current.textContent=t.toFixed(2)+' s';
  if(r.tc.current)r.tc.current.textContent=tc(Math.min(t,1223/60));
  if(r.key.current)r.key.current.textContent=`K${pad2(ki+1)} → K${pad2(ki+2)}`;
  if(r.keyT.current)r.keyT.current.textContent=`${K[ki].t.toFixed(1)}–${K[ki+1].t.toFixed(1)} s`;
  if(r.x.current)r.x.current.textContent=`x ${num(w.x)}  y ${num(w.y)}  ·  ${w.s.toFixed(2)}×`;
  if(r.tilt.current)r.tilt.current.textContent=`${w.rx.toFixed(1)}°  /  ${w.ry.toFixed(1)}°`;
  if(r.screen.current&&last.current.stage!==st.src+L){r.screen.current.textContent=st.name[L];last.current.stage=st.src+L;}
  if(r.speed.current)r.speed.current.textContent=num(speed)+' px/s';
  if(r.bar.current)r.bar.current.style.transform=`scaleX(${clamp(Math.log10(1+speed)/Math.log10(5001)).toFixed(4)})`;
  if(r.cut.current)r.cut.current.classList.toggle('is-on',t>=1222/60);
  if(rhead.current&&size.current.rw)rhead.current.style.transform=`translate3d(${((t-T0)/SPAN*size.current.rw).toFixed(1)}px,0,0)`;
  if(range.current)range.current.value=t.toFixed(2);
  range.current?.setAttribute('aria-valuetext',en?`${t.toFixed(1)} seconds, between keyframes ${ki+1} and ${ki+2}`:`${t.toFixed(1)} 秒，第 ${ki+1} 和第 ${ki+2} 个关键帧之间`);
  drawMonitor(t);
 },[drawMonitor,en,L]);

 usePlane(box,plane,(w,h)=>{size.current.w=w;size.current.h=h;paint(tRef.current);});

 // the monitor's canvas follows its box; the ruler's width places the playhead
 useEffect(()=>{
  const ro=new ResizeObserver(()=>{
   const m=mon.current,c=canvas.current;if(m&&c){const d=Math.min(2,devicePixelRatio||1);c.width=Math.round(m.clientWidth*d);c.height=Math.round(m.clientWidth*9/16*d);}
   if(ruler.current)size.current.rw=ruler.current.clientWidth;
   paint(tRef.current);
  });
  if(mon.current)ro.observe(mon.current);if(ruler.current)ro.observe(ruler.current);
  return()=>ro.disconnect();
 },[paint]);

 // the film's frames: the twelve framings first, then the rest, four at a time
 useEffect(()=>{
  let dead=false,i=0;
  const keyFrames=CAM.KEYS.map(k=>Math.min(135,Math.round((k.t-T0)*10)));
  const order=[...new Set([0,...keyFrames,...Array.from({length:SEQ},(_,j)=>j)])];
  const next=()=>{
   if(dead||i>=order.length)return;
   const k=order[i++],im=new Image();im.decoding='async';im.src=seqSrc(k);
   im.decode().then(()=>{if(dead)return;imgs.current[k]=im;const [a,b]=seqAt(tRef.current);if(Math.abs(k-a)<=12||k===b)drawMonitor(tRef.current);}).catch(()=>{}).finally(next);
  };
  for(let n=0;n<4;n++)next();
  return()=>{dead=true;};
 },[drawMonitor]);

 // scroll flies the camera: the pinned sheet's progress is film time
 useEffect(()=>{
  if(reduced){paint(rt);return undefined;}
  const el=sec.current,sc=scrollerOf(el),target=sc===document.scrollingElement?window:sc;let raf=0;
  const measure=()=>{raf=0;const total=el.offsetHeight-sc.clientHeight;if(total<=0)return;const p=clamp(-el.getBoundingClientRect().top/total);paint(T0+SPAN*clamp((p-.03)/.94));};
  const queue=()=>{if(!raf)raf=requestAnimationFrame(measure);};
  measure();target.addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);
  return()=>{cancelAnimationFrame(raf);target.removeEventListener('scroll',queue);removeEventListener('resize',queue);};
 },[reduced,paint,rt]);

 const seek=(t,smooth)=>{
  t=clamp(t,T0,T1);
  if(reduced){setRt(t);paint(t);return;}
  const el=sec.current,sc=scrollerOf(el),total=el.offsetHeight-sc.clientHeight,p=.03+.94*(t-T0)/SPAN;
  sc.scrollTo({top:sc.scrollTop+el.getBoundingClientRect().top+p*total,behavior:smooth?'smooth':'auto'});
 };
 const jump=dir=>{
  const t=tRef.current,K=CAM.KEYS.map(k=>k.t);
  const to=dir>0?K.find(k=>k>t+.02):[...K].reverse().find(k=>k<t-.02);
  if(to!==undefined)seek(to,true);
 };
 const rp=t=>(t-T0)/SPAN*100+'%';

 return <section ref={sec} className={'vf-plot'+(reduced?' is-still':'')} aria-labelledby="vf-title">
  <div className="vf-stage">
   <div className="vf-sheet vf-stage-in">
    <Zones/>
    <header className="vf-hero">
     <p className="vf-kicker"><a href="/other-project" data-nav>← {en?'Other Project':'其他项目'}</a><span>{en?'How the film was made':'片子是怎么做的'}</span><button type="button" className="vf-skip-m" onClick={onSkip}>{en?'Skip ahead':'跳过'} ↓</button></p>
     <h1 id="vf-title">{film.name}</h1>
     <p className="vf-deck">{en?'The film has no cut for its first 20.4 seconds.':'片子前 20.4 秒没有剪辑点。'} <span className="vf-deck-more">{en?'From 6.9 s the camera follows one path through twelve framings of the file, and the screens change while the window moves.':'从 6.9 秒开始，镜头沿一条路径经过文件的 12 个构图，界面在移动的窗口里切换。'}</span> <b className="vf-hint-scroll">{reduced?(en?'Drag the ruler to move the camera along its path.':'拖动下方的标尺，镜头就沿路径移动。'):(en?'Scroll to move the camera along its path.':'往下滚动，镜头就沿路径移动。')}</b></p>
     <div className="vf-actions">
      <button type="button" className="vf-btn is-primary" onClick={onWatch}>▶ {en?'Watch the film':'看片子'}</button>
      <button type="button" className="vf-btn" onClick={onSkip}>{en?'Skip ahead':'跳过这段'} ↓</button>
     </div>
    </header>
    <figure className="vf-draw">
     <div className="vf-draw-box" ref={box}><div className="vf-plane" ref={plane}>
      <Plan P={P} liveRef={live} headRef={head} dotRefs={dotRefs} keyRefs={keyRefs}/>
      <span className="vf-lab is-file" style={{left:px(0),top:py(-40)}}>{en?'FILE 1440 × 900':'文件 1440 × 900'}</span>
      <span className="vf-lab is-dim" style={{left:px(720),top:py(-168)}}>1440</span>
      <span className="vf-lab is-dim is-v" style={{left:px(-168),top:py(430)}}>900 + 40</span>
      {CAM.REGIONS.map(g=><span key={g.id} className="vf-lab is-region" style={{left:px(g.x),top:py(g.place==='above'?g.y:g.y+g.h)}} data-place={g.place}>{g.label[L]}</span>)}
      {P.entry&&<span className="vf-lab is-entry" style={{left:px(P.entry[0]),top:py(VB.y+20)}}>{en?'K01 · 6.9 s · the file enters from below ↓':'K01 · 6.9 秒 · 文件从下方进入 ↓'}</span>}
      {P.keys.map((k,i)=>k.c&&i>0&&<span key={i} ref={el=>{r.klabels.current[i]=el;}} className={'vf-lab is-key'+(i%2?' is-alt':'')} style={{left:px(k.c[0]),top:py(k.c[1])}}>K{pad2(i+1)} · {k.t.toFixed(1)} s</span>)}
      <span ref={tag} className="vf-tag" aria-hidden="true"><b>{en?'CAMERA':'镜头'}</b></span>
     </div></div>
     <figcaption className="vf-legend">
      <span><i className="is-cam"/>{en?'Frame outline, projected onto the tilted file':'画面边框，投影到倾斜的文件上'}</span>
      <span><i className="is-dot"/>{en?'Frame centre, a dot every 0.1 s':'画面中心，每 0.1 秒一个点'}</span>
      <span><i className="is-key"/>{en?'Keyframes (12)':'关键帧（12 个）'}</span>
      <span><i className="is-swap"/>{en?'Screen changes, marked on the ruler':'界面切换，标在标尺上'}</span>
     </figcaption>
    </figure>
    <div className="vf-side">
    <figure className="vf-mon" ref={mon}>
     <canvas ref={canvas} role="img" aria-label={en?'Film frame at the current time':'当前时间的片中画面'}/>
     <span className="vf-mon-k">{en?'VIEW A · FILM FRAME':'视图 A · 片中画面'}</span>
     <span ref={r.tc} className="vf-mon-tc">00:00:06:54</span>
     <span className="vf-mon-scr"><em>{en?'Screen':'界面'}</em><span ref={r.screen}/></span>
     <button type="button" className="vf-mon-play" onClick={onWatch}>▶ {en?'Watch the film':'看片子'}</button>
     <span ref={r.cut} className="vf-mon-cut">{en?'Cut at 20.4 s →':'20.4 秒剪辑点 →'}</span>
    </figure>
    <dl className="vf-read" aria-live="off">
     <div><dt>{en?'Time':'时间'}</dt><dd ref={r.t}>6.90 s</dd></div>
     <div><dt>{en?'Keyframes':'关键帧'}</dt><dd><span ref={r.key}>K01 → K02</span><span ref={r.keyT} className="vf-read-sub"/></dd></div>
     <div><dt>{en?'Window':'窗口'}</dt><dd ref={r.x}/></div>
     <div><dt>{en?'Tilt x / y':'倾斜 x / y'}</dt><dd ref={r.tilt}/></div>
     <div className="is-wide"><dt>{en?'Picture speed':'画面速度'}</dt><dd><span ref={r.speed}/><span className="vf-read-bar"><i ref={r.bar}/></span></dd></div>
    </dl>
    <TitleBlock lang={lang}/>
    </div>
    <div className="vf-ruler">
     <button type="button" className="vf-step" onClick={()=>jump(-1)} aria-label={en?'Previous keyframe':'上一个关键帧'}>‹</button>
     <div className="vf-rtrack" ref={ruler}>
      {Array.from({length:28},(_,i)=>7+i*.5).filter(t=>t<=20.4).map(t=><span key={t} className={'vf-rt'+(t%1===0?' is-s':'')} style={{left:rp(t)}}>{t%2===0&&t<20?<em>{t}</em>:null}</span>)}
      {CAM.KEYS.map((k,i)=><span key={i} className="vf-rk" style={{left:rp(k.t)}}><b>{i+1}</b></span>)}
      {CAM.STAGES.slice(1).map(s=><span key={s.at} className="vf-rs" style={{left:rp(s.at)}} title={s.name[L]}/>)}
      <span className="vf-rcut" aria-hidden="true">{en?'CUT':'剪'}</span>
      <span ref={rhead} className="vf-rhead" aria-hidden="true"/>
      <input ref={range} type="range" min={T0} max={T1} step=".01" defaultValue={T0}
       aria-label={en?'Film time, 6.9 to 20.4 s':'片中时间，6.9 到 20.4 秒'} onChange={e=>seek(+e.target.value,false)}
       onKeyDown={e=>{const d={ArrowRight:.1,ArrowUp:.1,ArrowLeft:-.1,ArrowDown:-.1}[e.key];if(d!==undefined){e.preventDefault();seek(tRef.current+(e.shiftKey?Math.sign(d)/60:d),false);}else if(e.key==='PageDown'){e.preventDefault();jump(1);}else if(e.key==='PageUp'){e.preventDefault();jump(-1);}}}/>
     </div>
     <button type="button" className="vf-step" onClick={()=>jump(1)} aria-label={en?'Next keyframe':'下一个关键帧'}>›</button>
    </div>
   </div>
  </div>
  {reduced&&<KeyFrames lang={lang}/>}
 </section>;
}

function Zones(){
 return <div className="vf-zones" aria-hidden="true">
  <span className="is-top">{['A','B','C','D','E','F'].map(z=><i key={z}>{z}</i>)}</span>
  <span className="is-side">{[1,2,3,4].map(z=><i key={z}>{z}</i>)}</span>
 </div>;
}

function TitleBlock({lang}){
 const en=lang==='en';
 const rows=[
  [en?'Length':'时长','29.4 s'],[en?'Frame':'画幅','1920 × 1080'],[en?'Rate':'帧率','60 fps'],
  [en?'Shutter':'快门',en?'16 samples, 180°':'16 次采样，180°'],[en?'Cuts':'剪辑点','20.4 · 24 · 27.4 s'],
  [en?'Built in':'制作','Remotion · React'],
 ];
 return <dl className="vf-tb">{rows.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}<div className="is-sheet"><dt>{en?'Sheet':'图纸'}</dt><dd>01 / 06</dd></div></dl>;
}

/** Without the scroll flight, the twelve framings as stills. */
function KeyFrames({lang}){
 const en=lang==='en';
 return <ol className="vf-keyframes" aria-label={en?'The twelve keyframes':'12 个关键帧'}>{CAM.KEYS.map((k,i)=>{
  const idx=i===CAM.KEYS.length-1?135:Math.round((k.t-T0)*10);
  return <li key={i}><img src={seqSrc(idx)} width="640" height="360" alt="" loading="lazy" decoding="async"/><span>K{pad2(i+1)} · {k.t.toFixed(1)} s</span></li>;
 })}</ol>;
}

/** Mounts its children only once they come within a screen or so of view, so the page opens without their maths. */
function Near({min,children}){
 const ref=useRef(null),near=useInView(ref,{threshold:0,margin:"900px 0px"});
 return <div ref={ref} style={near?undefined:{minHeight:min}}>{near?children:null}</div>;
}

/* ---------- the shared sheet frame ---------- */

function Sheet({id,n,title,kicker,lead,children,className=''}){
 return <section id={id} className={'vf-sheet vf-block '+className} aria-labelledby={id+'-h'} tabIndex={-1}>
  <Zones/>
  <Reveal as="header" className="vf-head">
   <p className="vf-k"><span>{pad2(n)}</span>{kicker}</p>
   <h2 id={id+'-h'}>{title}</h2>
   {lead&&<div className="vf-lead">{lead}</div>}
  </Reveal>
  {children}
 </section>;
}

/* ---------- sheet 2: speed, from the keys ---------- */

const ALTS={
 eased:{f:CAM.easedAt,name:{en:'Ease to a stop at each key',zh:'每个关键帧缓停'}},
 catmull:{f:CAM.catmullAt,name:{en:'Catmull-Rom spline',zh:'Catmull-Rom 样条'}},
};
const CURVE_DT=1/60;

// The speed curves of the three paths, sampled every film frame. They take a moment to compute, so the page warms them
// one path at a time while it is idle, before the speed sheet is reached.
const CURVE_FNS={spline:CAM.winAt,eased:CAM.easedAt,catmull:CAM.catmullAt};
const curveTimes=()=>{const ts=[];for(let f=Math.round(T0*60);f<=Math.round(T1*60);f++)ts.push(f/60);return ts;};
const speedsOf=(f,ts)=>ts.map(t=>CAM.pictureSpeed(f,clamp(t,T0+1e-3,T1-1e-3)));
const curveParts={};let curvesCache=null;
function warmCurves(){
 if(curvesCache)return ()=>{};
 const ts=curveTimes(),todo=Object.keys(CURVE_FNS).filter(k=>!curveParts[k]),ric=window.requestIdleCallback,cic=window.cancelIdleCallback;
 let id=0,dead=false;
 const later=cb=>ric?ric(cb,{timeout:3000}):setTimeout(cb,80),cancel=i=>ric?cic(i):clearTimeout(i);
 const step=()=>{if(dead)return;const k=todo.shift();if(!k)return;if(!curveParts[k])curveParts[k]=speedsOf(CURVE_FNS[k],ts);id=later(step);};
 id=later(step);
 return ()=>{dead=true;cancel(id);};
}
function getCurves(){
 if(curvesCache)return curvesCache;
 const ts=curveTimes();for(const k in CURVE_FNS)curveParts[k]=curveParts[k]||speedsOf(CURVE_FNS[k],ts);
 const {spline,eased,catmull}=curveParts,inner=CAM.KEYS.slice(1,-1);
 const stats=f=>{
  const atKeys=inner.map(k=>({t:k.t,v:CAM.pictureSpeed(f,k.t)}));
  let over=0,overAt=null;
  for(let i=0;i<CAM.KEYS.length-1;i++){const a=CAM.KEYS[i],b=CAM.KEYS[i+1];
   for(const ch of ['x','y']){const lo=Math.min(a.w[ch],b.w[ch]),hi=Math.max(a.w[ch],b.w[ch]);
    for(let t=a.t;t<=b.t;t+=1/120){const v=f(t)[ch],o=Math.max(lo-v,v-hi);if(o>over){over=o;overAt=[a.t,b.t];}}}}
  if(over<.5){over=0;overAt=null;}
  return {stops:atKeys.filter(k=>k.v<1),slow:atKeys.filter(k=>k.v>=1&&k.v<20),over,overAt};
 };
 const peak=v=>Math.max(...v);
 curvesCache={ts,spline,eased,catmull,max:5000,peaks:{spline:peak(spline),eased:peak(eased),catmull:peak(catmull)},
  stats:{spline:stats(CAM.winAt),eased:stats(CAM.easedAt),catmull:stats(CAM.catmullAt)}};
 return curvesCache;
}
const useCurves=()=>useMemo(getCurves,[]);

const SpeedLab=memo(function SpeedLab({lang,reduced}){
 const en=lang==='en',L=en?'en':'zh',P=useMemo(plan,[]),C=useCurves();
 const [alt,setAlt]=useState('eased'),[playing,setPlaying]=useState(!reduced);
 const root=useRef(null),inView=useInView(root,{threshold:.15,once:false});
 const graph=useRef(null),cursor=useRef(null),dotA=useRef(null),dotB=useRef(null),readA=useRef(null),readB=useRef(null),readT=useRef(null);
 const box=useRef(null),plane=useRef(null),live=useRef(null),ghost=useRef(null),barA=useRef(null),barB=useRef(null),gsize=useRef({w:0,h:0}),tRef=useRef(9.2);
 // a log scale (log10 of 1 + speed), so the slow drifts between moves and the stops at the keys both show
 const lg=v=>Math.log10(1+Math.max(0,v))/Math.log10(1+C.max),curveY=v=>400-lg(v)*400;
 const d=v=>'M'+v.map((s,i)=>((C.ts[i]-T0)/SPAN*1000).toFixed(1)+' '+curveY(s).toFixed(1)).join('L');
 const sampleAt=(arr,t)=>{const f=clamp((t-T0)/CURVE_DT,0,arr.length-1),i=Math.floor(f),k=f-i;return arr[i]+(arr[Math.min(arr.length-1,i+1)]-arr[i])*k;};
 const paint=useCallback(t=>{
  tRef.current=t;const {w,h}=gsize.current,f=ALTS[alt].f;
  const a=sampleAt(C.spline,t),b=sampleAt(C[alt],t),x=(t-T0)/SPAN*w;
  if(cursor.current)cursor.current.style.transform=`translate3d(${x.toFixed(1)}px,0,0)`;
  if(dotA.current)dotA.current.style.transform=`translate3d(${x.toFixed(1)}px,${(curveY(a)/400*h).toFixed(1)}px,0)`;
  if(dotB.current)dotB.current.style.transform=`translate3d(${x.toFixed(1)}px,${(curveY(b)/400*h).toFixed(1)}px,0)`;
  if(readA.current)readA.current.textContent=num(a)+' px/s';
  if(readB.current)readB.current.textContent=num(b)+' px/s';
  if(readT.current)readT.current.textContent=t.toFixed(2)+' s';
  if(barA.current)barA.current.style.transform=`scaleX(${clamp(lg(a)).toFixed(4)})`;
  if(barB.current)barB.current.style.transform=`scaleX(${clamp(lg(b)).toFixed(4)})`;
  live.current?.setAttribute('points',pts(CAM.footprint(CAM.winAt(t))));
  ghost.current?.setAttribute('points',pts(CAM.footprint(f(t))));
  graph.current?.setAttribute('aria-valuenow',t.toFixed(2));
  graph.current?.setAttribute('aria-valuetext',en?`${t.toFixed(2)} s: film ${num(a)} px/s, ${ALTS[alt].name.en.toLowerCase()} ${num(b)} px/s`:`${t.toFixed(2)} 秒：片子 ${num(a)} px/s，${ALTS[alt].name.zh} ${num(b)} px/s`);
 },[alt,C,en]);
 usePlane(box,plane,()=>{});
 useEffect(()=>{
  const el=graph.current;if(!el)return undefined;
  const ro=new ResizeObserver(()=>{gsize.current={w:el.clientWidth,h:el.clientHeight};paint(tRef.current);});
  ro.observe(el);return()=>ro.disconnect();
 },[paint]);
 // both cameras fly the path in real time while the sheet is on screen
 useEffect(()=>{
  if(!playing||!inView||reduced)return undefined;
  let raf=0,prev=performance.now();
  const step=now=>{let t=tRef.current+(now-prev)/1000;prev=now;if(t>T1)t=T0+(t-T1);paint(t);raf=requestAnimationFrame(step);};
  raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf);
 },[playing,inView,reduced,paint]);
 useEffect(()=>{if(reduced)setPlaying(false);},[reduced]);
 const scrub=(e,pause=true)=>{const rc=graph.current.getBoundingClientRect();if(pause)setPlaying(false);paint(T0+SPAN*clamp((e.clientX-rc.left)/rc.width));};
 const keys=e=>{
  const step=e.shiftKey?1/60:.1,t=tRef.current;
  const to={ArrowRight:t+step,ArrowUp:t+step,ArrowLeft:t-step,ArrowDown:t-step,Home:T0,End:T1}[e.key];
  if(to!==undefined){e.preventDefault();setPlaying(false);paint(clamp(to,T0,T1));}
  else if(e.key===' '){e.preventDefault();setPlaying(p=>!p);}
 };
 const S=C.stats,sp=S.spline,al=S[alt],stop=sp.stops[0];
 const slowLo=Math.min(...sp.slow.map(k=>k.v)),slowHi=Math.max(...sp.slow.map(k=>k.v));
 const lp=t=>(t-T0)/SPAN*100+'%';

 return <div ref={root} className="vf-speed">
  <div className="vf-seg" role="group" aria-label={en?'Compare the film’s spline with':'和片子的样条对比'}>
   <span className="vf-seg-k">{en?'Compare with':'对比'}</span>
   {Object.entries(ALTS).map(([k,a])=><button key={k} type="button" aria-pressed={alt===k} onClick={()=>setAlt(k)}>{a.name[L]}</button>)}
  </div>
  <div className="vf-speed-grid">
   <figure className="vf-graph-fig">
    <div className="vf-graph-head">
     <span className="vf-key-a">{en?'Film: monotone spline':'片子：单调样条'} <b ref={readA}/></span>
     <span className="vf-key-b">{ALTS[alt].name[L]} <b ref={readB}/></span>
     <span className="vf-graph-t" ref={readT}/>
    </div>
    <div ref={graph} className="vf-graph" role="slider" tabIndex={0} aria-label={en?'Picture speed over the camera path. Arrow keys move through time; space plays or pauses.':'镜头路径上的画面速度。方向键在时间上移动，空格键播放或暂停。'}
     aria-valuemin={T0} aria-valuemax={T1} onKeyDown={keys}
     onPointerDown={e=>{e.currentTarget.setPointerCapture?.(e.pointerId);scrub(e);}} onPointerMove={e=>{if(e.buttons)scrub(e);else if(e.pointerType==='mouse'&&!playing)scrub(e,false);}}>
     {[10,100,1000].map(v=><span key={v} className="vf-gy" style={{top:(1-lg(v))*100+'%'}}><em>{num(v)}</em></span>)}<span className="vf-gy is-zero" style={{top:'100%'}}><em>0</em></span>
     {CAM.KEYS.slice(1,-1).map((k,i)=><span key={i} className="vf-gk" style={{left:lp(k.t)}}><b>{i+2}</b></span>)}
     <svg viewBox="0 0 1000 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path className="vf-curve is-b" d={d(C[alt])}/>
      <path className="vf-curve is-a" d={d(C.spline)}/>
     </svg>
     {al.stops.map(k=><span key={k.t} className="vf-stop is-b" style={{left:lp(k.t)}}/>)}
     {sp.stops.map(k=><span key={k.t} className="vf-stop is-a" style={{left:lp(k.t)}}><em>{en?`stops at ${k.t.toFixed(1)} s`:`${k.t.toFixed(1)} 秒停下`}</em></span>)}
     <span ref={cursor} className="vf-gcur" aria-hidden="true"/>
     <span ref={dotB} className="vf-gdot is-b" aria-hidden="true"/>
     <span ref={dotA} className="vf-gdot is-a" aria-hidden="true"/>
    </div>
    <div className="vf-gx" aria-hidden="true">{[8,10,12,14,16,18,20].map(t=><span key={t} style={{left:lp(t)}}>{t} s</span>)}</div>
    <figcaption>{en?'Picture speed, calculated in the browser from the film’s twelve keyframes. It is how fast the points of the file under a 5 × 3 grid move across the 1920 × 1080 frame, with perspective. The vertical axis is logarithmic, so slow drifts and stops both show. Drag across the graph or use the arrow keys.':'画面速度由片子的 12 个关键帧在浏览器里算出。取画面上 5 × 3 网格处对应的文件点，看它们在 1920 × 1080 画面里移动多快，含透视。纵轴用对数刻度，慢速漂移和停顿都看得到。可以在图上拖动，或用方向键。'}</figcaption>
   </figure>
   <div className="vf-speed-side">
    <figure className="vf-mini">
     <div className="vf-draw-box" ref={box}><div className="vf-plane" ref={plane}><Plan P={P} mini liveRef={live} altRef={ghost}/></div></div>
     <figcaption>
      <span><i className="is-cam"/>{en?'The film':'片子'}</span><span><i className="is-alt"/>{ALTS[alt].name[L]}</span>
      <button type="button" className="vf-play" onClick={()=>setPlaying(p=>!p)} aria-pressed={playing}>{playing?(en?'❚❚ Pause':'❚❚ 暂停'):(en?'▶ Play both':'▶ 两个一起播放')}</button>
     </figcaption>
    </figure>
    <div className="vf-bars" aria-hidden="true"><span className="is-a"><i ref={barA}/></span><span className="is-b"><i ref={barB}/></span></div>
    <dl className="vf-stats">
     <div><dt>{en?'Stops at a keyframe':'在关键帧上停下'}</dt><dd><b>{al.stops.length}</b><span>{ALTS[alt].name[L]}</span></dd><dd><b className="is-a">{sp.stops.length}</b><span>{en?'the film':'片子'}</span></dd></div>
     <div><dt>{en?'Largest overshoot past a keyframe':'冲过关键帧的最大距离'}</dt><dd><b>{num(al.over)} px</b><span>{al.overAt?`${al.overAt[0]}–${al.overAt[1]} s`:'—'}</span></dd><dd><b className="is-a">{num(sp.over)} px</b><span>{en?'the film':'片子'}</span></dd></div>
     <div><dt>{en?'Peak speed':'最高速度'}</dt><dd><b>{num(C.peaks[alt])}</b><span>px/s</span></dd><dd><b className="is-a">{num(C.peaks.spline)}</b><span>px/s</span></dd></div>
    </dl>
   </div>
  </div>
  <div className="vf-cols">
   <p>{en?`With the usual ease in and out at each keyframe, the camera stops at every one of them, ${S.eased.stops.length} times in 13.5 seconds. The first smoothness rule in the project’s README is that cameras never ease to a stop between framings or before a cut. A Catmull-Rom spline through the same keyframes keeps moving, but it overshoots, carrying the window up to ${num(S.catmull.over)} px past a keyframe before it comes back.`:`如果按通常的做法在每个关键帧缓入缓出，镜头每到一个关键帧都会停下，13.5 秒里停 ${S.eased.stops.length} 次。项目 README 的第一条流畅规则就是：镜头不能在构图之间或剪辑点之前缓停。Catmull-Rom 样条经过同一组关键帧时一直在动，但会冲过头，窗口最多越过关键帧 ${num(S.catmull.over)} px 再折回来。`}</p>
   <p>{en?`The film uses one monotone cubic through all twelve keyframes. At each keyframe the tangent is the harmonic mean of the slopes on either side, or zero where a value changes direction. A value that keeps going keeps its speed through the keyframe, and no value goes past one. The camera stops once, at ${stop?stop.t.toFixed(1):'18.0'} s, where the fast pull-back ends and every value changes direction at the same moment. At ${sp.slow.length} other keyframes most values change direction too, and the one or two still moving keep the picture drifting at ${num(slowLo)}–${num(slowHi)} px/s.`:`片子用一条穿过全部 12 个关键帧的单调三次曲线。每个关键帧处的切线取两侧斜率的调和平均，数值在这里折返时取零。继续往同一方向走的数值，经过关键帧时速度不掉；也没有哪个数值会越过关键帧。镜头只在 ${stop?stop.t.toFixed(1):'18.0'} 秒停了一次，那里快速拉远结束，所有数值同时折返。另有 ${sp.slow.length} 个关键帧上大部分数值也在折返，剩下一两个还在动，画面以 ${num(slowLo)}–${num(slowHi)} px/s 慢慢漂移。`}</p>
  </div>
 </div>;
});

/* ---------- sheet 3: the 16-sample shutter, demonstrated ---------- */

const CHIP=0;// the flight drawn here: chip 1, color/background
const FLIGHT_FRAMES=81;
const REGION={x:620,y:200,w:1120,h:420};
const SAMPLE_SET=[1,2,4,8,16];
const JB='"VF JetBrains", ui-monospace, monospace';

/** The chip as the film draws it (Chip in VariablesForAgents2.tsx): size 30 type, a swatch, padding .32em/.6em. */
function chipSprite(scale,withText){
 const size=30*scale,pad=[size*.32,size*.6],gap=size*.45,sw=size*.9,font=`500 ${size}px ${JB}`;
 const m=document.createElement('canvas').getContext('2d');m.font=font;
 const tw=m.measureText(CAM.BOUND[CHIP]).width,h=Math.ceil(Math.max(size*1.2,sw)+pad[0]*2+3),w=Math.ceil(pad[1]*2+sw+gap+tw+3);
 const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');
 const rr=(x,y,ww,hh,r)=>{g.beginPath();g.moveTo(x+r,y);g.arcTo(x+ww,y,x+ww,y+hh,r);g.arcTo(x+ww,y+hh,x,y+hh,r);g.arcTo(x,y+hh,x,y,r);g.arcTo(x,y,x+ww,y,r);g.closePath();};
 rr(1,1,w-2,h-2,Math.min(size*.5,(h-2)/2));g.fillStyle='#0b2c4d';g.fill();g.lineWidth=1.5*scale;g.strokeStyle='#0d99ff';g.stroke();
 rr(1.5+pad[1],(h-sw)/2,sw,sw,size*.2);g.fillStyle=CAM.RAW[CHIP];g.fill();g.lineWidth=1*scale;g.strokeStyle='rgba(255,255,255,.25)';g.stroke();
 if(withText){g.font=font;g.fillStyle='#cfe9ff';g.textBaseline='middle';g.fillText(CAM.BOUND[CHIP],1.5+pad[1]+sw+gap,h/2+size*.04);}
 return g.getImageData(0,0,w,h);
}

// premultiplied sprites, kept per scale (the chip shrinks slowly, so most frames reuse one)
const spriteCache=new Map();
function sprites(scale){
 const key=scale.toFixed(3);let s=spriteCache.get(key);if(s)return s;
 const pre=im=>{const d=im.data,o=new Float32Array(d.length);for(let i=0;i<d.length;i+=4){const a=d[i+3]/255;o[i]=d[i]*a;o[i+1]=d[i+1]*a;o[i+2]=d[i+2]*a;o[i+3]=d[i+3];}return o;};
 const A=chipSprite(scale,true),B=chipSprite(scale,false);
 s={A:pre(A),B:pre(B),w:A.width,h:A.height};
 if(spriteCache.size>40)spriteCache.delete(spriteCache.keys().next().value);
 spriteCache.set(key,s);return s;
}
// finished frames, so a looping flight only pays for each frame once
const frameCache=new Map();

/** One output frame of the flight: N samples across the first half of the frame, summed in floats, divided once. */
function shutterFrame(F,n,fix,L){
 const id=`${F}/${n}/${fix?1:0}/${L}`,hit=frameCache.get(id);if(hit)return hit;
 const t0=CAM.flight(CHIP,0).start+F/60,samples=[];
 for(let j=0;j<n;j++){const t=t0+j*(CAM.SHUTTER.span/n)/60,s=CAM.flight(CHIP,t);samples.push(s);}
 const mid=samples[0],S=sprites(mid.scale*L),sw=S.w,sh=S.h,row=sw*4;
 const xs=samples.map(s=>s.x*L-sw/2),ys=samples.map(s=>s.y*L-sh/2);
 const ox=Math.floor(Math.min(...xs)),oy=Math.floor(Math.min(...ys));
 const W=Math.ceil(Math.max(...xs))-ox+sw+2,H=Math.ceil(Math.max(...ys))-oy+sh+2,W4=W*4;
 const acc=new Float32Array(W*H*4);
 let mixed=null,mixedAt=-1;
 samples.forEach((s,j)=>{
  const txt=fix?s.text:1;
  // the chip with its name at this sample's opacity: one array, mixed only when the name is part-way faded
  let P=txt>=1?S.A:txt<=0?S.B:null;
  if(!P){if(mixedAt!==txt){mixed=mixed||new Float32Array(S.A.length);for(let i=0;i<mixed.length;i++)mixed[i]=S.B[i]+(S.A[i]-S.B[i])*txt;mixedAt=txt;}P=mixed;}
  const wgt=s.o/n,X=xs[j]-ox,Y=ys[j]-oy,ix=Math.floor(X),iy=Math.floor(Y),fx=X-ix,fy=Y-iy;
  const w00=(1-fx)*(1-fy)*wgt,w10=fx*(1-fy)*wgt,w01=(1-fx)*fy*wgt,w11=fx*fy*wgt;
  for(let y=0;y<sh;y++){
   let si=y*row,di=((y+iy)*W+ix)*4,dj=di+W4;
   for(let x=0;x<sw;x++,si+=4,di+=4,dj+=4){
    const a=P[si+3];if(a===0)continue;
    const r=P[si],g=P[si+1],b=P[si+2];
    acc[di]+=r*w00;acc[di+1]+=g*w00;acc[di+2]+=b*w00;acc[di+3]+=a*w00;
    acc[di+4]+=r*w10;acc[di+5]+=g*w10;acc[di+6]+=b*w10;acc[di+7]+=a*w10;
    acc[dj]+=r*w01;acc[dj+1]+=g*w01;acc[dj+2]+=b*w01;acc[dj+3]+=a*w01;
    acc[dj+4]+=r*w11;acc[dj+5]+=g*w11;acc[dj+6]+=b*w11;acc[dj+7]+=a*w11;
   }
  }
 });
 const out=new ImageData(W,H),o=out.data;
 for(let i=0;i<acc.length;i+=4){const a=acc[i+3];if(a<=0)continue;o[i]=Math.round(acc[i]/a*255);o[i+1]=Math.round(acc[i+1]/a*255);o[i+2]=Math.round(acc[i+2]/a*255);o[i+3]=Math.round(a);}
 const c=document.createElement('canvas');c.width=W;c.height=H;c.getContext('2d').putImageData(out,0,0);
 const res={canvas:c,x:ox/L,y:oy/L,w:W/L,h:H/L,samples,mid};
 if(frameCache.size>100)frameCache.delete(frameCache.keys().next().value);
 frameCache.set(id,res);return res;
}

const Shutter=memo(function Shutter({lang,reduced}){
 const en=lang==='en';
 const [n,setN]=useState(16),[fix,setFix]=useState(true),[F,setF]=useState(38),[playing,setPlaying]=useState(!reduced),[font,setFont]=useState(false);
 const root=useRef(null),inView=useInView(root,{threshold:.2,once:false});
 const main=useRef(null),loupe=useRef(null),wrap=useRef(null),lwrap=useRef(null);
 useEffect(()=>{let ok=true;document.fonts?.load(`500 30px "VF JetBrains"`).finally(()=>{if(!ok)return;spriteCache.clear();frameCache.clear();setFont(true);});return()=>{ok=false;};},[]);
 useEffect(()=>{if(reduced)setPlaying(false);},[reduced]);
 // a quarter of the film's speed: one film frame every four screen frames
 useEffect(()=>{
  if(!playing||!inView)return undefined;
  let raf=0,prev=performance.now(),acc=0;
  const step=now=>{acc+=now-prev;prev=now;if(acc>=1000/15){acc%=1000/15;setF(f=>(f+1)%FLIGHT_FRAMES);}raf=requestAnimationFrame(step);};
  raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf);
 },[playing,inView]);
 // recomputed when the frame, the sample count or the fix changes, and once the film's mono face has loaded
 const frame=useMemo(()=>typeof document==='undefined'?null:shutterFrame(F,n,fix,1),[F,n,fix,font]);// eslint-disable-line react-hooks/exhaustive-deps
 const [sz,setSz]=useState({mw:0,lw:0});
 useEffect(()=>{
  const ro=new ResizeObserver(()=>setSz({mw:wrap.current?.clientWidth||0,lw:lwrap.current?.clientWidth||0}));
  if(wrap.current)ro.observe(wrap.current);if(lwrap.current)ro.observe(lwrap.current);return()=>ro.disconnect();
 },[]);
 const path=useMemo(()=>Array.from({length:FLIGHT_FRAMES},(_,f)=>CAM.flight(CHIP,CAM.flight(CHIP,0).start+f/60)),[]);
 useEffect(()=>{
  const dpr=Math.min(2,devicePixelRatio||1);
  // the frame region, scaled to the box
  const m=main.current;if(m&&sz.mw){
   const s=sz.mw/REGION.w,W=sz.mw,H=REGION.h*s;m.width=Math.round(W*dpr);m.height=Math.round(H*dpr);
   const g=m.getContext('2d');g.setTransform(dpr*s,0,0,dpr*s,-REGION.x*s*dpr,-REGION.y*s*dpr);
   g.fillStyle='#fff';g.fillRect(REGION.x,REGION.y,REGION.w,REGION.h);
   g.strokeStyle='rgba(61,139,255,.09)';g.lineWidth=1/s;
   for(let x=Math.ceil(REGION.x/40)*40;x<REGION.x+REGION.w;x+=40){g.beginPath();g.moveTo(x,REGION.y);g.lineTo(x,REGION.y+REGION.h);g.stroke();}
   for(let y=Math.ceil(REGION.y/40)*40;y<REGION.y+REGION.h;y+=40){g.beginPath();g.moveTo(REGION.x,y);g.lineTo(REGION.x+REGION.w,y);g.stroke();}
   g.setLineDash([6/s,6/s]);g.strokeStyle='rgba(61,139,255,.6)';g.lineWidth=1.2/s;g.beginPath();path.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.stroke();g.setLineDash([]);
   // where the name is gone (a fifth of the flight)
   const gone=path.find(p=>p.u>=.2);
   g.fillStyle='#1a62d6';path.forEach((p,i)=>{if(i%4===0){g.beginPath();g.arc(p.x,p.y,2.4/s,0,7);g.fill();}});
   if(gone&&fix){g.strokeStyle='#1a62d6';g.lineWidth=2/s;g.beginPath();g.arc(gone.x,gone.y,9/s,0,7);g.stroke();}
   if(frame)g.drawImage(frame.canvas,frame.x,frame.y,frame.w,frame.h);
  }
  const l=loupe.current;if(l&&sz.lw&&frame){
   const LW=sz.lw,LH=Math.round(Math.max(130,LW*.3)),cx=frame.mid.x,cy=frame.mid.y,s=1;
   l.width=Math.round(LW*dpr);l.height=Math.round(LH*dpr);
   const g=l.getContext('2d');g.setTransform(dpr*s,0,0,dpr*s,(LW/2-cx*s)*dpr,(LH/2-cy*s)*dpr);
   g.fillStyle='#fff';g.fillRect(cx-LW,cy-LH,LW*2,LH*2);
   g.imageSmoothingEnabled=true;g.drawImage(frame.canvas,frame.x,frame.y,frame.w,frame.h);
   const below=cy+30*frame.mid.scale+12;g.fillStyle='#e5484d';frame.samples.forEach(p=>{g.fillRect(p.x-.6,below+(p.y-cy),1.2,7);});
  }
 },[frame,sz,path,fix]);
 const cur=path[F],nxt=path[Math.min(FLIGHT_FRAMES-1,F+1)],move=Math.hypot(nxt.x-cur.x,nxt.y-cur.y);
 const gap=n>1?move*CAM.SHUTTER.span/n:0,stepped=n>1&&gap>1.5,t=CAM.flight(CHIP,0).start+F/60;
 return <div ref={root} className="vf-shutter">
  <div className="vf-sh-grid">
   <figure className="vf-sh-main">
    <div className="vf-sh-k"><span>{en?'DEMONSTRATION · drawn in the browser from the film’s flight code, not taken from the film':'演示 · 按片子的飞行代码在浏览器里绘制，不是片中画面'}</span></div>
    <div ref={wrap} className="vf-sh-canvas"><canvas ref={main} role="img" aria-label={en?`Chip color/background in flight, frame ${F+1} of ${FLIGHT_FRAMES}, ${n} samples`:`color/background 芯片飞行中，第 ${F+1}/${FLIGHT_FRAMES} 帧，${n} 次采样`}/></div>
    <div ref={lwrap} className="vf-sh-loupe">
     <canvas ref={loupe} aria-hidden="true"/>
     <span className="vf-sh-lk">{en?'DETAIL B · 1:1 with the 1920 frame · red ticks mark the samples':'局部 B · 1920 画面的 1:1 · 红色刻度是各次采样的位置'}</span>
    </div>
   </figure>
   <div className="vf-sh-ctrl">
    <div className="vf-seg is-col" role="group" aria-label={en?'Samples per frame':'每帧采样次数'}>
     <span className="vf-seg-k">{en?'Samples per frame':'每帧采样'}</span>
     <div>{SAMPLE_SET.map(v=><button key={v} type="button" aria-pressed={n===v} onClick={()=>setN(v)}>{v}</button>)}</div>
    </div>
    <label className="vf-slider"><span className="vf-seg-k">{en?'Flight frame':'飞行帧'} <b>{pad2(F+1)} / {FLIGHT_FRAMES} · {t.toFixed(2)} s</b></span>
     <input type="range" min="0" max={FLIGHT_FRAMES-1} value={F} onChange={e=>{setPlaying(false);setF(+e.target.value);}}/>
    </label>
    <div className="vf-sh-row">
     <button type="button" className="vf-play" onClick={()=>setPlaying(p=>!p)} aria-pressed={playing}>{playing?(en?'❚❚ Pause':'❚❚ 暂停'):(en?'▶ Play at ¼ speed':'▶ 以 1/4 速度播放')}</button>
     <button type="button" role="switch" aria-checked={fix} className="vf-switch" onClick={()=>setFix(v=>!v)}><i/>{en?'Fade the name at take-off (the fix)':'起飞时淡出名字（修正）'}</button>
    </div>
    <dl className="vf-sh-read">
     <div><dt>{en?'Movement in this frame':'这一帧的位移'}</dt><dd>{move.toFixed(1)} px</dd></div>
     <div><dt>{en?'Sample spacing':'采样间距'}</dt><dd>{n>1?gap.toFixed(2)+' px':'—'}</dd></div>
     <div className="is-wide"><dt>{en?'Result':'效果'}</dt><dd className={stepped?'is-warn':''}>{n===1?(en?'One sharp copy, which strobes in motion':'一个清晰的副本，运动时会频闪'):stepped?(en?`${n} separate copies, more than about 1.5 px apart`:`${n} 个分开的副本，间距超过约 1.5 px`):(en?'A continuous streak':'一道连续的拖影')}</dd></div>
    </dl>
   </div>
  </div>
 </div>;
});

/* ---------- sheet 4: words on a moving camera ---------- */

const SCR_FROM=890,SCR_N=18;
function Scramble({lang,reduced}){
 const en=lang==='en',root=useRef(null),inView=useInView(root,{threshold:.3,once:false});
 const [k,setK]=useState(SCR_N-1),[playing,setPlaying]=useState(!reduced);
 useEffect(()=>{if(reduced)setPlaying(false);},[reduced]);
 // ten times slower than the film: 6 frames a second, a short rest on the settled name before it loops
 useEffect(()=>{
  if(!playing||!inView)return undefined;
  let i=0;const id=setInterval(()=>{i++;setK(i%(SCR_N+6)<SCR_N?i%(SCR_N+6):SCR_N-1);},1000/6);
  return()=>clearInterval(id);
 },[playing,inView]);
 const f=SCR_FROM+k,p=CAM.prog(f/60,CAM.SCRAMBLES[0].at,CAM.SCRAMBLES[0].at+CAM.SCRAMBLES[0].dur);
 const text=CAM.scramble(CAM.SCRAMBLES[0].from,CAM.SCRAMBLES[0].to,p,f);
 const state=i=>{const fr=SCR_FROM+i,q=CAM.prog(fr/60,14.85,15.1);return q<=0?'is-pre':q>=1?'is-done':'is-scr';};
 const scrN=Array.from({length:SCR_N},(_,i)=>state(i)).filter(s=>s==='is-scr').length;
 return <div ref={root} className="vf-scr">
  <div className="vf-scr-film" style={{'--k':k,'--n':SCR_N}}>
   <img src={`${MEDIA}/scramble.webp`} width="600" height={126*SCR_N} alt={en?`Film frame ${f}: the chip reads ${text}`:`片中第 ${f} 帧：芯片上是 ${text}`} decoding="async" loading="lazy"/>
   <span className="vf-scr-tc">{en?'FRAME':'帧'} {f} · {(f/60).toFixed(3)} s</span>
  </div>
  <ol className="vf-scr-cells" aria-hidden="true">{Array.from({length:SCR_N},(_,i)=><li key={i} className={state(i)+(i===k?' is-on':'')}/>)}</ol>
  <p className="vf-scr-out"><span>{en?'scramble() in the browser, frame':'浏览器里运行 scramble()，第'} {f}{en?':':' 帧：'}</span><code>{text}</code></p>
  <div className="vf-sh-row">
   <button type="button" className="vf-play" onClick={()=>setPlaying(v=>!v)} aria-pressed={playing}>{playing?(en?'❚❚ Pause':'❚❚ 暂停'):(en?'▶ Play at 1/10 speed':'▶ 以 1/10 速度播放')}</button>
   <label className="vf-slider is-inline"><span className="vf-sr">{en?'Frame':'帧'}</span><input type="range" min="0" max={SCR_N-1} value={k} onChange={e=>{setPlaying(false);setK(+e.target.value);}} aria-valuetext={`${en?'frame':'帧'} ${f}: ${text}`}/></label>
  </div>
  <p className="vf-note">{en?`The scramble runs for ${scrN} frames and the name settles on the next one, 0.25 s in all. The reviewers set a limit of 8 frames, about a quarter second, when the films ran at 30 fps; at 60 fps a quarter second is 15 frames. The product name is never scrambled. It rises in word by word. The characters are held for the whole frame (frameT), so all 16 shutter samples show the same string; without that, one frame would print two strings on top of each other.`:`乱码持续 ${scrN} 帧，下一帧落定成名字，一共 0.25 秒。评审定这条上限时片子还是 30 帧，上限是 8 帧，约四分之一秒；换成 60 帧后，四分之一秒是 15 帧。产品名从不做乱码，它是逐词升起来的。字符在整帧内保持不变（frameT），16 次快门采样看到的是同一串字；不这样做，一帧里会叠出两串字。`}</p>
 </div>;
}

function PlateDetail({film,lang}){
 const en=lang==='en',L=en?'en':'zh',[dims,setDims]=useState(true),note=film.notes[0];
 const fx=x=>x/1920*100+'%',fy=y=>y/1080*100+'%';
 return <div className="vf-plate">
  <figure className={'vf-plate-fig'+(dims?' is-dims':'')}>
   <img src={`${MEDIA}/plate.webp`} width="1280" height="720" alt={en?'Film frame at 13.0 s: the headline on its dark plate over the file':'片中 13.0 秒：标题在深色底板上，下面是文件'} loading="lazy" decoding="async"/>
   <svg viewBox="0 0 1920 1080" aria-hidden="true" focusable="false">
    <rect className="vf-pl-box" x="96" y="66" width="860" height="210" rx="26"/>
    <path className="vf-pl-dim" d="M96 316V296M956 316V296M96 306H956M996 66H976M996 276H976M986 66V276M0 40H96M56 0V66"/>
    <path className="vf-pl-focus" d="M0 929H1920"/>
   </svg>
   <span className="vf-pl-lab" style={{left:fx(526),top:fy(306)}}>860</span>
   <span className="vf-pl-lab" style={{left:fx(986),top:fy(171)}}>210</span>
   <span className="vf-pl-lab is-sm" style={{left:fx(48),top:fy(40)}}>96 · 66</span>
   <span className="vf-pl-lab is-focus" style={{left:fx(1560),top:fy(929)}}>{en?'Below 86%: 8 px blur':'86% 以下：8 px 模糊'}</span>
   <button type="button" className="vf-pl-toggle" aria-pressed={dims} onClick={()=>setDims(v=>!v)}>{dims?(en?'Hide dimensions':'隐藏尺寸'):(en?'Show dimensions':'显示尺寸')}</button>
  </figure>
  <div className="vf-rev">
   <p className="vf-rev-n"><Tri n={1}/>{en?'Review note':'评审意见'}</p>
   <p>{note.note[L]}</p>
   <p className="vf-rev-fix">{note.fix[L]} <span>{en?'The plate is 860 × 210 px in the frame, near-black at 84% opacity with a 16 px backdrop blur. It fades in and out with the shot.':'底板在画面里是 860 × 210 px，近黑色，不透明度 84%，加 16 px 背景模糊，随镜头淡入淡出。'}</span></p>
  </div>
 </div>;
}

function Tri({n}){return <svg className="vf-tri" viewBox="0 0 24 21" aria-hidden="true" focusable="false"><path d="M12 1.5L22.5 19.5H1.5Z"/><text x="12" y="16.5">{n}</text></svg>;}

const CELLS=16,DRIFT=6;// px per second: a slow drift, magnified
function PixelSnap({lang,reduced}){
 const en=lang==='en',root=useRef(null),inView=useInView(root,{threshold:.3,once:false});
 const a=useRef([]),b=useRef([]),ra=useRef(null),rb=useRef(null),pos=useRef(3.3);
 const [x,setX]=useState(3.3);
 const paint=useCallback(p=>{
  pos.current=p;
  const cover=(s,i)=>{let c=0;for(const o of [-CELLS,0,CELLS]){const l=s+o,r=l+4;c+=Math.max(0,Math.min(r,i+1)-Math.max(l,i));}return Math.min(1,c);};
  const snapped=Math.round(p);
  for(let i=0;i<CELLS;i++){a.current[i]?.style.setProperty('opacity',cover(p,i).toFixed(3));b.current[i]?.style.setProperty('opacity',cover(snapped%CELLS,i).toFixed(3));}
  if(ra.current)ra.current.textContent=(p%CELLS).toFixed(2)+' px';
  if(rb.current)rb.current.textContent=(snapped%CELLS)+' px';
 },[]);
 useEffect(()=>{paint(x);},[x,paint]);
 useEffect(()=>{
  if(reduced||!inView)return undefined;
  let raf=0,prev=performance.now();
  const step=now=>{paint((pos.current+(now-prev)/1000*DRIFT)%CELLS);prev=now;raf=requestAnimationFrame(step);};
  raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf);
 },[reduced,inView,paint]);
 const row=(ref,label,read)=><div className="vf-px-row"><span className="vf-px-l">{label} <b ref={read}/></span><div className="vf-px-cells">{Array.from({length:CELLS},(_,i)=><span key={i}><i ref={el=>{ref.current[i]=el;}}/></span>)}</div></div>;
 return <div ref={root} className="vf-px">
  {row(a,en?'transform: translate3d':'transform: translate3d',ra)}
  {row(b,en?'left / top':'left / top',rb)}
  {reduced&&<label className="vf-slider"><span className="vf-seg-k">{en?'Position':'位置'}</span><input type="range" min="0" max={CELLS-.01} step=".01" value={x} onChange={e=>setX(+e.target.value)}/></label>}
  <p className="vf-note">{en?`A simulated drift of ${DRIFT} px a second, one cell per pixel. With transform, the edge moves a tenth of a pixel each frame and the browser shades it across two pixels. With left/top, Chrome snaps it to whole pixels, so it holds and then jumps one pixel, ${DRIFT} times a second. In the film, the window and the flying chips are positioned with transform.`:`模拟每秒漂移 ${DRIFT} px，一格代表一个像素。用 transform 时，边缘每帧移动十分之一像素，浏览器把它分摊在两个像素上显示。用 left/top 时，Chrome 会把位置吸附到整像素，于是停一下、跳一个像素，每秒 ${DRIFT} 次。片子里的窗口和飞行的芯片都用 transform 定位。`}</p>
 </div>;
}

/* ---------- sheet 5: revisions ---------- */

const STUDY=[
 ['Apple','Introducing Creator Studio',35],['Notion','Meet Notion Mail',60],['Figma','Introducing Figma Motion',68],
 ['Figma','All the launches at Config 2025',81],['Linear','Introducing Linear Agent',55],['Raycast','New Raycast. Coming 2026',39],
 ['The Browser Company','Dia',78],['Notion','Introducing the new Notion AI',57],['Apple','iOS 26 Liquid Glass',86],
];
const RULES=[
 {en:'Transitions are hard cuts, pushes and match cuts only. No dissolves, irises or flashes',zh:'转场只用硬切、推镜和匹配剪辑，不用叠化、圆形遮罩和闪白'},
 {en:'No still picture of 0.8 s or more; end cards keep pushing',zh:'没有 0.8 秒以上的静止画面；结尾卡也一直在推'},
 {en:'A title-safe zone nothing else enters; labels at least 24 px',zh:'标题有固定安全区，其他东西不进去；标签至少 24 px'},
 {en:'Scrambles 8 frames or fewer, never on the product name',zh:'乱码不超过 8 帧，不用在产品名上'},
 {en:'One set of numbers, the same all the way through',zh:'全片只用一套数字，前后一致'},
 {en:'The film’s main line is acted out on screen once',zh:'片子的主句要在画面上演出来一次'},
];

function ScoreChart({scores,lang}){
 const en=lang==='en',lo=60,hi=100,y=v=>(hi-v)/(hi-lo)*100,x=i=>(i+.5)/scores.length*100;
 return <figure className="vf-score">
  <div className="vf-score-plot">
   <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    {[70,80,90].map(v=><path key={v} className="vf-score-grid" d={`M0 ${y(v)}H100`}/>)}
    <path className="vf-score-target" d={`M0 ${y(95)}H100`}/>
    <path className="vf-score-line" d={'M'+scores.map((s,i)=>`${x(i)} ${y(s)}`).join('L')}/>
   </svg>
   {[70,80,90].map(v=><span key={v} className="vf-score-y" style={{top:y(v)+'%'}}>{v}</span>)}
   <span className="vf-score-tg" style={{top:y(95)+'%'}}>{en?'Target 95':'目标 95'}</span>
   {scores.map((s,i)=><span key={i} className={'vf-score-pt'+(i===scores.length-1?' is-last':'')} style={{left:x(i)+'%',top:y(s)+'%'}}><b>{s}</b></span>)}
  </div>
  <div className="vf-score-x" aria-hidden="true">{scores.map((_,i)=><span key={i} style={{left:x(i)+'%'}}>R{i+1}</span>)}</div>
  <figcaption>{en?`Six rounds of independent review: ${scores.join(' → ')} out of 100. Weights: motion 30, craft 30, story 25, finish 15.`:`六轮独立评审：${scores.join(' → ')}，满分 100。权重为动效 30、工艺 30、叙事 25、完成度 15。`}</figcaption>
 </figure>;
}

function Revisions({film,lang}){
 const en=lang==='en',L=en?'en':'zh';
 return <>
  <div className="vf-fc">
   {film.firstCut.map((p,i)=><Reveal as="figure" key={i} delay={i*90} className="vf-fc-pair">
    <div className="vf-fc-imgs">
     <span><img src={`${MEDIA}/v1-${i+1}.webp`} width="960" height="540" alt="" loading="lazy" decoding="async"/><em>{en?'FIRST CUT':'第一版'}</em></span>
     <span><img src={`${MEDIA}/final-${i+1}.webp`} width="960" height="540" alt="" loading="lazy" decoding="async"/><em className="is-final">{en?`FINAL · ${p.final.toFixed(1)} s`:`终版 · ${p.final.toFixed(1)} 秒`}</em></span>
    </div>
    <figcaption>{COPY.firstCut[i][L]}</figcaption>
   </Reveal>)}
  </div>
  <dl className="vf-diff">
   <div><dt>{en?'First cut':'第一版'}</dt><dd>{en?'37 s, on light grey. Sampled one frame a second, 11 of those seconds looked almost the same as the second before, and there were only 6 big changes. It ended on a still card held for 5 s.':'37 秒，浅灰底。按每秒一帧取样，有 11 秒和前一秒几乎一样，大变化只有 6 次。结尾是一张停了 5 秒的静止卡。'}</dd></div>
   <div><dt>{en?'Final':'终版'}</dt><dd>{en?'29.4 s, in a dark room lit like a canvas. No cut until 20.4 s, then cuts at 24 and 27.4 s. The end card lasts 2 s and keeps pushing in.':'29.4 秒，暗场，像一块被照亮的画布。20.4 秒之前没有剪辑点，之后在 24 秒和 27.4 秒硬切。结尾卡 2 秒，一直在推近。'}</dd></div>
  </dl>
  <div className="vf-study">
   <div>
    <h3>{en?'Study of nine app launch films':'九支 App 宣传片的对照研究'}</h3>
    <p>{en?'Before the rebuild, I laid the first cut out one frame a second next to nine launch films from software companies. For this film, the study pointed to Linear’s. That film is nearly one long take, with the interface on a large tilted plane, a low camera gliding over it, shallow focus, and a dark room where only the active line is lit.':'重做之前，我把第一版按每秒一帧铺开，和九支软件公司的宣传片放在一起比。对这支片子，研究指向 Linear 那支。那支片子近乎一个长镜头，界面铺在倾斜的大平面上，镜头低角度滑过，景深很浅，暗场里只照亮正在发生的那一行。'}</p>
    <p className="vf-note">{en?'Studied from notes and contact sheets. No frames from these films are reproduced here.':'研究只用文字记录和联系表，这里不放这些片子的画面。'}</p>
   </div>
   <ol className="vf-study-list">{STUDY.map(([who,what,s],i)=><li key={i} className={who==='Linear'?'is-on':undefined}><span>{pad2(i+1)}</span><b>{who}</b><em>{what}</em><i>{s} s</i></li>)}</ol>
  </div>
  <div className="vf-reviews">
   <ScoreChart scores={film.scores} lang={lang}/>
   <ol className="vf-notes">{film.notes.map((n,i)=><Reveal as="li" key={i} delay={i*80}>
    <p className="vf-rev-n"><Tri n={i+1}/>{en?'Review note':'评审意见'}</p>
    <p>{n.note[L]}</p>
    <p className="vf-rev-fix">{n.fix[L]}</p>
   </Reveal>)}</ol>
  </div>
  <div className="vf-rules">
   <p className="vf-k"><span>§</span>{en?'Rules from the reviews':'评审定下的规则'}</p>
   <ol>{RULES.map((r,i)=><li key={i}><span>{pad2(i+1)}</span>{r[L]}</li>)}</ol>
   <p className="vf-note">{en?'The reviewer was an AI agent that could look at the renders and frame scans but could not change files. After six rounds the score was 85, short of the 95 I asked for.':'评审是一个 AI 智能体，可以看渲染和逐帧扫描，不能改文件。六轮之后是 85 分，没到我要求的 95 分。'}</p>
  </div>
 </>;
}

/* Copy shown on this page for the film's ideas and the first-cut captions. Same facts as FILMS in product-films-data.js,
   worded for this page. */
const COPY={
 firstCut:[
  {en:'At “But they invent the names.”, the first cut listed five invented names in red on light grey. The final pulls five chips out of a stream of values and scrambles each one into its name.',zh:'在“But they invent the names.”这一句，第一版在浅灰底上用红色列出五个编出来的名字；终版从一串流动的数值里拽出五个芯片，逐个乱码成名字。'},
  {en:'For “12 unbound values”, the first cut put a caption beside the whole window and outlined the row. The final pushes in on the panel row and rolls up a large 12 beside it.',zh:'讲“12 个未绑定的值”时，第一版把说明文字放在整个窗口旁边，再给那一行描边；终版推近到面板那一行，在旁边滚出一个很大的 12。'},
 ],
 ideas:[
  {title:{en:'One object throughout',zh:'一个东西贯穿全片'},body:{en:'The hex values. They stream past as what the agent sees, get renamed, get bound, and come back as the measurement.',zh:'就是那些色值。先是 agent 看到的数值流，然后被改名、被绑定，最后变成测量结果。'}},
  {title:{en:'Colour as a code',zh:'颜色只用来编码'},body:{en:'A dark room lit like a canvas. Invented names are red, the file’s own token names are blue, and nothing else is coloured.',zh:'暗场像一块被照亮的画布。编出来的名字是红色，文件里的 token 名是蓝色，其余都不上色。'}},
  {title:{en:'Nearly one take',zh:'几乎是一个长镜头'},body:{en:'No cut for the first 20.4 seconds. The camera follows one spline through twelve framings of the file, so the workflow plays as one continuous action.',zh:'前 20.4 秒没有剪辑点。镜头沿一条样条曲线经过文件的 12 个构图，整个流程是一个连续的动作。'}},
 ],
};

/* ---------- the page ---------- */

export default function VariablesPage({lang,reduced,onNavigate,slug='variables-for-agents'}){
 const film=FILMS[slug],en=lang==='en',L=en?'en':'zh';
 const src='/video/'+film.stem+'-film.mp4',caseHref='/product/'+film.caseSlug;
 const video=useRef(null),desk=useRef(null);
 const behavior=reduced?'auto':'smooth';
 const go=to=>event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();onNavigate(to);};
 const watch=useCallback(()=>{const v=video.current;if(!v)return;v.scrollIntoView({behavior,block:'center'});v.play().catch(()=>{});},[behavior]);
 // warm the speed curves while the visitor reads the first sheet
 useEffect(()=>warmCurves(),[]);
 const skip=useCallback(()=>{const el=document.getElementById('vf-speed');if(!el)return;el.scrollIntoView({behavior,block:'start'});el.focus({preventScroll:true});},[behavior]);
 // the back link in the hero is a plain anchor: route it
 const onClick=e=>{const a=e.target.closest?.('a[data-nav]');if(!a)return;go(a.getAttribute('href'))(e);};

 return <article key={slug} className={'st-page vf-page'+(reduced?' st-still':'')} data-nav-tone="light" style={{'--accent':film.accent}} onClick={onClick}>
  <PathPlot film={film} lang={lang} reduced={reduced} onWatch={watch} onSkip={skip}/>

  <div className="vf-sheets">
   <Sheet id="vf-speed" n={2} kicker={en?'Speed':'速度'} title={en?'Camera speed between keyframes':'关键帧之间的镜头速度'}
    lead={<p>{en?'The camera is written as twelve keyframes. Each one sets which point of the file sits where in the frame, and at what scale and tilt. The graph compares the film’s interpolation between them with two others on the same keyframes.':'镜头写成 12 个关键帧，每个关键帧定下文件上哪一点落在画面哪里、缩放多少、倾斜多少。下图把片子在关键帧之间的插值方式，和同一组关键帧上的另外两种放在一起比较。'}</p>}>
    <Near min={720}><SpeedLab lang={lang} reduced={reduced}/></Near>
   </Sheet>

   <Sheet id="vf-shutter" n={3} kicker={en?'Shutter':'快门'} title={en?'Motion blur with 16 samples per frame':'每帧 16 次采样的运动模糊'}
    lead={<><p>{en?'Without motion blur, a fast move shows up as a row of sharp copies. Remotion’s CameraMotionBlur stacks its samples in the browser at 8 bits per channel. On light backgrounds, such as this film’s screens, that left echoes of text and pink and green blotches.':'没有运动模糊，快速运动会显示成一排清晰的副本。Remotion 的 CameraMotionBlur 在浏览器里按每通道 8 位叠加采样，在浅色背景上（比如这支片子的界面）会留下文字残影和粉绿色色斑。'}</p>
     <p>{en?'The film has a Sub composition that runs at 16 times its frame rate. Sample j of frame F is rendered at F + j/32, which spreads 16 samples across the first half of each frame (a 180° shutter). scripts/render-mb.mjs adds each group of 16 into a Uint16Array in Node, divides once with rounding, and encodes the result. That is 1,764 frames × 16 = 28,224 renders.':'片子另有一个 16 倍帧率的 Sub 合成。第 F 帧的第 j 次采样渲染在 F + j/32 处，16 次采样分布在每帧的前一半，相当于 180° 快门。scripts/render-mb.mjs 在 Node 里把每 16 次采样累加到 Uint16Array，四舍五入后只除一次，再编码。一共是 1,764 帧 × 16 = 28,224 次渲染。'}</p></>}>
    <Near min={560}><Shutter lang={lang} reduced={reduced}/></Near>
    <div className="vf-fix">
     <div className="vf-rev">
      <p className="vf-rev-n"><Tri n={2}/>{en?'Review note':'评审意见'}</p>
      <p>{film.notes[1].note[L]}</p>
      <p className="vf-rev-fix">{film.notes[1].fix[L]} <span>{en?'In the code, the name’s opacity is 1 − smoother(u from 0.02 to 0.2). It is zero a fifth of the way into the flight time, when the chip has covered 3% of the distance.':'代码里，名字的不透明度是 1 − smoother(u 从 0.02 到 0.2)。飞行时间过了五分之一，名字已经完全消失，这时芯片只走了 3% 的距离。'}</span></p>
      <p className="vf-note">{en?'kit/kinetic.tsx notes that type moving faster than about 1.5 px per sample shows as separate copies. Headlines therefore enter on a quartic ease-out, whose peak speed is a third of expoOut’s, and leave with a fade and a short lift.':'按 kit/kinetic.tsx 里的说明，字的移动超过每次采样约 1.5 px，就会出现分开的副本。所以标题用四次方缓出进场，最快时只有 expoOut 的三分之一；离场时淡出，同时稍微上移。'}</p>
     </div>
     <ol className="vf-strip" aria-label={en?'Frames from the film, 18.55 to 19.2 s':'片中画面，18.55 到 19.2 秒'}>
      {[[18.55,en?'Names on, before take-off':'名字还在，尚未起飞'],[18.8,en?'The first names fade as their chips start to move':'先起飞的芯片名字开始淡出'],[19,en?'Blank pills on their arc':'空白胶囊沿弧线落下'],[19.2,en?'Mid-flight, with the 16-sample shutter':'飞行中，16 次采样的快门']].map(([t,c],i)=>
       <li key={t}><img src={`${MEDIA}/flight-${i+1}.webp`} width="672" height="378" alt="" loading="lazy" decoding="async"/><span><b>{tc(t)}</b>{c}</span></li>)}
     </ol>
    </div>
   </Sheet>

   <Sheet id="vf-type" n={4} kicker={en?'Type':'文字'} title={en?'Text on a moving camera':'运动镜头上的文字'}
    lead={<p>{en?'The camera moves under the headlines almost all the time, so they have to stay readable over a moving picture. Three details from the film.':'镜头几乎一直在标题下面移动，标题要在运动的画面上保持可读。下面是片子里的三处细节。'}</p>}>
    <div className="vf-details">
     <Reveal className="vf-detail is-a"><p className="vf-dk"><i>A</i>{en?'Scramble effect':'乱码效果'}</p><Scramble lang={lang} reduced={reduced}/></Reveal>
     <Reveal className="vf-detail is-b"><p className="vf-dk"><i>B</i>{en?'Headline plate sized to the text':'按文字大小做的标题底板'}</p><PlateDetail film={film} lang={lang}/></Reveal>
     <Reveal className="vf-detail is-c"><p className="vf-dk"><i>C</i>{en?'Positioning with transform, and 60 fps':'用 transform 定位，以及 60 帧'}</p><PixelSnap lang={lang} reduced={reduced}/>
      <p className="vf-note">{en?'The film is rendered at 1920 × 1080 and 60 fps. Eleven of the 13 app films in the study run at 24 or 30 fps. When I watched the motion-first cuts, Common Ground and Last 100 Feet stuttered, and all three films moved to 60 fps as part of the fix.':'片子以 1920 × 1080、60 帧渲染。研究里的 13 支 App 片有 11 支是 24 或 30 帧。我看动效优先的那一版时，Common Ground 和 Last 100 Feet 画面一卡一卡，修的时候三支片子都改成了 60 帧。'}</p>
     </Reveal>
    </div>
   </Sheet>

   <Sheet id="vf-revisions" n={5} kicker={en?'Revisions':'修订'} title={en?'First cut, study and review rounds':'第一版、对照研究和评审'}
    lead={<p>{en?'The first cut read like a slide deck. I compared it with nine launch films, rebuilt it with motion first, and put it through six rounds of review.':'第一版看起来像幻灯片。我把它和九支宣传片对照，以动效为先重做，又做了六轮评审。'}</p>}>
    <Revisions film={film} lang={lang}/>
   </Sheet>

   <Sheet id="vf-edit" n={6} kicker={en?'The edit':'剪辑'} title={en?'The film and its timeline':'片子和它的时间线'}
    lead={<p>{en?'29.4 s at 60 fps, silent on the site. It was not cut in an editing app. Every frame is a function of time in React, rendered by Remotion. The timeline below is drawn from the film’s data (beats, headlines and the three cuts), with the picture change per frame measured from this video file.':'29.4 秒，60 帧，网站上是无声版。它没有用剪辑软件剪，每一帧都是 React 里的一个时间函数，由 Remotion 渲染。下面的时间线由片子的数据画出（段落、字幕、三个剪辑点），再加上从这个视频文件逐帧量出的画面变化。'}</p>}>
    <div className="vf-desk" ref={desk} data-nav-tone="dark"><Desk film={film} slug={slug} lang={L} video={video}/></div>
    <ol className="vf-gnotes">{COPY.ideas.map((idea,i)=><li key={i}><span>{en?'NOTE':'注'} {i+1}</span><h3>{idea.title[L]}</h3><p>{idea.body[L]}</p></li>)}</ol>
    <p className="vf-links">
     <a href={caseHref} onClick={go(caseHref)}>{en?'Design case for the product: Ready for agents →':'产品的设计案例：Ready for agents →'}</a>
     <a href={src} target="_blank" rel="noopener noreferrer">{en?'Open the video':'单独打开视频'} ↗</a>
    </p>
   </Sheet>

   <NextProject item={nextAfter(slug)} lang={lang} onNavigate={onNavigate}/>
   <footer className="st-footer"><span>JAY LIN / {film.name.toUpperCase()} / {en?'HOW THE FILM WAS MADE':'片子是怎么做的'}</span><p>{en?'A film by Jay Lin, rendered from code.':'林世杰的片子，用代码渲染。'}</p></footer>
  </div>
 </article>;
}
