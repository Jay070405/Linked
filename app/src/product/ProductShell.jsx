import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react';
import SiteNavigation from '../components/SiteNavigation';
import ProductRoute from './ProductRoute';
import {isProductPath, productTitle, resolveProductPath} from './content';
import {initialLanguage, saveLanguage} from '../language';

// Where the rest of the site lives. Those pages need the full homepage app, so they are full page loads.
const SITE = {home: '/#home', systems: '/systems', art: '/works', vibecoding: '/other-project', contact: '/#contact', about: '/#about'};

/** The standalone entry for /product/* and /for/* (product.html). It loads no 3D, no physics and no loading screen,
    so a cold deep link shows the page as soon as this script runs. In-site moves use pushState. */
export default function ProductShell() {
  const [path, setPath] = useState(() => location.pathname);
  const [lang, setLang] = useState(initialLanguage);
  const [reduced, setReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const main = useRef(null), first = useRef(true), scroll = useRef(new Map());
  const page = resolveProductPath(path);

  useEffect(() => {
    document.body.classList.add('product-shell');
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    const sync = () => setPath(location.pathname);
    const media = matchMedia('(prefers-reduced-motion: reduce)'), motion = () => setReduced(media.matches);
    addEventListener('popstate', sync); media.addEventListener('change', motion);
    return () => { document.body.classList.remove('product-shell'); removeEventListener('popstate', sync); media.removeEventListener('change', motion); };
  }, []);
  useEffect(() => { document.body.classList.toggle('quiet', reduced); }, [reduced]);
  useEffect(() => { document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'; }, [lang]);
  const chooseLang = value => { setLang(value); saveLanguage(value); };
  useEffect(() => { document.title = `Jay Lin — ${productTitle(resolveProductPath(path))}`; }, [path]);

  // A new page starts at the top (or where you left it, going back) with focus on the page, not the old link.
  useLayoutEffect(() => {
    if (first.current) { first.current = false; return; }
    scrollTo(0, scroll.current.get(path) || 0);
    main.current?.focus({preventScroll: true});
  }, [path]);

  const navigate = useCallback(to => {
    if (typeof to !== 'string' || !to.startsWith('/') || to.startsWith('//')) return;
    if (!isProductPath(to)) { location.assign(to); return; }
    if (to === location.pathname) return;
    scroll.current.set(location.pathname, scrollY);
    scroll.current.delete(to);
    history.pushState(null, '', to);
    setPath(to);
  }, []);
  const onNavigate = id => id === 'product' ? navigate('/product') : location.assign(SITE[id] || '/');

  return <>
    <a className="skip-link" href="#product-main">{lang === 'en' ? 'Skip to content' : '跳到正文'}</a>
    <SiteNavigation lang={lang} reducedMotion={reduced} tone="light" onLanguage={chooseLang} onNavigate={onNavigate} onAbout={() => location.assign(SITE.about)}/>
    <main id="product-main" ref={main} tabIndex={-1} className="product-shell-main">
      <ProductRoute page={page} reduced={reduced} onNavigate={navigate}/>
    </main>
  </>;
}
