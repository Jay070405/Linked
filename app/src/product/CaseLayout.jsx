import {Go} from './Go';
import {Annotated, Legend} from './CaseKit';
import {ProductFooter} from './ProductIndex';
import {PRODUCT_HOME, nextCase} from './content';

/** One case study: back link, title, summary, the legend in the margin, the annotated body, the next case. */
export default function CaseLayout({item, legend, reduced, children}) {
  const next = nextCase(item.slug);
  return <article className="pp-page pp-case" lang="en" data-nav-tone="light">
    <header className="pp-case-head">
      <Go to={PRODUCT_HOME} className="pp-back"><span aria-hidden="true">←</span> All product work</Go>
      <p className="pp-case-kind">{item.kind}, {item.when}</p>
      <h1 className="pp-case-title">{item.title}</h1>
      <p className="pp-case-summary">{item.summary}</p>
      <Legend {...legend}/>
    </header>
    <Annotated reduced={reduced}>{children}</Annotated>
    <nav className="pp-next" aria-label="Next case study">
      <p className="pp-next-label">Next case</p>
      <p className="pp-next-title"><Go to={`${PRODUCT_HOME}/${next.slug}`}>{next.title}</Go></p>
      <p className="pp-next-summary">{next.summary}</p>
    </nav>
    <ProductFooter/>
  </article>;
}
