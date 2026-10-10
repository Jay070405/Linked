import {useCallback,useEffect,useRef} from 'react';
import './circular-transition.css';
import {createCircularTransition} from './circular-transition';

// Browser snapshots preserve the outgoing WebGL frame while the new view expands.
export function useCircularTransition(reduced) {
 const layer=useRef(null),controller=useRef(null),quiet=useRef(reduced);quiet.current=reduced;
 useEffect(()=>{
  controller.current=createCircularTransition(layer.current,()=>quiet.current);
  return()=>{controller.current.dispose();controller.current=null;};
 },[]);
 const run=useCallback(action=>controller.current?.run(action),[]);
 return {run,layer};
}

export default function CircularTransition({layer,lang}) {
 return <div ref={layer} className="circular-transition" tabIndex={-1} aria-label={lang==='en'?'Changing page':'正在切换页面'} onKeyDown={event=>{if(['Tab',' ','PageUp','PageDown','Home','End','ArrowUp','ArrowDown'].includes(event.key))event.preventDefault();}}/>;
}
