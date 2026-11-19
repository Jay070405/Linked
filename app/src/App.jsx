import React, {lazy, Suspense, useCallback, useEffect, useState} from 'react';

import JL01 from './jl01/JL01';
import SiteNavigation from './components/SiteNavigation';
import LoadingScreen from './components/LoadingScreen';
import ExpressiveTitle from './components/ExpressiveTitle';

import PortfolioPages from './pages/PortfolioPages';
import {usePortfolioRouting, routeFor} from './usePortfolioRouting';
import DotTransition,{useDotTransition} from './components/DotTransition';
import {initialLanguage, saveLanguage} from './language';

// The home is JL-01, a machine you switch on (src/jl01). The home it replaced is kept for visitors who ask for reduced motion or have no
// WebGL: it has a full static form, and is only downloaded for them.
const LegacyHome=lazy(()=>import('./LegacyHome'));
const canWebGL=()=>{try{const c=document.createElement('canvas');return !!(c.getContext('webgl2')||c.getContext('webgl'));}catch{return false;}};
// (Legacy home only.) The loading screen plays once per visit: coming back to the homepage from a case or /about goes straight in.
const ARRIVED='jl-arrived';
const arrivedBefore=()=>{try{return sessionStorage.getItem(ARRIVED)==='1';}catch{return false;}};
const JOURNEY_SECTIONS=['systems','journey-about','journey-timeline','product','worlds','contact'];

export default function App(){
 const[loading,setLoading]=useState(()=>!arrivedBefore());
 const arrive=()=>{try{sessionStorage.setItem(ARRIVED,'1');}catch{}setLoading(false);};
 // a link such as /#contact lands on its chapter instead of the top of the journey
 useEffect(()=>{const id=location.hash.slice(1);if(!JOURNEY_SECTIONS.includes(id))return;
  const f=requestAnimationFrame(()=>requestAnimationFrame(()=>{document.getElementById(id)?.scrollIntoView({behavior:'instant'});window.dispatchEvent(new Event('journey:jump'));}));
  return()=>cancelAnimationFrame(f);},[]);
 const[lang,setLang]=useState(initialLanguage);
 // only a language the visitor picks is remembered; until then the browser (or ?lang=) decides
 const chooseLang=value=>{setLang(value);saveLanguage(value);};
 const[reduced,setReduced]=useState(matchMedia('(prefers-reduced-motion: reduce)').matches);
 const quiet=reduced;
 const[webgl]=useState(canWebGL);
 const machine=!quiet&&webgl;
 // the machine has its own switching on: no loading screen in front of it
 useEffect(()=>{if(machine)arrive();},[machine]);
 const {run:transition,layer:transitionLayer}=useDotTransition(quiet);
 const {modal,open,close,back,pageScroll,archiveState}=usePortfolioRouting(transition);
 // a link inside the home to one of the site's pages: opened the way the site opens pages; says whether it was one
 const openPath=useCallback(path=>{if(!routeFor(path))return false;open(path);return true;},[open]);
 // the whole site reads reduced motion from the body (navigation, titles, pages)
 useEffect(()=>{document.body.classList.toggle('quiet',quiet);},[quiet]);
 // the thin progress line on the right: how far down the whole homepage you are
 useEffect(()=>{let f=0;const draw=()=>{f=0;const bar=document.querySelector('.journey-indicator i');if(bar)bar.style.transform=`scaleY(${(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)).toFixed(4)})`;};const queue=()=>{if(!f)f=requestAnimationFrame(draw);};addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);draw();return()=>{cancelAnimationFrame(f);removeEventListener('scroll',queue);removeEventListener('resize',queue);};},[]);
 const toggleMotion=()=>{
  if(modal){setReduced(v=>!v);return;}
  const candidates=['home','systems','journey-about','journey-timeline','product','contact'];
  const id=[...candidates].reverse().find(id=>{const r=document.getElementById(id)?.getBoundingClientRect();return r&&r.top<=innerHeight*.5;})||'home';
  setReduced(v=>!v);requestAnimationFrame(()=>requestAnimationFrame(()=>(document.getElementById(id)||document.getElementById('home'))?.scrollIntoView({behavior:'instant'})));
 };
 const nav=id=>{
  if(id==='product'){open('/product');return;}
  if(id==='art'){open('/works');return;}
  if(id==='systems'){open('/systems');return;}
  if(id==='archive'){open('/works/archive');return;}
  if(id==='vibecoding'){open('/other-project');return;}
  if(id==='about'){open('/about');return;}
  if(modal){close(id);return;}
  transition(()=>{
   const section=document.getElementById(id);
   section?.scrollIntoView({behavior:'instant'});
   history.replaceState(history.state,'','/#'+id);
   window.dispatchEvent(new Event('journey:jump'));
   section?.setAttribute('tabindex','-1');section?.focus({preventScroll:true});
  });
 };
 useEffect(()=>{document.documentElement.lang=lang==='en'?'en':'zh-CN';},[lang]);
 // Preserve old inbound links, including hash changes during this visit.
 useEffect(()=>{const go=()=>{if(location.hash==='#about')location.replace('/about'+location.search);};go();addEventListener('hashchange',go);return()=>removeEventListener('hashchange',go);},[]);
 useEffect(()=>{const preference=matchMedia('(prefers-reduced-motion: reduce)');const sync=()=>setReduced(preference.matches);preference.addEventListener('change',sync);return()=>preference.removeEventListener('change',sync);},[]);
 return <>
 <a className="skip-link" href={modal?'#portfolio-page':'#systems'}>{lang==='en'?'Skip to content':'跳到正文'}</a>
 <SiteNavigation lang={lang} reducedMotion={quiet} tone={modal?(['desk','archive'].includes(modal.type)?'dark':['about','product','product-film','hako','data-hall','systems'].includes(modal.type)?'auto':'light'):'auto'} onLanguage={chooseLang} onNavigate={nav} onAbout={()=>nav('about')}/>
 <main className="home-journey" inert={modal?true:undefined} aria-hidden={!!modal}>
  {machine?<JL01 lang={lang} embedded covered={!!modal} onOpen={openPath}/>
   :<Suspense fallback={null}><LegacyHome lang={lang} reduced={quiet} covered={!!modal} onOpen={open} onNavigate={nav} onTransition={transition}/></Suspense>}
 </main>
 {!machine&&<div className="journey-indicator"><i/><span><ExpressiveTitle variant="type" typingSpeed={30} reduced={quiet} hover={false}>SCROLL TO EXPLORE</ExpressiveTitle></span></div>}
 <button className="motion-toggle" aria-pressed={quiet} aria-label={quiet?(lang==='en'?'Enable motion':'恢复动态'):(lang==='en'?'Reduce motion':'减少动态')} onClick={toggleMotion} title={lang==='en'?'Toggle reduced motion':'切换减少动态'}><ExpressiveTitle variant="type" typingSpeed={30} reduced={quiet} hover={false}>{quiet?'MOTION −':'MOTION +'}</ExpressiveTitle></button>
 {modal&&<PortfolioPages page={modal} lang={lang} reduced={quiet} onNavigate={open} onBack={back} pageScroll={pageScroll} archiveState={archiveState}/>}
 <DotTransition layer={transitionLayer} lang={lang}/>
 {loading&&!machine&&<LoadingScreen lang={lang} reduced={reduced} onDone={arrive}/>}
 </>;
}
