import {useEffect,useRef,useState} from 'react';
import './brand-motion.css';
import './product-films.css';

// The films share their files with the case pages' walkthrough player (public/video, "the film").
const films=[
 {id:'variables-for-agents',stem:'d1-ready-for-agents',slug:'ready-for-agents',name:'Variables for agents',duration:'00:29',from:{en:'The Ready for agents case',zh:'Ready for agents 案例'},description:{en:'Coding agents copy the hex values they see and invent names for them. The film follows a Figma file from twelve unbound values to bound variables, and the agent that asks about the rest.',zh:'Coding agent 会照抄看到的色值，再自己给它们起名字。片子从一个有 12 个未绑定数值的 Figma 文件讲起，讲到绑定 variables，再到会主动问剩下那些值的 agent。'}},
 {id:'last-100-feet',stem:'d3-last-100-feet',slug:'last-100-feet',name:'Last 100 Feet',duration:'00:29',from:{en:'The Last 100 Feet case',zh:'Last 100 Feet 案例'},description:{en:'The map says you’re here; the door says otherwise. A resident marks the way in once, and a courier follows it from the curb, through the gate code, to door 214.',zh:'地图说你到了，门牌却不对。住户把进门的路标一次，骑手照着走：从路边、门禁码，一直到 214 号门口。'}},
 {id:'common-ground',stem:'d4-choose-not-to-lose',slug:'choose-not-to-lose',name:'Common Ground',duration:'00:32',from:{en:'The Choose Not to Lose case',zh:'Choose Not to Lose 案例'},description:{en:'The plan with the lowest premium has the costliest worst year. Every plan, priced for the whole year, and the $600 a year between two plans with the same coverage.',zh:'月费最低的方案，碰上最糟的一年反而最贵。片子把每个方案按全年算总账，再把保障相同的两个方案之间每年差的 600 美元摆出来。'}},
];

export default function ProductFilms({lang,onNavigate}){
 const en=lang==='en',root=useRef(null),[failed,setFailed]=useState({});
 const go=to=>event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();onNavigate(to);
 };
 // one film at a time
 const play=event=>root.current.querySelectorAll('video').forEach(video=>{if(video!==event.currentTarget)video.pause();});
 useEffect(()=>{
  const pauseWhenHidden=()=>{if(document.hidden)root.current?.querySelectorAll('video').forEach(video=>video.pause());};
  document.addEventListener('visibilitychange',pauseWhenHidden);
  return()=>document.removeEventListener('visibilitychange',pauseWhenHidden);
 },[]);
 return <article ref={root} className="brand-motion-page pf-page" data-nav-tone="light">
  <header className="brand-motion-heading">
   <div className="brand-motion-kicker"><a href="/other-project" onClick={go('/other-project')}>← Other Project</a><span>PRODUCT / LAUNCH FILMS</span></div>
   <div className="brand-motion-title"><h1>Product films</h1><p>Three products, <i>half a minute each.</i></p></div>
   <div className="brand-motion-intro"><span>{en?'LAUNCH FILMS':'产品宣传片'}</span><p>{en?'Short launch films for three of my product concepts, made in code from each prototype’s own screens and numbers. The products are concepts, not yet tested with people. The films have no sound.':'给我的三个产品概念做的宣传短片，用代码搭成，画面和数字都来自各自的原型。这些产品还是概念，没有经过用户测试。影片没有声音。'}</p></div>
  </header>
  <div className="brand-motion-films">
   {films.map((film,i)=>{
    const src='/video/'+film.stem+'-film.mp4',caseHref='/product/'+film.slug;
    return <section className="brand-motion-film" key={film.id} aria-labelledby={'film-'+film.id}>
     <header><span className="brand-motion-number">0{i+1} /</span><div><h2 id={'film-'+film.id} lang="en">{film.name}</h2><p>{film.description[lang]}</p></div><span className="brand-motion-duration">{film.duration}</span></header>
     <video controls muted playsInline preload="none" poster={'/video/'+film.stem+'-film.jpg'} aria-label={film.name+(en?' — launch film, no sound':' 宣传片，无声')} onPlay={play} onError={()=>setFailed(value=>({...value,[film.id]:true}))}>
      <source src={src} type="video/mp4"/>
      <a href={src}>{en?'Open video':'打开视频'}</a>
     </video>
     {failed[film.id]&&<p className="brand-motion-error" role="alert">{en?'The video could not load. Try opening it directly below.':'视频暂时未能加载，请通过下方链接直接打开。'}</p>}
     <div className="brand-motion-film-note"><span>1920 × 1080 / 60 FPS / {en?'NO SOUND':'无声'}</span><span className="pf-links">
      <a href={caseHref} onClick={go(caseHref)}>{film.from[lang]} →</a>
      <a href={src} target="_blank" rel="noopener noreferrer">{en?'Open video':'单独打开视频'} ↗</a>
     </span></div>
    </section>;
   })}
  </div>
  <footer className="brand-motion-footer"><span>JAY LIN / PRODUCT FILMS</span><p>Three concepts by Jay Lin.</p></footer>
 </article>;
}
