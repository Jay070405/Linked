import { useId } from 'react';
import { useMusic } from './BackgroundMusic';
import ExpressiveTitle from './ExpressiveTitle';
import './MusicToggle.css';

const statusText = {
  zh: { playing: '正在播放 · 低音量', pending: '等待首次操作后播放', loading: '音乐加载中', off: '音乐已关闭', suspended: '离开页面，暂时暂停', stopping: '正在淡出', error: '音乐暂时无法播放' },
  en: { playing: 'Playing · low volume', pending: 'Waiting for your first interaction', loading: 'Loading music', off: 'Music off', suspended: 'Paused while away', stopping: 'Fading out', error: 'Music unavailable' },
};
const labels = { playing: 'ON', pending: 'WAIT', loading: '···', off: 'OFF', suspended: 'PAUSE', stopping: '···', error: '—' };

export default function MusicToggle({ lang = 'zh', reduced = false }) {
  const tooltipId = useId();
  const { enabled, status, toggle, volume } = useMusic();
  const en = lang === 'en';
  const description = status === 'playing' ? `${en ? 'Playing' : '正在播放'} · ${Math.round(volume * 100)}%` : statusText[en ? 'en' : 'zh'][status];
  const retry = ['pending', 'error', 'suspended'].includes(status);
  const action = retry ? (en ? 'Play music' : '播放背景音乐') : enabled ? (en ? 'Turn music off' : '关闭背景音乐') : (en ? 'Turn music on' : '开启背景音乐');
  return <div className={`v16-music${reduced ? ' is-reduced' : ''}`} data-status={status}>
    <button data-music-toggle type="button" className="music-toggle" aria-pressed={status === 'playing'} aria-label={`${action} · ${description}`} aria-describedby={tooltipId} onClick={toggle}>
      <span className="music-meter" aria-hidden="true"><i /><i /><i /><i /><span className="music-slash" /></span>
      <span className="music-state" aria-hidden="true"><ExpressiveTitle variant="type" typingSpeed={30} reduced={reduced} hover={false}>{labels[status]}</ExpressiveTitle></span>
    </button>
    <span className="music-tooltip" id={tooltipId} role="tooltip"><span lang="ja">晴日の調べ</span><span>{description}</span></span>
    <span className="music-sr-status" role="status" aria-live="polite">{description}</span>
  </div>;
}
