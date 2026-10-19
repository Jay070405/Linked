// node --test src/product/worlds/choose-not-to-lose/year-mix.test.mjs
// "Roll your year" draws made-up bills; these checks pin down that the plan math under it is the model's, and that
// Plan B can't come out cheapest in any year, under any of the illustrative mixes.
import test from 'node:test';
import assert from 'node:assert/strict';
import {cost, plans} from '../../v2/data/cntl-model.js';
import {MIXES, bDominator, drawBills, priceYear, seeded, simulate} from './year-mix.js';

test('every drawn year is whole dollars in cents, never negative', () => {
  const rand = seeded(7);
  for (const mix of MIXES) for (let i = 0; i < 5000; i++) {
    const b = drawBills(mix.id, rand);
    assert.ok(Number.isSafeInteger(b) && b >= 0 && b % 100 === 0, `${mix.id}: ${b}`);
  }
});

test('a year is priced by the prototype model, plan by plan', () => {
  for (const bills of [0, 30000, 255000, 400000, 690000, 4000000, 9000000]) {
    const y = priceYear(bills);
    assert.deepEqual(y.rows.map(r => r.total), plans.map(p => cost(p, bills).total));
    assert.equal(y.low, Math.min(...y.rows.map(r => r.total)));
  }
});

test('Plan B is never the cheapest year, under every mix', () => {
  for (const mix of MIXES) {
    const {tally, years} = simulate(20000, mix.id, seeded(mix.id.length * 31));
    assert.equal(tally.b, 0, mix.id);
    // and it is exactly $600 above Plan A in each of those years
    for (const y of years) assert.equal(y.rows[1].total - y.rows[0].total, 60000);
  }
});

test('the mixes are what move the winners, not the plans', () => {
  const light = simulate(4000, 'light', seeded(3)).tally, heavy = simulate(4000, 'heavy', seeded(3)).tally;
  assert.ok(light.c > light.d && heavy.d > heavy.c);
});

test('Plan A is the plan that beats B on every term', () => {
  assert.equal(bDominator()?.id, 'a');
});

test('mix shares add up to one', () => {
  for (const mix of MIXES) assert.ok(Math.abs(mix.parts.reduce((s, p) => s + p.share, 0) - 1) < 1e-9, mix.id);
});
