import {useCallback, useEffect, useRef} from 'react';
import './dot-transition.css';
import {createDotTransition} from './dot-transition';

// The page change of the whole site: the home machine's dots (see dot-transition.js). Same hook shape as the circular
// transition it replaced, so routing code calls run(action) exactly as before.
export function useDotTransition(reduced) {
  const layer = useRef(null), controller = useRef(null), quiet = useRef(reduced); quiet.current = reduced;
  useEffect(() => {
    controller.current = createDotTransition(layer.current, () => quiet.current);
    return () => { controller.current.dispose(); controller.current = null; };
  }, []);
  const run = useCallback(action => controller.current?.run(action), []);
  return {run, layer};
}

export default function DotTransition({layer, lang}) {
  return <div ref={layer} className="dot-transition" tabIndex={-1} aria-label={lang === 'en' ? 'Changing page' : '正在切换页面'}
    onKeyDown={event => { if (['Tab', ' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault(); }}><canvas aria-hidden="true"/></div>;
}
