import {useCaseLang} from '../../i18n';
import {Ev} from '../../CaseKit';

export default function PartSpecs({part}) {
  const {t} = useCaseLang();
  return <span className="ar-xp-num">
    <span>{t(part.size)}{part.sizeUnit === false ? '' : ' mm'} <Ev label={part.sizeEv === 'S' ? 'Sourced' : 'Estimated'}/></span>
    <span>{t(part.mass)}{part.massUnit === false ? '' : ' g'} <Ev label="Estimated"/></span>
  </span>;
}
