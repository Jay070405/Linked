import {useEffect,useId,useMemo,useRef,useState} from 'react';
import {FILMS,nextAfter} from '../product-films-data';
import {Reveal,NextProject} from '../story/Story';
import {Desk} from '../story/FilmDesk';
import {RUBRIC,LOOP,ROUNDS,AFTER,OPEN,SHOTS,STEPS} from '../films/common-ground-review';
import MEASURE from '../films/common-ground-measure.json';
import './common-ground-page.css';

/* Common Ground, how the film was made. Its thread is the review loop: six rounds of independent review took the film
   from 58 to 87, each note became a rule and a code change, and the user's own "非常不 smooth" came after. The page is a
   review console: graphite, the film's red for whatever changed, mono for the record. Every number and every line of
   code is from the project's record (films/common-ground-review.js) or measured from the site's own file
   (films/common-ground-measure.json, public/assets/other-project/common-ground/frames). The two canvas labs are live
   demonstrations of the technique and say so. Motion is transform and opacity only; nothing runs while off screen. */

const scrollerOf=el=>el?.closest('.portfolio-page-viewport')||window;
const pad=(n,w=2)=>String(n).padStart(w,'0');
const T=(v,lang)=>typeof v==='string'?v:v[lang];
const money=n=>'$'+n.toLocaleString('en-US');

/** In view (re-arms when it leaves), for pausing loops off screen. */
function useVisible(ref,margin='0px'){
 const [on,setOn]=useState(false);
 useEffect(()=>{const el=ref.current;if(!el)return;const io=new IntersectionObserver(([e])=>setOn(e.isIntersecting),{rootMargin:margin});io.observe(el);return()=>io.disconnect();},[ref,margin]);
 return on;
}

/** Steps through whole integers on the way to a new value: a counter that never shows a value it isn't. */
function useStepTo(target,reduced){
 const [v,setV]=useState(target),cur=useRef(target);
 useEffect(()=>{
  if(reduced){cur.current=target;setV(target);return;}
  const from=cur.current,dist=target-from;if(!dist)return;
  let raf=0,t0;const dur=Math.min(720,160+Math.abs(dist)*36);
  const step=t=>{t0??=t;const k=Math.min(1,(t-t0)/dur),n=Math.round(from+dist*(1-Math.pow(1-k,3)));if(n!==cur.current){cur.current=n;setV(n);}if(k<1)raf=requestAnimationFrame(step);};
  raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf);
 },[target,reduced]);
 return v;
}

function Head({n,label,title,lead,id}){
 return <Reveal as="header" className="cg-head">
  <p className="cg-k"><b>{n}</b><span>{label}</span></p>
  <h2 id={id}>{title}</h2>
  {lead&&<p className="cg-lead">{lead}</p>}
 </Reveal>;
}

/* ── the hero: the film on a review monitor, with title-safe guides and a live shot counter ─────────────────────── */
function Monitor({film,lang,reduced}){
 const en=lang==='en',ref=useRef(null),box=useRef(null),tc=useRef(null),shot=useRef(null),[playing,setPlaying]=useState(false);
 const visible=useVisible(box);
 useEffect(()=>{
  const v=ref.current;if(!v)return;let raf=0;
  const paint=()=>{const t=v.currentTime||0,f=Math.round(t*60);tc.current.textContent=`${pad(Math.floor(f/60))}:${pad(f%60)}`;shot.current.textContent=pad(film.cuts.filter(c=>t>=c-1e-6).length+1);};
  const loop=()=>{paint();if(!v.paused&&!v.ended)raf=requestAnimationFrame(loop);};
  const play=()=>{setPlaying(true);cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);};
  const stop=()=>{setPlaying(false);paint();};
  v.addEventListener('play',play);v.addEventListener('pause',stop);v.addEventListener('seeked',paint);paint();
  return()=>{cancelAnimationFrame(raf);v.removeEventListener('play',play);v.removeEventListener('pause',stop);v.removeEventListener('seeked',paint);};
 },[film]);
 useEffect(()=>{const v=ref.current;if(!v||reduced)return;if(visible)v.play().catch(()=>{});else v.pause();},[visible,reduced]);
 const toggle=()=>{const v=ref.current;v.paused?v.play().catch(()=>{}):v.pause();};
 return <figure ref={box} className="cg-monitor">
  <div className="cg-monitor-screen">
   <video ref={ref} muted loop playsInline preload="metadata" poster={`/video/${film.stem}-film.jpg`} aria-label={en?'Common Ground, the launch film, silent':'Common Ground 宣传片，无声'}><source src={`/video/${film.stem}-film.mp4`} type="video/mp4"/></video>
   <span className="cg-safe is-action" aria-hidden="true"/><span className="cg-safe is-title" aria-hidden="true"/>
   <span className="cg-hud is-tl" aria-hidden="true">{film.file}</span>
   <span className="cg-hud is-tr" aria-hidden="true">1920×1080 · 60 FPS</span>
   <span className="cg-hud is-bl" aria-hidden="true">{en?'SHOT':'镜头'} <b ref={shot}>01</b> / 14</span>
   <span className="cg-hud is-br" aria-hidden="true"><b ref={tc}>00:00</b> / 31:42</span>
   <button type="button" className="cg-monitor-play" onClick={toggle} aria-label={playing?(en?'Pause the film':'暂停'):(en?'Play the film':'播放')}>{playing?'❚❚':'▶'}</button>
  </div>
  <figcaption className="cg-monitor-cap"><span>{en?'Guides drawn by this page: action-safe (90%) and title-safe (80%). Round 2 asked for a title-safe zone nothing else enters.':'虚线是这一页画上去的：动作安全区（90%）和标题安全区（80%）。第 2 轮评审要求，标题安全区里不能进别的东西。'}</span></figcaption>
 </figure>;
}

function Hero({film,lang,reduced,back,onWatch}){
 const en=lang==='en',first=ROUNDS[0].total,last=ROUNDS[ROUNDS.length-1].total;
 return <header className="cg-hero">
  <div className="cg-wrap">
   <div className="cg-topbar"><a href="/other-project" onClick={back}>← Other Project</a><span>{en?'Launch film · how it was made':'宣传片 · 怎么做出来的'}</span><span className="cg-topbar-r">{en?'Review log':'评审记录'} · {ROUNDS.length} {en?'rounds':'轮'}</span></div>
   <div className="cg-hero-grid">
    <div className="cg-hero-copy">
     <h1>{film.name}</h1>
     <p className="cg-hero-lead">{en
      ?`A ${film.duration}-second launch film, rendered from React code with Remotion, then reviewed six times. This page is its review log: what each round flagged, the rule it became, the code that changed, and the score after.`
      :`一支 ${film.duration} 秒的宣传片，用 Remotion 从 React 代码渲染出来，前后评审了六轮。这一页是它的评审记录：每一轮指出了什么，变成了哪条规则，代码改了什么，下一轮得了几分。`}</p>
     <div className="cg-hero-score" role="img" aria-label={en?`Review score from ${first} to ${last} over ${ROUNDS.length} rounds`:`评审分数 ${ROUNDS.length} 轮从 ${first} 到 ${last}`}>
      <span className="cg-hero-num" aria-hidden="true">{first}<i>→</i><b>{last}</b></span>
      <span className="cg-hero-bars" aria-hidden="true">{ROUNDS.map((r,i)=><i key={r.n} style={{'--h':(r.total-50)/50,'--i':i}}/>)}</span>
     </div>
     <div className="cg-actions">
      <button type="button" className="cg-btn is-primary" onClick={onWatch}>▶ {en?'Watch the film':'看片子'}</button>
      <a className="cg-btn" href="#cg-log" onClick={e=>{e.preventDefault();document.getElementById('cg-log')?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});}}>{en?'Read the log':'看评审记录'} ↓</a>
     </div>
    </div>
    <Monitor film={film} lang={lang} reduced={reduced}/>
   </div>
   <dl className="cg-meta">
    {[[en?'Length':'时长',`${film.duration} s`],[en?'Frame':'画幅','1920 × 1080'],[en?'Rate':'帧率','60 fps'],[en?'Shots':'镜头',`14 · ${film.cuts.length} ${en?'cuts':'个硬切'}`],[en?'Blur':'模糊',en?'16 samples, 180°':'16 个采样，180°'],[en?'Built with':'工具','Remotion · React · Node'],[en?'Sound':'声音',en?'None on this site':'本站无声']].map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}
   </dl>
  </div>
 </header>;
}

/* ── 01 · the loop ────────────────────────────────────────────────────────────────────────────────────────────── */
function Loop({lang,reduced}){
 const en=lang==='en',N=LOOP.length;
 return <div className={'cg-loop'+(reduced?' is-still':'')}>
  <div className="cg-ring" aria-hidden="true">
   <svg viewBox="0 0 400 400"><circle cx="200" cy="200" r="150"/><circle className="cg-ring-tick" cx="200" cy="200" r="150"/></svg>
   <div className="cg-ring-orbit"><i/></div>
   {LOOP.map((s,i)=>{const a=(-90+i*360/N)*Math.PI/180;return <span key={i} className="cg-ring-node" style={{left:`${50+37.5*Math.cos(a)}%`,top:`${50+37.5*Math.sin(a)}%`,'--i':i}}><i/><b>{s.k[lang]}</b></span>;})}
   <div className="cg-ring-core"><b>×6</b><span>58 → 87</span><em>{en?'one night':'一夜'}</em></div>
  </div>
  <ol className="cg-steps">{LOOP.map((s,i)=><Reveal as="li" key={i} delay={i*70}>
   <span className="cg-steps-n">{pad(i+1)}</span>
   <div><h3>{s.k[lang]}</h3><p>{s.body[lang]}</p><code>{s.file}</code></div>
  </Reveal>)}</ol>
 </div>;
}

/* ── code diffs, as in a pull request ─────────────────────────────────────────────────────────────────────────── */
const TOKEN=/(\/\/.*$|^\s*\/?\*.*$|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`|\b\d+(?:\.\d+)?(?:e-?\d+)?\b)/;
function Code({text}){
 const parts=text.split(TOKEN);
 return parts.map((p,i)=>{
  if(!p||i%2===0)return p;
  if(/^\s*(\/\/|\/?\*)/.test(p))return <i key={i} className="tc">{p}</i>;
  if(/^["`]/.test(p))return <b key={i} className="ts">{p}</b>;
  return <em key={i} className="tn">{p}</em>;
 });
}
function Diff({d,lang}){
 const en=lang==='en',add=d.lines.filter(l=>l[0]==='+').length,del=d.lines.filter(l=>l[0]==='-').length;
 const tag=d.proposed?(en?'proposed · not applied':'建议 · 尚未改'):d.isNew?(en?'new file':'新文件'):d.shared?(en?'shared kit · every film':'共用 kit · 所有片子'):null;
 return <div className={'cg-diff'+(d.proposed?' is-proposed':'')}>
  <div className="cg-diff-file"><span className="cg-diff-path">{d.file}</span>{tag&&<span className="cg-diff-tag">{tag}</span>}<span className="cg-diff-n"><b>+{add}</b> <i>−{del}</i></span></div>
  <pre tabIndex={0} aria-label={(en?'Code change in ':'代码改动：')+d.file}><code>{d.lines.map(([s,t],i)=>s==='…'
   ?<span key={i} className="cg-dl is-gap" aria-hidden="true"><span className="cg-dl-s">⋯</span></span>
   :<span key={i} className={'cg-dl'+(s==='+'?' is-add':s==='-'?' is-del':'')}><span className="cg-dl-s" aria-hidden="true">{s===' '?'':s}</span><span className="cg-sr">{s==='+'?(en?'added: ':'新增：'):s==='-'?(en?'removed: ':'删除：'):''}</span><Code text={t}/></span>)}</code></pre>
 </div>;
}

/* ── the shutter: averaging N samples per frame, live ─────────────────────────────────────────────────────────── */
/* A demonstration, not frames from the film. Each output frame of a 30 fps film (the review renders were 30 fps) is
   made of N samples spread over the first half of the frame (a 180° shutter, forward from the frame's start, as in
   subframes.tsx). "8-bit layers" rounds every sample to whole 8-bit levels at 1/N strength and adds them, the way the
   in-browser blur stacks its layers; "16-bit" sums the samples and divides once, as render-mb.mjs does. */
const FILM_FPS=30,PLEX=`"CP Plex Sans","IBM Plex Sans",system-ui,sans-serif`;
const clamp01=x=>Math.min(1,Math.max(0,x)),prog=(t,a,b)=>clamp01((t-a)/(b-a));
const smoother=x=>x<=0?0:x>=1?1:x*x*x*(x*(6*x-15)+10);
const expoOut=x=>x>=1?1:1-Math.pow(2,-10*x),quartOut=x=>1-Math.pow(1-clamp01(x),4);

function shutter(out,scr,{W,H,F,N,bits,view,draw,key}){
 const times=Array.from({length:N},(_,j)=>(F+(N>1?j/(2*N):0))/FILM_FPS);
 const len=W*H*4,img=out.createImageData(W,H),o=img.data,q=new Uint8Array(256);
 for(let v=0;v<256;v++)q[v]=Math.round(v/N);
 const same=N===1||(key&&key(times[0])===key(times[N-1]));
 if(same){
  draw(scr,times[0]);const d=scr.getImageData(0,0,W,H).data;
  for(let i=0;i<len;i+=4)for(let c=0;c<3;c++){const v=d[i+c],r=bits===8?Math.min(255,N*q[v]):v;o[i+c]=view==='error'?Math.max(0,Math.min(255,128+(r-v)*12)):r;}
 }else{
  const sum=new Uint16Array(len),acc=bits===8?new Uint16Array(len):null;
  for(const t of times){draw(scr,t);const d=scr.getImageData(0,0,W,H).data;if(acc)for(let i=0;i<len;i++){sum[i]+=d[i];acc[i]+=q[d[i]];}else for(let i=0;i<len;i++)sum[i]+=d[i];}
  const h=N>>1;
  for(let i=0;i<len;i+=4)for(let c=0;c<3;c++){const k=i+c,exact=sum[k]/N,r=acc?Math.min(255,acc[k]):Math.floor((sum[k]+h)/N);o[k]=view==='error'?Math.max(0,Math.min(255,Math.round(128+(r-exact)*12))):r;}
 }
 for(let i=3;i<len;i+=4)o[i]=255;
 out.putImageData(img,0,0);
}

function useFonts(){
 const [ready,setReady]=useState(!document.fonts);
 useEffect(()=>{if(!document.fonts)return;let alive=true;Promise.all([document.fonts.load(`600 64px ${PLEX}`),document.fonts.load(`400 20px ${PLEX}`)]).finally(()=>alive&&setReady(true));return()=>{alive=false;};},[]);
 return ready;
}

/** One canvas of the lab: redraws whenever the frame or an option changes. */
function ShutterCanvas({scene,F,N,bits,view,label,fonts}){
 const ref=useRef(null),scr=useRef(null);
 useEffect(()=>{
  const c=ref.current;if(!c)return;
  if(c.width!==scene.W){c.width=scene.W;c.height=scene.H;}
  if(!scr.current){const s=document.createElement('canvas');s.width=scene.W;s.height=scene.H;scr.current=s.getContext('2d',{willReadFrequently:true});}
  shutter(c.getContext('2d'),scr.current,{W:scene.W,H:scene.H,F,N,bits,view,draw:scene.draw,key:scene.key});
 },[scene,F,N,bits,view,fonts]);
 return <canvas ref={ref} width={scene.W} height={scene.H} role="img" aria-label={label}/>;
}

// scene: a fast pill on a light page (where the blotches showed)
const STACK=(()=>{
 const W=560,H=180,PW=250,PH=70,loop=1.9;let bg=null;
 const xAt=t=>{const u=((t%loop)+loop)%loop;const k=u<.6?smoother(u/.6):u<.95?1:u<1.55?1-smoother((u-.95)/.6):0;return 22+k*(W-44-PW);};
 const draw=(g,t)=>{
  if(!bg){const b=document.createElement('canvas');b.width=W;b.height=H;const x=b.getContext('2d');const lg=x.createLinearGradient(0,0,W,H);lg.addColorStop(0,'#f8f4ec');lg.addColorStop(1,'#e2e8f1');x.fillStyle=lg;x.fillRect(0,0,W,H);const rg=x.createRadialGradient(W*.7,H*.2,10,W*.7,H*.2,W*.6);rg.addColorStop(0,'rgba(255,255,255,.55)');rg.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=rg;x.fillRect(0,0,W,H);x.fillStyle='rgba(11,12,20,.16)';x.fillRect(22,150,W-44,2);for(let i=0;i<=8;i++)x.fillRect(22+i*(W-46)/8,144,2,14);bg=b;}
  g.drawImage(bg,0,0);const x=xAt(t),y=58;
  g.fillStyle='#33b1ff';g.beginPath();g.roundRect?g.roundRect(x,y,PW,PH,PH/2):g.rect(x,y,PW,PH);g.fill();
  g.fillStyle='#0b0c14';g.font=`600 27px ${PLEX}`;g.textAlign='center';g.textBaseline='middle';g.fillText('Plan B · $230/mo',x+PW/2,y+PH/2+1);
 };
 return {W,H,loop:Math.round(loop*FILM_FPS),draw,key:t=>xAt(t).toFixed(3),start:9};
})();
// scene: the bills counter sweeping toward $40,000, as in the film's $600 shot
const counterScene=held=>{
 const W=560,H=170,loop=2.6;
 const bills=t=>{const u=((t%loop)+loop)%loop;return Math.round(40000*Math.pow(smoother(prog(u,.3,1.9)),2.2)/10)*10;};
 const valueAt=t=>bills(held?Math.floor(t*FILM_FPS+1e-6)/FILM_FPS:t);
 const draw=(g,t)=>{
  g.fillStyle='#1c0a12';g.fillRect(0,0,W,H);
  g.textAlign='right';g.textBaseline='alphabetic';g.fillStyle='rgba(255,255,255,.58)';g.font=`400 26px ${PLEX}`;g.fillText('Covered bills this year',W-30,54);
  g.fillStyle='#fff';g.font=`600 66px ${PLEX}`;g.fillText(money(valueAt(t)),W-30,128);
 };
 return {W,H,loop:Math.round(loop*FILM_FPS),draw,key:t=>valueAt(t),start:36};
};
const COUNTER_FREE=counterScene(false),COUNTER_HELD=counterScene(true);
// scene: "Plan B never is." leaving its slot, with the kit's exit before and after round 6 (kinetic.tsx Swap)
const exitScene=after=>{
 const W=720,H=140,loop=2.2,LH=100.8,MASK=114.24,top=(H-MASK)/2,OUT=43/FILM_FPS; // the exit starts on a frame boundary, as in the film
 const state=t=>{const u=((t%loop)+loop)%loop;
  const pin=(after?quartOut:expoOut)(prog(u,.2,.7));
  const pout=after?smoother(prog(u,OUT,OUT+.22)):expoOut(prog(u,OUT,OUT+.28));
  if(pin<=0||pout>=1)return null;
  return {y:(1-pin)*LH-pout*(after?.24:1)*LH,a:after?1-pout:1};};
 const draw=(g,t)=>{
  g.fillStyle='#0b0c14';g.fillRect(0,0,W,H);const s=state(t);if(!s)return;
  g.save();g.beginPath();g.rect(0,top,W,MASK);g.clip();g.globalAlpha=s.a;g.fillStyle='#ff6b73';g.font=`600 84px ${PLEX}`;g.textAlign='left';g.textBaseline='middle';g.fillText('Plan B never is.',26,top+LH/2+2+s.y);g.restore();
 };
 return {W,H,loop:Math.round(loop*FILM_FPS),draw,key:t=>{const s=state(t);return s?s.y.toFixed(3)+'/'+s.a.toFixed(3):'-';},start:43};
};
const EXIT_BEFORE=exitScene(false),EXIT_AFTER=exitScene(true);

/** The play clock shared by a lab's canvases: 30 film frames a second, only while on screen. */
function useLabClock(loop,start,reduced,box){
 const [F,setF]=useState(start),[playing,setPlaying]=useState(!reduced),visible=useVisible(box,'80px 0px');
 const fRef=useRef(start);fRef.current=F;
 useEffect(()=>{
  if(!playing||!visible)return;let raf=0;const t0=performance.now()-fRef.current/FILM_FPS*1000;
  const tick=now=>{const f=Math.floor((now-t0)/1000*FILM_FPS)%loop;if(f!==fRef.current){fRef.current=f;setF(f);}raf=requestAnimationFrame(tick);};
  raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf);
 },[playing,visible,loop]);
 const step=d=>{setPlaying(false);setF(f=>(f+d+loop)%loop);};
 const keys=e=>{if(e.target!==e.currentTarget)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();step(e.key==='ArrowRight'?1:-1);}else if(e.key===' '){e.preventDefault();setPlaying(p=>!p);}};
 return {F,playing,setPlaying,step,keys};
}

function Seg({label,value,options,onChange}){
 return <div className="cg-seg" role="group" aria-label={label}><span className="cg-seg-k">{label}</span>{options.map(([v,t])=><button key={String(v)} type="button" aria-pressed={value===v} onClick={()=>onChange(v)}>{t}</button>)}</div>;
}
function Transport({clock,loop,lang}){
 const en=lang==='en';
 return <div className="cg-transport">
  <button type="button" onClick={()=>clock.setPlaying(p=>!p)} aria-label={clock.playing?(en?'Pause':'暂停'):(en?'Play':'播放')}>{clock.playing?'❚❚':'▶'}</button>
  <button type="button" onClick={()=>clock.step(-1)} aria-label={en?'Previous frame':'上一帧'}>←</button>
  <button type="button" onClick={()=>clock.step(1)} aria-label={en?'Next frame':'下一帧'}>→</button>
  <span className="cg-transport-f" aria-live="off">{en?'FRAME':'帧'} {pad(clock.F+1)} / {loop} · 30 fps</span>
 </div>;
}

function BlurLab({lang,reduced}){
 const en=lang==='en',box=useRef(null),fonts=useFonts();
 const [tab,setTab]=useState('stack'),[N,setN]=useState(8),[bits,setBits]=useState(8),[view,setView]=useState('picture'),[held,setHeld]=useState(false);
 const scene=tab==='stack'?STACK:held?COUNTER_HELD:COUNTER_FREE;
 const clock=useLabClock(scene.loop,scene.start,reduced,box);
 const n=tab==='stack'?N:16,b=tab==='stack'?bits:16,v=tab==='stack'?view:'picture';
 const caption=tab==='stack'
  ?(N===1?(en?'One sample per frame: sharp, but the pill jumps from frame to frame with no blur between.':'每帧一个采样：清楚，但胶囊在帧与帧之间直接跳，没有拖影。')
   :bits===8?(en?`${N} layers, each rounded to 8 bits at 1/${N} strength, then added. Fast moves show ${N} separate copies, and the rounding shifts the light page’s colour in bands. Switch to “Error ×12” to see where.`:`${N} 层，每层先按 1/${N} 的强度取整到 8 位，再加起来。快速移动时能看到 ${N} 份分开的副本，取整还让浅色底的颜色一条一条地偏。切到“误差 ×12”看偏在哪里。`)
   :(en?`${N} samples summed in 16-bit and divided once. The page keeps its colour; only the moving pill carries blur${N<16?', still in visible steps':''}.`:`${N} 个采样用 16 位相加，只除一次。底色保持原样，只有移动的胶囊带拖影${N<16?'，但还能看出一格一格的台阶':''}。`))
  :held?(en?'Held for the frame (frameT): all 16 samples read the same value, so every digit is whole.':'整帧取同一个值（frameT）：16 个采样读到的数一样，每个数字都是完整的。')
   :(en?'Each sample reads the counter at its own instant. While the bills sweep, the 16 samples hold different numbers and average into overlapping digits.':'每个采样在自己的那一刻读计数器。账单扫动时，16 个采样里是不同的数，平均下来数字就叠在一起。');
 return <figure ref={box} className="cg-lab" tabIndex={0} onKeyDown={clock.keys} aria-label={en?'Shutter lab: arrow keys step a frame, space plays or pauses':'快门实验：方向键逐帧，空格播放或暂停'}>
  <div className="cg-lab-top">
   <span className="cg-lab-k">{en?'Demo · simulated live in your browser, not frames from the film':'演示 · 在你的浏览器里实时模拟，不是片中画面'}</span>
   <div className="cg-tabs" role="tablist">{[['stack',en?'Stacking':'叠加'],['counter',en?'Counters':'计数器']].map(([k,t])=><button key={k} type="button" role="tab" aria-selected={tab===k} onClick={()=>setTab(k)}>{t}</button>)}</div>
  </div>
  <div className="cg-lab-view"><ShutterCanvas scene={scene} F={clock.F} N={n} bits={b} view={v} fonts={fonts} label={caption}/></div>
  <div className="cg-lab-ctl">
   <Transport clock={clock} loop={scene.loop} lang={lang}/>
   {tab==='stack'?<>
    <Seg label={en?'Samples':'采样'} value={N} onChange={setN} options={[[1,'1'],[8,'8'],[16,'16']]}/>
    <Seg label={en?'Stacking':'叠加方式'} value={bits} onChange={setBits} options={[[8,en?'8-bit layers':'8 位分层'],[16,en?'16-bit sum':'16 位求和']]}/>
    <Seg label={en?'View':'显示'} value={view} onChange={setView} options={[['picture',en?'Picture':'画面'],['error',en?'Error ×12':'误差 ×12']]}/>
   </>:<Seg label={en?'Counter':'计数器'} value={held} onChange={setHeld} options={[[false,en?'Value per sample':'每个采样各取各的'],[true,en?'Held for the frame':'整帧取一个值']]}/>}
  </div>
  <figcaption className="cg-lab-cap">{caption}</figcaption>
 </figure>;
}

function ExitLab({lang,reduced}){
 const en=lang==='en',box=useRef(null),fonts=useFonts(),[zoom,setZoom]=useState(false);
 const clock=useLabClock(EXIT_BEFORE.loop,EXIT_BEFORE.start,reduced,box);
 return <figure ref={box} className={'cg-lab cg-exit'+(zoom?' is-zoom':'')} tabIndex={0} onKeyDown={clock.keys} aria-label={en?'Headline exit lab: arrow keys step a frame':'标题退场实验：方向键逐帧'}>
  <div className="cg-lab-top"><span className="cg-lab-k">{en?'Demo · the kit’s two exits, simulated under a 16-sample shutter at 30 fps':'演示 · kit 里前后两种退场，在 16 个采样、30 帧的快门下模拟'}</span></div>
  {[[EXIT_BEFORE,en?'Round 5 · slides out, expoOut over 0.28 s':'第 5 轮 · 向上滑出，expoOut，0.28 秒'],[EXIT_AFTER,en?'Round 6 · fades with a 24% lift, smoother over 0.22 s':'第 6 轮 · 淡出并上移 24%，smoother，0.22 秒']].map(([s,l],i)=><div key={i} className={'cg-exit-row'+(i?' is-after':'')}>
   <span className="cg-exit-l">{l}</span>
   <div className="cg-lab-view"><ShutterCanvas scene={s} F={clock.F} N={16} bits={16} view="picture" fonts={fonts} label={l}/></div>
  </div>)}
  <div className="cg-lab-ctl"><Transport clock={clock} loop={EXIT_BEFORE.loop} lang={lang}/><Seg label={en?'Zoom':'放大'} value={zoom} onChange={setZoom} options={[[false,'×1'],[true,'×3']]}/></div>
  <figcaption className="cg-lab-cap">{en?'Step to frames 44 and 45. As the old exit starts, it moves up to 2.6 px between samples at the film’s size, so the 16 samples print as stacked copies; two frames later it is gone. The new one moves less than a pixel per sample and fades as it goes.':'逐帧看第 44 和 45 帧。按片子的尺寸，旧的退场一开始两个采样之间要移动多达 2.6 px，16 个采样就印成一层层的副本，两帧之后字已经不见了。新的每个采样移动不到 1 px，一边移一边淡出。'}</figcaption>
 </figure>;
}

/* ── 02 · the review log, with a sticky score panel ───────────────────────────────────────────────────────────── */
function Bars({sub,lang,prev}){
 return <ul className="cg-bars">{RUBRIC.map((r,i)=>{const d=prev?sub[i]-prev[i]:0;return <li key={r.key} className={'is-'+r.key}>
  <span className="cg-bars-k">{r[lang]}</span>
  <span className="cg-bars-t" aria-hidden="true"><i style={{transform:`scaleX(${sub[i]/r.max})`}}/></span>
  <span className="cg-bars-v">{sub[i]}<small>/{r.max}</small>{d>0&&<em>+{d}</em>}</span>
 </li>;})}</ul>;
}

function ScorePanel({active,lang,reduced,onJump}){
 const en=lang==='en',idx=Math.min(active,ROUNDS.length)-1,r=ROUNDS[idx],prev=ROUNDS[idx-1],scored=active<=ROUNDS.length;
 const total=useStepTo(r.total,reduced);
 const state=active===7?(en?'After round 6 · not scored':'第 6 轮之后 · 没有打分'):active===8?(en?'Open · found while making this page':'待解决 · 做这一页时发现'):`${en?'Round':'第'} ${pad(r.n)}${en?'':' 轮'} / ${pad(ROUNDS.length)}`;
 return <aside className={'cg-panel'+(scored?'':' is-off')} aria-label={en?'Review score':'评审分数'}>
  <p className="cg-panel-k">{state}</p>
  <p className="cg-panel-total"><b>{total}</b><span>/100</span>{prev&&scored&&<em>+{r.total-prev.total}</em>}</p>
  <Bars sub={r.sub} lang={lang} prev={scored?prev?.sub:null}/>
  <div className="cg-chart">
   <span className="cg-chart-goal" style={{'--y':(95-50)/50}}><i>{en?'95 asked for':'要求 95'}</i></span>
   {ROUNDS.map((x,i)=><button key={x.n} type="button" className={'cg-chart-col'+(i===idx&&scored?' is-on':'')+(i<idx||!scored?' is-past':'')} style={{'--h':(x.total-50)/50}} onClick={()=>onJump(x.n)} aria-label={en?`Round ${x.n}: ${x.total}`:`第 ${x.n} 轮：${x.total} 分`}><i/><b>{x.total}</b><span>R{x.n}</span></button>)}
  </div>
  <p className="cg-panel-foot">{en?'Motion 30 · Craft 30 · Story 25 · Polish 15':'动效 30 · 工艺 30 · 叙事 25 · 完成度 15'}</p>
 </aside>;
}

function Block({label,children,className}){
 return <div className={'cg-block'+(className?' '+className:'')}><p className="cg-block-k">{label}</p>{children}</div>;
}

function Round({r,lang,reduced}){
 const en=lang==='en',next=ROUNDS[r.n];
 return <article id={'cg-r'+r.n} data-round={r.n} className="cg-round">
  <header className="cg-round-h">
   <span className="cg-round-badge">R{r.n}</span>
   <span className="cg-round-meta">{en?'Round':'第'} {pad(r.n)}{en?'':' 轮'} · {en?'render':'版本'} {r.film[lang]}</span>
   <span className="cg-round-score"><b>{r.total}</b>{next?<> → {next.total} <em>+{next.total-r.total}</em></>:<> · {en?'last review':'最后一次评审'}</>}</span>
  </header>
  <h3>{r.title[lang]}</h3>
  <div className="cg-round-inline"><Bars sub={r.sub} lang={lang} prev={ROUNDS[r.n-2]?.sub}/></div>
  <Block label={en?'Flagged by the reviewer':'评审指出'}>
   <ul className="cg-flags">{r.flagged.map((f,i)=><li key={i}><span className="cg-flags-t">{typeof f.t==='string'?f.t+' s':f.t[lang]}</span><span>{f[lang]}</span></li>)}</ul>
  </Block>
  {r.rules&&<Block label={en?'Became a rule':'变成规则'} className="is-rule"><ul className="cg-rules">{r.rules.map((x,i)=><li key={i}>{x[lang]}</li>)}</ul></Block>}
  {r.verdict&&<Block label={en?'Verdict':'结论'} className="is-rule"><p className="cg-verdict">{r.verdict[lang]}</p></Block>}
  {r.diffs&&<Block label={en?'What changed in the code':'代码改了什么'}>{r.diffs.map((d,i)=><Diff key={i} d={d} lang={lang}/>)}</Block>}
  {r.note&&<p className="cg-note">{r.note[lang]}</p>}
  {r.demo==='blur'&&<BlurLab lang={lang} reduced={reduced}/>}
  {r.demo==='exit'&&<ExitLab lang={lang} reduced={reduced}/>}
  {r.next&&<p className="cg-next"><span>{en?`Round ${r.n+1} said`:`第 ${r.n+1} 轮的评价`}</span>{r.next[lang]}</p>}
 </article>;
}

function After({lang}){
 const en=lang==='en';
 return <article id="cg-r7" data-round={7} className="cg-round is-after">
  <header className="cg-round-h"><span className="cg-round-badge">R6+</span><span className="cg-round-meta">{en?'After round 6 · my own viewing · no score':'第 6 轮之后 · 我自己看 · 没有分数'}</span></header>
  <h3 lang="zh">{AFTER.quote}</h3>
  <p className="cg-after-body">{AFTER.body[lang]}</p>
  <Block label={en?'Became a rule':'变成规则'} className="is-rule"><ul className="cg-rules">{AFTER.rules.map((x,i)=><li key={i}>{x[lang]}</li>)}</ul></Block>
  <Block label={en?'What changed in the code':'代码改了什么'}>{AFTER.diffs.map((d,i)=><Diff key={i} d={d} lang={lang}/>)}</Block>
  <p className="cg-note">{AFTER.note[lang]}</p>
 </article>;
}

function Open({lang,onStep}){
 const en=lang==='en';
 return <article id="cg-r8" data-round={8} className="cg-round is-open">
  <header className="cg-round-h"><span className="cg-round-badge">!</span><span className="cg-round-meta">{en?'Open · found while making this page':'待解决 · 做这一页时发现'}</span></header>
  <h3>{OPEN.title[lang]}</h3>
  <p className="cg-after-body">{OPEN.body[lang]}</p>
  <Diff d={OPEN.diff} lang={lang}/>
  <button type="button" className="cg-link" onClick={onStep}>{en?'See frame 786 in the stepper':'在逐帧检查里看第 786 帧'} ↓</button>
 </article>;
}

function Log({lang,reduced,onStep}){
 const en=lang==='en',ref=useRef(null),[active,setActive]=useState(1);
 useEffect(()=>{
  const els=[...ref.current.querySelectorAll('[data-round]')];
  const io=new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting)setActive(+e.target.dataset.round);},{rootMargin:'-42% 0px -52% 0px'});
  els.forEach(el=>io.observe(el));return()=>io.disconnect();
 },[]);
 const jump=n=>document.getElementById('cg-r'+n)?.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
 return <div ref={ref} className="cg-log">
  <div className="cg-log-side"><ScorePanel active={active} lang={lang} reduced={reduced} onJump={jump}/></div>
  <div className="cg-log-main">
   {ROUNDS.map(r=><Round key={r.n} r={r} lang={lang} reduced={reduced}/>)}
   <After lang={lang}/>
   <Open lang={lang} onStep={onStep}/>
  </div>
 </div>;
}

/* ── 03 · frame by frame: 32 consecutive frames of the site's file ─────────────────────────────────────────────── */
function Stepper({lang,reduced,media,stepperRef,goTo}){
 const en=lang==='en',[i,setI]=useState(11),[bright,setBright]=useState(false),near=useVisible(stepperRef,'900px 0px'),img=useRef(null),want=useRef(0),cache=useRef([]);
 const cutAt=STEPS.findIndex(s=>s[0]===OPEN.frame);
 useEffect(()=>{if(near&&!cache.current.length)cache.current=STEPS.map(([f])=>{const im=new Image();im.decoding='async';im.src=`${media}/frames/f${f}.webp`;return im;});},[near,media]);
 useEffect(()=>{if(goTo.n)setI(cutAt);},[goTo,cutAt]);
 useEffect(()=>{
  want.current=i;const im=cache.current[i],src=`${media}/frames/f${STEPS[i][0]}.webp`;
  if(!im){if(img.current)img.current.src=src;return;}
  (im.decode?im.decode():Promise.resolve()).catch(()=>{}).then(()=>{if(want.current===i&&img.current)img.current.src=src;});
 },[i,media,near]);
 const [f,held,lo,hi]=STEPS[i],t=f/60,shot=f>=786?6:5;
 const keys=e=>{const d={ArrowRight:1,ArrowLeft:-1}[e.key];if(d){e.preventDefault();setI(x=>Math.max(0,Math.min(STEPS.length-1,x+d)));}else if(e.key==='Home'){e.preventDefault();setI(0);}else if(e.key==='End'){e.preventDefault();setI(STEPS.length-1);}};
 const note=f===785?(en?'Last frame of shot 05.':'第 05 个镜头的最后一帧。'):f===786?(en?'First frame of shot 06. One of its 16 samples is still shot 05: turn on Brighten to see the faint second “+$600”.':'第 06 个镜头的第一帧。它的 16 个采样里有一个还是第 05 个镜头：打开“提亮”能看到很淡的第二个 “+$600”。'):null;
 return <div className={'cg-stepper'+(bright?' is-bright':'')}>
  <div className="cg-stepper-stage" tabIndex={0} onKeyDown={keys} role="group" aria-label={en?'Frame stepper: left and right arrow keys step one frame':'逐帧查看：左右方向键一次走一帧'}>
   <img ref={img} src={`${media}/frames/f${STEPS[0][0]}.webp`} width="1280" height="720" alt={en?`Frame ${f} of the film, ${t.toFixed(3)} s: the bills counter reads ${money(held)}`:`片子第 ${f} 帧，${t.toFixed(3)} 秒：账单计数器显示 ${money(held)}`} decoding="async"/>
   <span className="cg-stepper-tc" aria-hidden="true">{en?'FRAME':'帧'} {pad(f,4)} · {t.toFixed(3)} s</span>
   {f===786&&<span className="cg-stepper-flag" aria-hidden="true">{en?'CUT · 13.100 s':'剪辑点 · 13.100 s'}</span>}
  </div>
  <div className="cg-stepper-side">
   <div className="cg-stepper-read" aria-live="polite">
    <p className="cg-stepper-k">{en?'Shot':'镜头'} {pad(shot)} / 14 · {SHOTS[shot-1][lang]}</p>
    <img className="cg-stepper-crop" src={`${media}/frames/c${f}.webp`} width="360" height="130" alt="" loading="lazy" decoding="async"/>
    <p className="cg-stepper-v"><span>{en?'Drawn':'画面上'}</span><b>{money(held)}</b></p>
    <p className="cg-stepper-v"><span>{en?'Unheld, its 16 samples':'若不按帧取值，16 个采样'}</span><b className="is-dim">{money(lo)}–{money(hi)}</b></p>
    {note&&<p className="cg-stepper-note">{note}</p>}
   </div>
   <div className="cg-stepper-ctl">
    <button type="button" onClick={()=>setI(x=>Math.max(0,x-1))} disabled={i===0} aria-label={en?'Previous frame':'上一帧'}>←</button>
    <div className="cg-stepper-track">
     <input type="range" min="0" max={STEPS.length-1} step="1" value={i} onChange={e=>setI(+e.target.value)} aria-label={en?'Frame':'帧'} aria-valuetext={`${en?'Frame':'帧'} ${f}`}/>
     <span className="cg-stepper-ticks" aria-hidden="true">{STEPS.map((s,k)=><i key={s[0]} className={(k===i?'is-on':'')+(k===cutAt?' is-cut':'')}/>)}</span>
    </div>
    <button type="button" onClick={()=>setI(x=>Math.min(STEPS.length-1,x+1))} disabled={i===STEPS.length-1} aria-label={en?'Next frame':'下一帧'}>→</button>
   </div>
   <button type="button" className="cg-toggle" aria-pressed={bright} onClick={()=>setBright(b=>!b)}>{en?'Brighten ×3 to see faint layers':'提亮 ×3，看清很淡的层'}</button>
  </div>
  <p className="cg-stepper-foot">{en?'Frames 772–803 of the file on this site, one image per frame. The values beside them are computed with the film’s own code (billsAt, the re-pacing table and frameT) and match the pixels.':'这是本站视频文件的第 772–803 帧，一帧一张图。旁边的数值是用片子自己的代码（billsAt、重新定速的表和 frameT）算出来的，和画面上的像素一致。'}</p>
 </div>;
}

/* ── 04 · measured: every frame of the final file ──────────────────────────────────────────────────────────────── */
function Scope({film,lang,media}){
 const en=lang==='en',D=MEASURE.diff,L=MEASURE.later,n=D.length,DUR=film.duration;
 const wrap=useRef(null),cursor=useRef(null),thumb=useRef(null),[f,setF]=useState(42),[w,setW]=useState(0),down=useRef(false);
 const minAt=useMemo(()=>L.reduce((b,v,i)=>v<L[b]?i:b,0),[L]);
 const top=useMemo(()=>'M'+D.map((v,i)=>`${i},${(100-Math.min(v,12)/12*96).toFixed(1)}`).join('L'),[D]);
 const ly=v=>100-clamp01((Math.log10(Math.max(v,.5))+.3)/2.5)*100;
 const low=useMemo(()=>'M'+L.map((v,i)=>`${i},${ly(v).toFixed(1)}`).join('L'),[L]);
 useEffect(()=>{const el=wrap.current,ro=new ResizeObserver(()=>setW(el.clientWidth));ro.observe(el);return()=>ro.disconnect();},[]);
 const x=w*f/(n-1),t=f/60,shotI=film.cuts.filter(c=>t>=c-1e-6).length,tile=Math.min(63,Math.floor((t+.26)/.5));
 const tw=thumb.current?.offsetWidth||160,thumbX=Math.max(0,Math.min(w-tw,x-tw/2));
 const at=clientX=>{const r=wrap.current.getBoundingClientRect();setF(Math.round(clamp01((clientX-r.left)/r.width)*(n-1)));};
 const keys=e=>{const d={ArrowRight:1,ArrowLeft:-1}[e.key];if(d){e.preventDefault();setF(v=>Math.max(0,Math.min(n-1,v+d*(e.shiftKey?30:1))));}else if(e.key==='Home'){e.preventDefault();setF(0);}else if(e.key==='End'){e.preventDefault();setF(n-1);}};
 const shots=[0,...film.cuts,DUR];
 return <div className="cg-scope">
  <div className="cg-scope-stats">
   <div><b>{L.filter(v=>v<1).length}</b><span>{en?'holds by the review’s test':'按评审标准的静止段'}</span></div>
   <div><b>{L[minAt].toFixed(2)}</b><span>{en?`closest, at ${(minAt/60).toFixed(2)} s (a hold is under 1.00)`:`最接近的一处，在 ${(minAt/60).toFixed(2)} 秒（低于 1.00 才算静止）`}</span></div>
   <div><b>{film.cuts.length}</b><span>{en?'cuts, all on whole frames':'个硬切，都落在整帧上'}</span></div>
   <div><b>{n.toLocaleString('en-US')}</b><span>{en?'frames measured':'帧，逐帧量过'}</span></div>
  </div>
  <div ref={wrap} className="cg-scope-plot" tabIndex={0} role="slider" aria-label={en?'Measured motion: drag, or use the arrow keys to move a frame (Shift: half a second)':'量出来的运动：拖动，或用方向键一次走一帧（按住 Shift 走半秒）'} aria-valuemin={0} aria-valuemax={n-1} aria-valuenow={f} aria-valuetext={`${t.toFixed(2)} s`}
   onPointerDown={e=>{down.current=true;if(e.pointerType==='mouse')e.currentTarget.setPointerCapture(e.pointerId);at(e.clientX);}}
   onPointerMove={e=>{if(down.current||e.pointerType==='mouse')at(e.clientX);}}
   onPointerUp={()=>{down.current=false;}} onPointerCancel={()=>{down.current=false;}} onKeyDown={keys}>
   <div className="cg-scope-shots" aria-hidden="true">{shots.slice(0,-1).map((s,i)=><span key={s} className={i===shotI?'is-on':undefined} style={{left:`${s/DUR*100}%`,width:`${(shots[i+1]-s)/DUR*100}%`}}><b>{pad(i+1)}</b></span>)}</div>
   <div className="cg-scope-lane" aria-hidden="true">
    <span className="cg-scope-lk">{en?'Change from the frame before':'和前一帧相比的变化'}</span>
    <svg viewBox={`0 0 ${n-1} 100`} preserveAspectRatio="none"><path className="cg-scope-a" d={top}/>{film.cuts.map(c=><line key={c} x1={c*60} x2={c*60} y1="0" y2="100"/>)}</svg>
   </div>
   <div className="cg-scope-lane is-low" aria-hidden="true">
    <span className="cg-scope-lk">{en?'Difference from 0.5 s later (log)':'和 0.5 秒后相比的差异（对数）'}</span>
    <svg viewBox={`0 0 ${n-1} 100`} preserveAspectRatio="none"><line className="cg-scope-th" x1="0" x2={n-1} y1={ly(1)} y2={ly(1)}/><path className="cg-scope-b" d={low}/>{film.cuts.map(c=><line key={c} x1={c*60} x2={c*60} y1="0" y2="100"/>)}</svg>
    <span className="cg-scope-thl">{en?'1.00 · hold':'1.00 · 静止'}</span>
    <span className="cg-scope-min" style={{left:`${minAt/(n-1)*100}%`,top:`${ly(L[minAt])}%`}}/>
   </div>
   <div ref={cursor} className="cg-scope-cursor" style={{transform:`translate3d(${x.toFixed(1)}px,0,0)`}} aria-hidden="true"/>
   <div ref={thumb} className="cg-scope-thumb" style={{transform:`translate3d(${thumbX.toFixed(1)}px,0,0)`,backgroundImage:`url(${media}/filmstrip.webp)`,'--c':tile%10,'--r':Math.floor(tile/10)}} aria-hidden="true"/>
  </div>
  <div className="cg-scope-read" aria-live="polite">
   <span><b>{t.toFixed(2)} s</b> · {en?'frame':'第'} {f}{en?'':' 帧'}</span>
   <span>{en?'Shot':'镜头'} {pad(shotI+1)} · {SHOTS[shotI][lang]}</span>
   <span>{en?'change':'变化'} <b>{D[f].toFixed(2)}</b></span>
   <span>{en?'vs 0.5 s later':'对比 0.5 秒后'} <b>{f<L.length?L[f].toFixed(2):'—'}</b></span>
  </div>
 </div>;
}

export default function CommonGroundPage({lang,reduced,onNavigate,slug}){
 const film=FILMS[slug],en=lang==='en',media='/assets/other-project/'+slug,caseHref='/product/'+film.caseSlug,uid=useId();
 const video=useRef(null),desk=useRef(null),stepperRef=useRef(null),[goTo,setGoTo]=useState({n:0});
 const behavior=reduced?'auto':'smooth';
 const go=to=>event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();onNavigate(to);};
 const watch=()=>{desk.current?.scrollIntoView({behavior,block:'start'});const v=video.current;if(v){v.currentTime=0;v.play().catch(()=>{});}};
 const step=()=>{setGoTo(g=>({n:g.n+1}));stepperRef.current?.scrollIntoView({behavior,block:'start'});};
 return <article className={'st-page cg-page'+(reduced?' st-still':'')} data-nav-tone="dark" style={{'--accent':'#ef5b67'}}>
  <Hero film={film} lang={lang} reduced={reduced} back={go('/other-project')} onWatch={watch}/>

  <section className="cg-sec" aria-labelledby={uid+'-l'}>
   <div className="cg-wrap">
    <Head n="01" label={en?'The loop':'循环'} id={uid+'-l'} title={en?'One loop, six times in one night':'一个循环，一夜跑了六遍'}
     lead={en?'Nothing was cut in an editor or animated in After Effects. The film is a React component: every frame is a pure function of time, so a note on one frame can become a rule in the code, and the next render obeys it everywhere.':'没有在剪辑软件里剪，也没有用 After Effects 做动画。整支片子是一个 React 组件，每一帧都只由时间决定。所以对某一帧的意见可以写成代码里的一条规则，下一次渲染时处处都照着来。'}/>
    <Loop lang={lang} reduced={reduced}/>
   </div>
  </section>

  <section id="cg-log" className="cg-sec" aria-labelledby={uid+'-r'}>
   <div className="cg-wrap">
    <Head n="02" label={en?'Review log':'评审记录'} id={uid+'-r'} title={en?'Six rounds, 58 to 87':'六轮，从 58 到 87'}
     lead={en?'Each entry is one round: what the reviewer flagged in that render, the rule it became, the code that changed, and what the next round said. Times are seconds in that round’s render, 27.8–30 s long at 30 fps.':'每一条是一轮：评审在那一版里指出了什么，变成了哪条规则，代码改了什么，下一轮怎么评价。时间是那一版里的秒数，片长 27.8–30 秒，30 帧。'}/>
    <Log lang={lang} reduced={reduced} onStep={step}/>
   </div>
  </section>

  <section ref={stepperRef} className="cg-sec" aria-labelledby={uid+'-s'}>
   <div className="cg-wrap">
    <Head n="03" label={en?'Frame by frame':'逐帧'} id={uid+'-s'} title={en?'The rules, checked in the final file':'在成片里逐帧核对这些规则'}
     lead={en?'32 frames in a row from the film on this site, 12.87–13.38 s. The bills counter races toward $40,000 at over $1,000 a frame, and the cut at 13.1 s falls between frames 785 and 786. Step with the arrow keys.':'这是本站片子里连续的 32 帧，12.87–13.38 秒。账单计数器冲向 $40,000，最快时一帧涨 $1,000 多；13.1 秒的剪辑点落在第 785 和 786 帧之间。用方向键逐帧看。'}/>
    <Reveal><Stepper lang={lang} reduced={reduced} media={media} stepperRef={stepperRef} goTo={goTo}/></Reveal>
   </div>
  </section>

  <section className="cg-sec" aria-labelledby={uid+'-m'}>
   <div className="cg-wrap">
    <Head n="04" label={en?'Measured':'测量'} id={uid+'-m'} title={en?'Every frame of the final file':'成片的每一帧'}
     lead={en?'Measured for this page from the file on this site: all 1,902 frames at 192 × 108 in greyscale. The top trace is how much the picture changes from the frame before; a camera that stopped and started would dip to zero between moves. The bottom one is the review’s hold test, each frame against the frame 0.5 s later. Red lines are the 13 cuts. Drag across it to see the moment.':'为这一页从本站的视频文件量出来：1,902 帧全部缩到 192 × 108 的灰度。上面那条是每一帧和前一帧相比变了多少；镜头如果走走停停，两段运动之间会掉到零。下面那条是评审用的静止测试：每一帧和 0.5 秒后的那一帧比。红线是 13 个剪辑点。在上面拖动，可以看到对应的画面。'}/>
    <Reveal><Scope film={film} lang={lang} media={media}/></Reveal>
   </div>
  </section>

  <section ref={desk} className="cg-sec" aria-labelledby={uid+'-e'}>
   <div className="cg-wrap">
    <Head n="05" label={en?'The edit':'剪辑台'} id={uid+'-e'} title={en?'Fourteen shots, one timeline':'14 个镜头，一条时间线'}
     lead={en?'The film above its own timeline: beats, headlines, shots and measured motion. Click or drag the timeline to jump; Shift and an arrow key step one frame.':'片子和它自己的时间线：段落、字幕、镜头和量出来的运动。点击或拖动时间线跳转；按住 Shift 再按方向键，一次走一帧。'}/>
    <Reveal><Desk film={film} slug={slug} lang={lang} video={video}/></Reveal>
   </div>
  </section>

  <section className="cg-sec cg-end" aria-labelledby={uid+'-w'}>
   <div className="cg-wrap">
    <Head n="06" label={en?'Where it stopped':'停在哪里'} id={uid+'-w'} title={en?'87, and a list that isn’t empty':'87 分，清单还没清空'}/>
    <div className="cg-end-grid">
     <Reveal as="p">{en?'The score stopped at 87, short of the 95 I had asked for. The reviewer’s last notes were about material, not motion: the four product screens are upscaled screenshots, soft next to a chart drawn in code, and the fix is to redraw them as vector panels. The smoothness work after round 6 had no score at all; it is judged on the curve above. And four cuts still carry one stray sample.':'分数停在 87，没到我要求的 95。评审最后的意见在素材，不在动效：四张产品界面是放大的截图，放在代码画的图表旁边显得发虚，修法是重画成矢量面板。第 6 轮之后为顺滑做的修改没有分数，靠上面那条曲线判断。另外还有四个剪辑点多了一个错位的采样。'}</Reveal>
     <Reveal as="p" delay={80}>{en?'Common Ground is the film’s name for the Choose Not to Lose prototype. What the product does, and why, is in its own case: ':'Common Ground 是片子里给 Choose Not to Lose 原型起的名字。产品做什么、为什么这样做，在它自己的案例里：'}<a href={caseHref} onClick={go(caseHref)}>Choose Not to Lose →</a></Reveal>
    </div>
   </div>
  </section>

  <div className="cg-wrap">
   <NextProject item={nextAfter(slug)} lang={lang} onNavigate={onNavigate}/>
   <footer className="st-footer"><span>JAY LIN / {film.name.toUpperCase()}</span><p>{en?'A launch film rendered from code, reviewed six times.':'一支用代码渲染、评审了六轮的宣传片。'}</p></footer>
  </div>
 </article>;
}
