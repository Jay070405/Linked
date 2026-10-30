import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {FILMS,nextAfter} from '../product-films-data';
import {Reveal,CountUp,BeforeAfter,NextProject} from '../story/Story';
import {Desk,FPS} from '../story/FilmDesk';
import {LEGS,STEPS,TOTAL_FEET,WAYPOINTS,ADDRESS,GARAGE_PHOTO} from '../../product/v2/data/l100-route.js';
import './last-hundred-feet-page.css';

/* Last 100 Feet: the page is the route. It opens on the film's pin leap, scrubbed by scroll, then a red route runs
   down the page from the Elm St curb to door 214 (290 ft, the prototype's own legs). Each of the five stops carries one
   part of the story: the problem and the product to try, the design decisions, how the film tells it, the craft, and
   the film itself at the door. One rAF-throttled scroll loop reads layout once per frame, then writes transforms and
   data attributes; React renders only on discrete changes. With `reduced`, everything shows its final state. */

const Demo=lazy(()=>import('../demos/LastHundredFeetDemo'));

const N=24;            // flip frames over film.flip
const SCRUB=.72;       // share of the opening track that scrubs the frames; the rest holds the last frame
const ARRIVE=.8;       // the title arrives here
const READ=.5;         // the route's tip rides at the middle of the screen (the courier pill is sticky at 50dvh)
const FEET=LEGS.reduce((acc,leg)=>[...acc,acc[acc.length-1]+leg.feet],[0]);   // 0, 45, 170, 195, 290
const MEDIA='/assets/other-project/last-100-feet';
const pad=n=>String(n).padStart(2,'0');
const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
/** the stop photos at thumbnail size (the same files the demo uses for its cards) */
const small=src=>src.replace('/proto/last-100-feet/photos/','/assets/product/last-100-feet/photos/');

/** Chinese names for the five waypoints and the prototype's step cards (as in the demo and on the case page). */
const STOP_ZH=[
 {name:'Elm St 路边',instr:'停在橄榄树旁，大门前约 40 英尺处。',alt:'Elm St 上人行大门前的路边，左边是橄榄树，右边是红色路缘'},
 {name:'Elm St 大门',instr:'对讲机在左边门柱上，听到蜂鸣就拉门。',alt:'两段灰泥墙之间的黑色金属人行门，对讲机在左边门柱上'},
 {name:'4 号楼',instr:'小路分岔处靠右。找墙上的金属“4”。',alt:'庭院里一分为二的步道，右侧楼上挂着金属门牌“4”'},
 {name:'楼梯',instr:'走金属楼梯上一层。',alt:'通往二楼的开放式金属楼梯，旁边是“4”号牌'},
 {name:'214 号门',instr:'沿走廊直走。深绿色的门，右边有盆栽。',alt:'二楼走廊上深绿色的 214 号门，门前有椰棕地垫，右边有盆栽'},
];

const EN={
 kicker:'Product concept / launch film',frame:'Frame',cue:'Scroll to scrub',
 opening:(a,b)=>`Frames from ${a} to ${b} s of the film: the pin map apps drop on the garage lifts off, turns red at the top of its arc and lands on door 214.`,
 watch:'Watch the film',walk:'Walk it',meta:(d,s)=>`${d} s · 60 fps · ${s} shots · Product design, film`,
 ft:'ft',stop:i=>`Stop ${pad(i+1)}`,
 problem:'The problem',pinLabel:'Map apps drop the pin here',pinTitle:'Garage gate, Cypress Ave',residents:'Residents only',
 how:'How it works',loading:'Loading the demo…',
 decisions:'Design decisions',decisionsH:'Why it works this way',
 decisionsLead:'Five decisions from the case study, posted along the way: what I tried first and crossed out, and what I chose.',
 tried:'Tried first',chose:'Chose',
 film:'The film',filmH:'How the film tells it',firstCut:'First cut → final',
 craft:'Craft',craftH:'Smooth, frame by frame',
 shots:c=>`shots, ${c} hard cuts on exact frames`,fps:'fps, so slow moves never step',samples:'shutter samples of motion blur in every frame',
 score:'independent review score over six rounds',
 chartLabel:'Frame-to-frame picture change across the film',
 chartCap:(a,b)=>`Picture change from frame to frame, measured from the file on this page. Dashed: the cuts. Shaded: the ${a}–${b} s at the top of this page.`,
 band:'Opening',
 done:`Delivered to ${ADDRESS.unit}`,
 nameNote:`The name points at the stretch from the curb to the door, not at a measurement: this route runs ${TOTAL_FEET} ft.`,
 playAt:t=>`“Delivered.” in the film · ${t} s`,
 filmHead:(d,s)=>`The film · ${d} s · 60 fps · ${s} shots · no sound`,open:'Open video',
 notes:'Review notes',note:'Review note',fix:'What changed',
 fine:'An independent concept, not affiliated with any delivery company, not yet tested with couriers or residents; the address is fictional and the photos are AI-generated illustrations.',
 footer:'A product concept by Jay Lin.',
};
const ZH={
 kicker:'产品概念 / 宣传片',frame:'帧',cue:'向下滚动，逐帧播放',
 opening:(a,b)=>`片中 ${a} 到 ${b} 秒的画面：地图 app 落在车库的定位点飞起来，在弧线最高点变红，落在 214 号门上。`,
 watch:'看片子',walk:'走一遍',meta:(d,s)=>`${d} 秒 · 60 帧 · ${s} 个镜头 · 产品设计、宣传片`,
 ft:'英尺',stop:i=>`第 ${i+1} 站`,
 problem:'问题',pinLabel:'地图 app 定位在这里',pinTitle:'Cypress Ave 车库门',residents:'仅限住户',
 how:'它怎么用',loading:'正在加载演示…',
 decisions:'设计决策',decisionsH:'为什么这样设计',
 decisionsLead:'案例里的五个设计决策，立在路边：先试过又划掉的做法，和最后的选择。',
 tried:'先试过',chose:'最后选了',
 film:'宣传片',filmH:'片子怎么讲这件事',firstCut:'第一版 → 终版',
 craft:'技术',craftH:'一帧一帧地顺下来',
 shots:c=>`个镜头，${c} 个硬切，都落在整帧上`,fps:'帧每秒，慢速运动不会一格一格',samples:'个快门采样，合成每一帧的运动模糊',
 score:'六轮独立评审的分数变化',
 chartLabel:'全片逐帧的画面变化量',
 chartCap:(a,b)=>`从本页播放的文件量出来的逐帧画面变化。虚线是剪辑点；浅红色是页面开头那段 ${a}–${b} 秒。`,
 band:'开场',
 done:`已送达 ${ADDRESS.unit}`,
 nameNote:`片名指的是“从路边到门口”这最后一段，不是一个实测距离：这条路线实际是 ${TOTAL_FEET} 英尺。`,
 playAt:t=>`片中的 “Delivered.” · ${t} 秒`,
 filmHead:(d,s)=>`宣传片 · ${d} 秒 · 60 帧 · ${s} 个镜头 · 无声`,open:'单独打开视频',
 notes:'评审意见',note:'评审意见',fix:'怎么改的',
 fine:'独立概念作品，与任何配送公司无关，还没找骑手或住户测试过；地址是虚构的，照片是 AI 生成的示意图。',
 footer:'林世杰的产品概念。',
};

/* ---------- small primitives ---------- */

const Pin=({red})=><svg className={'lp-pin'+(red?' is-red':'')} viewBox="0 0 28 36" aria-hidden="true"><path d="M14 35C14 35 2.5 22.6 2.5 13A11.5 11.5 0 1 1 25.5 13C25.5 22.6 14 35 14 35Z"/><circle cx="14" cy="13" r="4.4"/></svg>;
const Check=()=><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.6l4.4 4.4L19 7.4"/></svg>;

/** The six review scores as a small line, the last point in red. */
function Spark({values}){
 const w=150,h=28,min=Math.min(...values),max=Math.max(...values);
 const pts=values.map((v,i)=>[4+i/(values.length-1)*(w-8),h-4-(v-min)/(max-min||1)*(h-8)]);
 return <svg className="lp-spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
  <polyline points={pts.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ')}/>
  {pts.map((p,i)=><circle key={i} cx={p[0].toFixed(1)} cy={p[1].toFixed(1)} r="2.6" className={i===pts.length-1?'is-last':undefined}/>)}
 </svg>;
}

/** One scroll loop for the page: on resize it re-measures, on scroll it lets every part read layout, then write.
    Parts register {targets, measure, read, write}; read/write run only when motion is on. */
function usePageLoop(rootRef,reduced){
 const loop=useRef(null);
 if(!loop.current)loop.current={subs:new Set(),kick(){}};
 useEffect(()=>{
  const root=rootRef.current,L=loop.current,scroller=root.closest('.portfolio-page-viewport')||window,view={vh:0};
  let raf=0,dirty=true;
  const run=()=>{
   raf=0;
   if(dirty){dirty=false;view.vh=scroller===window?innerHeight:scroller.clientHeight;L.subs.forEach(s=>s.measure?.(view));}
   if(reduced)return;
   L.subs.forEach(s=>s.read?.(view));
   L.subs.forEach(s=>s.write?.(view));
  };
  const queue=()=>{if(!raf)raf=requestAnimationFrame(run);};
  const invalidate=()=>{dirty=true;queue();};
  L.kick=queue;
  const ro=new ResizeObserver(invalidate);
  ro.observe(root);if(scroller!==window)ro.observe(scroller);
  L.subs.forEach(s=>s.targets?.().forEach(el=>el&&ro.observe(el)));
  if(!reduced)scroller.addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',invalidate);
  invalidate();
  return()=>{cancelAnimationFrame(raf);ro.disconnect();scroller.removeEventListener('scroll',queue);removeEventListener('resize',invalidate);L.kick=()=>{};};
 },[rootRef,reduced]);
 return loop;
}

/* ---------- 1. the opening: the pin leap, scrubbed by scroll ---------- */

function Opening({film,t,reduced,loop,back,onWatch,onWalk}){
 const frames=Array.from({length:N},(_,i)=>`${MEDIA}/flip-${pad(i+1)}.webp`);
 const [from,to]=film.flip,timeOf=i=>from+(to-from)*i/(N-1);
 const [lineA,lineB]=[film.headlines[0],film.headlines[1]],SWITCH=lineB[0];   // 2.04 s: “The door says otherwise.”
 const track=useRef(null),stage=useRef(null),copy=useRef(null),end=useRef(null),bar=useRef(null),num=useRef(null),sec=useRef(null);
 const imgs=useRef([]),api=useRef(null);
 const st=useRef({p:0,lastP:-1,target:0,shown:-1,ready:new Set(),phase:-1,end:null,moved:null});
 const [near,setNear]=useState(false);
 const set=(name,on)=>{const el=stage.current;if(!el)return;if(on)el.setAttribute(name,'');else el.removeAttribute(name);};

 useEffect(()=>{
  const s=st.current;
  // show the target frame once it is decoded; until then keep the nearest ready one (never a blank stage)
  const apply=()=>{
   const list=imgs.current;let k=s.target;
   if(!s.ready.has(k)){k=-1;for(let d=1;d<N&&k<0;d++){if(s.ready.has(s.target-d))k=s.target-d;else if(s.ready.has(s.target+d))k=s.target+d;}}
   if(k>=0&&k!==s.shown&&list[k]){
    list[s.shown]?.removeAttribute('data-on');list[k].setAttribute('data-on','');s.shown=k;
    if(num.current)num.current.textContent=pad(k+1);
    if(sec.current)sec.current.textContent=timeOf(k).toFixed(2);
    set('data-ready',true);
   }
   const phase=timeOf(s.shown>=0?s.shown:s.target)>=SWITCH-1e-6?1:0;
   if(phase!==s.phase){s.phase=phase;stage.current?.setAttribute('data-phase',String(phase));}
  };
  api.current=apply;
  const sub={
   targets:()=>[end.current],
   measure(){
    const el=copy.current;if(!el||!end.current)return;
    el.style.setProperty('--lp-endh',end.current.offsetHeight+'px');
    // the copy fades in once its offset is known, so the headline never slides into place on load
    if(!el.hasAttribute('data-m'))requestAnimationFrame(()=>requestAnimationFrame(()=>el.setAttribute('data-m','')));
   },
   read(view){const r=track.current.getBoundingClientRect();s.p=clamp(-r.top/Math.max(1,r.height-view.vh));},
   write(){
    if(s.p===s.lastP)return;
    s.lastP=s.p;
    const k=clamp(s.p/SCRUB);
    if(bar.current)bar.current.style.transform=`scaleX(${k.toFixed(4)})`;
    s.target=Math.round(k*(N-1));apply();
    const arrived=s.p>=ARRIVE;if(arrived!==s.end){s.end=arrived;set('data-end',arrived);}
    const moved=s.p>.015;if(moved!==s.moved){s.moved=moved;set('data-moved',moved);}
   },
  };
  loop.current.subs.add(sub);loop.current.kick();
  return()=>{loop.current.subs.delete(sub);api.current=null;};
 },[]);

 // load the frames only once the stage is close; reset the frame state whenever motion is switched back on
 useEffect(()=>{
  Object.assign(st.current,{lastP:-1,shown:-1,phase:-1,end:null,moved:null});st.current.ready.clear();
  if(reduced)return;
  const io=new IntersectionObserver(([e])=>{if(e.isIntersecting){setNear(true);io.disconnect();}},{rootMargin:'600px 0px'});
  io.observe(track.current);return()=>io.disconnect();
 },[reduced]);
 // images that were already in the cache before their load listener ran
 useEffect(()=>{
  if(!near||reduced)return;
  imgs.current.forEach((img,i)=>{if(img?.complete&&img.naturalWidth&&!st.current.ready.has(i)){st.current.ready.add(i);}});
  api.current?.();loop.current.kick();
 },[near,reduced]);
 const loaded=i=>event=>{
  const img=event.currentTarget,done=()=>{st.current.ready.add(i);api.current?.();};
  img.decode?img.decode().then(done,done):done();
 };

 const init=reduced?N-1:0,still=reduced?{'data-phase':'1','data-end':'','data-moved':'','data-ready':''}:{};
 return <header ref={track} className="lp-op">
  <div ref={stage} className="lp-op-stage" {...still}>
   <div className="lp-op-pic" aria-hidden="true"><div className="lp-op-box">
    {reduced?<img src={frames[N-1]} alt="" decoding="async" data-on=""/>
     :near&&frames.map((src,i)=><img key={src} ref={el=>{imgs.current[i]=el;}} src={src} alt="" decoding="async" draggable={false} fetchPriority={i===0?'high':undefined} onLoad={loaded(i)}/>)}
   </div></div>
   <div className="lp-op-scrim" aria-hidden="true"/>
   <div className="lp-op-top">
    {back}
    <span className="lp-op-kicker">{t.kicker}</span>
    <span className="lp-op-tc" aria-hidden="true">{t.frame} <b ref={num}>{pad(init+1)}</b> / {N} · <b ref={sec}>{timeOf(init).toFixed(2)}</b> s</span>
   </div>
   <div className="lp-op-bar" aria-hidden="true"><span className="lp-op-ticks">{frames.map((_,i)=><span key={i} style={{left:i/(N-1)*100+'%'}}/>)}</span><span ref={bar} className="lp-op-fill"/></div>
   <div ref={copy} className="lp-op-copy">
    <p className="lp-sr">{lineA[2]} {lineB[2]} {t.opening(from.toFixed(2),to.toFixed(2))}</p>
    <p className="lp-op-head" aria-hidden="true">
     <span className="lp-op-line"><Pin/>{lineA[2]}</span>
     <span className="lp-op-line"><Pin red/>{lineB[2]}</span>
    </p>
    <div ref={end} className="lp-op-end">
     <h1 className="lp-op-title" aria-label={film.name}>{film.name.split(' ').map((w,i)=><span className="lp-w" key={i} aria-hidden="true"><span style={{'--i':i}}>{w}</span></span>)}</h1>
     <p className="lp-op-tag">{film.tagline[0]} <i>{film.tagline[1]}</i></p>
     <div className="lp-op-actions">
      <button type="button" className="st-btn is-primary" onClick={onWatch}>▶ {t.watch}</button>
      <button type="button" className="st-btn" onClick={onWalk}>{t.walk} ↓</button>
     </div>
     <p className="lp-op-meta">{t.meta(film.duration,film.cuts.length+1)}</p>
    </div>
   </div>
   <span className="lp-op-cue" aria-hidden="true">{t.cue}<i/></span>
  </div>
 </header>;
}

/* ---------- 2. the route ---------- */

function Stop({i,en,t,id,stopRef,dotRef,className='',children}){
 const w=WAYPOINTS[i],step=STEPS[i],zh=STOP_ZH[i];
 return <section ref={stopRef} className={'lp-stop'+(className?' '+className:'')} aria-labelledby={id}>
  <div className="lp-mark">
   <span ref={dotRef} className="lp-mark-dot" aria-hidden="true"/>
   <span className="lp-mark-tick" aria-hidden="true"/>
   <figure className="lp-mark-photo"><img src={small(step.photo)} alt={en?step.alt:zh.alt} width="480" height="360" loading="lazy" decoding="async" style={{objectPosition:step.focus}}/></figure>
   <div className="lp-mark-text">
    <span className="lp-mark-k">{t.stop(i)} · <b>{FEET[i]}</b> {t.ft}</span>
    <strong className="lp-mark-name">{en?w.name:zh.name}</strong>
    <span className="lp-mark-instr">{en?step.instr:zh.instr}</span>
   </div>
  </div>
  {children}
 </section>;
}

function Route({film,slug,L,t,reduced,loop,go,video,demo,onWatch}){
 const en=L==='en',DUR=film.duration,shots=film.cuts.length+1,src='/video/'+film.stem+'-film.mp4',caseHref='/product/'+film.caseSlug;
 const route=useRef(null),rail=useRef(null),line=useRef(null),odo=useRef(null),dots=useRef([]),stops=useRef([]);
 const st=useRef({ys:null,tip:0,k:-1,n:-1,passed:-1});
 const delivered=film.headlines.find(h=>h[2]==='Delivered.');
 const motionMax=Math.max(...film.motion);

 useEffect(()=>{
  const s=st.current;
  const sub={
   // where each stop's dot sits on the route, in px from the route's top; the rail runs from the curb to the door
   measure(){
    const box=route.current?.getBoundingClientRect();if(!box||dots.current.some(d=>!d))return;
    s.ys=dots.current.map(d=>{const r=d.getBoundingClientRect();return r.top+r.height/2-box.top;});
    rail.current.style.top=s.ys[0]+'px';rail.current.style.height=Math.max(0,s.ys[4]-s.ys[0])+'px';
    s.k=-1;
   },
   read(view){s.tip=view.vh*READ-route.current.getBoundingClientRect().top;},
   write(){
    const ys=s.ys;if(!ys)return;
    const tip=s.tip,len=ys[4]-ys[0];
    const k=len>0?clamp((tip-ys[0])/len):0;
    if(k!==s.k){s.k=k;line.current.style.transform=`scaleY(${k.toFixed(5)})`;}
    // feet are piecewise between the stops, so the count reads each stop's own feet as the line reaches it
    let ft=0;
    if(tip>=ys[4])ft=TOTAL_FEET;
    else if(tip>ys[0]){let j=0;while(j<3&&tip>=ys[j+1])j++;ft=FEET[j]+(tip-ys[j])/Math.max(1,ys[j+1]-ys[j])*(FEET[j+1]-FEET[j]);}
    const progress=ft/TOTAL_FEET,n=Math.round(progress*TOTAL_FEET);
    if(n!==s.n){s.n=n;odo.current.textContent=n;}
    let passed=0;for(const y of ys)if(tip>=y-1)passed++;
    if(passed!==s.passed){s.passed=passed;stops.current.forEach((el,i)=>{if(!el)return;if(i<passed)el.setAttribute('data-on','');else el.removeAttribute('data-on');});}
   },
  };
  loop.current.subs.add(sub);loop.current.kick();
  return()=>loop.current.subs.delete(sub);
 },[]);
 useEffect(()=>{Object.assign(st.current,{k:-1,n:-1,passed:-1});},[reduced]);

 const stop=i=>({i,en,t,id:'lp-stop-'+i,stopRef:el=>{stops.current[i]=el;},dotRef:el=>{dots.current[i]=el;}});
 return <div ref={route} className="lp-route">
  <div ref={rail} className="lp-rail" aria-hidden="true">
   <i className="lp-rail-track"/>
   <i ref={line} className="lp-rail-line"/>
   <div className="lp-courier"><i className="lp-tip"/><span className="lp-odo"><b ref={odo}>{reduced?TOTAL_FEET:0}</b><small>{t.ft}</small></span></div>
  </div>

  {/* Elm St curb, 0 ft: the problem, how it works, and the product to try */}
  <Stop {...stop(0)}>
   <h2 id="lp-stop-0" className="lp-k">{t.problem}</h2>
   <div className="lp-problem">
    <Reveal as="p" className="lp-statement">{film.problem[L]}</Reveal>
    <Reveal as="figure" className="lp-pincard" delay={120}>
     <div className="lp-pincard-pic"><img src={small(GARAGE_PHOTO.photo)} alt={en?GARAGE_PHOTO.alt:'Cypress Ave 上的卷帘式车库门，旁边立着刷卡柱，仅限住户'} width="480" height="360" loading="lazy" decoding="async"/><span className="lp-pincard-tag">{t.residents}</span></div>
     <figcaption><Pin/><span><b>{t.pinLabel}</b>{t.pinTitle}</span></figcaption>
    </Reveal>
   </div>
   <div ref={demo} className="lp-how">
    <Reveal as="header" className="lp-how-head"><h3 className="lp-sub">{t.how}</h3><p className="lp-lead">{film.how[L]}</p></Reveal>
    <Reveal className="lp-demo"><Suspense fallback={<div className="st-demo-loading st-mono">{t.loading}</div>}><Demo lang={L} reduced={reduced}/></Suspense></Reveal>
   </div>
  </Stop>

  {/* Elm St gate, 45 ft: the design decisions as signposts */}
  <Stop {...stop(1)}>
   <Reveal as="header" className="lp-head"><span className="lp-k">{t.decisions}</span><h2 id="lp-stop-1" className="lp-h">{t.decisionsH}</h2><p className="lp-lead">{t.decisionsLead}</p></Reveal>
   <ol className="lp-dec">{film.decisions.map((d,i)=><Reveal as="li" key={i} delay={(i%2)*90} style={{'--r':i+1}}>
    <article className="lp-card" tabIndex={0} aria-labelledby={'lp-dec-'+i}>
     <div className="lp-card-media"><img src={d.img.src} alt="" loading="lazy" decoding="async" style={{objectPosition:d.img.position}}/></div>
     <div className="lp-card-body">
      <span className="lp-card-n">{pad(i+1)} / {pad(film.decisions.length)}</span>
      <h3 id={'lp-dec-'+i}>{d.title[L]}</h3>
      <p className="lp-card-verdict">{d.verdict[L]}</p>
      <dl>
       {d.tried&&<div className="is-tried"><dt>{t.tried}</dt><dd>{d.tried[L]}</dd></div>}
       <div className="is-chose"><dt>{t.chose}</dt><dd>{d.chose[L]}</dd></div>
      </dl>
     </div>
    </article>
   </Reveal>)}</ol>
  </Stop>

  {/* Building 4, 170 ft: how the film tells it, and the first cut against the final */}
  <Stop {...stop(2)}>
   <Reveal as="header" className="lp-head"><span className="lp-k">{t.film}</span><h2 id="lp-stop-2" className="lp-h">{t.filmH}</h2></Reveal>
   <ol className="lp-ideas">{film.ideas.map((idea,i)=><Reveal as="li" key={i} delay={i*90}><b>{pad(i+1)}</b><h3>{idea.title[L]}</h3><p>{idea.body[L]}</p></Reveal>)}</ol>
   <div className="lp-firstcut">
    <Reveal as="header"><h3 className="lp-sub">{t.firstCut}</h3><p className="lp-lead">{film.firstCutText[L]}</p></Reveal>
    <Reveal className="lp-ba"><BeforeAfter pairs={film.firstCut} media={MEDIA} lang={L} reduced={reduced}/></Reveal>
   </div>
  </Stop>

  {/* Stairs, 195 ft: craft */}
  <Stop {...stop(3)}>
   <Reveal as="header" className="lp-head"><span className="lp-k">{t.craft}</span><h2 id="lp-stop-3" className="lp-h">{t.craftH}</h2><p className="lp-lead">{film.smoothText[L]}</p></Reveal>
   <ul className="lp-stats">
    <Reveal as="li"><b><CountUp to={shots} reduced={reduced}/></b><span>{t.shots(film.cuts.length)}</span></Reveal>
    <Reveal as="li" delay={80}><b><CountUp to={60} reduced={reduced}/></b><span>{t.fps}</span></Reveal>
    <Reveal as="li" delay={160}><b><CountUp to={16} reduced={reduced}/></b><span>{t.samples}</span></Reveal>
    <Reveal as="li" delay={240}><b>{film.scores[0]}<em>→</em>{film.scores[film.scores.length-1]}</b><Spark values={film.scores}/><span>{t.score}</span></Reveal>
   </ul>
   <Reveal as="figure" className="lp-chart">
    <div className="lp-chart-plot">
     <svg viewBox="0 0 600 100" preserveAspectRatio="none" role="img" aria-label={t.chartLabel}>
      <rect x={film.flip[0]/DUR*600} y="0" width={(film.flip[1]-film.flip[0])/DUR*600} height="100"/>
      {film.cuts.map(c=><line key={c} x1={c/DUR*600} x2={c/DUR*600} y1="0" y2="100"/>)}
      <path d={'M'+film.motion.map((v,i)=>((i+.5)*4/FPS/DUR*600).toFixed(1)+','+(100-v/motionMax*92).toFixed(2)).join('L')}/>
     </svg>
     <span className="lp-chart-band" style={{left:film.flip[0]/DUR*100+'%'}} aria-hidden="true">{t.band}</span>
     <span className="lp-chart-wipe" aria-hidden="true"/>
    </div>
    <div className="lp-chart-axis" aria-hidden="true">{[0,5,10,15,20,25].map(x=><span key={x} style={{left:x/DUR*100+'%'}}>{x} s</span>)}<span style={{left:'100%'}}>{DUR} s</span></div>
    <figcaption>{t.chartCap(film.flip[0].toFixed(2),film.flip[1].toFixed(2))}</figcaption>
   </Reveal>
  </Stop>

  {/* Door 214, 290 ft: delivered; the film, its links and the review notes */}
  <Stop {...stop(4)} className="lp-stop-door">
   <div className="lp-done">
    <span className="lp-done-check"><Check/></span>
    <h2 id="lp-stop-4">{t.done}</h2>
   </div>
   <p className="lp-done-note">{t.nameNote}</p>
   {delivered&&<button type="button" className="lp-done-play" onClick={()=>onWatch(delivered[0])}>▶ {t.playAt(delivered[0].toFixed(2))}</button>}
   <div className="lp-film">
    <p className="lp-film-head">{t.filmHead(DUR,shots)}</p>
    <Reveal><div data-nav-tone="dark"><Desk film={film} slug={slug} lang={L} video={video}/></div></Reveal>
    <div className="lp-links"><a href={caseHref} onClick={go(caseHref)}>{film.caseName[L]} →</a><a href={src} target="_blank" rel="noopener noreferrer">{t.open} ↗</a></div>
   </div>
   <div className="lp-notes-wrap">
    <h3 className="lp-k">{t.notes}</h3>
    <ol className="lp-notes">{film.notes.map((n,i)=><Reveal as="li" key={i} delay={i*80}><span>{t.note} {pad(i+1)}</span><p>{n.note[L]}</p><span>{t.fix}</span><p>{n.fix[L]}</p></Reveal>)}</ol>
    <p className="lp-fine">{t.fine}</p>
   </div>
  </Stop>
 </div>;
}

/* ---------- the page ---------- */

export default function LastHundredFeetPage({lang,reduced,onNavigate,slug='last-100-feet'}){
 const film=FILMS[slug]||FILMS['last-100-feet'],en=lang==='en',L=en?'en':'zh',t=en?EN:ZH;
 const root=useRef(null),video=useRef(null),demo=useRef(null);
 const loop=usePageLoop(root,reduced);
 const go=to=>event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();onNavigate(to);
 };
 const behavior=reduced?'auto':'smooth';
 const watch=time=>{const v=video.current;if(!v)return;if(typeof time==='number')v.currentTime=time;v.play().catch(()=>{});v.scrollIntoView({behavior,block:'center'});};
 const walk=()=>demo.current?.scrollIntoView({behavior,block:'start'});
 return <article ref={root} key={slug} className={'st-page lp-page'+(reduced?' st-still':'')} data-nav-tone="light" style={{'--accent':film.accent}}>
  <Opening film={film} t={t} reduced={reduced} loop={loop} onWatch={()=>watch(0)} onWalk={walk}
   back={<a className="lp-back" href="/other-project" onClick={go('/other-project')}>← Other Project</a>}/>
  <div className="lp-wrap">
   <Route film={film} slug={slug} L={L} t={t} reduced={reduced} loop={loop} go={go} video={video} demo={demo} onWatch={watch}/>
   <NextProject item={nextAfter(slug)} lang={L} onNavigate={onNavigate}/>
   <footer className="st-footer"><span>JAY LIN / {film.name.toUpperCase()}</span><p>{t.footer}</p></footer>
  </div>
 </article>;
}
