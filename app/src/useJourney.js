import {useEffect} from 'react';

const clamp=x=>Math.max(0,Math.min(1,x));
const range=(x,a,b)=>clamp((x-a)/(b-a));
const ease=x=>x*x*(3-2*x);
const windowed=(x,a,b,c,d)=>ease(range(x,a,b))*(1-ease(range(x,c,d)));
const mix=(a,b,p)=>a+(b-a)*p;

export function useJourney({reduced,blossomProgress,lang}) {
 useEffect(()=>{
  let raf=0,alive=true,lastTime=-1;
  document.body.classList.toggle('quiet',reduced);
  if(reduced){blossomProgress.current=0;return()=>{};}
  const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
  const intro=q('.intro-journey'),office=q('.office-camera'),film=q('.film-window'),video=q('#journey-video'),after=q('.after-video'),follow=q('.intro-follow');
  const art=q('.art-journey'),track=q('.art-track'),finale=q('.finale-journey');
  const els={officeCopy:q('.office-copy'),hint:q('.hero-hint'),monitor:q('.monitor-world'),creative:q('.film-creative'),believe:q('.film-believe'),about:q('.film-intro'),skills:q('.film-skills'),timeline:q('.film-timeline'),final:q('.film-final')};
  const opacity=(el,a)=>{el.style.opacity=a;el.style.visibility=a>.002?'visible':'hidden';};
  const show=(el,a,y=0)=>{opacity(el,a);el.style.transform=`translate3d(0,${y}px,0)`;};
  let wi=innerWidth,he=innerHeight,measure={};
  function resize(){wi=innerWidth;he=innerHeight;measure={intro:intro.offsetTop,introH:intro.offsetHeight-he,art:art.offsetTop,artH:art.offsetHeight-he,finale:finale.offsetTop,finaleH:finale.offsetHeight-he,travel:track.scrollWidth-wi};}
  resize();window.addEventListener('resize',resize);const ro=new ResizeObserver(resize);ro.observe(track);ro.observe(intro);
  let seekTarget=0;
  function draw(){if(!alive)return;const y=window.scrollY;const p=clamp((y-measure.intro)/measure.introH),mobile=wi<700;
   const zoom=ease(range(p,.07,.215)),ow=Math.max(wi,he*1.6014),oh=ow/1.6014,scale=mix(1,Math.max(wi/(ow*.286),he/(oh*.265))*1.012,zoom);
   office.style.width=ow+'px';office.style.height=oh+'px';office.style.transform=`translate(-50%,-50%) scale(${scale}) translate(${-ow*.041*zoom}px,${oh*.034*zoom}px)`;
   opacity(office,1-ease(range(p,.21,.222)));opacity(els.monitor,ease(range(p,.12,.18)));opacity(els.officeCopy,1-ease(range(p,.025,.07)));opacity(els.hint,1-ease(range(p,.025,.07)));
   const shrink=ease(range(p,.80,.925)),leave=ease(range(p,.955,1));
   const fw=mix(wi,mobile?wi*.78:wi*.47,shrink),fh=mix(he,mobile?wi*.78*.68:Math.min(he*.6,wi*.47*.71),shrink);
   film.style.width=fw+'px';film.style.height=fh+'px';film.style.transform=`translate(-50%,calc(-50% - ${leave*he*.92}px))`;film.style.borderRadius=0;opacity(film,ease(range(p,.208,.22)));
   after.style.opacity=shrink;after.style.transform=`translateY(${-leave*he*.7}px)`;
   q('.band-a span').style.transform=`translateX(${-range(p,.80,1)*wi*.6}px)`;q('.band-b span').style.transform=`translateX(${-.5*wi+range(p,.8,1)*wi*.6}px)`;
   seekTarget=range(p,.225,.795)*15.02;
   if(video.readyState>=2&&!video.seeking&&Math.abs(video.currentTime-seekTarget)>.045){video.currentTime=seekTarget;lastTime=seekTarget;}
   show(els.creative,windowed(p,.225,.238,.305,.34),-range(p,.27,.34)*he*.5);
   show(els.believe,windowed(p,.332,.347,.40,.425),-range(p,.40,.425)*70);
   show(els.about,windowed(p,.43,.449,.499,.52),-range(p,.499,.52)*45);
   show(els.skills,windowed(p,.532,.55,.604,.628),-range(p,.604,.628)*30);
   show(els.timeline,windowed(p,.64,.661,.70,.723),-range(p,.70,.723)*30);
   show(els.final,windowed(p,.736,.752,.80,.827),-range(p,.80,.827)*40);
   const fp=range(y,measure.introH*.93,measure.introH+he*1.03),shared=q('.shared-petal');
   opacity(shared,windowed(fp,0,.10,.72,1));
   shared.style.transform=`translate3d(${wi*(.5+Math.sin(fp*Math.PI*1.6)*.16)}px,${he*mix(.54,.19,fp)}px,0) rotate(${fp*190-30}deg) scale(${.8+Math.sin(fp*Math.PI)*2.5})`;
   const ap=clamp((y-measure.art)/measure.artH);track.style.transform=`translate3d(${-ap*measure.travel}px,0,0)`;q('.art-progress i').style.transform=`scaleX(${ap})`;q('.art-branch').style.transform=`translateX(${-ap*180}px) rotate(${-ap*7}deg)`;
   const artExit=ease(range(ap,.76,1));art.style.backgroundColor=`rgb(${mix(32,24,artExit)},${mix(57,43,artExit)},${mix(44,32,artExit)})`;q('.art-atmosphere').style.opacity=1-artExit;q('.art-branch').style.opacity=.2*(1-artExit);
   const bridge=q('.art-bridge'),bp=range(he-bridge.getBoundingClientRect().top,0,he*1.8);q('.bridge-petal').style.transform=`translate3d(${mix(-wi*.25,wi*.3,bp)}px,${mix(-90,180,bp)}px,0) rotate(${bp*220}deg) scale(${mix(.4,3,bp)})`;bridge.style.setProperty('--bridge-reveal',ease(range(bp,.12,.60)));
   const f=clamp((y-measure.finale)/measure.finaleH);blossomProgress.current=f;
   const dark=ease(range(f,.38,.5))*(1-ease(range(f,.75,.90)));
   q('.finale-ground').style.background=`rgb(${Math.round(mix(24,9,dark))},${Math.round(mix(43,13,dark))},${Math.round(mix(32,11,dark))})`;
   show(q('.blossom-small-copy'),1-ease(range(f,.07,.17)));show(q('.bloom-title'),windowed(f,.15,.23,.43,.49),mix(45,-35,range(f,.15,.48)));
   show(q('.philosophy'),windowed(f,.48,.51,.71,.765));show(q('.philosophy-ribbon'),windowed(f,.48,.52,.71,.77));q('.philosophy-ribbon').style.transform=`translateX(${-range(f,.48,.77)*wi*.65}px) rotate(-8deg)`;
   const words=qa('.reading-text span'),reading=range(f,.515,.705);words.forEach((el,i)=>{el.style.color=i/words.length<reading?'#f1f4f1':'#48514b';});
   show(q('.return-copy'),ease(range(f,.91,.96)),mix(25,0,ease(range(f,.91,.96))));
   q('.journey-indicator i').style.transform=`scaleY(${y/(document.documentElement.scrollHeight-he)})`;
   document.body.classList.toggle('past-office',p>.225);
   raf=requestAnimationFrame(draw);
  }
  const onSeek=()=>{if(alive&&Math.abs(video.currentTime-seekTarget)>.06&&!video.seeking)video.currentTime=seekTarget;};video.addEventListener('seeked',onSeek);
  raf=requestAnimationFrame(draw);return()=>{alive=false;cancelAnimationFrame(raf);ro.disconnect();window.removeEventListener('resize',resize);video.removeEventListener('seeked',onSeek);};
 },[reduced,lang]);
}
