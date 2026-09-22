import { useCallback, useEffect, useRef, useState } from 'react';

export const MUSIC_PREFERENCE_KEY = 'jay-background-music-v1';
export const MUSIC_VOLUME = 0.14;
export const MUSIC_VOLUME_KEY = 'jay-background-volume-v1';

function preference(storage) {
  try { return storage?.getItem(MUSIC_PREFERENCE_KEY) !== 'off'; } catch { return true; }
}

// play() is an asynchronous request, not proof of playback:
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
// Visibility changes pause playback without changing the user's preference:
// https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
export function createMusicController(audio, options = {}) {
  const doc = options.document ?? document;
  let storage = options.storage;
  if (!('storage' in options)) { try { storage = window.localStorage; } catch { storage = null; } }
  const raf = options.requestFrame ?? requestAnimationFrame;
  const caf = options.cancelFrame ?? cancelAnimationFrame;
  const now = options.now ?? (() => performance.now());
  const notify = options.onChange ?? (() => {});
  let enabled = preference(storage), status = enabled ? 'pending' : 'off';
  let volume = MUSIC_VOLUME;
  try { const saved = storage?.getItem(MUSIC_VOLUME_KEY); if (saved !== null && saved !== undefined && Number.isFinite(Number(saved))) volume = Math.max(0, Math.min(1, Number(saved))); } catch { /* Local preferences are optional. */ }
  let disposed = false, request = 0, frame = 0, pending = false, needsGesture = false;
  let context = null, gain = null, source = null;
  const emit = next => {
    status = next;
    if (!disposed) notify({ enabled, status, volume });
  };
  const cancelFade = () => { caf(frame); frame = 0; };
  const level = () => gain ? gain.gain.value : audio.volume;
  const setLevel = value => {
    const safe = Math.max(0, Math.min(1, value));
    if (gain) gain.gain.value = safe;
    else audio.volume = safe;
  };
  const fade = (target, duration, done) => {
    cancelFade();
    const start = level(), started = now();
    const tick = () => {
      if (disposed) return;
      const t = Math.min(1, (now() - started) / duration);
      setLevel(start + (target - start) * (t * t * (3 - 2 * t)));
      if (t < 1) frame = raf(tick);
      else { frame = 0; done?.(); }
    };
    frame = raf(tick);
  };
  const actualPlaying = () => !audio.paused && !audio.ended && audio.readyState >= 3 && (!context || context.state === 'running');
  const playing = () => {
    if (disposed) return;
    if (!enabled || doc.hidden) { audio.pause(); setLevel(0); return; }
    if (!actualPlaying()) return;
    needsGesture = false;
    if (status !== 'playing') { emit('playing'); fade(volume, 1200); }
  };
  const start = () => {
    if (disposed || !enabled || doc.hidden || pending) return;
    cancelFade();
    if (actualPlaying() && audio.readyState >= 3) { playing(); fade(volume, 1000); return; }
    const token = ++request;
    pending = true;
    emit('loading');
    // A small, nonzero level keeps this an honest audible autoplay request.
    // Starting muted and silently unmuting would bypass the intended policy.
    setLevel(Math.min(.012, volume));
    let playRequest, resumeRequest;
    try {
      // Both requests stay inside the trusted gesture stack when unlocking.
      // Safari uses “interrupted” after calls/screen lock, not only “suspended”.
      resumeRequest = context && ['suspended', 'interrupted'].includes(context.state) ? context.resume() : undefined;
      playRequest = audio.play();
    } catch (error) { playRequest = Promise.reject(error); }
    Promise.all([Promise.resolve(playRequest), Promise.resolve(resumeRequest)]).then(() => {
      if (disposed) return;
      if (token !== request) { if (!enabled || doc.hidden) { audio.pause(); setLevel(0); } return; }
      pending = false;
      if (!enabled || doc.hidden) { audio.pause(); return; }
      if (actualPlaying()) playing();
      else { needsGesture = true; emit('pending'); }
    }).catch(error => {
      if (disposed || token !== request) return;
      pending = false;
      cancelFade();
      audio.pause();
      setLevel(0);
      if (!enabled) { emit('off'); return; }
      if (doc.hidden) { emit('suspended'); return; }
      needsGesture = error?.name === 'NotAllowedError' || error?.name === 'AbortError';
      emit(needsGesture ? 'pending' : 'error');
    });
  };
  const stop = (hidden = false) => {
    request += 1; pending = false; needsGesture = false; cancelFade();
    if (hidden || audio.paused) {
      setLevel(0); audio.pause(); emit(enabled ? 'suspended' : 'off');
    } else {
      emit('stopping');
      fade(0, 550, () => { audio.pause(); emit(enabled ? 'suspended' : 'off'); });
    }
  };
  const visibility = () => {
    if (doc.hidden) stop(true);
    else if (enabled) start();
  };
  const unlock = event => {
    if (!event.isTrusted || !enabled || doc.hidden || !needsGesture || pending) return;
    if (event.target?.closest?.('[data-music-toggle]')) return;
    if (event.type === 'keydown' && (event.repeat || event.isComposing || ['Shift', 'Control', 'Alt', 'Meta'].includes(event.key))) return;
    start();
  };
  const paused = () => {
    if (disposed || status === 'stopping') return;
    if (!enabled) emit('off');
    else if (doc.hidden) emit('suspended');
    else if (status !== 'error' && !pending) emit('pending');
  };
  const waiting = () => { if (enabled && !doc.hidden && status !== 'stopping') emit('loading'); };
  const failed = () => {
    request += 1; pending = false; needsGesture = false; cancelFade();
    audio.pause(); setLevel(0); emit(enabled ? 'error' : 'off');
  };
  const contextState = () => {
    if (!context || disposed || !enabled || doc.hidden) return;
    if (context.state === 'running') playing();
    else { needsGesture = true; emit('pending'); }
  };
  audio.loop = true;
  audio.preload = 'metadata';
  try { audio.volume = 0.012; } catch { /* Some mobile media elements reject volume writes. */ }
  // iOS may refuse programmatic HTMLMediaElement volume. A GainNode keeps the
  // requested quiet mix there too; an unavailable quiet path never plays loud.
  if (Math.abs(audio.volume - 0.012) > 0.001) {
    try {
      const Context = options.AudioContext ?? window.AudioContext ?? window.webkitAudioContext;
      context = new Context();
      gain = context.createGain(); gain.gain.value = 0.012;
      source = context.createMediaElementSource(audio);
      source.connect(gain); gain.connect(context.destination);
      context.addEventListener('statechange', contextState);
    } catch {
      audio.pause();
      source?.disconnect(); gain?.disconnect();
      context?.close().catch(() => {});
      context = null;
      emit(enabled ? 'error' : 'off');
      return { getState: () => ({ enabled, status, volume }), setVolume() {}, toggle() { enabled = true; emit('error'); }, dispose() { disposed = true; audio.pause(); } };
    }
  }
  audio.addEventListener('playing', playing);
  audio.addEventListener('pause', paused);
  audio.addEventListener('waiting', waiting);
  audio.addEventListener('stalled', waiting);
  audio.addEventListener('error', failed);
  doc.addEventListener('visibilitychange', visibility);
  doc.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  doc.addEventListener('keydown', unlock, true);
  emit(status);
  if (enabled && !doc.hidden) start();
  else { setLevel(0); emit(enabled ? 'suspended' : 'off'); }
  return {
    getState: () => ({ enabled, status, volume }),
    setVolume(value) {
      if (!Number.isFinite(value)) return;
      volume = Math.max(0, Math.min(1, value));
      try { storage?.setItem(MUSIC_VOLUME_KEY, String(volume)); } catch { /* Playback works without storage. */ }
      if (enabled && actualPlaying() && !doc.hidden && status !== 'stopping') fade(volume, 80);
      emit(status);
    },
    toggle() {
      // WAIT means “play” when pressed, rather than silently disabling the
      // requested music. A running/loading request remains a clear off toggle.
      enabled = !enabled || ['pending', 'error', 'suspended'].includes(status);
      try { storage?.setItem(MUSIC_PREFERENCE_KEY, enabled ? 'on' : 'off'); } catch { /* Playback works without storage. */ }
      if (enabled) {
        if (audio.error) audio.load();
        if (doc.hidden) emit('suspended'); else start();
      } else stop();
    },
    dispose() {
      disposed = true; request += 1; pending = false; cancelFade();
      doc.removeEventListener('visibilitychange', visibility);
      doc.removeEventListener('pointerdown', unlock, true);
      doc.removeEventListener('keydown', unlock, true);
      audio.removeEventListener('playing', playing);
      audio.removeEventListener('pause', paused);
      audio.removeEventListener('waiting', waiting);
      audio.removeEventListener('stalled', waiting);
      audio.removeEventListener('error', failed);
      audio.pause(); setLevel(0);
      source?.disconnect(); gain?.disconnect();
      if (context) { context.removeEventListener('statechange', contextState); context.close().catch(() => {}); }
    },
  };
}

export default function useBackgroundMusic(audioRef) {
  const controller = useRef(null);
  const [state, setState] = useState({ enabled: true, status: 'pending', volume: MUSIC_VOLUME });
  useEffect(() => {
    controller.current = createMusicController(audioRef.current, { onChange: setState });
    return () => { controller.current?.dispose(); controller.current = null; };
  }, [audioRef]);
  const toggle = useCallback(() => controller.current?.toggle(), []);
  const setVolume = useCallback(value => controller.current?.setVolume(value), []);
  return { ...state, toggle, setVolume };
}
