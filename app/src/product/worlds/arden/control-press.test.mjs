import test from 'node:test';
import assert from 'node:assert/strict';
import {controlPress} from './control-press.mjs';

function setup(t) {
  t.mock.timers.enable({apis: ['setTimeout']});
  const calls = [];
  const press = controlPress(Object.fromEntries(['begin', 'tap', 'hold', 'release'].map(k => [k, () => calls.push(k)])));
  return {press, calls};
}
test('a release before 500ms takes exactly one photo', t => {
  const {press, calls} = setup(t);
  press.start(); t.mock.timers.tick(499); press.end(); press.end();
  t.mock.timers.tick(1000);
  assert.deepEqual(calls, ['begin', 'release', 'tap']);
});
test('a 500ms hold records once and release does not also take a photo', t => {
  const {press, calls} = setup(t);
  press.start(); t.mock.timers.tick(500);
  assert.deepEqual(calls, ['begin', 'hold']);
  press.start(); t.mock.timers.tick(1500); press.end();
  assert.deepEqual(calls, ['begin', 'hold', 'release']);
});
test('pointer cancellation, blur or unmount clears a pending hold without a tap', t => {
  const {press, calls} = setup(t);
  press.start(); t.mock.timers.tick(300); press.cancel(); press.end();
  t.mock.timers.tick(1000);
  assert.deepEqual(calls, ['begin', 'release']);
  press.start(); t.mock.timers.tick(500); press.cancel();
  assert.deepEqual(calls.slice(2), ['begin', 'hold', 'release']);
});
test('keyboard auto-repeat does not restart the hold threshold', t => {
  const {press, calls} = setup(t);
  press.start(); t.mock.timers.tick(400); press.start(); t.mock.timers.tick(100);
  assert.deepEqual(calls, ['begin', 'hold']);
  press.end(); press.start(); press.end();
  assert.deepEqual(calls.slice(-3), ['begin', 'release', 'tap']);
});
