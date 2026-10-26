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
// The card grows out of the status pill: from a small card at the pill's centre it scales up and fades in, and it
// shrinks back into the pill; on phones, where it is a bottom sheet, it slides up. Only transform and opacity move, so
// the compositor keeps it smooth while the homepage's 3D scene keeps the main thread busy. The content follows line
// by line.
function cardFrames(card, pill) {
  const c=card.getBoundingClientRect(), p=pill?.getBoundingClientRect();
  if(matchMedia('(max-width:600px)').matches) return [{transform:'translateY(100%)'},{transform:'none'}];
  if(!p?.width) return [{opacity:0,transform:'translateY(-6px) scale(.97)'},{opacity:1,transform:'none'}];
  const origin=`${Math.min(c.width,Math.max(0,p.left+p.width/2-c.left)).toFixed(1)}px 0px`;
  return [{transformOrigin:origin,transform:`translateY(${(p.top+p.height/2-c.top).toFixed(1)}px) scale(.16)`,opacity:0},
    {offset:.3,opacity:1},
    {transformOrigin:origin,transform:'none',opacity:1}];
}
const reversed=frames=>frames.slice().reverse().map(frame=>'offset' in frame?{...frame,offset:1-frame.offset}:frame);
const cardParts=card=>[card.querySelector('header'),card.querySelector('.contact-availability'),...card.querySelectorAll('.contact-row'),card.querySelector('.contact-close')].filter(Boolean);
const stopMotion=card=>{card.getAnimations({subtree:true}).forEach(a=>a.cancel());card.classList.remove('is-closing');};
function openCard(card, pill) {
  stopMotion(card);
  if(quietMotion())return Promise.resolve();
  cardParts(card).forEach((part,i)=>part.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:440,delay:190+i*40,easing:'cubic-bezier(.25,.75,.25,1)',fill:'backwards'}));
  return card.animate(cardFrames(card,pill),{duration:600,easing:'cubic-bezier(.25,.75,.25,1)'}).finished;
}
function closeCard(card, pill) {
  stopMotion(card);
  if(quietMotion())return Promise.resolve();
  card.classList.add('is-closing');
  cardParts(card).forEach(part=>part.animate([{opacity:1},{opacity:0}],{duration:150,easing:'ease-out',fill:'forwards'}));
  return card.animate(reversed(cardFrames(card,pill)),{duration:400,easing:'cubic-bezier(.45,0,.55,1)',fill:'forwards'}).finished;
}

export default function ContactPill({lang='en', hidden=false, tone='light'}) {
  const en=lang==='en', [open,dispatch]=useReducer(contactState,false), [shown,setShown]=useState(false), trigger=useRef(null), dialog=useRef(null), id=useId();
  // the card stays mounted while it folds away
  useEffect(()=>{if(open)setShown(true);},[open]);
  useLayoutEffect(()=>{
    if(!shown)return;
    const panel=dialog.current;panel.showModal();panel.querySelector('button')?.focus();openCard(panel,trigger.current);
    // The page underneath doesn't scroll while the card is open. Wheel and touch are stopped instead of hiding the page's
    // overflow: that removed the scrollbar, shifting the page sideways and relaying it out in the middle of the motion.
    // (On window: a listener on the dialog covers only the card's box, and the compositor scrolls the backdrop area without asking.)
    const stop=e=>{const scrolls=panel.scrollHeight>panel.clientHeight+1;if(!(scrolls&&e.target!==panel&&panel.contains(e.target)))e.preventDefault();};
    addEventListener('wheel',stop,{passive:false});addEventListener('touchmove',stop,{passive:false});
    return ()=>{removeEventListener('wheel',stop);removeEventListener('touchmove',stop);panel.close();trigger.current?.focus({preventScroll:true});};
  },[shown]);
  useEffect(()=>{
    if(open||!shown)return;
    const panel=dialog.current;let alive=true;
    closeCard(panel,trigger.current).then(()=>{if(alive)setShown(false);},()=>{});
    // opened again while folding: unfold from there
    return ()=>{alive=false;if(panel.isConnected)openCard(panel,trigger.current);};
  },[open,shown]);
  useEffect(()=>{if(hidden)dispatch('close');},[hidden]);
  // "Contact" in the nav or Menu on pages outside the homepage journey opens this card instead of reloading the homepage
  useEffect(()=>{const show=()=>dispatch('open');addEventListener('jl:contact',show);return()=>removeEventListener('jl:contact',show);},[]);
  const keyboard=e=>{
    // keys that would scroll the page underneath (Space still presses a focused button)
    if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(e.key)||(e.key===' '&&!e.target.closest('button,a')))e.preventDefault();
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
