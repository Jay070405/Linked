import {Fragment, useLayoutEffect, useRef} from 'react';
import {Go} from './Go';
import {Annotated, Ev, Note, Noted} from './CaseKit';
import {GapThumb} from './charts';
import {EVIDENCE, POSITIONING_LINES, POSITIONING_LINES_ZH, PRODUCT_CASES, PRODUCT_HOME, SUBLINE, SUBLINE_ZH} from './content';
import {L, localize, UI, useCaseLang} from './i18n';
import {author} from '../portfolioData';
import CursorLabel from './v2/CursorLabel';
import {FINE, gsap, SplitText, useReveals} from './v2/motion';
import {ArdenTileArt, AtelierTileArt, CntlTileArt, HakoTileArt, L100TileArt, RfaTileArt} from './v2/TileArt';
import {ArrowRight} from './v2/icons';
import './v2/v2.css';
import './v2/tiles.css';

const RESUME = '/assets/docs/jay-lin-resume-en.pdf';

/** A real figure from the case. Decorative here (the title link and summary carry the meaning), so it is hidden
    from screen readers; the same picture is described properly on the case page. */
function Thumb({thumb}) {
  if (!thumb) return null;
  return <div className="pp-row-thumb" aria-hidden="true">
    {thumb.chart === 'gap' ? <GapThumb/> : <img src={thumb.src} width={thumb.width} height={thumb.height} alt="" loading="lazy" decoding="async"/>}
  </div>;
}

/** Case-study rows divided by rules (used by the unlisted /for/* notes). The title link covers the row. */
export function CaseRows({cases, level = 2}) {
  const H = `h${level}`;
  return <ul className="pp-rows">
    {cases.map(c => <li key={c.slug} className={`pp-row${c.thumb ? ' has-thumb' : ''}`}>
      <H className="pp-row-title"><Go to={c.href || `${PRODUCT_HOME}/${c.slug}`} className="pp-row-link">{c.title}</Go></H>
      <Thumb thumb={c.thumb}/>
      <p className="pp-row-summary">{c.summary}</p>
      {c.proof ? <p className="pp-row-proof"><Ev label={c.proof.label}/><span>{c.proof.text}</span></p> : null}
      <p className="pp-row-meta"><span>{c.kind}</span>{c.when ? <span>{c.when}</span> : null}{c.status ? <span className="pp-row-status">{c.status}</span> : null}</p>
    </li>)}
  </ul>;
}

export function ProductFooter() {
  const {t} = useCaseLang();
  return <footer className="pp-foot">
    <div>
      <p className="pp-foot-lead">{t(L('Write to me', '联系我'))}</p>
      <p><a href={`mailto:${author.email}`}>{author.email}</a></p>
      <p><a href={RESUME}>{t(L('Résumé (PDF)', '简历（英文 PDF）'))}</a></p>
    </div>
    <div>
      <p className="pp-foot-lead">{t(L('More of my work', '更多作品'))}</p>
      <p><Go to="/systems">{t(L('Systems design', '系统策划'))}</Go></p>
      <p><Go to="/works">{t(L('Illustration and visual worlds', '插画与视觉世界'))}</Go></p>
    </div>
  </footer>;
}

/** A title whose letters roll up through a mask on hover: each glyph slides out the top while its copy rises from
    below, a few milliseconds behind its neighbour. Screen readers read the plain copy once. */
function RollTitle({text}) {
  const words = text.split(' ');
  let i = 0;
  return <>
    <span className="v2-sr">{text}</span>
    <span className="pt-roll" aria-hidden="true">{words.map((word, w) => <Fragment key={w}>
      {w ? ' ' : null}
      <span className="pt-word">{[...word].map(ch => { const n = i++; return <span key={n} className="pt-ch" style={{'--i': n}}>{ch}</span>; })}</span>
    </Fragment>)}</span>
  </>;
}

function TileVisual({item}) {
  if (item.slug === 'ready-for-agents') return <RfaTileArt/>;
  if (item.slug === 'atelier') return <AtelierTileArt/>;
  if (item.slug === 'last-100-feet') return <L100TileArt/>;
  if (item.slug === 'choose-not-to-lose') return <CntlTileArt/>;
  if (item.slug === 'arden') return <ArdenTileArt/>;
  if (item.slug === 'hako') return <HakoTileArt/>;
  return item.thumb ? <span className="pt-photo" data-depth="12"><img src={item.thumb.src} width={item.thumb.width} height={item.thumb.height} alt="" loading="lazy" decoding="async"/></span> : null;
}

/** One project on /product: a large picture that leans toward the pointer and scales a touch inside its frame,
    the title rolling through its mask, then the one-line subtitle. Cases with a page are links (the site's circular
    transition carries you in); in-progress cases are not, and say so. */
function Tile({item: source}) {
  const {lang, t} = useCaseLang();
  const item = localize(source, lang);
  const inner = <>
    <div className="pt-visual" aria-hidden="true"><div className="pt-visual-inner"><TileVisual item={item}/></div></div>
    <div className="pt-text">
      <p className="pt-meta"><span>{item.kind}</span>{item.status ? <span className={`pt-status${item.page ? '' : ' is-soon'}`}>{item.status}</span> : null}</p>
      <h3 className="pt-title"><RollTitle text={item.title}/></h3>
      <p className="pt-sub">{item.subtitle}</p>
      {item.page ? <span className="pt-go" aria-hidden="true"><ArrowRight/></span> : null}
    </div>
  </>;
  return <li className={`pt-tile pt-tile--${item.slug}${item.page ? '' : ' is-soon'}`} data-reveal="">
    {item.page
      ? <Go to={`${PRODUCT_HOME}/${item.slug}`} className="pt-link" data-cursor={t(UI.view)} aria-label={`${item.title}${lang === 'zh' ? '：' : ': '}${item.subtitle}`}>{inner}</Go>
      : <div className="pt-link">{inner}</div>}
  </li>;
}

/** /product: who, what for, and the four product-design projects as large tiles. */
export default function ProductIndex({reduced}) {
  const root = useRef(null), heading = useRef(null);
  const {zh, t, htmlLang} = useCaseLang();
  const lines = zh ? POSITIONING_LINES_ZH : POSITIONING_LINES;
  useReveals(root, reduced);

  // the headline rises word by word through its line masks, once
  useLayoutEffect(() => {
    if (reduced || !heading.current) return undefined;
    let split = null;
    const ctx = gsap.context(() => {
      try {
        // each line clips its own words (.pt-hl), so they rise from behind the line, not from below the page
        split = new SplitText(heading.current.querySelectorAll('.pt-hl'), {type: 'words', wordsClass: 'pt-w', tag: 'span', aria: 'none'});
        gsap.from(split.words, {yPercent: 115, duration: .9, ease: 'v2out', stagger: .045});
      } catch { /* the headline simply shows */ }
    }, root.current);
    return () => { ctx.revert(); split?.revert(); };
  }, [reduced, zh]);

  // tiles: picture layers lean toward the pointer, each by its depth
  useLayoutEffect(() => {
    const node = root.current;
    if (!node || reduced || !matchMedia(FINE).matches) return undefined;
    const offs = [];
    node.querySelectorAll('.pt-tile').forEach(tile => {
      const box = tile.querySelector('.pt-visual');
      const layers = [...tile.querySelectorAll('[data-depth]')].map(el => ({d: Number(el.dataset.depth) || 0,
        x: gsap.quickTo(el, 'x', {duration: .8, ease: 'power3'}), y: gsap.quickTo(el, 'y', {duration: .8, ease: 'power3'})}));
      if (!box || !layers.length) return;
      const move = e => { const r = box.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5; layers.forEach(l => { l.x(px * l.d); l.y(py * l.d); }); };
      const rest = () => layers.forEach(l => { l.x(0); l.y(0); });
      tile.addEventListener('pointermove', move, {passive: true}); tile.addEventListener('pointerleave', rest);
      offs.push(() => { tile.removeEventListener('pointermove', move); tile.removeEventListener('pointerleave', rest); });
    });
    return () => offs.forEach(off => off());
  }, [reduced]);

  return <div ref={root} className={`pp-page v2-page pp-index${zh ? ' is-zh' : ''}`} lang={htmlLang} data-nav-tone="light">
    <header className="pp-hero">
      <h1 className="pp-hero-title" aria-label={lines.join(zh ? '' : ' ')}><span key={htmlLang} ref={heading} aria-hidden="true">{lines.map(line => <span key={line} className="pt-hl">{line}{zh ? '' : ' '}</span>)}</span></h1>
      <Annotated reduced={reduced} sans>
        <Noted>
          <p className="pp-hero-sub">{zh ? SUBLINE_ZH : SUBLINE}</p>
          <Note>
            <p>{t(L('Each case labels its claims by how I know them.', '每条结论，我都标明了是怎么知道的。'))}</p>
            <p className="pp-key">{EVIDENCE.map(label => <Ev key={label} label={label}/>)}</p>
          </Note>
        </Noted>
      </Annotated>
    </header>
    <section className="pt-section" aria-labelledby="pp-cases-title">
      <h2 id="pp-cases-title" className="pp-section-label">{t(L('Product design', '产品设计'))}</h2>
      <ul className="pt-grid">{PRODUCT_CASES.map(item => <Tile key={item.slug} item={item}/>)}</ul>
    </section>
    <ProductFooter/>
    <CursorLabel root={root} reduced={reduced}/>
  </div>;
}
