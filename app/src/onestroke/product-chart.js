import * as THREE from 'three';
import {plans, scenarios, annualPremium, scenarioCost, totalDifference, money} from '../product/v2/data/cntl-model.js';
import {CHART_ROWS, costX, productFold} from './product-layout.js';

const seg=(s,a,b)=>Math.max(0,Math.min(1,(s-a)/(b-a)));
const ease=t=>t*t*(3-2*t);
export function createProductChart({group,layout,root,scale,show,project}) {
  const {world,anchors}=layout, local=p=>world(p).sub(anchors[4]);
  const rowEls=[...root.querySelectorAll('[data-cost-row]')], valueEls=[...root.querySelectorAll('[data-cost-value]')];
  const ticks=[...root.querySelectorAll('[data-cost-tick]')], axis=root.querySelector('[data-cost-axis]');
  const controls=root.querySelector('[data-cost-controls]'), chips=[...root.querySelectorAll('[data-cost-scenario]')];
  const flag=root.querySelector('[data-cost-flag]'), difference=root.querySelector('[data-cost-difference]');
  const proof=root.querySelector('[data-cost-proof]'), path=proof.querySelector('[data-cost-proof-line]');
  let selected='typical', preview=null, target='typical', elapsed=.35, enabled=false;
  let values=plans.map(p=>scenarioCost(p,target).total), from=[...values];
  const listeners=[];
  const on=(el,event,fn)=>{el.addEventListener(event,fn);listeners.push(()=>el.removeEventListener(event,fn));};
  for(const el of chips) {
    const id=el.dataset.costScenario;
    on(el,'pointerenter',()=>{if(enabled)preview=id;});
    on(el,'pointerleave',()=>{preview=null;});
    on(el,'click',e=>{e.stopPropagation();if(enabled){selected=id;preview=null;}});
    on(el,'keydown',e=>{
      if(!enabled || !['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();const i=scenarios.findIndex(s=>s.id===id);
      const next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;
      selected=scenarios[next].id;preview=null;chips[next].focus();
    });
  }
  function quad(w,h) {
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w*scale,h*scale),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,depthWrite:false}));
    group.add(mesh);return mesh;
  }
  const rows=plans.map((p,i)=>{
    const lo=costX(annualPremium(p)), hi=costX(annualPremium(p)+p.oopMax), y=CHART_ROWS[i];
    const track=quad(1,.22), ends=[quad(.15,1.6),quad(.15,1.6)];
    const dot=new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({transparent:true,depthWrite:false,toneMapped:false}));group.add(dot);
    return {lo,hi,y,track,ends,dot};
  });
  const tickMeshes=ticks.map((_,i)=>{const m=quad(.14,1);m.position.copy(local([costX(i*300000),361]));return m;});
  const screen=(p,cam,w,h)=>{const v=world(p).project(cam);return {x:(v.x+1)*w/2,y:(1-v.y)*h/2};};
  return {
    update(s,{cam,w,h,dt,pointer}) {
      const active=s>=25.6&&s<=27, fade=1-seg(s,27,27.3), fold=productFold(s);
      const chipAlpha=seg(s,25.65,25.85)*fade;
      enabled=active&&chipAlpha>.005;
      if(!enabled)preview=null;
      const scenario=preview||selected;
      if(scenario!==target){target=scenario;from=[...values];elapsed=0;}
      elapsed=Math.min(.35,elapsed+dt);const glide=1-(1-elapsed/.35)**3;
      values=plans.map((p,i)=>from[i]+(scenarioCost(p,target).total-from[i])*glide);
      const best=plans.reduce((a,p)=>scenarioCost(p,scenario).total<scenarioCost(a,scenario).total?p:a,plans[0]);
      let hovered=-1;
      rows.forEach((r,i)=>{
        const a=screen([r.lo,r.y],cam,w,h),b=screen([r.hi,r.y],cam,w,h);
        if(active&&((pointer.inside&&pointer.x>=a.x-8&&pointer.x<=b.x+8&&Math.abs(pointer.y-a.y)<14)||rowEls[i].matches(':hover,:focus-visible')))hovered=i;
      });
      rows.forEach((r,i)=>{
        const grow=ease(seg(s,24.85+i*.06,25.12+i*.06)), on=plans[i]===best;
        const y=r.y+(359-r.y)*fold, left=r.lo+(370-r.lo)*fold, right=r.lo+(r.hi-r.lo)*grow;
        const end=right+(370-right)*fold;
        r.track.position.copy(local([(left+end)/2,y]));r.track.scale.x=Math.max(.001,end-left);
        r.track.material.opacity=grow*(1-fold)*(hovered===i ? .9 : on ? .65 : .4);
        r.ends.forEach((m,j)=>{m.position.copy(local([j?end:left,y]));m.material.opacity=grow*(1-fold)*.4;});
        const total=annualPremium(plans[i])+(values[i]-annualPremium(plans[i]))*ease(seg(s,25.25,25.8));
        const x=costX(total), dotAlpha=seg(s,25.15,25.23)*fade;
        r.dot.position.copy(local([x,r.y]));r.dot.position.z+=.1;
        r.dot.scale.setScalar((on?1.1:.95)*scale);r.dot.material.color.set(on?0xffffff:0x9a9aa0);r.dot.material.opacity=dotAlpha;
        // HDR white stays white on screen and crosses the existing 1.35 bloom threshold.
        if(on)r.dot.material.color.multiplyScalar(1.6);
        project(rowEls[i],world([308,r.y]),cam,w,h,grow*fade);
        rowEls[i].style.color=on?'#fff':'#ffffffa6';rowEls[i].style.pointerEvents=active?'auto':'none';rowEls[i].tabIndex=active?0:-1;
        project(valueEls[i],world([x,r.y]),cam,w,h,dotAlpha);
        valueEls[i].style.color=on?'#fff':'#ffffffb3';valueEls[i].style.fontWeight=on?'600':'400';
        const c=scenarioCost(plans[i],scenario),en=controls.dataset.lang==='en';
        valueEls[i].textContent=hovered===i?(en?`${money(c.premium)} premium + ${money(c.outOfPocket)} out of pocket`:`保费 ${money(c.premium)} + 自付 ${money(c.outOfPocket)}`):money(Math.round(total/100)*100);
        // Keep the expanded value inside the viewport without moving the dot.
        valueEls[i].style.transform=hovered===i?'translate(-70%,-100%)':'translate(-50%,-100%)';
      });
      const axisAlpha=seg(s,24.75,25.0)*(1-fold);
      ticks.forEach((el,i)=>{project(el,world([costX(i*300000),359]),cam,w,h,axisAlpha);tickMeshes[i].material.opacity=axisAlpha*.5;});
      project(axis,world([409,359]),cam,w,h,axisAlpha);
      const chipAt=world([308,299]), flagAt=world([409,299]);
      project(controls,chipAt,cam,w,h,chipAlpha);controls.style.pointerEvents=enabled?'auto':'none';
      chips.forEach(el=>{el.disabled=!enabled;el.tabIndex=enabled?0:-1;el.setAttribute('aria-pressed',String(el.dataset.costScenario===selected));el.classList.toggle('is-active',el.dataset.costScenario===scenario);});
      const displayed=values.map((v,i)=>annualPremium(plans[i])+(v-annualPremium(plans[i]))*ease(seg(s,25.25,25.8)));
      const a=screen([costX(displayed[0]),309],cam,w,h), b=screen([costX(displayed[1]),321],cam,w,h);
      proof.setAttribute('viewBox',`0 0 ${w} ${h}`);
      path.setAttribute('d',`M ${a.x} ${a.y+8} V ${b.y} H ${b.x-8}`);
      const length=Math.max(1,b.y-a.y-8+Math.abs(b.x-a.x)-8), draw=seg(s,25.8,26.05);
      // Clip the dashed path in path-length space without stretching its 3/4px dashes.
      const mask=proof.querySelector('[data-cost-proof-mask]');mask.setAttribute('d',path.getAttribute('d'));mask.style.strokeDasharray=`${length}`;mask.style.strokeDashoffset=`${length*(1-draw)}`;
      show(proof,fade*(s>=25.8?1:0));
      project(difference,world([(costX(values[0])+costX(values[1]))/2,321]),cam,w,h,seg(s,26.0,26.2)*fade);
      difference.textContent=`+${money(totalDifference(plans[1],plans[0],scenario))}`;
      project(flag,flagAt,cam,w,h,seg(s,26.0,26.2)*fade);
      flag.style.top=`${screen([409,299],cam,w,h).y-34}px`;
      flag.textContent=controls.dataset.lang==='en'?`Plan B: +${money(totalDifference(plans[1],plans[0],scenario))} a year · same coverage as A`:`Plan B：每年多 ${money(totalDifference(plans[1],plans[0],scenario))} · 保障与 Plan A 相同`;
      return hovered>=0?4:-1;
    },
    dispose(){listeners.forEach(fn=>fn());},
  };
}
