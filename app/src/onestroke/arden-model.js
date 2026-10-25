import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DRACOLoader} from 'three/addons/loaders/DRACOLoader.js';
import {stationImageOpacity} from './product-layout.js';

export const ARDEN_DIMENSIONS = [.150, .041, .154];
export const ARDEN_SCALE = 500;
const clamp = THREE.MathUtils.clamp, rad = THREE.MathUtils.degToRad;
const seg = (s,a,b) => clamp((s-a)/(b-a),0,1);
const ease = t => t*t*(3-2*t);
export function ardenPose(s) {
  const arrival=ease(seg(s,22.55,23));
  return {yaw:rad(s>=27 ? -35 : s<23 ? -80+45*arrival : -35+50*ease(seg(s,23,24.65))),
    pitch:rad(10), opacity:arrival*stationImageOpacity(3,s)};
}

export function ardenMaterials(envMap) {
  const Ti = new THREE.MeshStandardMaterial({color: 0xbab6af, metalness: 1, roughness: .3, envMapIntensity: 1.15});
  const TiPol = new THREE.MeshStandardMaterial({color: 0xd2cec7, metalness: 1, roughness: .14, envMapIntensity: 1.3});
  const TiDark = new THREE.MeshStandardMaterial({color: 0x3c3c3f, metalness: 1, roughness: .42});
  const Soft = new THREE.MeshStandardMaterial({color: 0x161618, metalness: 0, roughness: .58, envMapIntensity: .8});
  const Dark = new THREE.MeshStandardMaterial({color: 0x08080a, metalness: 0, roughness: .2});
  const Glass = new THREE.MeshPhysicalMaterial({color: 0x0c0d10, metalness: 0, roughness: .04, transparent: true, opacity: .2, envMapIntensity: 1.8, clearcoat: 1, clearcoatRoughness: .03, depthWrite: false});
  const Pad = new THREE.MeshPhysicalMaterial({color: 0xe8e8e8, roughness: .2, transparent: true, opacity: .55, depthWrite: false});
  const Gold = new THREE.MeshStandardMaterial({color: 0xc8a35c, metalness: 1, roughness: .3});
  const Led = new THREE.MeshStandardMaterial({color: 0x2a2a2a, emissive: 0xffffff, emissiveIntensity: 0});
  const pick = n => /Ti_PolishedChamfer/.test(n) ? TiPol : /Ti_DarkSatin/.test(n) ? TiDark : /Ti_|Steel/.test(n) ? Ti : /SoftTouch/.test(n) ? Soft : /Lens_Glass|Waveguide/.test(n) ? Glass : /ClearPad/.test(n) ? Pad : /Gold/.test(n) ? Gold : /Indicator/.test(n) ? Led : Dark;
  const all=[Ti,TiPol,TiDark,Soft,Dark,Glass,Pad,Gold,Led];
  all.forEach(m=>{m.envMap=envMap;m.userData.baseOpacity=m.opacity;m.userData.baseTransparent=m.transparent;m.userData.baseDepthWrite=m.depthWrite;});
  return {all,pick,Led};
}

async function loadGLB() {
  const draco=new DRACOLoader().setDecoderPath('/draco/');
  try { return (await new GLTFLoader().setDRACOLoader(draco).loadAsync('/assets/home/product/arden.glb')).scene; }
  finally { draco.dispose(); }
}
function disposeModel(model) {
  const materials=new Set(),textures=new Set();
  model.traverse(o=>{o.geometry?.dispose();if(o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>materials.add(m));});
  materials.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)textures.add(v);});m.dispose();});
  textures.forEach(t=>t.dispose());
}

// The loader seam lets Node projection tests use a metre-sized box, without a
// DOM, WebGL context or Draco worker. The browser always uses the real GLB.
export function createArdenModel({group,position,scale=1,environment,alive,loadModel=loadGLB}) {
  const object=new THREE.Group();object.position.copy(position);object.visible=false;group.add(object);
  const materials=ardenMaterials(environment), meshes=[], indicatorCenter=new THREE.Vector3();
  let started=false,disposed=false,indicator=null,hovered=false,wasDown=false,dragging=false,moved=0,suppressClick=false;
  const spin={a:0,v:0,x:0}, lean={x:0,y:0}; let light=0;
  const glow=new THREE.Mesh(new THREE.SphereGeometry(.0011,16,12),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,toneMapped:false}));glow.visible=false;
  async function load() {
    if(started)return;started=true;
    try {
      const model=await loadModel();
      if(disposed||!alive()){disposeModel(model);return;}
      // Rotate around the exterior's centre; retain every mesh's authored transform.
      model.position.sub(new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()));
      const oldMaterials=new Set(),oldTextures=new Set();
      model.traverse(o=>{
        if(!o.isMesh)return;
        const replace=m=>{oldMaterials.add(m);return materials.pick(m.name);};
        o.material=Array.isArray(o.material)?o.material.map(replace):replace(o.material);
        o.userData.station=3;meshes.push(o);
        if(o.name==='Indicator_LightGuide'){indicator=o;o.geometry.computeBoundingBox();o.geometry.boundingBox.getCenter(indicatorCenter);}
      });
      oldMaterials.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)oldTextures.add(v);});m.dispose();});oldTextures.forEach(t=>t.dispose());
      // The light guide is a sliver about 1 mm tall: lit on its own it never reaches a pixel. A small HDR bead just in front
      // of it carries the light, and the bloom turns it into the glow.
      if(indicator){model.updateMatrixWorld(true);const at=model.worldToLocal(indicator.localToWorld(indicatorCenter.clone()));at.z+=.0008;glow.position.copy(at);model.add(glow);}
      object.add(model);object.userData.loaded=true;
    } catch(error) { if(!disposed&&alive())console.warn('Arden model could not load',error); }
  }
  function update(s,{pointer,hitTest,dt,time,w,h}) {
    const pose=ardenPose(s),interactive=s>=22.55&&s<25.05&&!!object.userData.loaded;
    object.visible=!!object.userData.loaded&&pose.opacity>0;
    object.userData.opacity=object.visible?pose.opacity:0;
    object.scale.setScalar(ARDEN_SCALE*scale);
    object.position.copy(position);if(s<27)object.position.y+=Math.sin(time*.8)*ARDEN_DIMENSIONS[1]*ARDEN_SCALE*scale*.02;
    const step=Math.max(0,dt), damping=1-Math.exp(-step/.2);
    // Raycast the currently displayed pose, never a rectangular proxy.
    object.updateMatrixWorld(true);
    hovered=interactive&&pointer.inside&&object.visible&&!!hitTest(meshes);
    if(pointer.down&&!wasDown){dragging=hovered;moved=0;suppressClick=false;spin.x=pointer.x;}
    if(dragging&&pointer.down&&interactive&&pointer.inside){
      const dx=pointer.x-spin.x;spin.x=pointer.x;moved+=Math.abs(dx);
      spin.v+=dx*.0009;spin.a+=dx*.006;
      if(moved>5)suppressClick=true;
    }else dragging=false;
    wasDown=!!pointer.down;
    spin.v*=Math.exp(-step*2.2);spin.a+=spin.v*step*60;spin.a*=Math.exp(-step*(dragging?0:1.1));
    lean.x+=((hovered?clamp(pointer.x/w*2-1,-1,1)*rad(18):0)-lean.x)*damping;
    lean.y+=((hovered?clamp(pointer.y/h*2-1,-1,1)*rad(6):0)-lean.y)*damping;
    if(!interactive){spin.a=spin.v=lean.x=lean.y=0;}
    object.rotation.set(pose.pitch+lean.y,pose.yaw+lean.x+spin.a,0,'YXZ');
    object.updateMatrixWorld(true);
    light=clamp(light+(hovered?1:-1)*step/.25,0,1);materials.Led.emissiveIntensity=8*light;
    glow.visible=light>.01;glow.material.opacity=light*pose.opacity;glow.material.color.setScalar(1+3*light);
    materials.all.forEach(m=>{
      m.opacity=m.userData.baseOpacity*pose.opacity;
      const transparent=m.userData.baseTransparent||pose.opacity<1;
      if(m.transparent!==transparent){m.transparent=transparent;m.needsUpdate=true;}
      m.depthWrite=m.userData.baseDepthWrite&&pose.opacity===1;
    });
    return {hovered,light,indicator:indicator?indicator.localToWorld(indicatorCenter.clone()):null};
  }
  return {object,meshes,load,update,get suppressClick(){return suppressClick;},dispose(){disposed=true;object.traverse(o=>o.geometry?.dispose());glow.geometry.dispose();glow.material.dispose();materials.all.forEach(m=>m.dispose());group.remove(object);}};
}
