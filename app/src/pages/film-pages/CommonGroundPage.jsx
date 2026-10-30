import {lazy,Suspense,useEffect,useId,useLayoutEffect,useRef,useState} from 'react';
import {FILMS,nextAfter} from '../product-films-data';
import {Reveal,useInView,Flipbook,NextProject} from '../story/Story';
import {Desk,FPS} from '../story/FilmDesk';
import {plans,scenarios,money,rate,annualPremium,worstYear,cost,dominator,premiumDifference} from '../../product/v2/data/cntl-model.js';
import './common-ground-page.css';

/* Common Ground: "the page shows its arithmetic". The film's two rooms are the page's colours: deep blue for the
   comparison (#0a0b12, sampled from flip-01 / sig-1) and wine for the $600 (#1b0a12, flip-04…24 / sig-2…6), which
   fades in as a fixed layer while the proof is on screen. Every number is computed here with the prototype's own model
   (cntl-model.js, integer cents); the plans are fictional. Motion is transform and opacity only; scroll work runs in a
   rAF-throttled passive listener and writes straight to the DOM; React renders only on discrete changes. */

const CommonGroundDemo=lazy(()=>import('../demos/CommonGroundDemo'));

const COLORS={a:'#8b7bff',b:'#3f9cff',c:'#22c3b5',d:'#3ecf6e'};                  // the prototype's plan colours (CommonGroundDemo.jsx)
const STEP=250000,AX=Math.ceil(Math.max(...plans.map(worstYear))/STEP)*STEP;     // yearly axis: $0…$10,000 in $2,500 steps, as in the demo
const AXIS=Array.from({length:AX/STEP+1},(_,i)=>i*STEP);
const short=v=>v===0?'$0':`$${v/100000}k`;
const BY_PREMIUM=[...plans].sort((a,b)=>a.monthlyPremium-b.monthlyPremium||a.id.localeCompare(b.id));   // C, A, B, D
const BY_WORST=[...plans].sort((a,b)=>worstYear(a)-worstYear(b)||a.id.localeCompare(b.id));             // D, A, B, C
const RANK=BY_PREMIUM.map(p=>BY_WORST.indexOf(p));
const LOWEST=BY_PREMIUM[0];                                                      // ★ Lowest premium (Plan C)
const PLAN_B=plans.find(p=>dominator(p)),PLAN_A=dominator(PLAN_B);               // same coverage, one costs more
const GAP=premiumDifference(PLAN_B,PLAN_A);                                      // 60000 cents = $600 a year
const SAMPLES=16;                                                                // shutter samples per frame (film.notes[2], FilmCase craft)
const TERMS=[
 {label:{en:'Deductible',zh:'免赔额'},a:PLAN_A.deductible,b:PLAN_B.deductible,f:money},
 {label:{en:'Coinsurance',zh:'共同保险'},a:PLAN_A.coinsuranceBps,b:PLAN_B.coinsuranceBps,f:rate},
 {label:{en:'Out-of-pocket max',zh:'自付上限'},a:PLAN_A.oopMax,b:PLAN_B.oopMax,f:money},
 {label:{en:'Monthly premium',zh:'月保费'},a:PLAN_A.monthlyPremium,b:PLAN_B.monthlyPremium,f:money},
 {label:{en:'× 12 months',zh:'× 12 个月'},a:annualPremium(PLAN_A),b:annualPremium(PLAN_B),f:money},
];
const HEADS_ZH=['挑保费最低的那个？','看一整年。','保费最低，最坏的一年却最贵。'];

// the page's easing, cubic-bezier(.33,0,.2,1), for scroll-scrubbed segments
const EASE=(()=>{const x1=.33,y1=0,x2=.2,y2=1,cx=3*x1,bx=3*(x2-x1)-cx,ax=1-cx-bx,cy=3*y1,by=3*(y2-y1)-cy,ay=1-cy-by;
 const X=t=>((ax*t+bx)*t+cx)*t,Y=t=>((ay*t+by)*t+cy)*t,D=t=>(3*ax*t+2*bx)*t+cx;
 return x=>{if(x<=0)return 0;if(x>=1)return 1;let t=x;for(let i=0;i<8;i++){const d=D(t);if(Math.abs(d)<1e-6)break;t=Math.min(1,Math.max(0,t-(X(t)-x)/d));}return Y(t);};})();
const seg=(p,a,b)=>Math.min(1,Math.max(0,(p-a)/(b-a)));
const scrollerOf=el=>el?.closest('.portfolio-page-viewport')||window;
const LABEL_GAP=20,ARC=16,OMEGA=13;

/* 1. Opening: four premiums as pills, cheapest first; scrolling stretches them into the whole year (premiums ×12 plus the
   out-of-pocket maximum), re-sorts them cheapest first again, and rings the lowest premium's costliest worst year. */
function Opening({film,lang,reduced,back,onWatch,onTry}){
 const en=lang==='en',uid=useId(),titleId=uid+'-title';
 const track=useRef(null),stage=useRef(null),title=useRef(null),cue=useRef(null),ring=useRef(null),grid=useRef(null),monthly=useRef(null),yearly=useRef(null),legend=useRef(null);
 const rows=useRef(BY_PREMIUM.map(()=>({}))),geo=useRef(null),shown=useRef(0),headRef=useRef(reduced?2:0),ringRef=useRef(false),paintRef=useRef(null);
 const [head,setHead]=useState(reduced?2:0),[ringOn,setRingOn]=useState(false);
 const heads=film.headlines.slice(0,3),refFns=useRef({});
 const put=(i,key)=>refFns.current[i+key]??=(el=>{rows.current[i][key]=el;});   // stable callbacks: no detach/attach churn on re-render

 paintRef.current=p=>{
  const g=geo.current,r=rows.current;if(!g)return;
  const k1=EASE(seg(p,.05,.38)),k2=EASE(seg(p,.44,.64)),k3=EASE(seg(p,.62,.74)),k4=EASE(seg(p,.8,.95));
  for(let i=0;i<r.length;i++){
   const x=r[i],L=g.pill+(g.bar[i]-g.pill)*k1;
   x.body.style.transform=`scaleX(${((L-g.h+1)/g.bodyW).toFixed(5)})`;
   x.capR.style.transform=`translate3d(${(L-g.h/2).toFixed(2)}px,0,0)`;
   x.pill.style.opacity=(1-seg(k1,0,.3)).toFixed(3);
   x.prem.style.opacity=seg(k1,.7,1).toFixed(3);
   x.year.style.transform=`translate3d(${(L+LABEL_GAP).toFixed(2)}px,-50%,0)`;
   x.year.style.opacity=seg(k1,.55,1).toFixed(3);
   if(x.hi){x.hi.style.opacity=k3.toFixed(3);x.lo.style.opacity=(1-k3).toFixed(3);}
   const d=RANK[i]-i;
   x.row.style.transform=d?`translate3d(${(Math.sin(Math.PI*k2)*ARC*Math.sign(d)).toFixed(2)}px,${(d*g.slot*k2).toFixed(2)}px,0)`:'none';
  }
  ring.current.style.transform=`translate3d(${(g.bar[0]-g.h/2).toFixed(2)}px,0,0) scale(${(.55+.45*k3).toFixed(4)})`;
  ring.current.style.opacity=k3.toFixed(3);
  monthly.current.style.opacity=(1-k1).toFixed(3);yearly.current.style.opacity=k1.toFixed(3);
  legend.current.style.opacity=seg(k1,.6,1).toFixed(3);grid.current.style.opacity=k1.toFixed(3);
  cue.current.style.opacity=(1-seg(p,0,.06)).toFixed(3);
  title.current.style.opacity=k4.toFixed(3);
  title.current.style.transform=`translate3d(0,${((1-k4)*24).toFixed(2)}px,0)`;
  title.current.style.pointerEvents=k4>.5?'':'none';
  stage.current.style.setProperty('--k4',k4.toFixed(3));
  const h=p<.12?0:p<.48?1:2;if(h!==headRef.current){headRef.current=h;setHead(h);}
  const on=k3>.99;if(on!==ringRef.current){ringRef.current=on;setRingOn(on);}
 };

 useLayoutEffect(()=>{
  const el=track.current,scroller=scrollerOf(el);let raf=0,last=0,vel=0,alive=true;
  // geometry is read only on mount, resize, font load and language change; never per frame
  const measure=()=>{
   const r=rows.current;
   const plotW=r[0].plot.clientWidth,h=r[0].plot.clientHeight;
   const pillIn=Math.max(...r.map(x=>x.pillIn.offsetWidth)),yearW=Math.max(...r.map(x=>x.year.offsetWidth));
   const slot=r[1].row.offsetTop-r[0].row.offsetTop,range=el.offsetHeight-stage.current.offsetHeight;
   const pill=Math.max(h*2,pillIn+28),unit=Math.max(0,plotW-yearW-LABEL_GAP-4)/AX;
   const bar=BY_PREMIUM.map(p=>Math.max(pill+12,worstYear(p)*unit));
   r.forEach((x,i)=>{x.pill.style.width=pill+'px';x.prem.style.width=Math.max(h/2+1,annualPremium(BY_PREMIUM[i])*unit).toFixed(2)+'px';});
   grid.current.style.width=(AX*unit).toFixed(2)+'px';
   geo.current={h,pill,bar,slot,bodyW:Math.max(1,plotW),range:Math.max(1,range)};
  };
  const read=()=>reduced?1:Math.min(1,Math.max(0,-el.getBoundingClientRect().top/geo.current.range));
  // a critically damped follower on the scroll position, so wheel steps glide instead of jumping
  const frame=t=>{
   raf=0;const target=read();let p=shown.current;
   const dt=last?Math.min(.05,(t-last)/1000):1/60;last=t;
   const e=p-target,q=vel+OMEGA*e,k=Math.exp(-OMEGA*dt);let ne=(e+q*dt)*k,nv=(vel-OMEGA*q*dt)*k;
   if(Math.abs(ne)<2e-4&&Math.abs(nv)<2e-3){ne=0;nv=0;}
   p=target+ne;vel=nv;shown.current=p;paintRef.current(p);
   if(p!==target)raf=requestAnimationFrame(frame);else last=0;
  };
  const queue=()=>{if(!raf)raf=requestAnimationFrame(frame);};
  const refresh=()=>{if(!alive)return;measure();paintRef.current(shown.current);};
  measure();shown.current=read();vel=0;paintRef.current(shown.current);
  const ro=new ResizeObserver(refresh);ro.observe(stage.current);ro.observe(rows.current[0].plot);
  document.fonts?.ready.then(refresh);
  if(!reduced)scroller.addEventListener('scroll',queue,{passive:true});
  return()=>{alive=false;cancelAnimationFrame(raf);ro.disconnect();scroller.removeEventListener('scroll',queue);};
 },[reduced,lang]);

 const summary=en
  ?`Sorted by monthly premium: ${BY_PREMIUM.map(p=>`${p.name} ${money(p.monthlyPremium)}`).join(', ')}. Sorted by the most a year can cost, premiums included: ${BY_WORST.map(p=>`${p.name} ${money(worstYear(p))}`).join(', ')}.`
  :`按月保费排序：${BY_PREMIUM.map(p=>`${p.name} ${money(p.monthlyPremium)}`).join('，')}。按一年最多花费（含保费）排序：${BY_WORST.map(p=>`${p.name} ${money(worstYear(p))}`).join('，')}。`;

 return <section className={'cp-open'+(reduced?' is-still':'')} aria-labelledby={titleId}>
  <div ref={track} className="cp-track">
   <div ref={stage} className="cp-stage">
    <div className="cp-kick"><a href="/other-project" onClick={back}>← Other Project</a><span>{en?'Product concept / launch film':'产品概念 / 宣传片'}</span></div>

    <div className="cp-heads" aria-hidden="true">{heads.map(([a,,text],i)=><p key={i} className={'cp-head'+(i===head||reduced?' is-on':i<head?' is-past':'')}>
     <span className="cp-head-t">{en?`Film · ${a.toFixed(2)} s`:`片中 ${a.toFixed(2)} s · “${text}”`}</span>
     <span className="cp-head-l">{en?text:HEADS_ZH[i]}</span>
    </p>)}</div>
    <p className="cp-sr">{heads.map(([,,text],i)=>en?text:HEADS_ZH[i]).join(' ')}</p>

    <div className="cp-chart">
     <div className="cp-chart-head" aria-hidden="true">
      <span className="cp-swap"><span ref={monthly}>{en?'Monthly premium':'月保费'}</span><span ref={yearly} style={{opacity:0}}>{en?'Worst year, premiums included':'最坏的一年（含保费）'}</span></span>
      <span ref={legend} className="cp-legend" style={{opacity:0}}><span><i/>{en?'Premiums × 12':'保费 × 12'}</span><span><i className="is-oop"/>{en?'Out-of-pocket max':'自付上限'}</span></span>
     </div>
     <div className="cp-chart-body" aria-hidden="true">
      <div ref={grid} className="cp-grid" style={{opacity:0}}>{AXIS.map(v=><span key={v} style={{left:`${v/AX*100}%`}}><i>{short(v)}</i></span>)}</div>
      <ol className="cp-rows">{BY_PREMIUM.map((p,i)=>{const low=p===LOWEST;return <li key={p.id} ref={put(i,'row')} className={'cp-row'+(RANK[i]!==i?' is-moving':'')} style={{'--c':COLORS[p.id]||'#8b8b95'}}>
       <span className="cp-row-name"><b>{p.name}</b>{low&&<em>★ Lowest premium</em>}</span>
       <span className="cp-plot" ref={put(i,'plot')}>
        <span className="cp-body" ref={put(i,'body')}/>
        <span className="cp-cap"/>
        <span className="cp-cap is-r" ref={put(i,'capR')}/>
        <span className="cp-prem" ref={put(i,'prem')}/>
        <span className="cp-pill" ref={put(i,'pill')}><span ref={put(i,'pillIn')}>{money(p.monthlyPremium)}<small>{en?'/mo':'/月'}</small></span></span>
        {low&&<span ref={ring} className={'cp-ring'+(ringOn&&!reduced?' is-on':'')}/>}
        <span className="cp-year" ref={put(i,'year')}>
         <span className="cp-year-lo" ref={low?put(i,'lo'):undefined}>{money(worstYear(p))}</span>
         {low&&<span className="cp-year-hi" ref={put(i,'hi')}>{money(worstYear(p))}<small>worst year</small></span>}
        </span>
       </span>
      </li>;})}</ol>
     </div>
     <p className="cp-sr">{summary}</p>
     <p className="cp-fine">{en?`${plans.length} fictional plans · not advice`:`${plans.length} 个虚构方案 · 不构成建议`}</p>
    </div>

    <p ref={cue} className="cp-cue" aria-hidden="true"><i/>{en?'Scroll to see the whole year':'往下滚，看一整年'}</p>
    <div ref={title} className="cp-title" style={{opacity:0}}>
     <h1 id={titleId}>{film.name}</h1>
     <p className="cp-tagline">{film.tagline[0]} <i>{film.tagline[1]}</i></p>
     <div className="cp-actions">
      <button type="button" className="cp-btn is-primary" onClick={onWatch}>▶ {en?'Watch the film':'看片子'}</button>
      <button type="button" className="cp-btn" onClick={onTry}>{en?'Try it':'试一试'} ↓</button>
     </div>
    </div>
   </div>
  </div>
 </section>;
}

/** A section head: a mono line label, a big title and a short lead. */
function Head({n,label,title,lead,id,kicker}){
 return <Reveal as="header" className="cp-sh">
  <span className="cp-k"><b>{n}</b>{label}</span>
  {kicker&&<p className="cp-sh-q">{kicker}</p>}
  <h2 id={id}>{title}</h2>
  {lead&&<p className="cp-sh-lead">{lead}</p>}
 </Reveal>;
}

const W=({children})=><span className="cp-w"><span>{children}</span></span>;

/** One line of the proof: it writes itself when it reaches the lower third of the screen. */
function Line({className,reduced,children}){
 const ref=useRef(null),inView=useInView(ref,{threshold:0,margin:'0px 0px -22% 0px'});
 return <tr ref={ref} className={'cp-line'+(inView||reduced?' is-in':'')+(className?' '+className:'')}>{children}</tr>;
}

/* 2. The proof: Plan A and Plan B term by term; only the premium differs, so B costs the same amount more at every bill. */
function Proof({film,lang,reduced,headId}){
 const en=lang==='en',A=PLAN_A,B=PLAN_B;
 const line=film.headlines.find(([a])=>a>=film.flip[0])?.[2]||'';                 // the line on screen in the flip frames
 const same=line.includes('. ')?line.slice(0,line.indexOf('. ')+1):line;
 const diff=t=>{const d=t.b-t.a;return d===0?(en?'same':'相同'):(d>0?'+':'−')+t.f(Math.abs(d));};
 const op=t=>t.a===t.b?'=':t.a<t.b?'<':'>';
 return <>
  <Head n="01" label={en?'The proof':'证明'} id={headId}title={en?same:`${B.name} 和 ${A.name}，保障一模一样。`}
   lead={en?'Line them up term by term. Three terms match; only the premium differs, and it differs every month.':'逐项对一遍：三项条款完全一样，只有保费不同，而且每个月都不同。'}/>
  <table className="cp-sum">
   <caption className="cp-sr">{en?`${A.name} and ${B.name}, term by term`:`${A.name} 和 ${B.name} 的条款对照`}</caption>
   <thead><tr>
    <td/>
    <th scope="col"><span className="cp-dot" style={{'--c':COLORS[A.id]}}/>{A.name}</th>
    <td aria-hidden="true"/>
    <th scope="col"><span className="cp-dot" style={{'--c':COLORS[B.id]}}/>{B.name}</th>
    <th scope="col" className="cp-d">{en?'B − A':'B − A'}</th>
   </tr></thead>
   <tbody>{TERMS.map((t,i)=>{const d=t.b-t.a;return <Line key={i} reduced={reduced} className={d?'is-diff':undefined}>
    <th scope="row" style={{'--i':0}}><W>{t.label[lang]}</W></th>
    <td style={{'--i':1}}><W>{t.f(t.a)}</W></td>
    <td className="cp-op" aria-hidden="true" style={{'--i':2}}><W>{op(t)}</W></td>
    <td style={{'--i':3}}><W>{t.f(t.b)}</W></td>
    <td className={'cp-d'+(d?' is-red':'')} style={{'--i':4}}><W>{diff(t)}</W></td>
   </Line>;})}</tbody>
   <tfoot><Line reduced={reduced} className="cp-total">
    <th scope="row" style={{'--i':0}}><W>= {en?'Every year':'每一年'}</W></th>
    <td colSpan={4} style={{'--i':1}}><W><b className="cp-600">+{money(GAP)}</b></W><span className="cp-600-t">{en?`more for ${B.name}, at every bill amount`:`${B.name} 多花的钱，账单多少都一样`}</span></td>
   </Line></tfoot>
  </table>
  <Check lang={lang} reduced={reduced}/>
  <p className="cp-proof-fine">{en?'It holds because these fictional plans share the same coverage and network. Not advice.':'前提是这几个虚构方案的保障范围和医疗网络完全相同。不构成建议。'}</p>
 </>;
}

/** The live check: pick a bill amount; both yearly totals move and the gap between them rides along, the same size. */
function Check({lang,reduced}){
 const en=lang==='en',[sel,setSel]=useState(scenarios[Math.min(1,scenarios.length-1)].id);
 const s=scenarios.find(x=>x.id===sel),at=cost(PLAN_A,s.charges).total,bt=cost(PLAN_B,s.charges).total;
 const gapAt=x=>cost(PLAN_B,x.charges).total-cost(PLAN_A,x.charges).total;
 return <Reveal className={'cp-check'+(reduced?' is-still':'')}>
  <div className="cp-check-ctl">
   <span className="cp-k"><b>✓</b>{en?'Check it':'验算一下'}</span>
   <p className="cp-check-hint">{en?'Pick a bill amount. The gap stays put.':'换一个账单金额，差额不变。'}</p>
   <div className="cp-chips" role="group" aria-label={en?'Covered bills this year':'今年的承保医疗费用'}>
    {scenarios.map(x=><button key={x.id} type="button" className="cp-chip" aria-pressed={x.id===sel} onClick={()=>setSel(x.id)}><b>{x.short}</b><span>+{money(gapAt(x))}</span></button>)}
   </div>
  </div>
  <div className="cp-check-plot">
   <div className="cp-bars" aria-hidden="true">
    {[[PLAN_A,at],[PLAN_B,bt]].map(([p,total])=><div key={p.id} className="cp-bar-row" style={{'--c':COLORS[p.id]}}>
     <span className="cp-bar-name">{p.name}</span>
     <span className="cp-bar-track">
      <span className="cp-bar-fill" style={{transform:`scaleX(${(total/AX).toFixed(5)})`}}/>
      {p===PLAN_B&&<span className="cp-bar-gap" style={{transform:`translateX(${(at/AX*100).toFixed(3)}%) scaleX(${((bt-at)/AX).toFixed(5)})`}}/>}
     </span>
     <span className="cp-bar-n">{money(total)}</span>
    </div>)}
   </div>
   <p className="cp-eq" aria-live="polite"><span className="cp-sr">{en?`At ${s.short} of covered bills: `:`承保医疗费用 ${s.short} 时：`}</span>{money(bt)} − {money(at)} = <b>+{money(bt-at)}</b></p>
  </div>
 </Reveal>;
}

/* 4. Decisions as a ledger: what was tried first and what was chosen; each row opens to its screen and verdict. */
function Ledger({items,lang}){
 const en=lang==='en',uid=useId(),[open,setOpen]=useState({});
 const cols=en?['Decision','Tried first','Chose']:['决策','先试过','最后选'];
 return <table className="cp-ledger">
  <caption className="cp-sr">{en?'Design decisions: what was tried first and what was chosen':'设计决策：先试过什么，最后选了什么'}</caption>
  <colgroup><col className="cp-c1"/><col/><col/></colgroup>
  <thead><tr>{cols.map(c=><th key={c} scope="col">{c}</th>)}</tr></thead>
  {items.map((d,i)=>{const on=!!open[i],did=`${uid}-d${i}`;return <tbody key={i} className={on?'is-open':undefined}>
   <tr className="cp-l-row">
    <th scope="row"><button type="button" className="cp-l-btn" aria-expanded={on} aria-controls={did} onClick={()=>setOpen(o=>({...o,[i]:!o[i]}))}>
     <span className="cp-l-n">{String(i+1).padStart(2,'0')}</span><span className="cp-l-t">{d.title[lang]}</span><span className="cp-l-x" aria-hidden="true">+</span>
    </button></th>
    <td className="cp-l-tried" data-label={cols[1]}>{d.tried?.[lang]}</td>
    <td className="cp-l-chose" data-label={cols[2]}>{d.chose?.[lang]}</td>
   </tr>
   <tr className="cp-l-detail" id={did} hidden={!on}><td colSpan={3}><div className="cp-l-body">
    <img src={d.img.src} alt={en?`The prototype screen behind “${d.title.en}”`:`“${d.title.zh}”对应的原型界面`} loading="lazy" decoding="async" style={{objectPosition:d.img.position}}/>
    <p className="cp-l-verdict">{d.verdict[lang]}</p>
   </div></td></tr>
  </tbody>;})}
 </table>;
}

/* 6. The craft as a printed receipt, with the review notes and what changed beside it. */
function Receipt({film,lang,reduced}){
 const en=lang==='en',ref=useRef(null),inView=useInView(ref,{threshold:.15});
 const shots=film.cuts.length+1,first=film.scores[0],last=film.scores[film.scores.length-1];
 let n=0;const at=()=>({'--i':n++});
 // a plain call, not a component, so the lines are never remounted (their print-in transition would be lost)
 const item=(k,v,className,key)=><li key={key} className={'cp-li'+(className?' '+className:'')} style={at()}><span>{k}</span><i aria-hidden="true"/><b>{v}</b></li>;
 return <div className="cp-craft">
  <div ref={ref} className={'cp-slip'+(inView||reduced?' is-in':'')}>
   <ul>
    <li className="cp-slip-h" style={at()}><b>{film.name.toUpperCase()}</b><span>{en?'Launch film':'宣传片'} · {film.file}</span><span>{film.duration} s · 1920 × 1080 · {en?'no sound':'无声'}</span></li>
    <li className="cp-rule" style={at()} aria-hidden="true"/>
    {item(en?'Shots':'镜头',shots)}
    {item(en?'Hard cuts, on exact frames':'硬切，都落在整帧上',film.cuts.length)}
    {item(en?'Frame rate':'帧率',`${FPS} fps*`)}
    {item(en?'Motion-blur samples / frame':'每帧运动模糊采样',SAMPLES)}
    {item(en?'Review rounds':'评审轮次',film.scores.length)}
    <li className="cp-rule" style={at()} aria-hidden="true"/>
    <li className="cp-slip-sub" style={at()}>{en?'Independent review score':'独立评审分数'}</li>
    {film.scores.map((s,i)=>item(en?`Round ${i+1}`:`第 ${i+1} 轮`,s,'is-small',i))}
    {item(en?'Total':'合计',`${first} → ${last}`,'cp-li-total')}
    <li className="cp-perf" style={at()} aria-hidden="true"/>
    <li className="cp-slip-f" style={at()}>{en?'A product concept by Jay Lin.':'林世杰的产品概念。'}</li>
   </ul>
  </div>
  <div className="cp-craft-side">
   <p className="cp-k"><b>→</b>{en?'Review note → what changed':'评审意见 → 怎么改的'}</p>
   <ol className="cp-notes">{film.notes.map((x,i)=><Reveal as="li" key={i} delay={i*80}>
    <span className="cp-notes-n">{String(i+1).padStart(2,'0')}</span>
    <p className="cp-note"><span className="cp-sr">{en?'Review note: ':'评审意见：'}</span>{x.note[lang]}</p>
    <span className="cp-arrow" aria-hidden="true">→</span>
    <p className="cp-fix"><span className="cp-sr">{en?'What changed: ':'怎么改的：'}</span>{x.fix[lang]}</p>
   </Reveal>)}</ol>
   <p className="cp-foot"><span aria-hidden="true">* </span>{film.smoothText[lang]}</p>
  </div>
 </div>;
}

export default function CommonGroundPage({lang,reduced,onNavigate,slug}){
 const film=FILMS[slug],en=lang==='en',media='/assets/other-project/'+slug,src='/video/'+film.stem+'-film.mp4',caseHref='/product/'+film.caseSlug;
 const video=useRef(null),demo=useRef(null),proof=useRef(null),wineEl=useRef(null),uid=useId();
 const [wine,setWine]=useState(false),[stickyWine,setStickyWine]=useState(false);
 const go=to=>event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();onNavigate(to);
 };
 const behavior=reduced?'auto':'smooth';
 const watch=t=>{const v=video.current;if(!v)return;if(typeof t==='number')v.currentTime=t;v.play().catch(()=>{});v.scrollIntoView({behavior,block:'center'});};
 const flipFrames=Array.from({length:24},(_,i)=>`${media}/flip-${String(i+1).padStart(2,'0')}.webp`);
 const flipLine=film.headlines.findIndex(([a])=>a>=film.flip[0]);
 const [ask,answer]=film.headlines.slice(flipLine+1,flipLine+3).map(h=>h[2]);     // "Which plan is cheapest?" "Depends on the year."

 // position:fixed only covers the viewport if no ancestor makes a containing block; otherwise use a sticky layer
 useLayoutEffect(()=>{
  let el=wineEl.current?.parentElement,broken=false;
  while(el&&el!==document.documentElement){
   const cs=getComputedStyle(el);
   if(cs.transform!=='none'||cs.perspective!=='none'||cs.filter!=='none'||(cs.backdropFilter||'none')!=='none'||/paint|layout|strict|content/.test(cs.contain||'')||/transform|perspective|filter/.test(cs.willChange||'')||(cs.containerType||'normal')!=='normal'){broken=true;break;}
   el=el.parentElement;
  }
  setStickyWine(broken);
 },[]);
 // the room turns wine while the proof crosses the middle of the screen
 useEffect(()=>{
  if(reduced){setWine(false);return;}
  const io=new IntersectionObserver(([e])=>setWine(e.isIntersecting),{rootMargin:'-40% 0px -40% 0px'});
  io.observe(proof.current);return()=>io.disconnect();
 },[reduced]);

 return <article className={'st-page cp-page'+(reduced?' st-still':'')} data-nav-tone="dark" style={{'--accent':film.accent}}>
  <div ref={wineEl} className={'cp-wine'+(wine?' is-on':'')+(stickyWine?' is-sticky':'')} aria-hidden="true"/>

  <Opening film={film} lang={lang} reduced={reduced} back={go('/other-project')} onWatch={()=>watch(0)} onTry={()=>demo.current?.scrollIntoView({behavior,block:'start'})}/>

  <section ref={proof} className={'cp-sec cp-proof'+(reduced?' is-wine':'')} aria-labelledby={uid+'-p'}>
   <div className="cp-wrap"><Proof film={film} lang={lang} reduced={reduced} headId={uid+'-p'}/></div>
  </section>

  <section ref={demo} className="cp-sec cp-try" aria-labelledby={uid+'-t'}>
   <div className="cp-wrap">
    <Head n="02" label={en?'Try it':'试一试'} id={uid+'-t'} kicker={en?ask:'哪个方案最便宜？'} title={en?answer:'要看是怎样的一年。'} lead={film.how[lang]}/>
    <Reveal className="cp-demo"><Suspense fallback={<div className="st-demo-loading st-mono">{en?'Loading the demo…':'正在加载演示…'}</div>}><CommonGroundDemo lang={lang} reduced={reduced}/></Suspense></Reveal>
   </div>
  </section>

  <section className="cp-sec cp-why" aria-labelledby={uid+'-d'}>
   <div className="cp-wrap">
    <Head n="03" label={en?'Decisions':'设计决策'} id={uid+'-d'} title={en?'What I tried, what I chose':'先试了什么，最后选了什么'}
     lead={en?`${film.decisions.length} decisions from the case study. Open a row to see the screen it shaped.`:`案例里的 ${film.decisions.length} 个设计决策。展开一行，看它落在哪块界面上。`}/>
    <Reveal><Ledger items={film.decisions} lang={lang}/></Reveal>
   </div>
  </section>

  <section className="cp-sec cp-film" aria-labelledby={uid+'-f'}>
   <div className="cp-wrap">
    <Head n="04" label={en?'The film':'宣传片'} id={uid+'-f'} title={en?`Blue for the comparison. Wine for the ${money(GAP)}.`:`比较时是蓝色，讲到 ${money(GAP)} 转成酒红。`}/>
    <ol className="cp-ideas">{film.ideas.map((idea,i)=><Reveal as="li" key={i} delay={i*90}><b>{String(i+1).padStart(2,'0')}</b><h3>{idea.title[lang]}</h3><p>{idea.body[lang]}</p></Reveal>)}</ol>
    <Reveal as="p" className="cp-flip-lead">{film.signatureText[lang]}</Reveal>
    <Flipbook frames={flipFrames} steps={film.signature} duration={film.flip} reduced={reduced} lang={lang} onPlay={watch}/>
    <Reveal><Desk film={film} slug={slug} lang={lang} video={video}/></Reveal>
    <div className="cp-film-links"><span>{en?'The edit: beats, headlines, shots and measured motion.':'剪辑台：段落、字幕、镜头和量出来的运动曲线。'}</span><span><a href={caseHref} onClick={go(caseHref)}>{film.caseName[lang]} →</a><a href={src} target="_blank" rel="noopener noreferrer">{en?'Open video':'单独打开视频'} ↗</a></span></div>
   </div>
  </section>

  <section className="cp-sec cp-receipt" aria-labelledby={uid+'-c'}>
   <div className="cp-wrap">
    <Head n="05" label={en?'Craft':'技术'} id={uid+'-c'} title={en?`What went into ${film.duration} seconds`:`${film.duration} 秒里有什么`}/>
    <Receipt film={film} lang={lang} reduced={reduced}/>
   </div>
  </section>

  <div className="cp-wrap">
   <NextProject item={nextAfter(slug)} lang={lang} onNavigate={onNavigate}/>
   <footer className="st-footer"><span>JAY LIN / {film.name.toUpperCase()}</span><p>{en?'A product concept by Jay Lin.':'林世杰的产品概念。'}</p></footer>
  </div>
 </article>;
}
