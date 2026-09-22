import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import CometDial from '../components/CometDial';
import { useMusic } from '../components/BackgroundMusic';
import ExpressiveTitle from '../components/ExpressiveTitle';

export default function SpeakerVolume({ lang, position, onClose, returnRef, reduced }) {
  const dialog = useRef(null), music = useMusic(), en = lang === 'en';
  useEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement;
    node.showModal();
    node.querySelector('[role="slider"]')?.focus();
    return () => {
      node.close();
      (returnRef.current ?? previous)?.focus({ preventScroll: true });
    };
  }, [returnRef]);
  const playing = music.status === 'playing';
  return createPortal(<dialog ref={dialog} className="office-speaker-panel" style={{ '--speaker-x': `${position.x+28}px`, '--speaker-y': `${position.y-160}px` }} aria-labelledby="speaker-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="speaker-panel-content">
      <header><span>STUDIO SOUND / 01</span><button type="button" onClick={onClose} aria-label={en ? 'Close volume control' : '关闭音量控制'}>×</button></header>
      <h2 id="speaker-title"><ExpressiveTitle reduced={reduced} variant="type" typingSpeed={35} hover={false}>{en ? 'Set the mood.' : '给空间一点声音。'}</ExpressiveTitle></h2>
      <p lang="ja">晴日の調べ</p>
      <CometDial value={Math.round(music.volume * 100)} onChange={value => music.setVolume(value / 100)} label={en ? 'Music volume' : '背景音乐音量'} size={220} accent="#e9d7b9" ink="#f6f1e8" momentum={.35} tapBounce={reduced ? 0 : .12} flickBounce={reduced ? 0 : .06} reduced={reduced} />
      <footer><button type="button" data-music-toggle onClick={music.toggle} aria-pressed={playing}>{playing ? (en ? 'Pause music' : '暂停音乐') : (en ? 'Play music' : '播放音乐')} <span aria-hidden="true">{playing ? 'Ⅱ' : '▷'}</span></button><span>{en ? 'TURN TO TUNE' : '转动，调节音量'}</span></footer>
    </div>
  </dialog>, document.body);
}
