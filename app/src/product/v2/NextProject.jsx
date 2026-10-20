import {Go} from '../Go';
import {PRODUCT_HOME} from '../content';
import {ArrowRight} from './icons';
import {localize, UI, useCaseLang} from '../i18n';

/** The next case as one large link: its picture scales a little inside its frame on hover, and the site's circular
    transition carries you into it. */
export default function NextProject({item: source, image, visual}) {
  const {lang, t} = useCaseLang();
  const item = localize(source, lang);
  return <nav className="v2-next" aria-label={t(UI.nextProject)}>
    <Go to={`${PRODUCT_HOME}/${item.slug}`} className="v2-next-link" data-cursor={t(UI.view)}>
      <span className="v2-next-text">
        <span className="v2-next-label">{t(UI.nextProject)}</span>
        <span className="v2-next-title"><span className="v2-underline">{item.title}</span></span>
        <span className="v2-next-sub">{item.subtitle || item.summary}</span>
        <span className="v2-next-go" aria-hidden="true"><ArrowRight width={20} height={20}/></span>
      </span>
      {visual ? <span className="v2-next-media is-art" aria-hidden="true"><span className="v2-next-art">{visual}</span></span>
        : image ? <span className="v2-next-media"><img src={image.src} width={image.width} height={image.height} alt="" loading="lazy" decoding="async"/></span> : null}
    </Go>
  </nav>;
}
