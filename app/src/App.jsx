import React, {useEffect, useState} from 'react';

import LegacyHero from './LegacyHero';
import OneStroke from './onestroke/OneStroke';
import SiteNavigation from './components/SiteNavigation';
import AboutPanel from './components/AboutPanel';
import LoadingScreen from './components/LoadingScreen';
import ExpressiveTitle from './components/ExpressiveTitle';

import PortfolioPages from './pages/PortfolioPages';
import {usePortfolioRouting} from './usePortfolioRouting';

export default function App(){
 const[loading,setLoading]=useState(true);
 const[lang,setLang]=useState(localStorage.getItem('jay-lang')||'zh'),[about,setAbout]=useState(false);
 const[reduced,setReduced]=useState(matchMedia('(prefers-reduced-motion: reduce)').matches);
 const quiet=reduced;
 const {modal,open,close,back,pageScroll,archiveState}=usePortfolioRouting();
 // the whole site reads reduced motion from the body (navigation, titles, pages)
 useEffect(()=>{document.body.classList.toggle('quiet',quiet);},[quiet]);
 // the thin progress line on the right: how far down the whole homepage you are
 useEffect(()=>{let f=0;const draw=()=>{f=0;const bar=document.querySelector('.journey-indicator i');if(bar)bar.style.transform=`scaleY(${(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)).toFixed(4)})`;};const queue=()=>{if(!f)f=requestAnimationFrame(draw);};addEventListener('scroll',queue,{passive:true});addEventListener('resize',queue);draw();return()=>{cancelAnimationFrame(f);removeEventListener('scroll',queue);removeEventListener('resize',queue);};},[]);
 const toggleMotion=()=>{
  if(modal){setReduced(v=>!v);return;}
  const candidates=['home','systems','journey-about','journey-timeline','worlds','contact'];
  const id=[...candidates].reverse().find(id=>{const r=document.getElementById(id)?.getBoundingClientRect();return r&&r.top<=innerHeight*.5;})||'home';
  setReduced(v=>!v);requestAnimationFrame(()=>requestAnimationFrame(()=>(document.getElementById(id)||document.getElementById('home'))?.scrollIntoView({behavior:'instant'})));
 };
 const nav=id=>{
  if(id==='art'){open('/works');return;}
  if(id==='archive'){open('/works/archive');return;}
  if(id==='vibecoding'){open('/other-project');return;}
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
 return <>
 <a className="skip-link" href={modal?'#portfolio-page':'#systems'}>{lang==='en'?'Skip to content':'跳到正文'}</a>
 <SiteNavigation lang={lang} reducedMotion={quiet} tone={modal?(['desk','archive'].includes(modal.type)?'dark':'light'):'auto'} onLanguage={setLang} onNavigate={nav} onAbout={()=>setAbout(true)}/>
 <main className="home-journey" inert={modal?true:undefined} aria-hidden={!!modal}>
  <LegacyHero lang={lang} reduced={quiet}/>
  <OneStroke lang={lang} reduced={quiet} onOpen={open} onArchive={()=>open('/works/archive')} onAbout={()=>setAbout(true)} onNavigate={nav}/>
 </main>
 <div className="journey-indicator"><i/><span><ExpressiveTitle variant="type" typingSpeed={30} reduced={quiet} hover={false}>SCROLL TO EXPLORE</ExpressiveTitle></span></div>
 <button className="motion-toggle" aria-pressed={quiet} aria-label={quiet?(lang==='en'?'Enable motion':'恢复动态'):(lang==='en'?'Reduce motion':'减少动态')} onClick={toggleMotion} title={lang==='en'?'Toggle reduced motion':'切换减少动态'}><ExpressiveTitle variant="type" typingSpeed={30} reduced={quiet} hover={false}>{quiet?'MOTION −':'MOTION +'}</ExpressiveTitle></button>
 {modal&&<PortfolioPages page={modal} lang={lang} reduced={quiet} onNavigate={open} onBack={back} pageScroll={pageScroll} archiveState={archiveState}/>}
 {about&&<div className="about-shell"><AboutPanel lang={lang} onLanguage={setLang} reducedMotion={quiet} onClose={()=>setAbout(false)}/></div>}
 {loading&&<LoadingScreen lang={lang} reduced={reduced} onDone={()=>setLoading(false)}/>}
 </>;
}
