import test from 'node:test';
import assert from 'node:assert/strict';
import {createCircularTransition} from './circular-transition.js';

function harness(reduced=false){
 const jobs=[],classes=new Set(),listeners=new Set(),doc={activeElement:null};
 const element=()=>({isConnected:true,focus(){doc.activeElement=this;},animate(frames,options){
  let finish,cancel;const finished=new Promise((resolve,reject)=>{finish=resolve;cancel=()=>reject(new Error('cancelled'));});
  const job={frames,options,finished,cancel,finish};jobs.push(job);return job;
 }});
 const source=element(),destination=element(),node=element();doc.activeElement=source;
 Object.assign(node,{firstElementChild:element(),style:{removeProperty(){}},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c)},addEventListener:e=>listeners.add(e),removeEventListener:e=>listeners.delete(e)});
 return {jobs,classes,listeners,doc,node,source,destination,controller:createCircularTransition(node,()=>reduced,doc)};
}
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};

test('navigation waits until covered, then reveals and restores destination focus',async()=>{
 const h=harness();let committed=false;
 const done=h.controller.run(()=>{committed=true;h.destination.focus();});
 assert.equal(committed,false);assert.ok(h.classes.has('is-active'));
 h.jobs[0].finish();await flush();assert.equal(committed,true);
 assert.equal(h.doc.activeElement,h.node);h.jobs[1].finish();await done;
 assert.equal(h.doc.activeElement,h.destination);assert.equal(h.classes.size,0);h.controller.dispose();
});
test('rapid requests before the cover completes only navigate to the latest destination',async()=>{
 const h=harness(),visited=[];
 const done=h.controller.run(()=>visited.push('systems'));
 h.controller.run(()=>visited.push('works'));h.controller.run(()=>visited.push('other-project'));
 h.jobs[0].finish();await flush();assert.deepEqual(visited,['other-project']);
 h.jobs[1].finish();await done;h.controller.dispose();
});
test('a stale async preload cannot replace a newer history destination',async()=>{
 const h=harness(),visited=[];let ready;
 const preload=new Promise(resolve=>{ready=resolve;});
 const done=h.controller.run(async isCurrent=>{await preload;if(isCurrent())visited.push('old');});
 h.jobs[0].finish();await flush();h.controller.run(()=>visited.push('new'));ready();await flush();
 assert.deepEqual(visited,['new']);h.jobs[1].finish();await done;h.controller.dispose();
});
test('reduced motion skips the wipe and disposal cancels unfinished navigation',async()=>{
 const quiet=harness(true);let count=0;
 await quiet.controller.run(()=>count++);assert.equal(count,1);assert.equal(quiet.jobs.length,0);quiet.controller.dispose();
 const active=harness();const done=active.controller.run(()=>count++);active.controller.dispose();await done;
 assert.equal(count,1);assert.equal(active.classes.size,0);assert.equal(active.listeners.size,0);
});
