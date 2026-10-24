import {useRef} from 'react';
import {useCaseLang} from '../../i18n';
import {useOrbit} from './useOrbit';
import {OBJECT} from './content';

export default function Turntable({reduced}) {
  const {t, lang} = useCaseLang();
  const stage = useRef(null), canvas = useRef(null);
  const orbit = useOrbit('assembled', stage, canvas, {reduced});
  return <div className="ar-turn">
    <div ref={stage} className={`ar-turn-stage ar-orbit${orbit.grabbing ? ' is-grabbing' : ''}`}
      style={{'--ar': `${orbit.info?.w || 1200} / ${orbit.info?.h || 750}`}}
      role="group" aria-roledescription="two-axis viewer" tabIndex={0} aria-label={`${t(OBJECT.turnLabel)}. ${orbit.description}`}
      aria-describedby="ar-turn-hint" data-orbit="assembled" data-frame={orbit.frame.key} data-ready={orbit.ready}
      {...orbit.handlers}>
      <canvas ref={canvas} className="ar-orbit-canvas" aria-hidden="true"/>
      {!orbit.ready ? <img className="ar-orbit-poster" src={`${orbit.info?.base}/e12_a000.webp`} alt=""/> : null}
    </div>
    <p id="ar-turn-hint" className="ar-turn-hint"><span aria-hidden="true">↔ ↕</span> {lang === 'zh' ? '向任意方向拖动 · 方向键旋转 · 手机上按住镜框后上下拖动' : 'Drag in any direction · Arrow keys rotate · On touch, hold the frame before tilting'}</p>
    {orbit.error ? <p role="status" className="ar-note">{lang === 'zh' ? '视图暂时无法加载，请再次旋转重试。' : 'This view could not load. Rotate again to retry.'}</p> : null}
  </div>;
}
