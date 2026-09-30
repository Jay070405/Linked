import {PROJECTS, ART, ABOUT, TIMELINE, COPY, author, pick} from './content';

/** The same homepage as a still page: for reduced motion, narrow screens and browsers without WebGL. Same words, same order,
    in black, white and grey; every project and work opens exactly as it does from the moving page. */
export default function OneStrokeStatic({lang = 'zh', onOpen, onArchive, onAbout, onNavigate}) {
  const en = lang === 'en', L = v => pick(v, lang), O = COPY.outro;
  const go = where => {
    if (where === 'about') onAbout?.();
    else if (where === 'works') onNavigate?.('art');
    else if (where === 'systems') document.getElementById('systems')?.scrollIntoView({behavior: 'smooth'});
    else if (where === 'contact') document.getElementById('contact')?.scrollIntoView({behavior: 'smooth'});
    else if (where?.startsWith('art:')) { const a = ART.find(x => x.slug === where.slice(4)); if (a?.item) onOpen?.({type: 'art', item: a.item}); }
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
      <button type="button" className="oss-link" onClick={() => onAbout?.()}>{L(ABOUT.more)}</button>

      <p className="os-mono oss-tl-head">{L(COPY.timelineHead)}</p>
      <ol className="oss-timeline">{TIMELINE.map(n => <li key={n.x}>
        <button type="button" onClick={() => go(n.go)}><span className="os-mono">{n.tag}</span><b>{L(n.title)}</b><small>{L(n.sub)}</small></button>
      </li>)}</ol>
    </section>

    <section id="worlds" className="oss-dark" data-nav-tone="dark" aria-labelledby="oss-worlds">
      <p className="os-mono">{L(COPY.worlds)}</p>
      <h2 id="oss-worlds">WORLDS <em>worth entering.</em></h2>
      <ul className="oss-art">{ART.map(a => <li key={a.slug}>{a.item
        ? <button type="button" onClick={() => onOpen?.({type: 'art', item: a.item})}><img src={a.tex} alt="" loading="lazy"/><span>{L(a.title)}<small className="os-mono">{a.en} · {a.year}</small></span></button>
        : <figure><img src={a.tex2 || a.tex} alt="" loading="lazy"/><figcaption>{L(a.title)}<small className="os-mono">{a.en} · {a.year}</small></figcaption></figure>}</li>)}</ul>
      <button type="button" className="oss-link" onClick={() => onArchive?.()}>{L(COPY.browse)}</button>
    </section>

    <section id="contact" className="oss-paper oss-contact" data-nav-tone="light" aria-labelledby="oss-contact">
      <img className="oss-contact-img" src="/assets/home/lake-dawn.jpg" alt="" loading="lazy"/>
      <div className="oss-contact-copy">
        <p className="os-mono">{O.top[0]} — {O.top[1]}</p>
        <h2 id="oss-contact">{L(O.lead)[0]}{L(O.lead)[1]}<em>{O.letter}</em></h2>
        <p><a className="oss-link" href={`mailto:${author.email}`}>{author.email} ↗</a></p>
        <p><a className="oss-link" href={author.phoneHref}>{author.phone} ↗</a></p>
        <p className="oss-foot os-mono"><a href="/works" onClick={e => { e.preventDefault(); onNavigate?.('art'); }}>{L(O.foot.art)}</a><a href="/#about" onClick={e => { e.preventDefault(); onAbout?.(); }}>{L(O.foot.about)}</a><a href={author.resume} target="_blank" rel="noreferrer">{L(O.foot.resume)}</a><span>© 2026 JAY LIN</span></p>
      </div>
    </section>
  </div>;
}
