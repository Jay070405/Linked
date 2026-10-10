import test from 'node:test';
import assert from 'node:assert/strict';
import {createCircularTransition} from './circular-transition.js';

function harness({reduced=false,supported=true,skipped=false}={}){
 const jobs=[],snapshots=[],classes=new Set(),rootClasses=new Set(),listeners=new Set(),doc={activeElement:null};
 const element=()=>({isConnected:true,focus(){doc.activeElement=this;}});
 const source=element(),destination=element(),node=element();doc.activeElement=source;
 const classList=set=>({add:c=>set.add(c),remove:c=>set.delete(c)});
 Object.assign(node,{classList:classList(classes),addEventListener:e=>listeners.add(e),removeEventListener:e=>listeners.delete(e)});
 let finishView;
 doc.documentElement={clientWidth:1200,clientHeight:800,classList:classList(rootClasses),animate(frames,options){
  let resolve,reject;const finished=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const job={frames,options,finished,cancel:()=>reject(new Error('cancelled')),finish:()=>{resolve();finishView();}};
  jobs.push(job);return job;
 }};
 doc.defaultView={requestAnimationFrame(){throw new Error('Rendering is frozen during the snapshot update');}};
 if(supported)doc.startViewTransition=update=>{
  snapshots.push('outgoing frame');let resolve,reject;
  const ready=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const finished=new Promise(yes=>{finishView=yes;});let skip=skipped;
  queueMicrotask(async()=>{await update();snapshots.push('destination frame');if(skip){reject(new Error('skipped'));finishView();}else resolve();});
  return {ready,finished,skipTransition(){skip=true;reject(new Error('skipped'));finishView();}};
 };
 return {jobs,snapshots,classes,rootClasses,listeners,doc,node,source,destination,controller:createCircularTransition(node,()=>reduced,doc)};
}
const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};

test('keeps the outgoing frame and reveals the destination imagery from its centre',async()=>{
 const h=harness();let committed=false;
 const done=h.controller.run(()=>{committed=true;h.destination.focus();});
 assert.equal(committed,false);assert.deepEqual(h.snapshots,['outgoing frame']);
 await flush();assert.equal(committed,true);assert.deepEqual(h.snapshots,['outgoing frame','destination frame']);
 assert.equal(h.jobs[0].options.pseudoElement,'::view-transition-new(root)');
 assert.deepEqual(h.jobs[0].frames,[{clipPath:'circle(0px at 50% 50%)'},{clipPath:'circle(722px at 50% 50%)'}]);
 assert.equal(h.doc.activeElement,h.node);h.jobs[0].finish();await done;
 assert.equal(h.doc.activeElement,h.destination);assert.equal(h.classes.size,0);assert.equal(h.rootClasses.size,0);h.controller.dispose();
});
test('rapid requests before the snapshot update navigate only to the latest destination',async()=>{
 const h=harness(),visited=[];
 const done=h.controller.run(()=>visited.push('systems'));
 h.controller.run(()=>visited.push('works'));h.controller.run(()=>visited.push('other-project'));
 await flush();assert.deepEqual(visited,['other-project']);
 h.jobs[0].finish();await done;h.controller.dispose();
});
test('a stale async preload cannot replace a newer history destination',async()=>{
 const h=harness(),visited=[];let ready;
 const preload=new Promise(resolve=>{ready=resolve;});
 const done=h.controller.run(async isCurrent=>{await preload;if(isCurrent())visited.push('old');});
 await flush();h.controller.run(()=>visited.push('new'));ready();await flush();
 assert.deepEqual(visited,['new']);h.jobs[0].finish();await done;h.controller.dispose();
});
test('reduced motion, unsupported browsers and skipped snapshots still finish navigation',async()=>{
 for(const options of [{reduced:true},{supported:false},{skipped:true}]){
  const h=harness(options);let count=0;
  await h.controller.run(()=>count++);assert.equal(count,1);assert.equal(h.jobs.length,0);assert.equal(h.classes.size,0);h.controller.dispose();
 }
});
test('disposal before the snapshot update prevents queued navigation',async()=>{
 const h=harness();let committed=false;
 const done=h.controller.run(()=>{committed=true;});h.controller.dispose();await done;
 assert.equal(committed,false);assert.equal(h.classes.size,0);assert.equal(h.rootClasses.size,0);assert.equal(h.listeners.size,0);
});
