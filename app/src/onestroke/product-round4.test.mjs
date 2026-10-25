import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Vector3} from 'three';
import {ARDEN_FRAME_ORDER,nearestArdenFrame} from './arden-film.js';
import {PRODUCT_STATIONS, ARDEN_SIZE, ARDEN_BOUNDS, DRAW_BEATS} from './product-layout.js';
import {plans,scenarios,scenarioCost,totalDifference,dominates,annualPremium,money} from '../product/v2/data/cntl-model.js';
import {PACING,toScroll} from './pacing.js';

import {fixture,screen,bounds} from './product-test-fixture.mjs';

test('Round 4 wheel points are monotone and handovers get 1.7 screens',()=>{
  assert.deepEqual(PACING.filter(([s])=>s>14.2),[[15.8,32.27],[16.4,34],[18.05,36.8],[18.55,38.5],[20.1,40.9],[20.65,42.6],[22.55,45.9],[23,47.6],[24.65,50.9],[25.1,52.6],[26.85,55.6],[28,57.7],[28.8,59.2],[29.3,60.8],[31.2,64.4]]);
  for(const [a,b] of [[18.05,18.55],[20.1,20.65],[22.55,23],[24.65,25.1]])assert.ok(Math.abs(toScroll(b)-toScroll(a)-1.7)<1e-9);
  for(let s=0;s<31.2;s+=.001)assert.ok(toScroll(s+.001)>toScroll(s));
});

test('Plan A dominates B and the proof is identical in every scenario; winners follow bills',()=>{
  assert.ok(dominates(plans[0],plans[1]));
  assert.deepEqual(scenarios.map(s=>totalDifference(plans[1],plans[0],s.id)),[60000,60000,60000]);
  assert.deepEqual(scenarios.map(s=>[...plans].sort((a,b)=>scenarioCost(a,s.id).total-scenarioCost(b,s.id).total)[0].id),['c','a','d']);
});

test('film requests wait until 10.9, load once coarse-to-fine, and reuse one texture',async()=>{
  const f=fixture();try {
    f.hold(3);f.product.update(10.89,f.frame);assert.equal(f.requests.length,0);
    f.product.update(10.9,f.frame);assert.deepEqual(f.requests.map(im=>im.src),[...PRODUCT_STATIONS.filter(s=>s.image).map(s=>s.image),'/assets/product/arden/film/explode/001.webp','/assets/product/arden/film/explode/036.webp']);
    for(let i=0;i<f.requests.length;i++)f.requests[i].onload?.();
    await new Promise(resolve=>setImmediate(resolve));
    const arden=f.scene.children[3].children[0],texture=arden.material.uniforms.map.value;
    for(const s of [23,23.8,24.35,24.65,25.05,27,0,24.35])f.product.update(s,f.frame);
    assert.equal(arden.material.uniforms.map.value,texture);assert.ok(texture.isCanvasTexture);
    assert.equal(f.requests.length,39);assert.equal(f.draws.at(-1),'/assets/product/arden/film/explode/036.webp');
    assert.deepEqual(f.requests.slice(3).map(im=>Number(im.src.match(/(\d+)\.webp/)[1])),ARDEN_FRAME_ORDER);
    assert.equal(new Set(ARDEN_FRAME_ORDER).size,36);assert.equal(nearestArdenFrame(new Map([[1,{}],[36,{}]]),18),1);
    assert.equal(f.product.drawn.ends.length,8);assert.equal(DRAW_BEATS.length,8);
  } finally {f.dispose();}
});

test('Arden and chart hold projections fit all three desktop viewports',()=>{
  const f=fixture();try {
    for(const w of [1280,1440,1920]) {
      f.hold(3,w);const layout=f.product.layout;
      const boxes=ARDEN_BOUNDS.map(([x0,y0,x1,y1])=>bounds([[x0,y0],[x1,y1]].map(([x,y])=>screen(layout.centers[3].clone().add(new Vector3((x-.5)*ARDEN_SIZE[0],(.5-y)*ARDEN_SIZE[1],0)),f.frame.cam,w))));
      const stem=screen(layout.anchors[3],f.frame.cam,w)[0];
      boxes.forEach(box=>{assert.ok(box[0]-stem>=40,`${w}: stem clearance ${box[0]-stem}`);assert.ok(w-box[2]>=64,`${w}: edge ${w-box[2]}`);assert.ok(box[0]>160+Math.min(380,w*.27));});
      assert.ok(Math.abs((boxes[2][2]-boxes[2][0])/w-.44)<.001);assert.ok(Math.abs((boxes[2][1]+boxes[2][3])/2-405)<1);
      f.hold(4,w);
      const start=screen(layout.world([308,299]),f.frame.cam,w),foot=screen(layout.world([409,359]),f.frame.cam,w);
      const chart=[start[0]-64,start[1]-18,foot[0],foot[1]+86];
      assert.ok(chart[0]-(160+Math.min(380,w*.27))>=60);assert.ok(w-chart[2]>=64);assert.ok(chart[1]>=72+48);
      assert.ok(Math.abs((chart[2]-chart[0])/w-.46)<.001);
      console.log(JSON.stringify({viewport:[w,900],arden:boxes.map(b=>b.map(n=>+n.toFixed(1))),stem:+stem.toFixed(1),chart:chart.map(n=>+n.toFixed(1))}));
    }
  } finally {f.dispose();}
});

test('chart preview restores selection; keyboard selects; values glide and hidden chips disable',()=>{
  const f=fixture();try {
    f.hold(4);const chips=f.root.querySelectorAll('[data-cost-scenario]'),values=f.root.querySelectorAll('[data-cost-value]');
    const update=dt=>f.product.update(26.7,{...f.frame,dt});update(1);
    assert.equal(values[0].textContent,money(scenarioCost(plans[0],'typical').total));
    chips[0].fire('pointerenter');update(.175);
    assert.notEqual(values[0].textContent,money(scenarioCost(plans[0],'low').total));update(.175);
    assert.equal(values[0].textContent,money(scenarioCost(plans[0],'low').total));
    chips[0].fire('pointerleave');update(.35);assert.equal(chips[1].getAttribute('aria-pressed'),'true');
    chips[2].fire('click');update(.35);assert.equal(chips[2].getAttribute('aria-pressed'),'true');
    chips[2].fire('keydown',{key:'Home'});update(.35);assert.equal(chips[0].getAttribute('aria-pressed'),'true');
    f.product.update(27.4,f.frame);assert.ok(chips.every(c=>c.disabled&&c.tabIndex===-1));
    assert.equal(f.root.querySelector('[data-cost-controls]').style.visibility,'hidden');
    f.product.update(25.25,f.frame);assert.equal(values[0].textContent,money(annualPremium(plans[0])));
  } finally {f.dispose();}
});

test('unchanged first three product holds remain framed and handovers retain a visible surface',()=>{
  const f=fixture();try {
    f.product.update(10.9,f.frame);for(let i=0;i<f.requests.length;i++)f.requests[i].onload?.();
    for(const w of [1280,1440,1920])for(let i=0;i<3;i++) {
      f.hold(i,w);f.product.update(PRODUCT_STATIONS[i].hold[1],f.frame);f.scene.updateMatrixWorld(true);
      const pts=[];f.scene.children[i].traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;
        for(let j=0;j<p.count;j++)pts.push(screen(new Vector3().fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld),f.frame.cam,w));});
      const box=bounds(pts);assert.ok(box[0]>160+Math.min(380,w*.27));assert.ok(box[2]<w-25);
      if(i===0){const phone=f.scene.children[0].children[0],p=phone.geometry.attributes.position,ys=[];
        for(let j=0;j<p.count;j++)ys.push(screen(new Vector3().fromBufferAttribute(p,j).applyMatrix4(phone.matrixWorld),f.frame.cam,w)[1]);
        const height=Math.max(...ys)-Math.min(...ys);assert.ok(height>=405&&height<=495);
      }
    }
    const keys=f.hold(3);
    for(const [start,end] of [[15.98,16.4],[20.1,20.65],[22.55,23.1]]) {
      let bare=null,longest=0;
      for(let s=start;s<=end;s+=.005) {
        const b=keys.find(k=>k.s>s),a=keys[keys.indexOf(b)-1],t=Math.max(0,Math.min(1,(s-a.s)/(b.s-a.s))),e=t<.5?4*t*t*t:1-(-2*t+2)**3/2;
        f.frame.cam.position.copy(a.pos).lerp(b.pos,e);f.frame.cam.lookAt(a.look.clone().lerp(b.look,e));f.frame.cam.updateMatrixWorld();
        f.product.update(s,f.frame);f.scene.updateMatrixWorld(true);let coverage=0;
        f.scene.traverse(o=>{const u=o.material?.uniforms;if(!o.visible||!u?.map||u.opacity.value<.15)return;
          const pts=[];for(let x=.1;x<.91;x+=.1)for(let y=.1;y<.91;y+=.1){
            if(1-y>u.reveal.value||x>u.wipe.value)continue;
            const v=new Vector3((x-.5)*u.size.value.x,(y-.5)*u.size.value.y,0).applyMatrix4(o.matrixWorld).project(f.frame.cam);
            if(v.z>-1&&v.z<1&&Math.abs(v.x)<.98&&Math.abs(v.y)<.95)pts.push([v.x,v.y]);
          }if(pts.length>2){const box=bounds(pts);coverage+=(box[2]-box[0])*(box[3]-box[1])/4;}
        });
        if(coverage<.012&&bare===null)bare=s;
        if(bare!==null)longest=Math.max(longest,toScroll(s)-toScroll(bare));
        if(coverage>=.012)bare=null;
      }assert.ok(longest<.45,`${start} to ${end}: ${longest} bare wheel screens`);
    }
  } finally {f.dispose();}
});

test('match cut holds camera until 29.45 and chart axis arrives before Arden disappears',()=>{
  const f=fixture();try {
    const keys=f.hold(3),a=keys.find(k=>k.s===28.8),b=keys.find(k=>k.s===29.45);
    assert.deepEqual(a.pos,b.pos);assert.deepEqual(a.look,b.look);
    assert.ok(keys.every((k,i)=>!i||k.s>keys[i-1].s));
    f.hold(4);
    for(let s=24.85;s<=25.2;s+=.01){f.product.update(s,f.frame);if(s>=25)assert.ok(+f.root.querySelector('[data-cost-axis]').style.opacity>.4);}
    const engine=readFileSync(new URL('./engine.js',import.meta.url),'utf8');
    assert.ok(!engine.includes('endIn'));assert.ok(!engine.includes('k(29.3,'));assert.ok(engine.includes('jlEnd.visible = S > 29.28'));
  } finally {f.dispose();}
});
