export function createCircularTransition(node,isReduced,doc=document){
 let pending=null,running=false,alive=true,generation=0;
 const animations=[],circle=node.firstElementChild,block=event=>event.preventDefault();
 node.addEventListener('wheel',block,{passive:false});node.addEventListener('touchmove',block,{passive:false});
 const clear=()=>{animations.splice(0).forEach(a=>a.cancel());node.classList.remove('is-active');node.style.removeProperty('opacity');};
 const animate=async(element,frames,options)=>{
  const animation=element.animate(frames,{fill:'forwards',...options});animations.push(animation);
  try{await animation.finished;}catch{/* Disposal cancels the animation and pending navigation. */}
 };
 const run=async action=>{
  pending={action,id:++generation};
  if(running||!alive)return;
  running=true;
  try{
   while(pending&&alive){
    const source=doc.activeElement;
    if(!isReduced()){
     node.classList.add('is-active');node.style.opacity='1';node.focus({preventScroll:true});
     await animate(circle,[{transform:'translate(-50%,-50%) scale(0)'},{transform:'translate(-50%,-50%) scale(1)'}],{duration:620,easing:'cubic-bezier(.65,0,.25,1)'});
    }
    if(!alive)break;
    // New history events replace queued navigation before the cover opens.
    while(pending&&alive){
     const job=pending;pending=null;
     await job.action(()=>alive&&generation===job.id);
    }
    if(!alive)break;
    const destination=doc.activeElement!==node?doc.activeElement:source;
    if(!isReduced()){
     node.focus({preventScroll:true});
     await animate(node,[{opacity:1},{opacity:1,offset:.15},{opacity:0}],{duration:380,easing:'ease-out'});
    }
    clear();
    if(doc.activeElement===node&&destination?.isConnected)destination.focus({preventScroll:true});
   }
  }finally{running=false;clear();}
 };
 return {run,dispose(){alive=false;pending=null;generation++;clear();node.removeEventListener('wheel',block);node.removeEventListener('touchmove',block);}};
}
