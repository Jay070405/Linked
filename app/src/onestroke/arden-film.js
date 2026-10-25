import {CanvasTexture, SRGBColorSpace} from 'three';

export const ARDEN_FRAME_ORDER = [...new Set([1,120,...[24,12,6,3,1].flatMap(step => Array.from({length:Math.floor(120/step)},(_,i)=>(i+1)*step))])];
const ease=t=>t*t*(3-2*t);
const seg=(s,a,b)=>Math.max(0,Math.min(1,(s-a)/(b-a)));
export const ardenFrameAt=s=>s>=27?120:s<23?1+Math.round(7*seg(s,22.55,23)):8+Math.round(112*ease(seg(s,23,24.2)));
// Verified against hero/120.webp and still/sim-front-indicator-1600.webp.
export const ARDEN_INDICATOR=[1166,329];
export function nearestArdenFrame(frames, wanted) {
  return [...frames.keys()].sort((a,b)=>Math.abs(a-wanted)-Math.abs(b-wanted)||a-b)[0];
}

// One GPU texture for the entire film. Decode coarse-to-fine, two requests at
// a time, so the two endpoints arrive before the intermediate samples.
export function createArdenFilm(alive) {
  const canvas=document.createElement('canvas'); canvas.width=1440; canvas.height=810;
  const ctx=canvas.getContext('2d'), texture=new CanvasTexture(canvas);
  texture.colorSpace=SRGBColorSpace;
  const frames=new Map(), pending=new Set();
  let started=false, disposed=false, index=0, drawn=0;
  function next() {
    if(disposed || !alive() || index>=ARDEN_FRAME_ORDER.length)return;
    const n=ARDEN_FRAME_ORDER[index++], im=new Image(); pending.add(im); im.decoding='async';
    const done=()=>{pending.delete(im);next();};
    im.onload=()=>{if(!disposed&&alive())frames.set(n,im);done();};
    im.onerror=done;
    im.src=`/assets/product/arden/film/hero/${String(n).padStart(3,'0')}.webp`;
  }
  return {
    texture,
    load() {
      if(started)return; started=true; next(); next();
    },
    draw(wanted) {
      const n=nearestArdenFrame(frames,wanted);
      if(n && n!==drawn){ctx.clearRect(0,0,1440,810);ctx.drawImage(frames.get(n),0,0,1440,810);texture.needsUpdate=true;drawn=n;}
      return {frame:drawn};
    },
    dispose() {disposed=true;pending.forEach(im=>{im.onload=im.onerror=null;im.src='';});pending.clear();frames.clear();texture.dispose();},
  };
}
