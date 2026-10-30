import {Go, NavigateContext} from './Go';
import ProductIndex from './ProductIndex';
import ForPage from './ForPage';
import DesignToCodeCase from './cases/DesignToCodeCase';
import AtelierCase from './worlds/atelier/AtelierWorld';
import ReadyForAgentsCase from './worlds/ready-for-agents/ReadyForAgentsWorld';
import ChooseNotToLoseCase from './worlds/choose-not-to-lose/ChooseNotToLoseWorld';
import LastHundredFeetCase from './worlds/last-100-feet/LastHundredFeetWorld';
import ArdenCase from './worlds/arden/ArdenWorld';
import HakoCase from './worlds/hako/HakoWorld';
import {PRODUCT_HOME} from './content';
import {L, LangProvider, pageLanguage, useCaseLang} from './i18n';
import './product.css';
import AboutPage from './AboutPage';

const CASES = {'ready-for-agents': ReadyForAgentsCase, 'design-to-code': DesignToCodeCase, atelier: AtelierCase, 'last-100-feet': LastHundredFeetCase, 'choose-not-to-lose': ChooseNotToLoseCase, arden: ArdenCase, hako: HakoCase};

function NotFound() {
  const {t, htmlLang} = useCaseLang();
  return <div className="pp-page pp-missing" lang={htmlLang} data-nav-tone="light">
    <h1 className="pp-for-title">{t(L('This page doesn’t exist.', '这个页面不存在。'))}</h1>
    <p className="pp-hero-sub">{t(L('The address may be mistyped, or the case may have moved.', '可能是地址输错了，也可能是案例换了位置。'))}</p>
    <p className="pp-missing-link"><Go to={PRODUCT_HOME}>{t(L('See all product work', '查看全部产品作品'))}</Go></p>
  </div>;
}

/** Product pages, the same in the full site (inside its page viewport) and in the standalone product entry.
    `lang` is the site's language; a page follows it once it is translated (i18n.jsx, TRANSLATED), and stays English
    (its root carries lang="en") until then. */
export default function ProductRoute({page, reduced = false, onNavigate, lang = 'en'}) {
  const Case = page?.type === 'product-case' ? CASES[page.item.slug] : null;
  // a moved address is on its way to Systems (ProductShell replaces the location); show nothing meanwhile
  if (page?.type === 'moved') return null;
  return <LangProvider lang={pageLanguage(page, lang)}><NavigateContext.Provider value={onNavigate}>
    {page?.type === 'about' ? <AboutPage reduced={reduced}/> : page?.type === 'product' ? <ProductIndex reduced={reduced}/>
      : Case ? <Case key={page.item.slug} item={page.item} reduced={reduced}/>
      : page?.type === 'for' ? <ForPage item={page.item}/>
      : <NotFound/>}
  </NavigateContext.Provider></LangProvider>;
}
