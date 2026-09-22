import {useEffect, useRef} from 'react';

const clamp=x=>Math.max(0,Math.min(1,x));
const range=(x,a,b)=>clamp((x-a)/(b-a));
const ease=x=>x*x*(3-2*x);
const windowed=(x,a,b,c,d)=>ease(range(x,a,b))*(1-ease(range(x,c,d)));
const mix=(a,b,p)=>a+(b-a)*p;

// Layout follows scroll. Ambient transforms live on separate children, with a
// clock that pauses offscreen and survives language changes.
export function usePostJourney({reduced,blossomProgress,lang}) {
 const ambient=useRef({art:0,ribbon:0});
 useEffect(()=>{
  document.body.classList.toggle('quiet',reduced);
  if(reduced){blossomProgress.current=0;return;}
  const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
  const intro=q('.intro-journey'),art=q('.art-journey'),track=q('.art-track'),bridge=q('.art-bridge'),finale=q('.finale-journey');
  const shared=q('.shared-petal'),branchOuter=q('.art-branch-scroll'),branch=q('.art-branch'),light=q('.art-light'),opening=q('.art-opening h2'),atmosphere=q('.art-atmosphere');
  const ground=q('.finale-ground'),small=q('.blossom-small-copy'),bloom=q('.bloom-title'),philosophy=q('.philosophy'),ribbon=q('.philosophy-ribbon'),returnCopy=q('.return-copy');
  const words=qa('.reading-text span'),cards=qa('.art-work');
  let raf=0,alive=true,last=performance.now(),previousY=scrollY,energy=1,wi=innerWidth,he=innerHeight,m={};
  const opacity=(el,a)=>{if(!el)return;el.style.opacity=a;el.style.visibility=a>.002?'visible':'hidden';};
  const show=(el,a,y=0)=>{opacity(el,a);el.style.transform=`translate3d(0,${y}px,0)`;};
  function resize(){wi=innerWidth;he=innerHeight;m={intro:intro.offsetTop,introH:intro.offsetHeight-he,art:art.offsetTop,artH:art.offsetHeight-he,finale:finale.offsetTop,finaleH:finale.offsetHeight-he,bridge:bridge.offsetTop,travel:Math.max(0,track.scrollWidth-wi)};}
  resize();const ro=new ResizeObserver(resize);[intro,q('.systems-section'),track,art,bridge,finale].forEach(el=>ro.observe(el));window.addEventListener('resize',resize);
  const reveals=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('has-entered');reveals.unobserve(entry.target);}}),{threshold:.16});cards.forEach(el=>reveals.observe(el));
  function draw(now){
   if(!alive)return;
   const dt=Math.min(.05,(now-last)/1000);last=now;
   if(document.hidden || document.body.classList.contains('portfolio-route-open')){raf=requestAnimationFrame(draw);return;}
   const y=scrollY,mobile=wi<700,velocity=Math.abs(y-previousY)/Math.max(dt,.001);previousY=y;
   energy=mix(energy,velocity>900?.35:1,1-Math.exp(-dt/0.6));
   const fp=range(y,m.intro+m.introH*.93,m.intro+m.introH+he*1.03);
   opacity(shared,windowed(fp,0,.10,.72,1));
   shared.style.transform=`translate3d(${wi*(.5+Math.sin(fp*Math.PI*1.6)*.16)}px,${he*mix(.54,.19,fp)}px,0) rotate(${fp*190-30}deg) scale(${.8+Math.sin(fp*Math.PI)*2.5})`;
   const ap=clamp((y-m.art)/m.artH),artVisible=y+he>m.art&&y<m.art+m.artH+he;
   if(artVisible){ambient.current.art+=dt*energy*(mobile?.6:1);}
   const t=ambient.current.art,amp=mobile?.5:1;
   track.style.transform=`translate3d(${-ap*m.travel}px,0,0)`;
   q('.art-progress i').style.transform=`scaleX(${ap})`;
   branchOuter.style.transform=`translate3d(${-ap*180}px,0,0) rotate(${-ap*7}deg)`;
   branch.style.setProperty('--branch-r',`${Math.sin(t*Math.PI*2/14)*.6*amp}deg`);
   branch.style.setProperty('--branch-y',`${Math.sin(t*Math.PI*2/17)*3*amp}px`);
   light.style.setProperty('--light-x',`${Math.sin(t*Math.PI*2/22)*1.2*amp}%`);
   light.style.setProperty('--light-y',`${Math.cos(t*Math.PI*2/25)*.8*amp}%`);
   opening.style.setProperty('--heading-y',`${Math.sin(t*Math.PI*2/16)*2.5*amp}px`);
   const artExit=ease(range(ap,.76,1));atmosphere.style.opacity=1-artExit;branchOuter.style.opacity=1-artExit;
   const bp=range(he-(m.bridge-y),0,he*1.8);
   q('.bridge-petal').style.transform=`translate3d(${mix(-wi*.25,wi*.3,bp)}px,${mix(-90,180,bp)}px,0) rotate(${bp*220}deg) scale(${mix(.4,3,bp)})`;
   bridge.style.setProperty('--bridge-reveal',ease(range(bp,.12,.6)));
   const f=clamp((y-m.finale)/m.finaleH);blossomProgress.current=f;
   const dark=ease(range(f,.38,.5))*(1-ease(range(f,.745,.90)));
   ground.style.background=`rgb(${Math.round(mix(250,9,dark))},${Math.round(mix(251,9,dark))},${Math.round(mix(252,11,dark))})`;
   const navTone=dark>.48?'dark':'light';if(finale.dataset.navTone!==navTone)finale.dataset.navTone=navTone;
   show(small,1-ease(range(f,.07,.17)));show(bloom,windowed(f,.15,.23,.43,.49),mix(45,-35,range(f,.15,.48)));
   show(philosophy,windowed(f,.48,.51,.71,.765));opacity(ribbon,windowed(f,.48,.52,.71,.77));
   ribbon.style.transform=`translateX(${-range(f,.48,.77)*wi*.65}px) rotate(-8deg)`;
   if(f>.47&&f<.78)ambient.current.ribbon+=dt*energy;
   ribbon.firstElementChild.style.transform=`translateX(${-((ambient.current.ribbon*(mobile?7:12))%(wi*.7))}px)`;
   const reading=range(f,.515,.705);words.forEach((el,i)=>{el.style.color=i/words.length<reading?'#f5f5f7':'#53535c';});
   show(returnCopy,ease(range(f,.91,.96)),mix(25,0,ease(range(f,.91,.96))));
   q('.journey-indicator i').style.transform=`scaleY(${y/Math.max(1,document.documentElement.scrollHeight-he)})`;
   raf=requestAnimationFrame(draw);
  }
  raf=requestAnimationFrame(draw);
  return()=>{alive=false;cancelAnimationFrame(raf);ro.disconnect();reveals.disconnect();window.removeEventListener('resize',resize);};
 },[reduced,lang]);
}
