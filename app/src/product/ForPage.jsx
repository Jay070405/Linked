import {useEffect} from 'react';
import {Todo} from './CaseKit';
import {CaseRows, ProductFooter} from './ProductIndex';
import {PRODUCT_CASES} from './content';

/** Unlisted note for one company (/for/figma). Not linked from the navigation, and asks search engines not to index it. */
export default function ForPage({item}) {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);
  const cases = [...PRODUCT_CASES.filter(c => c.slug === item.first), ...PRODUCT_CASES.filter(c => c.slug !== item.first)];
  return <div className="pp-page pp-for" lang="en" data-nav-tone="light">
    <header className="pp-for-head">
      <h1 className="pp-for-title">{item.title}</h1>
      <div className="pp-for-note">
        <Todo>Jay writes this note: three or four sentences, in their own voice.</Todo>
        <p>Draft: I use Figma every day, as an illustrator and now to hand work to coding agents. The first case below was built for this application. It measures what breaks when agents build from Figma files, and what Figma could do about it.</p>
      </div>
    </header>
    <section className="pp-cases" aria-labelledby="pp-for-cases">
      <h2 id="pp-for-cases" className="pp-section-label">Start with these</h2>
      <CaseRows cases={cases}/>
    </section>
    <ProductFooter/>
  </div>;
}
