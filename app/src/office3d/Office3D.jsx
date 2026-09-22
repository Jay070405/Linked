import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import LiquidOffice from '../LiquidOffice';
import { STUDIO_TITLE_FONT } from '../studio-title-composite';
import { preloadOffice } from './model';
import { cameraPose, CAMERA_FOV } from './camera';
import { pickupPlane, pickupPosition } from './drag';
import SpeakerVolume from './SpeakerVolume';
import ExpressiveTitle from '../components/ExpressiveTitle';

import './office3d.css';

const filmBlocked = () => document.hidden || document.body.classList.contains('portfolio-route-open');
function wallTitle() {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 384;
  const ctx = canvas.getContext('2d');
  ctx.font = STUDIO_TITLE_FONT; ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'alphabetic';
  const metrics = ctx.measureText('PORTFOLIO'), ascent = metrics.actualBoundingBoxAscent || 146;
  ctx.scale(1990 / metrics.width, 330 / ascent); ctx.fillText('PORTFOLIO', 16, ascent + 3);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false });
  material.color.setRGB(3,3,3);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
  mesh.name = 'WallPortfolio'; mesh.position.set(.6, 4.09, -1.79); mesh.scale.set(7.65, 1.29, 1);
  return mesh;
}

export default function Office3D({ progressRef, reducedMotion, onMode, lang = 'zh' }) {
  const hostRef = useRef(null), canvasRef = useRef(null), modeRef = useRef(onMode), apiRef = useRef({});
  const hoverRef = useRef(null), speakerButton = useRef(null), langRef = useRef(lang);
  langRef.current = lang;
  modeRef.current = onMode;
  const [mode, setMode] = useState('loading'), [lostCount, setLostCount] = useState(0), [lampOn, setLampOn] = useState(true);
  const [speakerPosition, setSpeakerPosition] = useState(null);
  const english = lang === 'en';
  useEffect(() => {
    if (reducedMotion) { setMode('image'); modeRef.current?.('image'); return undefined; }
    const host = hostRef.current, canvas = canvasRef.current, root = host.closest('.legacy-hero');
    let disposed = false, ready = false, visible = true, contextFailed = false, frame = 0, previous = 0;
    let width = 1, height = 1, renderer, model, title, composer, ao, outline, environment, exterior, physics;
    let start, look, screen, lastP = -1, samples = 0, drag, lightOn = true;
    const items = new Map(), sceneMeshes = [], lampMeshes = [], speakerMeshes = [], lampMaterials = new Map();
    let hoveredId = '';
    const cursor = new THREE.Vector2(), sway = new THREE.Vector2(), raycaster = new THREE.Raycaster();
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, .025, 60);
    scene.background = new THREE.Color('#0b100c');
    // Large cool window, very low bounce fill, and a local warm desk lamp.
    // Metallic surfaces use the photographed HDR reflection environment.
    scene.environmentIntensity = .24;
    const hemi = new THREE.HemisphereLight('#c4cfdb', '#603615', .22); scene.add(hemi);
    const windowLight = new THREE.DirectionalLight('#d0daf0', .65);
    windowLight.position.set(-4.4, 4.9, 1.2); windowLight.target.position.set(1,1.4,0);
    windowLight.castShadow = false; windowLight.shadow.mapSize.set(2048,2048);
    Object.assign(windowLight.shadow.camera, { left:-6, right:6, top:5, bottom:-4, near:.1, far:18 });
    windowLight.shadow.bias = -.0001; windowLight.shadow.normalBias = .015; windowLight.shadow.radius = 3;
    scene.add(windowLight, windowLight.target);
    RectAreaLightUniformsLib.init();
    const bounce = new THREE.RectAreaLight('#e4caa8', .7, 7, 4);
    bounce.position.set(-.3, 4.3, 5); bounce.lookAt(.55,2,0); scene.add(bounce);
    const windowArea=new THREE.RectAreaLight('#b7c9ed',3.2,2.8,4.4);windowArea.position.set(-4.1,3.3,.1);windowArea.lookAt(1,2,-1);scene.add(windowArea);
    const lamp = new THREE.SpotLight('#ffbb70', 26, 7, 1.1, .85, 2);
    lamp.position.set(2.81,2.60,-.10); lamp.target.position.set(3.22,1.38,.28);
    lamp.castShadow = true; lamp.shadow.mapSize.set(1024,1024); lamp.shadow.bias=-.0001; lamp.shadow.normalBias=.012;
    lamp.shadow.focus=.85; lamp.shadow.radius=3; scene.add(lamp,lamp.target);
    const lampBounce = new THREE.PointLight('#ffba72', .35, 4, 2); lampBounce.position.set(2.80,1.7,.1); scene.add(lampBounce);
    const stop = () => { cancelAnimationFrame(frame); frame=0; previous=0; };
    const allowed = () => !disposed && !contextFailed && ready && visible && !filmBlocked() && progressRef.current < .18;
    const wake = () => { if (!frame && allowed()) frame=requestAnimationFrame(draw); };
    const report = value => { if (!disposed) { setMode(value); modeRef.current?.(value); host.dataset.mode=value; } };
    const fail = error => { if (!disposed) { stop();ready=false;report('image');console.warn('3D office unavailable; retaining the original opening.',error); } };
    function resize() {
      width=Math.max(1,host.clientWidth);height=Math.max(1,host.clientHeight);
      if (!renderer) return;
      const ratio=Math.min(devicePixelRatio||1,width<700?1.2:1.5,2200/Math.max(width,height));
      renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);
      composer?.setPixelRatio(ratio);composer?.setSize(width,height);
      camera.aspect=width/height;camera.updateProjectionMatrix();
      if(title){title.scale.set(camera.aspect<.9?3.65:7.65,camera.aspect<.9?1.04:1.29,1);title.position.x=camera.aspect<.9?.55:.6;}
      wake();
    }
    function release() {
      if (!drag) return;
      host.dataset.lastDrop=JSON.stringify({id:drag.id,...physics?.items.get(drag.id).body.translation()});
      physics?.release();
      if(canvas.hasPointerCapture(drag.pointerId))canvas.releasePointerCapture(drag.pointerId);
      drag=null;canvas.style.cursor='grab';host.dataset.held='';wake();
    }
    function toggleLamp() {
      lightOn=!lightOn;lamp.intensity=lightOn?26:0;lampBounce.intensity=lightOn?.35:0;
      lampMaterials.forEach((original,material)=>{material.emissiveIntensity=lightOn?original:0;});
      setLampOn(lightOn);host.dataset.lamp=lightOn?'on':'off';wake();
    }
    function openSpeaker() {
      release();clearHover();
      const pos=new THREE.Vector3(-2.02,2,-.67).project(camera);
      setSpeakerPosition({x:(pos.x*.5+.5)*width,y:(-.5*pos.y+.5)*height});
    }
    apiRef.current={ toggleLamp, openSpeaker, restore:()=>{physics?.restoreLost();wake();} };
    function draw(now) {
      frame=0;if(!allowed()){previous=0;return;}
      const dt=previous?Math.min(.08,(now-previous)/1000):1/60;previous=now;
      const p=progressRef.current;
      if(p>.015){if(drag)release();clearHover();if(lastP<=.015)setSpeakerPosition(null);}
      host.dataset.interactive=p<.015?'true':'false';
      const controls=host.querySelector('.office-tools');if(controls)controls.inert=p>=.015;
      if(!drag)sway.lerp(cursor,1-Math.exp(-dt*5));
      const pose=cameraPose(p,camera.aspect,start,look,screen,sway);
      camera.position.copy(pose.position);camera.lookAt(pose.target);camera.updateMatrixWorld();
      physics.step(dt);
      const positions={};
      items.forEach((object,id)=>{
        const body=physics.items.get(id).body;object.visible=!physics.lost.has(id);
        object.position.copy(body.translation());object.quaternion.copy(body.rotation());
        // DOM diagnostics are also useful when checking real pointer interactions.
        const projected=object.position.clone().project(camera);
        positions[id]={x:+((projected.x*.5+.5)*width).toFixed(0),y:+((-projected.y*.5+.5)*height).toFixed(0),position:object.position.toArray().map(v=>+v.toFixed(3)),lost:!object.visible};
      });
      const renderStart=performance.now();
      renderer.info.reset();composer.render();samples++;
      host.dataset.frames=String(samples);host.dataset.renderMs=(performance.now()-renderStart).toFixed(2);
      host.dataset.progress=p.toFixed(4);host.dataset.camera=camera.position.toArray().map(v=>v.toFixed(3)).join(',');
      host.dataset.items=JSON.stringify(positions);host.dataset.lost=String(physics.lost.size);
      if(host.dataset.mode!=='3d')report('3d');
      if(physics.moving||drag||sway.distanceToSquared(cursor)>.000001||Math.abs(lastP-p)>.00001)wake();
      lastP=p;
    }
    function point(event) {
      const rect=host.getBoundingClientRect();
      const x=(event.clientX-rect.left)/rect.width*2-1,y=1-(event.clientY-rect.top)/rect.height*2;
      raycaster.setFromCamera(new THREE.Vector2(x,y),camera);
      return {x,y};
    }
    function hit() {
      const nearest=raycaster.intersectObjects(sceneMeshes,false).find(h=>{
        const id=h.object.userData.propId;return !id||!physics.lost.has(id);
      });
      return nearest&&(nearest.object.userData.propId||nearest.object.userData.speaker||nearest.object.userData.lamp)?nearest:null;
    }
    function clearHover() {
      hoveredId='';host.dataset.hovered='';
      if(outline){outline.selectedObjects=[];outline.enabled=false;}
      if(hoverRef.current)hoverRef.current.hidden=true;
    }
    function hoverHit(hit,event) {
      if(!hit){clearHover();canvas.style.cursor='';return;}
      const id=hit.object.userData.propId||(hit.object.userData.speaker?'speaker':'lamp');
      const en=langRef.current==='en';
      const names={Prop_Keyboard:['键盘','Keyboard'],Prop_Mouse:['鼠标','Mouse'],Prop_Tablet:['数位板','Drawing tablet'],Prop_Stylus:['数位笔','Stylus'],Prop_Cup:['咖啡杯','Coffee cup'],Prop_Sketchbook:['速写本','Sketchbook'],Prop_Pencil:['铅笔','Pencil'],Prop_Plant:['盆栽','Plant'],speaker:['音响','Speaker'],lamp:['台灯','Desk lamp']};
      const name=(names[id]||['参考书','Reference book'])[en?1:0];
      if(id!==hoveredId){
        hoveredId=id;outline.selectedObjects=items.has(id)?[items.get(id)]:id==='speaker'?speakerMeshes:lampMeshes;outline.enabled=true;
      }
      host.dataset.hovered=id;canvas.style.cursor=items.has(id)?'grab':'pointer';
      const label=hoverRef.current;
      if(label){
        label.hidden=false;label.textContent=`${name} · ${items.has(id)?(en?'DRAG TO LIFT':'拖动拎起'):id==='speaker'?(en?'ADJUST VOLUME':'调节音量'):(en?'SWITCH LIGHT':'开关灯')}`;
        const rect=host.getBoundingClientRect();
        label.style.left=`${Math.max(12,Math.min(width-205,event.clientX-rect.left+20))}px`;
        label.style.top=`${Math.max(12,Math.min(height-40,event.clientY-rect.top-38))}px`;
      }
    }
    function pointerMove(event) {
      if(!allowed()||progressRef.current>.015)return;
      const xy=point(event);
      cursor.set(Math.max(-1,Math.min(1,xy.x))*.45,Math.max(-1,Math.min(1,xy.y))*.45);
      if(drag){
        const intersection=pickupPosition(drag,raycaster.ray);
        if(intersection)physics.move(intersection);
        host.dataset.dragTarget=intersection?.toArray().map(v=>v.toFixed(3)).join(',')||'';
      }else hoverHit(hit(),event);
      wake();
    }
    function pointerDown(event) {
      if(!allowed()||progressRef.current>.015||event.button!==0)return;
      point(event);const selected=hit();if(!selected)return;
      if(!selected.object.userData.propId){event.preventDefault();if(selected.object.userData.speaker)openSpeaker();else toggleLamp();return;}
      event.preventDefault();const id=selected.object.userData.propId;
      const body=physics.items.get(id).body;
      const plane=pickupPlane(body.translation(),raycaster.ray);if(!plane)return;
      clearHover();drag={id,...plane,pointerId:event.pointerId};physics.grab(id);
      canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';host.dataset.held=id;
      pointerMove(event);wake();
    }
    function leave(){if(!drag){clearHover();cursor.set(0,0);wake();}}
    function visibility(){if(filmBlocked()){release();stop();}else wake();}
    function contextLost(event){event.preventDefault();contextFailed=true;release();fail('WebGL context lost');}
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake();else{release();stop();}});
    const sizeObserver=new ResizeObserver(resize),routeObserver=new MutationObserver(visibility);
    observer.observe(host);sizeObserver.observe(host);routeObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
    root.addEventListener('office:progress',wake);document.addEventListener('visibilitychange',visibility);
    canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerdown',pointerDown);
    canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
    canvas.addEventListener('pointerleave',leave);window.addEventListener('blur',release);canvas.addEventListener('webglcontextlost',contextLost);
    try {
      renderer=new THREE.WebGLRenderer({canvas,alpha:false,antialias:true,powerPreference:'high-performance'});
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.AgXToneMapping;renderer.toneMappingExposure=1.15;
      renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.info.autoReset=false;
      composer=new EffectComposer(renderer,new THREE.WebGLRenderTarget(1,1,{type:THREE.HalfFloatType,samples:2}));
      composer.addPass(new RenderPass(scene,camera));
      ao=new GTAOPass(scene,camera,1,1);ao.blendIntensity=.9;
      ao.updateGtaoMaterial({radius:.23,distanceExponent:1,thickness:1,distanceFallOff:1,scale:1,samples:12});
      composer.addPass(ao);
      outline=new OutlinePass(new THREE.Vector2(1,1),scene,camera);outline.visibleEdgeColor.set('#eee5d5');outline.hiddenEdgeColor.set('#000000');outline.edgeStrength=2;outline.edgeThickness=1;outline.edgeGlow=0;outline.enabled=false;
      composer.addPass(outline);composer.addPass(new OutputPass());resize();
      Promise.all([preloadOffice(),import('./physics').then(async module=>{await module.initPhysics();return module;}),document.fonts.load(STUDIO_TITLE_FONT).catch(()=>[]),new HDRLoader().loadAsync('/assets/office3d/studio-light.hdr').catch(()=>null),new HDRLoader().loadAsync('/assets/office3d/city-dusk.hdr').catch(()=>null)]).then(async([buffer,physicsModule,,hdr,city])=>{
        if(disposed){hdr?.dispose();city?.dispose();return;}
        if(city){city.mapping=THREE.EquirectangularReflectionMapping;exterior=city;scene.background=city;scene.backgroundBlurriness=.02;scene.backgroundIntensity=.32;scene.backgroundRotation.set(.08,1.2,0);}
        if(hdr){hdr.mapping=THREE.EquirectangularReflectionMapping;environment=hdr;scene.environment=hdr;scene.environmentRotation.y=.8;}
        const gltf=await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buffer,'/assets/office3d/');
        if(disposed){disposeObject(gltf.scene);return;}
        setLostCount(0);setLampOn(true);
        model=gltf.scene;scene.add(model);model.updateMatrixWorld(true);
        if(!model.getObjectByName('ScreenTarget'))throw new Error('Missing office anchors');
        start=model.getObjectByName('CameraStart').getWorldPosition(new THREE.Vector3());
        look=model.getObjectByName('CameraLook').getWorldPosition(new THREE.Vector3());
        screen=model.getObjectByName('ScreenTarget').getWorldPosition(new THREE.Vector3());
        physics=new physicsModule.DeskPhysics(count=>{if(!disposed)setLostCount(count);});
        // Reparent props to the scene without changing their world transform.
        const propRoots=[];model.traverse(o=>{if(o.userData.draggable)propRoots.push(o);});
        propRoots.forEach(object=>{
          scene.attach(object);items.set(object.name,object);
          const half=object.userData.halfExtents;
          physics.add(object.name,object.position,[half[0],half[2],half[1]],object.userData.mass,object.quaternion);
          object.traverse(mesh=>{if(mesh.isMesh)mesh.userData.propId=object.name;});
        });
        scene.traverse(object=>{
          if(!object.isMesh)return;
          sceneMeshes.push(object);
          object.castShadow=!/Window_sky|City_light|ScreenSurface|Lamp_bulb/.test(object.name);object.receiveShadow=true;
          const materials=Array.isArray(object.material)?object.material:[object.material];
          materials.forEach(material=>{
            material.envMapIntensity=.75;
            if(/Honey_oak|Floor_walnut/.test(material.name)){material.roughness=.78;material.envMapIntensity=.22;}
            if(material.name==='Floor_walnut')material.color.setRGB(.40,.32,.23);
            if(material.name==='Lamp_lining')material.side=THREE.DoubleSide;
            Object.values(material).forEach(v=>{if(v?.isTexture)v.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());});
            if(material.name.startsWith('Leaf')||material.name.includes('leaves'))material.side=THREE.DoubleSide;
            if(material.name==='Lamp_inner')lampMaterials.set(material,material.emissiveIntensity);
            if(material.name==='Screen_off'){object.material=new THREE.MeshBasicMaterial({color:'#020303',toneMapped:false});object.receiveShadow=false;}
          });
          if(object.name.startsWith('Lamp_')){
            object.userData.lamp=true;
            lampMeshes.push(object);
            if(/Lamp_shade|Lamp_lower_arm|Lamp_upper_arm/.test(object.name)){
              const box=new THREE.Box3().setFromObject(object),size=box.getSize(new THREE.Vector3()).multiplyScalar(.5),center=box.getCenter(new THREE.Vector3());
              physics.fixed(size.toArray(),center);
            }
          }
          if(object.parent?.name==='StudioSpeaker'){object.userData.speaker=true;speakerMeshes.push(object);}
        });
        title=wallTitle();scene.add(title);ready=true;host.dataset.lamp='on';resize();
        if(progressRef.current>=.18)report('3d');wake();
      }).catch(fail);
    }catch(error){fail(error);}
    return()=>{
      release();disposed=true;stop();observer.disconnect();sizeObserver.disconnect();routeObserver.disconnect();apiRef.current={};
      root.removeEventListener('office:progress',wake);document.removeEventListener('visibilitychange',visibility);
      canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerdown',pointerDown);
      canvas.removeEventListener('pointerup',release);canvas.removeEventListener('pointercancel',release);canvas.removeEventListener('lostpointercapture',release);
      canvas.removeEventListener('pointerleave',leave);window.removeEventListener('blur',release);canvas.removeEventListener('webglcontextlost',contextLost);
      physics?.dispose();disposeObject(scene);environment?.dispose();exterior?.dispose();composer?.passes.forEach(pass=>pass.dispose?.());composer?.dispose();renderer?.dispose();
    };
  },[reducedMotion,progressRef]);
  return <div ref={hostRef} className="office-3d" data-mode={mode}>
    {mode!=='3d'&&<LiquidOffice reducedMotion allowAlternate={false} progressRef={progressRef}/>}
    <canvas ref={canvasRef} className={mode==='3d'?'is-ready':''} aria-hidden="true"/>
    <span ref={hoverRef} className="office-hover-label" hidden aria-hidden="true"/>
    {mode==='3d'&&<div className="office-tools" inert={progressRef.current>=.015}>
      <span className="office-drag-hint"><ExpressiveTitle reduced={reducedMotion} variant="type" hover={false} typingSpeed={25}>{english?'Pick up an object. Make yourself at home.':'拎起桌上的物件，随手摆一摆。'}</ExpressiveTitle></span>
      <div className="office-tool-buttons">
        <button type="button" onClick={()=>apiRef.current.toggleLamp?.()} aria-pressed={lampOn}>{lampOn?'☼':'☾'} <ExpressiveTitle reduced={reducedMotion} variant="type" typingSpeed={30} hover={false}>{english?(lampOn?'Lamp on':'Lamp off'):(lampOn?'台灯已开':'台灯已关')}</ExpressiveTitle></button>
        <button ref={speakerButton} type="button" onClick={()=>apiRef.current.openSpeaker?.()} aria-haspopup="dialog">♫ <ExpressiveTitle reduced={reducedMotion} variant="type" typingSpeed={30} hover={false}>{english?'Speaker':'音响音量'}</ExpressiveTitle></button>
        {lostCount>0&&<button type="button" className="office-restore" onClick={()=>apiRef.current.restore?.()}>↺ <ExpressiveTitle reduced={reducedMotion} variant="type" typingSpeed={30} hover={false}>{english?'Bring back fallen objects':'找回掉落的物件'}</ExpressiveTitle> <small>{lostCount}</small></button>}
      </div>
      <span className="office-3d-description" role="status">{lostCount>0?(english?`${lostCount} objects fell off the desk.`:`${lostCount} 件物品掉出了桌子。`):''}</span>
    </div>}
    {speakerPosition&&<SpeakerVolume lang={lang} position={speakerPosition} returnRef={speakerButton} onClose={()=>setSpeakerPosition(null)} reduced={reducedMotion}/>}
  </div>;
}
function disposeObject(root){
  const materials=new Set(),geometries=new Set(),textures=new Set();
  root.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));});
  materials.forEach(m=>{Object.values(m).forEach(v=>{if(v?.isTexture)textures.add(v);});m.dispose();});
  const images=new Set();textures.forEach(t=>{if(t.source?.data)images.add(t.source.data);t.dispose();});images.forEach(v=>v.close?.());geometries.forEach(g=>g.dispose());
}
