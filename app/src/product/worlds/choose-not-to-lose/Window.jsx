/** A plain desktop window for prototype captures and the live prototype, square like the Carbon UI inside it. The
    address names the concept, never a real product's domain. */
export function Window({children, label, address = 'Choose Not to Lose, concept prototype: fictional plans', ratio = '1440 / 900', small = false, className = ''}) {
  return <div className={`cnr-win${small ? ' is-small' : ''}${className ? ` ${className}` : ''}`} role={label ? 'group' : undefined} aria-label={label}>
    <div className="cnr-win-bar" aria-hidden="true"><i/><i/><i/><span>{address}</span></div>
    <div className="cnr-win-screen" style={{aspectRatio: ratio}}>{children}</div>
  </div>;
}
