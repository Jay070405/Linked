import {allWorks} from '../portfolioData';
import {useEffect, useRef, useState} from 'react';
import {PRODUCT_STATIONS, productCopy} from './product-layout.js';
import {ProductMark} from './ProductChapter';
import {PROJECTS, ABOUT, TIMELINE, COPY, author, pick} from './content';
import {ContactRows} from '../components/Contact';
import {resumeFor} from '../components/contact-model';

/** The same homepage as a still page: for reduced motion, narrow screens and browsers without WebGL. Same words, same order,
    in black, white and grey; every project and work opens exactly as it does from the moving page. */
export default function OneStrokeStatic({lang = 'zh', onOpen, onArchive, onAbout, onNavigate}) {
  const en = lang === 'en', L = v => pick(v, lang), O = COPY.outro;
  const timelineRef = useRef(null), [productsReady, setProductsReady] = useState(false);
  useEffect(() => {
    const check = () => {
      if (timelineRef.current?.getBoundingClientRect().top < innerHeight) {
        setProductsReady(true);removeEventListener('scroll',check);
      }
    };
    addEventListener('scroll',check,{passive:true});check();
    return () => removeEventListener('scroll',check);
  }, []);
  const go = where => {
    if (where === 'about') onAbout?.();
    else if (where === 'works') onNavigate?.('art');
    else if (where === 'systems') onNavigate?.('systems');
    else if (where === 'contact') document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'});
    else if (where?.startsWith('art:')) { const item = allWorks.find(x => x.slug === where.slice(4)); if (item) onOpen?.({type: 'art', item}); }
  };
  return <div className="os-static">
    <header className="oss-hero" data-nav-tone="dark">
      <img className="oss-hero-img" src="/assets/home/lake-dusk.jpg" alt="" loading="eager"/>
      <p className="os-mono oss-hero-tag">(JL) — PORTFOLIO 2026</p>
      <h2 className="oss-hero-title"><span>BETWEEN</span> <span>RULES</span></h2>
      <p className="oss-hero-sub">{L(COPY.headSub)}</p>
      <p className="oss-hero-answer" aria-hidden="true">&amp; wonder.</p>
    </header>

    <section id="systems" className="oss-dark" data-nav-tone="dark" aria-labelledby="oss-systems">
      <p className="os-mono">01 / SYSTEMS</p>
      <h2 id="oss-systems">SYSTEMS</h2>
      <ol className="oss-projects">{PROJECTS.map((p, i) => <li key={p.id}>
        <div className="oss-shot">{p.tex ? <img src={p.tex} alt="" loading="lazy"/> : <span className="os-mono">{L(p.cta)}</span>}</div>
        <div className="oss-proj-copy">
          <span className="os-mono">0{i + 1} / 0{PROJECTS.length} · {p.cat}</span>
          <h3 className={p.serif ? 'is-serif' : ''}>{L(p.title)}</h3>
          <p className="oss-sub">{L(p.sub)}</p>
          <p>{L(p.desc)}</p>
          {p.ready ? <button type="button" className="oss-link" onClick={() => onOpen?.({type: 'system', item: p.item})}>{L(p.cta)} ↗</button> : <span className="oss-link is-soon">{L(p.cta)}</span>}
        </div>
      </li>)}</ol>
    </section>

    <section className="oss-paper" data-nav-tone="light" aria-labelledby="oss-about">
      <p className="os-mono">{L(ABOUT.label)}</p>
      <h2 id="oss-about" className="oss-label">{L(ABOUT.lines).map(t => <span key={t}>{t}</span>)}</h2>
      <p className="oss-aside">{L(ABOUT.aside).join(' ')}</p>
      <p className="oss-name">{ABOUT.name}<small>{L(ABOUT.role)}</small></p>
      <ul className="oss-edu">{ABOUT.education.map(e => <li key={e.school}><b>{e.school}</b><span>{L(e.what)}</span></li>)}</ul>
      <a className="oss-link" href="/about">{L(ABOUT.more)}</a>

      <p ref={timelineRef} className="os-mono oss-tl-head">{L(COPY.timelineHead)}</p>
      <ol className="oss-timeline">{TIMELINE.map(n => <li key={n.x}>
        <button type="button" onClick={() => go(n.go)}><span className="os-mono">{n.tag}</span><b>{L(n.title)}</b><small>{L(n.sub)}</small></button>
      </li>)}</ol>
    </section>

    <section id="product" className="oss-dark oss-products" data-nav-tone="dark" aria-labelledby="oss-product">
      <span id="worlds" className="oss-worlds-alias" aria-hidden="true"/>
      <p className="os-mono">04 / PRODUCT</p><h2 id="oss-product">PRODUCT</h2>
      <ol className="oss-projects">{PRODUCT_STATIONS.map((s,i)=>{const p=productCopy(s,lang);return <li key={s.slug}>
        <a className={"oss-product-image oss-product-"+s.slug} href={"/product/"+s.slug}><img src={productsReady?s.thumb:undefined} alt={p.title} loading="lazy"/></a>
        <div className="oss-proj-copy"><span className="os-mono">0{i+1} / 05 · {p.kind}</span><h3>{p.title}</h3><p>{p.summary}</p><a className="oss-link" href={"/product/"+s.slug}>{en?'Open the case ↗':'查看案例 ↗'}</a></div>
      </li>;})}</ol>
      <ProductMark lang={lang}/>
    </section>

    <section id="contact" className="oss-paper oss-contact" data-nav-tone="light" aria-labelledby="oss-contact">
      <img className="oss-contact-img" src="/assets/home/lake-dawn.jpg" alt="" loading="lazy"/>
      <div className="oss-contact-copy">
        <p className="os-mono">{O.top[0]} — {O.top[1]}</p>
        <h2 id="oss-contact">{L(O.lead)[0]}{L(O.lead)[1]}<em>{O.letter}</em></h2>
        <ContactRows lang={lang}/>
        <p className="oss-foot os-mono"><a href="/works" onClick={e => { e.preventDefault(); onNavigate?.('art'); }}>{L(O.foot.art)}</a><a href="/about">{L(O.foot.about)}</a><a href={resumeFor(author,lang)} target="_blank" rel="noreferrer">{L(O.foot.resume)}</a><span>© 2026 JAY LIN</span></p>
      </div>
    </section>
  </div>;
}
