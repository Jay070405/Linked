import React, {useEffect, useRef, useState} from 'react';

import LegacyHero from './LegacyHero';
import ContactFinale from './ContactFinale';
import BlossomScene from './BlossomScene';
import SiteNavigation from './components/SiteNavigation';
import AboutPanel from './components/AboutPanel';
import LoadingScreen from './components/LoadingScreen';
import ExpressiveTitle from './components/ExpressiveTitle';


import CountUp from './components/CountUp';

import PortfolioPages from './pages/PortfolioPages';
import {featuredWorks, systems, stats} from './portfolioData';
import {usePostJourney} from './usePostJourney';
import {usePortfolioRouting} from './usePortfolioRouting';

const pick=(item,key,lang)=>lang==='en'?(item[key+'En']||item[key]):item[key];
const Bilingual=({lang,zh,en})=>lang==='en'?en:zh;

function Branch({className=''}) {
 return <svg className={'branch '+className} viewBox="0 0 900 600" fill="none" aria-hidden="true"><g stroke="currentColor" strokeLinecap="round"><path d="M930 610C770 482 664 310 524 209C407 123 192 159 20 43" strokeWidth="12"/><path d="M703 405C714 259 616 113 646-30M518 204C416 171 371 46 372-30M366 140C231 190 120 144-40 196M799 515C700 471 646 460 573 451" strokeWidth="5"/><path d="M660 265L789 190M636 116L524 34M375 47L461 4M216 156L179 245M518 205L546 86M646 462L625 385" strokeWidth="2"/></g>{[[180,147],[373,53],[550,83],[706,264],[627,386],[462,5],[790,187],[524,35]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y}) rotate(${i*49})`} fill="var(--petal)">{[0,72,144,216,288].map(a=><path key={a} transform={`rotate(${a})`} d="M0 0C-18-6-17-26-5-28L0-24 5-28C17-26 18-6 0 0" opacity={.44+(i%3)*.15}/>)}</g>)}</svg>;
}
function Petal({className='',style}) {return <span className={'petal '+className} style={style} aria-hidden="true"><i/></span>;}
function PetalField(){return <div className="petal-field" aria-hidden="true">{Array.from({length:10},(_,i)=><Petal key={i} style={{left:`${7+i*9}%`,top:`${13+(i*19)%77}%`,'--r':`${i*31}deg`,'--d':`${9+i*1.2}s`,'--delay':`${-i*2}s`}}/>)}</div>;}

function Systems({lang,onOpen,reduced=false}) {
 const [hover,setHover]=useState(null);
 const layoutRef=useRef(null),previewRef=useRef(null),follow=useRef({frame:0,x:0,y:0,tx:0,ty:0,ready:false});
 useEffect(()=>()=>cancelAnimationFrame(follow.current.frame),[]);
 const placePreview=(clientX,clientY,immediate=false)=>{
  const box=previewRef.current,layout=layoutRef.current;if(!box||!layout||reduced||innerWidth<=700)return;
  const f=follow.current,rect=layout.getBoundingClientRect(),w=box.offsetWidth,h=box.offsetHeight;
  f.tx=Math.max(16,Math.min(innerWidth-w-22,clientX+28))-rect.left;
  f.ty=Math.max(84,Math.min(innerHeight-h-44,clientY-h*.52))-rect.top;
  if(!f.ready||immediate){f.x=f.tx;f.y=f.ty;f.ready=true;box.style.transform=`translate3d(${f.x}px,${f.y}px,0)`;}
  if(f.frame)return;
  let previous=performance.now();
  const tick=now=>{
   const blend=1-Math.exp(-Math.min(.05,(now-previous)/1000)*13);previous=now;
   const dx=f.tx-f.x;f.x+=dx*blend;f.y+=(f.ty-f.y)*blend;
   box.style.transform=`translate3d(${f.x}px,${f.y}px,0)`;
   box.style.setProperty('--preview-tilt',`${Math.max(-3,Math.min(3,dx*.03))}deg`);
   if(Math.abs(dx)+Math.abs(f.ty-f.y)>.15)f.frame=requestAnimationFrame(tick);else f.frame=0;
  };
  f.frame=requestAnimationFrame(tick);
 };
 const stopPreview=()=>{setHover(null);cancelAnimationFrame(follow.current.frame);follow.current.frame=0;follow.current.ready=false;};
 return <section className="systems-section" id="systems" data-nav-tone="light"><Branch className="systems-branch"/>
  <div className="section-top"><span className="eyebrow">01 / SYSTEMS DESIGN</span><span className="eyebrow">RULES THAT FEEL ALIVE</span></div>
  <header className="systems-header"><h2><ExpressiveTitle reduced={reduced}>{lang==='en'?<>Make room<br/>for <i>choice.</i></>:<>让每个选择，<br/><em>生长出可能。</em></>}</ExpressiveTitle></h2><p>{lang==='en'?'From a first decision to a lasting experience. I turn complex rules into clear player choices.':'从第一次选择，到愿意再次体验。\n我把复杂的规则，变成清楚可感的玩家体验。'}</p></header>
  <div ref={layoutRef} className="project-layout" onPointerMove={event=>{if(event.pointerType!=='touch')placePreview(event.clientX,event.clientY);}} onPointerLeave={stopPreview}><div className="project-list">{systems.map((s,i)=>{
   const ready=s.status!=='coming-soon',Tag=ready?'button':'div';
   return <Tag className={'project-row '+(!ready?'coming-soon ':'')+(hover===i?'active':'')} key={s.id} tabIndex={ready?undefined:0} aria-label={!ready?pick(s,'title',lang)+' · Coming soon':undefined} onPointerEnter={event=>{setHover(i);if(event.pointerType!=='touch')placePreview(event.clientX,event.clientY);}} onFocus={event=>{setHover(i);const rect=event.currentTarget.getBoundingClientRect();placePreview(innerWidth*.57,rect.top+rect.height/2,true);}} onBlur={stopPreview} onClick={ready?()=>onOpen({type:'system',item:s}):undefined}><span className="project-no">0{i+1}</span><span className="project-name">{pick(s,'title',lang)}<small>{pick(s,'subtitle',lang)}</small></span><span className="project-kind">{ready?'RESEARCH / PROPOSAL':'COMING SOON'}</span><span className={ready?'project-arrow':'project-coming'} aria-hidden="true">{ready?'↗':'—'}</span></Tag>;
  })}</div><div ref={previewRef} className={'project-preview follows-pointer '+(hover!==null?'shown':'')} aria-hidden="true"><div className="project-preview-card">{hover!==null&&(systems[hover].image?<img key={hover} src={systems[hover].image} alt=""/>:<div className="project-typeset" key={hover}><span>0{hover+1} / COMING SOON</span><b>{systems[hover].titleEn}</b><p>{pick(systems[hover],'subtitle',lang)}</p></div>)}<span className="preview-note">{hover!==null&&systems[hover].status==='coming-soon'?'WORK IN PROGRESS':lang==='en'?'OPEN THE PROJECT ↗':'打开项目 ↗'}</span></div></div></div>
  <div className="systems-foot"><span>{lang==='en'?'A study of choices, feedback & the worlds they create.':'研究选择、反馈，以及它们共同构成的世界。'}</span><span>JAY LIN · SYSTEMS / 01—03</span></div>
 </section>;
}

function Art({lang,onOpen,onArchive,reduced=false}) {return <><section className="art-bridge" data-nav-tone="light"><Branch/><Petal className="bridge-petal"/><div className="bridge-copy"><span className="eyebrow">FROM RULES TO IMAGINATION</span><h2><ExpressiveTitle variant="stroke" reduced={reduced}>{lang==='en'?<>And then,<br/>a world <i>takes shape.</i></>:<>然后，<br/>想象有了<em>形状。</em></>}</ExpressiveTitle></h2></div></section><section className="art-journey" id="art" data-nav-tone="light"><div className="art-stage"><div className="art-atmosphere"><div className="art-light"/></div><div className="art-branch-scroll"><Branch className="art-branch"/></div><div className="art-top"><span className="eyebrow">02 / VISUAL WORLDS</span><span className="eyebrow">SCROLL TO WANDER →</span></div><div className="art-track"><div className="art-opening"><small>SELECTED<br/>IMAGINATIONS</small><h2><ExpressiveTitle reduced={reduced}>WORLDS<br/><i>worth</i><br/>ENTERING.</ExpressiveTitle></h2><p>{lang==='en'?'A few places I have imagined.':'几个想让人走进去的世界。'}</p></div>{featuredWorks.slice(0,3).map((work,i)=><article className={'art-work art-work-'+i} key={work.slug}><button className="art-image" onClick={()=>onOpen({type:'art',item:work})}><img src={work.image} alt={pick(work,'title',lang)} loading="lazy"/><span className="image-open">↗</span></button><div className="art-caption"><span>0{i+1} / {work.year}</span><div><h3>{pick(work,'title',lang)}</h3><p>{pick(work,'description',lang)}</p></div></div></article>)}<div className="archive-end"><Petal/><span className="eyebrow">THE COLLECTION CONTINUES</span><div className="archive-count">{reduced?<span>{stats.archiveWorks}</span>:<CountUp to={stats.archiveWorks} duration={1.7}/>}<i>original works</i></div><button onClick={onArchive} aria-label={lang==='en'?'Browse the work archive':'浏览作品档案'}><ExpressiveTitle reduced={reduced}>{lang==='en'?<>Browse the<br/>work archive ↗</>:<>浏览<br/>作品档案 ↗</>}</ExpressiveTitle></button><p>{lang==='en'?'Environment art, characters & visual development.':'场景绘画、角色设计与视觉开发。'}</p></div></div><div className="art-bottom"><span>SELECTED WORKS</span><div className="art-progress"><i/></div><span>01—03 / 25</span></div></div></section></>;}

const zhPhilosophy='我希望作品不只被看见，也能让人愿意走近、探索，并留下来。规则赋予选择意义，画面让世界值得相信。真正打动人的体验，藏在两者相遇的地方。';
const enPhilosophy='I want to make work that invites people to come closer, explore, and stay. Rules give choices meaning. Images make a world believable. The experiences that stay with us happen where the two meet.';
function Finale({lang,reduced,blossomProgress,onAbout}) {return <section className="finale-journey" id="practice" data-nav-tone={reduced?'dark':'light'}><div className="finale-stage"><div className="finale-ground"/><div className="blossom-wrap"><BlossomScene getProgress={()=>blossomProgress.current} reducedMotion={reduced}/></div><div className="blossom-small-copy"><span className="eyebrow">A SMALL IDEA. AN ENTIRE WORLD.</span><p>{lang==='en'?'Keep going. Let it bloom.':'继续向下，让想法盛放。'}</p></div><div className="bloom-title"><span><ExpressiveTitle reduced={reduced}>{lang==='en'?'FROM A THOUGHT,':'从一个念头，'}</ExpressiveTitle></span><span><ExpressiveTitle reduced={reduced}>{lang==='en'?'TO A WORLD.':'到一个世界。'}</ExpressiveTitle></span></div><div className="philosophy"><span className="eyebrow">03 / PHILOSOPHY & PRACTICE</span><p className="reading-text">{(lang==='en'?enPhilosophy:zhPhilosophy).split(lang==='en'?' ':'').map((c,i)=><span key={i}>{c}{lang==='en'?' ':''}</span>)}</p><div className="philosophy-details"><p>{lang==='en'?'Systems thinking gives a world its logic. Art gives it a reason to be remembered.':'以系统思维构建世界的逻辑，\n以视觉创作留下值得记住的瞬间。'}</p><button onClick={onAbout} className="text-link">{lang==='en'?'Meet the person behind it ↗':'认识我 ↗'}</button></div></div><div className="philosophy-ribbon" aria-hidden="true"><span>WORLDBUILDING · NARRATIVE · SYSTEM DESIGN · VISUAL DEVELOPMENT · WORLDBUILDING · NARRATIVE · SYSTEM DESIGN · VISUAL DEVELOPMENT ·</span></div><div className="return-copy"><i>Back to a beginning.</i><span>{lang==='en'?'Every ending is somewhere to start.':'每个结束，都可以是下一幕的开始。'}</span></div></div></section>;}

export default function App(){
 const[loading,setLoading]=useState(true);
 const[lang,setLang]=useState(localStorage.getItem('jay-lang')||'zh'),[about,setAbout]=useState(false);
 const[reduced,setReduced]=useState(matchMedia('(prefers-reduced-motion: reduce)').matches),[mediaFailed,setMediaFailed]=useState(false);
 const quiet=reduced||mediaFailed,blossomProgress=useRef(0);
 const {modal,open,close,back,pageScroll,archiveState}=usePortfolioRouting();
 usePostJourney({reduced:quiet,blossomProgress,lang});
 const toggleMotion=()=>{
  if(mediaFailed)return;
  if(modal){setReduced(v=>!v);return;}
  const candidates=['home','systems','art','practice','contact'];
  const id=candidates.find(id=>{const r=document.getElementById(id).getBoundingClientRect();return r.top<=innerHeight*.5&&r.bottom>=innerHeight*.5;})||'art';
  setReduced(v=>!v);requestAnimationFrame(()=>requestAnimationFrame(()=>document.getElementById(id)?.scrollIntoView({behavior:'instant'})));
 };
 const nav=id=>{
  if(id==='art'){open('/works');return;}
  if(id==='archive'){open('/works/archive');return;}
  if(id==='vibecoding'){open('/vibecoding');return;}
  if(id==='about'){setAbout(true);return;}
  if(modal){close(id);return;}
  document.getElementById(id)?.scrollIntoView({behavior:'instant'});
  history.replaceState(history.state,'','/#'+id);
  window.dispatchEvent(new Event('journey:jump'));
 };
 useEffect(()=>{document.documentElement.lang=lang==='en'?'en':'zh-CN';localStorage.setItem('jay-lang',lang);},[lang]);
 // Direct About links open after the loading dialog releases its focus and scroll lock.
 useEffect(()=>{if(!loading&&location.hash==='#about')setAbout(true);},[loading]);
 useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(preference.matches);preference.addEventListener('change',sync);return()=>preference.removeEventListener('change',sync);},[]);
 useEffect(()=>{const h=e=>{if(e.key==='Escape'&&about)setAbout(false);};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);},[about]);
 return <>
 <a className="skip-link" href={modal?'#portfolio-page':'#systems'}>{lang==='en'?'Skip to content':'跳到正文'}</a>
 <SiteNavigation lang={lang} reducedMotion={quiet} tone={modal?(modal.type==='desk'?'dark':'light'):'auto'} onLanguage={setLang} onNavigate={nav} onAbout={()=>setAbout(true)}/>
 <div className="shared-petal"><Petal/></div>
 <main className="home-journey" inert={modal?true:undefined} aria-hidden={!!modal}>
  <LegacyHero lang={lang} reduced={quiet} onMediaError={()=>setMediaFailed(true)}/>
  <Systems lang={lang} onOpen={open} reduced={quiet}/>
  <Art lang={lang} reduced={quiet} onOpen={open} onArchive={()=>open('/works/archive')}/>
  <Finale lang={lang} reduced={quiet} blossomProgress={blossomProgress} onAbout={()=>setAbout(true)}/>
  <ContactFinale lang={lang} reduced={quiet} onNavigate={nav} onAbout={()=>setAbout(true)}/>
 </main>
 <div className="journey-indicator"><i/><span>SCROLL TO EXPLORE</span></div>
 <button className="motion-toggle" aria-pressed={quiet} disabled={mediaFailed} aria-label={mediaFailed?(lang==='en'?'Static browsing: film unavailable':'静态浏览：影片未能加载'):quiet?(lang==='en'?'Enable motion':'恢复动态'):(lang==='en'?'Reduce motion':'减少动态')} onClick={toggleMotion} title={mediaFailed?(lang==='en'?'The film is unavailable; all work remains available in static browsing.':'影片未能加载，所有作品仍可通过静态浏览访问。'):(lang==='en'?'Toggle reduced motion':'切换减少动态')}>{mediaFailed?'STATIC':quiet?'MOTION −':'MOTION +'}</button>
 {modal&&<PortfolioPages page={modal} lang={lang} reduced={quiet} onNavigate={open} onBack={back} pageScroll={pageScroll} archiveState={archiveState}/>}
 {about&&<div className="about-shell" role="dialog" aria-modal="true" aria-label="About Jay"><AboutPanel lang={lang} reducedMotion={quiet} onClose={()=>setAbout(false)}/></div>}
 {loading&&<LoadingScreen lang={lang} reduced={reduced} onDone={()=>setLoading(false)}/>}
 </>;
}
