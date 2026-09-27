import {Fragment,useLayoutEffect,useRef} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import WorldScene from './WorldScene';
import {CUT,EASE,HIT,channels,hitState,span} from './finale-cut';
import './finale.css';

const COPY={
 zh:{invite:'继续向下，让想法盛放。',title:['从一个念头，','到一个世界。'],philosophy:'我希望作品不只被看见，也能让人愿意走近、探索，并留下来。规则赋予选择意义，画面让世界值得相信。真正打动人的体验，藏在两者相遇的地方。',details:'以系统思维构建世界的逻辑，\n以视觉创作留下值得记住的瞬间。',about:'认识我 ↗',ending:'每个结束，都可以是下一幕的开始。'},
 en:{invite:'Keep going. Let it bloom.',title:['FROM A THOUGHT,','TO A WORLD.'],philosophy:'I want to make work that invites people to come closer, explore, and stay. Rules give choices meaning. Images make a world believable. The experiences that stay with us happen where the two meet.',details:'Systems thinking gives a world its logic. Art gives it a reason to be remembered.',about:'Meet the person behind it ↗',ending:'Every ending is somewhere to start.'},
};
const Line=({children})=><span className="mask"><span className="mask-in">{children}</span></span>;
const letters=text=>[...text].map((ch,i)=><span className="ch" key={i}>{ch}</span>);
/** A title line set letter by letter, each letter its own layer; words never break apart. */
const Letters=({line,en})=><span className="mask" aria-hidden="true"><span className="mask-in">{en?line.split(' ').map((word,i)=><Fragment key={i}>{i>0&&' '}<span className="w">{letters(word)}</span></Fragment>):letters(line)}</span></span>;

const D=100;                                          // timeline length = 100% of the finale scroll
const at=([a])=>a*D, len=([a,b])=>(b-a)*D;
const mix=(a,b,t)=>a+(b-a)*t;
const rgb=(from,to,t)=>`rgb(${from.map((v,i)=>Math.round(mix(v,to[i],t))).join(',')})`;
const PAPER=[250,251,252], INK=[9,9,11], DIM=[58,58,66], LIT=[245,245,247];

/** How each kind of layer waits, holds and leaves, and how fast it gets there.
 *  Hits play in seconds, not in scroll: the ease reads the same at any scroll speed. */
const LAYER={
 line:{wait:{yPercent:110},on:{yPercent:0},spent:{yPercent:-110},enter:{duration:1,stagger:.1},leave:{duration:.5,stagger:.05}},
 letter:{wait:{yPercent:112,rotate:8},on:{yPercent:0,rotate:0},spent:{yPercent:-112,rotate:-4},enter:{duration:1.15,stagger:.045},leave:{duration:.5,stagger:.022}},
 // Tracking runs on a unitless variable: GSAP's em conversion lost the negative end value (it landed on 0px).
 track:{wait:{'--track':.14},on:{'--track':-.07},spent:{'--track':-.07},enter:{duration:1.8},leave:{duration:.5}},
 fade:{wait:{autoAlpha:0,y:0},on:{autoAlpha:1,y:0},spent:{autoAlpha:0,y:-30},enter:{duration:.7},leave:{duration:.6}},
 rise:{wait:{autoAlpha:0,y:14},on:{autoAlpha:1,y:0},spent:{autoAlpha:0,y:0},enter:{duration:.9,delay:.3},leave:{duration:.4}},
};
function play(hit,state,instant){
 const layer=LAYER[hit.kind],vars=state<0?layer.wait:state>0?layer.spent:layer.on;
 if(instant){gsap.set(hit.targets,vars);return;}
 const {stagger,...motion}=state===0?layer.enter:layer.leave;
 gsap.to(hit.targets,{...vars,...motion,stagger:stagger&&{each:stagger,from:state<0?'end':'start'},ease:state===0?EASE.cutIn:EASE.cutOut,overwrite:true});
}

/** Builds the finale for one media condition. GSAP's matchMedia reverts every
 *  tween and trigger made here; the returned cleanup undoes the manual writes. */
function direct(root,clock,{scrub,lens}){
 const q=s=>root.querySelector(s),qa=s=>[...root.querySelectorAll(s)];
 const ground=q('.finale-ground'),lensEl=q('.blossom-lens'),iris=q('.finale-iris'),grain=q('.finale-grain'),mount=q('.world-scene');
 const words=qa('.reading-text span'),lit=new Float32Array(words.length).fill(-1);
 const [lineA,lineB]=qa('.bloom-title>.mask');
 const hits=[
  {beat:HIT.invite,kind:'line',targets:qa('.blossom-small-copy .mask-in')},
  {beat:HIT.titleA,kind:'letter',targets:[...lineA.querySelectorAll('.ch')]},
  {beat:HIT.titleA,kind:'track',targets:[lineA.firstChild]},
  {beat:HIT.titleB,kind:'letter',targets:[...lineB.querySelectorAll('.ch')]},
  {beat:HIT.titleB,kind:'track',targets:[lineB.firstChild]},
  {beat:HIT.philosophy,kind:'fade',targets:[q('.philosophy')]},
  {beat:HIT.philosophy,kind:'line',targets:qa('.philosophy>.eyebrow .mask-in')},
  {beat:HIT.details,kind:'line',targets:qa('.philosophy-details .mask-in')},
  {beat:HIT.details,kind:'rise',targets:[q('.finale-cta')]},
  {beat:HIT.ending,kind:'line',targets:qa('.return-copy .mask-in')},
 ].map(hit=>({...hit,state:null}));
 const layers=hits.flatMap(hit=>hit.targets);
 // Write only on change: most channels sit still across long stretches of scroll.
 const memo=new Map();
 const set=(el,prop,value)=>{let last=memo.get(el);if(!last)memo.set(el,last={});if(last[prop]===value)return;last[prop]=value;if(prop.startsWith('--'))el.style.setProperty(prop,value);else el.style[prop]=value;};
 // Create the lens's filter surface now, not when the rack focus first pulls mid-scroll.
 if(lens)set(lensEl,'willChange','filter,transform');
 const state={p:0};
 // The lens only settles in as the stage lands (last 30% of the entry) and lifts as it
 // leaves, so no grain or vignette ever meets the plain sections above and below at an edge.
 let entered=0,left=0;
 const apply=()=>{
  const c=channels(state.p);clock.current=c;
  // The scene paints the night itself, circle and all; the ground only follows once the
  // circle has covered the frame, or at once when there is no WebGL to paint it.
  set(ground,'background',rgb(PAPER,INK,mount.dataset.renderState==='webgl-unavailable'?c.night:c.night>.98?1:0));
  const presence=entered*(1-left);
  set(iris,'--iris-in',`${mix(38,0,c.iris).toFixed(1)}vmax`);set(iris,'--iris-out',`${mix(80,14,c.iris).toFixed(1)}vmax`);set(iris,'--iris-a',mix(.14*presence,1,c.iris).toFixed(3));
  // Never fully 0: the browser skips painting a transparent layer, and rasterising this
  // viewport-sized grain for the first time mid-entry cost a measured 50 ms frame.
  set(grain,'opacity',Math.max(.001,c.grain*presence).toFixed(3));
  // Rack focus. The blur stays at or under 2px: past that the compositor switches to a
  // downsampled blur and allocates new textures mid-scroll (a measured 32 ms hitch at 3px).
  // The receding opacity carries the rest of the focus pull at no cost.
  if(lens){set(lensEl,'filter',c.focus>.004?`blur(${(c.focus*2).toFixed(2)}px)`:'none');set(lensEl,'transform',`scale(${(1+c.focus*.015).toFixed(4)})`);set(lensEl,'opacity',(1-c.focus*.12).toFixed(3));}
  const head=c.read*(words.length+6);                 // a six-glyph soft leading edge
  for(let i=0;i<words.length;i++){const t=Math.round(Math.max(0,Math.min(1,(head-i)/6))*40)/40;if(t!==lit[i]){lit[i]=t;words[i].style.color=rgb(DIM,LIT,t);}}
  for(const hit of hits){const s=hitState(c.p,hit.beat);if(s!==hit.state){play(hit,s,hit.state===null);hit.state=s;}}
  const tone=c.night>.9?'dark':'light';if(root.dataset.navTone!==tone)root.dataset.navTone=tone;
 };

 const tl=gsap.timeline({scrollTrigger:{trigger:root,start:'top top',end:'bottom bottom',scrub}});
 tl.to(state,{p:1,duration:D,ease:'none',onUpdate:apply},0);
 gsap.set([q('.bloom-title'),q('.return-copy')],{autoAlpha:1});
 // The title block drifts up through its whole stay, under the letters' own motion.
 tl.fromTo(q('.bloom-title'),{yPercent:4},{yPercent:-4,ease:'none',duration:len([HIT.titleA[0],HIT.titleB[1]])},at(HIT.titleA));

 // Entry: the thought rises into frame with parallax as the section arrives.
 gsap.fromTo(q('.blossom-wrap'),{yPercent:14,scale:.9},{yPercent:0,scale:1,ease:'power2.out',scrollTrigger:{trigger:root,start:'top bottom',end:'top top',scrub:true,onUpdate:self=>{entered=span(self.progress,[.7,1]);apply();}}});
 ScrollTrigger.create({trigger:root,start:'bottom bottom',end:'bottom top',onUpdate:self=>{left=span(self.progress,[0,.3]);apply();}});
 ScrollTrigger.create({trigger:root,start:'top bottom',end:'bottom top',onToggle:self=>grain.classList.toggle('is-running',self.isActive)});

 // Anything above the finale can change height after load (posters, video, fonts).
 let queued=0;
 const resize=new ResizeObserver(()=>{cancelAnimationFrame(queued);queued=requestAnimationFrame(()=>ScrollTrigger.refresh());});
 resize.observe(document.body);
 apply();

 // No nav-tone write here: React commits the section's data-nav-tone before this
 // cleanup runs, and the next build's apply() sets the tone for its own frame.
 return()=>{
  resize.disconnect();cancelAnimationFrame(queued);
  gsap.killTweensOf(layers);gsap.set(layers,{clearProps:'all'});
  for(const el of memo.keys())el.removeAttribute('style');
  for(const word of words)word.style.removeProperty('color');
  grain.classList.remove('is-running');
  clock.current=channels(0);
 };
}

/** The finale: a thought becomes a world and folds back into a thought. Markup,
 *  film grade and the director's timeline; the world itself is WorldScene. */
export default function Finale({lang,reduced,onAbout}){
 const en=lang==='en',copy=COPY[en?'en':'zh'],root=useRef(null),clock=useRef(channels(0));
 const words=en?copy.philosophy.split(' ').map(word=>word+' '):Array.from(copy.philosophy);
 useLayoutEffect(()=>{
  const node=root.current;
  if(!node)return undefined;
  // Reassert the base tone first: reverting the previous timeline renders it back
  // to its opening frame, whose apply() writes the light tone over React's value.
  node.dataset.navTone=reduced?'dark':'light';
  if(reduced){clock.current=channels(0);return undefined;}
  gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  // v16.css's own breakpoint, written as a query and its negation so every width
  // (fractional ones under browser zoom included) builds exactly one timeline.
  // Touch scrolling already carries momentum; a long scrub on top reads as float.
  media.add({mobile:'(max-width: 700px)',desktop:'not all and (max-width: 700px)'},({conditions})=>direct(node,clock,{scrub:conditions.desktop?1.2:.8,lens:conditions.desktop}));
  return()=>media.revert();
 },[reduced,lang]);
 return <section ref={root} className="finale-journey" id="practice" data-nav-tone={reduced?'dark':'light'}><div className="finale-stage">
  <div className="finale-ground"/>
  <div className="blossom-wrap"><div className="blossom-lens"><WorldScene getChannels={()=>clock.current} reducedMotion={reduced}/></div></div>
  <div className="finale-iris" aria-hidden="true"/>
  <div className="blossom-small-copy"><span className="eyebrow"><Line>A SMALL IDEA. AN ENTIRE WORLD.</Line></span><p><Line>{copy.invite}</Line></p></div>
  <div className="bloom-title">{copy.title.map(line=><Letters key={line} line={line} en={en}/>)}<span className="visually-hidden">{copy.title.join(' ')}</span></div>
  <div className="philosophy">
   <span className="eyebrow"><Line>03 / PHILOSOPHY & PRACTICE</Line></span>
   <p className="reading-text">{words.map((word,i)=><span key={i}>{word}</span>)}</p>
   <div className="philosophy-details"><p><Line>{copy.details}</Line></p><span className="finale-cta"><button onClick={onAbout} className="text-link">{copy.about}</button></span></div>
  </div>
  <div className="return-copy"><i><Line>Back to a beginning.</Line></i><span><Line>{copy.ending}</Line></span></div>
  <div className="finale-grain" aria-hidden="true"/>
 </div></section>;
}
