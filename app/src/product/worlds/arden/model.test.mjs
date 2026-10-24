import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {dimension, indicatorCdm2, luxAt, massByGroup, nice, power, tAt} from './model.js';

// content.js imports i18n (JSX-free, but it pulls React context helpers); read the rows from the source text instead
const src = readFileSync(new URL('./content.js', import.meta.url), 'utf8');
const MASS_ROWS = eval(src.match(/export const MASS_ROWS = (\[[\s\S]*?\n\]);/)[1]);
const GROUPS = [...src.matchAll(/\{id: '(\w+)', name: L\('[^']+', '[^']+'\)\}/g)].map(m => ({id: m[1]}));
const dims = JSON.parse(readFileSync(new URL('./data/dimensions.json', import.meta.url), 'utf8'));

test('the mass rows add up to ARCHITECTURE.md’s 56.61 g (Revision H), plus 3 g reserve = 59.61 g, as in dimensions.json', () => {
  const groupIds = GROUPS.filter(g => ['optics', 'structure', 'temples', 'power', 'electronics', 'audio', 'assembly'].includes(g.id));
  assert.equal(groupIds.length, 7);
  const m = massByGroup(MASS_ROWS, groupIds);
  assert.equal(m.total, 56.61);
  assert.equal(Math.round((m.total + 3) * 100) / 100, 59.61);
  assert.equal(m.total, dims.weight_budget.eyewear_rows_g);
  assert.equal(Math.round((m.total + 3) * 100) / 100, dims.weight_budget.estimate_g);
  for (const r of MASS_ROWS) assert.ok(groupIds.some(g => g.id === r[0]), r[1]);
});

test('Revision G upper power estimate gives 170 mW, 4.4 h, and 3.6 h at 80% health', () => {
  const L = en => en;
  const rows = eval(src.match(/export const POWER_ROWS = (\[[\s\S]*?\n\]);/)[1]);
  const p = power(rows, {wh: .888, usable: .85});
  assert.equal(p.avgMw, 170);
  assert.equal(p.hours.toFixed(1), '4.4');
  assert.equal(p.at80.toFixed(1), '3.6');
  for (const r of rows) assert.ok(Math.abs(r[1] * r[2] / 100 - r[3]) < .5, 'active × duty = average');
});

test('the indicator curve stays inside the architecture’s ranges', () => {
  assert.equal(Math.round(indicatorCdm2(10)), 30);
  assert.equal(Math.round(indicatorCdm2(1000)), 150);
  assert.equal(Math.round(indicatorCdm2(100000)), 6000);
  for (const lux of [10, 50, 200, 800]) { const c = indicatorCdm2(lux); assert.ok(c >= 30 && c <= 150, `${lux} lux → ${c}`); }
  for (const lux of [10000, 30000, 100000]) { const c = indicatorCdm2(lux); assert.ok(c >= 1500 && c <= 6000, `${lux} lux → ${c}`); }
  let last = 0;
  for (let t = 0; t <= 1; t += .05) { const c = indicatorCdm2(luxAt(t)); assert.ok(c >= last); last = c; }
  assert.ok(Math.abs(tAt(luxAt(.37)) - .37) < 1e-9);
  assert.equal(nice(1523), '1,500');
  assert.equal(nice(148), '150');
});

test('the dimension anchors measure what the drawing says', () => {
  if (!dims.views) return;     // the drawing hasn't been rendered yet
  const fw = dimension(dims.views.front, 'front_width');
  assert.ok(Math.abs(fw.mm - dims.front_width) < .6, `front width ${fw.mm} vs ${dims.front_width}`);
  const lw = dimension(dims.views.front, 'lens_w_left');
  assert.ok(Math.abs(lw.mm - dims.lens_opening_w_x_h[0]) < .6);
  const br = dimension(dims.views.front, 'bridge');
  assert.ok(Math.abs(br.mm - dims.bridge_dbl) < .6);
});
