import {L, useCaseLang} from '../../i18n';

const ADDRESS = L('Choose Not to Lose, concept prototype: fictional plans', 'Choose Not to Lose 概念原型：虚构方案');

/** A plain desktop window for prototype captures and the live prototype, square like the Carbon UI inside it. The
    address names the concept, never a real product's domain. */
export function Window({children, label, address, ratio = '1440 / 900', small = false, className = ''}) {
  const {t} = useCaseLang();
  return <div className={`cnr-win${small ? ' is-small' : ''}${className ? ` ${className}` : ''}`} role={label ? 'group' : undefined} aria-label={label}>
    <div className="cnr-win-bar" aria-hidden="true"><i/><i/><i/><span>{t(address || ADDRESS)}</span></div>
    <div className="cnr-win-screen" style={{aspectRatio: ratio}}>{children}</div>
  </div>;
}
