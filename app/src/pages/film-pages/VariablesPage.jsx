import {lazy,memo,Suspense,useCallback,useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';
import {FILMS,nextAfter} from '../product-films-data';
import {Reveal,NextProject,useInView} from '../story/Story';
import {Desk as FilmDesk} from '../story/FilmDesk';
import {RUNS} from '../../product/v2/data/benchmark-runs';
import './variables-page.css';

// Variables for agents, told as a design file: every section is a frame on a light canvas with a Figma-style label, the
// frame in view is the selected one (Layers panel, blue outline, its live size). Blue marks the file's real token names
// and the selection; red only marks names an agent invented.
// Sources: FILMS[slug] (product-films-data.js and films/*.json), the demo (demos/VariablesDemo.jsx), the benchmark runs
// (product/v2/data/benchmark-runs.js, levels as labelled in product/v2/modules/AblationChart.jsx), and the film itself
// (aigc-vibecoding/product-films/src/films/VariablesForAgents2.tsx: STREAM and LANES below).
// memoised: the page re-renders when the selected frame changes, and these don't depend on it
const VariablesDemo=lazy(()=>import('../demos/VariablesDemo').then(m=>({default:memo(m.default)})));
const Desk=memo(FilmDesk);

// the film's first beat: the values that stream past, and its six lanes (font size and speed in the film's 1920 px frame,
// blur in px, opacity); the two sharp lanes carry the values you can point at
const STREAM=['F7F7F5','1C1D21','6E6F78','2F5D50','EDECE8','E4E3DF','C9A66B','FFFFFF','20px','16px','12px','2F5D50','1C1D21'];
const LANES=[{size:20,speed:260,blur:3,o:.35},{size:30,speed:420,blur:1.5,o:.55},{size:44,speed:640,blur:0,o:.9},{size:40,speed:560,blur:0,o:.85},{size:28,speed:380,blur:1.5,o:.5},{size:18,speed:240,blur:3,o:.3}];
const LIVE=[2,3],SLOW=.15;
// the name an agent gave each value, from the demo's ROWS[].raw; two of them happen to be the tokens' own names (the demo
// draws those in blue), and FFFFFF has two roles there (frame fill, text), so each live lane takes one
const NAMES={F7F7F5:'bgLight','1C1D21':'darkText','6E6F78':'grey600',EDECE8:'cardBg2',C9A66B:'gold','2F5D50':'color-accent',E4E3DF:'color-border'};
const GUESSED=new Set(['2F5D50','E4E3DF']);
const nameOf=(v,li)=>v==='FFFFFF'?(li===2?'cardBg':'white'):NAMES[v];
const isHex=v=>/^[0-9A-F]{6}$/.test(v);

const FRAMES=[
 {id:'stream',name:{en:'Stream',zh:'数值流'}},
 {id:'try',name:{en:'Try it',zh:'试一试'}},
 {id:'result',name:{en:'Result',zh:'结果'}},
 {id:'principles',name:{en:'Principles',zh:'原则'}},
 {id:'film',name:{en:'The film',zh:'片子'}},
 {id:'review',name:{en:'Review',zh:'评审'}},
];

// the benchmark's four levels, named as the case's chart names them (AblationChart LEVELS) and described as the case's
// table does (cases/DesignToCodeCase.jsx, "The four levels of the test file")
const LEVELS=[
 {id:'L0',name:{en:'Raw',zh:'原始'},bound:false,desc:{en:'No auto layout; layers named “Frame 12”, “Text”',zh:'没有自动布局，图层名是 “Frame 12”“Text” 这种'}},
 {id:'L1',name:{en:'Structured',zh:'结构化'},bound:false,desc:{en:'Auto layout and names; no variables, styles or components',zh:'有自动布局和命名，没有 variables、样式和组件'}},
 {id:'L0V',name:{en:'Raw + variables',zh:'原始 + variables'},bound:true,desc:{en:'L0 plus the same variable bindings as L2, nothing else',zh:'L0 加上和 L2 一样的 variable 绑定，别的都没有'}},
 {id:'L2',name:{en:'Systematized',zh:'系统化'},bound:true,desc:{en:'Variables, text styles, components, auto layout, semantic names',zh:'variables、文字样式、组件、自动布局、语义化命名都有'}},
];
const LEVEL=Object.fromEntries(LEVELS.map(g=>[g.id,g]));
const SCREEN_ZH={'Sign-in':'登录',Pricing:'定价',Settings:'设置','Product grid':'商品列表',Dashboard:'仪表盘',Profile:'个人主页'};

/* ---------- small helpers ---------- */
const bezier=(x1,y1,x2,y2)=>{
 const f=(t,a,b)=>3*a*(1-t)*(1-t)*t+3*b*(1-t)*t*t+t*t*t,d=(t,a,b)=>3*a*(1-t)*(1-t)+6*(b-a)*(1-t)*t+3*(1-b)*t*t;
 return x=>{if(x<=0)return 0;if(x>=1)return 1;let t=x;for(let i=0;i<8;i++){const s=d(t,x1,x2);if(s<1e-6)break;t=Math.min(1,Math.max(0,t-(f(t,x1,x2)-x)/s));}return f(t,y1,y2);};
};
const ease=bezier(.33,0,.2,1);
const smoother=p=>p*p*p*(p*(p*6-15)+10);
const GLYPHS='abcdefghijklmnopqrstuvwxyz0123456789/#';
/** The film's scramble: characters settle left to right from `from` to `to`; unsettled ones flicker (held per step). */
const scramble=(from,to,p,f)=>{
 if(p<=0)return from;if(p>=1)return to;
 const n=Math.round(from.length+(to.length-from.length)*smoother(p));let out='';
 for(let i=0;i<n;i++){const edge=p*(n+5)-i;out+=edge>=5?(to[i]??''):GLYPHS[Math.floor(Math.abs(Math.sin((i+1)*12.9898+f*78.233))*43758.5453)%GLYPHS.length];}
 return out;
};
const tc=t=>{const f=Math.round(t*60),s=Math.floor(f/60);return '00:00:'+String(s).padStart(2,'0')+':'+String(f%60).padStart(2,'0');};
const pct=s=>`${Math.round(s*1000)/10}%`.replace('.0%','%');
const round=r=>Math.round(r.share*100);
const median=v=>{const s=[...v].sort((a,b)=>a-b),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};
const pad2=n=>String(n).padStart(2,'0');
const firstSentence=(text,zh)=>{const i=zh?text.indexOf('。'):text.indexOf('. ');return i<0?text:text.slice(0,i+1);};

function FrameIcon(){
 return <svg viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 .5v9M7 .5v9M.5 3h9M.5 7h9" fill="none" stroke="currentColor" strokeWidth="1.1"/></svg>;
}

/** A frame on the canvas: its label above, the body, and the selection (outline, handles, its live size) when in view. */
function Frame({id,name,active,dark,bodyClass='',frameRef,labelledBy,children}){
 const box=useRef(null),size=useRef(null);
 useEffect(()=>{
  const el=box.current;if(!el||typeof ResizeObserver==='undefined')return;
  const ro=new ResizeObserver(([e])=>{
   const b=e.borderBoxSize?.[0],w=b?b.inlineSize:e.contentRect.width,h=b?b.blockSize:e.contentRect.height;
   if(size.current)size.current.textContent=Math.round(w)+' × '+Math.round(h);
  });
  ro.observe(el);return()=>ro.disconnect();
 },[]);
 return <section ref={frameRef} id={'vp-'+id} data-frame={id} tabIndex={-1} aria-labelledby={labelledBy} className={'vp-frame'+(active?' is-sel':'')}>
  <div className="vp-flabel" aria-hidden="true"><FrameIcon/>{name}</div>
  <div className="vp-fbox">
   <div ref={box} className={'vp-fbody'+(dark?' is-dark':'')+(bodyClass?' '+bodyClass:'')} data-nav-tone={dark?'dark':undefined}>{children}</div>
   <span className="vp-sel" aria-hidden="true"><b/><b/><b/><b/><span ref={size} className="vp-size"/></span>
  </div>
 </section>;
}

function Layers({active,onPick,lang,title}){
 const en=lang==='en',L=en?'en':'zh';
 return <aside className="vp-layers" aria-label={en?'Layers':'图层'}>
  <p className="vp-layers-file"><svg viewBox="0 0 12 14" aria-hidden="true" focusable="false"><path d="M1.5.5h6l3 3v10h-9z M7.5.5v3h3" fill="none" stroke="currentColor" strokeWidth="1"/></svg><span>{title}</span></p>
  <p className="vp-layers-h">{en?'Layers':'图层'}</p>
  <ol>{FRAMES.map(f=><li key={f.id}>
   <button type="button" aria-current={active===f.id?'true':undefined} onClick={()=>onPick(f.id)}><FrameIcon/><span>{f.name[L]}</span></button>
  </li>)}</ol>
 </aside>;
}

/* ---------- 1. Stream ---------- */

/** One value in a lane. The live ones are buttons: pointing at one (or focusing it, or tapping it) scrambles it into the
    name an agent gave it. */
function Chip({c,id,live,hidden,focusable,below,lang,reduced,onHold,onFocusChip,onKey,elRef}){
 const en=lang==='en',txt=useRef(null),pointer=useRef('mouse'),timer=useRef(0),first=useRef(true),[on,setOn]=useState(false);
 const hold=useRef(onHold);hold.current=onHold;
 useEffect(()=>{
  if(first.current){first.current=false;return undefined;}
  hold.current(id,on);
  const el=txt.current;if(!el)return undefined;
  const to=on?c.name:c.v,from=el.textContent;
  if(reduced||from===to){el.textContent=to;return undefined;}
  let raf=0,t0;const dur=on?520:360;
  const step=now=>{t0??=now;const p=Math.min(1,(now-t0)/dur);el.textContent=scramble(from,to,p,Math.floor((now-t0)/50));if(p<1)raf=requestAnimationFrame(step);};
  raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf);
 },[on]);
 useEffect(()=>()=>{clearTimeout(timer.current);hold.current(id,false);},[]);
 const hex=isHex(c.v);
 if(!live||!c.name)return <span className="vp-chip">{hex&&<span className="vp-sw" style={{background:'#'+c.v}}/>}<span className="vp-chip-t">{c.v}</span></span>;
 const label=en?`${c.v}: an agent named it ${c.name}${c.guess?', which happens to match a token':''}`:`${c.v}：agent 给它起名 ${c.name}${c.guess?'，碰巧和 token 同名':''}`;
 return <button ref={elRef} type="button" tabIndex={focusable?0:-1} aria-hidden={hidden?'true':undefined} aria-label={hidden?undefined:label}
  className={'vp-chip is-live '+(c.guess?'is-guess':'is-made')+(on?' is-on':'')+(below?' is-below':'')}
  onMouseDown={hidden?e=>e.preventDefault():undefined}
  onPointerDown={e=>{pointer.current=e.pointerType;}}
  onPointerEnter={e=>{if(e.pointerType==='mouse')setOn(true);}}
  onPointerLeave={e=>{if(e.pointerType==='mouse')setOn(false);}}
  onFocus={e=>{onFocusChip?.(e.currentTarget);if(e.currentTarget.matches(':focus-visible'))setOn(true);}}
  onBlur={()=>{clearTimeout(timer.current);setOn(false);}}
  onClick={e=>{
   if(e.detail===0){setOn(o=>!o);return;}
   if(pointer.current!=='mouse'){setOn(true);clearTimeout(timer.current);timer.current=setTimeout(()=>setOn(false),2800);}
  }}
  onKeyDown={e=>{if(e.key==='Escape'){setOn(false);return;}onKey?.(e);}}>
  <span className="vp-sw" style={{background:'#'+c.v}}/>
  <span ref={txt} className="vp-chip-t" style={{'--w':Math.max(c.v.length,c.name.length)}}>{c.v}</span>
  <span className="vp-cap">{c.guess?(en?'happens to match a token':'碰巧和 token 同名'):(en?'an agent’s guess':'agent 编的名字')}</span>
 </button>;
}

const Stream=memo(function Stream({film,lang,reduced,onWatch,onTry}){
 const en=lang==='en',L=en?'en':'zh';
 const root=useRef(null),live=useInView(root,{threshold:0,once:false});
 const lanes=useRef([]),tracks=useRef([]),copies=useRef([]),durs=useRef([]),chipEls=useRef([]);
 const holds=useRef(new Set()),rate=useRef({v:1,to:1,raf:0}),seek=useRef(0),alive=useRef(true);
 const [roving,setRoving]=useState(0),[ready,setReady]=useState(false);
 useEffect(()=>{const id=requestAnimationFrame(()=>setReady(true));return()=>cancelAnimationFrame(id);},[]);
 // the film's lanes: value k of lane li is STREAM[(k + li·3) mod n]; wide lanes repeat once more so a copy outruns any frame
 const rows=useMemo(()=>LANES.map((l,li)=>Array.from({length:l.size>=28?13:26},(_,k)=>{
  const v=STREAM[(k+li*3)%STREAM.length];
  return {v,name:LIVE.includes(li)&&isHex(v)?nameOf(v,li):null,guess:GUESSED.has(v)};
 })),[]);
 const order=useMemo(()=>LIVE.flatMap(li=>rows[li].map((c,k)=>c.name?{li,k}:null).filter(Boolean)),[rows]);
 const anim=li=>tracks.current[li]?.getAnimations?.()[0];

 // each lane's duration from its measured copy, so it moves at the film's speed (scaled to its type, slowed down);
 // re-measured only when a copy changes size (fonts, resize), keeping each lane where it was
 useLayoutEffect(()=>{
  if(reduced)return undefined;
  const measure=()=>LANES.forEach((l,li)=>{
   const c=copies.current[li],t=tracks.current[li];if(!c||!t)return;
   const w=c.offsetWidth,fs=parseFloat(getComputedStyle(t).fontSize)||l.size;if(!w)return;
   const dur=w/(l.speed*fs/l.size*SLOW),old=durs.current[li];
   if(old&&Math.abs(old.dur-dur)<.01&&old.w===w)return;
   const a=anim(li),p=a&&old?((a.currentTime||0)%(old.dur*1000))/(old.dur*1000):(li*.137)%1;
   t.style.animationDuration=dur.toFixed(3)+'s';durs.current[li]={dur,w};
   const b=anim(li);if(b){b.currentTime=p*dur*1000;b.playbackRate=rate.current.v;}
  });
  measure();
  if(typeof ResizeObserver==='undefined')return undefined;
  const ro=new ResizeObserver(measure);copies.current.forEach(c=>c&&ro.observe(c));
  return()=>ro.disconnect();
 },[reduced]);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;cancelAnimationFrame(rate.current.raf);cancelAnimationFrame(seek.current);};},[]);

 // the lanes brake while you point at a live lane or a value is showing its name, and pick up again after
 const setRate=to=>{
  const r=rate.current;if(reduced||!alive.current||r.to===to)return;
  r.to=to;cancelAnimationFrame(r.raf);
  const from=r.v,t0=performance.now(),dur=to<from?480:1100;
  const step=now=>{
   const k=Math.min(1,(now-t0)/dur);r.v=from+(to-from)*ease(k);
   LANES.forEach((_,li)=>{const a=anim(li);if(a)a.playbackRate=r.v;});
   if(k<1)r.raf=requestAnimationFrame(step);
  };
  r.raf=requestAnimationFrame(step);
 };
 const hold=(key,on)=>{const h=holds.current;if(on)h.add(key);else h.delete(key);setRate(h.size?0:1);};

 // keyboard focus can land on a value outside the frame: slide its lane until it is in view
 const bring=(li,el)=>{
  const lane=lanes.current[li],t=tracks.current[li];if(!lane||!t)return;
  const lr=lane.getBoundingClientRect(),r=el.getBoundingClientRect();
  if(r.left>=lr.left+20&&r.right<=lr.right-20)return;
  const x=Math.max(0,el.offsetLeft-lr.width*.3);
  if(reduced){t.style.transform=`translate3d(${-x}px,0,0)`;return;}
  const a=anim(li),d=durs.current[li];if(!a||!d)return;
  const T=d.dur*1000,from=(a.currentTime||0)%T,to=x/d.w*T,t0=performance.now();
  cancelAnimationFrame(seek.current);
  const step=now=>{const k=Math.min(1,(now-t0)/560);a.currentTime=from+(to-from)*ease(k);if(k<1)seek.current=requestAnimationFrame(step);};
  seek.current=requestAnimationFrame(step);
 };
 const keyNav=(e,idx)=>{
  const n=order.length,d={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];
  let next=null;
  if(d)next=(idx+d+n)%n;else if(e.key==='Home')next=0;else if(e.key==='End')next=n-1;
  if(next==null)return;
  e.preventDefault();setRoving(next);chipEls.current[next]?.focus({preventScroll:true});
 };

 const lane=li=>{
  const l=LANES[li],isLive=LIVE.includes(li);
  return <div key={li} ref={el=>{lanes.current[li]=el;}} className={'vp-lane'+(isLive?' is-live':'')+(l.blur?' is-soft':'')}
   style={{'--s':l.size,'--o':l.o,'--li':li,'--b':l.blur,'--off':li*137}} aria-hidden={isLive?undefined:'true'}
   onPointerEnter={isLive?e=>{if(e.pointerType==='mouse')hold('lane'+li,true);}:undefined}
   onPointerLeave={isLive?e=>{if(e.pointerType==='mouse')hold('lane'+li,false);}:undefined}>
   <div ref={el=>{tracks.current[li]=el;}} className="vp-track">
    {[0,1].map(copy=><div key={copy} ref={copy?undefined:el=>{copies.current[li]=el;}} className="vp-copy" aria-hidden={copy&&isLive?'true':undefined}>
     {rows[li].map((c,k)=>{
      const idx=!copy&&isLive&&c.name?order.findIndex(o=>o.li===li&&o.k===k):-1;
      return <Chip key={k} c={c} id={`${copy}-${li}-${k}`} live={isLive} hidden={copy===1} focusable={idx>=0&&idx===roving} below={li===LIVE[1]}
       lang={lang} reduced={reduced} onHold={hold}
       elRef={idx>=0?el=>{chipEls.current[idx]=el;}:undefined}
       onFocusChip={idx>=0?el=>{setRoving(idx);bring(li,el);}:undefined}
       onKey={idx>=0?e=>keyNav(e,idx):undefined}/>;
     })}
    </div>)}
   </div>
  </div>;
 };

 return <div ref={root} className={'vp-hero'+(ready||reduced?' is-in':'')}>
  <div className="vp-hint"><span>{en?'Point at a value, or tap it, to see the name an agent gave it':'指向或点按一个色值，看 agent 给它起了什么名字'}</span><span>{en?`From the film’s first ${film.beats[0].to} s`:`取自片子开头 ${film.beats[0].to} 秒`}</span></div>
  <div className={'vp-stream'+(live||reduced?'':' is-paused')} role="group"
   aria-label={en?'Values a coding agent sees. Tab in and use the arrow keys; each value shows the name an agent gave it.':'coding agent 看到的值。用 Tab 进入、方向键切换，每个值都会显示 agent 给它起的名字。'}
   onFocus={e=>{if(e.target.matches?.(':focus-visible'))hold('focus',true);}}
   onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))hold('focus',false);}}>
   {[0,1,2].map(lane)}
   <div className="vp-title">
    <h1 id="vp-title" aria-label={film.name}>{film.name.split(' ').map((w,i)=><span className="vp-word" key={i} aria-hidden="true"><span style={{'--i':i}}>{w}</span></span>)}</h1>
    <p className="vp-tagline">{film.tagline[0]} <span>{film.tagline[1]}</span></p>
   </div>
   {[3,4,5].map(lane)}
  </div>
  <div className="vp-hero-foot">
   <div className="vp-hls" lang="en" style={{'--n':0}}>
    {film.headlines.slice(0,2).map(([a,,text],i)=><p key={i} className="vp-hl"><span className="vp-tc" aria-hidden="true">{tc(a)}</span>{text}</p>)}
   </div>
   <div className="vp-hero-side" style={{'--n':1}}>
    <p className="vp-intro">{firstSentence(film.intro[L],!en)}</p>
    <div className="vp-actions">
     <button type="button" className="st-btn is-primary" onClick={onWatch}>▶ {en?'Watch the film':'看片子'}</button>
     <button type="button" className="st-btn" onClick={onTry}>{en?'Try it':'试一试'} ↓</button>
    </div>
   </div>
  </div>
 </div>;
});

/* ---------- 3. Result ---------- */

/** A ring that fills clockwise from 12 o'clock: two half-rings, each turned into its half of the window (transform only). */
function Ring({color,label,partsRef}){
 const set=key=>el=>{partsRef.current[key]=el;};
 return <div className="vp-ring" style={{'--c':color}} role="img" aria-label={label}>
  <span className="vp-ring-half is-r"><span ref={set('a')}/></span>
  <span className="vp-ring-half is-l"><span ref={set('b')}/></span>
  <b ref={set('num')} className="vp-ring-num" aria-hidden="true">0%</b>
 </div>;
}

const Result=memo(function Result({lang,reduced}){
 const en=lang==='en',L=en?'en':'zh';
 const data=useMemo(()=>{
  const PITCH=15,STACK=5;
  // ties (same whole percent) stack in a short column at their value; a long run of ties takes a second column
  const place=runs=>{
   const by={};runs.forEach(r=>{(by[round(r)]=by[round(r)]||[]).push(r);});
   return Object.keys(by).map(Number).sort((a,b)=>a-b).flatMap(v=>{
    const list=by[v],cols=Math.ceil(list.length/STACK);
    return list.map((r,k)=>{const c=Math.floor(k/STACK),n=Math.min(STACK,list.length-c*STACK);return {r,v,dx:(c-(cols-1)/2)*PITCH,dy:(k%STACK-(n-1)/2)*PITCH};});
   });
  };
  let i=0;
  const rows=LEVELS.map(g=>{const runs=RUNS.filter(r=>r.level===g.id);return {g,n:runs.length,median:median(runs.map(round)),dots:place(runs).map(d=>({...d,g,i:i++}))};});
  const hex=RUNS.filter(r=>!LEVEL[r.level].bound),bound=RUNS.filter(r=>LEVEL[r.level].bound),bare=RUNS.filter(r=>r.level==='L0V');
  return {rows,dots:rows.flatMap(r=>r.dots),total:RUNS.length,
   hexN:hex.length,hexMedian:median(hex.map(round)),hexMax:Math.max(...hex.map(round)),hexFull:hex.filter(r=>round(r)===100).length,
   boundN:bound.length,boundFull:bound.filter(r=>round(r)===100).length,bareN:bare.length,bareFull:bare.filter(r=>round(r)===100).length};
 },[]);
 const screen=r=>en?r.name:(SCREEN_ZH[r.name]||r.name);
 const levelName=g=>`${g.id} ${g.name[L]}`;

 // rings: one eased fill as they come into view, the number counting with it
 const ringsRef=useRef(null),ringsIn=useInView(ringsRef,{threshold:.4});
 const partsA=useRef({}),partsB=useRef({});
 const RINGS=[{parts:partsA,to:data.bareFull/data.bareN,dur:1700,delay:0},{parts:partsB,to:data.hexMedian/100,dur:1250,delay:180}];
 useLayoutEffect(()=>{
  const set=(r,p)=>{const {a,b,num}=r.parts.current;if(!a||!b||!num)return;
   a.style.transform=`rotate(${Math.min(p,.5)*360}deg)`;a.style.opacity=p>0?1:0;
   b.style.transform=`rotate(${Math.max(0,p-.5)*360}deg)`;b.style.opacity=p>.5?1:0;
   num.textContent=Math.round(p*100)+'%';};
  if(reduced){RINGS.forEach(r=>set(r,r.to));return undefined;}
  RINGS.forEach(r=>set(r,0));
  if(!ringsIn)return undefined;
  let raf=0,t0;
  const step=now=>{t0??=now;let done=true;
   RINGS.forEach(r=>{const k=Math.min(1,Math.max(0,(now-t0-r.delay)/r.dur));if(k<1)done=false;set(r,ease(k)*r.to);});
   if(!done)raf=requestAnimationFrame(step);};
  raf=requestAnimationFrame(step);return()=>cancelAnimationFrame(raf);
 },[ringsIn,reduced]);

 // the dots: in when the plot comes into view, then point, tap, focus or arrow through them for each build
 const plot=useRef(null),plotIn=useInView(plot,{threshold:.2}),[settled,setSettled]=useState(false);
 const [at,setAt]=useState(null),[tip,setTip]=useState(null),[focusIdx,setFocusIdx]=useState(0);
 useEffect(()=>{if(!plotIn||reduced)return undefined;const id=setTimeout(()=>setSettled(true),1700);return()=>clearTimeout(id);},[plotIn,reduced]);
 const show=(i,el)=>{
  const p=plot.current;if(!p||!el)return;
  const pr=p.getBoundingClientRect(),r=el.getBoundingClientRect(),half=Math.min(135,pr.width/2-4);
  const x=Math.min(pr.width-half,Math.max(half,r.left+r.width/2-pr.left)),y=r.top+r.height/2-pr.top;
  setAt(i);setTip({x,y,below:y<130});
 };
 const hide=()=>setAt(null);
 const move=(e,i)=>{
  const n=data.dots.length,d={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];
  let next=null;
  if(d)next=(i+d+n)%n;else if(e.key==='Home')next=0;else if(e.key==='End')next=n-1;else if(e.key==='Escape'){hide();return;}
  if(next==null)return;
  e.preventDefault();setFocusIdx(next);plot.current?.querySelector(`[data-dot="${next}"]`)?.focus();
 };
 const cur=at!=null?data.dots[at]:null;
 const at50=v=>({'--x':v});
 const cond=[
  {key:'hex',bound:false,head:en?'With hex values':'只有 hex 值',n:data.hexN},
  {key:'bound',bound:true,head:en?'With variables bound':'绑定了 variables',n:data.boundN},
 ];

 return <>
  <div ref={ringsRef} className="vp-rings">
   <Reveal className="vp-ringcard is-bound">
    <Ring color="var(--accent)" partsRef={partsA} label={en?`${Math.round(100*data.bareFull/data.bareN)}% of token changes followed with variables bound, ${data.bareFull} of ${data.bareN} builds`:`绑定 variables 时，token 改动 ${Math.round(100*data.bareFull/data.bareN)}% 跟上，${data.bareN} 次构建 ${data.bareFull} 次做到`}/>
    <div className="vp-ringtext">
     <span className="vp-ring-head">{en?'With variables bound':'绑定了 variables'}</span>
     <p>{en?`of token changes followed (${data.bareFull} of ${data.bareN} builds)`:`token 改动全部跟上（${data.bareN} 次构建 ${data.bareFull} 次做到）`}</p>
     <small>{en?'A raw file with only variables added (L0V)':'原始文件，只加了 variables（L0V）'}</small>
    </div>
   </Reveal>
   <Reveal className="vp-ringcard" delay={100}>
    <Ring color="#9b9ba3" partsRef={partsB} label={en?`${data.hexMedian}% of token changes followed with hex values, median build`:`只有 hex 值时，token 改动跟上的中位数是 ${data.hexMedian}%`}/>
    <div className="vp-ringtext">
     <span className="vp-ring-head">{en?'With hex values':'只有 hex 值'}</span>
     <p>{en?'of token changes followed (median build)':'token 改动跟上的比例（中位数）'}</p>
     <small>{en?`${data.hexN} builds without variables; ${data.hexFull?`${data.hexFull} followed it all`:'none followed the whole change'}`:`${data.hexN} 次没有 variables 的构建，${data.hexFull?`${data.hexFull} 次完整跟上`:'没有一次完整跟上'}`}</small>
    </div>
   </Reveal>
  </div>

  <div ref={plot} className={'vp-plot'+(plotIn||reduced?' is-in':'')+(settled?' is-settled':'')}
   onPointerLeave={e=>{if(e.pointerType==='mouse')hide();}}
   onPointerDown={e=>{if(!e.target.closest('[data-dot]'))hide();}}
   onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))hide();}}>
   <p className="vp-plot-k">{en?`${data.total} builds, one dot each: how much of a token change reached the code`:`${data.total} 次构建，一个点一次：token 改动有多少传进了代码`}</p>
   {cond.map(cn=><div key={cn.key} className={'vp-cond'+(cn.bound?' is-bound':'')}>
    <p className="vp-cond-h"><span className="vp-key" aria-hidden="true"/>{cn.head}<em>{en?`${cn.n} builds`:`${cn.n} 次构建`}</em></p>
    {data.rows.filter(r=>r.g.bound===cn.bound).map(row=><div key={row.g.id} className="vp-row">
     <div className="vp-row-l">
      <p><b>{row.g.id}</b> {row.g.name[L]}</p>
      <small>{row.g.desc[L]}</small>
      <span>{en?`median ${row.median}% · ${row.n} builds`:`中位数 ${row.median}% · ${row.n} 次`}</span>
     </div>
     <div className="vp-rtrack">
      {[0,25,50,75,100].map(v=><span key={v} className="vp-tick" style={at50(v)} aria-hidden="true"/>)}
      <span className="vp-med" style={at50(row.median)} aria-hidden="true"/>
      {row.dots.map(d=><button key={d.r.id} type="button" data-dot={d.i} className={'vp-dot'+(at===d.i?' is-on':'')} tabIndex={d.i===focusIdx?0:-1}
       style={{'--x':d.v,'--dx':d.dx,'--dy':d.dy,'--i':d.i}}
       aria-label={en?`${d.r.id}, ${d.r.name}, ${levelName(d.g)}: ${pct(d.r.share)} of the change reached the code`:`${d.r.id}，${screen(d.r)}，${levelName(d.g)}：改动有 ${pct(d.r.share)} 传进了代码`}
       onPointerEnter={e=>{if(e.pointerType==='mouse')show(d.i,e.currentTarget);}}
       onFocus={e=>{setFocusIdx(d.i);show(d.i,e.currentTarget);}}
       onClick={e=>show(d.i,e.currentTarget)}
       onKeyDown={e=>move(e,d.i)}><span/></button>)}
     </div>
    </div>)}
   </div>)}
   <div className="vp-row vp-axis" aria-hidden="true"><span/><div className="vp-rtrack">{[0,25,50,75,100].map(v=><span key={v} style={at50(v)}>{v}%</span>)}</div></div>
   <div className={'vp-tip'+(cur?' is-on':'')+(tip?.below?' is-below':'')} style={tip?{'--tx':tip.x,'--ty':tip.y}:undefined} aria-hidden="true">
    {cur&&<>
     <img src={`/assets/product/ready-for-agents/runs/${cur.r.id}.webp`} width={cur.r.w} height={cur.r.h} alt="" decoding="async"/>
     <div>
      <p className="vp-tip-id">{cur.r.id}</p>
      <p className="vp-tip-name">{screen(cur.r)} · {levelName(cur.g)}</p>
      <p className="vp-tip-share"><b>{pct(cur.r.share)}</b> {en?'of the change reached the code':'的改动传进了代码'}</p>
     </div>
    </>}
   </div>
  </div>
  {data.boundFull===data.boundN&&<p className="vp-takeaway">{en?`With variables, every build followed the whole change. Without them, none got past ${data.hexMax}%.`:`有 variables，每次构建都完整跟上了改动；没有，最高也没超过 ${data.hexMax}%。`}</p>}
  <p className="vp-fine">{en?`Exploratory measure, added after the first round’s results: a four-token change injected into each build’s page. ${data.total} builds, one model family, one small design system.`:`探索性指标，第一轮初步结果出来后加的：构建完成后，往页面里注入四个 token 的改动。${data.total} 次构建，一个模型系列，一个小型设计系统。`}</p>
 </>;
});

/* ---------- 4. Principles ---------- */

const Principles=memo(function Principles({items,lang,reduced}){
 const en=lang==='en',L=en?'en':'zh',list=useRef(null),rail=useRef(null),[at,setAt]=useState(0);
 // the principle crossing the middle of the screen is the one the frame shows
 useEffect(()=>{
  if(reduced||!list.current)return undefined;
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)setAt(+e.target.dataset.p);}),{rootMargin:'-49% 0px -50% 0px'});
  list.current.querySelectorAll('[data-p]').forEach(el=>io.observe(el));
  return()=>io.disconnect();
 },[reduced]);
 // progress through the list, for the rail under the frame: one read per frame while the page scrolls
 useEffect(()=>{
  const el=list.current;if(reduced||!el)return undefined;
  const scroller=el.closest('.portfolio-page-viewport')||window;let raf=0;
  const measure=()=>{raf=0;const r=el.getBoundingClientRect(),p=Math.min(1,Math.max(0,(innerHeight/2-r.top)/Math.max(1,r.height)));rail.current?.style.setProperty('--pp',p.toFixed(4));};
  const queue=()=>{if(!raf)raf=requestAnimationFrame(measure);};
  measure();scroller.addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);
  return()=>{cancelAnimationFrame(raf);scroller.removeEventListener('scroll',queue);removeEventListener('resize',queue);};
 },[reduced]);
 const snippet=(d,lazyLoad)=><span className="vp-snip" style={{'--w':d.img.w}}>
  <img src={d.img.src} width={d.img.w} height={d.img.h} alt="" loading={lazyLoad?'lazy':undefined} decoding="async"/>
  <b/><b/><b/><b/>
 </span>;
 return <div className="vp-prin">
  <div className="vp-pv" aria-hidden="true">
   <div className="vp-pv-frame">
    <p className="vp-pv-label"><FrameIcon/>{en?'Principle':'原则'} {pad2(at+1)}</p>
    <div className="vp-pv-stage">{items.map((d,i)=><figure key={i} className={'vp-pv-img'+(i===at?' is-on':'')}>
     {snippet(d,i>0)}
     <figcaption className="vp-badge">{d.img.w} × {d.img.h}</figcaption>
    </figure>)}</div>
   </div>
   <div className="vp-pv-foot"><span>{pad2(at+1)} / {pad2(items.length)}</span><span ref={rail} className="vp-pv-rail"><span/></span></div>
  </div>
  <ol ref={list} className="vp-plist">{items.map((d,i)=><li key={i} data-p={i} className={'vp-p'+(i===at?' is-on':'')}>
   <figure className="vp-p-img" aria-hidden="true">{snippet(d,true)}</figure>
   <span className="vp-p-n">{pad2(i+1)}</span>
   <h3>{d.title[L]}</h3>
   <p>{d.verdict[L]}</p>
  </li>)}</ol>
 </div>;
});

/* ---------- the page ---------- */

export default function VariablesPage({lang,reduced,onNavigate,slug='variables-for-agents'}){
 const film=FILMS[slug],en=lang==='en',L=en?'en':'zh',DUR=film.duration;
 const src='/video/'+film.stem+'-film.mp4',caseHref='/product/'+film.caseSlug,shots=film.cuts.length+1;
 const video=useRef(null),frames=useRef({}),[active,setActive]=useState('stream');
 const behavior=reduced?'auto':'smooth';
 const go=to=>event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();onNavigate(to);
 };
 const watch=useCallback(()=>{const v=video.current;if(!v)return;v.scrollIntoView({behavior,block:'center'});v.play().catch(()=>{});},[behavior]);
 const toFrame=useCallback(id=>{const el=frames.current[id];if(!el)return;el.scrollIntoView({behavior,block:'start'});el.focus({preventScroll:true});},[behavior]);
 const tryIt=useCallback(()=>toFrame('try'),[toFrame]);
 const frameRef=id=>el=>{frames.current[id]=el;};
 // the frame crossing the middle of the screen is the selected one
 useEffect(()=>{
  const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)setActive(e.target.dataset.frame);}),{rootMargin:'-45% 0px -54% 0px'});
  Object.values(frames.current).forEach(el=>el&&io.observe(el));
  return()=>io.disconnect();
 },[slug]);
 const name=id=>FRAMES.find(f=>f.id===id).name[L];
 const frame=(id,extra={})=>({id,name:name(id),active:active===id,frameRef:frameRef(id),labelledBy:'vp-h-'+id,...extra});
 const scores=film.scores,first=scores[0],last=scores[scores.length-1];

 return <article key={slug} className={'st-page vp-page'+(reduced?' st-still':'')} data-nav-tone="light" style={{'--accent':film.accent}}>
  <div className="vp-canvas">
   <div className="vp-top">
    <a href="/other-project" onClick={go('/other-project')}>← Other Project</a>
    <span>{en?'PRODUCT CONCEPT / LAUNCH FILM':'产品概念 / 宣传片'}</span>
   </div>
   <div className="vp-grid">
    <Layers active={active} onPick={toFrame} lang={lang} title={film.name}/>
    <div className="vp-main">

     <Frame {...frame('stream',{labelledBy:'vp-title',dark:true,bodyClass:'vp-hero-body'})}>
      <Stream film={film} lang={lang} reduced={reduced} onWatch={watch} onTry={tryIt}/>
     </Frame>

     <Frame {...frame('try')}>
      <header className="vp-head">
       <span className="vp-k">02 · {en?'How it works':'怎么用'}</span>
       <h2 id="vp-h-try">{en?'Bind them in one step. Undo in one.':'一步绑定，一步撤销。'}</h2>
       <p>{film.how[L]}</p>
      </header>
      <div className="vp-demo"><Suspense fallback={<div className="st-demo-loading st-mono">{en?'Loading the demo…':'正在加载演示…'}</div>}><VariablesDemo lang={L} reduced={reduced}/></Suspense></div>
     </Frame>

     <Frame {...frame('result')}>
      <header className="vp-head">
       <span className="vp-k">03 · {en?'The measurement':'测量'}</span>
       <h2 id="vp-h-result">{en?`Measured across ${RUNS.length} builds.`:`在 ${RUNS.length} 次构建里测过。`}</h2>
       <p>{film.problem[L]}</p>
      </header>
      <Result lang={lang} reduced={reduced}/>
     </Frame>

     <Frame {...frame('principles')}>
      <header className="vp-head">
       <span className="vp-k">04 · {en?'Design principles':'设计原则'}</span>
       <h2 id="vp-h-principles">{en?'Five principles, five pieces of interface':'五条原则，五块界面'}</h2>
       <p>{en?'Five principles the prototype was built to pass, each with the piece of interface that passes it.':'原型必须做到的五条原则，每条都配上做到这一点的那一小块界面。'}</p>
      </header>
      <Principles items={film.decisions} lang={lang} reduced={reduced}/>
     </Frame>

     <Frame {...frame('film')}>
      <header className="vp-head">
       <span className="vp-k">05 · {en?'Launch film':'宣传片'}</span>
       <h2 id="vp-h-film">{en?'How the film tells it':'片子怎么讲这件事'}</h2>
       <p>{en?`${DUR} seconds, 60 fps, no sound. Below is the edit itself: play it, or drag the timeline to jump to a beat.`:`${DUR} 秒，60 帧，无声。下面就是剪辑台：直接播放，或拖动时间线跳到任意一段。`}</p>
      </header>
      <ol className="vp-pins">{film.ideas.map((idea,i)=><Reveal as="li" key={i} delay={i*110} className="vp-pin">
       <span className="vp-pin-dot" aria-hidden="true">{i+1}</span>
       <div className="vp-bubble"><h3>{idea.title[L]}</h3><p>{idea.body[L]}</p></div>
      </Reveal>)}</ol>
      <div className="vp-desk" data-nav-tone="dark"><Desk film={film} slug={slug} lang={L} video={video}/></div>
      <p className="vp-links">
       <span>{en?'The edit: beats, headlines, shots and measured motion.':'剪辑台：段落、字幕、镜头和量出来的运动曲线。'}</span>
       <span><a href={caseHref} onClick={go(caseHref)}>{film.caseName[L]} →</a><a href={src} target="_blank" rel="noopener noreferrer">{en?'Open video':'单独打开视频'} ↗</a></span>
      </p>
     </Frame>

     <Frame {...frame('review')}>
      <header className="vp-head">
       <span className="vp-k">06 · {en?'Craft':'打磨'}</span>
       <h2 id="vp-h-review">{en?'Review notes, resolved':'评审意见，逐条解决'}</h2>
       <p>{en?`The cut went through ${scores.length} rounds of independent review. These notes came back, and this is what changed.`:`片子经过 ${scores.length} 轮独立评审。下面是评审提的意见，以及片子是怎么改的。`}</p>
      </header>
      <ol className="vp-threads">{film.notes.map((n,i)=><Reveal as="li" key={i} delay={i*90} className="vp-thread">
       <div className="vp-cmt">
        <span className="vp-av is-pin" aria-hidden="true">{i+1}</span>
        <div><p className="vp-cmt-h"><b>{en?'Review note':'评审意见'}</b><span>{pad2(i+1)}</span></p><p>{n.note[L]}</p></div>
       </div>
       <div className="vp-cmt vp-reply">
        <span className="vp-av is-reply" aria-hidden="true">↳</span>
        <div><p className="vp-cmt-h"><b>{en?'What changed':'怎么改的'}</b><span className="vp-resolved">{en?'Resolved ✓':'已解决 ✓'}</span></p><p>{n.fix[L]}</p></div>
       </div>
      </Reveal>)}</ol>
      <p className="vp-stat">
       <span><b>{shots}</b>{en?'shots':'个镜头'}</span>
       <span><b>60</b>fps</span>
       <span><b>{first} → {last}</b>{en?`review score over ${scores.length} rounds`:`${scores.length} 轮评审的分数`}</span>
       <span className="vp-spark" aria-hidden="true">{scores.map((s,i)=><span key={i} style={{'--v':s}}/>)}</span>
      </p>
     </Frame>

     <NextProject item={nextAfter(slug)} lang={lang} onNavigate={onNavigate}/>
     <footer className="st-footer"><span>JAY LIN / {film.name.toUpperCase()}</span><p>{en?'A product concept by Jay Lin.':'林世杰的产品概念。'}</p></footer>
    </div>
   </div>
  </div>
 </article>;
}
