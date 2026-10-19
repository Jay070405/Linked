import {useLayoutEffect, useRef} from 'react';
import {gsap, ScrollTrigger, scrollerOf} from './motion';

const format = (v, decimals) => v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});

/** Three labeled numbers that count up once when they scroll into view (900 ms, ease-out, tabular figures).
    Screen readers get the final value straight away; the counting digits are hidden from them. */
export default function NumberStrip({items, reduced = false, label = 'Key numbers'}) {
  const root = useRef(null);
  useLayoutEffect(() => {
    const node = root.current;
    if (!node || reduced) return undefined;
    const ctx = gsap.context(() => {
      node.querySelectorAll('[data-count]').forEach(el => {
        const to = Number(el.dataset.count), decimals = Number(el.dataset.decimals || 0), box = {v: 0};
        el.textContent = format(0, decimals);
        ScrollTrigger.create({
          trigger: el, scroller: scrollerOf(node), start: 'top 88%', once: true,
          onEnter: () => gsap.to(box, {v: to, duration: .9, ease: 'v2out', onUpdate: () => { el.textContent = format(box.v, decimals); }}),
        });
      });
    }, node);
    return () => {
      ctx.revert();
      node.querySelectorAll('[data-count]').forEach(el => { el.textContent = format(Number(el.dataset.count), Number(el.dataset.decimals || 0)); });
    };
  }, [reduced, items]);
  return <section ref={root} className="v2-numbers" aria-label={label}>
    <dl>{items.map(item => <div key={item.label} className="v2-number" data-reveal="">
      <dt className="v2-number-label">{item.label}</dt>
      <dd className="v2-number-value">
        <span className="v2-sr">{item.prefix}{format(item.value, item.decimals || 0)}{item.unit ? ` ${item.unit}` : ''}</span>
        <span aria-hidden="true">{item.prefix}<span data-count={item.value} data-decimals={item.decimals || 0}>{format(item.value, item.decimals || 0)}</span>{item.unit ? <small>{item.unit}</small> : null}</span>
      </dd>
      {item.note ? <dd className="v2-number-note">{item.note}</dd> : null}
    </div>)}</dl>
  </section>;
}
