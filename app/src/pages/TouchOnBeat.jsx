import {useEffect,useRef,useState} from 'react';
import {useMusic} from '../components/BackgroundMusic';
import './brand-motion.css';
import './touch-on-beat.css';

const media='/assets/other-project/touch-on-beat';
const film=media+'/touch-on-beat.mp4';
// One still per interaction; the lyric stays in Chinese because it is what the song sings.
const stills=[
 {id:'swipe',lyric:'轻轻滑 换一张',label:{en:'Swipe · Photos',zh:'滑动 · 相册'}},
 {id:'toggle',lyric:'开关开关',label:{en:'Toggle · Settings',zh:'开关 · 设置'}},
 {id:'heartbeat',lyric:'心跳和按钮同一个拍',label:{en:'Heart rate · Health',zh:'心率 · 健康'}},
 {id:'pads',lyric:'跟着拍子点亮它',label:{en:'Tap · Drum pads',zh:'点按 · 鼓机'}},
 {id:'hold',lyric:'按住别放开',label:{en:'Hold · Voice message',zh:'长按 · 语音'}},
 {id:'song',lyric:'啊',label:{en:'Play · The song itself',zh:'播放 · 这首歌'}},
];
const notes=[
 {title:{en:'One take, one phone',zh:'一镜到底，一部手机'},body:{en:'Every sung syllable lands as a gesture: a tap, a swipe, a pull, a toggle, a hold. The phone never leaves the frame.',zh:'每个唱出的字都落成一次手势：点、滑、拉、开关、按住。手机始终留在画面里。'}},
 {title:{en:'Feedback you can feel',zh:'看得见的反馈'},body:{en:'Presses sink and spring back, the glass ripples, and each touch has its own interface sound on the beat.',zh:'按下会下沉再回弹，玻璃泛起涟漪，每次触碰都有一声落在拍子上的界面音效。'}},
 {title:{en:'Smooth at 60 fps',zh:'60 帧的顺滑'},body:{en:'The fingertip speeds up and slows down like a real hand, and each scene picks up the camera where the last one left it, so nothing jumps.',zh:'指尖像真手一样平滑地加速、减速；每一段都从上一段停下的镜头接着走，画面不跳。'}},
];

export default function TouchOnBeat({lang,onNavigate}){
 const en=lang==='en',root=useRef(null),[failed,setFailed]=useState(false);
 const {setSuppressed}=useMusic();
 const syncMusic=()=>{const video=root.current?.querySelector('video');setSuppressed(Boolean(video&&!video.paused&&!video.ended&&!video.error));};
 useEffect(()=>{
  const pauseWhenHidden=()=>{if(document.hidden)root.current?.querySelector('video')?.pause();};
  document.addEventListener('visibilitychange',pauseWhenHidden);
  return()=>{document.removeEventListener('visibilitychange',pauseWhenHidden);setSuppressed(false);};
 },[setSuppressed]);
 return <article ref={root} className="brand-motion-page tob-page" data-nav-tone="light">
  <header className="brand-motion-heading">
   <div className="brand-motion-kicker"><a href="/other-project" onClick={event=>{
    if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();onNavigate('/other-project');
   }}>← Other Project</a><span>UI MOTION / MUSIC VIDEO</span></div>
   <div className="brand-motion-title"><h1 lang="zh-CN">一拍一触</h1><p>Touch on <i>beat.</i></p></div>
   <div className="brand-motion-intro"><span>{en?'UI MOTION FILM':'UI 交互动态短片'}</span><p>{en?'Every sung syllable is a touch on a phone that looks real: a tap, a swipe, a pull, a hold. One phone, one take, 59 seconds.':'每个唱出的字，都是手机上的一次真实触碰：点、滑、拉、按住。一部手机，一镜到底，59 秒。'}</p></div>
  </header>
  <div className="brand-motion-films">
   <section className="brand-motion-film" aria-labelledby="film-touch-on-beat">
    <header><span className="brand-motion-number">01 /</span><div><h2 id="film-touch-on-beat">{en?'One line, one interaction':'一句歌词，一次交互'}</h2><p>{en?'Cut to the song 踩在你的节拍. Lock screen, photos, messages, settings, health, a drum machine, a feed, a voice message and a music player, one for every line.':'配乐《踩在你的节拍》。锁屏、相册、信息、设置、健康、鼓机、信息流、语音和播放器，每句歌词对应一个界面。'}</p></div><span className="brand-motion-duration">00:59</span></header>
    <video controls playsInline preload="none" poster={media+'/poster.webp'} aria-label={en?'Touch on Beat — UI motion music video':'一拍一触 UI 交互动态 MV'} onPlay={syncMusic} onPause={syncMusic} onEnded={syncMusic} onError={()=>{setFailed(true);syncMusic();}}>
     <source src={film} type="video/mp4"/>
     <a href={film}>{en?'Open video':'打开视频'}</a>
    </video>
    {failed&&<p className="brand-motion-error" role="alert">{en?'The video could not load. Try opening it directly below.':'视频暂时未能加载，请通过下方链接直接打开。'}</p>}
    <div className="brand-motion-film-note"><span>1920 × 1080 / 60 FPS / {en?'SOUND ON':'请开声音'}</span><a href={film} target="_blank" rel="noopener noreferrer">{en?'Open video':'单独打开视频'} ↗</a></div>
   </section>
  </div>
  <section className="tob-section" aria-labelledby="tob-frames">
   <header className="tob-section-head"><h2 id="tob-frames">{en?'Frames':'画面'}</h2><span>{String(stills.length).padStart(2,'0')} / {en?'STILLS':'静帧'}</span></header>
   <div className="tob-stills">{stills.map(still=><figure key={still.id}>
    <img src={media+'/still-'+still.id+'.webp'} width="1600" height="900" loading="lazy" decoding="async" alt={(en?'Touch on Beat still: ':'一拍一触静帧：')+still.label[lang]}/>
    <figcaption><span lang="zh-CN">{still.lyric}</span><span>{still.label[lang]}</span></figcaption>
   </figure>)}</div>
  </section>
  <section className="tob-section" aria-labelledby="tob-notes">
   <header className="tob-section-head"><h2 id="tob-notes">{en?'How it moves':'动效要点'}</h2></header>
   <ol className="tob-notes">{notes.map((note,i)=><li key={i}><span>0{i+1}</span><h3>{note.title[lang]}</h3><p>{note.body[lang]}</p></li>)}</ol>
  </section>
  <footer className="brand-motion-footer"><span>JAY LIN / TOUCH ON BEAT</span><p lang="zh-CN">每一颗像素，都踩在你的节拍。</p></footer>
 </article>;
}
