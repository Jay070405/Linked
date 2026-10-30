import React, {useEffect, useState} from 'react';

import LegacyHero from './LegacyHero';
import OneStroke from './onestroke/OneStroke';
import SiteNavigation from './components/SiteNavigation';
import LoadingScreen from './components/LoadingScreen';
import ExpressiveTitle from './components/ExpressiveTitle';

import PortfolioPages from './pages/PortfolioPages';
import {usePortfolioRouting} from './usePortfolioRouting';
import CircularTransition,{useCircularTransition} from './components/CircularTransition';
import {initialLanguage, saveLanguage} from './language';

// The loading screen plays once per visit: coming back to the homepage from a case or /about goes straight in.
const ARRIVED='jl-arrived';
// the product-film pages printed on paper, with dark frames on them: the navigation reads its tone from what is under it
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
 const {run:transition,layer:transitionLayer}=useCircularTransition(quiet);
 const {modal,open,close,back,pageScroll,archiveState}=usePortfolioRouting(transition);
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
 <SiteNavigation lang={lang} reducedMotion={quiet} tone={modal?(['desk','archive','systems'].includes(modal.type)?'dark':['about','product-film','hako'].includes(modal.type)?'auto':'light'):'auto'} onLanguage={chooseLang} onNavigate={nav} onAbout={()=>nav('about')}/>
 <main className="home-journey" inert={modal?true:undefined} aria-hidden={!!modal}>
  <LegacyHero lang={lang} reduced={quiet} onProduct={()=>open('/product')}/>
  <OneStroke lang={lang} reduced={quiet} onOpen={open} onArchive={()=>open('/works/archive')} onAbout={()=>nav('about')} onNavigate={nav} onTransition={transition}/>
 </main>
 <div className="journey-indicator"><i/><span><ExpressiveTitle variant="type" typingSpeed={30} reduced={quiet} hover={false}>SCROLL TO EXPLORE</ExpressiveTitle></span></div>
 <button className="motion-toggle" aria-pressed={quiet} aria-label={quiet?(lang==='en'?'Enable motion':'恢复动态'):(lang==='en'?'Reduce motion':'减少动态')} onClick={toggleMotion} title={lang==='en'?'Toggle reduced motion':'切换减少动态'}><ExpressiveTitle variant="type" typingSpeed={30} reduced={quiet} hover={false}>{quiet?'MOTION −':'MOTION +'}</ExpressiveTitle></button>
 {modal&&<PortfolioPages page={modal} lang={lang} reduced={quiet} onNavigate={open} onBack={back} pageScroll={pageScroll} archiveState={archiveState}/>}
 <CircularTransition layer={transitionLayer} lang={lang}/>
 {loading&&<LoadingScreen lang={lang} reduced={reduced} onDone={arrive}/>}
 </>;
}
