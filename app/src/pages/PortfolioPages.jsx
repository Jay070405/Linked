import {Component,Suspense,lazy,useEffect,useLayoutEffect,useRef} from 'react';
import WorkArchive from './WorkArchive';
import WorkDetail from './WorkDetail';
import './portfolio-pages.css';
const ArtDesk=lazy(()=>import('./ArtDesk'));
const RocoCase=lazy(()=>import('./RocoCase'));
const RocoModel=lazy(()=>import('./RocoModel'));
class PageBoundary extends Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className="portfolio-page-loading"><h1>{this.props.lang==='en'?'The page could not load.':'页面暂时未能加载。'}</h1><button onClick={()=>location.reload()}>{this.props.lang==='en'?'Try again':'重新加载'}</button></div>:this.props.children;}
}
export default function PortfolioPages({page,lang,reduced,onNavigate,onBack,pageScroll,archiveState}){
 const viewport=useRef(null),en=lang==='en',path=location.pathname;
 useEffect(()=>{
   document.body.classList.add('portfolio-route-open');
   window.dispatchEvent(new Event('journey:jump'));
   document.dispatchEvent(new Event('visibilitychange'));
   return()=>{document.body.classList.remove('portfolio-route-open');document.dispatchEvent(new Event('visibilitychange'));};
 },[]);
 useLayoutEffect(()=>{
   const el=viewport.current;
   el.scrollTop=pageScroll.current.get(path)||0;
   el.focus({preventScroll:true});
 },[path,pageScroll]);
 useEffect(()=>{
   const suffix=page.type==='desk'?'Visual Worlds':page.type==='archive'?(en?'Work archive':'作品档案'):page.type==='art'?(en?page.item.titleEn:page.item.title):page.type==='model'?(en?'Roco · Model lab':'洛克 · 模型实验室'):(en?'Roco Kingdom · Case study':'洛克王国：世界 · 系统策划');
   document.title='JAY LIN — '+suffix;
   return()=>{document.title='JAY LIN — Between rules & wonder · V16';};
 },[page,lang,en]);
 const props={lang,reduced,onNavigate};
 return <><main ref={viewport} className={'portfolio-page-viewport route-'+page.type} id="portfolio-page" tabIndex={-1} data-nav-tone={page.type==='desk'?'dark':'light'} aria-label={en?'Portfolio page':'作品集页面'} onScroll={event=>{pageScroll.current.set(path,event.currentTarget.scrollTop);}}>
   <PageBoundary key={path} lang={lang}><Suspense fallback={<div className="portfolio-page-loading" role="status"><span>JAY LIN / PORTFOLIO</span><p>{en?'Unfolding the work…':'正在展开作品…'}</p></div>}>
    {page.type==='desk'?<ArtDesk {...props}/>:page.type==='archive'?<WorkArchive {...props} archiveState={archiveState}/>:page.type==='art'?<WorkDetail {...props} item={page.item}/>:page.type==='model'?<RocoModel {...props}/>:<RocoCase {...props}/>}
   </Suspense></PageBoundary>
  </main><button className={'portfolio-return'+(page.type==='desk'?' is-dark':'')} onClick={onBack} aria-label={en?'Return to previous page':'返回上一页'}>← <span>{en?'Back':'返回'}</span></button></>;
}

