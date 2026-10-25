import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3,PerspectiveCamera} from 'three';
import {fixture,loaded,cameraAt,objectArea} from './product-test-fixture.mjs';
import {motionProxy,HANDOVERS} from './product-motion-proxy.mjs';
import baseline from './product-motion-baseline.json' with {type:'json'};
import {PRODUCT_STATIONS,DRAW_BEATS,captionPose,productSignOpacity,portalDiscCoversHalf} from './product-layout.js';

test('100px wheel motion p90 drops at least 40% in every handover against HEAD 1807436',async()=>{
  const after=await motionProxy();
  after.forEach((r,i)=>{
    assert.equal(r.samples,23,'every full notch has a visible tracked object');
    assert.ok(r.p90<=baseline.results[i].p90*.6,JSON.stringify(r));
    assert.ok(r.max<baseline.results[i].max,JSON.stringify(r));
  });
  console.log('Round 6 motion proxy:',JSON.stringify({before:baseline.results,after}));
});

test('midpoint keys look between the stations, pull back, and retain both projected objects',async()=>{
  const f=fixture();try {
    await loaded(f);const keys=f.hold(3);
    HANDOVERS.forEach(([a,b],i)=>{
      const outgoing=keys.find(k=>k.s===a),incoming=keys.find(k=>k.s===b),mid=keys.find(k=>Math.abs(k.s-(a+b)/2)<1e-8);
      assert.ok(mid.look.distanceTo(outgoing.look.clone().lerp(incoming.look,.5))<1e-8);
      const ratio=mid.pos.distanceTo(mid.look)/Math.max(outgoing.pos.distanceTo(outgoing.look),incoming.pos.distanceTo(incoming.look));
      assert.ok(ratio>=1.32&&ratio<=1.41);
      cameraAt(f,keys,mid.s);f.product.update(mid.s,f.frame);f.scene.updateMatrixWorld(true);
      assert.ok(objectArea(f,i)>0,`outgoing ${i}`);
      assert.ok(objectArea(f,i+1)>0,`incoming ${i+1}`);
    });
  } finally {f.dispose();}
});

test('PRODUCT owns its title beat, then phone and caption reveal without overlap',async()=>{
  const f=fixture();try {
    await loaded(f);f.hold(0);
    for(const s of [15.8,15.95,16.15]) {
      assert.equal(productSignOpacity(s),1);
      f.product.update(s,f.frame);
      for(let i=0;i<5;i++)assert.equal(+f.root.querySelector(`[data-os-product="${i}"]`).style.opacity,0);
      f.scene.children.slice(0,5).forEach(g=>assert.equal(g.visible,false));
    }
    assert.ok(Math.abs(productSignOpacity(16.25)-.5)<1e-8);assert.equal(productSignOpacity(16.35),0);
    assert.deepEqual(DRAW_BEATS[0],[16.25,16.5]);assert.deepEqual(PRODUCT_STATIONS[0].hold,[16.7,18.05]);
    assert.equal(captionPose(0,16.35).opacity,0);assert.ok(captionPose(0,16.55).opacity>1-1e-8);
    f.product.update(16.25,f.frame);assert.equal(f.scene.children[0].children[0].material.uniforms.reveal.value,0);
    f.product.update(16.5,f.frame);assert.ok(f.scene.children[0].children[0].material.uniforms.reveal.value>=1);
    // The actual title geometry fits even the narrowest desktop through the push.
    for(const w of [1280,1440,1920])for(const x of [420,650]) {
      const cam=new PerspectiveCamera(24,w/900,5,120000);cam.position.set(x,0,0);cam.lookAt(3000,0,0);cam.updateMatrixWorld();
      for(const y of [-280,280])for(const z of [-650,650]) {
        const p=new Vector3(2900,y,z).project(cam);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1);
      }
    }
  } finally {f.dispose();}
});

test('navigation changes tone at majority disc coverage, before crossing the portal',()=>{
  for(const w of [1280,1440,1920]) {
    assert.equal(portalDiscCoversHalf(300,w,900),false);
    assert.equal(portalDiscCoversHalf(Math.hypot(w,900)/2,w,900),true);
    // At S 15.75 the cubic approach is still on the paper side of the ring.
    const t=(15.75-15.15)/(15.8-15.15),distance=2900-3320*t*t*t;
    assert.ok(distance>0);assert.ok(portalDiscCoversHalf(297*900/(2*Math.tan(Math.PI/15)*distance),w,900));
  }
});
