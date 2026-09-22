import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Vector3, PerspectiveCamera } from 'three';
import { cameraPose, CAMERA_FOV, SCREEN_SIZE } from './camera.js';

// Exercise the actual compressed asset's camera anchors, not mock coordinates.
const asset = readFileSync(new URL('../../public/assets/office3d/studio.glb', import.meta.url));
const gltf = JSON.parse(asset.subarray(20,20+asset.readUInt32LE(12)).toString());
const anchor = name => new Vector3(...gltf.nodes.find(node => node.name === name).translation);
const start = anchor('CameraStart'), look = anchor('CameraLook'), screen = anchor('ScreenTarget');
test('web model retains screen and independent draggable props, with no alternate art world',()=>{
  for (const name of ['StudioInterior','SharedDesk','ScreenSurface','Prop_Cup','Prop_Keyboard','Prop_Tablet']) assert.ok(gltf.nodes.some(node=>node.name===name));
  assert.ok(!gltf.nodes.some(node=>node.name==='FantasyGarden'));
  assert.ok(asset.length<5_000_000,'Keep the detailed first-load office under 5 MB');
});
for (const aspect of [16/9, 16/10, 21/9, 390/844]) {
  test(`black monitor covers viewport before handoff, aspect ${aspect}`, () => {
    const pose = cameraPose(.141, aspect, start, look, screen, { x: 1, y: -1 });
    const camera = new PerspectiveCamera(CAMERA_FOV,aspect,.015,90);
    camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld();
    const halfW=SCREEN_SIZE[0]/2,halfH=SCREEN_SIZE[1]/2;
    const min=screen.clone().add(new Vector3(-halfW,-halfH,0)).project(camera);
    const max=screen.clone().add(new Vector3(halfW,halfH,0)).project(camera);
    assert.ok(min.x < -1 && min.y < -1 && max.x > 1 && max.y > 1);
    assert.ok(pose.position.distanceTo(screen)>.015);
  });
}
test('dolly is reversible and settles to the exact same camera at a given scroll position',()=>{
  for (const p of [0,.02,.075,.116,.133,.141,.158]) {
    const first=cameraPose(p,16/9,start,look,screen);
    cameraPose(.158,16/9,start,look,screen);
    const reverse=cameraPose(p,16/9,start,look,screen);
    assert.deepEqual(first.position.toArray(),reverse.position.toArray());
    assert.deepEqual(first.target.toArray(),reverse.target.toArray());
  }
});
test('pointer parallax cannot move the handoff target or final camera',()=>{
  const a=cameraPose(.141,16/9,start,look,screen,{x:1,y:1});
  const b=cameraPose(.141,16/9,start,look,screen,{x:-1,y:-1});
  assert.deepEqual(a.position.toArray(),b.position.toArray());
  assert.deepEqual(a.target.toArray(),screen.toArray());
});
test('camera continues moving forward without crossing the monitor',()=>{
  let previous=Infinity;
  for(let i=0;i<=141;i++){
    const pose=cameraPose(i/1000,16/9,start,look,screen);
    assert.ok(pose.position.z<=previous);
    assert.ok(pose.position.z>screen.z);
    previous=pose.position.z;
  }
});
