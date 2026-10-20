import {useState} from 'react';
import {FINE, PHONE, useMedia} from './motion';
import {zoomable} from './zoom';
import {useCaseLang} from '../../../i18n';

/** "Explorations → choice" as a horizontal gallery. On desktop one card is open at a time: pointing at a card or
    focusing it opens it (a click pins it on touch screens), the others narrow to a slice of their picture. Each card
    shows the choice and a one-line verdict; opened, it adds what I tried first and what I chose. On phones the cards
    become a swipe gallery with everything visible. */
export default function Decisions({id, heading, lede, items}) {
  const {zh, lang} = useCaseLang();
  const phone = useMedia(PHONE), fine = useMedia(FINE);
  const [open, setOpen] = useState(0);
  // cards opened from the keyboard change instantly; pointing animates
  const [keys, setKeys] = useState(false);
  return <section id={id} className="atw-decisions" aria-labelledby={`${id}-title`}>
    <div className="atw-section-head" data-reveal="">
      <h2 id={`${id}-title`} className="atw-h2">{heading}</h2>
      {lede ? <p className="atw-lede">{lede}</p> : null}
    </div>
    <ul className={`atw-cards${phone ? ' is-swipe' : ''}${keys ? ' is-keyed' : ''}`} data-reveal=""
      onKeyDown={() => setKeys(true)} onPointerMove={keys ? () => setKeys(false) : undefined} tabIndex={phone ? 0 : undefined} aria-label={phone ? (zh ? `${heading}，左右滑动` : `${heading}, swipe sideways`) : undefined}>
      {items.map((item, i) => {
        const isOpen = phone || open === i;
        return <li key={item.id} className={`atw-card${isOpen ? ' is-open' : ''}`}
          onPointerEnter={fine && !phone ? () => setOpen(i) : undefined}>
          {item.visual?.type === 'img'
            // a screenshot opens in the figure viewer (only from an open card, so closed cards stay one tab stop)
            ? <div className="atw-card-visual" {...zoomable(item.title, {src: item.visual.props.src, lang})} tabIndex={isOpen ? 0 : -1}>{item.visual}</div>
            : <div className="atw-card-visual" aria-hidden="true">{item.visual}</div>}
          <div className="atw-card-text">
            {phone ? <h3 className="atw-card-title">{item.title}</h3>
              : <h3 className="atw-card-title"><button type="button" aria-expanded={isOpen} aria-controls={`${id}-${item.id}`}
                  onClick={() => setOpen(i)} onFocus={() => setOpen(i)}>{item.title}</button></h3>}
            <div id={`${id}-${item.id}`} className="atw-card-more" inert={isOpen ? undefined : true}>
              <div className="atw-card-more-inner">
                <p className="atw-card-verdict">{item.verdict}</p>
                <dl className="atw-card-dl">
                  <div><dt>{zh ? '试过' : 'Tried'}</dt><dd>{item.tried}</dd></div>
                  <div><dt>{zh ? '选择' : 'Chose'}</dt><dd>{item.chose}</dd></div>
                </dl>
              </div>
            </div>
          </div>
        </li>;
      })}
    </ul>
  </section>;
}
