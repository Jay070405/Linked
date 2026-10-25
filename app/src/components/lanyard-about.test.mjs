import assert from 'node:assert/strict';
import test from 'node:test';
import RAPIER from '@dimforge/rapier3d-compat';
import {readFileSync} from 'node:fs';
import {ABOUT_LANYARD_PHYSICS as P, getLanyardSpringRestLength} from './lanyard-physics.js';
import {wrappedYawError} from '../product/about-model.js';
await RAPIER.init();
const zero={x:0,y:0,z:0};
function rig() {
 const world=new RAPIER.World({x:0,y:-32,z:0});world.timestep=P.timeStep;
 const anchor=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(0,P.anchorY,0));
 const body=(y,card=false)=>{
   const b=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0,y,0).setCanSleep(true).setLinearDamping(card?P.cardLinearDamping:P.segmentLinearDamping).setAngularDamping(P.angularDamping));
   b.setAdditionalSolverIterations(P.solverIterations);
   world.createCollider((card?RAPIER.ColliderDesc.cuboid(P.cardHeight*P.cardAspect/2,1.125,.025):RAPIER.ColliderDesc.ball(.07)).setMass(card?P.cardMass:P.segmentMass),b);return b;
 };
 const joints=[1,2,3].map(n=>body(-P.segmentLength*n)),card=body(P.restY,true);
 world.createImpulseJoint(RAPIER.JointData.spring(getLanyardSpringRestLength(-32,P),P.springStiffness,P.springDamping,zero,zero),anchor,joints[0],true);
 world.createImpulseJoint(RAPIER.JointData.rope(P.topRopeMaxLength,zero,zero),anchor,joints[0],true);
 for(let i=1;i<3;i++)world.createImpulseJoint(RAPIER.JointData.rope(P.segmentLength,zero,zero),joints[i-1],joints[i],true);
 world.createImpulseJoint(RAPIER.JointData.spherical(zero,{x:0,y:P.clipOffsetY,z:0}),joints[2],card,true);
 for(let i=0;i<300;i++)world.step();
 return {world,card,joints};
}
test('About short strap settles at the intended clip distance, with the SVG card proportions',t=>{
 const {world,card,joints}=rig();
 try {
   const length=P.anchorY-joints[2].translation().y;
   assert.ok(Math.abs(length-.5)<.035,`short strap length ${length}`);
   assert.ok(Math.abs(card.translation().y-P.restY)<.035);
   for (const height of [306,216,261.12,184.32,201.8848]) {
     const pixels=height/P.cardHeight, lead=P.strapPixels/pixels-P.segmentLength*P.segmentCount;
     const visibleStrap=(length+lead)*pixels;
     assert.ok(visibleStrap>=60 && visibleStrap<=70, 'Visible short strap at '+height+'px: '+visibleStrap);
   }
   const b=readFileSync(new URL('./card.glb',import.meta.url));const model=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
   const node=model.nodes.find(n=>n.name==='card'),a=model.accessors[model.meshes[node.mesh].primitives[0].attributes.POSITION];
   const width=(a.max[0]-a.min[0])*2.25*P.visualScaleX,height=(a.max[1]-a.min[1])*2.25;
   assert.ok(Math.abs(width/height-630/950)<1e-6);
   assert.ok(Math.abs(height-P.cardHeight)<1e-6);
   t.diagnostic(`rest strap=${length.toFixed(4)} units; 306px card => ${(length/height*306).toFixed(1)}px strap`);
 } finally {world.free()}
});
test('About persistent yaw crosses once, overshoots slightly and settles on either face',()=>{
 let yaw=0,v=0;
 for(const target of [Math.PI,0]) {
  let peak=0;
  for(let i=0;i<120;i++) {
   v+=(wrappedYawError(target,yaw)*P.yawStiffness-v*P.yawDamping)*P.timeStep;
   v=Math.max(-P.flipAngularSpeed,Math.min(P.flipAngularSpeed,v));
   yaw+=v*P.timeStep;peak=Math.max(peak,yaw);
  }
  assert.ok(Math.abs(wrappedYawError(target,yaw))<.001);
  if(target===Math.PI)assert.ok(peak>Math.PI && peak<Math.PI+.5);
 }
});

test('About hard downward release stays contained and returns to rest',t=>{
 const {world,card,joints}=rig();
 try {
  const rest=card.translation().y;
  card.setBodyType(RAPIER.RigidBodyType.KinematicPositionBased,true);
  for(let i=0;i<90;i++) {card.setNextKinematicTranslation({x:0,y:P.restY-1.1,z:0});world.step()}
  const pull=rest-card.translation().y;
  assert.ok(pull>.96,'Existing cat reveal threshold remains reachable');
  card.setBodyType(RAPIER.RigidBodyType.Dynamic,true);
  card.setLinvel({x:0,y:-P.releaseSpeed,z:0},true);
  let peak=0,high=-Infinity,low=Infinity;
  for(let i=0;i<360;i++) {
   const v=card.linvel(),speed=Math.hypot(v.x,v.y,v.z);peak=Math.max(peak,speed);
   if(speed>P.dynamicSpeed)card.setLinvel({x:v.x*P.dynamicSpeed/speed,y:v.y*P.dynamicSpeed/speed,z:v.z*P.dynamicSpeed/speed},false);
   world.step();const y=card.translation().y;high=Math.max(high,y);low=Math.min(low,y);
  }
  assert.ok(Number.isFinite(peak));
  assert.ok(Math.abs(card.translation().y-rest)<.06);
  assert.ok(high<rest+.5,`Excessive rebound ${high-rest}`);
  assert.ok(low>P.restY-1.5,`Escaped lower bound ${low}`);
  t.diagnostic(`About release pull=${pull.toFixed(3)}, peak=${peak.toFixed(3)}, rebound=${(high-rest).toFixed(3)}`);
 } finally {world.free()}
});

test('A 1000px/s scroll kick is bounded to 24px lag and 8 degrees',()=>{
 const {world,card,joints}=rig();
 try {
  const rest={...card.translation()},ppu=306/P.cardHeight;
  const kick=Math.min(P.maxScrollKick,1000/P.timeStep*P.scrollKick);
  let lag=0,tilt=0;
  for(let i=0;i<180;i++) {
   if(i===0||i===8)for(const b of [card,...joints])b.applyImpulse({x:kick*P.scrollKickX*(i? -1:1),y:kick*P.scrollKickY*(i?-1:1),z:0},true);
   world.step();const p=card.translation(),q=card.rotation();
   lag=Math.max(lag,Math.hypot(p.x-rest.x,p.y-rest.y)*ppu);
   tilt=Math.max(tilt,Math.abs(Math.atan2(2*(q.w*q.z+q.x*q.y),1-2*(q.y*q.y+q.z*q.z))));
  }
  assert.ok(lag<=P.maxLagPx,`lag ${lag}px`);assert.ok(tilt<=P.maxTilt,`tilt ${tilt}`);
 }finally{world.free()}
});
