import {useState} from 'react';
import ExpressiveTitle from '../components/ExpressiveTitle';
import {allWorks} from '../portfolioData';
import './work-pages.css';
const categories=[['all','全部作品','All works'],['场景设计','场景设计','Environment design'],['角色设计','角色设计','Character design'],['视觉开发','视觉开发','Visual development'],['插画','插画','Illustration'],['基础训练','基础训练','Fundamentals'],['三维创作','三维创作','3D']];
const pick=(w,key,en)=>en?w[key+'En']||w[key]:w[key];
export default function WorkArchive({lang,onNavigate,archiveState,reduced}){
 const en=lang==='en';
 const [filter,setFilter]=useState(archiveState.current.filter||'all');
 const visible=filter==='all'?allWorks:allWorks.filter(w=>w.category===filter);
 const select=key=>{setFilter(key);archiveState.current.filter=key;const results=document.querySelector('.wa-results');if(results?.getBoundingClientRect().top<100)results.scrollIntoView({block:'start',behavior:reduced?'instant':'smooth'});};
 return <div className={'wa-page'+(reduced?' wa-still':'')} data-nav-tone="light">
  <header className="wa-heading"><div><a href="/works" onClick={e=>{e.preventDefault();onNavigate('/works');}} className="wa-back-desk">← {en?'The drawing desk':'回到画台'}</a><h1><ExpressiveTitle reduced={reduced}>{en?'Works':'作品档案'}</ExpressiveTitle><sup>25</sup></h1></div><div className="wa-intro"><span>THE COMPLETE COLLECTION / 2024—2025</span><p>{en?<>Worlds, characters, and studies.<br/>A collection of things I have made.</>:<>画过的世界，想过的角色，<br/>以及创作途中的一些探索。</>}</p></div></header>
  <div className="wa-layout"><aside className="wa-index"><p>{en?'INDEX / CATEGORY':'索引 / 分类'}</p><nav aria-label={en?'Filter artworks':'筛选作品'}>{categories.map(([key,zh,english],i)=><button key={key} aria-pressed={filter===key} onClick={()=>select(key)}><span className="wa-filter-no">0{i}</span><span>{en?english:zh}</span><sup>{key==='all'?allWorks.length:allWorks.filter(w=>w.category===key).length}</sup></button>)}</nav><p className="wa-index-note">{en?'Every image opens to its full original.':'点击作品，查看完整原图。'}<span>↗</span></p></aside>
  <section className="wa-results" aria-label={en?'Artwork collection':'作品列表'}><div className="wa-results-label" aria-live="polite"><span>{en?'ON VIEW':'当前展出'}</span><span>{String(visible.length).padStart(2,'0')} / 25</span></div><div className="wa-grid" key={filter}>{visible.map((w,i)=><article className="wa-card" key={w.slug} style={{'--entry':Math.min(i,5)*50+'ms'}}><a className="wa-image" href={w.href} onClick={e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();onNavigate(w.href);}}><img src={w.image} alt={pick(w,'title',en)} loading={i<4?'eager':'lazy'} decoding="async"/><span className="wa-open">{en?'VIEW WORK':'查看作品'} <b>↗</b></span></a><div className="wa-card-meta"><span>{String(allWorks.indexOf(w)+1).padStart(2,'0')} / {pick(w,'category',en)}</span><span>{w.year}</span></div><h2><a href={w.href} onClick={e=>{if(e.ctrlKey||e.metaKey)return;e.preventDefault();onNavigate(w.href);}}>{pick(w,'title',en)}<i>↗</i></a></h2></article>)}</div></section></div>
  <footer className="wa-footer"><span>JAY LIN / VISUAL WORLDS</span><p>{en?'There is always another world to imagine.':'总还有一个世界，值得想象。'}</p><a href="/works" onClick={e=>{e.preventDefault();onNavigate('/works');}}>{en?'Back to the drawing desk':'回到灯下画台'} ↗</a></footer>
 </div>;
}

