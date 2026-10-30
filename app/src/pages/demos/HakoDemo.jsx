import {useCallback,useEffect,useRef,useState} from 'react';
import './hako-demo.css';

// Hako's one gesture, playable: draw a selection box over the team's sketch and agents build what is inside it.
// Same rules as the film and the brand board: persimmon is your own selection, ultraviolet is the agents', and the
// product being built (Daybreak, a home-energy dashboard) keeps its own dark palette. Hako and Daybreak are fictional.
const W=880,H=520; // the canvas in its own units
const REGIONS=[
 {id:'header',agent:'Layout',x:40,y:34,w:800,h:56},
 {id:'kpis',agent:'Metrics',x:40,y:112,w:800,h:118},
 {id:'chart',agent:'Metrics',x:40,y:252,w:520,h:232},
 {id:'devices',agent:'Devices',x:584,y:252,w:256,h:232},
];
const AGENTS=['Layout','Metrics','Devices'];
const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const toBox=(a,b)=>({x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(a.x-b.x),h:Math.abs(a.y-b.y)});

function Sketch({r}){
 // hand-drawn placeholders: what the team put on the board
 if(r.id==='header')return <g><rect x={r.x+6} y={r.y+16} width="120" height="22" rx="4"/><line x1={r.x+560} y1={r.y+28} x2={r.x+700} y2={r.y+28}/><circle cx={r.x+760} cy={r.y+28} r="14"/></g>;
 if(r.id==='kpis')return <g>{[0,1,2].map(i=><g key={i}><rect x={r.x+i*272} y={r.y} width="256" height={r.h} rx="10"/><line x1={r.x+i*272+20} y1={r.y+34} x2={r.x+i*272+110} y2={r.y+34}/><line x1={r.x+i*272+20} y1={r.y+76} x2={r.x+i*272+80} y2={r.y+76} strokeWidth="6"/></g>)}</g>;
 if(r.id==='chart')return <g><rect x={r.x} y={r.y} width={r.w} height={r.h} rx="10"/><path d={`M${r.x+24} ${r.y+r.h-30} C ${r.x+140} ${r.y+r.h-40}, ${r.x+200} ${r.y+50}, ${r.x+270} ${r.y+60} S ${r.x+420} ${r.y+r.h-40}, ${r.x+r.w-24} ${r.y+r.h-36}`}/></g>;
 return <g><rect x={r.x} y={r.y} width={r.w} height={r.h} rx="10"/>{[0,1,2,3].map(i=><g key={i}><line x1={r.x+20} y1={r.y+44+i*48} x2={r.x+130} y2={r.y+44+i*48}/><rect x={r.x+r.w-60} y={r.y+34+i*48} width="38" height="20" rx="10"/></g>)}</g>;
}

function Built({r}){
 // what the agents leave behind, in Daybreak's own palette
 if(r.id==='header')return <div className="hd-ui hd-ui-header"><b><i/>daybreak</b><span>Good morning, Ana</span><em>Live</em></div>;
 if(r.id==='kpis')return <div className="hd-ui hd-ui-kpis">{[['Producing now','4.8','kW'],['Battery','86','%'],['Saved this month','€142.60','']].map(([k,v,u])=><div key={k}><span>{k}</span><strong>{v}<small>{u}</small></strong></div>)}</div>;
 if(r.id==='chart')return <div className="hd-ui hd-ui-chart"><span>Solar this week</span><div>{[42,30,64,52,78,88,70].map((h,i)=><i key={i} style={{'--h':h/100}} className={i===4?'is-today':undefined}/>)}</div></div>;
 return <div className="hd-ui hd-ui-devices"><span>Devices</span>{[['Heat pump',1],['EV charger',1],['Washer',1],['Pool pump',0]].map(([n,on])=><p key={n}>{n}<i className={on?'is-on':undefined}/></p>)}</div>;
}

export default function HakoDemo({lang,reduced}){
 const en=lang==='en',stage=useRef(null),start=useRef(null),timers=useRef([]);
 const [drag,setDrag]=useState(null),[box,setBox]=useState(null),[state,setState]=useState({}),[agents,setAgents]=useState({}),[shipped,setShipped]=useState(false);
 const later=(ms,fn)=>timers.current.push(setTimeout(fn,reduced?0:ms));
 useEffect(()=>()=>timers.current.forEach(clearTimeout),[]);
 const point=event=>{const r=stage.current.getBoundingClientRect();return {x:Math.max(0,Math.min(W,(event.clientX-r.left)/r.width*W)),y:Math.max(0,Math.min(H,(event.clientY-r.top)/r.height*H))};};
 const build=useCallback(selection=>{
  const targets=REGIONS.filter(r=>overlaps(selection,r)&&!state[r.id]);
  if(!targets.length)return;
  // agents leave from the box's corner, take a region each, think, then scan it into real UI
  setAgents(a=>{const next={...a};targets.forEach(r=>{next[r.agent]={x:selection.x+selection.w,y:selection.y+selection.h,on:true};});return next;});
  targets.forEach((r,i)=>{
   later(120+i*140,()=>{setAgents(a=>({...a,[r.agent]:{x:r.x+r.w*.62,y:r.y+r.h*.55,on:true}}));setState(s=>({...s,[r.id]:'thinking'}));});
   later(1000+i*260,()=>setState(s=>({...s,[r.id]:'building'})));
   later(1900+i*260,()=>setState(s=>({...s,[r.id]:'done'})));
  });
  later(2400+targets.length*260,()=>setAgents(a=>{const next={...a};targets.forEach(r=>{if(next[r.agent])next[r.agent]={...next[r.agent],on:false};});return next;}));
 },[state,reduced]);
 const down=event=>{
  if(event.button!==0&&event.pointerType==='mouse')return;
  event.currentTarget.setPointerCapture(event.pointerId);start.current=point(event);setBox(null);setDrag({x:start.current.x,y:start.current.y,w:0,h:0});
 };
 const move=event=>{if(start.current)setDrag(toBox(start.current,point(event)));};
 const up=()=>{
  if(!start.current)return;start.current=null;
  setDrag(d=>{if(d&&d.w>24&&d.h>24){setBox(d);build(d);}return null;});
 };
 const all=()=>{const b={x:20,y:20,w:W-40,h:H-40};setBox(b);build(b);};
 const reset=()=>{timers.current.forEach(clearTimeout);timers.current=[];setBox(null);setState({});setAgents({});setShipped(false);};
 const done=REGIONS.filter(r=>state[r.id]==='done').length,sel=drag||box;
 return <div className={'hd'+(reduced?' hd-still':'')+(shipped?' is-shipped':'')}>
  <div className="hd-top">
   <p className="hd-hint">{en?'Drag a box over any part of the sketch. Agents build what’s inside.':'在草图上任意拖出一个框，agent 会把框里的东西做出来。'}</p>
   <div className="hd-actions">
    <button type="button" onClick={all}>{en?'Select all':'全选'}</button>
    <button type="button" onClick={reset}>{en?'Reset':'重来'}</button>
    <button type="button" className="hd-ship" disabled={!done||shipped} onClick={()=>setShipped(true)}>{shipped?(en?'Shipped':'已上线'):(en?'Ship':'上线')} ↗</button>
   </div>
  </div>
  <div ref={stage} className="hd-stage" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} role="application" aria-label={en?'Sketch canvas: drag to draw a selection box':'草图画布：拖动画出选框'}>
   <svg className="hd-sketch" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">{REGIONS.map(r=><g key={r.id} className={'hd-sk is-'+(state[r.id]||'idle')}><Sketch r={r}/></g>)}</svg>
   {REGIONS.map(r=>{const s=state[r.id];return <div key={r.id} className={'hd-region is-'+(s||'idle')} style={{left:r.x/W*100+'%',top:r.y/H*100+'%',width:r.w/W*100+'%',height:r.h/H*100+'%'}}>
    {s&&<span className="hd-chip">✦ {r.agent} · {s==='done'?(en?'done':'完成'):(en?'building…':'构建中…')}</span>}
    <div className="hd-built"><Built r={r}/></div>
    <i className="hd-scan" aria-hidden="true"/>
   </div>;})}
   {sel&&<div className={'hd-sel'+(drag?' is-drawing':'')} style={{left:sel.x/W*100+'%',top:sel.y/H*100+'%',width:sel.w/W*100+'%',height:sel.h/H*100+'%'}}>
    <i/><i/><i/><i/><span>{Math.round(sel.w)} × {Math.round(sel.h)}</span>
   </div>}
   {AGENTS.map(name=>{const a=agents[name];return <div key={name} className={'hd-agent'+(a?.on?' is-on':'')} style={{transform:`translate3d(${(a?.x??W/2)/W*100}cqw,${(a?.y??H/2)/H*100}cqh,0)`}} aria-hidden="true">
    <svg viewBox="0 0 14 18"><path d="M1 1 L13 9.5 L7.6 10.6 L5 16.5 Z"/></svg><span>Hako · {name}</span>
   </div>;})}
   <div className="hd-toast" role="status">{shipped?<><b>✓</b>{en?'Shipped to production · just now':'已发布到生产环境 · 刚刚'}</>:null}</div>
  </div>
  <p className="hd-fine">{en?'Hako and Daybreak are fictional products, designed for the film.':'Hako 和 Daybreak 都是为这支片子设计的虚构产品。'}</p>
 </div>;
}
