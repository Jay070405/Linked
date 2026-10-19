import {Go} from './Go';
import {Annotated, Ev, Note, Noted} from './CaseKit';
import {EVIDENCE, POSITIONING_LINES, PRODUCT_CASES, PRODUCT_HOME, SUBLINE} from './content';
import {author} from '../portfolioData';

const RESUME = '/assets/docs/jay-lin-resume-en.pdf';

/** The case-study rows, divided by rules. The title link covers the row; screen readers hear only the title. */
export function CaseRows({cases = PRODUCT_CASES, level = 2}) {
  const H = `h${level}`;
  return <ul className="pp-rows">
    {cases.map(c => <li key={c.slug} className="pp-row">
      <div className="pp-row-text">
        <H className="pp-row-title"><Go to={`${PRODUCT_HOME}/${c.slug}`} className="pp-row-link">{c.title}</Go></H>
        <p className="pp-row-summary">{c.summary}</p>
        <p className="pp-row-proof"><Ev label={c.proof.label}/><span>{c.proof.text}</span></p>
      </div>
      <p className="pp-row-meta"><span>{c.kind}</span><span>{c.when}</span>{c.status ? <span className="pp-row-status">{c.status}</span> : null}</p>
    </li>)}
  </ul>;
}

export function ProductFooter() {
  return <footer className="pp-foot">
    <div>
      <p className="pp-foot-lead">Write to me</p>
      <p><a href={`mailto:${author.email}`}>{author.email}</a></p>
      <p><a href={RESUME}>Résumé (PDF)</a></p>
    </div>
    <div>
      <p className="pp-foot-lead">More of my work</p>
      <p><Go to="/systems">Systems design</Go></p>
      <p><Go to="/works">Illustration and visual worlds</Go></p>
    </div>
  </footer>;
}

/** /product: who, what for, and the three cases. Text first, nothing to wait for. */
export default function ProductIndex({reduced}) {
  return <div className="pp-page pp-index" lang="en" data-nav-tone="light">
    <header className="pp-hero">
      <h1 className="pp-hero-title">{POSITIONING_LINES.map(line => <span key={line}>{line} </span>)}</h1>
      <Annotated reduced={reduced} sans>
        <Noted>
          <p className="pp-hero-sub">{SUBLINE}</p>
          <Note>
            <p>Each case labels its claims by how I know them.</p>
            <p className="pp-key">{EVIDENCE.map(label => <Ev key={label} label={label}/>)}</p>
          </Note>
        </Noted>
      </Annotated>
    </header>
    <section className="pp-cases" aria-labelledby="pp-cases-title">
      <h2 id="pp-cases-title" className="pp-section-label">Case studies</h2>
      <CaseRows/>
    </section>
    <ProductFooter/>
  </div>;
}
