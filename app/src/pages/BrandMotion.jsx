import {useEffect,useRef,useState} from 'react';
import {useMusic} from '../components/BackgroundMusic';
import './brand-motion.css';

const media='/assets/other-project/jay-lin';
const films=[
 {id:'motion',number:'01',duration:'00:55',poster:'motion-poster.jpg',title:{en:'Portfolio in motion',zh:'作品集动态展示'},description:{en:'A walkthrough of the portfolio, from the studio to the projects and visual worlds.',zh:'从工作室出发，走过项目、交互与视觉世界。'}},
 {id:'logo-motion',number:'02',duration:'00:07',poster:'logo-poster.jpg',title:{en:'A mark takes shape',zh:'让标识成形'},description:{en:'The JL monogram moves from a three-dimensional form into the JAY LIN identity.',zh:'JL 标识从三维形态，逐步化为 JAY LIN 的品牌符号。'}},
];

export default function BrandMotion({lang,onNavigate}){
 const en=lang==='en',root=useRef(null),[failed,setFailed]=useState({});
 const {setSuppressed}=useMusic();
 const syncMusic=()=>setSuppressed([...root.current.querySelectorAll('video')].some(video=>!video.paused&&!video.ended&&!video.error));
 const play=event=>{
  root.current.querySelectorAll('video').forEach(video=>{if(video!==event.currentTarget)video.pause();});
  syncMusic();
 };
 useEffect(()=>{
  const pauseWhenHidden=()=>{if(document.hidden)root.current?.querySelectorAll('video').forEach(video=>video.pause());};
  document.addEventListener('visibilitychange',pauseWhenHidden);
  return()=>{document.removeEventListener('visibilitychange',pauseWhenHidden);setSuppressed(false);};
 },[setSuppressed]);
 return <article ref={root} className="brand-motion-page" data-nav-tone="light">
  <header className="brand-motion-heading">
   <div className="brand-motion-kicker"><a href="/other-project" onClick={event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();onNavigate('/other-project');
   }}>← Other Project</a><span>IDENTITY / MOTION</span></div>
   <div className="brand-motion-title"><h1>JAY LIN</h1><p>Between rules <i>& wonder.</i></p></div>
   <div className="brand-motion-intro"><span>{en?'BRAND & MOTION':'品牌与动态设计'}</span><p>{en?'A personal identity in stills and motion. A portfolio film and a short logo animation bring the mark into view.':'以静态与动态呈现个人品牌。通过作品集展示影片与 Logo 动效，让标识与作品一起被看见。'}</p></div>
  </header>
  <figure className="brand-motion-identity">
   <img src={media+'/identity.png'} width="1920" height="1080" alt={en?'JAY LIN identity — JL monogram and Between rules & wonder tagline':'JAY LIN 品牌视觉：JL 标识与 Between rules & wonder 标语'} fetchPriority="high"/>
   <figcaption><span>{en?'THE IDENTITY':'品牌视觉'}</span><span>LOGIC × IMAGINATION</span></figcaption>
  </figure>
  <div className="brand-motion-films">
   {films.map(film=><section className="brand-motion-film" key={film.id} aria-labelledby={'film-'+film.id}>
    <header><span className="brand-motion-number">{film.number} /</span><div><h2 id={'film-'+film.id}>{film.title[lang]}</h2><p>{film.description[lang]}</p></div><span className="brand-motion-duration">{film.duration}</span></header>
    <video controls playsInline preload="none" poster={media+'/'+film.poster} aria-label={film.title[lang]} onPlay={play} onPause={syncMusic} onEnded={syncMusic} onError={()=>{setFailed(value=>({...value,[film.id]:true}));syncMusic();}}>
     <source src={media+'/'+film.id+'.mp4'} type="video/mp4"/>
     <a href={media+'/'+film.id+'.mp4'}>{en?'Open video':'打开视频'}</a>
    </video>
    {failed[film.id]&&<p className="brand-motion-error" role="alert">{en?'The video could not load. Try opening it directly below.':'视频暂时未能加载，请通过下方链接直接打开。'}</p>}
    <div className="brand-motion-film-note"><span>1920 × 1080 / 60 FPS</span><a href={media+'/'+film.id+'.mp4'} target="_blank" rel="noopener noreferrer">{en?'Open video':'单独打开视频'} ↗</a></div>
   </section>)}
  </div>
  <footer className="brand-motion-footer"><span>JAY LIN / BRAND & MOTION</span><p>Between rules & wonder.</p></footer>
 </article>;
}
