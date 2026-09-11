import {useEffect,useRef,useState} from 'react';
import {allWorks} from '../portfolioData';
import ExpressiveTitle from '../components/ExpressiveTitle';
import './work-pages.css';
export default function WorkDetail({item,lang,onNavigate,reduced}){
 const en=lang==='en',index=allWorks.findIndex(w=>w.slug===item.slug),next=allWorks[(index+1)%allWorks.length],previous=allWorks[(index+allWorks.length-1)%allWorks.length];
 const [zoom,setZoom]=useState(false),dialog=useRef(null);
 useEffect(()=>{setZoom(false);},[item.slug]);
 useEffect(()=>{if(zoom)dialog.current?.showModal();else dialog.current?.close();},[zoom]);
 const title=en?item.titleEn:item.title;
 return <article className={'wd-page'+(reduced?' wa-still':'')} data-nav-tone="light"><header className="wd-heading"><a href="/works/archive" onClick={e=>{e.preventDefault();onNavigate('/works/archive');}}>← {en?'All works':'全部作品'}</a><div className="wd-title-line"><h1><ExpressiveTitle reduced={reduced}>{title}</ExpressiveTitle></h1><span>{String(index+1).padStart(2,'0')} / 25</span></div><div className="wd-meta"><span>{en?item.categoryEn:item.category}</span><span>{item.year}</span><p>{en?item.descriptionEn:item.description}</p></div></header>
 <figure className="wd-original"><button onClick={()=>setZoom(true)} aria-label={(en?'Enlarge original: ':'放大原图：')+title}><img src={item.image} alt={title}/><span>{en?'EXPLORE THE ORIGINAL':'放大查看原图'} ⤢</span></button><figcaption><span>JAY LIN / {en?'ORIGINAL ARTWORK':'原作'}</span><a href={item.image} target="_blank" rel="noreferrer">{en?'Open original image':'单独打开原图'} ↗</a></figcaption></figure>
 <nav className="wd-adjacent" aria-label={en?'More artworks':'更多作品'}><a href={previous.href} onClick={e=>{e.preventDefault();onNavigate(previous.href,{replace:true});}}><span>← {en?'PREVIOUS':'上一件'}</span><b>{en?previous.titleEn:previous.title}</b></a><a href={next.href} onClick={e=>{e.preventDefault();onNavigate(next.href,{replace:true});}}><span>{en?'NEXT':'下一件'} →</span><b>{en?next.titleEn:next.title}</b><img src={next.image} alt="" loading="lazy"/></a></nav>
 <dialog ref={dialog} className="wd-image-viewer" aria-label={(en?'Original image: ':'原图：')+title} onCancel={e=>{e.preventDefault();setZoom(false);}}><button autoFocus className="wd-zoom-close" onClick={()=>setZoom(false)}>{en?'Close':'关闭'} ×</button><img src={item.image} alt={title}/><p>{en?'Scroll to explore the image · Escape to close':'滚动查看原图 · Escape 关闭'}</p></dialog></article>;
}

