import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import ExpressiveTitle from '../components/ExpressiveTitle';
import { PortfolioGlass } from '../components/PortfolioSurface';
import { DOLL_OUTFITS } from './companions';
import './DollWardrobe.css';

const EASE=[.16,1,.3,1];

export default function DollWardrobe({lang,position,selected,loading,error,onSelect,onClose,returnRef,reduced=false}) {
  const dialog=useRef(null),id=useId(),en=lang==='en',systemReduced=useReducedMotion();
  const quiet=reduced||systemReduced;
  const [closing,setClosing]=useState(false);
  const outfit=DOLL_OUTFITS.find(item=>item.id===selected)||DOLL_OUTFITS[0];
  const index=DOLL_OUTFITS.indexOf(outfit);
  const close=()=>{if(quiet)onClose();else setClosing(true);};
  useEffect(()=>{
    const node=dialog.current,previous=document.activeElement;
    node.showModal();node.focus({preventScroll:true});
    return()=>{node.close();(returnRef.current??previous)?.focus({preventScroll:true});};
  },[returnRef]);
  return createPortal(<dialog ref={dialog} tabIndex={-1}
    className={`office-wardrobe${closing?' is-closing':''}${quiet?' is-quiet':''}`}
    style={{'--wardrobe-x':`${position.x+62}px`,'--wardrobe-y':`${position.y-236}px`}}
    aria-labelledby={`${id}-title`}
    onCancel={event=>{event.preventDefault();close();}}
    onClick={event=>{if(event.target===event.currentTarget)close();}}>
    <motion.div className="wardrobe-content"
      initial={quiet?false:{opacity:0,y:16,scale:.96}}
      animate={closing?{opacity:0,y:8,scale:.97}:{opacity:1,y:0,scale:1}}
      transition={{duration:quiet?0:closing?.2:.46,ease:EASE}}
      onAnimationComplete={()=>{if(closing)onClose();}}>
      <header className="wardrobe-header">
        <span>STUDIO WARDROBE / 02</span>
        <button type="button" className="wardrobe-close" onClick={close} disabled={closing}
          aria-label={en?'Close wardrobe':'关闭换装'}>
          <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>
        </button>
      </header>
      <h2 id={`${id}-title`}><ExpressiveTitle variant="type" typingSpeed={42} hover={false} reduced={quiet}>
        {en?'A little change.':'换个造型。'}
      </ExpressiveTitle></h2>
      <div className="wardrobe-stage" aria-hidden="true">
        <span className="wardrobe-stage-orbit"/><span className="wardrobe-stage-shadow"/>
        <AnimatePresence initial={false}>
          <motion.figure key={selected} className="wardrobe-figure"
            initial={quiet?false:{opacity:0,y:15,rotate:3,scale:.94}}
            animate={{opacity:1,y:0,rotate:0,scale:1}}
            exit={quiet?{opacity:0}:{opacity:0,y:-12,rotate:-3,scale:.96}}
            transition={{duration:quiet?0:.4,ease:EASE}}>
            <img src={`/assets/office3d/doll-${outfit.id}-preview.png`} alt="" width="432" height="512" draggable="false"/>
          </motion.figure>
        </AnimatePresence>
      </div>
      <div className="wardrobe-caption">
        <motion.span key={selected} initial={quiet?false:{opacity:0,y:5}} animate={{opacity:1,y:0}} transition={{duration:quiet?0:.3}}>
          {en?outfit.en:outfit.zh}
        </motion.span>
        <span className="wardrobe-count"><b>{String(index+1).padStart(2,'0')}</b><span>/</span>04</span>
      </div>
      <motion.div initial={quiet?false:{opacity:0,y:10}} animate={{opacity:1,y:0}}
        transition={{duration:quiet?0:.45,delay:quiet?0:.1,ease:EASE}}>
        <PortfolioGlass className="wardrobe-picker-glass" radius={22}>
          <div className="wardrobe-options" role="group" aria-label={en?'Choose an outfit':'选择造型'} aria-busy={!!loading}>
            {DOLL_OUTFITS.map(look=><motion.button type="button" className="wardrobe-outfit" key={look.id}
              aria-label={en?look.en:look.zh} aria-pressed={selected===look.id}
              disabled={!!loading||closing} onClick={()=>onSelect(look.id)}
              whileHover={quiet?undefined:'hover'} whileTap={quiet?undefined:{scale:.95}}>
              {selected===look.id&&<motion.span className="wardrobe-selection" layoutId={`${id}-selection`}
                transition={quiet?{duration:0}:{type:'spring',stiffness:330,damping:34}}/>}
              <motion.img className="wardrobe-thumbnail" src={`/assets/office3d/doll-${look.id}-preview.png`}
                alt="" width="432" height="512" draggable="false" variants={{hover:{y:-4,rotate:2}}}
                transition={{type:'spring',stiffness:340,damping:24}}/>
              <span>{en?look.en:look.zh}</span>
            </motion.button>)}
          </div>
        </PortfolioGlass>
      </motion.div>
      <footer className="wardrobe-footer">
        <p className={error?'wardrobe-status is-error':'wardrobe-status'} role="status">
          {loading?(en?'Trying it on…':'正在试穿…'):error?(en?'Could not load. Select the outfit to retry.':'暂时没能加载，点击造型重试。'):(en?'Click to try on':'轻点，换个造型')}
        </p>
        <span aria-hidden="true">{loading?<span className="wardrobe-loading"/>:
          <svg className="wardrobe-worn" viewBox="0 0 20 20" fill="none"><path d="m5 10 3.2 3.2L15 6.5"/></svg>}
        </span>
      </footer>
    </motion.div>
  </dialog>,document.body);
}
