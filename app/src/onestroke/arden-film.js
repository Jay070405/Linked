import {CanvasTexture, SRGBColorSpace} from 'three';

export const ARDEN_FRAME_ORDER = [...new Set([1,36,...[8,4,2,1].flatMap(step => Array.from({length:Math.floor(36/step)},(_,i)=>(i+1)*step))])];
export function nearestArdenFrame(frames, wanted) {
  return [...frames.keys()].sort((a,b)=>Math.abs(a-wanted)-Math.abs(b-wanted)||a-b)[0];
}

// One GPU texture for the entire film. Decode coarse-to-fine, two requests at
// a time, so the two endpoints arrive before the intermediate samples.
export function createArdenFilm(alive) {
  const canvas=document.createElement('canvas'); canvas.width=1200; canvas.height=1165;
  const ctx=canvas.getContext('2d'), texture=new CanvasTexture(canvas);
  texture.colorSpace=SRGBColorSpace;
  const frames=new Map(), pending=new Set(), abort=new AbortController();
  let started=false, disposed=false, index=0, drawn=0, parts=null;
  function next() {
    if(disposed || !alive() || index>=ARDEN_FRAME_ORDER.length)return;
    const n=ARDEN_FRAME_ORDER[index++], im=new Image(); pending.add(im); im.decoding='async';
    const done=()=>{pending.delete(im);next();};
    im.onload=()=>{if(!disposed&&alive())frames.set(n,im);done();};
    im.onerror=done;
    im.src=`/assets/product/arden/film/explode/${String(n).padStart(3,'0')}.webp`;
  }
  return {
    texture,
    load() {
      if(started)return; started=true; next(); next();
      fetch('/assets/product/arden/film/explode/parts.json',{signal:abort.signal})
        .then(r=>{if(!r.ok)throw new Error('Arden part positions unavailable');return r.json();})
        .then(data=>{if(!disposed&&alive())parts=data.frames;}).catch(()=>{});
    },
    draw(wanted) {
      const n=nearestArdenFrame(frames,wanted);
      if(n && n!==drawn){ctx.clearRect(0,0,1200,1165);ctx.drawImage(frames.get(n),0,0,1200,1165);texture.needsUpdate=true;drawn=n;}
      return {frame:drawn,parts:parts?.find(f=>f.frame===drawn)?.parts || {}};
    },
    dispose() {disposed=true;abort.abort();pending.forEach(im=>{im.onload=im.onerror=null;im.src='';});pending.clear();frames.clear();texture.dispose();},
  };
}
