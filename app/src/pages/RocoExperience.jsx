import {useEffect,useId,useRef,useState} from 'react';
import {AnimatePresence,motion,useMotionValue,useSpring,useTransform,useMotionTemplate} from 'motion/react';
import {ArrowDown,ArrowRight,ArrowUpRight} from 'lucide-react';
import GlassSurface from '../components/GlassSurface';
import ExpressiveTitle from '../components/ExpressiveTitle';
import {text} from './roco-model-core';
import {readingEntrances,routeNotes} from './roco-experience-content';

export function RocoGlass({children,className='',radius=28,width='100%'}) {
 return <GlassSurface className={'rco-glass '+className} width={width} height="auto" borderRadius={radius}
  borderWidth={.08} brightness={70} opacity={.88} blur={9} displace={.4} backgroundOpacity={.12}
  saturation={1} distortionScale={-34} redOffset={0} greenOffset={0} blueOffset={0}>{children}</GlassSurface>;
}

export function RocoOpening({lang,reduced,onRead,onNavigate}) {
 const en=lang==='en',[preview,setPreview]=useState(1),box=useRef(null);
 const px=useMotionValue(0),py=useMotionValue(0);
 const x=useSpring(px,{stiffness:110,damping:23}),y=useSpring(py,{stiffness:110,damping:23});
 const rx=useTransform(y,[-.5,.5],[4,-4]),ry=useTransform(x,[-.5,.5],[-5,5]);
 const cardX=useTransform(x,[-.5,.5],[-10,10]),cardY=useTransform(y,[-.5,.5],[-8,8]);
 const lx=useTransform(x,[-.5,.5],[0,100]),ly=useTransform(y,[-.5,.5],[0,100]);
 const light=useMotionTemplate`radial-gradient(ellipse at ${lx}% ${ly}%,#ffffff36,transparent 65%)`;
 const entry=readingEntrances[preview];
 const move=e=>{if(reduced||e.pointerType!=='mouse')return;const b=box.current||e.currentTarget.getBoundingClientRect();px.set(Math.max(-.5,Math.min(.5,(e.clientX-b.left)/b.width-.5)));py.set(Math.max(-.5,Math.min(.5,(e.clientY-b.top)/b.height-.5)));};
 return <header className="rco-opening rco-width">
  <div className="rco-opening-copy"><p className="rco-opening-meta">{en?'SYSTEMS DESIGN / PERSONAL STUDY':'系统策划 · 个人研究'}</p>
   <h1 aria-label={en?'Roco Kingdom: World — Shiny encounters':'洛克王国：世界 · 异色系统'}><span className="rco-opening-game"><ExpressiveTitle reduced={reduced}>{en?'Roco Kingdom: World':'洛克王国：世界'}</ExpressiveTitle></span><span className="rco-opening-title"><ExpressiveTitle reduced={reduced}>{en?<>Shiny<br/>encounters.</>:'异色系统'}</ExpressiveTitle></span></h1>
   <p className="rco-opening-description">{en?'How does another capture become worth the effort? A study of the S3 loop, recorded costs and two original proposals for S5.':'下一次捕捉，还值不值得投入？从 S3 实机流程和耗球记录出发，为 S5 做两套玩法与规则提案。'}</p>
   <div className="rco-opening-actions"><RocoGlass width="auto"><button type="button" onClick={()=>onRead(entry.id)}><span>{text(entry.action,lang)}</span><ArrowDown size={17}/></button></RocoGlass><button type="button" className="rco-opening-model" onClick={()=>onNavigate?.('/systems/roco/model')}>{en?'Open the model':'打开模型'}<ArrowUpRight size={15}/></button></div>
   <a className="rco-opening-document" href="/assets/docs/roco-system-design-portfolio-zh.pdf" target="_blank" rel="noreferrer">{en?'Complete Chinese portfolio PDF':'完整中文方案 PDF'}<ArrowUpRight size={13}/></a>
  </div>
  <div className="rco-opening-exhibit" onPointerEnter={e=>{box.current=e.currentTarget.getBoundingClientRect();}} onPointerMove={move} onPointerLeave={()=>{px.set(0);py.set(0);box.current=null;}}>
   <motion.div className="rco-exhibit-object" style={reduced?undefined:{rotateX:rx,rotateY:ry}}>
    <div className="rco-exhibit-frame"><div className={'rco-exhibit-media rco-exhibit-media-'+entry.code.toLowerCase()}><AnimatePresence initial={false}><motion.img key={entry.id} src={entry.image} alt={text(entry.alt,lang)} width="2204" height="1245" initial={{opacity:0,scale:reduced?1:1.035}} animate={{opacity:1,scale:1}} exit={{opacity:0}} transition={{duration:reduced?0:.32}} fetchPriority={preview===1?'high':'auto'}/></AnimatePresence><motion.div className="rco-exhibit-light" style={{background:light}} aria-hidden="true"/></div></div>
    <motion.div className="rco-exhibit-note" style={reduced?undefined:{x:cardX,y:cardY}}><RocoGlass radius={23}><span className="rco-note-kicker">{entry.code} / {text(entry.label,lang)}</span><div aria-live="polite"><h2>{text(entry.title,lang)}</h2><p>{text(entry.detail,lang)}</p></div><button type="button" onClick={()=>onRead(entry.id)} aria-label={text(entry.action,lang)}><ArrowUpRight size={18}/></button></RocoGlass></motion.div>
   </motion.div>
   <div className="rco-exhibit-options" role="group" aria-label={en?'Choose a reading preview':'选择阅读预览'}>{readingEntrances.map((item,i)=><button type="button" key={item.id} aria-pressed={preview===i} onPointerEnter={e=>{if(e.pointerType==='mouse')setPreview(i);}} onFocus={()=>setPreview(i)} onClick={()=>setPreview(i)}><span>{item.code}</span><b>{text(item.label,lang)}</b><ArrowUpRight size={13}/></button>)}</div>
   <p className="rco-exhibit-credit">{preview===1?(en?'Personal S5 concept · Unofficial · AI-assisted cover':'个人 S5 概念 · 非官方 · AI 辅助封面'):(en?'Author’s gameplay records · Chinese source':'作者实机记录 · 保留原始中文截图')}</p>
  </div>
 </header>;
}

export function RocoChapterNav({items,active,onSelect,lang,reduced}) {
 const id=useId(),nav=useRef(null);
 useEffect(()=>{const button=nav.current?.querySelector('[aria-current]'),scroller=button?.closest('.glass-surface__content');if(!button||!scroller)return;const b=button.getBoundingClientRect(),s=scroller.getBoundingClientRect();if(b.left<s.left||b.right>s.right)scroller.scrollTo({left:scroller.scrollLeft+b.left-s.left-(s.width-b.width)/2,behavior:reduced?'instant':'smooth'});},[active,reduced]);
 return <nav ref={nav} className="rco-chapter-nav" aria-label={lang==='en'?'Case study chapters':'案例章节'}><div className="rco-width"><RocoGlass className="rco-nav-glass" width="auto" radius={30}><div className="rco-chapter-buttons">{items.map(([key,label],i)=><button type="button" key={key} aria-current={active===key?'location':undefined} onClick={()=>onSelect(key)}>{active===key&&<motion.span className="rco-nav-pill" layoutId={id} transition={reduced?{duration:0}:{type:'spring',stiffness:350,damping:32}}/>}<span className="rco-nav-number">0{i+1}</span><b>{label}</b></button>)}</div></RocoGlass><span className="rco-reading-count">{String(Math.max(0,items.findIndex(([key])=>key===active))+1).padStart(2,'0')} <i>/ 06</i></span></div></nav>;
}

export function RocoSwitch({label,options,value,onChange,reduced=false,hover=false}) {
 const id=useId();
 return <RocoGlass className="rco-switch-glass" width="auto"><div className="rco-tabs rco-switch" role="group" aria-label={label}>{options.map(([key,title])=><button type="button" key={key} aria-pressed={key===value} onPointerEnter={e=>{if(hover&&e.pointerType==='mouse')onChange(key);}} onFocus={()=>{if(hover)onChange(key);}} onClick={()=>onChange(key)}>{key===value&&<motion.span className="rco-switch-pill" layoutId={id} transition={reduced?{duration:0}:{type:'spring',stiffness:380,damping:34}}/>}<span>{title}</span></button>)}</div></RocoGlass>;
}

export function RocoRouteLens({choice,loop,lang}) {
 const [step,setStep]=useState(0),en=lang==='en';
 return <div className="rco-route-lens"><ol className="rco-proposal-loop">{loop.split(' → ').map((label,i)=><li key={label}><button type="button" aria-pressed={step===i} onPointerEnter={e=>{if(e.pointerType==='mouse')setStep(i);}} onFocus={()=>setStep(i)} onClick={()=>setStep(i)}><span>0{i+1}</span><b>{label}</b><ArrowRight size={14}/></button></li>)}</ol><div className="rco-route-explanation" aria-live="polite"><span>0{step+1} / 06</span><p key={step}>{text(routeNotes[choice][step],lang)}</p><small>{en?'Draft rules · hover or select a step':'提案规则 · 悬停或选择步骤'}</small></div></div>;
}
