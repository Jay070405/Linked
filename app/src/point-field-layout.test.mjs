import test from 'node:test';
import assert from 'node:assert/strict';
import {gridLayout, insidePetal, petalOutline, samplePetal, sectionProgress} from './point-field-layout.js';

const outline = petalOutline();
// Petal coordinates: the site's 100 × 130 petal, centred, y up, height 1.
const toPetal = ([x, y]) => [(x - 50) / 130, (65 - y) / 130];

test('the outline is the site petal, closed and within its box', () => {
  assert.ok(outline.length > 60);
  assert.deepEqual(outline[0], outline.at(-1));
  for (const [x, y] of outline) assert.ok(x >= 0 && x <= 100 && y >= 0 && y <= 130, `${x}, ${y}`);
});

test('the petal has a body, a notch at its tip and a narrow base', () => {
  assert.ok(insidePetal(...toPetal([50, 60]), outline), 'the body');
  assert.ok(!insidePetal(...toPetal([50, 11]), outline), 'the notch between the lobes');
  assert.ok(insidePetal(...toPetal([38, 14]), outline), 'a lobe');
  assert.ok(insidePetal(...toPetal([50, 124]), outline), 'the base');
  assert.ok(!insidePetal(...toPetal([50, 7]), outline), 'above the notch');
  assert.ok(!insidePetal(...toPetal([30, 124]), outline), 'beside the base');
});

test('sampled points fill the petal and trace its edge', () => {
  const count = 3000, points = samplePetal(count, 3);
  assert.equal(points.length, count * 3);
  let edge = 0;
  for (let i = 0; i < count; i++) {
    const [x, y, onEdge] = points.slice(i * 3, i * 3 + 3);
    assert.ok(Math.abs(x) <= 0.4 && Math.abs(y) <= 0.51, `point ${i} at ${x}, ${y}`);
    if (onEdge) edge++;
    else assert.ok(insidePetal(x, y, outline), `fill point ${i} at ${x}, ${y} is inside`);
  }
  assert.ok(edge > count * 0.35 && edge < count * 0.55, `${edge} line points (outline and notch)`);
  assert.deepEqual(samplePetal(200, 9), samplePetal(200, 9), 'seeded');
});

test('the fill is shaded: dense at the base, light toward the tip', () => {
  const count = 6000, points = samplePetal(count, 5);
  let base = 0, tip = 0;
  for (let i = 0; i < count; i++) {
    const [, y, line] = points.slice(i * 3, i * 3 + 3);
    if (line) continue;
    if (y < -0.1) base++;
    if (y > 0.1) tip++;
  }
  // Veins count as shading. Compare density, not counts: the base band is under half the area of the tip band.
  let baseArea = 0, tipArea = 0;
  for (let x = -0.4; x <= 0.4; x += 0.005) for (let y = -0.5; y <= 0.5; y += 0.005) {
    if (!insidePetal(x, y, outline)) continue;
    if (y < -0.1) baseArea++;
    if (y > 0.1) tipArea++;
  }
  assert.ok(base / baseArea > 1.5 * tip / tipArea, `density ${(base / baseArea).toFixed(3)} at the base, ${(tip / tipArea).toFixed(3)} at the tip`);
});

test('the grid covers the area evenly, centred, at the given pitch', () => {
  const {count, positions} = gridLayout(1000, 600, 28);
  assert.equal(positions.length, count * 2);
  const xs = new Set(), ys = new Set();
  for (let i = 0; i < count; i++) { xs.add(positions[i * 2]); ys.add(positions[i * 2 + 1]); }
  assert.equal(xs.size, Math.floor(1000 / 28));
  assert.equal(count, xs.size * ys.size);
  assert.ok(Math.min(...ys) >= 0 && Math.max(...ys) < 600 && Math.min(...ys) < 28, 'rows start within one pitch of the top');
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  assert.ok(Math.abs(x0 - (1000 - x1)) < 1e-9, 'centred horizontally');
  assert.ok([...xs].sort((a, b) => a - b).every((x, i, all) => i === 0 || Math.abs(x - all[i - 1] - 28) < 1e-9), 'even pitch');
});

test('the grid can line up with a neighbouring section', () => {
  const above = gridLayout(1000, 600, 28, 0), below = gridLayout(1000, 400, 28, 600);
  const lastRow = Math.max(...above.positions.filter((_, i) => i % 2));
  const firstRow = Math.min(...below.positions.filter((_, i) => i % 2));
  assert.ok(Math.abs((600 - lastRow) + firstRow - 28) < 1e-9, 'rows continue across the seam at the same pitch');
});

test('section progress runs 0 → 1 as the section crosses the viewport', () => {
  assert.equal(sectionProgress(900, 800, 900), 0);
  assert.equal(sectionProgress(-800, 800, 900), 1);
  assert.equal(sectionProgress(50, 800, 900), 0.5);
  assert.equal(sectionProgress(5000, 800, 900), 0);
});
