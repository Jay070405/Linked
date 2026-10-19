import {Go, NavigateContext} from './Go';
import ProductIndex from './ProductIndex';
import ForPage from './ForPage';
import DesignToCodeCase from './cases/DesignToCodeCase';
import RocoCase from './cases/RocoCase';
import PlayersBreakCase from './cases/PlayersBreakCase';
import {PRODUCT_HOME} from './content';
import './product.css';

const CASES = {'design-to-code': DesignToCodeCase, roco: RocoCase, 'where-players-break': PlayersBreakCase};

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
  return <NavigateContext.Provider value={onNavigate}>
    {page?.type === 'product' ? <ProductIndex reduced={reduced}/>
      : Case ? <Case key={page.item.slug} item={page.item} reduced={reduced}/>
      : page?.type === 'for' ? <ForPage item={page.item}/>
      : <NotFound/>}
  </NavigateContext.Provider>;
}
