import * as THREE from 'three';
import {spherePoint} from './sphereProjection';
import {createFrameProbe} from './galleryFrameProbe';

const vertexShader=`
uniform vec2 uViewport,uCenter,uSize;
uniform float uEntry,uLift;
varying vec2 vUv;
varying float vShade;
void main(){
 vUv=uv;
 vec2 point=uCenter+position.xy*uSize*(1.0+uLift*.018);
 point.y-=uEntry;
 float rx=uViewport.x*1.12, ry=uViewport.y*.82, focal=uViewport.y*1.28;
 float ax=point.x/rx, ay=point.y/ry;
 float z=ry*(1.0-cos(ay))+rx*(1.0-cos(ax))*.32;
 float perspective=focal/(focal-z);
 vec2 curved=vec2(rx*sin(ax)*cos(ay),ry*sin(ay))*perspective;
 vShade=1.0-min(.12,abs(ay)*.065);
 gl_Position=vec4(curved/uViewport*2.0,0.0,1.0);
}`;
const fragmentShader=`
uniform sampler2D uFirst,uSecond,uDelays;
uniform vec2 uSize,uTextureSize,uGridCount,uGridOrigin;
uniform float uShown,uTarget,uTime,uDuration,uPixelMs,uPixelSize,uStartScale,uAnimating,uAlpha,uBackground;
varying vec2 vUv;
varying float vShade;
void main(){
 vec2 uv=vUv;
 vec4 color=uShown<.5?texture2D(uFirst,uv):texture2D(uSecond,uv);
 if(uAnimating>.5){
  vec2 p=vec2(uv.x,1.0-uv.y)*uTextureSize-uGridOrigin;
  vec2 cell=floor(p/uPixelSize);
  vec2 sampleUV=(cell+.5)/uGridCount;
  float delay=texture2D(uDelays,sampleUV).r*(uDuration-uPixelMs);
  float t=clamp((uTime-delay)/uPixelMs,0.0,1.0);
  float eased=1.0-pow(1.0-t,3.0);
  float extent=mix(uStartScale,1.01,eased)*.5;
  vec2 local=abs(fract(p/uPixelSize)-.5);
  float mask=step(max(local.x,local.y),extent)*min(1.0,eased*1.6)*step(delay,uTime);
  vec4 target=uTarget<.5?texture2D(uFirst,uv):texture2D(uSecond,uv);
  color=mix(color,target,mask);
 }
 color.rgb*=mix(vShade,1.0,uBackground);
 gl_FragColor=vec4(color.rgb,color.a*uAlpha);
 #include <colorspace_fragment>
}`;

// Draw ShapeGrid from its offsets and hover cells, without repainting and
// uploading a viewport-sized 2D canvas on every animation frame.
const gridFragmentShader=`
uniform vec2 uGridSize,uGridOffset;
uniform float uSquareSize,uHoverCount;
uniform vec3 uHoverCells[8],uLineColor,uHoverColor;
varying vec2 vUv;
void main(){
 vec2 point=vec2(vUv.x,1.0-vUv.y)*uGridSize;
 vec2 grid=(point-uGridOffset)/uSquareSize;
 vec2 distance=abs(fract(grid-.5)-.5)*uSquareSize;
 vec2 edge=1.0-smoothstep(vec2(.1),max(fwidth(point),vec2(.5)),distance);
 float line=max(edge.x,edge.y)*.1069;
 vec2 cell=floor(grid);
 float hover=0.0;
 for(int i=0;i<8;i++){
  if(float(i)>=uHoverCount)break;
  vec2 delta=abs(cell-uHoverCells[i].xy);
  hover=max(hover,(1.0-step(.1,max(delta.x,delta.y)))*uHoverCells[i].z);
 }
 float fill=hover*.1255;
 float alpha=line+fill*(1.0-line);
 gl_FragColor=vec4(mix(uHoverColor,uLineColor,line/max(alpha,.0001)),alpha);
 #include <colorspace_fragment>
}`;

export function createSphereGallery(root,{onReady,onOpen,scrollOffsetRef}={}){
 const probe=import.meta.env.DEV?createFrameProbe(root):null;
 const scroller=root.closest('.portfolio-page-viewport');
 let renderer;
 try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'});}catch{return null;}
 const canvas=renderer.domElement;
 canvas.className='vc-webgl';canvas.setAttribute('aria-hidden','true');root.prepend(canvas);
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setClearColor(0,0);
 const scene=new THREE.Scene(),camera=new THREE.Camera(),geometry=new THREE.PlaneGeometry(1,1,40,48);
 const textures=new Set(),blankTextures=new Map(),loader=new THREE.TextureLoader();
 let width=1,height=1,alive=true,paused=false,frame=0,last=performance.now(),currentScroll=scroller.scrollTop,ready=false,pointer=null,hoveredNumber=null,lastLag='';
 const disposers=[];
 const on=(target,name,fn,options)=>{target.addEventListener(name,fn,options);disposers.push(()=>target.removeEventListener(name,fn,options));};
 const textureFrom=source=>{const t=new THREE.CanvasTexture(source);t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;textures.add(t);return t;};
 const blank=(element,active)=>{
  const ratio=Math.round(1000*element.offsetHeight/element.offsetWidth);
  const key=`${ratio}/${active}/${active?element.dataset.note:''}`;
  if(blankTextures.has(key))return blankTextures.get(key);
  const c=document.createElement('canvas');c.width=1000;c.height=ratio;
  const ctx=c.getContext('2d');ctx.fillStyle=active?'#252525':'#e9e9e9';ctx.fillRect(0,0,c.width,c.height);
  ctx.textAlign='center';ctx.textBaseline='middle';
  if(active){ctx.fillStyle='#f6f6f6';ctx.font='400 90px "TikTok Sans", sans-serif';ctx.fillText('Coming soon',500,c.height/2-12);ctx.fillStyle='#a0a0a0';ctx.font='24px "TikTok Sans", sans-serif';ctx.fillText(element.dataset.note||'',500,c.height/2+76);}
  else{ctx.fillStyle='#b2b2b2';ctx.font='200 55px sans-serif';ctx.fillText('+',500,c.height/2);}
  const texture=textureFrom(c);blankTextures.set(key,texture);return texture;
 };
 const uniformSet=(first,second)=>({uViewport:{value:new THREE.Vector2()},uCenter:{value:new THREE.Vector2()},uSize:{value:new THREE.Vector2()},uTextureSize:{value:new THREE.Vector2(1,1)},uGridCount:{value:new THREE.Vector2(1,1)},uGridOrigin:{value:new THREE.Vector2()},uEntry:{value:0},uLift:{value:0},uFirst:{value:first},uSecond:{value:second},uDelays:{value:first},uShown:{value:0},uTarget:{value:0},uTime:{value:0},uDuration:{value:1000},uPixelMs:{value:400},uPixelSize:{value:50},uStartScale:{value:.18},uAnimating:{value:0},uAlpha:{value:1},uBackground:{value:0}});
 const items=[...root.querySelectorAll('.vc-paper')].map(element=>{
  const first=blank(element,false),second=blank(element,true),uniforms=uniformSet(first,second);
  const material=new THREE.ShaderMaterial({uniforms,vertexShader,fragmentShader,transparent:true,depthTest:false});
  const mesh=new THREE.Mesh(geometry,material);mesh.frustumCulled=false;mesh.renderOrder=1;scene.add(mesh);
  const item={element,mesh,uniforms,caption:element.parentElement.querySelector('.vc-caption-wrap'),captionTop:0,captionTransform:'',captionOpacity:-1,top:0,left:0,width:1,height:1,entered:false,hover:0,shown:0,entry:{offset:64,velocity:0,opacity:0},start:0,bounds:{left:0,top:0,right:0,bottom:0}};
  const swapStart=e=>{
   const d=e.detail,g=d.grid;
   const cols=new Set(g.pixels.map(p=>p.left)).size,rows=new Set(g.pixels.map(p=>p.top)).size;
   const data=new Uint8Array(cols*rows*4);g.pixels.forEach((p,i)=>{data[i*4]=Math.round(p.offset*255);data[i*4+3]=255;});
   const delay=new THREE.DataTexture(data,cols,rows);delay.needsUpdate=true;delay.flipY=false;delay.minFilter=THREE.NearestFilter;delay.magFilter=THREE.NearestFilter;
   if(item.delay){textures.delete(item.delay);item.delay.dispose();}item.delay=delay;textures.add(delay);
   uniforms.uDelays.value=delay;uniforms.uGridCount.value.set(cols,rows);uniforms.uGridOrigin.value.set(g.pixels[0].left,g.pixels[0].top);
   uniforms.uTextureSize.value.set(g.width,g.height);uniforms.uPixelSize.value=g.size+g.gap;uniforms.uPixelMs.value=d.pixelMs;uniforms.uDuration.value=d.total;uniforms.uStartScale.value=d.pixelScale;
   uniforms.uShown.value=item.shown;uniforms.uTarget.value=d.active?1:0;uniforms.uAnimating.value=1;item.start=performance.now();
  };
  on(element,'vibe:pixel-start',swapStart);
  on(element,'vibe:pixel-finish',e=>{item.shown=e.detail.active?1:0;uniforms.uShown.value=item.shown;uniforms.uAnimating.value=0;});
  on(element,'focus',()=>{item.hover=1;});on(element,'blur',()=>{item.hover=0;});
  return item;
 });
 const gridUniforms={...uniformSet(null,null),uGridSize:{value:new THREE.Vector2(innerWidth,innerHeight)},uGridOffset:{value:new THREE.Vector2()},uSquareSize:{value:76},uHoverCount:{value:0},uHoverCells:{value:Array.from({length:8},()=>new THREE.Vector3())},uLineColor:{value:new THREE.Color('#111111')},uHoverColor:{value:new THREE.Color('#888888')}};
 const background=new THREE.Mesh(geometry,new THREE.ShaderMaterial({uniforms:gridUniforms,vertexShader,fragmentShader:gridFragmentShader,transparent:true,depthTest:false}));
 background.frustumCulled=false;scene.add(background);
 function measure(){
  width=scroller.clientWidth;height=scroller.clientHeight;renderer.setSize(width,height);
  const area=scroller.getBoundingClientRect();
  for(const item of items){
   // The invisible hit surface keeps its original layout; only its visual body is projected.
   const rect=item.element.getBoundingClientRect();item.top=rect.top-area.top+scroller.scrollTop;item.left=rect.left-area.left;item.width=rect.width;item.height=rect.height;
   item.captionTop=item.caption?.offsetTop||0;
   item.uniforms.uViewport.value.set(width,height);item.uniforms.uSize.value.set(item.width,item.height);
  }
  gridUniforms.uViewport.value.set(width,height);gridUniforms.uSize.value.set(width*1.45,height*1.35);
 }
 function projectedRect(item){
  const x=item.left+item.width/2-width/2,y=height/2-(item.top-currentScroll+item.height/2)-item.entry.offset;
  const w=item.width*(1+item.uniforms.uLift.value*.018),h=item.height*(1+item.uniforms.uLift.value*.018);
  const bounds=item.bounds;bounds.left=Infinity;bounds.top=Infinity;bounds.right=-Infinity;bounds.bottom=-Infinity;
  const point=(px,py)=>{
   const p=spherePoint(px,py,width,height),sx=p.x+width/2,sy=height/2-p.y;
   bounds.left=Math.min(bounds.left,sx);bounds.right=Math.max(bounds.right,sx);bounds.top=Math.min(bounds.top,sy);bounds.bottom=Math.max(bounds.bottom,sy);
  };
  for(let i=0;i<=8;i++){const a=i/8;point(x-w/2+a*w,y-h/2);point(x-w/2+a*w,y+h/2);point(x-w/2,y-h/2+a*h);point(x+w/2,y-h/2+a*h);}
  return bounds;
 }
 function updateHover(){
  const item=pointer&&items.find(i=>i.mesh.visible&&i.bounds&&pointer.x>=i.bounds.left&&pointer.x<=i.bounds.right&&pointer.y>=i.bounds.top&&pointer.y<=i.bounds.bottom);
  const number=item?.element.dataset.number||null;
  items.forEach(i=>{i.hover=i===item||document.activeElement===i.element?1:0;});
  if(number!==hoveredNumber){hoveredNumber=number;root.dataset.hoverLive=String(Boolean(item?.element.dataset.cover));root.dispatchEvent(new CustomEvent('vibe:surface-hover',{detail:{number}}));}
 }
 function render(now){
  const started=probe?performance.now():0;
  frame=0;if(!alive||paused||document.hidden)return;
  const dt=Math.min((now-last)/1000,.032);last=now;
  const scrollTarget=scroller.scrollTop;currentScroll+=(scrollTarget-currentScroll)*(1-Math.exp(-dt*11));
  if(Math.abs(scrollTarget-currentScroll)<.01)currentScroll=scrollTarget;
  if(scrollOffsetRef)scrollOffsetRef.current=currentScroll/1.35;
  const lag=`${(scrollTarget-currentScroll).toFixed(2)}px`;
  if(lag!==lastLag){root.style.setProperty('--vc-scroll-lag',lag);lastLag=lag;}
  let stagger=0;
  for(const item of items){
   const {mesh,uniforms:u,entry}=item;
   const y=item.top-currentScroll;
   if(ready&&!item.entered&&y<height*.99&&y+item.height>0){item.entered=true;item.entryAt=now+stagger++*120+100;}
   if(item.entered&&now>=item.entryAt){
    entry.velocity+=(-110*entry.offset-16*entry.velocity)*dt;entry.offset+=entry.velocity*dt;entry.opacity+=(1-entry.opacity)*(1-Math.exp(-dt*7));
    if(Math.abs(entry.offset)+Math.abs(entry.velocity)<.01){entry.offset=0;entry.velocity=0;}
    if(entry.opacity>.999)entry.opacity=1;
   }
   mesh.visible=y+item.height>-height*.3&&y<height*1.3;
   u.uCenter.value.set(item.left+item.width/2-width/2,height/2-y-item.height/2);u.uEntry.value=entry.offset;u.uAlpha.value=entry.opacity;
   u.uLift.value+=(item.hover-u.uLift.value)*(1-Math.exp(-dt*7));u.uTime.value=now-item.start;
   if(mesh.visible)item.bounds=projectedRect(item);
   const caption=item.caption;
   if(caption&&mesh.visible){
    const b=item.bounds,scale=Math.min(1.07,Math.max(.75,(b.right-b.left)/item.width));
    const dy=b.bottom+18-(item.top-scrollTarget+item.captionTop);
    const dx=(b.left+b.right)/2-(item.left+item.width/2);
    const transform=`translate3d(${dx.toFixed(2)}px,${dy.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;
    if(transform!==item.captionTransform){caption.style.transform=transform;item.captionTransform=transform;}
    const opacity=+entry.opacity.toFixed(3);
    if(opacity!==item.captionOpacity){caption.style.opacity=opacity;item.captionOpacity=opacity;}
   }
  }
  updateHover();
  renderer.render(scene,camera);probe?.(now,started);frame=requestAnimationFrame(render);
 }
 const fetchTexture=path=>new Promise((resolve,reject)=>loader.load(path,t=>{if(!alive){t.dispose();resolve(null);return;}t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.generateMipmaps=false;textures.add(t);resolve(t);},undefined,reject));
 Promise.all(items.filter(i=>i.element.dataset.cover).map(async item=>{
  const [a,b]=await Promise.all([fetchTexture(item.element.dataset.cover),fetchTexture(item.element.dataset.preview)]);
  if(a&&b){item.uniforms.uFirst.value=a;item.uniforms.uSecond.value=b;}
 })).then(()=>{if(alive){ready=true;root.classList.add('has-webgl');onReady?.(true);}}).catch(()=>{if(alive){dispose();onReady?.(false);}});
 const resize=new ResizeObserver(measure);resize.observe(scroller);resize.observe(root);
 on(document,'visibilitychange',()=>{if(!document.hidden&&!paused&&!frame){last=performance.now();frame=requestAnimationFrame(render);}});
 on(canvas,'webglcontextlost',e=>{e.preventDefault();dispose();onReady?.(false);});
 on(root,'pointermove',e=>{
  // Pick using projected bounds so the visual wall and pointer targets stay together.
  if(e.pointerType==='touch'||!ready)return;
  pointer={x:e.clientX,y:e.clientY};updateHover();
 });
 on(root,'pointerleave',()=>{pointer=null;updateHover();});
 on(root,'click',event=>{
  if(!ready||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  const item=items.find(i=>i.mesh.visible&&i.bounds&&event.clientX>=i.bounds.left&&event.clientX<=i.bounds.right&&event.clientY>=i.bounds.top&&event.clientY<=i.bounds.bottom);
  if(item?.element.dataset.cover){event.preventDefault();event.stopPropagation();onOpen?.(item.element);}
 });
 function dispose(){
  if(!alive)return;
  alive=false;ready=false;cancelAnimationFrame(frame);resize.disconnect();disposers.forEach(fn=>fn());
  items.forEach(i=>i.mesh.material.dispose());background?.material.dispose();textures.forEach(t=>t.dispose());geometry.dispose();renderer.dispose();canvas.remove();
  root.classList.remove('has-webgl');root.style.removeProperty('--vc-scroll-lag');delete root.dataset.hoverLive;
  items.forEach(i=>{const c=i.element.parentElement.querySelector('.vc-caption-wrap');c?.removeAttribute('style');});
 }
 measure();frame=requestAnimationFrame(render);
 return {
  setPaused(value){
   paused=!!value;
   if(paused){cancelAnimationFrame(frame);frame=0;}
   else if(alive&&!document.hidden&&!frame){last=performance.now();frame=requestAnimationFrame(render);}
  },
  setGridState(state){
   gridUniforms.uGridSize.value.set(state.width,state.height);gridUniforms.uGridOffset.value.set(state.offsetX,state.offsetY);gridUniforms.uSquareSize.value=state.squareSize;
   let count=0;
   for(const [key,opacity]of [...state.cells].slice(-8)){const [x,y]=key.split(',').map(Number);gridUniforms.uHoverCells.value[count++].set(x,y,opacity);}
   gridUniforms.uHoverCount.value=count;
  },
  capture(element){
   const item=items.find(i=>i.element===element);if(!item?.bounds||!ready)return null;
   const b=item.bounds,left=Math.max(0,b.left),top=Math.max(96,b.top),right=Math.min(width,b.right),bottom=Math.min(height,b.bottom);
   if(right-left<10||bottom-top<10)return null;
   const visibility=scene.children.map(m=>m.visible);scene.children.forEach(m=>{m.visible=m===item.mesh;});renderer.render(scene,camera);
   const c=document.createElement('canvas');const dpr=renderer.getPixelRatio();c.width=Math.round((right-left)*dpr);c.height=Math.round((bottom-top)*dpr);c.getContext('2d').drawImage(canvas,left*dpr,top*dpr,c.width,c.height,0,0,c.width,c.height);
   scene.children.forEach((m,i)=>{m.visible=visibility[i];});renderer.render(scene,camera);
   const outline=[],lift=1+item.uniforms.uLift.value*.018;
   const cx=item.left+item.width/2-width/2,cy=height/2-(item.top-currentScroll+item.height/2)-item.entry.offset;
   for(let edge=0;edge<4;edge++)for(let i=0;i<8;i++){
    const a=i/8,[u,v]=edge===0?[a,0]:edge===1?[1,a]:edge===2?[1-a,1]:[0,1-a];
    const p=spherePoint(cx+(u-.5)*item.width*lift,cy+(.5-v)*item.height*lift,width,height);
    outline.push({x:p.x+width/2,y:height/2-p.y,u,v});
   }
   return {surface:c,rect:{left,top,width:right-left,height:bottom-top},outline};
  },
  dispose
 };
}
