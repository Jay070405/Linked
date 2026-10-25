import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync, existsSync} from 'node:fs';
import * as content from './about-content.js';
import {resolveProductPath} from './content.js';
import {allWorks, systems, otherProjects} from '../portfolioData.js';
import {badgeHeight, clampOrigin, countText, flickSide, openStations, releaseVelocity, wipeRadius, wrappedYawError} from './about-model.js';

test('Flick uses speed, ignores slow drags/clicks and averages the last 60ms', () => {
  assert.equal(flickSide(0, 'product'), 'product');
  assert.equal(flickSide(500, 'game'), 'game');
  assert.equal(flickSide(-501, 'product'), 'game');
  assert.equal(flickSide(600, 'game'), 'product');
  assert.equal(flickSide(600, 'game', 700), 'game');
  const samples = [{time: 0, x: -200}, {time: 40, x: 0}, {time: 70, x: 30}, {time: 99, x: 60}, {time: 100, x: 60}];
  assert.equal(releaseVelocity(samples, 100), 1000);
  assert.equal(releaseVelocity(samples, 170), 0, 'Holding before release is not a flick');
  // slow frames: moves 70ms apart, released 5ms after the last one, still a fast flick
  const slow = [{time: 0, x: 0}, {time: 70, x: 70}, {time: 140, x: 140}, {time: 210, x: 210}];
  assert.equal(releaseVelocity(slow, 215), 1000);
});
test('Yaw restores to the chosen face along the wrapped shortest angle', () => {
  assert.ok(Math.abs(wrappedYawError(Math.PI, -Math.PI)) < 1e-10);
  assert.ok(Math.abs(wrappedYawError(0, 2 * Math.PI + .1) + .1) < 1e-10);
  assert.ok(Math.abs(wrappedYawError(Math.PI, Math.PI + .1) + .1) < 1e-10);
});
test('Badge height eases between bounded sizes and does not ride on phones', () => {
  assert.equal(badgeHeight(0, 900), 306);
  assert.equal(badgeHeight(350, 900), 261);
  assert.equal(badgeHeight(700, 900), 216);
  assert.equal(badgeHeight(9000, 900), 216);
  assert.equal(badgeHeight(0, 300), 240);
  assert.equal(badgeHeight(800, 300), 180);
  assert.equal(badgeHeight(0, 844, true), badgeHeight(9000, 844, true));
});
test('Station opening includes restored positions at the 47% line', () => {
  assert.deepEqual(openStations([900, 1400, 2200], 977, 900), [true, true, false]);
  assert.deepEqual(openStations([900, 1400], 0, 900), [false, false]);
});
test('Wipe origin stays in view and radius covers all four viewport corners', () => {
  for (const [w,h] of [[1440,900],[1920,900],[1024,768],[390,844]]) {
    const p = clampOrigin({x:-100, y:2000},w,h);
    assert.equal(p.x,60); assert.equal(p.y,h*.8);
    for (const x of [0,w]) for (const y of [0,h]) assert.ok(wipeRadius(p,w,h) > Math.hypot(x-p.x,y-p.y));
  }
});
test('Count-up is clamped, comma-separated and exact with the final suffix', () => {
  assert.equal(countText(6632,'',0),'0');
  assert.equal(countText(6632,'',1),'6,632');
  assert.equal(countText(3000,'+',1),'3,000+');
  assert.equal(countText(3000,'+',.5),'2,625');
  assert.equal(countText(3000,'+',2),'3,000+');
});
function walk(value, fn) {
  if (!value || typeof value !== 'object') return;
  fn(value); Object.values(value).forEach(child => walk(child,fn));
}
test('Every bilingual pair is complete, and every thumbnail exists', () => {
  let pairs=0, images=0;
  walk(content, node => {
    if ('en' in node && ('zh' in node || !('id' in node))) {
      assert.ok(typeof node.en === 'string' && node.en.trim());
      assert.ok(typeof node.zh === 'string' && node.zh.trim()); pairs++;
    }
    for (const key of ['img','src']) if(node[key]) {
      assert.ok(existsSync(new URL('../../public'+node[key],import.meta.url)),node[key]); images++;
    }
  });
  assert.ok(pairs>60); assert.equal(images,14);
});
test('Public copy and both faces contain no retired private identifiers', () => {
  for (const path of ['./about-content.js','../components/assets/jay-badge-product.svg','../components/assets/jay-badge-systems.svg']) {
    assert.doesNotMatch(readFileSync(new URL(path,import.meta.url),'utf8'), /626|0409|xingchen|WeChat|微信/i);
  }
  assert.equal(existsSync(new URL('../components/assets/jay-badge-back.svg',import.meta.url)),false);
});
test('Every href resolves through the real product/router functions or a public asset', async () => {
  // Load the exact pure resolver from the existing router without its browser preloader.
  const source=readFileSync(new URL('../usePortfolioRouting.js',import.meta.url),'utf8');
  const fn=source.slice(source.indexOf('export function resolvePath('),source.indexOf('export function routeFor('));
  const {make}=await import('data:text/javascript;base64,'+Buffer.from(`export const make=(allWorks,systems,resolveProductPath)=>{${fn.replace('export ','')};return resolvePath}`).toString('base64'));
  const resolve=make(allWorks,systems,resolveProductPath);
  walk(content,node=>{
    if(!node.href)return;
    if(node.href.startsWith('/assets/')) assert.ok(existsSync(new URL('../../public'+node.href,import.meta.url)),node.href);
    else {
      assert.ok(node.href.startsWith('/product') ? resolveProductPath(node.href) : resolve(node.href),node.href);
      if(node.href.includes('#')) {
        const id=node.href.split('#')[1];
        assert.ok([...systems,...otherProjects].some(item=>item.id===id && item.href===node.href),`Missing Systems anchor data: ${id}`);
      }
    }
  });
});
