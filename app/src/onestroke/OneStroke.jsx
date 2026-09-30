import {useEffect, useRef, useState} from 'react';
import {createOneStroke, webglAvailable, CHAPTERS, SCREEN_SIDES, TOTAL, MIN_ASPECT} from './engine';
import {PROJECTS, ART, ABOUT, TIMELINE, COPY, author, pick} from './content';
import OneStrokeStatic from './OneStrokeStatic';
import './onestroke.css';

const wantStatic = reduced => reduced || !webglAvailable() || innerWidth / innerHeight < MIN_ASPECT;
const recording = () => new URLSearchParams(location.search).has('h');   // recordings never show the phone number

/** The homepage after the office: one line through a lake, a drafting sheet, a ring and the art worlds, back to the lake. */
export default function OneStroke({lang = 'zh', reduced = false, onOpen, onArchive, onAbout, onNavigate}) {
  const [staticMode, setStaticMode] = useState(() => wantStatic(reduced));
  const sectionRef = useRef(null), layerRef = useRef(null), engine = useRef(null);
  const props = useRef({}); props.current = {onOpen, onArchive, onAbout, onNavigate};
  const en = lang === 'en', L = v => pick(v, lang);

  useEffect(() => {
    const check = () => setStaticMode(wantStatic(reduced));
    check(); addEventListener('resize', check);
    return () => removeEventListener('resize', check);
  }, [reduced]);

  useEffect(() => {
    if (staticMode) return undefined;
    const go = where => {
      const p = props.current;
      if (where === 'about') p.onAbout?.();
      else if (where === 'works') p.onNavigate?.('art');
      else if (where === 'systems') engine.current?.goChapter(1);
      else if (where === 'contact') engine.current?.goChapter(5);
      else if (where?.startsWith('art:')) { const a = ART.find(x => x.slug === where.slice(4)); if (a?.item) p.onOpen?.({type: 'art', item: a.item}); }
    };
    const eng = createOneStroke({root: layerRef.current, section: sectionRef.current, lang, actions: {
      openProject: pr => props.current.onOpen?.({type: 'system', item: pr.item}),
      openArt: a => a.item && props.current.onOpen?.({type: 'art', item: a.item}),
      node: go,
      mail: () => { location.href = `mailto:${author.email}`; },
    }});
    engine.current = eng;
    return () => { eng.dispose(); engine.current = null; };
    // the engine reads the language through setLang; it is built once per mode
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staticMode]);
  useEffect(() => { engine.current?.setLang(lang); }, [lang]);

  if (staticMode) return <OneStrokeStatic lang={lang} onOpen={onOpen} onArchive={onArchive} onAbout={onAbout} onNavigate={onNavigate}/>;

  const footNav = (e, id) => { e.preventDefault(); if (id === 'systems') engine.current?.goChapter(1); else props.current.onNavigate?.(id); };
  const O = COPY.outro;
  return <section ref={sectionRef} className="onestroke" style={{'--os-screens': TOTAL + 1}} aria-label={en ? 'Between rules and wonder — the homepage journey' : '在规则与奇想之间——首页旅程'}>
    {[['systems', CHAPTERS[1]], ['journey-about', CHAPTERS[2]], ['journey-timeline', CHAPTERS[3]], ['worlds', CHAPTERS[4]], ['contact', CHAPTERS[5]]].map(([id, s]) =>
      <span key={id} className="os-anchor" id={id} style={{top: `${s * 100}vh`}} tabIndex={-1}/>)}

    <div className="os-layer" ref={layerRef}>
      <div className="os-stage">
        <nav className="os-l os-index" aria-label={en ? 'Chapters' : '章节'}>
          {COPY.index.map((t, k) => <button type="button" key={t} data-k={k} data-h onClick={() => engine.current?.goChapter(k)}><i/>{t}</button>)}
        </nav>

        <div className="os-l os-kv-meta"><b>{COPY.kvMeta.name}</b>{L(COPY.kvMeta.role)}<br/><span className="os-mono">{COPY.kvMeta.line}</span></div>
        <div className="os-l os-kv-hud" aria-hidden="true"><div className="gz"><i className="os-gz-a"/><i className="os-gz-b"/></div><div className="os-hud-q">Q 0.000 0.000 0.000 1.000</div><div>{COPY.hud}</div></div>
        <div className="os-l os-kv-scroll" aria-hidden="true">SCROLL<i/></div>

        {PROJECTS.map((p, i) => <div key={p.id} className="os-l os-proj" data-os-proj={i} style={SCREEN_SIDES[i] > 0 ? {right: 80} : {left: 205}}>
          <div className="reveal"><span className="no"><b>0{i + 1}</b>/ 0{PROJECTS.length} &nbsp; {p.cat}</span></div>
          <h3 className={p.serif ? 'is-serif' : ''}><span className="reveal"><span>{L(p.title)}</span></span></h3>
          <div className="reveal"><span className="sub">{L(p.sub)}</span></div>
          <div className="reveal"><span><p>{L(p.desc)}</p></span></div>
          <div className="reveal"><span className="tags">{p.tags.map(t => <span key={L(t)} data-h>{L(t)}</span>)}</span></div>
          <div className="reveal"><span>{p.ready
            ? <button type="button" className="cta" data-h onClick={() => onOpen?.({type: 'system', item: p.item})}>{L(p.cta)} <b aria-hidden="true">↗</b></button>
            : <span className="cta is-soon" data-h>{L(p.cta)} <b aria-hidden="true">—</b></span>}</span></div>
        </div>)}

        <div className="os-l os-tracer" aria-hidden="true"><i/><span>s 0.00</span></div>

        <div className="os-l os-art-head" aria-hidden="true">{L(COPY.worlds)}</div>
        <div className="os-l os-art-count"><b>{COPY.count}</b><span>original works</span><br/><button type="button" data-h onClick={() => onArchive?.()}>{L(COPY.browse)}</button></div>

        <div className="os-l os-outro">
          <svg preserveAspectRatio="none" aria-hidden="true"><line/><line/><line/><line/><line/><line/></svg>
          <div className="o-top os-mono"><span>{O.top[0]}</span><span>{O.top[1]}</span></div>
          <div className="o-grid">
            <div className="o-lead">{L(O.lead)[0]}<br/>{L(O.lead)[1]}<br/><span>{O.letter}</span></div>
            <a className="o-link" data-h href={`mailto:${author.email}`}>Email<b>{author.email}</b><i aria-hidden="true">↗</i></a>
            {recording()
              ? <a className="o-link" data-h href={author.resume} target="_blank" rel="noreferrer">Résumé<b>{en ? 'Résumé PDF' : '简历 PDF'}</b><i aria-hidden="true">↗</i></a>
              : <a className="o-link" data-h href={author.phoneHref}>Phone<b>{author.phone}</b><i aria-hidden="true">↗</i></a>}
            <a className="o-btn os-mail" data-h href={`mailto:${author.email}`}><span>{L(O.write)}</span></a>
          </div>
          <div className="o-foot os-mono">
            <a href="/#systems" data-h onClick={e => footNav(e, 'systems')}>{L(O.foot.systems)}</a>
            <a href="/works" data-h onClick={e => footNav(e, 'art')}>{L(O.foot.art)}</a>
            <a href="/#about" data-h onClick={e => { e.preventDefault(); onAbout?.(); }}>{L(O.foot.about)}</a>
            <a href={author.resume} data-h target="_blank" rel="noreferrer">{L(O.foot.resume)}</a>
            <span>© 2026 JAY LIN</span>
            <button type="button" data-h onClick={() => engine.current?.backToTop()}>{L(O.foot.top)}</button>
          </div>
        </div>

        <div className="os-cross" aria-hidden="true"><div className="h"/><div className="v"/><div className="xy"/></div>
        <div className="os-cursor" aria-hidden="true"><i/><span/></div>
      </div>
      <div className="os-monitor" aria-hidden="true"><i className="t"/><i className="b"/><b/></div>
    </div>

    {/* what the canvas says, for screen readers and search */}
    <div className="os-sr">
      <h2>Between rules &amp; wonder. {L(COPY.headSub)}</h2>
      <p>{L(ABOUT.lines).join('')} {author.name} · {author.nameEn} — {L(ABOUT.role)}</p>
      <ul>{ABOUT.education.map(e => <li key={e.school}>{e.school} — {L(e.what)}</li>)}</ul>
      <h3>{L(COPY.timelineHead)}</h3>
      <ol>{TIMELINE.map(n => <li key={n.x}>{n.year === 'SYS' ? '' : n.year} {L(n.title)} {L(n.sub)}</li>)}</ol>
      <h3>{L(COPY.worlds)}</h3>
      <ul>{ART.map(a => <li key={a.slug}>{a.item ? <button type="button" onClick={() => onOpen?.({type: 'art', item: a.item})}>{L(a.title)} · {a.year}</button> : <span>{L(a.title)} · {a.en}</span>}</li>)}</ul>
    </div>
  </section>;
}
