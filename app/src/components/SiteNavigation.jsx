import { useEffect, useMemo, useState } from 'react';
import StaggeredMenu from './StaggeredMenu';
import OriginalLogo from './OriginalLogo';
import MusicToggle from './MusicToggle';
import ExpressiveTitle from './ExpressiveTitle';
import { author } from '../portfolioData';
import './SiteNavigation.css';

const logo = '/assets/logo.png';

function useNavigationTone(tone) {
  const [detected, setDetected] = useState('dark');
  useEffect(() => {
    if (tone !== 'auto') return;
    let frame = 0;
    const sample = () => {
      frame = 0;
      const declared = document.body.dataset.navTone;
      if (declared === 'light' || declared === 'dark') { setDetected(declared); return; }
      const scene = document.elementsFromPoint(innerWidth * .5, Math.min(96, innerHeight * .15)).find(el => !el.closest('.v16-navigation,.studio-loading'));
      const tagged = scene?.closest('[data-nav-tone]')?.dataset.navTone;
      if (tagged === 'light' || tagged === 'dark') { setDetected(tagged); return; }
      let node = scene;
      while (node && node !== document.documentElement) {
        const rgb = getComputedStyle(node).backgroundColor.match(/[\d.]+/g)?.map(Number);
        if (rgb?.length >= 3 && (rgb[3] ?? 1) > .8) { setDetected(rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722 > 170 ? 'light' : 'dark'); return; }
        node = node.parentElement;
      }
      setDetected('dark');
    };
    const queue = () => { if (!frame) frame = requestAnimationFrame(sample); };
    const observer = new MutationObserver(queue);
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['data-nav-tone'] });
    const coverObserver = new MutationObserver(queue);
    coverObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('scroll', queue, { passive: true }); window.addEventListener('resize', queue); sample();
    return () => { observer.disconnect(); coverObserver.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', queue); window.removeEventListener('resize', queue); };
  }, [tone]);
  return tone === 'auto' ? detected : tone;
}

export default function SiteNavigation({ lang = 'zh', onLanguage, onNavigate, onAbout, tone = 'auto', reducedMotion = false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuReset, setMenuReset] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.body.classList.contains('quiet'));
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReduced(media.matches || document.body.classList.contains('quiet'));
    const observer = new MutationObserver(update);
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    media.addEventListener('change', update); update();
    return () => { observer.disconnect(); media.removeEventListener('change', update); };
  }, []);
  useEffect(() => {
    if (!menuOpen) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [menuOpen]);
  const en = lang === 'en';
  const surfaceTone = useNavigationTone(tone);
  const labels = useMemo(() => en ? {
    home: 'Home', systems: 'Systems', art: 'Art', about: 'About', vibecoding: 'Vibe coding', contact: 'Contact',
  } : { home: '首页', systems: '系统策划', art: '美术作品', about: '关于我', vibecoding: 'Vibe coding', contact: '联系' }, [en]);
  const hrefFor = id => id === 'art' ? '/works' : id === 'vibecoding' ? '/vibecoding' : '/#' + id;
  const primary = useMemo(() => ['systems', 'art', 'about', 'contact'].map(id => ({ id, label: labels[id], href: hrefFor(id) })), [labels]);
  const fullMenu = useMemo(() => ['home', 'systems', 'art', 'vibecoding', 'about', 'contact'].map(id => ({ id, label: labels[id], link: hrefFor(id), ariaLabel: labels[id] })), [labels]);
  const navigate = id => id === 'about' ? onAbout?.() : onNavigate?.(id);
  const containMenuFocus = event => {
    if (!menuOpen || event.key !== 'Tab') return;
    const controls = [...event.currentTarget.querySelectorAll('.v16-language button,.music-toggle,.sm-toggle,.staggered-menu-panel a[href]')]
      .filter(element => !element.disabled && element.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return <div className={`v16-navigation${menuOpen ? ' is-menu-open' : ''}`} data-tone={surfaceTone} onKeyDown={containMenuFocus}>
    <a className="v16-wordmark" href="/#home" onClick={event => { event.preventDefault(); navigate('home'); }} aria-label={en ? 'Jay Lin — Home' : '林世杰 · 首页'}>
      <OriginalLogo/><span><ExpressiveTitle variant="type" typingSpeed={55} reduced={reducedMotion} hover={false}>JAY LIN</ExpressiveTitle></span>
    </a>
    <nav className="v16-primary-nav" inert={menuOpen ? true : undefined} aria-hidden={menuOpen || undefined} aria-label={en ? 'Primary navigation' : '主导航'}>{primary.map(item => <a key={item.id} aria-label={item.label} href={item.href} onClick={event => { event.preventDefault(); navigate(item.id); }}><span><ExpressiveTitle variant="type" typingSpeed={42} reduced={reducedMotion} hover={false}>{item.label}</ExpressiveTitle></span></a>)}</nav>
    <div className="v16-language" role="group" aria-label={en ? 'Language' : '语言'} data-language={lang}>
      <span className="v16-language-thumb" aria-hidden="true"/>
      {[['en','EN'],['zh','中文']].map(([value,label])=><button type="button" key={value} lang={value==='zh'?'zh-CN':'en'} aria-label={value==='en'?'Switch to English':'切换到中文'} aria-pressed={lang===value} onClick={()=>{if(lang===value)return;setMenuOpen(false);setMenuReset(current=>current+1);onLanguage?.(value);}}><ExpressiveTitle variant="type" typingSpeed={42} reduced={reducedMotion} hover={false}>{label}</ExpressiveTitle></button>)}
    </div>
    <MusicToggle lang={lang} reduced={reducedMotion || prefersReduced} />
    <StaggeredMenu key={`${lang}-${menuReset}`} className="v16-staggered" isFixed logoUrl={logo} items={fullMenu} reducedMotion={reducedMotion || prefersReduced}
      colors={['#d9d9d9', '#737373']} menuButtonColor={surfaceTone === 'light' ? '#111111' : '#ffffff'} openMenuButtonColor="#ffffff" accentColor="#b6b6b6"
      openLabel={en ? 'Menu' : '目录'} closeLabel={en ? 'Close' : '关闭'} socialLabel={en ? 'A conversation starts here' : '下一幕，从一次交谈开始'}
      onMenuOpen={() => setMenuOpen(true)} onMenuClose={() => setMenuOpen(false)}
      onItemClick={(item, event) => { event.preventDefault(); event.currentTarget.closest('.staggered-menu-wrapper')?.querySelector('.sm-toggle')?.focus({ preventScroll: true }); navigate(item.id); }}
      socialItems={[{ label: en ? 'Email ↗' : '邮箱 ↗', link: `mailto:${author.email}` }, { label: en ? 'Résumé ↗' : '简历 ↗', link: author.resume }]} />
  </div>;
}
