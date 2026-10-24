/** One physical press, regardless of pointer/key repeats. Cancellation never takes a photo. */
export function controlPress({begin, tap, hold, release}, delay = 500) {
  let active = false, held = false, timer;
  const finish = cancelled => {
    if (!active) return;
    clearTimeout(timer);
    active = false;
    release?.();
    if (!cancelled && !held) tap?.();
  };
  return {
    start() {
      if (active) return;
      active = true; held = false;
      begin?.();
      timer = setTimeout(() => { held = true; hold?.(); }, delay);
    },
    end: () => finish(false),
    cancel: () => finish(true),
  };
}
