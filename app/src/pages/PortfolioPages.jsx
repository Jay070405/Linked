import {Component,Suspense,lazy,useEffect,useLayoutEffect,useRef,useState,useCallback} from 'react';
import SharedProjectTransition from './SharedProjectTransition';
import {preloadField01} from './preloadField01';
import WorkArchive from './WorkArchive';
import WorkDetail from './WorkDetail';
import './portfolio-pages.css';
const ArtDesk=lazy(()=>import('./ArtDesk'));
const RocoCase=lazy(()=>import('./RocoCase'));
const RocoModel=lazy(()=>import('./RocoModel'));
const VibeCoding=lazy(()=>import('./VibeCoding'));
const loadField01=()=>import('./Field01');
const Field01=lazy(loadField01);
class PageBoundary extends Component {
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div className="portfolio-page-loading"><h1>{this.props.lang==='en'?'The page could not load.':'页面暂时未能加载。'}</h1><button onClick={()=>location.reload()}>{this.props.lang==='en'?'Try again':'重新加载'}</button></div>:this.props.children;}
}
export default function PortfolioPages({page,lang,reduced,onNavigate,onBack,pageScroll,archiveState}){
 const viewport=useRef(null),cameraHost=useRef(null),en=lang==='en',path=location.pathname;
 const [capture,setCapture]=useState(null),[cameraReady,setCameraReady]=useState(false);
 const prepareProject=useCallback(()=>{loadField01();preloadField01();},[]);
 const beginProject=useCallback(value=>{loadField01();setCameraReady(false);setCapture(value);},[]);
 const finishProject=useCallback(()=>{onNavigate('/vibecoding/field01');setCapture(null);},[onNavigate]);
 const cancelProject=useCallback(()=>{setCapture(null);viewport.current?.focus({preventScroll:true});},[]);
 useLayoutEffect(()=>{if(!capture&&page.type==='vibecoding')viewport.current?.focus({preventScroll:true});},[capture,page.type]);
 const markCameraReady=useCallback(()=>setCameraReady(true),[]);
 const previousPage=useRef(page.type);
 useEffect(()=>{
   if(previousPage.current!==page.type)setCapture(null);
   previousPage.current=page.type;
 },[page.type]);
 useEffect(()=>{
   document.body.classList.add('portfolio-route-open');
   window.dispatchEvent(new Event('journey:jump'));
   document.dispatchEvent(new Event('visibilitychange'));
   return()=>{document.body.classList.remove('portfolio-route-open');document.dispatchEvent(new Event('visibilitychange'));};
 },[]);
 useLayoutEffect(()=>{
   const el=viewport.current;
   el.scrollTop=pageScroll.current.get(path)||0;
   (page.type==='field01'?cameraHost.current:el)?.focus({preventScroll:true});
 },[path,pageScroll]);
 useEffect(()=>{
   const suffix=page.type==='vibecoding'?'Vibe coding':page.type==='field01'?'FIELD / 01':page.type==='desk'?'Visual Worlds':page.type==='archive'?(en?'Work archive':'作品档案'):page.type==='art'?(en?page.item.titleEn:page.item.title):page.type==='model'?(en?'Roco · Model lab':'洛克 · 模型实验室'):(en?'Roco Kingdom · Case study':'洛克王国：世界 · 系统策划');
   document.title='JAY LIN — '+suffix;
   return()=>{document.title='JAY LIN — Between rules & wonder · V16';};
 },[page,lang,en]);
 const props={lang,reduced,onNavigate,onBack,onOpenProject:beginProject,onProjectIntent:prepareProject,isOpening:!!capture};
 const cameraActive=page.type==='field01';
 return <><main ref={viewport} className={'portfolio-page-viewport route-'+page.type} id="portfolio-page" tabIndex={-1} inert={capture||cameraActive?true:undefined} aria-hidden={capture||cameraActive?true:undefined} data-nav-tone={page.type==='desk'?'dark':'light'} aria-label={en?'Portfolio page':'作品集页面'} onScroll={event=>{pageScroll.current.set(path,event.currentTarget.scrollTop);}}>
   <PageBoundary key={path} lang={lang}><Suspense fallback={<div className="portfolio-page-loading" role="status"><span>JAY LIN / PORTFOLIO</span><p>{en?'Unfolding the work…':'正在展开作品…'}</p></div>}>
    {page.type==='vibecoding'?<VibeCoding {...props}/>:cameraActive?null:page.type==='desk'?<ArtDesk {...props}/>:page.type==='archive'?<WorkArchive {...props} archiveState={archiveState}/>:page.type==='art'?<WorkDetail {...props} item={page.item}/>:page.type==='model'?<RocoModel {...props}/>:<RocoCase {...props}/>}
   </Suspense></PageBoundary>
  </main>{(capture||cameraActive)&&<div key="field01-host" ref={cameraHost} className={'vc-project-host'+(cameraActive?' is-active':' is-preparing')} tabIndex={-1} inert={!cameraActive?true:undefined} aria-hidden={!cameraActive?true:undefined} role={cameraActive?'main':undefined} aria-label="FIELD / 01">
   <div className="vc-project-content"><PageBoundary lang={lang}><Suspense fallback={null}><Field01 lang={lang} onBack={onBack} onReady={markCameraReady}/></Suspense></PageBoundary></div>
  </div>}{capture&&<SharedProjectTransition capture={capture} hostRef={cameraHost} galleryRef={viewport} onFinish={finishProject} onCancel={cancelProject} ready={cameraReady} lang={lang}/>}{!cameraActive&&!capture&&<button className={'portfolio-return'+(page.type==='desk'?' is-dark':'')} onClick={onBack} aria-label={en?'Return to previous page':'返回上一页'}>← <span>{en?'Back':'返回'}</span></button>}</>;
}
