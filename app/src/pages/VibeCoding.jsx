import {useEffect, useRef, useState, useCallback} from 'react';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import ShapeGrid from '../components/react-bits/ShapeGrid';
import ScrollReveal from '../components/react-bits/ScrollReveal';
import PixelSwap from '../components/react-bits/PixelSwap';
import TextType from '../components/react-bits/TextType';
import {createSphereGallery} from './sphereGallery';
import {transitionMark} from './projectTransitionProbe';
import './vibecoding.css';
gsap.registerPlugin(ScrollTrigger);
const cover='/assets/vibecoding/field01-poster.webp';
const preview='/assets/vibecoding/field01-exploded.webp';
const featured=[
 {title:'FIELD / 01',href:'/other-project/field01',cover,preview,description:{en:'A camera to turn, take apart, and explore.',zh:'旋转、拆解，用手势探索一台相机。'},alt:{en:'FIELD / 01 — interactive camera',zh:'FIELD / 01 相机交互项目'}},
 {title:'JAY LIN — Brand & Motion',href:'/other-project/jay-lin',cover:'/assets/other-project/jay-lin/identity.png',preview:'/assets/other-project/jay-lin/logo-poster.jpg',description:{en:'A personal identity, a logo in motion, and a portfolio film.',zh:'个人品牌、Logo 动效与作品集展示影片。'},alt:{en:'JAY LIN — brand identity and motion design',zh:'JAY LIN 个人品牌与动态设计'}},
];
const projects=Array.from({length:12},(_,i)=>({number:String(i+1).padStart(2,'0'),ready:i<featured.length,shape:['wide','brand','small','wide','square','portrait','wide','small','square','wide','portrait','square'][i],...featured[i]}));

export default function VibeCoding({lang,reduced,onNavigate,onOpenProject,onProjectIntent,isOpening}){
 const root=useRef(null),wall=useRef(null),openRef=useRef(null),gridScroll=useRef(0);
 const [webgl,setWebgl]=useState(null),[hovered,setHovered]=useState(null),[focused,setFocused]=useState(null);
 const en=lang==='en';
 const renderGrid=useCallback(state=>wall.current?.setGridState(state),[]);
 const openCard=useCallback(element=>{
  const href=element.getAttribute('href');
  if(!href)return;
  if(element.dataset.number!=='01'||reduced||!onOpenProject){onNavigate(href);return;}
  transitionMark('click');
  const rect=element.getBoundingClientRect();
  const capture=wall.current?.capture(element)||{image:cover,rect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height}};
  transitionMark('capture');
  onOpenProject(capture);
 },[reduced,onOpenProject,onNavigate]);
 openRef.current=openCard;
 useEffect(()=>{
  if(hovered!=='01'&&focused!=='01')return;
  const timer=setTimeout(()=>onProjectIntent?.(),120);return()=>clearTimeout(timer);
 },[hovered,focused,onProjectIntent]);
 useEffect(()=>{
  if(reduced){setWebgl(false);return;}
  setWebgl(null);
  const element=root.current;
  wall.current=createSphereGallery(element,{onReady:setWebgl,onOpen:el=>openRef.current(el),scrollOffsetRef:gridScroll});
  if(!wall.current)setWebgl(false);
  const enter=e=>setHovered(e.detail.number);
  element.addEventListener('vibe:surface-hover',enter);
  return()=>{element.removeEventListener('vibe:surface-hover',enter);wall.current?.dispose();wall.current=null;};
 },[reduced,lang]);
 useEffect(()=>{wall.current?.setPaused(isOpening);},[isOpening,reduced,lang]);
 useEffect(()=>{
  if(reduced||webgl!==false)return;
  const context=gsap.context(()=>{
   const scroller=root.current.closest('.portfolio-page-viewport');
   gsap.set('.vc-project',{opacity:0,y:45});
   ScrollTrigger.batch(root.current.querySelectorAll('.vc-project'),{scroller,start:'top 98%',once:true,interval:.1,onEnter:batch=>gsap.to(batch,{opacity:1,y:0,duration:1.3,stagger:.12,ease:'elastic.out(1,.75)'})});
  },root);
  return()=>context.revert();
 },[reduced,webgl]);
 const click=event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();openCard(event.currentTarget);
 };
 return <div ref={root} className={'vc-gallery'+(reduced?' vc-still':'')} data-nav-tone="light">
  <div className="vc-shape-source" aria-hidden="true"><ShapeGrid direction="up" speed={.13} squareSize={76} borderColor="#1111110e" hoverFillColor="#88888820" hoverTrailAmount={5} eventSourceRef={root} scrollOffsetRef={gridScroll} externalRenderer={webgl?renderGrid:undefined} reduced={reduced}/></div>
  <header className="vc-heading">
   <div className="vc-kicker"><span>03 / OTHER PROJECT</span><span>IDEAS IN PLAY · 2026</span></div>
   <div className="vc-heading-line"><h1 aria-label="Other Project.">{reduced?'Other Project.':<TextType text="Other Project." as="span" typingSpeed={105} initialDelay={260} loop={false} cursorCharacter="_" cursorBlinkDuration={.7}/>}</h1>
    <ScrollReveal key={lang} reduced={reduced} containerClassName="vc-intro" as="p">{en?'Identity, motion, and things to play with.':'品牌、动效，以及可以玩的想法。'}</ScrollReveal></div>
   <div className="vc-gallery-index"><span>{en?'02 PROJECTS / MORE TO COME':'02 个作品 / 持续探索'}</span><span>{en?'SCROLL INTO THE PROJECTS':'滚动，探索作品'} <b>↓</b></span></div>
  </header>
  <section className="vc-grid" aria-label={en?'Other projects':'其他作品'}>
   {projects.map((project,index)=>{
    const Tag=project.ready?'a':'div',active=hovered===project.number||focused===project.number;
    const first=project.ready?<img src={project.cover} alt={project.alt[lang]} fetchPriority={index===0?'high':undefined}/>:<div className="vc-blank"><span>+</span></div>;
    const second=project.ready?<img src={project.preview} alt=""/>:<div className="vc-soon"><span>Coming soon</span><small>{en?'An idea is taking shape.':'下一个想法，正在发生。'}</small></div>;
    return <article className={`vc-project vc-${project.shape} vc-slot-${index}`} key={project.number}>
     <Tag className={'vc-paper'+(project.ready?' vc-live':' vc-empty')} data-number={project.number} data-note={en?'An idea is taking shape.':'下一个想法，正在发生。'}
      href={project.href} onClick={project.ready?click:undefined} tabIndex={project.ready?undefined:0}
      onPointerEnter={()=>{if(!webgl)setHovered(project.number);}} onPointerLeave={()=>{if(!webgl)setHovered(null);}}
      onFocus={()=>setFocused(project.number)} onBlur={()=>setFocused(null)}
      aria-label={project.ready?(en?'Open ':'打开 ')+project.alt[lang]:`Experiment ${project.number} — Coming soon`}
      data-cover={project.cover} data-preview={project.preview}>
      <PixelSwap firstContent={first} secondContent={second} active={active} trigger="manual" textureMode={webgl} reduced={reduced} pixelSize={48} pixelScale={.16} duration={1150} pixelDuration={460} pattern="diagonal" randomness={.7} aspectRatio="auto"/>
     </Tag>
     <div className="vc-caption-wrap"><div className="vc-caption"><h2><ScrollReveal reduced={reduced} as="span">{project.title||`Experiment ${project.number}`}</ScrollReveal></h2><span>{project.ready?'2026 · ↗':'—'}</span></div>
      {project.ready&&<ScrollReveal reduced={reduced} as="p" containerClassName="vc-description">{project.description[lang]}</ScrollReveal>}
     </div>
    </article>;
   })}
  </section>
  <footer className="vc-footer"><span>JAY LIN / OTHER PROJECT</span><ScrollReveal reduced={reduced} as="p">{en?'Always a work in progress.':'新的想法，还会继续。'}</ScrollReveal><span>01 — 12</span></footer>
 </div>;
}
