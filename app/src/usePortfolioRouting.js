import { useCallback, useEffect, useRef, useState } from 'react';
import { allWorks, systems } from './portfolioData';

const HISTORY_KEY = '__jayPortfolioModal';
const HOME = '/#home';
export function resolvePath(pathname) {
  const path = pathname.split(/[?#]/)[0].replace(/\/+$/, '') || '/';
  if (path === '/works') return { type: 'desk' };
  if (path === '/works/archive') return { type: 'archive' };
  if (path === '/vibecoding') return { type: 'vibecoding' };
  if (path === '/vibecoding/field01') return { type: 'field01' };
  if (path === '/systems/roco/model') return { type: 'model' };
  const work = allWorks.find(item => item.href === path);
  if (work) return { type: 'art', item: work };
  const system = systems.find(item => item.status === 'available' && '/systems/' + item.slug === path);
  return system ? { type: 'system', item: system } : null;
}
export function routeFor(page) {
  if (typeof page === 'string') return page.startsWith('/') && !page.startsWith('//') && resolvePath(page) ? page : null;
  if (page?.type === 'desk') return '/works';
  if (page?.type === 'archive') return '/works/archive';
  if (page?.type === 'vibecoding') return '/vibecoding';
  if (page?.type === 'field01') return '/vibecoding/field01';
  if (page?.type === 'model') return '/systems/roco/model';
  if (page?.type === 'art') return allWorks.find(w => w.id === page.item?.id || w.slug === page.item?.slug)?.href || null;
  if (page?.type === 'system') {
    const item = systems.find(s => s.status === 'available' && (s.id === page.item?.id || s.slug === page.item?.slug));
    return item ? '/systems/' + item.slug : null;
  }
  return null;
}
function readMeta() {
  const value = history.state?.[HISTORY_KEY];
  return value && Number.isSafeInteger(value.depth) && value.depth >= 1 && typeof value.originURL === 'string' && value.originURL.startsWith('/') && !value.originURL.startsWith('//') ? value : null;
}
function historyState(meta) {
  const next = history.state && typeof history.state === 'object' ? { ...history.state } : {};
  if (meta) next[HISTORY_KEY] = meta; else delete next[HISTORY_KEY];
  return next;
}
function parentPath(page) {
  if (page?.type === 'field01') return '/vibecoding';
  if (page?.type === 'art') return '/works/archive';
  if (page?.type === 'archive') return '/works';
  if (page?.type === 'model') return '/systems/roco';
  return null;
}

/** Full viewport page routes retain the untouched Home scene and native history. */
export function usePortfolioRouting() {
  const [modal, setModal] = useState(() => resolvePath(location.pathname));
  const pageRef = useRef(modal);
  const depth = useRef(modal ? readMeta()?.depth || 0 : 0);
  const origin = useRef(readMeta()?.originURL || HOME);
  const trigger = useRef(null);
  const pendingHome = useRef(null);
  const closing = useRef(false);
  const pageScroll = useRef(new Map());
  const archiveState = useRef({ filter: 'all' });
  const frame = useRef(0);
  const currentPath = useRef(location.pathname);
  const captureScroll = useCallback(() => {
    const viewport = document.querySelector('.portfolio-page-viewport');
    if (viewport) pageScroll.current.set(currentPath.current, viewport.scrollTop);
  }, []);
  const commit = useCallback(next => {
    pageRef.current = next; currentPath.current = location.pathname; setModal(next);
  }, []);
  const restoreHome = useCallback(() => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      frame.current = requestAnimationFrame(() => {
        const id = pendingHome.current; pendingHome.current = null;
        if (id) {
          document.getElementById(id)?.scrollIntoView({behavior:'instant'});
          history.replaceState(historyState(null), '', '/#' + id);
          window.dispatchEvent(new Event('journey:jump'));
          const section = document.getElementById(id);
          section?.setAttribute('tabindex','-1'); section?.focus({preventScroll:true});
        } else if (trigger.current?.isConnected) trigger.current.focus({preventScroll:true});
      });
    });
  }, []);
  useEffect(() => {
    const sync = () => {
      captureScroll();
      let next = resolvePath(location.pathname);
      const meta = next ? readMeta() : null;
      if (closing.current) {
        history.replaceState(historyState(null), '', origin.current || HOME);
        next = null;
      }
      depth.current = next ? meta?.depth || 0 : 0;
      if (meta) origin.current = meta.originURL;
      closing.current = false; commit(next);
      if (!next) restoreHome();
    };
    window.addEventListener('popstate', sync);
    return () => { window.removeEventListener('popstate',sync); cancelAnimationFrame(frame.current); };
  }, [captureScroll,commit,restoreHome]);
  const open = useCallback((next, options = {}) => {
    const path = routeFor(next);
    if (!path || closing.current) return;
    if (location.pathname + location.search + location.hash === path) return;
    captureScroll(); cancelAnimationFrame(frame.current);
    if (resolvePath(path)?.type === 'archive' && pageRef.current?.type !== 'art') {
      archiveState.current.filter = 'all';
      pageScroll.current.delete('/works/archive');
    }
    if (!pageRef.current) {
      trigger.current = document.activeElement;
      origin.current = location.pathname + location.search + location.hash;
      depth.current = 0;
      window.dispatchEvent(new Event('journey:jump'));
    }
    const nextDepth = options.replace ? depth.current : depth.current + 1;
    const meta = nextDepth ? { depth: nextDepth, originURL: origin.current } : null;
    history[options.replace ? 'replaceState' : 'pushState'](historyState(meta),'',path);
    depth.current = nextDepth;
    commit(resolvePath(path));
  }, [captureScroll,commit]);
  const close = useCallback((homeSection) => {
    if (!pageRef.current || closing.current) return;
    captureScroll(); pendingHome.current = typeof homeSection === 'string' ? homeSection : null;
    if (depth.current > 0) { closing.current = true; history.go(-depth.current); }
    else { history.replaceState(historyState(null),'',HOME); depth.current = 0; commit(null); restoreHome(); }
  }, [captureScroll,commit,restoreHome]);
  const back = useCallback(() => {
    if (depth.current > 0) { captureScroll(); history.back(); return; }
    const parent = parentPath(pageRef.current);
    if (parent) open(parent,{replace:true}); else close();
  }, [captureScroll,open,close]);
  return { modal, open, close, back, pageScroll, archiveState };
}
