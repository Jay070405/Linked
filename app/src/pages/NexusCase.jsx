import {useEffect,useRef,useState} from 'react';
import ExpressiveTitle from '../components/ExpressiveTitle';
import {useMusic} from '../components/BackgroundMusic';
import './nexus-case.css';

export default function NexusCase({item,lang,reduced}) {
 const en=lang==='en',video=useRef(null),[failed,setFailed]=useState(false);
 const {setSuppressed}=useMusic();
 useEffect(()=>()=>setSuppressed(false),[setSuppressed]);
 useEffect(()=>{
  const pauseWhenHidden=()=>{if(document.hidden)video.current?.pause();};
  document.addEventListener('visibilitychange',pauseWhenHidden);
  return()=>document.removeEventListener('visibilitychange',pauseWhenHidden);
 },[]);
 return <article className="nexus-page" data-nav-tone="light">
  <header className="nexus-heading">
   <div className="nexus-kicker"><span>SYSTEMS / UNITY</span><span>PROJECT FILM — 02:25</span></div>
   <div className="nexus-title"><h1><ExpressiveTitle reduced={reduced}>NEXUS</ExpressiveTitle></h1><div><span>CHAPTER 01</span><h2>{en?'The Island':'孤岛'}</h2></div></div>
   <div className="nexus-intro"><span className="nexus-mark" aria-hidden="true">↳</span><p>{en?item.descriptionEn:item.description}</p><span>{en?'PLAY / EXPLORE / WATCH':'播放 · 探索 · 观看'}</span></div>
  </header>
  <figure className="nexus-film">
   <video ref={video} controls playsInline preload="none" poster={item.image} aria-label={en?'NEXUS Chapter 01: The Island — full Unity showcase':'NEXUS 第一章：孤岛 — 完整 Unity 作品演示'}
    onPlay={()=>setSuppressed(true)} onPause={()=>setSuppressed(false)} onEnded={()=>setSuppressed(false)} onError={()=>{setFailed(true);setSuppressed(false);}}>
    <source src={item.video} type="video/mp4"/>
    <a href={item.video}>{en?'Open the video':'打开视频'}</a>
   </video>
   <figcaption><span>{en?'FULL SHOWCASE / ORIGINAL AUDIO':'完整演示 / 原声'}</span><span>1920 × 1080 · UNITY</span></figcaption>
  </figure>
  {failed&&<p className="nexus-error" role="alert">{en?'The player could not load the film. Use the video link below to open it directly.':'播放器暂时未能加载，请通过下方链接直接打开视频。'}</p>}
  <footer className="nexus-resources"><p>{en?'Watch at your own pace. Fullscreen and playback controls are available in the player.':'按自己的节奏观看。可在播放器中拖动进度、调节音量或全屏播放。'}</p><a href={item.video} target="_blank" rel="noreferrer">{en?'Open video':'单独打开视频'} ↗</a><a href={item.video} download="NEXUS-Chapter-01.mp4">{en?'Download video':'下载视频'} ↓</a></footer>
 </article>;
}
