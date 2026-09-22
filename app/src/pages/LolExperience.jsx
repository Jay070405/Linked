import {useRef,useState} from 'react';
import {AnimatePresence,motion,useMotionValue,useSpring,useTransform,useMotionTemplate} from 'motion/react';
import {ArrowUpRight,ArrowDown} from 'lucide-react';
import GlassSurface from '../components/GlassSurface';
import ExpressiveTitle from '../components/ExpressiveTitle';
import {ASSET,SOURCE_URL,text,introPreviews} from './lol-content';

// Reuses the portfolio's React Bits refraction surface. This is a web material,
// with a CSS frosted fallback, rather than a native Apple platform material.
export function LolGlass({children,className='',height='auto',width='100%',radius=28}) {
  return <GlassSurface className={'lol-glass '+className} width={width} height={height}
    borderRadius={radius} borderWidth={.08} brightness={70} opacity={.88}
    blur={9} displace={.4} backgroundOpacity={.12} saturation={1}
    distortionScale={-34} redOffset={0} greenOffset={0} blueOffset={0}>
    {children}
  </GlassSurface>;
}

export function LolTitle({children,reduced=false,className=''}) {
  return <ExpressiveTitle className={'lol-expressive '+className} reduced={reduced}>{children}</ExpressiveTitle>;
}

export function LolOpening({lang,reduced,onRead}) {
  const [preview,setPreview]=useState(0);
  const box=useRef(null);
  const px=useMotionValue(0),py=useMotionValue(0);
  const x=useSpring(px,{stiffness:115,damping:22}),y=useSpring(py,{stiffness:115,damping:22});
  const rotateX=useTransform(y,[-.5,.5],[4,-4]),rotateY=useTransform(x,[-.5,.5],[-6,6]);
  const cardX=useTransform(x,[-.5,.5],[-12,12]),cardY=useTransform(y,[-.5,.5],[-9,9]);
  const lightX=useTransform(x,[-.5,.5],[0,100]),lightY=useTransform(y,[-.5,.5],[0,100]);
  const light=useMotionTemplate`radial-gradient(ellipse at ${lightX}% ${lightY}%,rgba(255,255,255,.24),transparent 58%)`;
  const move=e=>{
    if(reduced||e.pointerType!=='mouse')return;
    const b=box.current||e.currentTarget.getBoundingClientRect();
    px.set(Math.max(-.5,Math.min(.5,(e.clientX-b.left)/b.width-.5)));
    py.set(Math.max(-.5,Math.min(.5,(e.clientY-b.top)/b.height-.5)));
  };
  const reset=()=>{px.set(0);py.set(0);box.current=null;};
  const item=introPreviews[preview],en=lang==='en';
  return <header className="lol-opening lol-opening-v2 lol-width">
    <div className="lol-opening-copy">
      <p className="lol-intro-meta">{en?'SYSTEMS DESIGN / PERSONAL STUDY':'系统策划 · 个人研究'}</p>
      <h1 aria-label={en?'League of Legends: Live operations':'英雄联盟：长线运营'}>
        <span className="lol-title-game"><LolTitle reduced={reduced}>{en?'League of Legends':'英雄联盟'}</LolTitle></span>
        <span className="lol-title-main"><LolTitle reduced={reduced}>{en?<>Live<br/>operations.</>:'长线运营'}</LolTitle></span>
      </h1>
      <p className="lol-intro-description">{en?'Reward targets, team comparisons and a two-day Fearless Cup. Three proposals built around the systems players already use.':'目标奖励还来不来得及拿，匹配分数该怎么展示，普通玩家怎么参加无畏比赛。下面是对应的界面与规则改动。'}</p>
      <div className="lol-opening-links">
        <LolGlass className="lol-read-glass" width="auto" height={54} radius={28}>
          <button type="button" onClick={()=>onRead(preview)}><span>{en?'Read the proposal':'阅读方案'}</span><ArrowDown size={18}/></button>
        </LolGlass>
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">{en?'Full document':'完整文档'}<ArrowUpRight size={15}/></a>
      </div>
    </div>
    <div className="lol-preview" onPointerEnter={e=>{box.current=e.currentTarget.getBoundingClientRect();}} onPointerMove={move} onPointerLeave={reset}>
      <motion.div className="lol-preview-object" style={reduced?undefined:{rotateX,rotateY}}>
        <div className="lol-preview-frame">
          <div className="lol-preview-media">
            <AnimatePresence initial={false}>
              <motion.img key={item.id} src={ASSET+item.image} width="1280" height="720"
                alt={text(item.alt,lang)} initial={{opacity:0,scale:reduced?1:1.04}}
                animate={{opacity:1,scale:1}} exit={{opacity:0}}
                transition={{duration:reduced?0:.32,ease:[.2,.8,.2,1]}} fetchPriority={preview===0?'high':'auto'}/>
            </AnimatePresence>
            <motion.div className="lol-preview-reflection" style={{background:light}} aria-hidden="true"/>
          </div>
        </div>
        <motion.div className="lol-preview-note" style={reduced?undefined:{x:cardX,y:cardY}} aria-live="polite">
          <LolGlass radius={23}>
            <span className="lol-preview-note-label">{text(item.label,lang)}</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={item.id} initial={{opacity:0,y:reduced?0:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:reduced?0:-6}} transition={{duration:reduced?0:.18}}>
                <h2>{text(item.question,lang)}</h2>
                <div className="lol-preview-value"><b>{item.value}</b><span>{text(item.unit,lang)}</span></div>
                <p>{text(item.detail,lang)}</p>
              </motion.div>
            </AnimatePresence>
          </LolGlass>
        </motion.div>
      </motion.div>
      <div className="lol-preview-choices" role="group" aria-label={en?'Preview a proposal':'选择方案预览'}>
        {introPreviews.map((entry,index)=><button key={entry.id} type="button" aria-pressed={preview===index}
          onPointerEnter={e=>{if(e.pointerType==='mouse')setPreview(index);}}
          onFocus={()=>setPreview(index)} onClick={()=>setPreview(index)}>
          <span className="lol-preview-thumb"><img src={ASSET+entry.image} width="128" height="72" alt="" loading="lazy"/></span>
          <span>{text(entry.label,lang)}</span><ArrowUpRight size={15}/>
        </button>)}
      </div>
    </div>
  </header>;
}
