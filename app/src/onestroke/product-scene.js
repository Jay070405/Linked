import * as THREE from 'three';
import {poseFromStrokes, jlPose, flow, copyPose, LOGO_R} from './line.js';
import {PRODUCT_STATIONS, productLayout, TOKEN_LINES, strokeReveal, alignProductMark, MARK_FACE_Z, retractProductOutlines, captionPose, ARDEN_SIZE, productHoldCamera, ARDEN_BOUNDS, productFold, stationImageOpacity, productTubeOpacity, productDetours} from './product-layout.js';

import {createArdenFilm} from './arden-film.js';
import {createProductChart} from './product-chart.js';
import {ardenLabelPose} from './arden-labels.js';
import {ARDEN_PARTS} from './arden-parts.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const seg = (s, a, b) => Math.max(0, Math.min(1, (s - a) / (b - a)));
const ease = t => t * t * (3 - 2 * t);
const vertexShader = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
const fragmentShader = `uniform sampler2D map; uniform float opacity, reveal, wipe, dim, feather, roundness, rightFade; uniform vec2 size; uniform vec4 crop; varying vec2 vUv;
  void main(){
    vec4 c=texture2D(map,crop.xy+vUv*crop.zw);
    vec2 q=abs(vUv-.5)*size-size*.5+roundness;
    float edge=length(max(q,0.))+min(max(q.x,q.y),0.)-roundness;
    float a=1.-smoothstep(-.07,.07,edge);
    a*=1.-smoothstep(reveal-.025,reveal,1.-vUv.y);
    a*=1.-smoothstep(wipe-.045,wipe,vUv.x);
    // A true alpha falloff: the render's black rectangle never reaches the scene.
    a*=mix(1.,1.-smoothstep(.32,.5,length((vUv-.5)*vec2(1.,1.15))),feather);
    a*=1.-rightFade*smoothstep(.95,1.,vUv.x);
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
  let started = false, disposed = false, hover = -1;
  const blank = new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1); blank.needsUpdate = true; ownedTextures.push(blank);
  function plane(i, w, h, c, {dim = .78, feather = 0, crop = [0,0,1,1], paper = false, radius = .8, rightFade = 0} = {}) {
    const uniforms = {rightFade:{value:rightFade}, map:{value:blank}, opacity:{value:0}, reveal:{value:1.04}, wipe:{value:1.05}, dim:{value:dim}, feather:{value:feather}, size:{value:new THREE.Vector2(w,h)}, roundness:{value:radius}, crop:{value:new THREE.Vector4(...crop)}};
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.ShaderMaterial({uniforms, vertexShader, fragmentShader, transparent:true, depthWrite:false, side:THREE.DoubleSide}));
    m.position.copy(c).sub(anchors[i]); groups[i].add(m); m.userData.station = i;
    images.push(m);
    if (!paper && PRODUCT_STATIONS[i].image) pending.push({mesh:m, src:PRODUCT_STATIONS[i].image});
    return m;
  }
  const phone = plane(0,26.7,57.8,centers[0],{radius:3.5});
  const paper = plane(0,26.5,15.5,centers[0],{paper:true,dim:.86,radius:.2});
  const print = plane(0,24,12.7,centers[0],{crop:[40/780,1-864/1688,700/780,370/1688],radius:0});
  const plan = plane(1,75,71,centers[1],{dim:.36,radius:2}); plan.rotation.x = -Math.PI/2;
  const rfa = plane(2,85.3,55.5,centers[2]);
  const arden = plane(3,...ARDEN_SIZE,centers[3],{dim:1,feather:0,radius:0,rightFade:1});
  const film=createArdenFilm(alive);arden.material.uniforms.map.value=film.texture;
  const led = new THREE.Mesh(new THREE.SphereGeometry(.45,16,12),new THREE.MeshBasicMaterial({color:0xffffff}));
  groups[3].add(led);
  const phoneOutline = outline(centers[0],28.6,60,4.8), rfaOutline = outline(centers[2],664/7.5,432/7.5,1.6);
  const drawn = poseFromStrokes([phoneOutline, strokes[0].slice(0,bowlSplit+1),route,strokes[0].slice(bowlSplit),strokes[1],rfaOutline,strokes[2].slice(0,21),strokes[2].slice(20)],.18,{gapWeight:.02});
  const clean = jlPose(center,scale,V(1,0,0),V(0,1,0),.5);
  const entry = poseFromStrokes([phoneOutline],.18);
  entry.R.fill(0);
  // Tube's pen caps taper inwards. Round end caps restore the logo's actual
  // outer extent as the thin line swells to its 47-unit stroke weight.
  const capMaterial = new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false});
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
  const partEls=[...root.querySelectorAll('[data-arden-part]')], hoverTag=$('[data-arden-hover]');
  const ending = $('.os-product-end'), code = $('.os-product-code'), codeText = code.querySelector('code'), proof = code.querySelector('.os-product-proof');
  function show(el, a) { el.style.opacity = a.toFixed(3); el.style.visibility = a > .005 ? 'visible' : 'hidden'; }
  function project(el, at, cam, w, h, a) {
    tmp.copy(at).project(cam); show(el, tmp.z < 1 && tmp.z > -1 ? a : 0);
    el.style.left = `${(tmp.x+1)*w/2}px`; el.style.top = `${(1-tmp.y)*h/2}px`;
  }
  const chart=createProductChart({group:groups[4],layout,root,scale,show,project});
  function load() {
    if (started) return; started = true;
    [...new Set(PRODUCT_STATIONS.filter(s=>s.image).map(s => s.image))].forEach(src => {
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
    if (s < 27) return retractProductOutlines(live,drawn,0,productDetours(s));
    if (s < 28) return retractProductOutlines(live,drawn,productFold(s),productDetours(s));
    copyPose(live,clean);
    return alignProductMark(live,clean,center,stone,s,scale);
  }
  function keys(k,w=1440,h=900) {
    // Products sit right of the caption. All offsets are in the stone's world units.
    PRODUCT_STATIONS.forEach((s,i) => {
      if(i>=3) { const {pos,look}=productHoldCamera(layout,i,w,h,scale); k(s.hold[0],pos,look);k(s.hold[1],pos.clone(),look.clone());return; }
      const c = centers[i], distance = [280,255,305,360,255][i];
      const look = c.clone().add(V(-[24,26,38,44,32][i],0,0));
      const offset = i===1 ? V(0,205,150) : V(0,8,distance);
      // Tip down early enough to pick up the plan before the phone leaves.
      if(i===1) k(18.28,c.clone().add(V(-68,310,105)),c.clone().add(V(-19,58,-54)));
      // Rise above the J with the pen, retaining the plan as a receding surface.
      // Then tilt toward the arriving tile before settling into its original hold.
      if(i===2) {
        const high=c.clone().add(V(-42,130,45));
        k(20.25,high,centers[1].clone().add(V(-20,184,-42)));
        k(20.43,high.clone().add(V(0,0,55)),look.clone());
      }
      k([15.98,18.55,20.6,22.85,24.95][i],look.clone().add(offset),look);
      k(s.hold[1],look.clone().add(offset).add(V(2,0,-5)),look);
    });
    // 340.49 units / (2 * 1335 * tan(12°)) = 60% of viewport height.
    k(28,center.clone().add(V(0,0,1335)),center.clone());
    k(28.8,center.clone().add(V(0,0,1335)),center.clone());
    k(29.45,center.clone().add(V(0,0,1335)),center.clone());
  }
  function update(s,{cam,w,h,px,py,time,dt,pointer,hitTest,stone}) {
    if (s >= 10.9) {load();film.load();}
    const inChapter = s>15.8 && s<29.3, fold=productFold(s), keep=1-fold;
    dust.visible=inChapter;dust.material.uniforms.alpha.value=.24*seg(s,15.8,16.2)*(1-seg(s,28.8,29.3));
    const swell=ease(seg(s,28.8,29.3));
    endCaps.forEach(m=>{
      m.visible=s>28.8&&s<29.36;
      tmp.copy(m.userData.at).sub(center).add(V(0,0,MARK_FACE_Z*scale)).applyQuaternion(stone.quaternion).add(stone.position);
      m.position.copy(m.userData.at).lerp(tmp,swell);m.scale.setScalar(LOGO_R*scale*swell);
    });
    capMaterial.color.setScalar(1.35+3*swell);capMaterial.opacity=productTubeOpacity(s);
    const hitMeshes = images.filter(m=>m.visible && m.material.uniforms.opacity.value>.2);
    hover=-1;
    groups.forEach(g=>g.updateMatrixWorld(true));
    if (inChapter && s<27.6 && pointer.inside) {const hit=hitTest(hitMeshes);if(hit){hover=hit.object.userData.station;}}
    groups.forEach((g,i)=>{
      g.visible=inChapter;
      g.scale.setScalar(i===4 ? 1 : Math.max(.001,keep));
      g.rotation.y = i===1 || i>=3 || s>=27 ? 0 : px*.025;
      g.rotation.x = i===1 || i>=3 || s>=27 ? 0 : py*.018;
      const {opacity:a,y}=captionPose(i,s);
      caps[i].style.width=`${Math.min(380,w*.27)}px`;
      show(caps[i],a); caps[i].style.transform=`translateY(${y}px)`;
    });
    images.forEach(m=>{m.visible=inChapter; m.material.uniforms.opacity.value=stationImageOpacity(m.userData.station,s)*(m.userData.loaded ? 1:0);});
    phone.material.uniforms.reveal.value=1.04*ease(seg(s,15.92,16.18));
    const lift=ease(seg(s,17.1,17.8));
    print.position.copy(centers[0]).sub(anchors[0]).add(V(20*lift,5.64+2*lift, .2+21*lift));
    print.scale.setScalar(1+.6*lift); print.rotation.y=-.18*lift;
    print.material.uniforms.opacity.value*=seg(s,17,17.1);
    paper.position.copy(print.position).add(V(0,0,-.15)); paper.scale.copy(print.scale);paper.rotation.copy(print.rotation); paper.material.uniforms.opacity.value=lift*stationImageOpacity(0,s);
    plan.material.uniforms.opacity.value*=ease(seg(s,18.1,18.3));
    rfa.material.uniforms.reveal.value=1.04*ease(seg(s,20.15,20.35));
    const arrival=ease(seg(s,22.6,22.95)), filmState=film.draw(s>=27?1:1+Math.round(35*ease(seg(s,23.55,24.35))));
    arden.userData.loaded=filmState.frame>0;
    arden.position.copy(centers[3]).sub(anchors[3]).add(V(0,-6*(1-arrival),0));arden.scale.setScalar(.97+.03*arrival);
    arden.material.uniforms.opacity.value=filmState.frame?arrival*stationImageOpacity(3,s):0;
    arden.updateMatrixWorld(true);
    const partPoint=p=>arden.localToWorld(V((p.x_pct/100-.5)*ARDEN_SIZE[0],(.5-p.y_pct/100)*ARDEN_SIZE[1],.15));
    const indicator=filmState.parts.capture_indicator;
    led.visible=!!indicator?.visible&&s>=23&&s<23.55;
    if(indicator)led.position.copy(groups[3].worldToLocal(partPoint(indicator)));
    led.material.color.setScalar((1.5+.15*Math.sin(time*2))*(hover===3?1.6:1));
    led.scale.setScalar(hover===3?1.25:1);
    let nearest=null, distance=36;
    if(s>=23&&s<=24.65&&pointer.inside) {
      for(const name of ARDEN_PARTS) {
        const part=filmState.parts[name.id];if(!part?.visible)continue;
        const at=partPoint(part), screen=at.clone().project(cam), d=Math.hypot((screen.x+1)*w/2-pointer.x,(1-screen.y)*h/2-pointer.y);
        if(d<distance){distance=d;nearest={name,at};}
      }
    }
    // The transparent rectangle itself is not a link. Only its measured content
    // or a visible part can claim the Arden station cursor.
    if(hover===3) {
      const hit=hitTest([arden]);
      const box=filmState.frame<=10?[.149,.414,.999,.769]:filmState.frame<28?[.048,.182,.952,.769]:[.072,.182,.894,.715];
      if(!hit?.uv || hit.uv.x<box[0] || hit.uv.x>box[2] || 1-hit.uv.y<box[1] || 1-hit.uv.y>box[3] || s<23 || s>24.65)hover=-1;
    }
    if(nearest)hover=3;
    const screenPoint=at=>{const p=at.clone().project(cam);return {x:(p.x+1)*w/2,y:(1-p.y)*h/2};};
    const [x0,y0,x1,y1]=ARDEN_BOUNDS[2];
    const topLeft=screenPoint(partPoint({x_pct:x0*100,y_pct:y0*100})),bottomRight=screenPoint(partPoint({x_pct:x1*100,y_pct:y1*100}));
    const contentBox={left:topLeft.x,top:topLeft.y,right:bottomRight.x,bottom:bottomRight.y};
    const stemX=screenPoint(anchors[3]).x;
    partEls.forEach((el,i)=>{
      const part=filmState.parts[el.dataset.ardenPart];
      const alpha=seg(s,24.2+i*.05,24.35+i*.05)*(1-seg(s,24.65,24.8))*(nearest ? .35 : 1);
      if(part?.visible) {
        const at=partPoint(part),dot=screenPoint(at),label=el.querySelector('span');
        project(el,at,cam,w,h,alpha);
        const pose=ardenLabelPose(el.dataset.ardenPart,dot,contentBox,[label.offsetWidth,label.offsetHeight],stemX,[w,h]);
        label.style.left=(pose.x-dot.x)+'px';label.style.top=(pose.y-dot.y)+'px';
        el.querySelector('path').setAttribute('d',pose.points.map((p,j)=>(j?'L':'M')+' '+(p.x-dot.x)+' '+(p.y-dot.y)).join(' '));
      } else show(el,0);
    });
    if(nearest) {
      hoverTag.querySelector('span').textContent=nearest.name[hoverTag.dataset.lang==='en'?'en':'zh'];
      project(hoverTag,nearest.at,cam,w,h,1);
      const projected=nearest.at.clone().project(cam);hoverTag.classList.toggle('is-left',(projected.x+1)*w/2>w-320);
    } else show(hoverTag,0);
    const pointAlpha=seg(s,27.55,28.05)*(1-seg(s,28.8,29));
    points.forEach((el,i)=>project(el,anchors[i],cam,w,h,pointAlpha));
    show(ending,seg(s,28,28.2)*(1-seg(s,28.8,29)));
    project(tags[0],route[0].clone().add(V(-4,4,0)),cam,w,h,seg(s,18.75,19)*(1-seg(s,20.35,20.6)));
    project(tags[1],route.at(-1).clone().add(V(0,5,0)),cam,w,h,seg(s,19.65,19.85)*(1-seg(s,20.35,20.6)));
    chipEls.forEach((el,i)=>{
      const t=ease(seg(s,21.5+i*.07,21.95+i*.07));
      const at=centers[2].clone().add(V(-34+(i%3)*7+(1-t)*65,18-Math.floor(i/3)*7+(1-t)*25,4+(1-t)*25));
      project(el,at,cam,w,h,t*(1-seg(s,22.7,22.95)));
    });
    const codeAlpha=seg(s,21.5,21.7)*(1-seg(s,22.7,22.95));show(code,codeAlpha);
    const full=TOKEN_LINES.join('\n'), typed=full.slice(0,Math.floor(seg(s,21.5,22.05)*full.length));
    if(codeText.textContent!==typed)codeText.textContent=typed;
    show(proof,seg(s,22.05,22.25));
    const chartHover=chart.update(s,{cam,w,h,dt,pointer});if(chartHover>=0)hover=chartHover;
    // The projected DOM nodes have real links, so their hover/focus also names the cursor.
    if (pointAlpha>.2) points.forEach((el,i)=>{if(el.matches(':hover,:focus-visible'))hover=i;});
    return hover;
  }
  // Tube's reveal has a 1.02 head allowance; compensate so a held endpoint
  // cannot start the next stroke before its scheduled beat.
  return {layout, drawn, clean, keys, pose, update, reveal:s=>s<15.92||s>=27?1:strokeReveal(s,drawn.ends)/1.02, get hover(){return hover;}, dispose(){disposed=true;film.dispose();chart.dispose();ownedTextures.forEach(t=>t.dispose());}};
}
