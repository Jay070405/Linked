// The prototype's own tests (d4-choose-not-to-lose-prototype/src/model.test.ts), run against the site's copy of its
// model, so the bills slider and the plan quiz use arithmetic that is known to match the prototype.
import test from 'node:test';
import assert from 'node:assert/strict';
import {plans, scenarios, annualPremium, worstYear, cost, scenarioCost, dominates, dominator, rankedPlans, premiumDifference, totalDifference, money, rate} from './cntl-model.js';

test('annual premiums and worst covered years, all four plans', () => {
  assert.deepEqual(plans.map(annualPremium), [216000, 276000, 132000, 360000]);
  assert.deepEqual(plans.map(worstYear), [816000, 876000, 882000, 710000]);
});
test('known scenario totals, independent hand-calculated fixtures', () => {
  assert.deepEqual(plans.map(p => scenarios.map(s => scenarioCost(p, s.id).total)), [
    [246000, 416000, 816000], [306000, 476000, 876000],
    [162000, 476000, 882000], [390000, 445000, 710000],
  ]);
});
test('deductible, coinsurance and cap boundaries', () => {
  const a = plans[0];
  assert.equal(cost(a, 0).total, 216000);
  assert.equal(cost(a, 149999).deductible, 149999);
  assert.equal(cost(a, 150000).coinsurance, 0);
  assert.equal(cost(a, 150003).coinsurance, 1);
  assert.deepEqual(cost(a, 400000), {premium: 216000, deductible: 150000, coinsurance: 50000, outOfPocket: 200000, total: 416000, capped: false, remainingCharges: 250000});
  assert.equal(cost(a, 2400000).capped, false);
  assert.equal(cost(a, 2400100).capped, true);
  assert.equal(cost(a, 4000000).coinsurance, 450000);
  assert.equal(cost(a, 999999999).total, worstYear(a));
});
test('only B is flagged, using all-spend terms rather than three observations', () => {
  assert.deepEqual(plans.map(p => dominator(p)?.id), [undefined, 'a', undefined, undefined]);
  assert.equal(dominates(plans[0], plans[1]), true);
  assert.equal(dominates(plans[1], plans[0]), false);
  assert.equal(dominates(plans[0], plans[0]), false);
  assert.equal(dominates(plans[2], plans[0]), false);
  assert.equal(premiumDifference(plans[1], plans[0]), 60000);
  for (const s of scenarios) assert.equal(totalDifference(plans[1], plans[0], s.id), 60000);
});
test('cost conservation, monotonicity, and dominance over a wide spend sweep', () => {
  for (const p of plans) {
    let previous = 0;
    for (let charges = 0; charges <= 10000000; charges += 7919) {
      const b = cost(p, charges);
      assert.equal(b.total, b.premium + b.deductible + b.coinsurance);
      assert.ok(b.outOfPocket <= p.oopMax && b.outOfPocket <= charges);
      assert.ok(b.total >= previous);
      assert.equal(cost(plans[1], charges).total - cost(plans[0], charges).total, 60000);
      previous = b.total;
    }
  }
});
test('ranks change with scenarios, ties retain alphabetic order', () => {
  assert.deepEqual(rankedPlans('low').map(p => p.id), ['c', 'a', 'b', 'd']);
  assert.deepEqual(rankedPlans('typical').map(p => p.id), ['a', 'd', 'b', 'c']);
  assert.deepEqual(rankedPlans('high').map(p => p.id), ['d', 'a', 'b', 'c']);
});
test('invalid inputs fail explicitly; dollar and rate presentation', () => {
  for (const input of [-1, NaN, Infinity, 1.5]) assert.throws(() => cost(plans[0], input), RangeError);
  assert.throws(() => cost({...plans[0], oopMax: 1}, 100), RangeError);
  assert.throws(() => cost({...plans[0], coinsuranceBps: 10001}, 100), RangeError);
  assert.equal(money(416000), '$4,160');
  assert.equal(money(7500), '$75');
  assert.equal(money(7550), '$75.50');
  assert.equal(rate(2000), '20%');
});
test('the $40,000 illustrative endpoint equals each covered-care maximum plus annual premiums', () => {
  for (const p of plans) {
    assert.equal(scenarioCost(p, 'high').total, worstYear(p));
    assert.equal(scenarioCost(p, 'high').outOfPocket, p.oopMax);
  }
});
// The bills slider runs $0 to $40,000 in $250 steps: Plan B stays exactly $600 above Plan A at every stop.
test('bills slider range: B above A by $600 at every step', () => {
  for (let dollars = 0; dollars <= 40000; dollars += 250) assert.equal(cost(plans[1], dollars * 100).total - cost(plans[0], dollars * 100).total, 60000);
});
