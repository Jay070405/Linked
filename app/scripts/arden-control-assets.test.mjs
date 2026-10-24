import test from 'node:test';
import assert from 'node:assert/strict';
import {controlCrop, remapHotspots} from './arden-control-assets.mjs';

test('alpha crop adds 6% to each edge, includes faint pixels and bounds padding', () => {
  const alpha = new Uint8Array(100 * 100);
  for (let y = 20; y < 70; y++) for (let x = 30; x < 80; x++) alpha[y * 100 + x] = 1;
  assert.deepEqual(controlCrop(alpha, 100, 100), {left: 27, top: 17, width: 56, height: 56});
  alpha[0] = 255;
  assert.deepEqual(controlCrop(alpha, 100, 100), {left: 0, top: 0, width: 85, height: 75});
  assert.throws(() => controlCrop(new Uint8Array(4), 2, 2), /no visible alpha/);
});
test('points, boxes and nested arrays remap to both crop percentages and output pixels', () => {
  const point = {x: 500, y: 200, x_pct: 50, y_pct: 40, visible: true};
  const source = {capture: {...point, bbox: {x0_pct: 40, y0_pct: 30, x1_pct: 60, y1_pct: 50}}, mic_ports: [point], pins: [{pads: [point]}]};
  const result = remapHotspots(source, 1000, 500, {left: 100, top: 50, width: 800, height: 300}, 600);
  assert.equal(result.capture.x_pct, 50);
  assert.equal(result.capture.y_pct, 50);
  assert.equal(result.capture.x, 300);
  assert.equal(result.capture.y, 112.5);
  assert.equal(result.capture.bbox.x0_pct, 37.5);
  assert.equal(result.capture.bbox.y1_pct, 200 / 300 * 100);
  assert.deepEqual(result.mic_ports[0], result.pins[0].pads[0]);
  assert.equal(result.mic_ports[0].visible, true);
  assert.equal(source.capture.y_pct, 40);
});
