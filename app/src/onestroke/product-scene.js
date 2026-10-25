import * as THREE from 'three';
import {poseFromStrokes, jlPose, flow, copyPose, LOGO_R} from './line.js';
import {PRODUCT_STATIONS, productLayout, COST_BARS, TOKEN_LINES, strokeReveal, alignProductMark, MARK_FACE_Z, retractProductOutlines, captionPose} from './product-layout.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const seg = (s, a, b) => Math.max(0, Math.min(1, (s - a) / (b - a)));
const ease = t => t * t * (3 - 2 * t);
const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragmentShader = `uniform sampler2D map; uniform float opacity, reveal, wipe, dim, feather, roundness; uniform vec2 size; uniform vec4 crop; varying vec2 vUv;
  void main(){
    vec4 c=texture2D(map,crop.xy+vUv*crop.zw);
    vec2 q=abs(vUv-.5)*size-size*.5+roundness;
    float edge=length(max(q,0.))+min(max(q.x,q.y),0.)-roundness;
    float a=1.-smoothstep(-.07,.07,edge);
    a*=1.-smoothstep(reveal-.025,reveal,1.-vUv.y);
    a*=1.-smoothstep(wipe-.045,wipe,vUv.x);
    // A true alpha falloff: the render's black rectangle never reaches the scene.
    a*=mix(1.,1.-smoothstep(.32,.5,length((vUv-.5)*vec2(1.,1.15))),feather);
    gl_FragColor=vec4(c.rgb*dim,c.a*a*opacity);
    #include <colorspace_fragment>
  }`;

// A frame starts at its bottom centre, exactly on its JL anchor.
function outline(c, w, h, r) {
  const shape = new THREE.Shape(), x = -w / 2, y = -h / 2;
  shape.moveTo(0,y); shape.lineTo(x+r,y); shape.quadraticCurveTo(x,y,x,y+r);
  shape.lineTo(x,y+h-r); shape.quadraticCurveTo(x,y+h,x+r,y+h);
  shape.lineTo(x+w-r,y+h); shape.quadraticCurveTo(x+w,y+h,x+w,y+h-r);
  shape.lineTo(x+w,y+r); shape.quadraticCurveTo(x+w,y,x+w-r,y); shape.lineTo(0,y);
  return shape.getPoints(16).map(p => c.clone().add(V(p.x,p.y,0)));
}

export function createProductScene({scene, root, center, scale, alive}) {
  const layout = productLayout(center, scale), {anchors, centers, strokes, route, bowlSplit} = layout;
  const groups = anchors.map(a => { const g = new THREE.Group(); g.position.copy(a); scene.add(g); return g; });
  const images = [], ownedTextures = [], pending = [];
  let started = false, disposed = false, hover = -1, barHover = -1;
  const blank = new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1); blank.needsUpdate = true; ownedTextures.push(blank);
  function plane(i, w, h, c, {dim = .78, feather = 0, crop = [0,0,1,1], paper = false, radius = .8} = {}) {
    const uniforms = {map:{value:blank}, opacity:{value:0}, reveal:{value:1.04}, wipe:{value:1.05}, dim:{value:dim}, feather:{value:feather}, size:{value:new THREE.Vector2(w,h)}, roundness:{value:radius}, crop:{value:new THREE.Vector4(...crop)}};
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.ShaderMaterial({uniforms, vertexShader, fragmentShader, transparent:true, depthWrite:false, side:THREE.DoubleSide}));
    m.position.copy(c).sub(anchors[i]); groups[i].add(m); m.userData.station = i;
    images.push(m);
    if (!paper) pending.push({mesh:m, src:PRODUCT_STATIONS[i].image});
    return m;
  }
  const phone = plane(0,26.7,57.8,centers[0],{radius:3.5});
  const paper = plane(0,26.5,15.5,centers[0],{paper:true,dim:.86,radius:.2});
  const print = plane(0,24,12.7,centers[0],{crop:[40/780,1-864/1688,700/780,370/1688],radius:0});
  const plan = plane(1,75,71,centers[1],{dim:.36,radius:2}); plan.rotation.x = -Math.PI/2;
  const rfa = plane(2,85.3,55.5,centers[2]);
  const arden = plane(3,150,100,centers[3],{feather:1,dim:.9});
  const led = new THREE.Mesh(new THREE.SphereGeometry(.45,16,12),new THREE.MeshBasicMaterial({color:0xffffff}));
  led.position.copy(arden.position).add(V((.546-.5)*150,(.5-.489)*100,.5)); groups[3].add(led);
  const bars = COST_BARS.map((b, i) => {
    const x = strokes[2][74].x + 10 + i * 19, base = anchors[4].y, group = new THREE.Group();
    group.position.copy(V(x,base,center.z)).sub(anchors[4]); groups[4].add(group);
    const factor = .000075, heights = [b.premium*factor,b.outOfPocket*factor];
    const meshes = heights.map((h,j) => {
      const geo = new THREE.BoxGeometry(10,h,4); geo.translate(0,h/2+(j ? heights[0] : 0),0);
      const m = new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:j ? 0x55555a : 0xd8d8dc,roughness:.65,transparent:true}));
      m.userData.station = 4; m.userData.bar = i; group.add(m); return m;
    });
    return {group, meshes, height:heights[0]+heights[1], at:V(x,base,center.z), hover:0};
  });
  const phoneOutline = outline(centers[0],28.6,60,4.8), rfaOutline = outline(centers[2],664/7.5,432/7.5,1.6);
  const b = bars[2], bOutline = outline(b.at.clone().add(V(0,b.height/2,2.5)),13,b.height+3,.8);
  const drawn = poseFromStrokes([phoneOutline, strokes[0].slice(0,bowlSplit+1),route,strokes[0].slice(bowlSplit),strokes[1],rfaOutline,strokes[2].slice(0,21),strokes[2].slice(20),bOutline],.18,{gapWeight:.02});
  const clean = jlPose(center,scale,V(1,0,0),V(0,1,0),.5);
  const entry = poseFromStrokes([phoneOutline],.18);
  entry.R.fill(0);
  // Tube's pen caps taper inwards. Round end caps restore the logo's actual
  // outer extent as the thin line swells to its 47-unit stroke weight.
  const capMaterial = new THREE.MeshBasicMaterial({color:0xffffff});
  const endCaps = strokes.flatMap(s=>[s[0],s.at(-1)]).map(at=>{
    const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),capMaterial);
    m.userData.at=at; m.visible=false; scene.add(m); return m;
  });
  // Tiny round motes give the climbs depth without another asset or colour.
  const dustPositions = new Float32Array(240*3);
  for(let i=0;i<240;i++) dustPositions.set([center.x+Math.sin(i*127.1)*400,center.y+Math.sin(i*311.7)*330,center.z-180+Math.sin(i*74.7)*120],i*3);
  const dustGeo = new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
  const dust = new THREE.Points(dustGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{alpha:{value:0}},
    vertexShader:'void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_PointSize=1.5;}',
    fragmentShader:'uniform float alpha;void main(){float a=1.-smoothstep(.2,.5,length(gl_PointCoord-.5));gl_FragColor=vec4(vec3(.5),a*alpha);}'}));
  dust.visible=false;scene.add(dust);
  const tmp = V();
  const $ = s => root.querySelector(s);
  const caps = PRODUCT_STATIONS.map((_,i) => $(`[data-os-product="${i}"]`));
  const points = PRODUCT_STATIONS.map((_,i) => $(`[data-os-point="${i}"]`));
  const tags = [...root.querySelectorAll('[data-product-tag]')];
  const chipEls = [...root.querySelectorAll('[data-product-chip]')];
  const barEls = [...root.querySelectorAll('[data-product-bar]')];
  const ending = $('.os-product-end'), code = $('.os-product-code'), codeText = code.querySelector('code'), proof = code.querySelector('.os-product-proof'), flag = $('.os-product-flag');
  function show(el, a) { el.style.opacity = a.toFixed(3); el.style.visibility = a > .005 ? 'visible' : 'hidden'; }
  function project(el, at, cam, w, h, a) {
    tmp.copy(at).project(cam); show(el, tmp.z < 1 && tmp.z > -1 ? a : 0);
    el.style.left = `${(tmp.x+1)*w/2}px`; el.style.top = `${(1-tmp.y)*h/2}px`;
  }
  function load() {
    if (started) return; started = true;
    [...new Set(PRODUCT_STATIONS.slice(0,4).map(s => s.image))].forEach(src => {
      const im = new Image(); im.decoding='async';
      im.onload = () => {
        if (disposed || !alive()) return;
        const t = new THREE.Texture(im); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; t.needsUpdate=true; ownedTextures.push(t);
        pending.filter(p => p.src===src).forEach(({mesh}) => {mesh.material.uniforms.map.value=t; mesh.userData.loaded=true;});
      };
      im.src=src;
    });
  }
  function pose(live, s, ring, stone) {
    if (s < 15.92) return flow(live,ring,entry,seg(s,15.8,15.92),{spread:.35});
    if (s < 27) return copyPose(live,drawn);
    if (s < 28) return retractProductOutlines(live,drawn,ease(seg(s,27,28)));
    copyPose(live,clean);
    return alignProductMark(live,clean,center,stone,s,scale);
  }
  function keys(k) {
    // Products sit right of the caption. All offsets are in the stone's world units.
    PRODUCT_STATIONS.forEach((s,i) => {
      const c = centers[i], distance = [280,255,305,360,255][i];
      const look = c.clone().add(V(-[24,26,38,44,32][i],0,0));
      const offset = i===1 ? V(0,205,150) : V(0,8,distance);
      // Arrive before the previous caption leaves. During the long J climb,
      // widen to keep the plan and the arriving frame in the same composition.
      if(i===2) { const mid=centers[1].clone().lerp(c,.5); k(20.28,mid.clone().add(V(-24,80,850)),mid); }
      k([15.98,18.55,20.5,22.85,24.95][i],look.clone().add(offset),look);
      k(s.hold[1],look.clone().add(offset).add(V(2,0,-5)),look);
    });
    // 340.49 units / (2 * 1335 * tan(12°)) = 60% of viewport height.
    k(28,center.clone().add(V(0,0,1335)),center.clone());
    k(28.8,center.clone().add(V(0,0,1335)),center.clone());
  }
  function update(s,{cam,w,h,px,py,time,dt,pointer,hitTest,stone}) {
    if (s >= 10.9) load();
    const inChapter = s>15.8 && s<29.3, fold=ease(seg(s,27,28)), keep=1-fold;
    dust.visible=inChapter;dust.material.uniforms.alpha.value=.24*seg(s,15.8,16.2)*(1-seg(s,28.8,29.3));
    const swell=ease(seg(s,28.8,29.3));
    endCaps.forEach(m=>{
      m.visible=s>28.8&&s<29.46;
      tmp.copy(m.userData.at).sub(center).add(V(0,0,MARK_FACE_Z*scale)).applyQuaternion(stone.quaternion).add(stone.position);
      m.position.copy(m.userData.at).lerp(tmp,swell);m.scale.setScalar(LOGO_R*scale*swell);
    });
    capMaterial.color.setScalar((1.35+3*swell)*(1-seg(s,29.3,29.46)));
    const hitMeshes = [...images.filter(m=>m.visible && m.material.uniforms.opacity.value>.2),...bars.flatMap(b=>b.group.visible ? b.meshes:[])];
    hover=-1; barHover=-1;
    groups.forEach(g=>g.updateMatrixWorld(true));
    if (inChapter && s<27.6 && pointer.inside) {const hit=hitTest(hitMeshes);if(hit){hover=hit.object.userData.station;barHover=hit.object.userData.bar ?? -1;}}
    groups.forEach((g,i)=>{
      g.visible=inChapter;
      g.scale.setScalar(i===4 ? 1 : Math.max(.001,keep));
      g.rotation.y = i===1 || s>=27 ? 0 : px*.025;
      g.rotation.x = i===1 || s>=27 ? 0 : py*.018;
      const {opacity:a,y}=captionPose(i,s);
      caps[i].style.width=`${Math.min(380,w*.27)}px`;
      show(caps[i],a); caps[i].style.transform=`translateY(${y}px)`;
    });
    images.forEach(m=>{m.visible=inChapter; m.material.uniforms.opacity.value=keep*(m.userData.loaded ? 1:0);});
    phone.material.uniforms.reveal.value=1.04*ease(seg(s,15.92,16.18));
    const lift=ease(seg(s,17.1,17.8));
    print.position.copy(centers[0]).sub(anchors[0]).add(V(20*lift,5.64+2*lift, .2+21*lift));
    print.scale.setScalar(1+.6*lift); print.rotation.y=-.18*lift;
    print.material.uniforms.opacity.value*=seg(s,17,17.1);
    paper.position.copy(print.position).add(V(0,0,-.15)); paper.scale.copy(print.scale);paper.rotation.copy(print.rotation); paper.material.uniforms.opacity.value=lift*keep;
    plan.material.uniforms.opacity.value*=ease(seg(s,18.1,18.55));
    rfa.material.uniforms.reveal.value=1.04*ease(seg(s,20.2,20.55));
    arden.material.uniforms.wipe.value=1.05*ease(seg(s,22.55,23.35));
    arden.material.uniforms.opacity.value*=seg(s,22.5,22.7);
    led.visible=s>23.35 && s<27.8;led.material.color.setScalar(keep*(1.5+.15*Math.sin(time*2))*(hover===3 ? 1.6:1));
    led.scale.setScalar(hover===3 ? 1.25:1);
    const pointAlpha=seg(s,27.55,28.05)*(1-seg(s,28.8,29));
    points.forEach((el,i)=>project(el,anchors[i],cam,w,h,pointAlpha));
    show(ending,seg(s,28,28.2)*(1-seg(s,28.8,29)));
    project(tags[0],route[0].clone().add(V(-4,4,0)),cam,w,h,seg(s,18.75,19)*keep*(s<20.4?1:0));
    project(tags[1],route.at(-1).clone().add(V(0,5,0)),cam,w,h,seg(s,19.65,19.85)*keep*(s<20.4?1:0));
    chipEls.forEach((el,i)=>{
      const t=ease(seg(s,21.5+i*.07,21.95+i*.07));
      const at=centers[2].clone().add(V(-34+(i%3)*7+(1-t)*65,18-Math.floor(i/3)*7+(1-t)*25,4+(1-t)*25));
      project(el,at,cam,w,h,t*keep*(1-seg(s,22.55,22.9)));
    });
    const codeAlpha=seg(s,21.5,21.7)*(1-seg(s,22.55,22.85));show(code,codeAlpha);
    const full=TOKEN_LINES.join('\n'), typed=full.slice(0,Math.floor(seg(s,21.5,22.05)*full.length));
    if(codeText.textContent!==typed)codeText.textContent=typed;
    show(proof,seg(s,22.05,22.25));
    bars.forEach((b,i)=>{
      const grow=ease(seg(s,24.65+i*.1,25.15+i*.1));
      b.hover+=((barHover===i?1:0)-b.hover)*(1-Math.exp(-dt/.16));
      b.group.visible=inChapter&&grow*keep>.001;b.group.scale.y=Math.max(.001,grow*keep*(1+b.hover*.045));
      b.meshes.forEach(m=>m.material.opacity=keep);
      project(barEls[i],b.at.clone().add(V(0,-5,4)),cam,w,h,seg(s,25.55,25.85)*keep*(s>24.8?1:0));
      barEls[i].classList.toggle('is-hover',barHover===i);
    });
    project(flag,b.at.clone().add(V(-5,b.height+10,4)),cam,w,h,seg(s,26.35,26.55)*keep);
    // The projected DOM nodes have real links, so their hover/focus also names the cursor.
    if (pointAlpha>.2) points.forEach((el,i)=>{if(el.matches(':hover,:focus-visible'))hover=i;});
    return hover;
  }
  // Tube's reveal has a 1.02 head allowance; compensate so a held endpoint
  // cannot start the next stroke before its scheduled beat.
  return {layout, drawn, clean, keys, pose, update, reveal:s=>s<15.92||s>=27?1:strokeReveal(s,drawn.ends)/1.02, get hover(){return hover;}, dispose(){disposed=true;ownedTextures.forEach(t=>t.dispose());}};
}
