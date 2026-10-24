import test from 'node:test';
import assert from 'node:assert/strict';
import {orbitGesture, orbitKey, orbitKeyStep, orbitRows, snapOrbit} from './orbit-model.js';

test('orbit wraps azimuth, clamps elevation and snaps release to a frame', () => {
  assert.equal(orbitKey(snapOrbit({az:-.8,row:-5})), 'e-30_a350');
  assert.equal(orbitKey(snapOrbit({az:36.2,row:12})), 'e70_a000');
  assert.equal(orbitKey(snapOrbit({az:8.6,row:3.6})), 'e25_a090');
});
test('arrow keys move independent axes, including seam and limits', () => {
  assert.deepEqual(orbitKeyStep({az:0,row:3},'ArrowLeft'),{az:35,row:3});
  assert.deepEqual(orbitKeyStep({az:35,row:3},'ArrowRight'),{az:0,row:3});
  assert.deepEqual(orbitKeyStep({az:9,row:3},'ArrowUp'),{az:9,row:4});
  assert.deepEqual(orbitKeyStep({az:9,row:0},'ArrowDown'),{az:9,row:0});
  assert.deepEqual(orbitKeyStep({az:9,row:7},'ArrowUp'),{az:9,row:7});
  assert.deepEqual(orbitKeyStep({az:9,row:7},'Home'),{az:0,row:3});
  assert.equal(orbitKeyStep({az:0,row:3},'Tab'),null);
});
test('progressive order puts the current and neighbouring rows before distant rows', () => {
  assert.deepEqual(orbitRows(3),[3,2,4,1,5,0,6,7]);
  assert.deepEqual(orbitRows(0),[0,1,2,3,4,5,6,7]);
});
test('touch keeps vertical scrolling, with deliberate object tilts and a ten-degree threshold', () => {
  assert.equal(orbitGesture(0,5,true,300),'pending');
  assert.equal(orbitGesture(1,100,true,50),'scroll');
  assert.equal(orbitGesture(17,100,true,50),'scroll');
  assert.equal(orbitGesture(18,100,true,50),'rotate');
  assert.equal(orbitGesture(0,100,true,200),'rotate');
  assert.equal(orbitGesture(0,100,false,200),'scroll');
});
