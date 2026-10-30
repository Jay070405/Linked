import {lazy,Suspense,useEffect,useRef,useState} from 'react';
import {useMusic} from '../components/BackgroundMusic';
import EDIT from './hako-edit.json';
import {nextAfter} from './product-films-data';
import {Hero,SectionHead,Statement,CountUp,Reveal,Decisions,Flipbook,NextProject} from './story/Story';
import './brand-motion.css';
import './hako-film.css';
import './film-case.css';

const HakoDemo=lazy(()=>import('./demos/HakoDemo'));

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
// the opening, frame by frame (Flipbook), and four calls that shaped the film (from the project's review notes and the
// user's verdicts on the music and the interface sounds)
const OPENING=[
 {t:.25,label:{en:'The B key, the box tool, goes down',zh:'按下 B 键，也就是框选工具'}},
 {t:.6,label:{en:'The drag starts a box',zh:'拖动，框开始出现'}},
 {t:1.05,label:{en:'“Draw a box.” appears inside it',zh:'“Draw a box.” 在框里显现'}},
 {t:1.45,label:{en:'The drag reaches its far corner',zh:'拖到对角'}},
 {t:1.75,label:{en:'Release: the handles pop',zh:'松手，控制点弹出'}},
 {t:2,label:{en:'Smart guides settle the box',zh:'智能参考线把框对齐'}},
];
const DECISIONS=[
 {title:{en:'Music from prompts, not from code',zh:'音乐来自提示词，不是代码'},verdict:{en:'A score modelled in code can’t reach a produced track.',zh:'用代码模拟出来的配乐，达不到制作好的成品音乐。'},
  tried:{en:'A score I built in code from modelled piano, marimba and bass. It sounded messy.',zh:'我先用代码模拟钢琴、马林巴和贝斯做了一版配乐，听起来很乱。'},
  chose:{en:'Written prompts for an AI music generator, two directions; one was chosen, cut on the beat, and the picture time-warped onto its hits.',zh:'写提示词交给 AI 音乐生成器，做了两个方向；选中一版，在拍子上剪，再让画面变速对上它的重拍。'},img:{src:'/assets/other-project/hako/motif-carton.webp',kind:'wide',position:'50% 50%'}},
 {title:{en:'Recorded sounds, not interface blips',zh:'录音音效，不用界面提示音'},verdict:{en:'Pure tones read as electronic; the film needed touch.',zh:'纯音听起来很电子，这支片子需要手感。'},
  tried:{en:'A pack of interface sounds: drops, glass, toggles, ticks. Measured, they were pure sine tones.',zh:'一套界面音效包：drop、glass、toggle、tick。测出来全是纯正弦波。'},
  chose:{en:'82 recordings: a real mouse, a mechanical keyboard, marimba tuned to the song’s key, book knocks for the box, mouth pops only where something springs out.',zh:'82 个录音：真实的鼠标、机械键盘、按歌曲调性定音的马林巴、给盒子用的书本敲击声，只在东西弹出来的地方才用嘴巴的“啵”声。'},img:{src:'/assets/other-project/hako/frame-1926.webp',kind:'wide',position:'50% 50%'}},
 {title:{en:'Headlines face the lens',zh:'标题始终朝向镜头'},verdict:{en:'Type that shears reads as a different font.',zh:'被拉歪的字，看起来就像换了一种字体。'},
  tried:{en:'“Hako builds what’s inside.” placed in 3D space; under the tilted camera its H leaned 8° and read as italic.',zh:'“Hako builds what’s inside.” 放在 3D 空间里，被倾斜的镜头一拉，H 歪了 8°，看起来像斜体。'},
  chose:{en:'Every headline in the scene is billboarded: it moves with the world but always faces the camera.',zh:'场景里的每行标题都做成始终朝向镜头：跟着场景一起动，但永远正对摄影机。'},img:{src:'/assets/other-project/hako/decision-type.webp',kind:'wide',position:'30% 50%'}},
 {title:{en:'A camera that never stops',zh:'镜头从不停下'},verdict:{en:'A stop in the middle of a shot reads as a hitch.',zh:'镜头中途一停，看起来就是卡了一下。'},
  tried:{en:'Camera keys where every axis turned at once, and shots that eased to rest before a cut.',zh:'所有轴在同一个关键帧上一起转向，镜头在剪辑点前减速停住。'},
  chose:{en:'A smooth spline that never reverses between keys, and cut-ins that start moving before the cut, so every cut lands on motion.',zh:'一条在关键帧之间不会折返的平滑样条曲线；切入的镜头在剪辑点之前就开始运动，每一刀都切在动作上。'},img:{src:'/assets/other-project/hako/decision-camera.webp',kind:'wide',position:'50% 50%'}},
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
 const en=lang==='en',root=useRef(null),demo=useRef(null),video=useRef(null),lanes=useRef(null),scroller=useRef(null),strip=useRef(null),head=useRef(null),tc=useRef(null);
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
 const behavior=reduced?'auto':'smooth';
 const flipFrames=Array.from({length:24},(_,i)=>`${media}/flip-${String(i+1).padStart(2,'0')}.webp`);
 return <article ref={root} className={'st-page hk-page'+(reduced?' st-still':'')} data-nav-tone="dark" style={{'--accent':'#ff5a1f'}}>
  <Hero reduced={reduced} video={film} poster={media+'/poster.webp'} title="Hako" tagline={['Draw a box.','Ship a product.']}
   back={<a href="/other-project" onClick={go('/other-project')}>← Other Project</a>} kicker={en?'SAAS CONCEPT / LAUNCH FILM':'SaaS 概念 / 发布短片'}
   meta={[[en?'FILM':'片长','50 s · 60 fps'],[en?'SOUND':'声音',en?'Track A + 82 recorded sounds':'配乐 A + 82 个录音音效'],[en?'MADE':'制作',en?'Product, brand, film':'产品、品牌、短片'],[en?'STATUS':'状态',en?'Fictional product':'虚构产品']]}
   actions={<>
    <button type="button" className="st-btn is-primary" onClick={()=>jump(0)}>▶ {en?'Watch with sound':'开声音看片'}</button>
    <button type="button" className="st-btn" onClick={()=>demo.current.scrollIntoView({behavior,block:'start'})}>{en?'Draw a box':'画一个框'} ↓</button>
   </>}/>

  <div className="st-wrap">
   <section className="st-section" aria-labelledby="hk-idea">
    <Reveal as="span" className="st-index st-lead-index" id="hk-idea">01 / {en?'THE IDEA':'想法'}</Reveal>
    <Statement reduced={reduced} text={en?'Most tools ask you to describe what you want. Hako lets you point at it: draw a box around a sketch, a board or a chart, and agents build what’s inside, with your team, until it ships.':'大多数工具要你把想要的东西描述出来。Hako 让你直接指给它看：在草图、白板或图表上画一个框，agent 就和你的团队一起把框里的东西做出来，直到上线。'}/>
    <div className="st-facts">
     <Reveal className="st-fact"><CountUp to={1} reduced={reduced}/><p>{en?'gesture to learn: the selection box is the product, the logo and the hero of the film':'个手势就够了：选框既是产品本身，也是标志，也是片子的主角'}</p></Reveal>
     <Reveal className="st-fact" delay={90}><CountUp to={50} suffix=" s" reduced={reduced}/><p>{en?'launch film, every frame rendered from code, no footage':'的发布短片，每一帧都由代码渲染，没有拍摄素材'}</p></Reveal>
     <Reveal className="st-fact" delay={180}><CountUp to={82} reduced={reduced}/><p>{en?'recorded sounds, each placed on the frame of its action':'个录音音效，每一个都对在它所属动作的那一帧'}</p></Reveal>
    </div>
   </section>

   <section ref={demo} className="st-section" aria-labelledby="hk-try">
    <SectionHead index={`02 / ${en?'TRY IT':'试一试'}`} title={<span id="hk-try">{en?'Draw a box':'画一个框'}</span>} lead={en?'Hako has one gesture. Drag a box over any part of the team’s sketch: an agent takes each region, thinks, and scans it into the real dashboard. Persimmon is your selection, ultraviolet is the agents’, exactly as in the film. Ship when it’s ready.':'Hako 只有一个手势。在团队的草图上随便拖出一个框：每块区域由一个 agent 接手，想一想，再一道扫描把它变成真正的仪表盘。柿子橙是你的选框，群青紫是 agent 的，和片子里一模一样。做好了就点上线。'}/>
    <Reveal className="st-demo"><Suspense fallback={<div className="st-demo-loading st-mono">{en?'Loading the demo…':'正在加载演示…'}</div>}><HakoDemo lang={lang} reduced={reduced}/></Suspense></Reveal>
   </section>

   <section className="st-section" aria-labelledby="hk-brand">
    <SectionHead index={`03 / ${en?'BRAND':'品牌'}`} title={<span id="hk-brand">{en?'A product, a name and a mark':'产品、名字和标志'}</span>} lead={en?'Hako (箱, box). The mark is the selection box itself, a square frame with four handles that also reads as 口. Persimmon belongs only to your own selection and ultraviolet only to agents, so in every frame the colour tells you who is acting. The product being built keeps its own palette.':'Hako（箱，盒子）。标志就是选框本身：一个带四个控制点的方框，也像一个“口”字。柿子橙只属于你自己的选择，群青紫只属于 agent，所以每一帧里，颜色都在说明是谁在动手。被搭出来的产品保留它自己的配色。'}/>
    <Reveal as="figure" className="st-board"><img src={media+'/brand-board.webp'} width="1920" height="1080" loading="lazy" decoding="async" alt={en?'Hako brand board: the mark, the wordmark, the palette, the typefaces and the motion tokens':'Hako 品牌板：标志、字标、配色、字体和动效参数'}/></Reveal>
   </section>

   <section className="st-section" aria-labelledby="hk-why">
    <SectionHead index={`04 / ${en?'DECISIONS':'决策'}`} title={<span id="hk-why">{en?'What changed, and why':'改了什么，为什么'}</span>} lead={en?'Four calls that shaped the film. Each card shows what it ended up as; flip it to see what came first.':'四个影响全片的决定。每张卡片先给最后的样子，切换一下能看到最初的版本。'}/>
    <Decisions items={DECISIONS} lang={lang} accent="#ff5a1f"/>
   </section>

   <section className="st-section" aria-labelledby="hk-film">
    <SectionHead index={`05 / ${en?'THE FILM':'短片'}`} title={<span id="hk-film">{en?'One motif, six jobs':'一个母题，六次变身'}</span>} lead={en?'The selection box carries the whole film, so there is never a cut to a new idea, only the same box doing its next job. Scroll through the opening frame by frame, then play any moment.':'整支片子由选框串起来：从不切到一个新的概念，只是同一个框去做下一件事。先逐帧滚过开场，再从任意时刻播放。'}/>
    <Flipbook frames={flipFrames} steps={OPENING} duration={[.2,2.1]} reduced={reduced} lang={lang} onPlay={jump}/>
    <ol className="hk-motif st-motif">{MOTIF.map((m,i)=><Reveal as="li" key={m.id} delay={i*60}><button type="button" onClick={()=>jump(m.t)} aria-label={(en?'Play from ':'从这里播放：')+sec(m.t)+' · '+m.label[lang]}>
     <img src={media+'/motif-'+m.id+'.webp'} width="1600" height="900" loading="lazy" decoding="async" alt=""/>
     <span><b>0{i+1}</b>{m.label[lang]}<em>▶ {sec(m.t)}</em></span>
    </button></Reveal>)}</ol>
   </section>

   <section className="st-section" aria-labelledby="hk-cut">
    <SectionHead index={`06 / ${en?'THE EDIT':'剪辑台'}`} title={<span id="hk-cut">{en?'The final cut, on its timeline':'成片，摊开在时间线上'}</span>} lead={en?'Eleven shots, a 2:53 song cut down to four pieces, and 82 recorded sounds, all on a 100 BPM grid. Click or drag the timeline to jump; the strip under the picture says what each beat is doing.':'11 个镜头，一首 2 分 53 秒的歌剪成 4 段，82 个录音音效，全部对在 100 BPM 的节拍网格上。点击或拖动时间线可以跳转，画面下方会显示当前这一段在做什么。'}/>
    <Reveal>
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
    </Reveal>
    {failed&&<p className="brand-motion-error" role="alert">{en?'The video could not load. Try opening it directly.':'视频暂时未能加载，请直接打开。'} <a href={film}>{en?'Open video':'打开视频'} ↗</a></p>}
   </section>

   <section className="st-section" aria-labelledby="hk-craft">
    <SectionHead index={`07 / ${en?'CRAFT':'技术'}`} title={<span id="hk-craft">{en?'Music first, then every click':'先剪音乐，再配每一下点击'}</span>} lead={en?'The music came from written prompts for an AI music generator: two directions, and this one was chosen. Its 2:53 were cut to 50 seconds in four pieces joined on the beat, then the picture was gently time-warped so its key moments land on the hits. Inside a shot the camera never stops, and every cut lands on motion, on an exact frame.':'音乐来自写给 AI 音乐生成器的提示词：做了两个方向，选了这一版。原曲 2 分 53 秒，在拍子上剪成 4 段、拼成 50 秒，再把画面做轻微变速，让关键动作落在重拍上。镜头内的摄影机从不停下，每个剪辑点都落在动作上、落在整帧上。'}/>
    <Reveal as="figure" className="hk-music">
     <div className="hk-music-row"><span>{en?'SONG':'原曲'} · 2:53</span><div className="hk-music-bar">{MUSIC.map(([,,s0,s1])=><i key={s0} style={{left:s0/SONG*100+'%',width:(s1-s0)/SONG*100+'%'}}/>)}</div></div>
     <svg className="hk-music-links" viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true">{MUSIC.map(([a,b,s0,s1])=><path key={a} d={`M${s0/SONG*1000},0L${s1/SONG*1000},0L${b/DUR*1000},60L${a/DUR*1000},60Z`}/>)}</svg>
     <div className="hk-music-row"><span>{en?'FILM':'成片'} · 0:50</span><div className="hk-music-bar hk-music-out">{MUSIC.map(([a,b,s0,s1])=><i key={a} style={span(a,b)}><b>{mmss(s0)}–{mmss(s1)}</b></i>)}</div></div>
     <figcaption>{en?'Four pieces of the song, joined on the beat at 22.0, 29.2 and 36.4 s.':'原曲的 4 个片段，在 22.0、29.2、36.4 秒处按拍子拼接。'}</figcaption>
    </Reveal>
    <ul className="st-stats st-stats-gap">{FAMILIES.map((f,i)=><Reveal as="li" key={f.id} delay={i*60}><b style={{color:f.color}}>{f.count}</b><span>{f.label[lang]}</span></Reveal>)}</ul>
    <Reveal as="figure" className="st-chart">
     <svg viewBox="0 0 600 100" preserveAspectRatio="none" role="img" aria-label={en?'Frame-to-frame picture change across the 50-second film':'50 秒成片逐帧的画面变化量'}>
      {SHOTS.slice(1,-1).map(s=><line key={s} x1={s*12} x2={s*12} y1="0" y2="100"/>)}
      <path d={motionD}/>
     </svg>
     <figcaption>{en?'Picture change from frame to frame. Peaks: the agents bursting out of Build (8 s) and the canvas collapsing into the mark (43 s). Dashed: the cuts.':'逐帧画面变化。两个高峰：agent 从 Build 飞出（8 秒），以及画布收拢成标志（43 秒）。虚线是剪辑点。'}</figcaption>
    </Reveal>
    <ol className="st-notes">{NOTES.map((n,i)=><Reveal as="li" key={i} delay={i*80}><span>{en?'REVIEW NOTE':'评审意见'} 0{i+1}</span><p>{n.note[lang]}</p><span>{en?'WHAT CHANGED':'怎么改的'}</span><p>{n.fix[lang]}</p></Reveal>)}</ol>
   </section>

   <NextProject item={nextAfter('hako')} lang={lang} onNavigate={onNavigate}/>
   <footer className="st-footer"><span>JAY LIN / HAKO</span><p>Draw a box. Ship a product.</p></footer>
  </div>
 </article>;
}
