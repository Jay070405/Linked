import {useEffect, useId, useLayoutEffect, useReducer, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {author} from '../portfolioData';
import OriginalLogo from './OriginalLogo';
import {contactLinks, contactState, tabDestination} from './contact-model';
import './Contact.css';

export function ContactRows({lang='en', className=''}) {
  const en=lang==='en', [copy,setCopy]=useState('idle'), timer=useRef();
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  const copyEmail=async()=>{
    try { await navigator.clipboard.writeText(author.email); setCopy('copied'); }
    catch { setCopy('failed'); }
    clearTimeout(timer.current);timer.current=setTimeout(()=>setCopy('idle'),2500);
  };
  return <div className={`contact-rows ${className}`}>
    {contactLinks(author,lang).map(row=><div className={`contact-row contact-row-${row.id}`} key={row.id}>
      <a data-h href={row.href} {...(row.id!=='email'?{target:'_blank',rel:'noreferrer'}:{})}>{row.label}<span aria-hidden="true">{row.id==='email'?'':'↗'}</span></a>
      {row.id==='email'&&<button data-h type="button" onClick={copyEmail} aria-label={en?'Copy email address':'复制邮箱地址'}>{copy==='copied'?(en?'Copied':'已复制'):(en?'Copy':'复制')}</button>}
    </div>)}
    <span className="contact-announcement" role="status">{copy==='copied'?(en?'Email copied':'邮箱已复制'):copy==='failed'?(en?'Copy unavailable. Select the email address to copy it.':'暂时无法复制，请选中邮箱地址手动复制。'):''}</span>
  </div>;
}

const quietMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches||document.body.classList.contains('quiet');
// The card grows out of the status pill (from its top-right, where the pill sits) and folds back into it; on phones,
// where it is a bottom sheet, it slides up. The content follows line by line. The clip first opens to the card's own
// 24px shape, then widens past it so the shadow fades in.
function cardFrames(card, pill) {
  const c=card.getBoundingClientRect(), p=pill?.getBoundingClientRect();
  if(matchMedia('(max-width:600px)').matches) return [{transform:'translateY(100%)'},{transform:'none'}];
  if(!p?.width) return [{opacity:0,transform:'translateY(-6px) scale(.97)'},{opacity:1,transform:'none'}];
  return [{transform:`translate(${p.right-c.right}px,${p.top-c.top}px)`,clipPath:`inset(0 0 ${Math.max(0,c.height-p.height)}px ${Math.max(0,c.width-p.width)}px round ${p.height/2}px)`},
    {offset:.82,transform:'none',clipPath:'inset(0 0 0 0 round 24px)'},
    {transform:'none',clipPath:'inset(-80px -80px -100px -80px round 104px)'}];
}
const reversed=frames=>frames.slice().reverse().map(frame=>'offset' in frame?{...frame,offset:1-frame.offset}:frame);
const cardParts=card=>[card.querySelector('header'),card.querySelector('.contact-availability'),...card.querySelectorAll('.contact-row'),card.querySelector('.contact-close')].filter(Boolean);
function openCard(card, pill) {
  card.getAnimations({subtree:true}).forEach(a=>a.cancel());card.classList.remove('is-closing');
  if(quietMotion())return;
  card.animate(cardFrames(card,pill),{duration:560,easing:'cubic-bezier(.32,.72,0,1)'});
  cardParts(card).forEach((part,i)=>part.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:380,delay:170+i*45,easing:'cubic-bezier(.2,.8,.2,1)',fill:'backwards'}));
}
function closeCard(card, pill) {
  if(quietMotion())return Promise.resolve();
  card.classList.add('is-closing');
  cardParts(card).forEach(part=>part.animate([{opacity:1},{opacity:0}],{duration:120,easing:'ease-out',fill:'forwards'}));
  return card.animate(reversed(cardFrames(card,pill)),{duration:340,delay:60,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'}).finished;
}

export default function ContactPill({lang='en', hidden=false, tone='light'}) {
  const en=lang==='en', [open,dispatch]=useReducer(contactState,false), [shown,setShown]=useState(false), trigger=useRef(null), dialog=useRef(null), id=useId();
  // the card stays mounted while it folds away
  useEffect(()=>{if(open)setShown(true);},[open]);
  useLayoutEffect(()=>{
    if(!shown)return;
    const panel=dialog.current;panel.showModal();openCard(panel,trigger.current);
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    panel.querySelector('button')?.focus();
    return ()=>{panel.close();document.body.style.overflow=overflow;trigger.current?.focus({preventScroll:true});};
  },[shown]);
  useEffect(()=>{
    if(open||!shown)return;
    const panel=dialog.current;let alive=true;
    closeCard(panel,trigger.current).then(()=>{if(alive)setShown(false);},()=>{});
    // opened again while folding: unfold from where it is
    return ()=>{alive=false;if(panel.isConnected)openCard(panel,trigger.current);};
  },[open,shown]);
  useEffect(()=>{if(hidden)dispatch('close');},[hidden]);
  // "Contact" in the nav or Menu on pages outside the homepage journey opens this card instead of reloading the homepage
  useEffect(()=>{const show=()=>dispatch('open');addEventListener('jl:contact',show);return()=>removeEventListener('jl:contact',show);},[]);
  const keyboard=e=>{
    if(e.key!=='Tab')return;
    const controls=[...dialog.current.querySelectorAll('a[href],button:not([disabled])')];
    e.preventDefault();controls[tabDestination(controls.indexOf(document.activeElement),controls.length,e.shiftKey)]?.focus();
  };
  return <>
    <button ref={trigger} className="contact-pill" type="button" hidden={hidden} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={()=>dispatch('toggle')}>
      <i aria-hidden="true"/><span className="contact-status-long">{en?'Open to product roles · mid-2027':'在找产品岗位 · 2027 年年中'}</span><span className="contact-status-short">{en?'Contact':'联系'}</span>
    </button>
    {shown&&createPortal(<dialog ref={dialog} id={id} className="contact-dialog" data-tone={tone} aria-labelledby={`${id}-name`} onKeyDown={keyboard}
      onCancel={e=>{e.preventDefault();dispatch('escape');}} onPointerDown={e=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dispatch('outside');}}>
      <button className="contact-close" type="button" onClick={()=>dispatch('close')} aria-label={en?'Close contact card':'关闭联系卡片'}>×</button>
      <header><span className="contact-logo"><OriginalLogo/></span><div><h2 id={`${id}-name`}>Jay Lin</h2><p>{en?'Product management · Game systems design':'产品经理 · 游戏系统策划'}</p></div></header>
      <p className="contact-availability">{en?'Open to full-time roles from mid-2027. English and Mandarin.':'2027 年年中起可全职入职。工作语言：英语、普通话。'}</p>
      <ContactRows lang={lang}/>
    </dialog>,document.body)}
  </>;
}
