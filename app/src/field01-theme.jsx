import React from 'react';
import {createRoot} from 'react-dom/client';
import ShapeGrid from './components/react-bits/ShapeGrid';

// Website-only presentation layer. The approved model and camera controls keep
// their original deployment files and are not rebuilt or replaced.
let mounted;
const install=()=>{
 const experience=document.querySelector('.experience');
 if(!experience||mounted)return;
 const container=document.createElement('div');container.className='portfolio-shape-grid';container.setAttribute('aria-hidden','true');experience.prepend(container);
 const source={current:experience},root=createRoot(container);
 const preference=matchMedia('(prefers-reduced-motion: reduce)');
 const render=()=>root.render(<ShapeGrid direction="up" speed={.12} squareSize={78} borderColor="#2525250d" hoverFillColor="#60606017" hoverTrailAmount={4} reduced={preference.matches} eventSourceRef={source}/>);
 render();preference.addEventListener('change',render);
 mounted=()=>{preference.removeEventListener('change',render);root.unmount();};observer.disconnect();
};
const observer=new MutationObserver(install);observer.observe(document.body,{childList:true,subtree:true});install();
window.addEventListener('pagehide',()=>{observer.disconnect();mounted?.();},{once:true});
