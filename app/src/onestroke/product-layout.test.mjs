import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3, Quaternion, Euler, PerspectiveCamera} from 'three';
import {jlStrokes2D, jlPose, makePose, copyPose, N, Tube, LOGO_C, poseFromStrokes} from './line.js';
import {PRODUCT_STATIONS, productAnchors2D, productLayout, ROUTE_PIXELS, DRAW_BEATS, strokeReveal, alignProductMark, MARK_FACE_Z, retractProductOutlines, captionOpacity, productWhite, productDetours, productFold} from './product-layout.js';
import {toScroll, toJourney} from './pacing.js';
import outline from './jl-outline.json' with {type:'json'};
import {captionPose} from './product-layout.js';

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

test('draw holds never reverse the pen and wheel mapping remains reversible through the ending',()=>{
  const ends=DRAW_BEATS.map((_,i)=>(i+1)/DRAW_BEATS.length);let last=0;
  for(let s=15.8;s<31.2;s+=.002){const r=strokeReveal(s,ends);assert.ok(r>=last);last=r;assert.ok(Math.abs(toJourney(toScroll(s))-s)<1e-7);}
  DRAW_BEATS.forEach(([a,b],i)=>{assert.equal(strokeReveal(b,ends),ends[i]);if(i)assert.equal(strokeReveal(a,ends),ends[i-1]);});
});

test('pre-product wheel travel is unchanged at the portal boundary',()=>{
  assert.ok(Math.abs(toScroll(15.8)-32.27)<1e-10);
  assert.equal(toScroll(14.2),29.2);
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

test('each detour lifts as its product leaves, and the fold never draws one back',()=>{
  const strokes=jlStrokes2D().map(s=>s.map(([x,y])=>new Vector3(x,y,0)));
  const drawn=poseFromStrokesForTest(strokes), live=makePose();
  const shown=k=>{let v=0;for(let i=0;i<N;i++){const u=i/(N-1);if(u>(k?drawn.ends[k-1]:0)&&u<=drawn.ends[k])v+=live.R[i];}return v;};
  for(const [k,leave] of [[0,18.5],[2,20.6],[5,22.95]]) {
    assert.equal(productDetours(leave-.25)[k],0);
    retractProductOutlines(live,drawn,0,productDetours(leave));assert.equal(shown(k),0);
    for(const s of [26.9,27.5,27.99]){retractProductOutlines(live,drawn,productFold(s),productDetours(s));assert.equal(shown(k),0);}
  }
  retractProductOutlines(live,drawn,0,productDetours(18));assert.deepEqual(live.R,drawn.R);
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
  // .8 is a conservative exposure proxy, stronger than checking only .95.
  // Actual image pixel coverage still needs a rendered browser capture.
  for(let s=28.8;s<29.95;s+=.001) if(productWhite(s)>.8)bright.push(s);
  assert.ok(toScroll(bright.at(-1))-toScroll(bright[0])<.3);
  assert.equal(productWhite(29.3),1);assert.ok(productWhite(29.5)<.3);
});

function poseFromStrokesForTest(strokes) {
  return poseFromStrokes([strokes[0],strokes[1],strokes[2],...strokes,strokes[0],strokes[1]],.18);
}

test('burn uses the stone transform, with subpixel projection error at 1440 × 900',()=>{
  const center=new Vector3(13750,2404.3,-15340),clean=jlPose(center,1,new Vector3(1,0,0),new Vector3(0,1,0),.5),live=makePose();
  const cam=new PerspectiveCamera(24,1440/900,5,120000);cam.position.copy(center).add(new Vector3(0,0,1335));cam.lookAt(center);cam.updateMatrixWorld();
  const stone={position:center.clone().add(new Vector3(0,2.5,0)),quaternion:new Quaternion().setFromEuler(new Euler(.02,.035,0))};
  copyPose(live,clean);alignProductMark(live,clean,center,stone,29.3);
  let max=0;
  for(let i=0;i<N;i++){
    const a=new Vector3().fromArray(clean.P,i*3).sub(center).add(new Vector3(0,0,MARK_FACE_Z)).applyQuaternion(stone.quaternion).add(stone.position).project(cam);
    const b=new Vector3().fromArray(live.P,i*3).project(cam);max=Math.max(max,Math.hypot((a.x-b.x)*720,(a.y-b.y)*450));
    assert.equal(live.R[i],23.5);
  }
  assert.ok(max<.01,`projection error ${max}px`);
});

test('swollen tube plus round caps matches the close-up stone silhouette within four pixels',()=>{
  const center=new Vector3(13750,2404.3,-15340),clean=jlPose(center,1,new Vector3(1,0,0),new Vector3(0,1,0),.5),live=makePose();
  const stone={position:center.clone().add(new Vector3(0,2.5,0)),quaternion:new Quaternion().setFromEuler(new Euler(.02,.035,0))};
  copyPose(live,clean);alignProductMark(live,clean,center,stone,29.3);
  const cam=new PerspectiveCamera(24,1.6,5,120000);cam.position.copy(center).add(new Vector3(0,0,1335));cam.lookAt(center);cam.updateMatrixWorld();
  const tube=new Tube(12);tube.update(live);const pts=[];
  for(let i=0;i<tube.pos.count;i++)pts.push(new Vector3().fromBufferAttribute(tube.pos,i));
  const transform=v=>v.applyQuaternion(stone.quaternion).add(stone.position);
  for(const s of jlStrokes2D())for(const [x,y] of [s[0],s.at(-1)])for(let a=0;a<=Math.PI;a+=Math.PI/24)for(let b=0;b<Math.PI*2;b+=Math.PI/24){
    pts.push(transform(new Vector3(x-LOGO_C[0]+23.5*Math.sin(a)*Math.cos(b),LOGO_C[1]-y+23.5*Math.cos(a),MARK_FACE_Z+23.5*Math.sin(a)*Math.sin(b))));
  }
  const bounds=points=>{const p=points.map(v=>v.clone().project(cam));return [Math.min(...p.map(v=>(v.x+1)*720)),Math.max(...p.map(v=>(v.x+1)*720)),Math.min(...p.map(v=>(1-v.y)*450)),Math.max(...p.map(v=>(1-v.y)*450))];};
  const lineBounds=bounds(pts),stoneBounds=bounds(outline.flatMap(s=>s.flatMap(([x,y])=>[-31.6,31.6].map(z=>transform(new Vector3(x-LOGO_C[0],LOGO_C[1]-y,z))))));
  // The new held camera is 1335 units away (formerly 3400). The sampled tube
  // and beveled outline differ by at most 0.6% of the 630px silhouette height.
  lineBounds.forEach((v,i)=>assert.ok(Math.abs(v-stoneBounds[i])<4,`${lineBounds} vs ${stoneBounds}`));
  tube.geo.dispose();
});
