import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3, Quaternion, Euler, PerspectiveCamera} from 'three';
import {jlStrokes2D, jlPose, makePose, copyPose, N, Tube, LOGO_C, poseFromStrokes} from './line.js';
import {PRODUCT_STATIONS, productAnchors2D, productLayout, COST_BARS, COST_DIFFERENCE, ROUTE_PIXELS, DRAW_BEATS, strokeReveal, alignProductMark, MARK_FACE_Z, retractProductOutlines, captionOpacity, productWhite} from './product-layout.js';
import {toScroll, toJourney} from './pacing.js';
import outline from './jl-outline.json' with {type:'json'};
import {Scene} from 'three';
import {captionPose} from './product-layout.js';
import {createProductScene} from './product-scene.js';

test('five stations follow bowl, bowl bottom, J top, L descent, L foot',()=>{
  assert.deepEqual(PRODUCT_STATIONS.map(s=>s.slug),['atelier','last-100-feet','ready-for-agents','arden','choose-not-to-lose']);
  const [bowl,stem,l]=jlStrokes2D(), a=productAnchors2D();
  assert.deepEqual(a[0],bowl[0]);assert.equal(a[1][1],Math.max(...bowl.map(p=>p[1])));
  assert.deepEqual(a[2],stem.at(-1));assert.deepEqual(a[3],l[20]);
  assert.equal(a[4][1],l.at(-1)[1]);assert.equal(a[4][0],370);
  for(const [i,stroke] of [bowl,bowl,stem,l,l].entries()) assert.ok(stroke.some(p=>p[0]===a[i][0]&&p[1]===a[i][1]));
});

test('station geometry stays attached to a translated/scaled JL and route preserves source pixels',()=>{
  const center=new Vector3(13750,2404.3,-15340),scale=2,layout=productLayout(center,scale);
  layout.anchors.forEach((a,i)=>{
    assert.ok(Math.abs((a.x-center.x)/scale+LOGO_C[0]-productAnchors2D()[i][0])<1e-9);
    assert.ok(Math.abs(-(a.y-center.y)/scale+LOGO_C[1]-productAnchors2D()[i][1])<1e-9);
  });
  assert.ok(layout.centers[1].y<layout.anchors[1].y&&layout.centers[1].z>layout.anchors[1].z);
  assert.deepEqual(ROUTE_PIXELS,[[428,745],[428,706],[465,706],[465,540],[503,502],[505,428],[507,290]]);
  layout.route.forEach((p,i)=>{
    assert.ok(Math.abs(((p.x-layout.centers[1].x)/scale/75+.5)*808-ROUTE_PIXELS[i][0])<1e-8);
    assert.ok(Math.abs(((p.z-layout.centers[1].z)/scale/71+.5)*768-ROUTE_PIXELS[i][1])<1e-8);
  });
});

test('fictional typical-plan bars use integer cents and exact annual difference',()=>{
  assert.deepEqual(COST_BARS.map(b=>[b.id,b.premium,b.outOfPocket,b.total]),[
    ['a',216000,200000,416000],['d',360000,85000,445000],['b',276000,200000,476000],['c',132000,344000,476000],
  ]);
  assert.deepEqual(COST_BARS.map(b=>b.label),['Plan A $4,160','Plan D $4,450','Plan B $4,760','Plan C $4,760']);
  assert.equal(COST_DIFFERENCE,60000);
});

test('draw holds never reverse the pen and wheel mapping remains reversible through the ending',()=>{
  const ends=DRAW_BEATS.map((_,i)=>(i+1)/DRAW_BEATS.length);let last=0;
  for(let s=15.8;s<31.2;s+=.002){const r=strokeReveal(s,ends);assert.ok(r>=last);last=r;assert.ok(Math.abs(toJourney(toScroll(s))-s)<1e-7);}
  DRAW_BEATS.forEach(([a,b],i)=>{assert.equal(strokeReveal(b,ends),ends[i]);if(i)assert.equal(strokeReveal(a,ends),ends[i-1]);});
});

test('pre-product wheel travel is unchanged at the portal boundary',()=>{
  assert.ok(Math.abs(toScroll(15.8)-32.2722428115211)<1e-10);
  assert.equal(toScroll(14.2),29.2);
});

test('product requests wait for chapter 03 and scene updates are reversible',()=>{
  const oldImage=globalThis.Image, requests=[];
  globalThis.Image=class {set src(value){requests.push(value);}};
  const el=()=>({style:{},classList:{toggle(){}},matches(){return false;},querySelector(){return el();}});
  const root={querySelector(){return el();},querySelectorAll(s){return Array.from({length:s.includes('tag')?2:s.includes('chip')?6:4},el);}};
  const scene=new Scene(),center=new Vector3(13750,2404.3,-15340),product=createProductScene({scene,root,center,scale:1,alive:()=>true});
  const cam=new PerspectiveCamera(24,1.6,5,120000);cam.position.copy(center).add(new Vector3(0,0,280));cam.lookAt(center);cam.updateMatrixWorld();
  const frame={cam,w:1440,h:900,px:0,py:0,time:1,dt:.016,pointer:{inside:false},hitTest:()=>null,stone:{position:center,quaternion:new Quaternion()}};
  try {
    product.update(10.89,frame);assert.equal(requests.length,0);
    product.update(10.9,frame);assert.deepEqual(requests,PRODUCT_STATIONS.slice(0,4).map(s=>s.image));
    for(const s of [17.8,19.7,22.3,24.2,26.7,28.4,29.3,30.6,17.8,0]) assert.equal(product.update(s,frame),-1);
    assert.equal(requests.length,4);
    const keys=[];product.keys((s,pos,look)=>keys.push({s,pos,look}));assert.equal(keys.length,13);
    assert.ok(keys.every((k,i)=>!i||k.s>keys[i-1].s));
    const overview=keys.find(k=>k.s===28);
    cam.position.copy(overview.pos);cam.lookAt(overview.look);cam.updateMatrixWorld();
    const markY=product.layout.strokes.flat().map(p=>p.clone().project(cam).y);
    const markHeight=(Math.max(...markY)-Math.min(...markY))/2;
    assert.ok(markHeight>.59&&markHeight<.61,`five-point hold fills ${markHeight*100}% height`);
    for(const width of [1280,1440,1920])for(let i=0;i<5;i++) {
      const k=keys.find(k=>k.s===PRODUCT_STATIONS[i].hold[1]);cam.aspect=width/900;cam.updateProjectionMatrix();cam.position.copy(k.pos);cam.lookAt(k.look);cam.updateMatrixWorld();
      product.update(k.s,{...frame,w:width});scene.updateMatrixWorld(true);
      const group=scene.children[i], points=[];
      group.traverse(o=>{
        if(!o.isMesh)return;
        const p=o.geometry.attributes.position;
        for(let j=0;j<p.count;j++) {
          const v=new Vector3().fromBufferAttribute(p,j);
          // Arden's alpha-masked plane has no visible rectangle. Measure the
          // glasses' source-image extent (12–86% X), not transparent corners.
          if(i===3 && o===group.children[0]) v.x=v.x*.74-1.5;
          points.push(v.applyMatrix4(o.matrixWorld).project(cam));
        }
      });
      const minX=Math.min(...points.map(p=>(p.x+1)*width/2)),maxX=Math.max(...points.map(p=>(p.x+1)*width/2));
      assert.ok(minX>160+Math.min(380,width*.27),`station ${i} at ${width}: product x ${minX} overlaps caption`);
      assert.ok(maxX<width-25,`station ${i} at ${width}: product x ${maxX} outside viewport`);
      if(i===3 && width===1440) assert.ok((maxX-minX)/width>.43 && (maxX-minX)/width<.49);
      if(i===0){
        const phone=group.children[0],p=phone.geometry.attributes.position,ys=[];
        for(let j=0;j<p.count;j++)ys.push(new Vector3().fromBufferAttribute(p,j).applyMatrix4(phone.matrixWorld).project(cam).y);
        const height=(Math.max(...ys)-Math.min(...ys))*450;
        assert.ok(height>=405&&height<=495,`phone height ${height}`);
      }
    }
    // Sample camera travel, not just reading holds. A textured surface must stay
    // in view through each turn; captions alone do not satisfy this check.
    scene.traverse(o=>{if(o.material?.uniforms?.map)o.userData.loaded=true;});
    cam.aspect=1.6;cam.updateProjectionMatrix();
    for(const [start,end] of [[15.98,16.4],[20.1,20.65],[22.55,23.1],[24.65,25.2]]) {
      let bareStart=null, longest=0;
      for(let s=start;s<=end;s+=.005) {
        const b=keys.find(k=>k.s>s)||keys.at(-1), a=keys[Math.max(0,keys.indexOf(b)-1)];
        const t=Math.max(0,Math.min(1,(s-a.s)/(b.s-a.s))), e=t<.5?4*t*t*t:1-(-2*t+2)**3/2;
        cam.position.copy(a.pos).lerp(b.pos,e);cam.lookAt(a.look.clone().lerp(b.look,e));cam.updateMatrixWorld();
        product.update(s,frame);scene.updateMatrixWorld(true);
        let coverage=0;
        scene.traverse(o=>{
          if(o.userData.station===4 && o.parent.visible && o.material.opacity>.15) {
            const p=o.geometry.attributes.position, samples=[];
            for(let j=0;j<p.count;j++) {
              const v=new Vector3().fromBufferAttribute(p,j).applyMatrix4(o.matrixWorld).project(cam);
              if(v.z>-1&&v.z<1&&Math.abs(v.x)<.98&&Math.abs(v.y)<.95)samples.push(v);
            }
            if(samples.length>2) {
              const xs=samples.map(p=>p.x),ys=samples.map(p=>p.y);
              coverage+=(Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys))/4;
            }
          }
          const u=o.material?.uniforms;if(!o.visible||!u?.map||u.opacity.value<.15)return;
          const projected=[];
          for(let x=.1;x<.91;x+=.1)for(let y=.1;y<.91;y+=.1) {
            if(1-y>u.reveal.value||x>u.wipe.value||u.feather.value&&Math.hypot(x-.5,(y-.5)*1.15)>.4)continue;
            const v=new Vector3((x-.5)*u.size.value.x,(y-.5)*u.size.value.y,0).applyMatrix4(o.matrixWorld).project(cam);
            if(v.z>-1&&v.z<1&&Math.abs(v.x)<.98&&Math.abs(v.y)<.95)projected.push(v);
          }
          if(projected.length<3)return;
          const xs=projected.map(p=>p.x),ys=projected.map(p=>p.y);
          coverage+=(Math.max(...xs)-Math.min(...xs))*(Math.max(...ys)-Math.min(...ys))/4;
        });
        const visible=coverage>.012;
        if(!visible&&bareStart===null)bareStart=s;
        if(bareStart!==null)longest=Math.max(longest,toScroll(s)-toScroll(bareStart));
        if(visible)bareStart=null;
      }
      assert.ok(longest<.4,`${start}–${end}: bare-line travel ${longest} screens`);
    }
  } finally {
    product.dispose();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});globalThis.Image=oldImage;
  }
});

test('fold lifts detours backwards without moving a single JL sample',()=>{
  const strokes=jlStrokes2D().map(s=>s.map(([x,y])=>new Vector3(x,y,0)));
  const drawn=poseFromStrokesForTest(strokes), live=makePose();
  let previous=Infinity;
  for(let t=0;t<=1;t+=.025) {
    retractProductOutlines(live,drawn,t);
    assert.deepEqual(live.P,drawn.P);assert.deepEqual(live.D,drawn.D);
    let visible=0;
    for(let i=0;i<N;i++)if(i/(N-1)<=drawn.ends[0])visible+=live.R[i];
    assert.ok(visible<=previous);previous=visible;
  }
});

test('caption handovers are sequential inside the original windows',()=>{
  const windows=[[18.1,18.55],[20.1,20.5],[22.55,22.85],[24.65,24.95]];
  for(const [i,[start,end]] of windows.entries()) {
    const at=t=>start+(end-start)*t;
    assert.equal(captionOpacity(i,start),1);assert.equal(captionOpacity(i+1,start),0);
    assert.ok(captionOpacity(i,at(.46))<1e-10);assert.equal(captionOpacity(i+1,at(.54)),0);
    assert.ok(captionOpacity(i+1,end)>.999999);
    assert.ok(Math.abs(captionPose(i,at(.225)).y+6)<1e-10);
    assert.ok(Math.abs(captionPose(i+1,at(.775)).y-6)<1e-10);
    for(let s=start;s<=end;s+=.001)assert.ok(Math.min(captionOpacity(i,s),captionOpacity(i+1,s))<=.15);
  }
  for(let s=16.05;s<27;s+=.01)if(!windows.some(([a,b])=>s>=a&&s<=b))assert.ok(PRODUCT_STATIONS.reduce((a,_,i)=>a+captionOpacity(i,s),0)>.99);
});

test('white peak lasts less than .3 wheel screens',()=>{
  const bright=[];
  for(let s=28.8;s<29.95;s+=.001) if(productWhite(s)>.8)bright.push(s);
  assert.ok(toScroll(bright.at(-1))-toScroll(bright[0])<.3);
  assert.equal(productWhite(29.3),1);assert.ok(productWhite(29.5)<.3);
});

function poseFromStrokesForTest(strokes) {
  return poseFromStrokes([strokes[0],strokes[1],strokes[2],...strokes,...strokes],.18);
}

test('burn uses the stone transform, with subpixel projection error at 1440 × 900',()=>{
  const center=new Vector3(13750,2404.3,-15340),clean=jlPose(center,1,new Vector3(1,0,0),new Vector3(0,1,0),.5),live=makePose();
  const cam=new PerspectiveCamera(24,1440/900,5,120000);cam.position.set(13750,2340,-11940);cam.lookAt(13750,2340,-13840);cam.updateMatrixWorld();
  const stone={position:center.clone().add(new Vector3(0,-420*Math.pow(1-(29.3-29.24)/(30.35-29.24),3),0)),quaternion:new Quaternion().setFromEuler(new Euler(.02,.035,0))};
  copyPose(live,clean);alignProductMark(live,clean,center,stone,29.3);
  let max=0;
  for(let i=0;i<N;i++){
    const a=new Vector3().fromArray(clean.P,i*3).sub(center).add(new Vector3(0,0,MARK_FACE_Z)).applyQuaternion(stone.quaternion).add(stone.position).project(cam);
    const b=new Vector3().fromArray(live.P,i*3).project(cam);max=Math.max(max,Math.hypot((a.x-b.x)*720,(a.y-b.y)*450));
    assert.equal(live.R[i],23.5);
  }
  assert.ok(max<.01,`projection error ${max}px`);
});

test('swollen tube plus round caps matches the stone silhouette bounds within three pixels',()=>{
  const center=new Vector3(13750,2404.3,-15340),clean=jlPose(center,1,new Vector3(1,0,0),new Vector3(0,1,0),.5),live=makePose();
  const stone={position:center.clone().add(new Vector3(0,-420*Math.pow(1-(29.3-29.24)/(30.35-29.24),3),0)),quaternion:new Quaternion().setFromEuler(new Euler(.02,.035,0))};
  copyPose(live,clean);alignProductMark(live,clean,center,stone,29.3);
  const cam=new PerspectiveCamera(24,1.6,5,120000);cam.position.set(13750,2340,-11940);cam.lookAt(13750,2340,-13840);cam.updateMatrixWorld();
  const tube=new Tube(12);tube.update(live);const pts=[];
  for(let i=0;i<tube.pos.count;i++)pts.push(new Vector3().fromBufferAttribute(tube.pos,i));
  const transform=v=>v.applyQuaternion(stone.quaternion).add(stone.position);
  for(const s of jlStrokes2D())for(const [x,y] of [s[0],s.at(-1)])for(let a=0;a<=Math.PI;a+=Math.PI/24)for(let b=0;b<Math.PI*2;b+=Math.PI/24){
    pts.push(transform(new Vector3(x-LOGO_C[0]+23.5*Math.sin(a)*Math.cos(b),LOGO_C[1]-y+23.5*Math.cos(a),MARK_FACE_Z+23.5*Math.sin(a)*Math.sin(b))));
  }
  const bounds=points=>{const p=points.map(v=>v.clone().project(cam));return [Math.min(...p.map(v=>(v.x+1)*720)),Math.max(...p.map(v=>(v.x+1)*720)),Math.min(...p.map(v=>(1-v.y)*450)),Math.max(...p.map(v=>(1-v.y)*450))];};
  const lineBounds=bounds(pts),stoneBounds=bounds(outline.flatMap(s=>s.flatMap(([x,y])=>[-31.6,31.6].map(z=>transform(new Vector3(x-LOGO_C[0],LOGO_C[1]-y,z))))));
  lineBounds.forEach((v,i)=>assert.ok(Math.abs(v-stoneBounds[i])<3,`${lineBounds} vs ${stoneBounds}`));
  tube.geo.dispose();
});
