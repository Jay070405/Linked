import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DeskPhysics, initPhysics } from './physics.js';
await initPhysics();
const asset=readFileSync(new URL('../../public/assets/office3d/studio.glb',import.meta.url));
const gltf=JSON.parse(asset.subarray(20,20+asset.readUInt32LE(12)).toString());
const step=(scene,n=360)=>{for(let i=0;i<n;i++)scene.step(1/60);};

for (const id of ['Prop_Tablet','Prop_Sketchbook','Prop_Book_0','Prop_Book_1','Prop_Book_2','Prop_Book_3']) test(`${id} lifts in the fully furnished scene despite a small sideways pointer component`,()=>{
  const scene=new DeskPhysics();
  try {
    for(const node of gltf.nodes.filter(n=>n.extras?.draggable)) {
      const {home,halfExtents:h,mass}=node.extras;
      scene.add(node.name,{x:home[0],y:home[2],z:-home[1]},[h[0],h[2],h[1]],mass);
    }
    step(scene,240);
    const body=scene.items.get(id).body, from={...body.translation()};
    scene.grab(id);
    for(let i=1;i<=60;i++){scene.move({...from,x:from.x-.05*i/60,y:from.y+i/60});step(scene,1);}
    assert.ok(body.translation().y>from.y+.9,`${id}: ${from.y} → ${body.translation().y}`);
    assert.ok(Math.abs(body.translation().z-from.z)<.001);
    // Return above its original slot before dropping a narrow upright book.
    scene.move({...from,y:from.y+1});step(scene,30);
    scene.release();step(scene,300);
    assert.equal(scene.lost.size,0);
  } finally {scene.dispose();}
});

test('all authored loose objects remain on the table after first load',()=>{
  const scene=new DeskPhysics();
  try {
    for(const node of gltf.nodes.filter(n=>n.extras?.draggable)) {
      const {home,halfExtents:h,mass}=node.extras;
      scene.add(node.name,{x:home[0],y:home[2],z:-home[1]},[h[0],h[2],h[1]],mass);
    }
    step(scene,600);
    assert.equal(scene.items.size,12);
    assert.equal(scene.lost.size,0);
  }finally{scene.dispose();}
});
test('released object falls onto the desk; no restore state is created',()=>{
  const scene=new DeskPhysics();
  try{
    const body=scene.add('cup',{x:-1,y:2.7,z:.3},[.2,.2,.2],.4);
    scene.grab('cup');scene.move({x:-1,y:3.2,z:.3});step(scene,20);scene.release();step(scene);
    assert.ok(Math.abs(body.translation().y-1.595)<.035);
    assert.equal(scene.lost.size,0);
  }finally{scene.dispose();}
});
test('off-table drop is removed; restoring only returns the lost object',()=>{
  const changes=[],scene=new DeskPhysics(n=>changes.push(n));
  try{
    const home={x:-1,y:1.62,z:.4};const cup=scene.add('cup',home,[.2,.2,.2],.4);
    const mouse=scene.add('mouse',{x:2,y:1.55,z:.8},[.15,.1,.22],.15);
    scene.grab('cup');scene.move({x:-5.5,y:2.3,z:.4});step(scene,30);scene.release();step(scene);
    assert.deepEqual([...scene.lost],['cup']);assert.equal(cup.isEnabled(),false);
    const existing={...mouse.translation()};
    scene.restoreLost();
    assert.equal(scene.lost.size,0);assert.equal(cup.isEnabled(),true);
    assert.ok(Math.abs(cup.translation().x-home.x)<.001);
    assert.deepEqual({...mouse.translation()},existing);
    assert.deepEqual(changes,[1,0]);
  }finally{scene.dispose();}
});

test('held object cannot be dragged down through the solid desktop',()=>{
  const scene=new DeskPhysics();
  try {
    const cup=scene.add('cup',{x:-1,y:2.5,z:.4},[.2,.2,.2],.4);
    step(scene,1);scene.grab('cup');scene.move({x:-1,y:.3,z:.4});step(scene,5);
    assert.ok(cup.translation().y>=1.59,`held cup at ${cup.translation().y}`);
    scene.release();step(scene);assert.equal(scene.lost.size,0);
  } finally {scene.dispose();}
});

test('held object stops at the monitor instead of passing through its housing',()=>{
  const scene=new DeskPhysics();
  try {
    const cup=scene.add('cup',{x:.55,y:2.7,z:.8},[.2,.2,.2],.4);
    step(scene,1);scene.grab('cup');scene.move({x:.55,y:2.7,z:-.9});step(scene,5);
    assert.ok(cup.translation().z>-.17);
  } finally {scene.dispose();}
});

test('a fast lateral drag cannot launch another tabletop object',()=>{
  const scene=new DeskPhysics();
  try {
    const mouse=scene.add('mouse',{x:-1,y:1.52,z:.8},[.15,.1,.2],.15);
    const book=scene.add('book',{x:1,y:1.46,z:.8},[.7,.065,.4],.6);
    step(scene,120);scene.grab('mouse');scene.move({x:5,y:1.55,z:.8});step(scene,10);scene.release();step(scene,180);
    assert.ok(Math.abs(book.translation().x-1)<.1);
    assert.equal(scene.lost.size,0);
    assert.ok(mouse.translation().x<1);
  } finally {scene.dispose();}
});
