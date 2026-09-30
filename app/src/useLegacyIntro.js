import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = (a, b, value) => {
  const p = clamp((value - a) / (b - a));
  return p * p * (3 - 2 * p);
};

// Canonical V13 progress. The office, its dolly into the monitor and the screen going dark are unchanged and keep their
// original scroll distances; the section now ends at OFFICE_END, where the screen is fully dark and the homepage journey
// (onestroke/) switches it on. The section's height in CSS is 100vh plus OFFICE_END of the original 850vh of travel.
export const OFFICE_END = .145;

export default function useLegacyIntro({ rootRef, progressRef, reduced }) {
  const actions = useRef({});
  const [touring, setTouring] = useState(false);
  const chapter = '00 / OUTSIDE';
  const toggleTour = useCallback(() => actions.current.toggle?.(), []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    let disposed = false, tween, tourTween, touringNow = false, resizeFrame = 0;
    const q = selector => root.querySelector(selector);
    const stage = q('.intro-stage'), room = q('.office-camera'), roomWrap = q('.legacy-office-wrap');
    const blackout = q('.legacy-blackout'), glint = q('.legacy-screen-glint');
    const foot = q('.legacy-film-foot'), pointer = q('.legacy-pointer'), officeCopy = q('.office-copy');
    let width = innerWidth, height = innerHeight, roomWidth = 0, roomHeight = 0;
    const clock = { p: 0 };
    const alpha = (element, value) => {
      element.style.opacity = String(value);
      element.style.visibility = value > .002 ? 'visible' : 'hidden';
    };
    function render(p) {
      if (disposed) return;
      progressRef.current = p;
      root.dataset.introProgress = p.toFixed(4);
      if (root.dataset.navTone !== 'dark') root.dataset.navTone = 'dark';
      if (stage.dataset.navTone !== 'dark') stage.dataset.navTone = 'dark';
      const zoom = smooth(0, .141, p);
      const realOffice = root.dataset.officeRenderer === '3d';
      room.style.transform = realOffice ? 'none' : `translate(${-roomWidth * .042 * zoom}px,${roomHeight * .032 * zoom}px) scale(${Math.pow(6.5, zoom)})`;
      root.dispatchEvent(new Event('office:progress'));
      alpha(roomWrap, 1 - smooth(.133, .158, p));
      glint.style.opacity = String(smooth(.065, .14, p) * .7);
      blackout.style.opacity = String(smooth(.116, .14, p) * .97 + smooth(.14, OFFICE_END, p) * .03);   // fully dark at the hand-over
      const enter = smooth(-.2, -.1, p), exit = smooth(.026, .095, p);
      alpha(officeCopy, enter * (1 - exit));
      officeCopy.style.transform = `translateY(${(1 - enter) * 22 - exit * 22}px)`;
      q('.legacy-film-progress i').style.transform = `scaleX(${clamp(p / OFFICE_END)})`;
      foot.style.color = '#fffdf4';
      alpha(foot, 1 - smooth(.12, OFFICE_END, p));
    }
    function measure() {
      width = innerWidth; height = innerHeight;
      roomWidth = Math.max(width, height * 1.6014); roomHeight = roomWidth / 1.6014;
      room.style.width = `${roomWidth}px`; room.style.height = `${roomHeight}px`;
      room.style.marginLeft = `${-roomWidth / 2}px`; room.style.marginTop = `${-roomHeight / 2}px`;
      if (!reduced) render(clock.p);
    }
    function stopTour() {
      tourTween?.kill(); tourTween = undefined;
      if (touringNow) { touringNow = false; if (!disposed) setTouring(false); }
    }
    if (reduced) {
      progressRef.current = 0;
      root.dataset.navTone = 'dark'; stage.dataset.navTone = 'dark';
      actions.current = {};
      return () => { disposed = true; actions.current = {}; };
    }
    gsap.registerPlugin(ScrollTrigger);
    measure();
    tween = gsap.fromTo(clock, { p: 0 }, {
      p: OFFICE_END, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top top', end: 'bottom bottom', scrub: .65, invalidateOnRefresh: true, onRefresh: measure },
      onUpdate: () => render(clock.p),
    });
    function resize() {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => { measure(); ScrollTrigger.refresh(); });
    }
    function move(event) {
      if ((document.hidden || document.body.classList.contains('portfolio-route-open')) || event.pointerType === 'touch') return;
      const bounds = stage.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= innerHeight) return;
      const x = event.clientX / width, y = event.clientY / height;
      if (clock.p < .165 && root.dataset.officeRenderer !== '3d') gsap.to(roomWrap, { x: (x - .5) * 8, y: (y - .5) * 5, scale: 1.013, duration: .2, overwrite: true });
      pointer.style.opacity = clock.p < .13 ? '1' : '0';
      pointer.style.transform = `translate(${event.clientX - bounds.left}px,${event.clientY - bounds.top}px)`;
      pointer.dataset.over = event.target instanceof Element && event.target.closest('a,button') ? 'true' : 'false';
    }
    function leave() { pointer.style.opacity = '0'; }
    function key(event) { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Escape', ' '].includes(event.key)) stopTour(); }
    function visibility() { if ((document.hidden || document.body.classList.contains('portfolio-route-open'))) stopTour(); }
    function jump() {
      stopTour();
      const progress = clamp((scrollY - root.offsetTop) / Math.max(1, root.offsetHeight - height));
      ScrollTrigger.update();
      tween?.scrollTrigger?.getTween()?.progress(1);
      tween?.progress(progress);
      render(progress * OFFICE_END);
    }
    // the guided tour now walks the whole homepage: through the screen and on, a steady few seconds a screen
    actions.current = { toggle() {
      if (touringNow) { stopTour(); return; }
      const end = document.documentElement.scrollHeight - height;
      if (scrollY >= end - 2) return;
      const tourClock = { y: scrollY };
      touringNow = true; setTouring(true);
      tourTween = gsap.to(tourClock, { y: end, duration: Math.max(4, (end - scrollY) / height * 2.6), ease: 'none', onUpdate: () => window.scrollTo(0, tourClock.y), onComplete: stopTour });
    } };
    window.addEventListener('resize', resize);
    root.addEventListener('office:mode', measure);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('wheel', stopTour, { passive: true });
    window.addEventListener('touchstart', stopTour, { passive: true });
    window.addEventListener('keydown', key);
    window.addEventListener('journey:jump', jump);
    document.documentElement.addEventListener('pointerleave', leave);
    document.addEventListener('visibilitychange', visibility);
    document.fonts?.addEventListener('loadingdone', resize);
    document.fonts?.ready.then(() => { if (!disposed) resize(); });
    return () => {
      stopTour(); disposed = true; actions.current = {};
      tween?.scrollTrigger?.kill(); tween?.kill();
      gsap.killTweensOf(roomWrap);
      cancelAnimationFrame(resizeFrame);
      document.fonts?.removeEventListener('loadingdone', resize);
      window.removeEventListener('resize', resize);
      root.removeEventListener('office:mode', measure);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('wheel', stopTour);
      window.removeEventListener('touchstart', stopTour);
      window.removeEventListener('keydown', key);
      window.removeEventListener('journey:jump', jump);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [rootRef, progressRef, reduced]);
  return { touring, toggleTour, chapter };
}
