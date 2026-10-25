import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {fixture,screen,bounds,cameraAt,loaded,objectArea} from './product-test-fixture.mjs';
import {ARDEN_SIZE,ARDEN_BOUNDS,stationImageOpacity,productFold,productNavScrim,productTubeOpacity} from './product-layout.js';
import {ARDEN_PARTS} from './arden-parts.js';

test('every handover sample has a visible product covering at least 6% of 1440 × 900',async()=>{
  const f=fixture();try {
    await loaded(f);const keys=f.hold(3),results=[];
    for(const [i,[start,end]] of [[18.05,18.55],[20.1,20.65],[22.55,23],[24.65,25.1]].entries()) {
      let min=Infinity,at=0,failures=0;
      for(let step=0;step<=Math.round((end-start)*100);step++) {
        const s=+(start+step*.01).toFixed(2);cameraAt(f,keys,s);f.product.update(s,f.frame);f.scene.updateMatrixWorld(true);
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
        assert.ok(Math.abs(image.material.uniforms.opacity.value-stationImageOpacity(i,s))<1e-9);
        assert.equal(f.scene.children[i].scale.x,Math.max(.001,1-productFold(s)));
      }
      assert.equal(f.draws.at(-1),'/assets/product/arden/film/explode/001.webp');
      for(const selector of ['[data-product-tag]','[data-product-chip]'])f.root.querySelectorAll(selector).forEach(el=>assert.equal(+el.style.opacity,0));
      assert.equal(+f.root.querySelector('.os-product-code').style.opacity,0);
    }
  } finally {f.dispose();}
});

test('Arden fixed labels stay single-line and clear each other, stem, caption and viewport in EN/ZH',async()=>{
  const f=fixture();try {
    await loaded(f);
    const overlap=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
    for(const w of [1280,1440,1920])for(const lang of ['en','zh']) {
      const keys=f.hold(3,w),els=f.root.querySelectorAll('[data-arden-part]');
      for(const el of els) {
        const text=ARDEN_PARTS.find(p=>p.id===el.dataset.ardenPart)[lang],span=el.querySelector('span');
        // 12px mono Latin + full-em CJK, rounded up, including 7px padding.
        span.offsetWidth=Math.ceil([...text].reduce((n,c)=>n+(c.codePointAt(0)>255?12:7.3),14));span.offsetHeight=24;
      }
      for(let step=0;step<60;step++) {
        const s=24.2+step*.01;cameraAt(f,keys,s);f.product.update(s,f.frame);
        const stem=screen(f.product.layout.anchors[3],f.frame.cam,w)[0];
        const film=f.scene.children[3].children[0];film.updateMatrixWorld(true);
        const [x0,y0,x1,y1]=ARDEN_BOUNDS[2];
        const content=bounds([[x0,y0],[x1,y1]].map(([x,y])=>screen(new Vector3((x-.5)*ARDEN_SIZE[0],(.5-y)*ARDEN_SIZE[1],.15).applyMatrix4(film.matrixWorld),f.frame.cam,w)));
        const rectangles=els.map(el=>{const span=el.querySelector('span'),x=parseFloat(el.style.left)+parseFloat(span.style.left),y=parseFloat(el.style.top)+parseFloat(span.style.top);return [x,y,x+span.offsetWidth,y+span.offsetHeight];});
        rectangles.forEach((a,i)=>{
          assert.ok(a[0]>=stem+16-1e-6&&a[2]<=w-24+1e-6&&a[1]>=24&&a[3]<=876,`${w} ${lang}: ${a}`);
          assert.ok(!overlap(a,[160,610,160+Math.min(380,w*.27),838]),`${w} ${lang}: caption`);
          assert.ok(!overlap(a,content),`${w} ${lang}: film content`);
          const dot=[parseFloat(els[i].style.left),parseFloat(els[i].style.top)];
          assert.ok(!overlap(a,[dot[0]-2.5,dot[1]-2.5,dot[0]+2.5,dot[1]+2.5]),`${w} ${lang}: part dot`);
          const points=els[i].querySelector('path').getAttribute('d').match(/[-\d.]+/g).map(Number);
          assert.ok(points.length===4||points.length===6);assert.deepEqual(points.slice(0,2),[0,0]);
          if(points.length===6)assert.ok((points[2]===0&&points[5]===points[3])||(points[3]===0&&points[4]===points[2]),'one right-angle bend');
          rectangles.slice(i+1).forEach(b=>assert.ok(!overlap(a,b),`${w} ${lang} ${s}: ${a} / ${b}`));
        });
      }
      f.product.update(24.5,f.frame);
      const el=els[0],pointer={inside:true,x:parseFloat(el.style.left),y:parseFloat(el.style.top)};
      assert.equal(f.product.update(24.5,{...f.frame,pointer}),3);assert.equal(+el.style.opacity,.35);
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
  for(const [s,a] of [[15.8,0],[15.95,1],[28.65,1],[28.8,0]])assert.ok(Math.abs(productNavScrim(s)-a)<1e-9);
  assert.equal(productTubeOpacity(29.27),1);assert.ok(productTubeOpacity(29.36)<1e-9);
  for(const s of [29.4,29.5])assert.equal(productTubeOpacity(s),0);
});
