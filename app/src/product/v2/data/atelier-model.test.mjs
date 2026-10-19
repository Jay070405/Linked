// The prototype's model checks (d2-atelier-prototype/scripts/test.mjs), run against the site's copy, plus the numbers
// the case page quotes, so the print check and the earnings calculator agree with the prototype to the cent.
import test from 'node:test';
import assert from 'node:assert/strict';
import {art, sizes, papers, printCheck, dimensions, fees, variantPrice, money, earnings, checkSentence, largestSharp} from './atelier-model.js';

test('300 dpi checks use the original source dimensions', () => {
  assert.equal(printCheck(art[0], sizes[3]).ok, true);
  assert.equal(printCheck(art[0], sizes[4]).ok, false);
  assert.equal(printCheck(art[1], sizes[3]).ok, false);
  assert.equal(printCheck(art[1], sizes[1]).ok, true);
});
test('portrait and landscape preserve the full composition', () => {
  assert.deepEqual(dimensions(art[0], sizes[3]), {w: 10, h: 8});
  assert.deepEqual(dimensions(art[4], sizes[0]), {w: 2, h: 3});
  for (const a of art) for (const s of sizes) {
    const r = printCheck(a, s);
    const expected = Math.max(a.originalWidth / (r.w - .5), a.originalHeight / (r.h - .5));
    assert.equal(r.dpi, Math.floor(expected));
    assert.equal(r.ok, expected >= 300);
  }
});
test('every painting has at least one sharp size', () => {
  for (const a of art) assert.ok(largestSharp(a));
});
test('fees and all variant prices retain earnings to one cent', () => {
  assert.equal(fees(38), 3.34);
  assert.equal(money(33.3), '$33.30');
  const keep = 38 - 11 - fees(38);
  for (const s of sizes) for (const extra of [0, 4]) {
    const p = variantPrice(38, s.cost - 11 + extra);
    assert.ok(Math.abs(keep - (p - s.cost - extra - fees(p))) < .011);
  }
});
test('the numbers the case page quotes', () => {
  // the Blue Hour at 16 x 12 is the prototype's "264 dpi" refusal; 10 x 8 is its largest sharp size
  assert.match(checkSentence(art[0], sizes[4]), /^16 × 12 in · 264 dpi\. Requires 300 dpi/);
  assert.equal(largestSharp(art[0]).id, '8x10');
  // $38 for a 10 x 8 on studio matte: $11 print, $3.34 fee, $23.66 kept; cotton rag: $19.66, and $42 on cotton rag: $23.34
  assert.deepEqual(earnings(38, sizes[3], papers[0]), {price: 38, printCost: 11, fee: 3.34, keep: 23.66});
  assert.equal(earnings(38, sizes[3], papers[1]).keep, 19.66);
  assert.equal(earnings(42, sizes[3], papers[1]).keep, 23.34);
});
