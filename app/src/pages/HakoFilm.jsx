import {useEffect,useRef,useState} from 'react';
import {useMusic} from '../components/BackgroundMusic';
import EDIT from './hako-edit.json';
import './brand-motion.css';
import './hako-film.css';

// Everything on this page comes from the film's own project (aigc-vibecoding/saas-film): the cut, its shots, the
// music edit, the 82 foley cues and the per-frame motion read from the final render (hako-edit.json).
const media='/assets/other-project/hako';
const film=media+'/hako.mp4';
const DUR=50,FPS=60,SONG=173.28;
const pos=t=>t/DUR*100+'%';
const span=(a,b)=>({left:pos(a),width:(b-a)/DUR*100+'%'});
const clock=t=>{const f=Math.min(Math.round(t*FPS),DUR*FPS),s=Math.floor(f/FPS);return '00:00:'+String(s).padStart(2,'0')+':'+String(f%FPS).padStart(2,'0');};
const sec=t=>'00:'+t.toFixed(1).padStart(4,'0');
const mmss=t=>Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');

// cuts on exact frames: the 3D↔2D mark swaps at 44.417 and 46.05 are cuts too
const SHOTS=[0,.45,5.85,10.3,13.05,17.6,19.9,31.9,32.5,44.417,46.05,DUR];
const BEATS=[
 {to:.45,name:'Key',what:{en:'The B key, the box tool, goes down.',zh:'按下 B 键，也就是框选工具。'},camera:{en:'Macro on a 3D keycap',zh:'3D 键帽特写'}},
 {to:5.85,name:'Draw',what:{en:'A box is dragged out and “Draw a box.” appears inside it; then the selection moves onto the team’s sketch.',zh:'拖出一个框，“Draw a box.” 在框里显现；随后选框移到团队的草图上。'},camera:{en:'Pulls back with the drag, easing into a pan',zh:'跟着拖拽拉远，顺势转成横移'}},
 {to:10.3,name:'Build',what:{en:'A prompt is typed, Build is clicked and three agents fly out; a scan line turns the sketch into a dark dashboard.',zh:'输入提示词、点击 Build，三个 agent 飞出；一道扫描线把草图变成深色仪表盘。'},camera:{en:'Macro on the prompt, then a pull-back with a focus pull',zh:'先特写提示框，再拉远并转移焦点'}},
 {to:13.05,name:'Metrics',what:{en:'The numbers count up and the chart draws: measured solid, forecast dashed.',zh:'数字跳动，曲线画出：实测为实线，预测为虚线。'},camera:{en:'One steep macro on a rounded U-turn',zh:'一个大倾角特写，走一条圆滑的 U 形路线'}},
 {to:17.6,name:'Team',what:{en:'“Hako builds what’s inside.” becomes “With your team.”; teammates tick off their notes and Theo switches Day to Week.',zh:'“Hako builds what’s inside.” 原地换成 “With your team.”；队友勾掉便签，Theo 把日视图切到周视图。'},camera:{en:'One push from wide into medium',zh:'从全景一路推到中景'}},
 {to:19.9,name:'Comment',what:{en:'Mia pins a comment, Ren turns on the EV charger, and the agent answers with a per-room breakdown.',zh:'Mia 留下评论，Ren 打开电车充电，agent 回复一份分房间的明细。'},camera:{en:'Macro, tilted 24°',zh:'倾斜 24° 的特写'}},
 {to:31.124,name:'Layers',what:{en:'The stage goes dark, the screen comes apart into layers, Saturday’s bar is picked on the data layer, and it all clicks back together.',zh:'舞台变暗，界面拆成图层，在数据层上选中周六的柱子，然后一切合拢。'},camera:{en:'One continuous take: rise, turn, descend',zh:'一镜到底：升起、环绕、落下'}},
 {to:39.327,name:'Ship',what:{en:'Ship is clicked; the selection extrudes into a real box that rides the deploy track and unpacks into the browser: live.',zh:'点击 Ship；选框挤出成一个真实的盒子，沿部署轨道一路送达，在浏览器里拆开：上线。'},camera:{en:'Continuous, with one cut-in on the button',zh:'连续运镜，中间切一个按钮特写'}},
 {to:43.398,name:'Scale',what:{en:'The canvas opens up: dozens of products being sketched, built and shipped, then one giant marquee selects them all.',zh:'画布展开：几十个产品正在被画、被搭、被上线，最后一个巨大的选框把它们全部框住。'},camera:{en:'Dolly out',zh:'后拉揭示'}},
 {to:DUR,name:'Mark',what:{en:'The selection collapses into the mark, the mark turns in light, and “Now in early access” is clicked.',zh:'选框收拢成标志，标志在光里转过，最后点下 “Now in early access”。'},camera:{en:'Match cut on the shape, then flat',zh:'形状匹配剪辑，再切到平面'}},
];
const HEADLINES=[[.6,4.1,'Draw a box.'],[13.1,14.7,'Hako builds what’s inside.'],[15.15,16.55,'With your team.'],[19.2,21.95,'And your agents.'],[25.2,27.4,'Every layer, production-ready.'],[37.53,39.33,'Ship a product.'],[46.15,DUR,'hako · Draw a box. Ship a product.']];
// track A: four pieces of the 2:53 song, joined on the beat
const MUSIC=[[.33,22.041,0,21.711],[22.041,29.241,108.111,115.311],[29.241,36.441,117.711,124.911],[36.441,DUR,144.121,157.68]];
const FAMILIES=[
 {id:'click',color:'#f2f0eb',onPaper:'#141416',h:.78,label:{en:'Mouse clicks',zh:'鼠标点击'}},
 {id:'key',color:'#9a9aa6',h:.5,label:{en:'Keyboard',zh:'键盘'}},
 {id:'marimba',color:'#e8a21a',h:.64,label:{en:'Marimba',zh:'马林巴'}},
 {id:'body',color:'#0fa3a3',h:1,label:{en:'Book & box knocks',zh:'书本与盒子'}},
 {id:'pop',color:'#e8467c',h:.9,label:{en:'Mouth pops',zh:'嘴巴“啵”声'}},
].map(f=>({...f,count:EDIT.cues.filter(c=>c[1]===f.id).length}));
const COLOR=Object.fromEntries(FAMILIES.map(f=>[f.id,f]));
const MOTIF=[
 {id:'words',t:1.3,label:{en:'It reveals the first words',zh:'显出第一句话'}},
 {id:'sketch',t:5.2,label:{en:'It lands on the team’s sketch',zh:'落到团队的草图上'}},
 {id:'agents',t:9.2,label:{en:'It splits into the agents’ frames',zh:'分成 agent 的工作框'}},
 {id:'carton',t:34,label:{en:'It extrudes into a real box',zh:'挤出成一个真盒子'}},
 {id:'canvas',t:43.2,label:{en:'It selects the whole canvas',zh:'框住整张画布'}},
 {id:'mark',t:44,label:{en:'It becomes the mark',zh:'收拢成标志'}},
];
const FRAMES=[1916,1921,1926,1931,1936,1941,1946,1951];
const REFERENCES=[
 ['Notion 3.0',{en:'three shot scales, and no shot ever holds still',zh:'三种景别切换，镜头从不静止'}],
 ['Linear Agent',{en:'the whole app on one steep 3D plane, at 60 fps',zh:'整个应用放在一块大倾角的 3D 平面上，60 帧'}],
 ['Moda',{en:'agent cursors with name tags, working beside people',zh:'带名字标签的 agent 光标，和人一起干活'}],
 ['Framer 3.0',{en:'one glossy 3D button beside crisp 2D interface',zh:'一个有光泽的 3D 按钮，配清晰的 2D 界面'}],
 ['Higgsfield Katana',{en:'long interface takes driven by a virtual camera',zh:'由虚拟摄影机带动的长镜头界面'}],
];
const NOTES=[
 {note:{en:'Cuts braked. One shot slowed to 0.4 px a frame going into a cut, and the next opened at 15.',zh:'剪辑点会“刹车”：一个镜头进剪辑点前慢到每帧 0.4 像素，下一个镜头却以 15 像素起步。'},fix:{en:'The next camera now starts moving before the cut, so every cut lands on motion.',zh:'下一个镜头的摄影机在剪辑点之前就开始运动，每一刀都切在动作上。'}},
 {note:{en:'“Hako builds what’s inside.” sat in 3D space and leaned 8° under the tilted camera, so it read as italic.',zh:'“Hako builds what’s inside.” 放在 3D 空间里，被倾斜的镜头拉歪了 8°，看起来像斜体。'},fix:{en:'Headlines inside the scene turn to face the lens.',zh:'场景里的标题始终转向镜头。'}},
 {note:{en:'The ✓ sounds played 200 ms before the ticks appeared.',zh:'打勾的声音比画面上的勾早了 200 毫秒。'},fix:{en:'Every sound now sits on the frame of the action it belongs to.',zh:'每个声音都对齐到它所属动作的那一帧。'}},
];

const waveD=(()=>{const top=[],bottom=[];EDIT.wave.forEach((v,i)=>{const x=((i+.5)/20).toFixed(3),y=Math.max(v*.92,.02).toFixed(3);top.push(x+','+(-y));bottom.unshift(x+','+y);});return 'M'+top.join('L')+'L'+bottom.join('L')+'Z';})();
const motionMax=Math.max(...EDIT.motion);
const motionD='M'+EDIT.motion.map((v,i)=>(i+.5).toFixed(1)+','+(100-v/motionMax*92).toFixed(2)).join('L');

export default function HakoFilm({lang,reduced,onNavigate}){
 const en=lang==='en',root=useRef(null),video=useRef(null),lanes=useRef(null),scroller=useRef(null),strip=useRef(null),head=useRef(null),tc=useRef(null);
 const beatRef=useRef(0),dragging=useRef(false),paintRef=useRef(null);
 const [beat,setBeat]=useState(0),[failed,setFailed]=useState(false);
 const {setSuppressed}=useMusic();
 const syncMusic=()=>{const v=video.current;setSuppressed(Boolean(v&&!v.paused&&!v.ended&&!v.error));};
 const go=to=>event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();onNavigate(to);
 };
 // the playhead, timecode and inspector follow the video; while it plays they repaint every frame
 useEffect(()=>{
  const v=video.current;let raf=0;
  const paint=()=>{
   const t=Math.min(v.currentTime||0,DUR);
   head.current.style.left=pos(t);tc.current.textContent=clock(t);
   lanes.current.setAttribute('aria-valuenow',t.toFixed(1));lanes.current.setAttribute('aria-valuetext',clock(t));
   const i=Math.max(0,BEATS.findIndex(b=>t<b.to));
   const index=t>=DUR?BEATS.length-1:i;
   if(index!==beatRef.current){beatRef.current=index;setBeat(index);}
   const s=scroller.current;
   if(!v.paused&&s.scrollWidth>s.clientWidth){const r=lanes.current,x=r.offsetLeft+t/DUR*r.offsetWidth;if(x<s.scrollLeft+r.offsetLeft||x>s.scrollLeft+s.clientWidth-32)s.scrollLeft=x-s.clientWidth/2;}
  };
  const loop=()=>{paint();if(!v.paused&&!v.ended)raf=requestAnimationFrame(loop);};
  const start=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);};
  paintRef.current=paint;paint();
  v.addEventListener('play',start);v.addEventListener('seeked',paint);v.addEventListener('timeupdate',paint);
  const pauseWhenHidden=()=>{if(document.hidden)v.pause();};
  document.addEventListener('visibilitychange',pauseWhenHidden);
  return()=>{cancelAnimationFrame(raf);v.removeEventListener('play',start);v.removeEventListener('seeked',paint);v.removeEventListener('timeupdate',paint);document.removeEventListener('visibilitychange',pauseWhenHidden);setSuppressed(false);};
 },[setSuppressed]);
 // V1: each shot tiles its own frames at their true 16:9, like an editor's filmstrip
 useEffect(()=>{
  const canvas=strip.current,sprite=new Image();let ready=false;
  const draw=()=>{
   if(!ready)return;
   const ratio=devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
   canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);
   const g=canvas.getContext('2d');g.setTransform(ratio,0,0,ratio,0,0);g.clearRect(0,0,w,h);
   const tw=h*16/9;
   for(let s=0;s<SHOTS.length-1;s++){
    const x0=SHOTS[s]/DUR*w,x1=SHOTS[s+1]/DUR*w;
    g.save();g.beginPath();g.rect(x0+.5,0,Math.max(0,x1-x0-1),h);g.clip();
    for(let x=x0;x<x1;x+=tw){const i=Math.min(99,Math.floor((x/w*DUR+.26)/.5));g.drawImage(sprite,(i%10)*192,Math.floor(i/10)*108,192,108,x,0,tw,h);}
    g.restore();
   }
  };
  sprite.onload=()=>{ready=true;draw();};sprite.src=media+'/filmstrip.webp';
  const observer=new ResizeObserver(draw);observer.observe(canvas);
  return()=>{observer.disconnect();sprite.onload=null;};
 },[]);
 const seek=t=>{const v=video.current;v.currentTime=Math.max(0,Math.min(t,DUR-1/FPS));paintRef.current?.();};
 const seekAt=clientX=>{const r=lanes.current.getBoundingClientRect();seek((clientX-r.left)/r.width*DUR);};
 const keys=event=>{
  const v=video.current,step=event.shiftKey?1/FPS:1;
  const to={ArrowRight:v.currentTime+step,ArrowLeft:v.currentTime-step,Home:0,End:DUR}[event.key];
  if(to!==undefined){event.preventDefault();seek(to);}
  else if(event.key===' '){event.preventDefault();v.paused?v.play().catch(()=>{}):v.pause();}
 };
 const jump=t=>{seek(t);video.current.play().catch(()=>{});video.current.scrollIntoView({behavior:reduced?'auto':'smooth',block:'center'});};
 const current=BEATS[beat];
 return <article ref={root} className="brand-motion-page hk-page" data-nav-tone="light">
  <header className="brand-motion-heading">
   <div className="brand-motion-kicker"><a href="/other-project" onClick={go('/other-project')}>← Other Project</a><span>SAAS / LAUNCH FILM</span></div>
   <div className="brand-motion-title"><h1>Hako</h1><p>Draw a box. <i>Ship a product.</i></p></div>
   <div className="brand-motion-intro"><span>{en?'SAAS LAUNCH FILM':'SaaS 发布短片'}</span><p>{en?'A 50-second launch film for Hako, a SaaS product I invented along with its name, its brand and the dashboard it builds: draw a box around anything, and agents build it with your team until it ships. Every frame is rendered from code; there is no footage. Hako and Daybreak are fictional.':'为 Hako 做的 50 秒发布短片。Hako 是我虚构的 SaaS 产品，名字、品牌和片中被搭出来的仪表盘也都由我设计：在任何东西上画一个框，agent 就和你的团队一起把它做出来，直到上线。每一帧都由代码渲染，没有任何拍摄素材。Hako 和 Daybreak 都是虚构产品。'}</p></div>
  </header>

  <section className="brand-motion-films hk-cut" aria-labelledby="hk-cut">
   <div className="brand-motion-film">
    <header><span className="brand-motion-number">01 /</span><div><h2 id="hk-cut">{en?'The final cut, on its timeline':'成片，摊开在时间线上'}</h2><p>{en?'The film plays above its own edit: eleven shots, a 2:53 song cut down to four pieces, and 82 recorded sounds, all on a 100 BPM grid. Click or drag the timeline to jump; the strip under the picture says what each beat is doing.':'成片放在它自己的剪辑时间线上方：11 个镜头，一首 2 分 53 秒的歌剪成 4 段，82 个录音音效，全部对在 100 BPM 的节拍网格上。点击或拖动时间线可以跳转，画面下方会显示当前这一段在做什么。'}</p></div><span className="brand-motion-duration">00:50</span></header>
    <div className="hk-desk">
     <div className="hk-bar"><span className="hk-dots" aria-hidden="true"><i/><i/><i/></span><b>hako-a-sfx.mp4</b><span className="hk-bar-meta">1920 × 1080 · 60 FPS · {en?'TRACK A + FOLEY':'配乐 A + 音效'}</span><span ref={tc} className="hk-tc" aria-hidden="true">00:00:00:00</span></div>
     <video ref={video} controls playsInline preload="metadata" poster={media+'/poster.webp'} aria-label={en?'Hako — SaaS launch film':'Hako SaaS 发布短片'} onPlay={syncMusic} onPause={syncMusic} onEnded={syncMusic} onError={()=>{setFailed(true);syncMusic();}}>
      <source src={film} type="video/mp4"/>
      <a href={film}>{en?'Open video':'打开视频'}</a>
     </video>
     <div className="hk-inspector" aria-live="polite">
      <div><span>{en?'BEAT':'段落'} {String(beat+1).padStart(2,'0')} / {BEATS.length}</span><strong>{current.name}</strong></div>
      <p>{current.what[lang]}</p>
      <div><span>{en?'CAMERA':'镜头'}</span><p>{current.camera[lang]}</p></div>
     </div>
     <div ref={scroller} className="hk-timeline">
      <div className="hk-tl">
       <div className="hk-labels" aria-hidden="true"><span/><span>{en?'BEAT':'段落'}</span><span>{en?'TEXT':'字幕'}</span><span>V1</span><span>A1</span><span>A2</span></div>
       <div ref={lanes} className="hk-lanes" role="slider" tabIndex={0} aria-label={en?'Timeline: drag or use the arrow keys to move through the film':'时间线：拖动或用方向键在片中跳转'} aria-valuemin={0} aria-valuemax={DUR}
        onPointerDown={event=>{if(event.pointerType!=='mouse'||event.button!==0)return;event.currentTarget.setPointerCapture(event.pointerId);dragging.current=true;seekAt(event.clientX);}}
        onPointerMove={event=>{if(dragging.current)seekAt(event.clientX);}}
        onPointerUp={()=>{dragging.current=false;}} onPointerCancel={()=>{dragging.current=false;}}
        onClick={event=>seekAt(event.clientX)} onKeyDown={keys}>
        <svg className="hk-grid" viewBox={`0 0 ${DUR} 1`} preserveAspectRatio="none" aria-hidden="true">
         {EDIT.beats.map((b,i)=><line key={i} x1={b} x2={b} y1="0" y2="1"/>)}
         {EDIT.bars.map((b,i)=><line key={'b'+i} className="hk-bar-line" x1={b} x2={b} y1="0" y2="1"/>)}
        </svg>
        <div className="hk-ruler" aria-hidden="true">{Array.from({length:11},(_,i)=><span key={i} style={{left:pos(i*5)}}>{String(i*5).padStart(2,'0')}</span>)}</div>
        <div className="hk-lane hk-beats" aria-hidden="true">{BEATS.map((b,i)=>{const from=i?BEATS[i-1].to:0;return <span key={b.name} className={(i===beat?'is-on':'')+(b.to-from<1.2?' is-short':'')} style={span(from,b.to)}>{b.name}</span>;})}</div>
        <div className="hk-lane hk-text" aria-hidden="true">{HEADLINES.map(([a,b,text])=><span key={text} style={span(a,b)}>{text}</span>)}</div>
        <div className="hk-lane hk-v1" aria-hidden="true"><canvas ref={strip}/>{SHOTS.slice(0,-1).map((s,i)=><span key={s} className={SHOTS[i+1]-s<1.2?'is-short':undefined} style={span(s,SHOTS[i+1])}>{String(i+1).padStart(2,'0')}</span>)}</div>
        <div className="hk-lane hk-a1" aria-hidden="true">
         <svg viewBox={`0 -1 ${DUR} 2`} preserveAspectRatio="none"><path d={waveD}/></svg>
         {MUSIC.map(([a,b,s0,s1])=><span key={a} style={span(a,b)}>A · {mmss(s0)}–{mmss(s1)}</span>)}
        </div>
        <div className="hk-lane hk-a2" aria-hidden="true"><svg viewBox={`0 0 ${DUR} 1`} preserveAspectRatio="none">{EDIT.cues.map(([t,f],i)=><line key={i} x1={t} x2={t} y1={1-COLOR[f].h} y2="1" stroke={COLOR[f].color}/>)}</svg></div>
        <div ref={head} className="hk-head" aria-hidden="true"><i/></div>
       </div>
      </div>
     </div>
     <ul className="hk-legend">{FAMILIES.map(f=><li key={f.id}><i style={{background:f.color}}/>{f.label[lang]} <span>{f.count}</span></li>)}<li className="hk-legend-grid">{en?'Lines: beats and bars at 100 BPM':'竖线：100 BPM 的拍与小节'}</li></ul>
    </div>
    {failed&&<p className="brand-motion-error" role="alert">{en?'The video could not load. Try opening it directly below.':'视频暂时未能加载，请通过下方链接直接打开。'}</p>}
    <div className="brand-motion-film-note"><span>1920 × 1080 / 60 FPS / {en?'SOUND ON':'请开声音'}</span><a href={film} target="_blank" rel="noopener noreferrer">{en?'Open video':'单独打开视频'} ↗</a></div>
   </div>
  </section>

  <section className="hk-process" aria-labelledby="hk-process">
   <header className="hk-process-head"><h2 id="hk-process">{en?'How it was made':'制作过程'}</h2><span>06 / {en?'STEPS':'步骤'}</span></header>

   <div className="hk-step">
    <div className="hk-step-text"><span>01</span><h3>{en?'One sentence before any frame':'先写一句话，再做画面'}</h3>
     <p>{en?'The brief asked for a 40–50 s SaaS launch film: bold type, detailed interface, cursors and selection frames, depth in the camera, some 3D among the 2D, fast but smooth. Before designing anything, I wrote down what the film has to say and how it should feel.':'需求是一支 40–50 秒的 SaaS 发布短片：大字、细致的界面、光标和选框、有纵深的镜头、2D 里夹一点 3D，快但要顺。动手设计之前，我先写下这支片子要说什么、要给人什么感觉。'}</p></div>
    <div className="hk-step-media">
     <blockquote className="hk-quote"><p>“Anything you can draw a box around, Hako’s agents build, with your team, and ship.”</p><footer>{en?'Tone: bold and precise. The rush of speed, with full control.':'语气：大胆、精确。速度带来的爽感，同时一切尽在掌控。'}</footer></blockquote>
     <p className="hk-small">{en?'Five launch films, studied frame by frame for their grammar only. No footage, frames, music or copy were taken from them.':'逐帧拆解了五支发布片，只借鉴镜头语法，没有使用它们的任何画面、音乐或文案。'}</p>
     <ul className="hk-refs">{REFERENCES.map(([name,what])=><li key={name}><span>{name}</span><p>{what[lang]}</p></li>)}</ul>
    </div>
   </div>

   <div className="hk-step">
    <div className="hk-step-text"><span>02</span><h3>{en?'A product, a name and a mark':'产品、名字和标志'}</h3>
     <p>{en?'Hako (箱, box): draw a selection box around a sketch, a board or a chart, and agents build what is inside. The mark is that selection box, a square frame with four handles that also reads as 口. Persimmon belongs only to your own selection and ultraviolet only to agents, so in every frame the colour tells you who is acting.':'Hako（箱，盒子）：在草图、白板或图表上画一个选框，agent 就把框里的东西做出来。标志就是这个选框：一个带四个控制点的方框，也像一个“口”字。柿子橙只属于你自己的选择，群青紫只属于 agent，所以每一帧里，颜色都在说明是谁在动手。'}</p></div>
    <figure className="hk-step-media"><img src={media+'/brand-board.webp'} width="1920" height="1080" loading="lazy" decoding="async" alt={en?'Hako brand board: the mark, the wordmark, the palette, the typefaces and the motion tokens':'Hako 品牌板：标志、字标、配色、字体和动效参数'}/><figcaption>{en?'Brand board: Mona Sans, Inter, Geist Mono; six motion durations and three eases.':'品牌板：Mona Sans、Inter、Geist Mono；六档动效时长、三条缓动曲线。'}</figcaption></figure>
   </div>

   <div className="hk-step hk-step-wide">
    <div className="hk-step-text"><span>03</span><h3>{en?'One motif, six jobs':'一个母题，六次变身'}</h3>
     <p>{en?'The selection box carries the whole film, so there is never a cut to a new idea, only the same box doing its next job. Click a frame to see it in the film.':'整支片子由选框串起来：从不切到一个新的概念，只是同一个框去做下一件事。点击画面可以跳到片中对应的位置。'}</p></div>
    <ol className="hk-motif">{MOTIF.map((m,i)=><li key={m.id}><button type="button" onClick={()=>jump(m.t)} aria-label={(en?'Play from ':'从这里播放：')+sec(m.t)+' · '+m.label[lang]}>
     <img src={media+'/motif-'+m.id+'.webp'} width="1600" height="900" loading="lazy" decoding="async" alt=""/>
     <span><b>0{i+1}</b>{m.label[lang]}<em>▶ {sec(m.t)}</em></span>
    </button></li>)}</ol>
   </div>

   <div className="hk-step hk-step-wide">
    <div className="hk-step-text"><span>04</span><h3>{en?'Smoothness you can measure':'顺滑，是量出来的'}</h3>
     <p>{en?'Inside a shot the camera never stops: every move is a spline that keeps its speed through each key, and cuts land on motion, on exact frames and, where they can, on the beat. Each pass was checked by measurement, not by eye. Below is how much the picture changes from frame to frame across the film (the marks are the cuts), then the Ship click, every fifth frame.':'镜头内的摄影机从不停下：每段运动都是一条在关键帧处也不减速的样条曲线；剪辑点落在动作上、落在整帧上，能对拍的都对在拍子上。每一版都靠测量检查，而不是凭肉眼。下图是整支片子逐帧的画面变化量（竖线是剪辑点），再往下是点击 Ship 的那一下，每隔 5 帧取一帧。'}</p>
     <ul className="hk-specs"><li>60 FPS</li><li>{en?'180° motion blur, 8 samples':'180° 运动模糊，8 次采样'}</li><li>{en?'≤ 20 px of screen travel a frame':'每帧画面位移 ≤ 20 像素'}</li><li>{en?'Cuts on exact frames':'剪辑点对齐到整帧'}</li></ul></div>
    <figure className="hk-chart">
     <svg viewBox="0 0 600 100" preserveAspectRatio="none" role="img" aria-label={en?'Frame-to-frame picture change across the 50-second film':'50 秒成片逐帧的画面变化量'}>
      {SHOTS.slice(1,-1).map(s=><line key={s} className="hk-chart-cut" x1={s*12} x2={s*12} y1="0" y2="100"/>)}
      <path d={motionD}/>
     </svg>
     <div className="hk-chart-axis" aria-hidden="true">{Array.from({length:6},(_,i)=><span key={i} style={{left:i*20+'%'}}>{i*10}s</span>)}</div>
     <figcaption>{en?'Peaks: the three agents bursting out of Build (8 s) and the canvas collapsing into the mark (43 s).':'两个高峰：三个 agent 从 Build 飞出（8 秒），以及整张画布收拢成标志（43 秒）。'}</figcaption>
    </figure>
    <ol className="hk-frames">{FRAMES.map(f=><li key={f}><img src={media+'/frame-'+f+'.webp'} width="640" height="360" loading="lazy" decoding="async" alt={(en?'Frame ':'第 ')+f+(en?' of the Ship click':' 帧：点击 Ship')}/><span>F {f}</span></li>)}</ol>
   </div>

   <div className="hk-step hk-step-wide">
    <div className="hk-step-text"><span>05</span><h3>{en?'Music first, then every click':'先剪音乐，再配每一下点击'}</h3>
     <p>{en?'The music came from written prompts for an AI music generator: two directions, and this one was chosen. Its 2:53 were cut down to 50 seconds in four pieces joined on the beat, then the picture was gently time-warped so its key moments land on the hits. On top sit 82 recorded sounds: a real mouse, a mechanical keyboard, marimba notes tuned to the song’s key, book knocks for the box, and mouth pops only where something springs out. No synthesized blips.':'音乐来自写给 AI 音乐生成器的提示词：做了两个方向，选了这一版。原曲 2 分 53 秒，在拍子上剪成 4 段、拼成 50 秒；再把画面做轻微的变速，让关键动作落在重拍上。最上面一层是 82 个录音音效：真实的鼠标、机械键盘、按原曲调性定音的马林巴、给盒子用的书本敲击声，只在东西弹出来的地方才用嘴巴的“啵”声。没有一个合成器音效。'}</p></div>
    <figure className="hk-music">
     <div className="hk-music-row"><span>{en?'SONG':'原曲'} · 2:53</span><div className="hk-music-bar">{MUSIC.map(([,,s0,s1])=><i key={s0} style={{left:s0/SONG*100+'%',width:(s1-s0)/SONG*100+'%'}}/>)}</div></div>
     <svg className="hk-music-links" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">{MUSIC.map(([a,b,s0,s1])=><path key={a} d={`M${s0/SONG*1000},0L${s1/SONG*1000},0L${b/DUR*1000},60L${a/DUR*1000},60Z`}/>)}</svg>
     <div className="hk-music-row"><span>{en?'FILM':'成片'} · 0:50</span><div className="hk-music-bar hk-music-out">{MUSIC.map(([a,b,s0,s1])=><i key={a} style={span(a,b)}><b>{mmss(s0)}–{mmss(s1)}</b></i>)}</div></div>
     <figcaption>{en?'Four pieces of the song, joined on the beat at 22.0, 29.2 and 36.4 s.':'原曲的 4 个片段，在 22.0、29.2、36.4 秒处按拍子拼接。'}</figcaption>
    </figure>
    <ul className="hk-foley">{FAMILIES.map(f=><li key={f.id}><span>{f.label[lang]}</span><i style={{width:f.count/30*100+'%',background:f.onPaper||f.color}}/><b>{f.count}</b></li>)}</ul>
   </div>

   <div className="hk-step hk-step-wide">
    <div className="hk-step-text"><span>06</span><h3>{en?'Three rounds of review':'三轮审片'}</h3>
     <p>{en?'Each version went to a separate review pass that measured instead of guessing: screen speed on both sides of each cut, the lean of each headline, the gap between a sound and its frame. A few of the notes, and what changed.':'每一版都交给单独的一轮审片，靠测量而不是猜：每个剪辑点前后的画面速度、每行标题的倾斜角度、每个声音和画面之间差了多少。下面是其中几条意见，以及怎么改的。'}</p></div>
    <ol className="hk-notes">{NOTES.map((n,i)=><li key={i}><span>{en?'NOTE':'意见'} 0{i+1}</span><p>{n.note[lang]}</p><span>{en?'FIX':'修改'}</span><p>{n.fix[lang]}</p></li>)}</ol>
   </div>
  </section>

  <footer className="brand-motion-footer"><span>JAY LIN / HAKO</span><p>Draw a box. Ship a product.</p></footer>
 </article>;
}
