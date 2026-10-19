import {Ev} from '../../CaseKit';
import {Go} from '../../Go';
import {PRODUCT_HOME} from '../../content';
import {protoUrl, shotSrc} from './kit/Device';
import {CHANGES, DECISIONS, HERO, inches, NUMBERS, PROBLEM, px, REFLECTION, REVIEW_NOTE, ROUNDS, STEPS, TASKS, TESTING, wallSrc, WORKS} from './data';
import {earnings, largestSharp, money, papers, printCheck, sizes} from './model';

/* "Skip the experience": the whole case as a plain page. Same words and numbers as the gallery, no pinning, no
   scroll-driven scenes, no lights; the interactive checks become the tables they compute. */
export default function Plain({item, next, onBack}) {
  const blue = WORKS[0], top = largestSharp(blue), e = earnings(38, top, papers[0]);
  return <div className="atw-plain">
    <div className="atw-plain-bar">
      <p>You’re reading the plain version of this case: the same content, without the gallery.</p>
      <button type="button" className="atw-plain-back" onClick={onBack}>Back to the gallery</button>
    </div>

    <header className="atw-plain-head">
      <Go to={PRODUCT_HOME} className="atw-plain-up"><span aria-hidden="true">←</span> All product work</Go>
      <p className="atw-plain-kind">{item.kind}</p>
      <h1 id="atw-plain-title" tabIndex={-1}>{HERO.title}</h1>
      <p className="atw-plain-lead">{HERO.outcome}</p>
      <ul className="atw-plain-chips" aria-label="Project facts">{HERO.chips.map(c => <li key={c}>{c}</li>)}</ul>
      <p><a href={protoUrl('onboarding')} target="_blank" rel="noopener">Open the prototype<span className="atw-sr"> (opens in a new tab)</span></a></p>
    </header>

    <section aria-labelledby="pl-numbers">
      <h2 id="pl-numbers">In numbers</h2>
      <ul>{NUMBERS.map(n => <li key={n.label}><b>{n.value}{n.unit ? ` ${n.unit}` : ''}</b>: {n.label.toLowerCase()}. {n.note}.</li>)}</ul>
    </section>

    <section aria-labelledby="pl-collection">
      <h2 id="pl-collection">The collection</h2>
      <p>Atelier’s catalog is eight of my own paintings, each with the label a collector would see. A size is listed only if the whole painting prints at 300 dpi or more inside a quarter-inch white border; $38 is the prototype’s default price for the largest size.</p>
      <ul className="atw-plain-works">
        {WORKS.map(w => <li key={w.id}>
          <img src={wallSrc(w.id)} width={w.originalWidth} height={w.originalHeight} alt={`${w.title}: ${w.about}`} loading="lazy" decoding="async"/>
          <p><b>{w.title}</b>. {w.about} Original file {px(w.originalWidth)} × {px(w.originalHeight)} px; prints sharp up to {inches(w, w.top)} in; $38.</p>
        </li>)}
      </ul>
    </section>

    <section aria-labelledby="pl-problem">
      <h2 id="pl-problem">{PROBLEM.heading}</h2>
      {PROBLEM.paragraphs.map(p => <p key={p.slice(0, 20)}>{p}</p>)}
      <p className="atw-plain-note"><Ev label="Hypothesis"/> {PROBLEM.hypothesis}</p>
      <p>The four tools: {PROBLEM.tools.map(t => `${t.name} (${t.role})`).join('; ')}. The questions that fall between them: {PROBLEM.seams.join(' ')}</p>
      <p className="atw-plain-note"><Ev label="Hypothesis"/> {PROBLEM.seamsNote}</p>
      <p className="atw-plain-note">Placeholder: {PROBLEM.quote}</p>
    </section>

    <section aria-labelledby="pl-flow">
      <h2 id="pl-flow">Five steps to a drop, then share it</h2>
      <ol className="atw-plain-steps">
        {STEPS.map((s, i) => <li key={s.id}>
          <img src={shotSrc(s.screen)} width={780} height={1688} alt={s.alt} loading="lazy" decoding="async"/>
          <div><p className="atw-plain-kind">{i < 5 ? `Step ${i + 1} of 5` : 'After publishing'}</p><h3>{s.title}</h3><p>{s.text}</p></div>
        </li>)}
      </ol>
    </section>

    <section aria-labelledby="pl-check">
      <h2 id="pl-check">The print check</h2>
      <p>A sharp print needs about 300 of the file’s pixels for every inch of paper. Fewer, and the printer has to stretch the file to fill the paper, and the print goes soft. Atelier does this arithmetic before an artist can offer a size, for the six sizes it sells.</p>
      <div className="atw-plain-table" role="region" aria-label="Print check for each painting" tabIndex={0}>
        <table>
          <caption>Dots per inch at each size; sizes at 300 or more can be sold.</caption>
          <thead><tr><th scope="col">Painting</th>{sizes.map(z => <th key={z.id} scope="col">{z.w} × {z.h} in</th>)}</tr></thead>
          <tbody>{WORKS.map(w => <tr key={w.id}><th scope="row">{w.title}</th>{sizes.map(z => { const r = printCheck(w, z); return <td key={z.id} className={r.ok ? '' : 'is-no'}>{r.dpi}{r.ok ? '' : <span className="atw-sr"> (not sold)</span>}</td>; })}</tr>)}</tbody>
        </table>
      </div>
      <p>What the artist keeps, for {blue.title} at {inches(blue, top)} in on studio matte, priced at {money(e.price)}: {money(e.printCost)} for print and paper, {money(e.fee)} in fees (8% + $0.30), {money(e.keep)} to the artist. Cotton rag adds $4 to the production cost.</p>
      <p className="atw-plain-note"><Ev label="Estimated"/> The 8% + $0.30 fee is a concept number and the print costs are assumptions, not a vendor quote. The arithmetic is the prototype’s, to the cent.</p>
    </section>

    <section aria-labelledby="pl-decisions">
      <h2 id="pl-decisions">What I chose, and what I tried first</h2>
      {DECISIONS.map(d => <div key={d.id} className="atw-plain-decision">
        <h3>{d.title}</h3>
        <p>{d.verdict}</p>
        <p><b>Tried:</b> {d.tried}</p>
        <p><b>Chose:</b> {d.chose}</p>
      </div>)}
    </section>

    <section aria-labelledby="pl-rounds">
      <h2 id="pl-rounds">Round 1 → Round 2</h2>
      <p><b>A model-assisted design review.</b> {REVIEW_NOTE}</p>
      {ROUNDS.map(r => <figure key={r.id} className="atw-plain-pair">
        <img src={r.before.src} width={780} height={1688} alt={`${r.tab}, round 1`} loading="lazy" decoding="async"/>
        <img src={r.after.src} width={780} height={1688} alt={`${r.tab}, round 2`} loading="lazy" decoding="async"/>
        <figcaption>{r.caption}</figcaption>
      </figure>)}
      <h3>What changed and why</h3>
      <ul>{CHANGES.map(c => <li key={c.what}>{c.what} <i>{c.why}</i></li>)}</ul>
    </section>

    <section aria-labelledby="pl-try">
      <h2 id="pl-try">Try it yourself</h2>
      <p>The prototype runs in your browser only: no account, no payment, no shipping. Each task opens it in a new tab.</p>
      <ol>{TASKS.map(t => <li key={t.id}><a href={protoUrl(t.screen, t.art)} target="_blank" rel="noopener">{t.title}</a>. {t.hint}</li>)}</ol>
    </section>

    <section aria-labelledby="pl-testing">
      <h2 id="pl-testing">Testing comes next</h2>
      <p>Nothing here has been tested with artists yet. This is the plan, and the space the results will fill.</p>
      <h3>Plan for test day</h3>
      <ul>{TESTING.plan.map(p => <li key={p}>{p}</li>)}</ul>
      <h3>Hypotheses to check</h3>
      <ul>{TESTING.hypotheses.map(h => <li key={h}><Ev label="Hypothesis"/> {h}</li>)}</ul>
      <p className="atw-plain-note">Placeholder: results after test day. {TESTING.results.map(([k, v]) => `${k}: ${v}`).join('; ')}.</p>
    </section>

    <section aria-labelledby="pl-reflection">
      <h2 id="pl-reflection">Reflection</h2>
      {REFLECTION.map(r => <div key={r.title}><h3>{r.title}</h3><p>{r.text}</p></div>)}
    </section>

    <p className="atw-plain-next">Next project: <Go to={`${PRODUCT_HOME}/${next.slug}`}>{next.title}</Go></p>
  </div>;
}
