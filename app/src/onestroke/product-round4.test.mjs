import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Scene,Vector3,Quaternion,PerspectiveCamera} from 'three';
import {createProductScene} from './product-scene.js';
import {ARDEN_FRAME_ORDER,nearestArdenFrame} from './arden-film.js';
import {PRODUCT_STATIONS, ARDEN_SIZE, ARDEN_BOUNDS, DRAW_BEATS} from './product-layout.js';
import {plans,scenarios,scenarioCost,totalDifference,dominates,annualPremium,money} from '../product/v2/data/cntl-model.js';
import {PACING,toScroll} from './pacing.js';

const positions=JSON.parse(readFileSync(new URL('../../public/assets/product/arden/film/explode/parts.json',import.meta.url),'utf8'));
const center=new Vector3(13750,2404.3,-15340);
function element(dataset={}) {
  const children=new Map(),listeners=new Map(),attributes=new Map();
  return {style:{},dataset,textContent:'',classList:{toggle(){}},matches(){return false;},focus(){},
    addEventListener(k,f){listeners.set(k,f);},removeEventListener(k){listeners.delete(k);},
    fire(k,e={}){listeners.get(k)?.({stopPropagation(){},preventDefault(){},...e});},
    setAttribute(k,v){attributes.set(k,v);},getAttribute(k){return attributes.get(k);},
    querySelector(k){if(!children.has(k))children.set(k,element());return children.get(k);}};
}
function fixture() {
  const single=new Map(),multi=new Map();
  const root={querySelector(k){if(!single.has(k))single.set(k,element({lang:'en'}));return single.get(k);},querySelectorAll(k){
    if(!multi.has(k)) {
      let data=Array.from({length:k.includes('product-tag')?2:k.includes('product-chip')?6:4},()=>({}));
      if(k==='[data-arden-part]')data=['projector','board','camera','battery'].map(ardenPart=>({ardenPart}));
      if(k==='[data-cost-scenario]')data=scenarios.map(s=>({costScenario:s.id}));
      multi.set(k,data.map(element));
    }return multi.get(k);
  }};
  const originals={Image:globalThis.Image,document:globalThis.document,fetch:globalThis.fetch};
  const requests=[],draws=[];
  globalThis.document={createElement(){return {getContext(){return {clearRect(){},drawImage(im){draws.push(im.src);}};}};}};
  globalThis.Image=class {set src(v){this.url=v;if(v)requests.push(this);}get src(){return this.url;}};
  globalThis.fetch=async()=>({ok:true,json:async()=>positions});
  const scene=new Scene(),product=createProductScene({scene,root,center,scale:1,alive:()=>true});
  const cam=new PerspectiveCamera(24,1.6,5,120000);
  const frame={cam,w:1440,h:900,px:0,py:0,time:1,dt:1,pointer:{inside:false},hitTest:()=>null,stone:{position:center,quaternion:new Quaternion()}};
  function hold(i,w=1440) {
    const keys=[];product.keys((s,pos,look)=>keys.push({s,pos,look}),w,900);
    const key=keys.find(k=>k.s===PRODUCT_STATIONS[i].hold[1]);
    cam.aspect=w/900;cam.updateProjectionMatrix();cam.position.copy(key.pos);cam.lookAt(key.look);cam.updateMatrixWorld();frame.w=w;
    return keys;
  }
  return {root,scene,product,frame,requests,draws,hold,dispose(){product.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});Object.assign(globalThis,originals);}};
}
const screen=(at,cam,w,h=900)=>{const p=at.clone().project(cam);return [(p.x+1)*w/2,(1-p.y)*h/2];};
const bounds=points=>[Math.min(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[0])),Math.max(...points.map(p=>p[1]))];

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
    f.product.update(10.9,f.frame);assert.deepEqual(f.requests.map(im=>im.src),[...PRODUCT_STATIONS.slice(0,3).map(s=>s.image),'/assets/product/arden/film/explode/001.webp','/assets/product/arden/film/explode/036.webp']);
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
    f.product.update(25.4,f.frame);assert.equal(values[0].textContent,money(annualPremium(plans[0])));
  } finally {f.dispose();}
});

test('fixed Arden label envelopes never collide with each other or the caption',async()=>{
  const f=fixture();try {
    f.product.update(10.9,f.frame);for(let i=0;i<f.requests.length;i++)f.requests[i].onload?.();
    await new Promise(resolve=>setImmediate(resolve));
    const overlap=(a,b)=>a[0]<b[2]&&a[2]>b[0]&&a[1]<b[3]&&a[3]>b[1];
    for(const w of [1280,1440,1920]) {
      f.hold(3,w);
      for(let s=24.2;s<24.8;s+=.01) {
        f.product.update(s,f.frame);
        // CSS max-width envelopes, 3 mono lines: conservative for both EN/ZH.
        const rectangles=f.root.querySelectorAll('[data-arden-part]').map((el,i)=>{
          const x=parseFloat(el.style.left),y=parseFloat(el.style.top);
          return [[x-187,y-72,x-22,y-19],[x-105,y-82,x+105,y-29],[x-175,y+29,x,y+82],[x+22,y+22,x+172,y+75]][i];
        });
        rectangles.forEach((a,i)=>{
          assert.ok(!overlap(a,[160,610,160+Math.min(380,w*.27),838]),`${w} at ${s}: caption`);
          rectangles.slice(i+1).forEach(b=>assert.ok(!overlap(a,b),`${w} at ${s}: ${a} / ${b}`));
        });
      }
      f.product.update(24.5,f.frame);
      const el=f.root.querySelectorAll('[data-arden-part]')[0],pointer={inside:true,x:parseFloat(el.style.left),y:parseFloat(el.style.top)};
      assert.equal(f.product.update(24.5,{...f.frame,pointer}),3);
      assert.ok(f.root.querySelector('[data-arden-hover]').querySelector('span').textContent.includes('projector'));
      assert.equal(+el.style.opacity,.35);
    }
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
