import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateTarget,matchBand,seriesState,seriesFor,SERIES} from './lol-model.js';
test('target estimate uses only the observed rate range',()=>{
  assert.deepEqual(estimateTarget().hours,[10,15]);
  assert.equal(estimateTarget({history:false}).hours,null);
  assert.equal(estimateTarget({rateLow:0}).status,'insufficient');
  assert.equal(estimateTarget({rateLow:300,rateHigh:200}).status,'insufficient');
  assert.equal(estimateTarget({paid:false}).needsPass,true);
  assert.equal(estimateTarget({paid:false,paidReward:false}).needsPass,false);
  assert.equal(estimateTarget({current:12000,history:false}).status,'reached');
  assert.equal(estimateTarget({current:13000}).remaining,0);
});
test('matching thresholds and missing values are unambiguous',()=>{
  for(const [delta,expected] of [[0,'close'],[24,'close'],[25,'slight'],[74,'slight'],[75,'wide']]) assert.equal(matchBand(1500,1500+delta).kind,expected);
  assert.equal(matchBand(1510,1500).higher,'blue');
  assert.equal(matchBand(null,1575).kind,'unavailable');
  assert.equal(matchBand(NaN,1575).kind,'unavailable');
});
test('both teams consume the pool, and a sweep ends at game two',()=>{
  const all=SERIES.flatMap(r=>[...r.blue,...r.red]);
  assert.equal(new Set(all).size,30);
  assert.deepEqual([1,2,3].map(r=>seriesState(r).available),[160,150,140]);
  assert.equal(seriesState(2).used.length,10);
  assert.ok(seriesState(2).used.includes('Fiora'));
  for(const round of [1,2,3]) {
    const state=seriesState(round);
    assert.ok([...state.current.blue,...state.current.red].every(id=>!state.used.includes(id)));
  }
  assert.equal(seriesFor('2-0').length,2);
  assert.equal(seriesState(3,'2-0').round,2);
  assert.equal(seriesState(3,'2-0').championLineup.length,10);
  assert.equal(seriesState(3,'2-1').championLineup.length,15);
});
