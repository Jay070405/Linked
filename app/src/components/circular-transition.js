export function createCircularTransition(node,isReduced,doc=document){
 let pending=null,running=false,alive=true,generation=0,view=null,animation=null;
 const root=doc.documentElement,block=event=>event.preventDefault();
 node.addEventListener('wheel',block,{passive:false});node.addEventListener('touchmove',block,{passive:false});
 const clear=()=>{
  animation?.cancel();animation=null;view=null;
  node.classList.remove('is-active');root.classList.remove('portfolio-circle-reveal');
 };
 const update=async()=>{
  // History can change while an imported page is loading. Only commit the latest request.
  while(pending&&alive){
   const job=pending;pending=null;
   await job.action(()=>alive&&generation===job.id);
  }
  // Do not wait for animation frames here: rendering is frozen until this callback ends.
  // Route commits flush their layout effects synchronously; the new snapshot remains live.
 };
 const run=async action=>{
  if(!alive)return;
  pending={action,id:++generation};
  if(running)return;
  running=true;
  try{
   while(pending&&alive){
    const source=doc.activeElement;let destination=source;
    node.classList.add('is-active');node.focus({preventScroll:true});
    if(isReduced()||!doc.startViewTransition){
     await update();
    }else{
     // Retain the old rendered frame, including canvas and iframe content.
     // Reveal the actual destination instead of expanding a solid-colour cover.
     root.classList.add('portfolio-circle-reveal');
     view=doc.startViewTransition(update);
     const finished=view.finished.catch(()=>{});
     try{
      await view.ready;
      if(alive){
       destination=doc.activeElement!==node?doc.activeElement:source;
       node.focus({preventScroll:true});
       const radius=Math.ceil(Math.hypot(root.clientWidth,root.clientHeight)/2);
       animation=root.animate([
        {clipPath:'circle(0px at 50% 50%)'},
        {clipPath:`circle(${radius}px at 50% 50%)`},
       ],{duration:620,easing:'cubic-bezier(.65,0,.25,1)',fill:'forwards',pseudoElement:'::view-transition-new(root)'});
       await animation.finished;
      }
     }catch{
      // A skipped snapshot (e.g. a hidden tab) must still complete its navigation.
      view?.skipTransition();
     }
     await finished;
    }
    destination=doc.activeElement!==node?doc.activeElement:destination;
    clear();
    if(doc.activeElement===node&&destination?.isConnected)destination.focus({preventScroll:true});
   }
  }finally{running=false;clear();}
 };
 return {run,dispose(){alive=false;pending=null;generation++;view?.skipTransition();clear();node.removeEventListener('wheel',block);node.removeEventListener('touchmove',block);}};
}
