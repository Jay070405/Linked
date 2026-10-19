import {useEffect} from 'react';
import {CaseRows, ProductFooter} from './ProductIndex';
import {PRODUCT_CASES, SYSTEMS_CASES} from './content';

/** Unlisted note for one company (/for/figma). Not linked from the navigation, and asks search engines not to index it. */
export default function ForPage({item}) {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  // product cases open their case pages; the game research cases now live in Systems and link there
  const cases = item.order.map(slug => PRODUCT_CASES.find(c => c.slug === slug && c.page) || SYSTEMS_CASES.find(c => c.slug === slug)).filter(Boolean);
  return <div className="pp-page pp-for" lang="en" data-nav-tone="light">
    <header className="pp-for-head">
      <h1 className="pp-for-title">{item.title}</h1>
      <div className="pp-for-note">
        {item.note.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <p className="pp-for-signoff">{item.signoff[0]}<br/>{item.signoff[1]}</p>
      </div>
    </header>
    <section className="pp-cases" aria-labelledby="pp-for-cases">
      <h2 id="pp-for-cases" className="pp-section-label">Start with these</h2>
      <CaseRows cases={cases}/>
    </section>
    <ProductFooter/>
  </div>;
}
