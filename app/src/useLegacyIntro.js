import { useCallback, useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const clamp = value => Math.max(0, Math.min(1, value));
const mix = (a, b, p) => a + (b - a) * p;
const smooth = (a, b, value) => {
  const p = clamp((value - a) / (b - a));
  return p * p * (3 - 2 * p);
};

// Canonical V13 progress is deliberately independent of the later page sections.
// 0–.773 reproduces the original opening and complete film; only its exit is new.
export const LEGACY_INTRO_TIMING = Object.freeze({
  videoStart: .158, videoEnd: .773, lastFrame: 15.02,
  shrinkStart: .84, shrinkEnd: .935, handoffStart: .955, handoffEnd: 1,
});

export default function useLegacyIntro({ rootRef, videoRef, progressRef, reduced }) {
  const actions = useRef({});
  const [touring, setTouring] = useState(false);
  const toggleTour = useCallback(() => actions.current.toggle?.(), []);

  useEffect(() => {
    const root = rootRef.current, video = videoRef.current;
    if (!root || !video) return undefined;
    let disposed = false, tween, tourTween, touringNow = false, resizeFrame = 0, letterReset = 0;
    const q = selector => root.querySelector(selector);
    const stage = q('.intro-stage'), room = q('.office-camera'), roomWrap = q('.legacy-office-wrap');
    const film = q('.film-window'), after = q('.after-video'), blackout = q('.legacy-blackout');
    const glint = q('.legacy-screen-glint'), shade = q('.legacy-film-shade');
    const foot = q('.legacy-film-foot'), pointer = q('.legacy-pointer');
    const letters = [...root.querySelectorAll('.legacy-letter')];
    const marqueeTracks = [...root.querySelectorAll('.legacy-marquee-track')];
    let marqueeVisible = true;
    const updateMarqueePlayback = () => {
      after.dataset.running = clock.p >= .825 && clock.p < 1 && marqueeVisible && !(document.hidden || document.body.classList.contains('portfolio-route-open')) ? 'true' : 'false';
    };
    function measureMarquees() {
      for (const track of marqueeTracks) {
        const unit = track.firstElementChild;
        const unitWidth = unit?.getBoundingClientRect().width || 0;
        if (!unitWidth) continue;
        const speed = track.closest('.legacy-marquee-reverse') ? 16 : 22;
        const duration = unitWidth / speed * 1000;
        if (Math.abs(Number(track.dataset.durationMs || 0) - duration) < .05) continue;
        const oldAnimation = track.getAnimations?.().find(animation => animation.animationName === 'legacy-marquee');
        const oldDuration = oldAnimation?.effect?.getTiming().duration;
        const oldTime = oldAnimation?.currentTime;
        track.style.setProperty('--legacy-marquee-duration', `${duration}ms`);
        track.dataset.durationMs = String(duration);
        track.dataset.speedPx = String(speed);
        // Preserve the running/paused phase when a loaded font or new viewport
        // changes the measured repeat width. The outer scroll transform remains
        // independent; only this inner CSS animation advances horizontally.
        const animation = track.getAnimations?.().find(value => value.animationName === 'legacy-marquee');
        if (animation && typeof oldTime === 'number' && typeof oldDuration === 'number' && oldDuration > 0) {
          animation.currentTime = oldTime / oldDuration * duration;
        }
      }
    }
    const windows = [
      ['.office-copy', -.2, -.1, .026, .095, 22],
      ['.film-creative', .148, .19, .265, .335, 90],
      ['.film-believe', .30, .343, .387, .437, 75],
      ['.film-intro', .403, .445, .477, .52, 55],
      ['.film-skills', .497, .54, .59, .637, 75],
      ['.film-timeline', .602, .643, .676, .719, 55],
      ['.film-final', .69, .735, .778, .828, 35],
    ].map(([selector, ...timing]) => ({ element: q(selector), timing }));
    let width = innerWidth, height = innerHeight, roomWidth = 0, roomHeight = 0, seekTarget = 0;
    const clock = { p: 0 };
    const alpha = (element, value) => {
      element.style.opacity = String(value);
      element.style.visibility = value > .002 ? 'visible' : 'hidden';
    };
    const seek = () => {
      if (disposed || video.readyState < 2 || video.seeking) return;
      const target = Math.min(seekTarget, Math.max(0, (video.duration || 15.072) - .03));
      if (Math.abs(video.currentTime - target) > .022) video.currentTime = target;
    };
    function render(p) {
      if (disposed) return;
      progressRef.current = p;
      root.dataset.introProgress = p.toFixed(4);
      const tone = p > .875 ? 'light' : 'dark';
      if (root.dataset.navTone !== tone) root.dataset.navTone = tone;
      if (stage.dataset.navTone !== tone) stage.dataset.navTone = tone;
      document.body.classList.toggle('past-office', p > .178);
      const zoom = smooth(0, .141, p);
      const realOffice = root.dataset.officeRenderer === '3d';
      room.style.transform = realOffice ? 'none' : `translate(${-roomWidth * .042 * zoom}px,${roomHeight * .032 * zoom}px) scale(${Math.pow(6.5, zoom)})`;
      root.dispatchEvent(new Event('office:progress'));
      alpha(roomWrap, 1 - smooth(.133, .158, p));
      glint.style.opacity = String(smooth(.065, .14, p) * .7);
      blackout.style.opacity = String((smooth(.116, .14, p) - smooth(.147, .178, p)) * .97);
      const videoP = clamp((p - .158) / (.773 - .158));
      seekTarget = videoP * 15.02;
      seek();
      shade.style.opacity = String(mix(.55, .85, smooth(.25, .7, p)) * (1 - smooth(.79, .85, p)));
      for (const { element, timing: [a, b, c, d, shift] } of windows) {
        const enter = smooth(a, b, p), exit = smooth(c, d, p);
        alpha(element, enter * (1 - exit));
        element.style.transform = `translateY(${(1 - enter) * shift - exit * shift}px)`;
      }
      q('.film-creative').style.transform = `translateY(${(1 - smooth(.148, .19, p)) * 80 - smooth(.245, .335, p) * height * .57}px)`;
      q('.film-believe').style.transform = `translateY(${(1 - smooth(.30, .343, p)) * 75 - smooth(.387, .437, p) * height * .24}px)`;

      // This is the same video element, frozen on its actual last frame. Its
      // frame changes continuously; there is no second poster or crossfade.
      const shrink = smooth(.84, .935, p), leave = smooth(.955, 1, p);
      const finalWidth = width * (width < 700 ? .82 : .47);
      film.style.width = `${mix(width, finalWidth, shrink)}px`;
      film.style.height = `${mix(height, finalWidth * 9 / 16, shrink)}px`;
      film.style.transform = `translate(-50%,calc(-50% - ${leave * height * .92}px))`;
      alpha(film, 1);
      alpha(after, smooth(.825, .86, p));
      after.style.transform = `translateY(${-leave * height * .7}px)`;
      updateMarqueePlayback();
      q('.legacy-film-progress i').style.transform = `scaleX(${p})`;
      q('.legacy-chapter').textContent = p < .15 ? '00 / OUTSIDE' : p < .35 ? '01 / ENTER THE WORLD' : p < .69 ? '02 / A LITTLE MAGIC' : p < .84 ? '03 / CRAFT & VISION' : '04 / INTO THE WORK';
      foot.style.color = p > .875 ? '#1a1a1a' : '#fffdf4';
      alpha(foot, 1 - smooth(.955, 1, p));
      const marqueeReady = smooth(.88, .935, p);
      q('.legacy-center-caption').style.opacity = String(marqueeReady);
    }
    function measure() {
      width = innerWidth; height = innerHeight;
      roomWidth = Math.max(width, height * 1.6014); roomHeight = roomWidth / 1.6014;
      room.style.width = `${roomWidth}px`; room.style.height = `${roomHeight}px`;
      room.style.marginLeft = `${-roomWidth / 2}px`; room.style.marginTop = `${-roomHeight / 2}px`;
      measureMarquees();
      if (!reduced) render(clock.p);
    }
    function stopTour() {
      tourTween?.kill(); tourTween = undefined;
      if (touringNow) { touringNow = false; if (!disposed) setTouring(false); }
    }
    if (reduced) {
      progressRef.current = 0;
      document.body.classList.remove('past-office');
      root.dataset.navTone = 'dark'; stage.dataset.navTone = 'dark';
      actions.current = {};
      video.pause();
      if (video.readyState >= 2) video.currentTime = 0;
      return () => { disposed = true; actions.current = {}; };
    }
    gsap.registerPlugin(ScrollTrigger);
    measure();
    video.pause();
    video.addEventListener('loadeddata', seek);
    video.addEventListener('seeked', seek);
    tween = gsap.fromTo(clock, { p: 0 }, {
      p: 1, ease: 'none',
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
      pointer.style.opacity = clock.p < .84 ? '1' : '0';
      pointer.style.transform = `translate(${event.clientX - bounds.left}px,${event.clientY - bounds.top}px)`;
      pointer.dataset.over = event.target instanceof Element && event.target.closest('a,button') ? 'true' : 'false';
      const word = event.target instanceof Element ? event.target.closest('.legacy-reactive') : null;
      if (word && root.contains(word)) {
        for (const letter of word.querySelectorAll('.legacy-letter')) {
          const rect = letter.getBoundingClientRect(), dx = rect.left + rect.width / 2 - event.clientX;
          const reach = Math.max(0, 1 - Math.hypot(dx, rect.top + rect.height / 2 - event.clientY) / 130);
          gsap.to(letter, { y: -reach * 13, rotation: dx * .035 * reach, color: reach > .6 ? '#e7f2b9' : '#fffdf4', duration: .4, overwrite: true });
        }
      }
      clearTimeout(letterReset);
      letterReset = setTimeout(() => gsap.to(letters, { y: 0, rotation: 0, color: '#fffdf4', duration: .7, overwrite: true }), 240);
    }
    function leave() { pointer.style.opacity = '0'; }
    function key(event) { if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', 'Escape', ' '].includes(event.key)) stopTour(); }
    function visibility() { if ((document.hidden || document.body.classList.contains('portfolio-route-open'))) stopTour(); updateMarqueePlayback(); }
    function jump() {
      stopTour();
      const progress = clamp((scrollY - root.offsetTop) / Math.max(1, root.offsetHeight - height));
      ScrollTrigger.update();
      tween?.scrollTrigger?.getTween()?.progress(1);
      tween?.progress(progress);
      render(progress);
    }
    actions.current = { toggle() {
      if (touringNow) { stopTour(); return; }
      const end = root.offsetTop + root.offsetHeight - height;
      if (scrollY >= end - 2) return;
      const tourClock = { y: scrollY };
      touringNow = true; setTouring(true);
      tourTween = gsap.to(tourClock, { y: end, duration: Math.max(4, (end - scrollY) / (root.offsetHeight - height) * 36), ease: 'none', onUpdate: () => window.scrollTo(0, tourClock.y), onComplete: stopTour });
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
    const marqueeObserver = new IntersectionObserver(entries => { marqueeVisible = entries[0].isIntersecting; updateMarqueePlayback(); });
    marqueeObserver.observe(after);
    const repeatObserver = new ResizeObserver(measureMarquees);
    marqueeTracks.forEach(track => { if (track.firstElementChild) repeatObserver.observe(track.firstElementChild); });
    document.fonts?.addEventListener('loadingdone', resize);
    document.fonts?.ready.then(() => { if (!disposed) resize(); });
    return () => {
      stopTour(); disposed = true; actions.current = {};
      tween?.scrollTrigger?.kill(); tween?.kill();
      gsap.killTweensOf(roomWrap); gsap.killTweensOf(letters);
      cancelAnimationFrame(resizeFrame); clearTimeout(letterReset);
      marqueeObserver.disconnect(); repeatObserver.disconnect();
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
      video.removeEventListener('loadeddata', seek); video.removeEventListener('seeked', seek);
    };
  }, [rootRef, videoRef, progressRef, reduced]);
  return { touring, toggleTour };
}
