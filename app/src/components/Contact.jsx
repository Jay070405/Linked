import {useEffect, useId, useReducer, useRef, useState} from 'react';
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

export default function ContactPill({lang='en', hidden=false, tone='light'}) {
  const en=lang==='en', [open,dispatch]=useReducer(contactState,false), trigger=useRef(null), dialog=useRef(null), id=useId();
  useEffect(()=>{
    if(!open)return;
    const panel=dialog.current;panel.showModal();
    const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
    panel.querySelector('button')?.focus();
    return ()=>{panel.close();document.body.style.overflow=overflow;trigger.current?.focus({preventScroll:true});};
  },[open]);
  useEffect(()=>{if(hidden)dispatch('close');},[hidden]);
  const keyboard=e=>{
    if(e.key!=='Tab')return;
    const controls=[...dialog.current.querySelectorAll('a[href],button:not([disabled])')];
    e.preventDefault();controls[tabDestination(controls.indexOf(document.activeElement),controls.length,e.shiftKey)]?.focus();
  };
  return <>
    <button ref={trigger} className="contact-pill" type="button" hidden={hidden} aria-haspopup="dialog" aria-expanded={open} aria-controls={id} onClick={()=>dispatch('toggle')}>
      <i aria-hidden="true"/><span className="contact-status-long">{en?'Open to product roles · mid-2027':'在找产品岗位 · 2027 年年中'}</span><span className="contact-status-short">{en?'Contact':'联系'}</span>
    </button>
    {open&&createPortal(<dialog ref={dialog} id={id} className="contact-dialog" data-tone={tone} aria-labelledby={`${id}-name`} onKeyDown={keyboard}
      onCancel={e=>{e.preventDefault();dispatch('escape');}} onPointerDown={e=>{if(e.target!==e.currentTarget)return;const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dispatch('outside');}}>
      <button className="contact-close" type="button" onClick={()=>dispatch('close')} aria-label={en?'Close contact card':'关闭联系卡片'}>×</button>
      <header><span className="contact-logo"><OriginalLogo/></span><div><h2 id={`${id}-name`}>Jay Lin</h2><p>{en?'Product management · Game systems design':'产品经理 · 游戏系统策划'}</p></div></header>
      <p className="contact-availability">{en?'Open to full-time roles from mid-2027. English and Mandarin.':'2027 年年中起可全职入职。工作语言：英语、普通话。'}</p>
      <ContactRows lang={lang}/>
    </dialog>,document.body)}
  </>;
}
