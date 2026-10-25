import test from 'node:test';
import assert from 'node:assert/strict';
import {fixture,cameraAt,loaded,objectArea} from './product-test-fixture.mjs';
import {stationImageOpacity,productFold,productNavScrim,productTubeOpacity,productWhite} from './product-layout.js';

test('every handover sample has a visible product covering at least 6% of 1440 × 900',async()=>{
  const f=fixture();try {
    await loaded(f);const keys=f.hold(3),results=[];
    for(const [i,[start,end]] of [[18.05,18.55],[20.1,20.65],[22.55,23],[24.65,25.1]].entries()) {
      let min=Infinity,at=0,failures=0;
      for(let step=0;step<=Math.round((end-start)*1000);step++) {
        const s=+(start+step*.001).toFixed(3);cameraAt(f,keys,s);f.product.update(s,f.frame);f.scene.updateMatrixWorld(true);
        const area=Math.max(objectArea(f,i),objectArea(f,i+1));
        if(area<min){min=area;at=s;}if(area<.06)failures++;
      }
      results.push({window:[start,end],minPercent:+(min*100).toFixed(4),at,failures});
    }
    console.log('Round 5 projection:',JSON.stringify(results));
    for(const r of results)assert.equal(r.failures,0,JSON.stringify(r));
  } finally {f.dispose();}
});

test('images leave on schedule and the four product images return assembled before shrinking to anchors',async()=>{
  const f=fixture();try {
    await loaded(f);f.hold(3);
    for(const [i,a,b] of [[0,18.25,18.5],[1,20.35,20.6],[2,22.7,22.95]]) {
      assert.equal(stationImageOpacity(i,a),1);assert.ok(Math.abs(stationImageOpacity(i,(a+b)/2)-.5)<1e-9);
      f.product.update(b,f.frame);
      f.scene.children[i].children.filter(m=>m.material.uniforms).forEach(m=>assert.equal(m.material.uniforms.opacity.value,0));
    }
    for(const s of [27.1,27.2,27.6,28]) {
      f.product.update(s,f.frame);f.scene.updateMatrixWorld(true);
      for(let i=0;i<4;i++) {
        const image=f.scene.children[i].children[0];
        assert.ok(Math.abs((i===3?image.userData.opacity:image.material.uniforms.opacity.value)-stationImageOpacity(i,s))<1e-9);
        assert.equal(f.scene.children[i].scale.x,Math.max(.001,1-productFold(s)));
      }
      assert.ok(Math.abs(f.scene.children[3].children[0].rotation.y+35*Math.PI/180)<1e-9);
      for(const selector of ['[data-product-tag]','[data-product-chip]'])f.root.querySelectorAll(selector).forEach(el=>assert.equal(+el.style.opacity,0));
      assert.equal(+f.root.querySelector('.os-product-code').style.opacity,0);
    }
  } finally {f.dispose();}
});

test('chart flag has its own line and clears navigation in EN/ZH at every hold width',()=>{
  const f=fixture();try {
    for(const w of [1280,1440,1920])for(const lang of ['en','zh']) {
      f.hold(4,w);f.root.querySelector('[data-cost-controls]').dataset.lang=lang;f.product.update(26.7,f.frame);
      const flag=f.root.querySelector('[data-cost-flag]'),chips=f.root.querySelector('[data-cost-controls]');
      assert.equal(parseFloat(chips.style.top)-parseFloat(flag.style.top),34);
      assert.ok(parseFloat(flag.style.top)-13*1.5/2>=72+48,`${w}: flag/nav clearance`);
      if(lang==='zh')assert.equal(flag.textContent,'Plan B：每年多 $600 · 保障与 Plan A 相同');
    }
  } finally {f.dispose();}
});

test('navigation scrim and outgoing tube use the requested boundaries',()=>{
  for(const [s,a] of [[16.15,0],[16.3,1],[28.65,1],[28.8,0]])assert.ok(Math.abs(productNavScrim(s)-a)<1e-9);
  assert.equal(productTubeOpacity(29.29),1);assert.equal(productTubeOpacity(29.3),0);assert.ok(productWhite(29.29)>.99);
  for(const s of [29.4,29.5])assert.equal(productTubeOpacity(s),0);
});
