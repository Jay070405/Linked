import {useState} from 'react';
import {Ev} from '../../CaseKit';
import {useCaseLang} from '../../i18n';
import {PHONE, useMedia} from '../../v2/motion';
import {ASSETS, has} from './media';
import {Photo, Pic} from './Pic';
import Turntable from './Turntable';
import Exploded from './Exploded';
import Cutaways from './Cutaways';
import {Dimensions, Make, Power, Weight} from './Believe';
import AppProto from './AppProto';
import {ProblemCards, WornPhoto} from './Opening';
import Day from './Day';
import {DesignTiles} from './Tiles';
import Charge from './Charge';
import {AFTER_DAY, APP, BELIEVE, DESIGN, DISPLAY, EVAL, HEARING, INSIDE, INSIDE_X, OPEN, WORN} from './content';
import {Rich, Statement, Words} from './Type';

/* Everything after the opening film (its own chunk; ArdenWorld renders the opening and loads this right after):
   the worn photo, the problem, a day with Arden, how it charges, the display and Hearing Check-in in two short blocks,
   design, the turntable, inside, the numbers, worn, the app, evaluation, what's still open
   (site-spec/WORLD-ARDEN-V3.md). Every chapter has one thing to do; long tables wait behind "Show the numbers". */

const NEW_TAB = {en: ' (opens in a new tab)', zh: '（在新标签页打开）'};

export function Head({id, eyebrow, title, lede, center = false}) {
  const {t} = useCaseLang();
  return <div className={`ar-head${center ? ' is-center' : ''}`}>
    {eyebrow ? <p className="ar-eyebrow">{t(eyebrow)}</p> : null}
    <Words as="h2" id={id} className="ar-h2" text={title}/>
    {lede ? <p className="ar-lede"><Rich text={lede}/></p> : null}
  </div>;
}

export function Sources({list, inline = false}) {
  const {t} = useCaseLang();
  const Tag = inline ? 'span' : 'p';
  return <Tag className={`ar-src${inline ? ' is-inline' : ''}`}>{list.map((s, i) => <span key={s.href}>{i ? ' · ' : ''}<a href={s.href} target="_blank" rel="noopener">{s.name}<span className="ar-sr">{t(NEW_TAB)}</span></a></span>)}</Tag>;
}

/** A button that shows or hides the numbers behind a chapter. */
export function More({children, label = INSIDE_X.showNumbers}) {
  const {t} = useCaseLang();
  const [open, setOpen] = useState(false);
  return <div className="ar-more">
    <button type="button" className="ar-link ar-more-btn" aria-expanded={open} onClick={() => setOpen(v => !v)}>{t(open ? INSIDE_X.hideNumbers : label)}</button>
    {open ? <div className="ar-more-body">{children}</div> : null}
  </div>;
}

export default function Chapters({reduced, videos}) {
  const phone = useMedia(PHONE);
  return <>
    <WornPhoto/>
    <ProblemCards reduced={reduced}/>
    <Day reduced={reduced}/>
    <Charge reduced={reduced}/>
    <AfterDay reduced={reduced}/>
    <Design reduced={reduced}/>
    <section className="ar-chapter is-plain-bg" aria-labelledby="ar-turn">
      <Head id="ar-turn" title={DESIGN.turnHeading}/>
      <Turntable reduced={reduced}/>
    </section>
    <Inside reduced={reduced}/>
    <Believe/>
    <Worn/>
    <section id="ar-app" className="ar-chapter is-alt has-say" aria-labelledby="ar-app-h">
      <Statement id="ar-app-h" label={APP.eyebrow} text={APP.heading} lede={APP.lede} reduced={reduced}/>
      <AppProto phone={phone} videos={videos}/>
    </section>
    <Evaluation reduced={reduced}/>
    <Open/>
  </>;
}

/* ---------- after the day: the display and Hearing Check-in, in two short blocks ---------- */
function AfterDay({reduced}) {
  const {t} = useCaseLang();
  return <section className="ar-chapter ar-after" aria-label={`${t(AFTER_DAY.displayTitle)} · ${t(AFTER_DAY.hearingTitle)}`}>
    <div className="ar-after-grid">
      <div>
        <Words className="ar-h3" text={AFTER_DAY.displayTitle} reduced={reduced}/>
        <p className="ar-body"><Rich text={AFTER_DAY.display} reduced={reduced}/> <Ev label="Sourced"/> <Sources list={[DISPLAY.specSource]} inline/></p>
      </div>
      <div>
        <Words className="ar-h3" text={AFTER_DAY.hearingTitle} reduced={reduced}/>
        <p className="ar-body">{t(AFTER_DAY.hearing)} <Ev label="Sourced"/> <Sources list={[HEARING.why[0].source, HEARING.why[2].source]} inline/></p>
      </div>
    </div>
  </section>;
}

/* ---------- design: finishes and details ---------- */
function Design({reduced}) {
  const {t} = useCaseLang();
  const finishes = DESIGN.finishes.filter(f => has(f.still));
  const [pick, setPick] = useState(finishes[0]?.id);
  const [zoom, setZoom] = useState(null);
  const cur = finishes.find(f => f.id === pick);
  const shownDetails = DESIGN.details.filter(d => has(d.still));
  return <section id="ar-design" className="ar-chapter has-say" aria-labelledby="ar-design-h">
    <Statement id="ar-design-h" label={DESIGN.eyebrow} text={DESIGN.heading} lede={DESIGN.lede} reduced={reduced}/>
    {finishes.length ? <div className="ar-cmf">
      <figure className="ar-cmf-fig">
        {finishes.map(f => <Pic key={f.id} name={f.still} alt={pick === f.id ? t(DESIGN.alt(t(f.name))) : ''} aria-hidden={pick === f.id ? undefined : 'true'} data-on={pick === f.id || undefined} className="ar-cmf-img"/>)}
      </figure>
      <div className="ar-cmf-row">
        <div className="ar-swatches" role="group" aria-label={t(DESIGN.finishLabel)}>
          {finishes.map(f => <button key={f.id} type="button" className="ar-swatch" aria-pressed={pick === f.id} onClick={() => setPick(f.id)}>
            <span className="ar-swatch-dot" style={{background: f.swatch}} aria-hidden="true"/><span className="ar-swatch-name">{t(f.name)}</span>
          </button>)}
        </div>
        <p className="ar-cmf-name" aria-live="polite">{cur ? t(cur.name) : null}</p>
      </div>
    </div> : null}
    {has('cmf-lineup') ? <figure className="ar-lineup">
      <Pic name="cmf-lineup" alt={t(DESIGN.lineupAlt)}/>
      <figcaption>{t(DESIGN.lineup)}</figcaption>
    </figure> : null}
    <div className="ar-sub">
      <Words className="ar-h3 is-big" text={DESIGN.detailsHeading} reduced={reduced}/>
      <p className="ar-note">{t(DESIGN.detailsHint)}</p>
      <ul className="ar-details">
        {shownDetails.map(d => <li key={d.id} className={`ar-detail${d.wide && shownDetails.length % 3 === 2 ? ' is-wide' : ''}`}>
          <button type="button" className="ar-detail-shot" aria-pressed={zoom === d.id} aria-label={t(d.title)} onClick={() => setZoom(z => (z === d.id ? null : d.id))}
            style={{'--fx': `${d.focus[0]}%`, '--fy': `${d.focus[1]}%`, '--z': d.zoom}} data-still={reduced || undefined}>
            <Pic name={d.still} alt=""/>
          </button>
          <h4>{t(d.title)}</h4>
          <p>{t(d.text)}</p>
        </li>)}
      </ul>
    </div>
    <DesignTiles reduced={reduced}/>
  </section>;
}

/* ---------- inside ---------- */
function Inside({reduced}) {
  const {t} = useCaseLang();
  return <section id="ar-inside" className="ar-chapter has-say" aria-labelledby="ar-inside-h">
    <Statement id="ar-inside-h" label={INSIDE.eyebrow} text={INSIDE.heading} lede={INSIDE.lede} reduced={reduced}/>
    <Exploded reduced={reduced}/>
    <div className="ar-sub">
      <Words className="ar-h3 is-big" text={INSIDE.cutHeading} reduced={reduced}/>
      <p className="ar-lede is-small">{t(INSIDE.cutLede)}</p>
      <Cutaways reduced={reduced}/>
    </div>
    <div className="ar-sub ar-pair">
      {has('detail-hinge-flex') ? <div>
        <figure className="ar-plate"><Pic name="detail-hinge-flex" alt={t(INSIDE.hingeAlt)}/></figure>
        <Words className="ar-h3" text={INSIDE.hingeHeading} reduced={reduced}/>
        <p className="ar-body">{t(INSIDE.hingeText)} <Ev label="Estimated"/></p>
      </div> : null}
      {has('lens-layers') ? <div>
        <figure className="ar-plate"><Pic name="lens-layers" alt={t(INSIDE.lensAlt)}/></figure>
        <Words className="ar-h3" text={INSIDE.lensHeading} reduced={reduced}/>
        <p className="ar-body">{t(INSIDE.lensText)}</p>
        <More>
          <p className="ar-note">{t(INSIDE.lensBudget)}</p><dl className="ar-layers">{INSIDE.lensLayers.map(([n, mm], i) => <div key={i}><dt>{t(n)}</dt><dd>{t(mm)}</dd></div>)}</dl>
          <Ev label="Estimated"/>
        </More>
      </div> : null}
    </div>
  </section>;
}

/* ---------- the numbers ---------- */
function Believe() {
  const {t} = useCaseLang();
  return <section className="ar-chapter is-alt" aria-labelledby="ar-believe">
    <Head id="ar-believe" eyebrow={BELIEVE.eyebrow} title={BELIEVE.heading}/>
    <div className="ar-sub is-first">
      <Words className="ar-h3 is-big" text={BELIEVE.dimsHeading}/>
      <Dimensions/>
    </div>
    <div className="ar-sub">
      <Words className="ar-h3 is-big" text={BELIEVE.weightHeading}/>
      <p className="ar-lede is-small">{t(BELIEVE.weightLede)}</p>
      <Weight/>
    </div>
    <div className="ar-sub">
      <Words className="ar-h3 is-big" text={BELIEVE.powerHeading}/>
      <p className="ar-body">{t(BELIEVE.powerLede)} <Ev label="Estimated"/></p>
      <More><Power/></More>
    </div>
    <div className="ar-sub">
      <Words className="ar-h3 is-big" text={BELIEVE.makeHeading}/>
      <Make/>
    </div>
  </section>;
}

/* ---------- worn ---------- */
function Worn() {
  const {t} = useCaseLang();
  const names = Object.keys(ASSETS.lifestyle || {});
  if (!names.length) return null;
  return <section className="ar-chapter" aria-labelledby="ar-worn">
    <Head id="ar-worn" eyebrow={WORN.eyebrow} title={WORN.heading}/>
    <ul className="ar-worn">{names.map(n => <li key={n}>
      <figure><Photo dir="lifestyle" name={n} alt={t(WORN.alts[n] || {en: '', zh: ''})}/><figcaption><Finish name={n}/>{t(WORN.label)}</figcaption></figure>
    </li>)}</ul>
  </section>;
}

/** The finish a try-on photo shows, as a small lead-in to its caption. */
export function Finish({name}) {
  const {t} = useCaseLang();
  const f = DESIGN.finishes.find(x => x.id === WORN.finish[name]);
  return f ? <span className="ar-worn-finish">{t(f.name)}</span> : null;
}

/* ---------- evaluation ---------- */
function Evaluation({reduced}) {
  const {t} = useCaseLang();
  return <section id="ar-eval" className="ar-chapter has-say" aria-labelledby="ar-eval-h">
    <Statement id="ar-eval-h" label={EVAL.eyebrow} text={EVAL.heading} reduced={reduced}/>
    <div className="ar-eval">
      <div className="ar-eval-col">
        <p className="ar-eval-tag"><Ev label="Estimated"/></p>
        <dl className="ar-est">{EVAL.estimated.map(([k, v]) => <div key={k.en}><dt>{t(k)}</dt><dd><Rich text={v} reduced={reduced}/></dd></div>)}</dl>
      </div>
      <div className="ar-eval-col">
        <Words className="ar-h3" text={EVAL.planTitle} reduced={reduced}/>
        <ul className="ar-list">{EVAL.plan.map((p, i) => <li key={i}>{t(p)}</li>)}</ul>
        <Words className="ar-h3 is-gap" text={EVAL.hypTitle} reduced={reduced}/>
        <ul className="ar-hyps">{EVAL.hypotheses.map((h, i) => <li key={i}><Ev label="Hypothesis"/><span>{t(h)}</span></li>)}</ul>
      </div>
      <div className="ar-measured" aria-label={t(EVAL.slot)}>
        <p className="ar-measured-head"><Ev label="Measured"/><b>{t(EVAL.measuredTitle)}</b></p>
        <dl>{EVAL.measuredRows.map(([a, b], i) => <div key={i}><dt>{t(a)}</dt><dd>{b}</dd></div>)}</dl>
        <p className="ar-note">{t(EVAL.measuredNote)}</p>
      </div>
    </div>
  </section>;
}

/* ---------- still open ---------- */
function Open() {
  const {t} = useCaseLang();
  return <section className="ar-chapter is-alt" aria-labelledby="ar-open">
    <Head id="ar-open" eyebrow={OPEN.eyebrow} title={OPEN.heading}/>
    <ul className="ar-open">{OPEN.items.map(([h, text]) => <li key={h.en}><Words className="ar-h3" text={h}/><p>{t(text)}</p></li>)}</ul>
    <div className="ar-legend">
      <p className="ar-small-head">{t(OPEN.legendTitle)}</p>
      <ul>{OPEN.legend.map(([label, text]) => <li key={label}><Ev label={label}/><span>{t(text)}</span></li>)}</ul>
    </div>
  </section>;
}
