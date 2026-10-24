import PartSpecs from './PartSpecs';
import {VisionCopy} from './Tiles';
import {useEffect} from 'react';
import {Ev} from '../../CaseKit';
import {L, useCaseLang} from '../../i18n';
import {strip} from './Type';
import {WatchButton} from '../../v2/Walkthrough';
import {ASSETS, BASE} from './media';
import {Photo, Pic} from './Pic';
import {massByGroup, power} from './model';
import {Finish, Sources} from './Chapters';
import {VISION, APP, BATTERY, BELIEVE, CAPTURE, DESIGN, DISPLAY, EVAL, EVIDENCE, HEARING, HERO, INSIDE, MASS_GROUPS, MASS_ROWS, OPEN, PARTS, POWER_ROWS, PRINCIPLE, PROBLEM, RESERVE_G, TITLE, WORN, OPENING, SIDES, DAY, CHARGE} from './content';

/* "Skip the experience": the whole case as one plain column. Same words, labels and numbers; still pictures instead of
   sequences and switches, a link instead of the live app. */

export default function Plain({onBack, videos}) {
  const {t: say, zh} = useCaseLang();
  const t = x => strip(say(x));
  useEffect(() => { document.getElementById('ar-plain-title')?.focus({preventScroll: true}); }, []);
  const m = massByGroup(MASS_ROWS, MASS_GROUPS), p = power(POWER_ROWS, BATTERY);
  const back = <p className="ar-plain-back"><button type="button" className="ar-link" onClick={onBack}>{t(L('Back to the full version', '回到完整版'))}</button></p>;
  return <div className="ar-plain">
    {back}
    <header>
      <p className="ar-kicker"><span lang="en">{TITLE}</span> · {t(HERO.kind)}</p>
      <h1 id="ar-plain-title" className="ar-plain-title" tabIndex={-1}>{t(HERO.title)}</h1>
      <p className="ar-plain-lede">{t(HERO.line)}</p>
      <ul className="ar-facts">{HERO.chips.map(c => <li key={c.en}>{t(c)}</li>)}<li>{t(HERO.concept)}</li></ul>
      {videos.page ? <p><WatchButton className="ar-btn"/></p> : null}
      <figure><Pic name="cmf-natural" alt={t(DESIGN.alt(t(DESIGN.finishes[0].name)))}/></figure>
    </header>

    <h2>{t(PROBLEM.heading)}</h2>
    <p>{t(PROBLEM.lede)}</p>
    <ol>{PROBLEM.points.map((x, i) => <li key={i}><b>{t(x.title)}</b> {t(x.text)} <Ev label={x.ev}/></li>)}</ol>
    <h3>{t(EVIDENCE[0].title)} <Ev label="Sourced"/></h3>
    <ul>{EVIDENCE[0].rows.map(([n, g, src, href]) => <li key={src}>{t(n)}: <b>{g}</b> (<a href={href} target="_blank" rel="noopener">{src}</a>)</li>)}</ul>
    {EVIDENCE.slice(1).map(e => <p key={e.title.en}><Ev label="Sourced"/> <b>{t(e.title)}.</b> {t(e.text)} <Sources list={e.sources} inline/></p>)}

    <h2>{t(DAY.heading)}</h2>
    <ul>{DAY.scenes.map(x => <li key={x.id}><b>{x.time} · {t(x.name)}.</b> {t(x.caption)}{x.them ? <> <i>{t(SIDES.them)}:</i> {t(x.them)}</> : null}</li>)}</ul>
    <p className="ar-note">{t(DAY.ai)}</p>

    <h2>{t(CHARGE.heading)}</h2>
    <p>{t(CHARGE.lede)}</p>
    <p>{t(CHARGE.note)} <Ev label="Estimated"/></p>

    <h2>{t(PRINCIPLE.heading)}</h2>
    {[PRINCIPLE.you, PRINCIPLE.them].map(([who, what]) => <p key={who.en}><b>{t(who)}{zh ? '，' : ','}</b>{zh ? '' : ' '}{t(what)}</p>)}

    <h2>{t(DESIGN.heading)}</h2>
    <p>{t(DESIGN.lede)}</p>
    <p>{DESIGN.finishes.map(f => t(f.name)).join(' · ')}</p>
    {ASSETS.stills['cmf-lineup'] ? <figure><Pic name="cmf-lineup" alt={t(DESIGN.lineupAlt)}/><figcaption>{t(DESIGN.lineup)}</figcaption></figure> : null}
    <ul>{DESIGN.details.map(d => <li key={d.id}><b>{t(d.title)}.</b> {t(d.text)}</li>)}</ul>

    <h3>{t(VISION.title)}</h3>
    <VisionCopy/>
    <h2>{t(INSIDE.heading)}</h2>
    <figure><Pic name="exploded" alt={t(INSIDE.alt)}/></figure>
    <ol>{PARTS.map(x => <li key={x.n}><b>{t(x.name)}</b>: <PartSpecs part={x}/></li>)}</ol>
    <p>{t(INSIDE.partsNote)}</p>
    <p><b>{t(INSIDE.hingeHeading)}</b> {t(INSIDE.hingeText)}</p>
    <p><b>{t(INSIDE.lensHeading)}</b> {t(INSIDE.lensText)}</p>
    <p>{t(INSIDE.lensBudget)}</p>

    <h2>{t(BELIEVE.heading)}</h2>
    <p><b>{t(BELIEVE.weightHeading)}</b> {t(BELIEVE.weightLede)} <Ev label="Estimated"/></p>
    <ul>{m.groups.map(g => <li key={g.id}>{t(g.name)}: {g.g.toFixed(2)} g</li>)}<li>{t(BELIEVE.reserve)}: {RESERVE_G.toFixed(2)} g</li></ul>
    <p>{t(BELIEVE.weightPath)}</p>
    <p><b>{t(BELIEVE.powerHeading)}</b> {t(BELIEVE.powerLede)} {p.avgMw} mW → {p.hours.toFixed(1)} h. <Ev label="Estimated"/></p>
    <p><b>{t(BELIEVE.caseHeading)}</b> {t(BELIEVE.caseText)} <Ev label="Estimated"/></p>
    {ASSETS.stills['case-open'] ? <figure><Pic name="case-open" alt={t(BELIEVE.caseAlts['case-open'])}/></figure> : null}
    <ul>{BELIEVE.make.map(([h, text]) => <li key={h.en}><b>{t(h)}.</b> {t(text)}</li>)}</ul>

    <h2>{t(DISPLAY.heading)}</h2>
    <p>{t(DISPLAY.lede)}</p>
    <p>{t(DISPLAY.spec)} <Ev label="Sourced"/></p>
    <p><b>{t(SIDES.them)}:</b> {t(SIDES.display.them)} {t(SIDES.display.translation)}</p>

    <h2>{t(CAPTURE.heading)}</h2>
    <p>{t(CAPTURE.lede)}</p>
    <ul>{CAPTURE.rules.map(([h, text]) => <li key={h.en}><b>{t(h)}.</b> {t(text)}</li>)}</ul>
    <p>{t(CAPTURE.curve)} <Ev label="Estimated"/></p>
    <p><b>{t(SIDES.them)}:</b> {t(SIDES.capture.them)}</p>

    <h2>{t(HEARING.heading)}</h2>
    <p>{t(HEARING.lede)} {t(HEARING.nudge)}</p>
    {[HEARING.counts, HEARING.you, HEARING.never].map(([h, text]) => <p key={h.en}><b>{t(h)}.</b> {t(text)}</p>)}
    <p>{t(HEARING.sensorNote)}</p>
    <p><b>{t(SIDES.them)}:</b> {t(SIDES.hearing.them)} {t(SIDES.hearing.themText)}</p>
    <ul>{HEARING.prior.map((x, i) => <li key={i}>{t(x)}</li>)}</ul>
    <figure><img src={`${BASE}/app/health-light.webp`} width={780} height={1688} alt={t(HEARING.phoneAlt)} loading="lazy" className="ar-plain-phone"/></figure>

    <h2>{t(WORN.heading)}</h2>
    <p>{t(OPENING.worn)}</p>
    {Object.keys(ASSETS.lifestyle || {}).map(n => <figure key={n}><Photo dir="lifestyle" name={n} alt={t(WORN.alts[n] || {en: '', zh: ''})}/><figcaption><Finish name={n}/>{t(WORN.label)}</figcaption></figure>)}

    <h2>{t(APP.heading)}</h2>
    <p>{t(APP.lede)}</p>
    <p><a className="ar-link" href="/proto/arden/" target="_blank" rel="noopener">{t(APP.openPhone)} ↗</a></p>

    <h2>{t(EVAL.heading)}</h2>
    <ul>{EVAL.estimated.map(([k, v]) => <li key={k.en}><b>{t(k)}:</b> {t(v)} <Ev label="Estimated"/></li>)}</ul>
    <ul>{EVAL.hypotheses.map((h, i) => <li key={i}><Ev label="Hypothesis"/> {t(h)}</li>)}</ul>
    <p><Ev label="Measured"/> {t(EVAL.measuredTitle)}</p>

    <h2>{t(OPEN.heading)}</h2>
    <ul>{OPEN.items.map(([h, text]) => <li key={h.en}><b>{t(h)}.</b> {t(text)}</li>)}</ul>
    {back}
  </div>;
}
