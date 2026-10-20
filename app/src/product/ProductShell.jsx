import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import {flushSync} from 'react-dom';
import SiteNavigation from '../components/SiteNavigation';
import CircularTransition, {useCircularTransition} from '../components/CircularTransition';
import ProductRoute from './ProductRoute';
import {isProductPath, movedProductPath, productTitle, resolveProductPath} from './content';
import {initialLanguage, saveLanguage} from '../language';

// Where the rest of the site lives. Those pages need the full homepage app, so they are full page loads.
const SITE = {home: '/#home', systems: '/systems', art: '/works', vibecoding: '/other-project', contact: '/#contact', about: '/#about'};

/** The standalone entry for /product/* and /for/* (product.html). It loads no 3D, no physics and no loading screen,
    so a cold deep link shows the page as soon as this script runs. Moves between product pages use pushState and the
    site's circular transition; links to the rest of the site are full page loads. */
export default function ProductShell() {
  const [path, setPath] = useState(() => location.pathname);
  const [lang, setLang] = useState(initialLanguage);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const main = useRef(null), scroll = useRef(new Map());
  const page = resolveProductPath(path);
  // an old product address whose case moved to Systems: hand over to the full site, without a history entry
  useLayoutEffect(() => { if (page?.type === 'moved') location.replace(page.to + location.search + location.hash); }, [page?.type, page?.to]);

  useEffect(() => {
    document.body.classList.add('product-shell');
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const media = matchMedia('(prefers-reduced-motion: reduce)'), motion = () => setReduced(media.matches);
    media.addEventListener('change', motion);
    return () => { document.body.classList.remove('product-shell'); media.removeEventListener('change', motion); };
  }, []);
  useEffect(() => { document.body.classList.toggle('quiet', reduced); }, [reduced]);
  useEffect(() => { document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'; }, [lang]);
  const chooseLang = value => { setLang(value); saveLanguage(value); };
  useEffect(() => { document.title = `Jay Lin — ${productTitle(resolveProductPath(path), lang)}`; }, [path, lang]);

  const {run: transition, layer} = useCircularTransition(reduced);
  // Commit the page synchronously inside the transition, so the circle reveals the real destination: at the top
  // (or where you left it, going back) with focus on the page, not on the old link.
  const show = useCallback(next => {
    flushSync(() => setPath(next));
    scrollTo(0, scroll.current.get(next) || 0);
    main.current?.focus({preventScroll: true});
  }, []);
  useEffect(() => {
    const sync = () => transition(() => show(location.pathname));
    addEventListener('popstate', sync);
    return () => removeEventListener('popstate', sync);
  }, [transition, show]);

  const navigate = useCallback(to => {
    if (typeof to !== 'string' || !to.startsWith('/') || to.startsWith('//')) return;
    const moved = movedProductPath(to);
    if (moved) { location.assign(moved); return; }
    if (!isProductPath(to)) { location.assign(to); return; }
    if (to === location.pathname) return;
    transition(() => {
      scroll.current.set(location.pathname, scrollY);
      scroll.current.delete(to);
      history.pushState(null, '', to);
      show(to);
    });
  }, [transition, show]);
  const onNavigate = id => id === 'product' ? navigate('/product') : location.assign(SITE[id] || '/');

  return <>
    <a className="skip-link" href="#product-main">{lang === 'en' ? 'Skip to content' : '跳到正文'}</a>
    <SiteNavigation lang={lang} reducedMotion={reduced} tone="light" onLanguage={chooseLang} onNavigate={onNavigate} onAbout={() => location.assign(SITE.about)}/>
    <main id="product-main" ref={main} tabIndex={-1} className="product-shell-main">
      <ProductRoute page={page} reduced={reduced} onNavigate={navigate} lang={lang}/>
    </main>
    <CircularTransition layer={layer} lang={lang}/>
  </>;
}
