let sample;
export function transitionMark(name){
 if(!import.meta.env.DEV)return;
 const now=performance.now();
 if(name==='click'){
  if(sample)cancelAnimationFrame(sample.raf);
  sample={start:now,last:now,phase:name,marks:{},frames:[],raf:0};
  const tick=time=>{if(!sample)return;sample.frames.push({ms:time-sample.last,phase:sample.phase});sample.last=time;sample.raf=requestAnimationFrame(tick);};
  sample.raf=requestAnimationFrame(tick);
 }
 if(!sample)return;
 sample.marks[name]=Math.round(now-sample.start);sample.phase=name;
 if(name==='finish'||name==='cancel'){
  cancelAnimationFrame(sample.raf);
  const frames=sample.frames.map(f=>f.ms).sort((a,b)=>a-b);
  document.documentElement.dataset.projectTransition=JSON.stringify({marks:sample.marks,frames:frames.length,p95:Math.round(frames[Math.floor(frames.length*.95)]||0),max:Math.round(frames.at(-1)||0),longFrames:sample.frames.filter(f=>f.ms>32).map(f=>({...f,ms:Math.round(f.ms)}))});
  sample=null;
 }
}
