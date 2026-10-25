import {createProductCameraTrack} from './product-camera.js';
import {Scene,Vector4,Vector3,Quaternion,PerspectiveCamera} from 'three';
import {createProductScene} from './product-scene.js';
import {PRODUCT_STATIONS,ARDEN_CONTENT_BOUNDS} from './product-layout.js';
import {scenarios} from '../product/v2/data/cntl-model.js';
const center=new Vector3(13750,2404.3,-15340);
function element(dataset={}) {
  const children=new Map(),listeners=new Map(),attributes=new Map();
  return {style:{setProperty(k,v){this[k]=v;}},dataset,offsetWidth:180,offsetHeight:24,textContent:'',classList:{toggle(){}},matches(){return false;},focus(){},
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
      if(k==='[data-cost-scenario]')data=scenarios.map(s=>({costScenario:s.id}));
      multi.set(k,data.map(element));
    }return multi.get(k);
  }};
  const originals={Image:globalThis.Image,document:globalThis.document,fetch:globalThis.fetch};
  const requests=[],draws=[];
  globalThis.document={createElement(){return {getContext(){return {clearRect(){},drawImage(im){draws.push(im.src);}};}};}};
  globalThis.Image=class {set src(v){this.url=v;if(v)requests.push(this);}get src(){return this.url;}};
  globalThis.fetch=async()=>{throw new Error("Unexpected metadata request");};
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


export {fixture,screen,bounds};

// Clip the actual quad (not its bounding rectangle) in homogeneous camera
// space, including near/far planes, then measure its on-screen polygon area.
function clippedArea(points,cam) {
  let polygon=points.map(p=>new Vector4(p.x,p.y,p.z,1).applyMatrix4(cam.matrixWorldInverse).applyMatrix4(cam.projectionMatrix));
  for(const distance of [p=>p.w+p.x,p=>p.w-p.x,p=>p.w+p.y,p=>p.w-p.y,p=>p.w+p.z,p=>p.w-p.z]) {
    const next=[];
    polygon.forEach((a,i)=>{const b=polygon[(i+1)%polygon.length],da=distance(a),db=distance(b);
      if(da>=0)next.push(a);if((da>=0)!==(db>=0))next.push(a.clone().lerp(b,da/(da-db)));
    });polygon=next;
  }
  const p=polygon.map(v=>[v.x/v.w,v.y/v.w]);
  return Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-a[1]*b[0];},0))/8;
}
const tracks=new WeakMap();
function cameraAt(f,keys,s) {
  if(s>=16.6&&s<=26.85) {
    if(!tracks.has(keys))tracks.set(keys,createProductCameraTrack(keys.filter(k=>k.s>=16.6&&k.s<=26.85)));
    const look=new Vector3();tracks.get(keys)(s,f.frame.cam.position,look);f.frame.cam.lookAt(look);f.frame.cam.updateMatrixWorld();return;
  }
  const b=keys.find(k=>k.s>s),a=keys[keys.indexOf(b)-1],t=(s-a.s)/(b.s-a.s),e=t<.5?4*t*t*t:1-(-2*t+2)**3/2;
  f.frame.cam.position.copy(a.pos).lerp(b.pos,e);f.frame.cam.lookAt(a.look.clone().lerp(b.look,e));f.frame.cam.updateMatrixWorld();
}
async function loaded(f) {
  f.product.update(10.9,f.frame);for(let i=0;i<f.requests.length;i++)f.requests[i].onload?.();
  await new Promise(resolve=>setImmediate(resolve));
}
function objectArea(f,i) {
  if(i===4) {
    if(+f.root.querySelector('[data-cost-axis]').style.opacity<=.3)return 0;
    return clippedArea([[308,309],[409,309],[409,359],[308,359]].map(f.product.layout.world),f.frame.cam);
  }
  const mesh=f.scene.children[i].children[0],u=mesh.material.uniforms;
  if(!mesh.visible||u.opacity.value<=.3)return 0;
  let box=i===3?ARDEN_CONTENT_BOUNDS:[0,0,1,1];
  const [x0,y0,x1,y1]=box, bottom=Math.min(y1,u.reveal.value);
  if(bottom<=y0)return 0;
  return clippedArea([[x0,y0],[x1,y0],[x1,bottom],[x0,bottom]].map(([x,y])=>new Vector3((x-.5)*u.size.value.x,(.5-y)*u.size.value.y,0).applyMatrix4(mesh.matrixWorld)),f.frame.cam);
}


export {clippedArea,cameraAt,loaded,objectArea};
