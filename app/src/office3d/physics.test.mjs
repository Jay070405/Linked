import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DeskPhysics, initPhysics } from './physics.js';
await initPhysics();
const asset=readFileSync(new URL('../../public/assets/office3d/studio.glb',import.meta.url));
const gltf=JSON.parse(asset.subarray(20,20+asset.readUInt32LE(12)).toString());
const step=(scene,n=360)=>{for(let i=0;i<n;i++)scene.step(1/60);};

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
