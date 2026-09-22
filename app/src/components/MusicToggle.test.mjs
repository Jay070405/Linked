// Run: node app/src/components/MusicToggle.test.mjs (from repository root).
// Deterministic media-policy/race tests; browser UI and physical iOS playback
// are separate checks. No file, microphone, device, or network audio is played.
import assert from 'node:assert/strict';
import { createMusicController, MUSIC_PREFERENCE_KEY, MUSIC_VOLUME, MUSIC_VOLUME_KEY } from './useBackgroundMusic.js';

class DocumentDouble {
  hidden = false;
  events = new Map();
  addEventListener(type, handler) {
    if (!this.events.has(type)) this.events.set(type, new Set());
    this.events.get(type).add(handler);
  }
  removeEventListener(type, handler) { this.events.get(type)?.delete(handler); }
  emit(type, properties = {}) {
    for (const handler of this.events.get(type) || []) {
      handler({ type, isTrusted: true, target: { closest: () => null }, ...properties });
    }
  }
}

class MediaDouble extends EventTarget {
  paused = true;
  ended = false;
  readyState = 4;
  volume = 1;
  count = 0;
  currentTime = 26;
  mode = 'ok';
  play() {
    this.count += 1;
    if (this.mode === 'blocked') return Promise.reject(Object.assign(new Error('Autoplay policy'), { name: 'NotAllowedError' }));
    if (this.mode === 'error') return Promise.reject(Object.assign(new Error('Unsupported media'), { name: 'NotSupportedError' }));
    if (this.mode === 'deferred') return new Promise(resolve => {
      this.finish = () => {
        this.paused = false;
        this.readyState = 4;
        this.dispatchEvent(new Event('playing'));
        resolve();
      };
    });
    this.paused = false;
    this.dispatchEvent(new Event('playing'));
    return Promise.resolve();
  }
  pause() {
    const wasPlaying = !this.paused;
    this.paused = true;
    if (wasPlaying) this.dispatchEvent(new Event('pause'));
  }
  load() { this.error = null; }
}

class ReadonlyVolumeMedia extends MediaDouble {
  get volume() { return 1; }
  set volume(value) { /* iOS-style ignored HTML media volume assignment. */ }
  constructor() { super(); delete this.volume; }
}

class ContextDouble extends EventTarget {
  static latest;
  state = 'suspended';
  resumes = 0;
  sources = 0;
  constructor() { super(); ContextDouble.latest = this; }
  createGain() {
    this.node = { gain: { value: 0 }, connect() {}, disconnect() {} };
    return this.node;
  }
  createMediaElementSource() { this.sources += 1; return { connect() {}, disconnect() {} }; }
  resume() {
    this.resumes += 1;
    this.state = 'running';
    this.dispatchEvent(new Event('statechange'));
    return Promise.resolve();
  }
  close() { this.state = 'closed'; return Promise.resolve(); }
}

function harness(saved, media = new MediaDouble()) {
  const document = new DocumentDouble();
  const data = new Map(saved ? [[MUSIC_PREFERENCE_KEY, saved]] : []);
  const frames = new Map();
  let time = 0, id = 0;
  return {
    media, document, data, frames,
    options: {
      document,
      storage: { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) },
      requestFrame: callback => { frames.set(++id, callback); return id; },
      cancelFrame: key => frames.delete(key),
      now: () => time,
    },
    advance(ms) {
      time += ms;
      const jobs = [...frames.values()];
      frames.clear();
      jobs.forEach(callback => callback(time));
    },
  };
}
const flush = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); };
let checks = 0;
const check = (condition, message) => { assert.ok(condition, message); checks += 1; };

// Honest autoplay state; WAIT button starts instead of disabling the request.
{
  const h = harness(); h.media.mode = 'blocked';
  const controller = createMusicController(h.media, h.options);
  await flush();
  check(controller.getState().status === 'pending', 'Policy rejection displays WAIT');
  check(h.media.paused, 'Rejected playback is paused');
  h.media.mode = 'ok'; controller.toggle(); await flush(); h.advance(1300);
  check(controller.getState().status === 'playing', 'WAIT click retries and reaches playing');
  check(h.media.volume === MUSIC_VOLUME, 'Fade reaches quiet level .14');
  check(h.media.loop, 'Track loops');
  controller.toggle();
  check(controller.getState().status === 'stopping', 'Off first enters a fade-out state');
  h.advance(600);
  check(h.media.paused && controller.getState().status === 'off', 'Fade-out ends paused and off');
  const calls = h.media.count;
  h.document.emit('pointerdown'); h.document.emit('keydown', { key: 'a' });
  check(h.media.count === calls, 'Trusted incidental gestures do not re-enable off');
  check(h.data.get(MUSIC_PREFERENCE_KEY) === 'off', 'User off preference is saved');
  controller.dispose();
  check([...h.document.events.values()].every(set => set.size === 0), 'Document listeners are removed');
  check(h.frames.size === 0, 'Fade frames are cancelled on disposal');
}

// Visibility pauses without destroying preference or seeking to the beginning.
{
  const h = harness('off');
  const controller = createMusicController(h.media, h.options); await flush();
  check(h.media.count === 0 && controller.getState().status === 'off', 'Saved off prevents an autoplay request');
  controller.toggle(); await flush(); h.advance(1300);
  h.document.hidden = true; h.document.emit('visibilitychange');
  check(h.media.paused && controller.getState().status === 'suspended', 'Hidden page pauses');
  check(h.data.get(MUSIC_PREFERENCE_KEY) === 'on', 'Hidden page preserves enabled preference');
  h.document.hidden = false; h.document.emit('visibilitychange'); await flush(); h.advance(1300);
  check(!h.media.paused && controller.getState().status === 'playing', 'Visible page resumes enabled music');
  check(h.media.currentTime === 26, 'Visibility restoration retains playback position');
  controller.dispose();
  check(h.media.paused && h.frames.size === 0, 'Disposal stops playback and work');
}

// Only a trusted qualifying interaction unlocks an autoplay rejection.
{
  const h = harness(); h.media.mode = 'blocked';
  const controller = createMusicController(h.media, h.options); await flush();
  const calls = h.media.count;
  h.document.emit('pointerdown', { isTrusted: false });
  check(h.media.count === calls, 'Synthetic pointer event does not unlock');
  h.document.emit('pointerdown', { target: { closest: () => ({}) } });
  check(h.media.count === calls, 'Music button avoids duplicate global unlock');
  h.document.emit('keydown', { key: 'Shift' });
  check(h.media.count === calls, 'Modifier-only key does not unlock');
  h.media.mode = 'ok'; h.document.emit('keydown', { key: 'Tab' }); await flush();
  check(controller.getState().status === 'playing', 'Trusted ordinary key unlocks');
  controller.dispose();
}

// Cancelled play promises may resolve after the user has already turned off.
{
  const h = harness(); h.media.mode = 'deferred';
  const controller = createMusicController(h.media, h.options);
  controller.toggle(); h.media.finish(); await flush();
  check(!controller.getState().enabled, 'Late play resolution retains off preference');
  check(controller.getState().status === 'off', 'Late play resolution never reports ON');
  check(h.media.paused, 'Late playing event is actively paused');
  check(h.media.volume === 0, 'Cancelled late output is silent');
  controller.dispose();
}

// A real media error is distinct from browser policy and can be retried.
{
  const h = harness(); h.media.mode = 'error';
  const controller = createMusicController(h.media, h.options); await flush();
  check(controller.getState().status === 'error', 'Unsupported media has error status');
  h.media.mode = 'ok'; controller.toggle(); await flush();
  check(controller.getState().status === 'playing', 'Error button retries playback');
  controller.dispose();
}

// The quiet GainNode fallback covers browsers with readonly media volume.
{
  const h = harness(undefined, new ReadonlyVolumeMedia()); h.options.AudioContext = ContextDouble;
  const controller = createMusicController(h.media, h.options); await flush(); h.advance(1300);
  const context = ContextDouble.latest;
  check(controller.getState().status === 'playing', 'Running gain context can play');
  check(context.node.gain.value === MUSIC_VOLUME, 'Gain fallback reaches .14');
  check(context.sources === 1, 'One media source is connected');
  h.document.hidden = true; h.document.emit('visibilitychange');
  check(h.media.paused && context.node.gain.value === 0, 'Hidden gain output is paused and silent');
  h.document.hidden = false; h.document.emit('visibilitychange'); await flush(); h.advance(1300);
  check(h.media.currentTime === 26 && context.node.gain.value === MUSIC_VOLUME, 'Quiet fallback resumes existing position');
  controller.dispose();
  check(context.state === 'closed' && h.frames.size === 0, 'Gain context and fade work are disposed');
}

// Safari interruption recovery and no premature ON from context.statechange.
{
  const h = harness(undefined, new ReadonlyVolumeMedia());
  h.media.mode = 'deferred'; h.media.readyState = 0; h.options.AudioContext = ContextDouble;
  const controller = createMusicController(h.media, h.options);
  const context = ContextDouble.latest;
  check(controller.getState().status === 'loading', 'Running context alone cannot announce ON');
  check(h.media.readyState === 0, 'Media is genuinely still unready in this fixture');
  h.media.finish(); await flush();
  check(controller.getState().status === 'playing', 'Decoded playing media announces ON');
  h.document.hidden = true; h.document.emit('visibilitychange');
  context.state = 'interrupted'; context.dispatchEvent(new Event('statechange'));
  const resumes = context.resumes;
  h.document.hidden = false; h.document.emit('visibilitychange');
  check(context.resumes === resumes + 1, 'Interrupted context is resumed after screen-lock return');
  h.media.finish(); await flush();
  check(controller.getState().status === 'playing', 'Interrupted playback recovers');
  controller.dispose();
  check(h.frames.size === 0, 'Interruption fixture cleanup leaves no frames');
}

// The speaker and header operate on one controller, preserving mute and seek.
{
  const h = harness();
  const controller = createMusicController(h.media, h.options); await flush(); h.advance(1300);
  controller.setVolume(.37); h.advance(100);
  check(h.media.volume === .37, 'Dial changes the actual media volume');
  check(controller.getState().volume === .37, 'Header and dial share selected level');
  check(h.data.get(MUSIC_VOLUME_KEY) === '.37' || h.data.get(MUSIC_VOLUME_KEY) === '0.37', 'Volume preference is saved');
  controller.setVolume(0); h.advance(100);
  check(h.media.volume === 0 && !h.media.paused, 'Zero volume is silent without losing playback position');
  controller.toggle(); h.advance(600); controller.setVolume(.25);
  check(h.media.paused && h.media.volume === 0, 'Turning the dial while off does not bypass mute');
  controller.toggle(); await flush(); h.advance(1300);
  check(h.media.volume === .25 && h.media.currentTime === 26, 'Resume keeps new volume and playback position');
  h.document.hidden = true; h.document.emit('visibilitychange'); controller.setVolume(.19);
  check(h.media.paused && h.media.volume === 0, 'Hidden-page dial updates cannot resume audio');
  h.document.hidden = false; h.document.emit('visibilitychange'); await flush(); h.advance(1300);
  check(h.media.volume === .19, 'Visibility resume uses current selected volume');
  controller.dispose();
  const next=createMusicController(h.media,h.options); await flush(); h.advance(1300);
  check(next.getState().volume===.19 && h.media.volume===.19,'New controller restores saved volume');
  next.dispose();
}
console.log(`${checks} background-music assertions passed.`);
