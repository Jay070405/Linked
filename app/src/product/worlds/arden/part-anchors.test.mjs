import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
import {partAnchorGroup, partAnchors, remapPartAnchors} from './part-anchors.mjs';

test('prescription inner lens resolves legacy JSON and prefers the current id without duplicate anchors', () => {
  const part = {id: 'rx_lens', n: 26};
  const legacy = {anchors: [
    {id: 'R', x_pct: 10, y_pct: 20, visible: false},
    {id: 'L', x_pct: 30, y_pct: 40, visible: true},
  ]};
  const points = partAnchors([part], {rx_insert: legacy});
  assert.deepEqual(points.map(a => [a.key, a.on, a.focusable]), [
    ['rx_lens:R', false, false], ['rx_lens:L', true, true],
  ]);
  const current = {x_pct: 50, y_pct: 60};
  const both = {rx_insert: legacy, rx_lens: current};
  assert.equal(partAnchorGroup(part, both), current);
  assert.equal(partAnchors([part], both).length, 1);
  const still = {at: [10, 20], badge: [1, 2]};
  assert.equal(partAnchorGroup(part, {rx_insert: still}), still);

  const assets = JSON.parse(readFileSync(new URL('./data/assets.json', import.meta.url), 'utf8'));
  let checked = 0;
  function check(value) {
    if (!value || typeof value !== 'object') return;
    if (value.rx_insert || value.rx_lens) {
      assert.equal(partAnchorGroup(part, value), value.rx_lens || value.rx_insert);
      assert.ok(partAnchors([part], value).length > 0);
      checked++;
    }
    for (const child of Object.values(value)) check(child);
  }
  check(assets);
  assert.ok(checked > 0, 'render frames with the prescription lens were checked');
});

test('each mic gets one anchor and retains its own occlusion, without duplicating the parent', () => {
  const parts = [{id: 'mics', n: 14}, {id: 'eye_sensors', n: 27}];
  const frame = {mics: {n: 14, x_pct: 10, y_pct: 20, visible: true,
    anchors: Array.from({length: 5}, (_, i) => ({id: `mic${i}`, x_pct: 10 + i, y_pct: 20, visible: i !== 1}))}};
  const points = partAnchors(parts, frame);
  assert.equal(points.length, 5);
  assert.deepEqual(points.map(a => a.on), [true, false, true, true, true]);
  assert.equal(points.filter(a => a.sub).length, 4);
  assert.equal(new Set(points.map(a => a.key)).size, 5);
  assert.deepEqual(partAnchors(parts, {}), []);
  assert.equal(partAnchors(parts, {eye_ir: {n: 27, x_pct: 1, y_pct: 2, visible: true}})[0].part.id, 'eye_sensors');
});

test('crop remapping applies to parent and sub-anchors on every frame, preserving visibility', () => {
  const data = {frames: [{parts: {control: {x_pct: 50, y_pct: 50, visible: true,
    anchors: [{id: 'dome', x_pct: 25, y_pct: 30, visible: false}]}}}, {parts: {}}]};
  remapPartAnchors(data, {sourceW: 1000, sourceH: 500, crop: {left: 100, top: 50, width: 800, height: 400}});
  const control = data.frames[0].parts.control;
  assert.equal(control.x_pct, 50);
  assert.equal(control.y_pct, 50);
  assert.equal(control.anchors[0].x_pct, 18.75);
  assert.equal(control.anchors[0].y_pct, 25);
  assert.equal(control.anchors[0].visible, false);
});

test('each visible part has one Tab stop, even when its first anchor is occluded', () => {
  const parts = [{id: 'mics', n: 14}, {id: 'sensors', n: 27}, {id: 'board', n: 6}];
  const anchor = (id, visible = true) => ({id, x_pct: 10, y_pct: 20, visible});
  const frame = {
    mics: {anchors: [anchor('hidden', false), anchor('left'), anchor('right')]},
    sensors: {anchors: [anchor('hidden', false)]},
    board: anchor('board'),
  };
  const tabStops = () => partAnchors(parts, frame).filter(a => a.focusable).map(a => a.key);
  assert.deepEqual(tabStops(), ['mics:left', 'board:board']);
  frame.mics.anchors[1].visible = false;
  assert.deepEqual(tabStops(), ['mics:right', 'board:board']);
  frame.mics.anchors[2].visible = false;
  assert.deepEqual(tabStops(), ['board:board']);
});
