import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Bone,Group,Quaternion,Vector3} from 'three';
import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {MeshoptDecoder} from 'meshoptimizer';
import {COMPANION_PLACEMENT,createKittenGaze,gazeTarget} from './companions.js';

const path=new URL('../../public/assets/office3d/kitten.glb',import.meta.url);
const bytes=readFileSync(path),json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)));
function authoredRig(){
 const joints=new Set(json.skins[0].joints);
 const nodes=json.nodes.map((node,index)=>{
  const object=joints.has(index)?new Bone():new Group();object.name=node.name;
  if(node.translation)object.position.fromArray(node.translation);
  if(node.rotation)object.quaternion.fromArray(node.rotation);
  if(node.scale)object.scale.fromArray(node.scale);
  return object;
 });
 json.nodes.forEach((node,index)=>node.children?.forEach(child=>nodes[index].add(nodes[child])));
 const root=new Group();json.scenes[0].nodes.forEach(index=>root.add(nodes[index]));
 const place=COMPANION_PLACEMENT.kitten;root.position.fromArray(place.position);root.rotation.y=place.yaw;root.scale.setScalar(place.scale);
 root.updateMatrixWorld(true);return root;
}

test('Blender export contains all 19 deform joints, bound head vertices and normalized skin weights',async()=>{
 assert.equal(json.skins[0].joints.length,19);
 await MeshoptDecoder.ready;
 const io=new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'meshopt.decoder':MeshoptDecoder});
 const doc=await io.readBinary(bytes),primitive=doc.getRoot().listMeshes()[0].listPrimitives()[0];
 const weightAccessor=primitive.getAttribute('WEIGHTS_0'),jointAccessor=primitive.getAttribute('JOINTS_0');
 const skin=doc.getRoot().listSkins()[0],head=skin.listJoints().findIndex(node=>node.getName()==='Head');
 let headVertices=0;
 const weights=[],joints=[];
 for(let i=0;i<weightAccessor.getCount();i++){
  weightAccessor.getElement(i,weights);jointAccessor.getElement(i,joints);
  assert.ok(Math.abs(weights[0]+weights[1]+weights[2]+weights[3]-1)<.0001);
  for(let j=0;j<4;j++)if(joints[j]===head&&weights[j]>.8)headVertices++;
 }
 assert.ok(headVertices>1000,'Face, ears and whiskers must deform with Head');
 assert.ok(bytes.length<1_000_000);
});
test('gaze changes the actual exported head and neck while leaving the resting body fixed',()=>{
 const root=authoredRig(),body=root.getObjectByName('Body'),gaze=createKittenGaze(root);
 root.updateMatrixWorld(true);const bodyMatrix=body.matrixWorld.clone();
 for(let i=0;i<90;i++)gaze.update({x:-1,y:1},true,1/60);
 root.updateMatrixWorld(true);const left=gaze.head.getWorldQuaternion(new Quaternion());
 for(let i=0;i<90;i++)gaze.update({x:1,y:-1},true,1/60);
 root.updateMatrixWorld(true);const right=gaze.head.getWorldQuaternion(new Quaternion());
 assert.ok(left.angleTo(right)>.6);assert.deepEqual(body.matrixWorld.toArray(),bodyMatrix.toArray());
 const forwardLeft=new Vector3(0,0,1).applyQuaternion(left),forwardRight=new Vector3(0,0,1).applyQuaternion(right);
 assert.ok(forwardRight.x>forwardLeft.x,'Mouse-right must turn the face toward screen-right');
 assert.ok(forwardLeft.y>forwardRight.y,'Mouse-up must raise the gaze');
});
test('leaving returns to neutral, movement settles, and extreme input stays within natural limits',()=>{
 const gaze=createKittenGaze(authoredRig());
 for(let i=0;i<90;i++)gaze.update({x:200,y:-500},true,1/60);
 assert.ok(gaze.angles.x<=-.09&&gaze.angles.x>=-1.011);
 assert.ok(gaze.angles.y>=-.256&&gaze.angles.y<=.186);
 let moving=true;for(let i=0;i<120;i++)moving=gaze.update({x:1,y:-1},false,1/60);
 assert.equal(moving,false);assert.deepEqual(gaze.angles.toArray(),gazeTarget({},false).toArray());
});
