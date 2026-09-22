import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Raycaster, Vector2, Vector3 } from 'three';
import { pickupPlane, pickupPosition } from './drag.js';

for (const aspect of [16/9, 21/9, 390/844]) {
  test(`pointer up raises the held object without changing depth, aspect ${aspect}`, () => {
    const camera = new PerspectiveCamera(39, aspect, .025, 60);
    camera.position.set(0,4.1,8.6); camera.lookAt(.2,2.55,-.25); camera.updateMatrixWorld();
    const object = new Vector3(2.37,1.59,.08), screen = object.clone().project(camera), ray = new Raycaster();
    ray.setFromCamera(new Vector2(screen.x, screen.y),camera);
    const drag=pickupPlane(object,ray.ray);
    ray.setFromCamera(new Vector2(screen.x,screen.y+.25),camera);
    const lifted=pickupPosition(drag,ray.ray);
    assert.ok(lifted.y>object.y+.5);
    assert.ok(Math.abs(lifted.z-object.z)<1e-10);
    ray.setFromCamera(new Vector2(screen.x+.2,screen.y+.25),camera);
    const right=pickupPosition(drag,ray.ray);
    assert.ok(right.x>lifted.x);
    assert.ok(Math.abs(right.z-object.z)<1e-10);
  });
}
