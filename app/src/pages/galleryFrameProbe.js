// Local-only frame sampling. Vite removes the call site from production builds.
export function createFrameProbe(root) {
 let previous=0,gaps=[],work=[],uploads=0;
 return (now,started,uploadBytes=0)=>{
  if(previous&&now-previous<500){gaps.push(now-previous);work.push(performance.now()-started);uploads+=uploadBytes;}
  previous=now;
  if(gaps.length<120)return;
  const average=values=>values.reduce((a,b)=>a+b,0)/values.length;
  const percentile=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length*.95)];
  const mean=average(gaps);
  root.dataset.frameStats=JSON.stringify({fps:+(1000/mean).toFixed(1),frameP95:+percentile(gaps).toFixed(2),jsMean:+average(work).toFixed(2),jsP95:+percentile(work).toFixed(2),slowFrames:gaps.filter(n=>n>25).length,uploadMiBPerSecond:+(uploads/1048576/(mean*gaps.length/1000)).toFixed(1),samples:gaps.length,width:innerWidth,height:innerHeight});
  gaps=[];work=[];uploads=0;
 };
}
