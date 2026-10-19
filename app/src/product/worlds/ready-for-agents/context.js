import {createContext, useContext, useEffect, useState} from 'react';
import {scrollRootOf} from '../../v2/motion';

/** What every frame may want to know: the mode ('canvas' | 'stack' | 'plain'), which frame the camera has come to
    rest on, the camera itself (null outside the canvas) and how to fly to a frame. */
export const WorldCtx = createContext({mode: 'stack', arrived: null, camera: null, go: () => {}});
export const useWorld = () => useContext(WorldCtx);

/** True from the first time a frame is reached: the camera settles on it (canvas), or it is mostly on screen (stack
    and plain). */
export function useArrive(id, ref) {
  const {mode, arrived} = useWorld();
  const [hit, setHit] = useState(false);
  useEffect(() => { if (mode === 'canvas' && arrived === id) setHit(true); }, [mode, arrived, id]);
  useEffect(() => {
    if (mode === 'canvas' || hit) return undefined;
    const el = ref.current;
    if (!el || typeof IntersectionObserver !== 'function') { setHit(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHit(true); io.disconnect(); } }, {root: scrollRootOf(el), threshold: .35});
    io.observe(el);
    return () => io.disconnect();
  }, [mode, hit, ref]);
  return hit;
}
