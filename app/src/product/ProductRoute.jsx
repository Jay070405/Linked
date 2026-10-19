import {Go, NavigateContext} from './Go';
import ProductIndex from './ProductIndex';
import ForPage from './ForPage';
import DesignToCodeCase from './cases/DesignToCodeCase';
import AtelierCase from './cases/AtelierCase';
import ReadyForAgentsCase from './worlds/ready-for-agents/ReadyForAgentsWorld';
import ChooseNotToLoseCase from './cases/ChooseNotToLoseCase';
import LastHundredFeetCase from './cases/LastHundredFeetCase';
import {PRODUCT_HOME} from './content';
import './product.css';

const CASES = {'ready-for-agents': ReadyForAgentsCase, 'design-to-code': DesignToCodeCase, atelier: AtelierCase, 'last-100-feet': LastHundredFeetCase, 'choose-not-to-lose': ChooseNotToLoseCase};

function NotFound() {
  return <div className="pp-page pp-missing" lang="en" data-nav-tone="light">
    <h1 className="pp-for-title">This page doesn’t exist.</h1>
    <p className="pp-hero-sub">The address may be mistyped, or the case may have moved.</p>
    <p className="pp-missing-link"><Go to={PRODUCT_HOME}>See all product work</Go></p>
  </div>;
}

/** Product pages, the same in the full site (inside its page viewport) and in the standalone product entry.
    English only for now: the root carries lang="en" whatever the site language is. */
export default function ProductRoute({page, reduced = false, onNavigate}) {
  const Case = page?.type === 'product-case' ? CASES[page.item.slug] : null;
  // a moved address is on its way to Systems (ProductShell replaces the location); show nothing meanwhile
  if (page?.type === 'moved') return null;
  return <NavigateContext.Provider value={onNavigate}>
    {page?.type === 'product' ? <ProductIndex reduced={reduced}/>
      : Case ? <Case key={page.item.slug} item={page.item} reduced={reduced}/>
      : page?.type === 'for' ? <ForPage item={page.item}/>
      : <NotFound/>}
  </NavigateContext.Provider>;
}
