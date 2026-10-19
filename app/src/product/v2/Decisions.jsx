import {useState} from 'react';
import {FINE, PHONE, useMedia} from './motion';
import {zoomable} from './zoom';

/** "Explorations → choice" as a horizontal gallery. On desktop one card is open at a time: pointing at a card or
    focusing it opens it (a click pins it on touch screens), the others narrow to a slice of their picture. Each card
    shows the choice and a one-line verdict; opened, it adds what I tried first and what I chose. On phones the cards
    become a swipe gallery with everything visible. */
export default function Decisions({id, heading, lede, items}) {
  const phone = useMedia(PHONE), fine = useMedia(FINE);
  const [open, setOpen] = useState(0);
  // cards opened from the keyboard change instantly; pointing animates
  const [keys, setKeys] = useState(false);
  return <section id={id} className="v2-decisions" aria-labelledby={`${id}-title`}>
    <div className="v2-section-head" data-reveal="">
      <h2 id={`${id}-title`} className="v2-h2">{heading}</h2>
      {lede ? <p className="v2-lede">{lede}</p> : null}
    </div>
    <ul className={`v2-cards${phone ? ' is-swipe' : ''}${keys ? ' is-keyed' : ''}`} data-reveal=""
      onKeyDown={() => setKeys(true)} onPointerMove={keys ? () => setKeys(false) : undefined} tabIndex={phone ? 0 : undefined} aria-label={phone ? `${heading}, swipe sideways` : undefined}>
      {items.map((item, i) => {
        const isOpen = phone || open === i;
        return <li key={item.id} className={`v2-card${isOpen ? ' is-open' : ''}`}
          onPointerEnter={fine && !phone ? () => setOpen(i) : undefined}>
          {item.visual?.type === 'img'
            // a screenshot opens in the figure viewer (only from an open card, so closed cards stay one tab stop)
            ? <div className="v2-card-visual" {...zoomable(item.title, {src: item.visual.props.src})} tabIndex={isOpen ? 0 : -1}>{item.visual}</div>
            : <div className="v2-card-visual" aria-hidden="true">{item.visual}</div>}
          <div className="v2-card-text">
            {phone ? <h3 className="v2-card-title">{item.title}</h3>
              : <h3 className="v2-card-title"><button type="button" aria-expanded={isOpen} aria-controls={`${id}-${item.id}`}
                  onClick={() => setOpen(i)} onFocus={() => setOpen(i)}>{item.title}</button></h3>}
            <div id={`${id}-${item.id}`} className="v2-card-more" inert={isOpen ? undefined : true}>
              <div className="v2-card-more-inner">
                <p className="v2-card-verdict">{item.verdict}</p>
                <dl className="v2-card-dl">
                  <div><dt>Tried</dt><dd>{item.tried}</dd></div>
                  <div><dt>Chose</dt><dd>{item.chose}</dd></div>
                </dl>
              </div>
            </div>
          </div>
        </li>;
      })}
    </ul>
  </section>;
}
