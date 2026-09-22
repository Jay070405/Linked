import {useState,useEffect,useRef,useId} from 'react';
import './vibecoding.css';

export default function Field01({lang, onBack, onReady}) {
  const [loaded, setLoaded] = useState(false);
  const frame=useRef(null);
  const instance=useId();
  const en = lang === 'en';
  useEffect(()=>{
    if(!loaded)return;
    const doc=frame.current?.contentDocument;if(!doc)return;
    let paint=0,finished=false;
    const reveal=()=>{
      if(finished)return;finished=true;observer.disconnect();clearTimeout(deadline);
      // The ready controls can precede the first 3D paint; keep that final paint.
      paint=requestAnimationFrame(()=>{paint=requestAnimationFrame(()=>onReady?.());});
    };
    const check=()=>{if(doc.querySelector('.mode-segment button:not(:disabled),.load-screen button'))reveal();};
    const observer=new MutationObserver(check),deadline=setTimeout(reveal,30000);
    observer.observe(doc.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
    check();return()=>{observer.disconnect();clearTimeout(deadline);cancelAnimationFrame(paint);};
  },[loaded,onReady]);
  return <section className="vc-camera-page" aria-label="FIELD / 01">
    <header className="vc-camera-bar"><a href="/vibecoding" onClick={event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault(); onBack();
    }}>← Vibe coding</a><h1>FIELD / 01 <span>{en?'Interactive camera':'相机交互实验'}</span></h1><a href="/field01/index.html" target="_blank" rel="noopener noreferrer">{en?'Open full screen':'独立打开'} ↗</a></header>
    <div className="vc-camera-stage">
      {!loaded && <p className="vc-camera-loading" role="status">{en?'Opening FIELD / 01…':'正在打开 FIELD / 01…'}</p>}
      <iframe ref={frame} data-camera-instance={import.meta.env.DEV?instance:undefined} src="/field01/index.html" title="FIELD / 01 — 三维相机交互体验" allow="camera; fullscreen" allowFullScreen onLoad={() => setLoaded(true)}/>
    </div>
  </section>;
}
