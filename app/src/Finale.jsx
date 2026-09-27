import {useLayoutEffect,useRef} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import BlossomScene from './BlossomScene';
import {CUT,EASE,channels,span} from './finale-cut';
import './finale.css';

const COPY={
 zh:{invite:'继续向下，让想法盛放。',title:['从一个念头，','到一个世界。'],philosophy:'我希望作品不只被看见，也能让人愿意走近、探索，并留下来。规则赋予选择意义，画面让世界值得相信。真正打动人的体验，藏在两者相遇的地方。',details:'以系统思维构建世界的逻辑，\n以视觉创作留下值得记住的瞬间。',about:'认识我 ↗',ending:'每个结束，都可以是下一幕的开始。'},
 en:{invite:'Keep going. Let it bloom.',title:['FROM A THOUGHT,','TO A WORLD.'],philosophy:'I want to make work that invites people to come closer, explore, and stay. Rules give choices meaning. Images make a world believable. The experiences that stay with us happen where the two meet.',details:'Systems thinking gives a world its logic. Art gives it a reason to be remembered.',about:'Meet the person behind it ↗',ending:'Every ending is somewhere to start.'},
};
const DISCIPLINES='WORLDBUILDING · NARRATIVE · SYSTEM DESIGN · VISUAL DEVELOPMENT · ';
const Line=({children})=><span className="mask"><span className="mask-in">{children}</span></span>;

const D=100;                                          // timeline length = 100% of the finale scroll
const at=([a])=>a*D, len=([a,b])=>(b-a)*D;
const mix=(a,b,t)=>a+(b-a)*t;
const rgb=(from,to,t)=>`rgb(${from.map((v,i)=>Math.round(mix(v,to[i],t))).join(',')})`;
const PAPER=[250,251,252], INK=[9,9,11], DIM=[58,58,66], LIT=[245,245,247];

/** Lines cut in across `beat`: each offset, the whole set landing inside the beat. */
const cutIn=(tl,targets,beat,from={},to={})=>tl.fromTo(targets,{yPercent:110,...from},{yPercent:0,...to,ease:EASE.cutIn,duration:len(beat)*.78,stagger:{amount:len(beat)*.22}},at(beat));
const cutOut=(tl,targets,beat,to={})=>tl.to(targets,{yPercent:-110,...to,ease:EASE.cutOut,duration:len(beat)*.8,stagger:{amount:len(beat)*.2}},at(beat));

/** Builds the finale for one media condition. GSAP's matchMedia reverts every
 *  tween and trigger made here; the returned cleanup undoes the manual writes. */
function direct(root,clock,{scrub,lens}){
 const q=s=>root.querySelector(s),qa=s=>[...root.querySelectorAll(s)];
 const ground=q('.finale-ground'),glow=q('.finale-halo-glow'),lensEl=q('.blossom-lens'),iris=q('.finale-iris'),grain=q('.finale-grain'),ribbon=q('.philosophy-ribbon');
 const words=qa('.reading-text span'),lit=new Float32Array(words.length).fill(-1);
 // Write only on change: most channels sit still across long stretches of scroll.
 const memo=new Map();
 const set=(el,prop,value)=>{let last=memo.get(el);if(!last)memo.set(el,last={});if(last[prop]===value)return;last[prop]=value;if(prop.startsWith('--'))el.style.setProperty(prop,value);else el.style[prop]=value;};
 const state={p:0};
 const apply=()=>{
  const c=channels(state.p);clock.current=c;
  set(ground,'background',rgb(PAPER,INK,c.dark));
  set(glow,'opacity',c.halo.toFixed(3));set(glow,'transform',`scale(${c.haloScale.toFixed(3)})`);
  set(iris,'--iris-in',`${mix(38,0,c.iris).toFixed(1)}vmax`);set(iris,'--iris-out',`${mix(80,14,c.iris).toFixed(1)}vmax`);set(iris,'--iris-a',mix(.14,1,c.iris).toFixed(3));
  set(grain,'opacity',c.grain.toFixed(3));
  set(ribbon,'opacity',(c.depth*.07).toFixed(4));set(ribbon,'transform',`translate3d(${(-span(c.p,CUT.depth)*35).toFixed(2)}vw,0,0)`);
  if(lens){set(lensEl,'filter',c.focus>.004?`blur(${(c.focus*5).toFixed(2)}px)`:'none');set(lensEl,'transform',`scale(${(1+c.focus*.015).toFixed(4)})`);}
  const head=c.read*(words.length+6);                 // a six-glyph soft leading edge
  for(let i=0;i<words.length;i++){const t=Math.round(Math.max(0,Math.min(1,(head-i)/6))*40)/40;if(t!==lit[i]){lit[i]=t;words[i].style.color=rgb(DIM,LIT,t);}}
  const tone=c.dark>.48?'dark':'light';if(root.dataset.navTone!==tone)root.dataset.navTone=tone;
 };

 const tl=gsap.timeline({scrollTrigger:{trigger:root,start:'top top',end:'bottom bottom',scrub}});
 tl.to(state,{p:1,duration:D,ease:'none',onUpdate:apply},0);
 gsap.set([q('.bloom-title'),q('.return-copy')],{autoAlpha:1});
 cutOut(tl,qa('.blossom-small-copy .mask-in'),CUT.inviteOut);
 cutIn(tl,qa('.bloom-title .mask-in'),CUT.titleIn,{letterSpacing:'.06em',filter:'blur(8px)'},{letterSpacing:'-.07em',filter:'blur(0px)'});
 tl.fromTo(q('.bloom-title'),{yPercent:4},{yPercent:-4,ease:'none',duration:len([CUT.titleIn[0],CUT.titleOut[1]])},at(CUT.titleIn));
 cutOut(tl,qa('.bloom-title .mask-in'),CUT.titleOut,{filter:'blur(6px)'});
 tl.fromTo(q('.philosophy'),{autoAlpha:0},{autoAlpha:1,ease:'none',duration:len(CUT.eyebrow)*.5},at(CUT.eyebrow));
 cutIn(tl,q('.philosophy>.eyebrow .mask-in'),CUT.eyebrow);
 cutIn(tl,q('.philosophy-details .mask-in'),CUT.details);
 tl.fromTo(q('.finale-cta'),{autoAlpha:0,y:14},{autoAlpha:1,y:0,ease:EASE.cutIn,duration:len(CUT.details)*.7},at(CUT.details)+len(CUT.details)*.3);
 tl.to(q('.philosophy'),{autoAlpha:0,yPercent:-6,filter:'blur(6px)',ease:'power2.in',duration:len(CUT.philOut)},at(CUT.philOut));
 cutIn(tl,qa('.return-copy .mask-in'),CUT.ending);

 // Entry: the flower rises into frame with parallax as the section arrives.
 gsap.fromTo(q('.blossom-wrap'),{yPercent:14,scale:.9},{yPercent:0,scale:1,ease:EASE.settle,scrollTrigger:{trigger:root,start:'top bottom',end:'top top',scrub:true}});
 gsap.fromTo(q('.finale-halo'),{autoAlpha:0},{autoAlpha:1,ease:'none',scrollTrigger:{trigger:root,start:'top 60%',end:'top top',scrub:true}});
 ScrollTrigger.create({trigger:root,start:'top bottom',end:'bottom top',onToggle:self=>{grain.classList.toggle('is-running',self.isActive);ribbon.classList.toggle('is-running',self.isActive);}});

 // Anything above the finale can change height after load (posters, video, fonts).
 let queued=0;
 const resize=new ResizeObserver(()=>{cancelAnimationFrame(queued);queued=requestAnimationFrame(()=>ScrollTrigger.refresh());});
 resize.observe(document.body);
 apply();

 // No nav-tone write here: React commits the section's data-nav-tone before this
 // cleanup runs, and the next build's apply() sets the tone for its own frame.
 return()=>{
  resize.disconnect();cancelAnimationFrame(queued);
  for(const el of memo.keys())el.removeAttribute('style');
  for(const word of words)word.style.removeProperty('color');
  grain.classList.remove('is-running');ribbon.classList.remove('is-running');
  clock.current=channels(0);
 };
}

/** The blossom finale: markup, film grade and the director's timeline. */
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
  // Touch scrolling already carries momentum; a long scrub on top reads as float.
  media.add({desktop:'(min-width: 700px)',mobile:'(max-width: 699px)'},({conditions})=>direct(node,clock,{scrub:conditions.desktop?1.2:.8,lens:conditions.desktop}));
  return()=>media.revert();
 },[reduced,lang]);
 return <section ref={root} className="finale-journey" id="practice" data-nav-tone={reduced?'dark':'light'}><div className="finale-stage">
  <div className="finale-ground"/>
  <div className="finale-halo" aria-hidden="true"><div className="finale-halo-glow"/></div>
  <div className="blossom-wrap"><div className="blossom-lens"><BlossomScene getChannels={()=>clock.current} reducedMotion={reduced}/></div></div>
  <div className="finale-iris" aria-hidden="true"/>
  <div className="philosophy-ribbon" aria-hidden="true"><span>{DISCIPLINES.repeat(4)}</span></div>
  <div className="blossom-small-copy"><span className="eyebrow"><Line>A SMALL IDEA. AN ENTIRE WORLD.</Line></span><p><Line>{copy.invite}</Line></p></div>
  <div className="bloom-title">{copy.title.map(line=><Line key={line}>{line}</Line>)}</div>
  <div className="philosophy">
   <span className="eyebrow"><Line>03 / PHILOSOPHY & PRACTICE</Line></span>
   <p className="reading-text">{words.map((word,i)=><span key={i}>{word}</span>)}</p>
   <div className="philosophy-details"><p><Line>{copy.details}</Line></p><span className="finale-cta"><button onClick={onAbout} className="text-link">{copy.about}</button></span></div>
  </div>
  <div className="return-copy"><i><Line>Back to a beginning.</Line></i><span><Line>{copy.ending}</Line></span></div>
  <div className="finale-grain" aria-hidden="true"/>
 </div></section>;
}
