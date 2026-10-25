import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BoxGeometry,Group,Mesh,MeshStandardMaterial,Texture,Vector3} from 'three';
import {ardenPose,ardenMaterials,createArdenModel,ARDEN_DIMENSIONS} from './arden-model.js';
import {fixture,loaded,screen,bounds,objectCorners} from './product-test-fixture.mjs';

test('Arden scroll pose, arrival and departure opacity, and fold pose',async()=>{
  for(const [s,yaw,opacity] of [[22.55,-80,0],[22.775,-57.5,.5],[23,-35,1],[23.825,-10,1],[24.65,15,1],[24.75,15,1],[24.9,15,.5],[25.05,15,0],[27.2,-35,1]]) {
    const p=ardenPose(s);assert.ok(Math.abs(p.yaw-yaw*Math.PI/180)<1e-9);assert.ok(Math.abs(p.opacity-opacity)<1e-9);assert.equal(p.pitch,10*Math.PI/180);
  }
  const f=fixture();try {
    await loaded(f);f.hold(3);const object=f.scene.children[3].children[0],mesh=object.getObjectByName('Arden_TestExterior');
    f.product.update(22.775,f.frame);assert.ok(mesh.material.transparent);assert.ok(Math.abs(mesh.material.opacity-.5)<1e-9);
    f.product.update(23,f.frame);assert.equal(mesh.material.transparent,false);assert.equal(mesh.material.depthWrite,true);
    const center=object.position.y;
    for(const time of [0,Math.PI/.8/2,Math.PI/.8*1.5]) {
      f.product.update(23,{...f.frame,time});assert.ok(Math.abs(object.position.y-center)<ARDEN_DIMENSIONS[1]*500*.04+1e-9);
    }
    f.product.update(25.05,f.frame);assert.equal(object.visible,false);
    f.product.update(27.1,f.frame);assert.equal(object.visible,true);assert.equal(object.rotation.y,ardenPose(27.1).yaw);
  }finally {f.dispose();}
});

test('all exported material names map to the supplied materials and PMREM environment',()=>{
  const env=new Texture(),m=ardenMaterials(env);
  const b=readFileSync(new URL('../../public/assets/home/product/arden.glb',import.meta.url));
  const gltf=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)));
  for(const {name} of gltf.materials)assert.ok(m.all.includes(m.pick(name)),name);
  assert.equal(m.pick('Ti_Brushed').color.getHex(),0xbab6af);assert.equal(m.pick('Steel_MIM_Hinge'),m.pick('Ti_Brushed'));
  assert.equal(m.pick('Ti_PolishedChamfer').roughness,.14);assert.equal(m.pick('Ti_DarkSatin_Bezel').roughness,.42);
  assert.equal(m.pick('Polymer_SoftTouch').color.getHex(),0x161618);assert.equal(m.pick('Polymer_SoftTouch').metalness,0);
  assert.equal(m.pick('Lens_Glass_AR').opacity,.2);assert.equal(m.pick('Waveguide_InCoupler'),m.pick('Lens_Glass_AR'));
  assert.equal(m.pick('Silicone_ClearPad').opacity,.55);assert.equal(m.pick('Pogo_Gold').color.getHex(),0xc8a35c);
  assert.equal(m.pick('Camera_CoverGlass').color.getHex(),0x08080a);assert.equal(m.pick('Indicator_Emitter'),m.Led);
  m.all.forEach(material=>{assert.equal(material.envMap,env);material.dispose();});env.dispose();
  assert.ok(gltf.extensionsRequired.includes('KHR_draco_mesh_compression'));
});

test('mesh hover lights the real indicator over .25s and projects its world centre; leave switches it off',async()=>{
  const f=fixture();try {
    await loaded(f);f.hold(3);const object=f.scene.children[3].children[0],mesh=object.getObjectByName('Arden_TestExterior'),led=object.getObjectByName('Indicator_LightGuide'),tag=f.root.querySelector('[data-arden-capture]');
    const pointer={inside:true,x:1100,y:420,down:false};
    const frame={...f.frame,pointer,dt:1/60,hitTest:meshes=>{if(!meshes.includes(mesh))return null;assert.ok(meshes.every(m=>m.isMesh));return {object:mesh};}};
    f.product.update(23,f.frame);
    for(let i=1;i<=15;i++){assert.equal(f.product.update(23,frame),3);assert.ok(Math.abs(led.material.emissiveIntensity-8*i/15)<1e-8);}
    const [x,y]=screen(led.localToWorld(new Vector3()),f.frame.cam,1440);
    assert.ok(Math.abs(parseFloat(tag.style.left)-x)<1e-6);assert.ok(Math.abs(parseFloat(tag.style.top)-y)<1e-6);assert.equal(+tag.style.opacity,1);
    f.product.update(23,{...frame,hitTest:()=>null});assert.equal(+tag.style.opacity,0);
    for(let i=0;i<15;i++)f.product.update(23,{...frame,pointer:{...pointer,inside:false}});
    assert.equal(led.material.emissiveIntensity,0);
    const markup=readFileSync(new URL('./ProductChapter.jsx',import.meta.url),'utf8');
    assert.ok(markup.includes('Capture light')&&markup.includes('拍摄指示灯'));
  }finally {f.dispose();}
});

test('pointer lean is damped; a mesh-started drag spins, suppresses navigation and settles back to scroll',async()=>{
  const f=fixture();try {
    await loaded(f);f.hold(3);const object=f.scene.children[3].children[0],mesh=object.getObjectByName('Arden_TestExterior');
    const pointer={inside:true,x:1440,y:900,down:false},frame={...f.frame,pointer,dt:1/60,hitTest:()=>({object:mesh})};
    const base=ardenPose(23);f.product.update(23,f.frame);f.product.update(23,frame);
    assert.ok(object.rotation.y>base.yaw&&object.rotation.y<base.yaw+18*Math.PI/180);
    for(let i=0;i<180;i++)f.product.update(23,frame);
    assert.ok(Math.abs(object.rotation.y-base.yaw-18*Math.PI/180)<1e-6);assert.ok(Math.abs(object.rotation.x-base.pitch-6*Math.PI/180)<1e-6);
    pointer.down=true;f.product.update(23,frame);assert.equal(f.product.suppressClick,false);
    for(let i=0;i<15;i++){pointer.x-=10;f.product.update(23,frame);}
    assert.equal(f.product.suppressClick,true);const angle=object.rotation.y;
    pointer.down=false;pointer.inside=false;f.product.update(23,frame);assert.notEqual(object.rotation.y,angle,'release retains momentum');
    for(let i=0;i<900;i++)f.product.update(23,frame);
    assert.ok(Math.abs(object.rotation.y-base.yaw)<1e-5);assert.ok(Math.abs(object.rotation.x-base.pitch)<1e-5);
    pointer.inside=true;pointer.down=true;f.product.update(23,frame);assert.equal(f.product.suppressClick,false,'a new click can open the case');
  }finally {f.dispose();}
});

test('Arden projected bounds clear the stem and caption through hold, pointer extremes and a full drag rotation',async()=>{
  const f=fixture();try {
    await loaded(f);
    for(const w of [1280,1440,1920]) {
      f.hold(3,w);const object=f.scene.children[3].children[0],stem=screen(f.product.layout.anchors[3],f.frame.cam,w)[0];
      let minGap=Infinity,minCaption=Infinity;
      for(let angle=-180;angle<=180;angle+=3)for(const pitch of [4,10,16]) {
        f.product.update(23,{...f.frame,time:0});object.rotation.set(pitch*Math.PI/180,angle*Math.PI/180,0,'YXZ');f.scene.updateMatrixWorld(true);
        const box=bounds(objectCorners(f,3).map(p=>screen(p,f.frame.cam,w)));
        minGap=Math.min(minGap,box[0]-stem);minCaption=Math.min(minCaption,box[0]-160-Math.min(380,w*.27));
        assert.ok(box[0]-stem>=40,JSON.stringify({w,angle,pitch,box,stem}));assert.ok(box[0]>160+Math.min(380,w*.27));
      }
      console.log('Round 7 all-rotation clearance:',JSON.stringify({w,minGap,minCaption}));
    }
  }finally {f.dispose();}
});

test('a late load after disposal never mounts and frees the model',async()=>{
  let complete,disposed=0;
  const material=new MeshStandardMaterial(),model=new Mesh(new BoxGeometry(...ARDEN_DIMENSIONS),material);
  model.geometry.addEventListener('dispose',()=>disposed++);material.addEventListener('dispose',()=>disposed++);
  const group=new Group(),arden=createArdenModel({group,position:new Vector3(),alive:()=>true,loadModel:()=>new Promise(resolve=>{complete=resolve;})});
  const pending=arden.load();arden.dispose();complete(model);await pending;
  assert.equal(group.children.length,0);assert.equal(disposed,2);
});
