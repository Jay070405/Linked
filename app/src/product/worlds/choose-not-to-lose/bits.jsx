/* Small pieces the receipt's modules share. */

/** The one-line instruction above a module, printed like the receipt's "please" line. */
export function Ask({children}) {
  return <p className="cnr-ask" data-print=""><span className="cnr-ask-mark" aria-hidden="true">&gt;</span><span>{children}</span></p>;
}

/** The one-line takeaway that prints once you've used a module. Its space is held from the start (a hidden copy sets
    the height), so nothing below moves; screen readers hear it once, when it is inserted. */
export function Takeaway({show, instant = false, children}) {
  return <div className={`cnr-take${instant ? ' is-instant' : ''}`}>
    <p className="cnr-take-ghost" aria-hidden="true">{children}</p>
    <p className="cnr-take-text" aria-live="polite">{show ? <span>{children}</span> : null}</p>
  </div>;
}

/** A receipt line: label, a dotted leader, the amount at the right edge. */
export function Leader({label, children, className = '', print = true}) {
  return <p className={`cnr-leader ${className}`} data-print={print ? '' : undefined}>
    <span className="cnr-leader-l">{label}</span><span className="cnr-leader-dots" aria-hidden="true"/><span className="cnr-leader-r">{children}</span>
  </p>;
}

/** The dashed rule between groups of lines. */
export const Rule = ({double = false}) => <hr className={`cnr-rule${double ? ' is-double' : ''}`} aria-hidden="true"/>;

/** Whole dollars, US style. */
export const usd = cents => `$${Math.round(cents / 100).toLocaleString('en-US')}`;
