import { useId, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Grid2X2, Grid3X3 } from 'lucide-react';
import ExpressiveTitle from '../components/ExpressiveTitle';
import { PortfolioGlass, PortfolioTilt } from '../components/PortfolioSurface';
import { allWorks } from '../portfolioData';
import './work-pages.css';
import './archive-experience.css';

const categories = [['all', '全部作品', 'All works'], ['场景设计', '场景设计', 'Environments'], ['角色设计', '角色设计', 'Characters'], ['视觉开发', '视觉开发', 'Visual development'], ['插画', '插画', 'Illustration'], ['基础训练', '基础训练', 'Fundamentals'], ['三维创作', '三维创作', '3D']];
const pick = (w, key, en) => en ? w[key + 'En'] || w[key] : w[key];

export default function WorkArchive({ lang, onNavigate, archiveState, reduced }) {
  const en = lang === 'en', id = useId(), results = useRef(null);
  const [filter, setFilter] = useState(archiveState.current.filter || 'all');
  const [density, setDensity] = useState(archiveState.current.density || 'gallery');
  const visible = filter === 'all' ? allWorks : allWorks.filter(w => w.category === filter);
  const selectedCategory = categories.find(([key]) => key === filter);
  const select = key => {
    setFilter(key); archiveState.current.filter = key;
    if (results.current?.getBoundingClientRect().top < 100) results.current.scrollIntoView({ block: 'start', behavior: reduced ? 'instant' : 'smooth' });
  };
  const navigate = (event, href) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); onNavigate(href);
  };
  return <div className={`wa-page wa-experience${reduced ? ' wa-still' : ''}`} data-nav-tone="dark">
    <header className="wa-heading">
      <div className="wa-title-block"><a href="/works" onClick={event => navigate(event, '/works')} className="wa-back-desk">← {en ? 'The drawing desk' : '回到画台'}</a><div className="wa-title-line"><h1><ExpressiveTitle reduced={reduced}>{en ? 'Work' : '作品'}<br />{en ? 'archive.' : '档案。'}</ExpressiveTitle></h1><span className="wa-edition">2024<br />—2025</span></div><p className="wa-hero-note">{en ? 'Environments, characters, and the studies in between.' : '场景、角色，以及创作过程中的练习。'}</p></div>
      <div className="wa-fan" aria-label={en ? 'A few works from the collection' : '作品选览'}>{[allWorks[2], allWorks[1], allWorks[0]].map((work, i) => <a key={work.slug} className={`wa-print wa-print-${i}`} href={work.href} onClick={event => navigate(event, work.href)}><img src={work.image} alt={pick(work, 'title', en)} width="460" height="290" /><span>{pick(work, 'title', en)} <b>↗</b></span></a>)}<PortfolioGlass className="wa-collection-seal" radius={50}><span><b>{allWorks.length}</b> {en ? 'WORKS / 06 CATEGORIES' : '件作品 / 06 个分类'}</span></PortfolioGlass></div>
    </header>
    <div className="wa-layout">
      <aside className="wa-index"><p>{en ? 'INDEX / CATEGORY' : '索引 / 分类'}</p><PortfolioGlass className="wa-filter-glass" radius={25}><nav aria-label={en ? 'Filter artworks' : '筛选作品'}>{categories.map(([key, zh, english], i) => <button key={key} aria-pressed={filter === key} onClick={() => select(key)}>{filter === key && <motion.span className="wa-filter-active" layoutId={`${id}-filter`} transition={reduced ? { duration: 0 } : { type: 'spring', stiffness: 360, damping: 35 }} />}<span className="wa-filter-no">0{i}</span><span>{en ? english : zh}</span><sup>{key === 'all' ? allWorks.length : allWorks.filter(w => w.category === key).length}</sup></button>)}</nav></PortfolioGlass><p className="wa-index-note">{en ? 'Open a work to see the original image and its project notes.' : '打开作品，查看完整原图与创作说明。'}<span>↗</span></p></aside>
      <section ref={results} className="wa-results" aria-label={en ? 'Artwork collection' : '作品列表'}>
        <div className="wa-results-label"><div aria-live="polite"><strong>{selectedCategory[en ? 2 : 1]}</strong><span>{String(visible.length).padStart(2, '0')} / {allWorks.length}</span></div><div className="wa-density" role="group" aria-label={en ? 'Gallery layout' : '作品布局'}>{[['gallery', Grid2X2, en ? 'Gallery' : '大图'], ['overview', Grid3X3, en ? 'Overview' : '总览']].map(([key, Icon, label]) => <button key={key} aria-pressed={density === key} onClick={() => { setDensity(key); archiveState.current.density = key; }} title={label}><Icon size={14} strokeWidth={1.5} /><span>{label}</span></button>)}</div></div>
        <div className={`wa-grid wa-grid--${density}`} key={`${filter}-${density}`}>{visible.map((work, i) => <article className="wa-card" key={work.slug} style={{ '--entry': Math.min(i, 5) * 45 + 'ms' }}><PortfolioTilt reduced={reduced} className="wa-art-frame"><a className="wa-image" href={work.href} onClick={event => navigate(event, work.href)}><img src={work.image} alt={pick(work, 'title', en)} loading={i < 4 ? 'eager' : 'lazy'} decoding="async" /><span className="wa-open">{en ? 'VIEW WORK' : '查看作品'} <b>↗</b></span></a></PortfolioTilt><div className="wa-card-meta"><span>{String(allWorks.indexOf(work) + 1).padStart(2, '0')} / {pick(work, 'category', en)}</span><span>{work.year}</span></div><h2><a href={work.href} onClick={event => navigate(event, work.href)}>{pick(work, 'title', en)}<i aria-hidden="true">↗</i></a></h2></article>)}</div>
      </section>
    </div>
    <footer className="wa-footer"><span>JAY LIN / VISUAL WORLDS</span><p>{en ? 'Back to where the drawings begin.' : '回到画台，继续看。'}</p><a href="/works" onClick={event => navigate(event, '/works')}>{en ? 'The drawing desk' : '回到灯下画台'} ↗</a></footer>
  </div>;
}
