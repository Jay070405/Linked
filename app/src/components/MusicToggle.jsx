import { useId, useRef } from 'react';
import useBackgroundMusic from './useBackgroundMusic';
import './MusicToggle.css';

const statusText = {
  zh: { playing: '正在播放 · 低音量', pending: '等待首次操作后播放', loading: '音乐加载中', off: '音乐已关闭', suspended: '离开页面，暂时暂停', stopping: '正在淡出', error: '音乐暂时无法播放' },
  en: { playing: 'Playing · low volume', pending: 'Waiting for your first interaction', loading: 'Loading music', off: 'Music off', suspended: 'Paused while away', stopping: 'Fading out', error: 'Music unavailable' },
};
const labels = { playing: 'ON', pending: 'WAIT', loading: '···', off: 'OFF', suspended: 'PAUSE', stopping: '···', error: '—' };

export default function MusicToggle({ lang = 'zh', reduced = false }) {
  const audioRef = useRef(null);
  const tooltipId = useId();
  const { enabled, status, toggle } = useBackgroundMusic(audioRef);
  const en = lang === 'en';
  const description = statusText[en ? 'en' : 'zh'][status];
  const retry = ['pending', 'error', 'suspended'].includes(status);
  const action = retry ? (en ? 'Play music' : '播放背景音乐') : enabled ? (en ? 'Turn music off' : '关闭背景音乐') : (en ? 'Turn music on' : '开启背景音乐');
  return <div className={`v16-music${reduced ? ' is-reduced' : ''}`} data-status={status}>
    <audio ref={audioRef} className="music-audio" src="/assets/audio/clear-day-melody.mp3" preload="metadata" loop aria-hidden="true" />
    <button data-music-toggle type="button" className="music-toggle" aria-pressed={status === 'playing'} aria-label={`${action} · ${description}`} aria-describedby={tooltipId} onClick={toggle}>
      <span className="music-meter" aria-hidden="true"><i /><i /><i /><i /><span className="music-slash" /></span>
      <span className="music-state" aria-hidden="true">{labels[status]}</span>
    </button>
    <span className="music-tooltip" id={tooltipId} role="tooltip"><span lang="ja">晴日の調べ</span><span>{description}</span></span>
    <span className="music-sr-status" role="status" aria-live="polite">{description}</span>
  </div>;
}
