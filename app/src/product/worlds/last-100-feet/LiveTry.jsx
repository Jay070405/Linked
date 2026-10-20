import {useState} from 'react';
import {PHONE, useMedia} from '../../v2/motion';
import {L100_KIT, Phone, ProtoScreen} from '../../v2/Device';
import {ArrowRight, ArrowUpRight, Reset} from '../../v2/icons';
import {L, UI, useCaseLang} from '../../i18n';
import {WatchCard} from '../../v2/Walkthrough';

/* The prototype at full size with a short task list (v2/LivePrototype.jsx, re-skinned): a task opens the live
   prototype on the screen where it starts. Phones get a screenshot and links that open it full screen. */
export default function LiveTry({tasks, start = 'c-arrive', reduced = false, note}) {
  const phone = useMedia(PHONE);
  const {t} = useCaseLang();
  const [state, setState] = useState({task: null, screen: start, reload: 0});
  const run = (task, i) => setState(s => ({task: i, screen: task.screen, reload: s.reload + 1}));
  const reset = () => setState(s => ({task: null, screen: start, reload: s.reload + 1}));
  const current = state.task == null ? null : tasks[state.task];
  return <div className="w3-live">
    <div className="w3-live-copy">
      <ol className="w3-tasks">
        {tasks.map((task, i) => <li key={task.id}>
          {phone
            ? <a className="w3-task" href={L100_KIT.openUrl(task.screen)} target="_blank" rel="noopener">
                <span>{t(task.title)}</span><ArrowUpRight width={18} height={18}/><span className="w3-sr">{t(UI.opensInNewTab)}</span></a>
            : <button type="button" className={`w3-task${state.task === i ? ' is-current' : ''}`} aria-pressed={state.task === i} onClick={() => run(task, i)}>
                <span>{t(task.title)}</span><ArrowRight width={18} height={18}/></button>}
          {!phone && state.task === i && task.hint ? <p className="w3-task-hint">{t(task.hint)}</p> : null}
        </li>)}
      </ol>
      <div className="w3-live-tools">
        {phone ? null : <button type="button" className="w3-pill" onClick={reset}><Reset/>{t(L('Reset the prototype', '重置原型'))}</button>}
        <a className="w3-textlink" href={L100_KIT.openUrl(current?.screen || start)} target="_blank" rel="noopener">
          {t(phone ? L('Open the prototype full screen', '全屏打开原型') : L('Open it in a new tab', '在新标签页打开'))}<ArrowUpRight/><span className="w3-sr">{t(UI.opensInNewTab)}</span></a>
      </div>
      {note ? <p className="w3-small">{note}</p> : null}
      <WatchCard className="w3-watch-card"/>
    </div>
    <div className="w3-live-device">
      <Phone label={t(L('Last 100 Feet prototype', 'Last 100 Feet 原型'))}>
        <ProtoScreen kit={L100_KIT} screen={state.screen} reload={state.reload} load={phone ? 'never' : 'near'} interactive={!phone}
          reduced={reduced} title={t(L('Last 100 Feet prototype, live and clickable', 'Last 100 Feet 原型，可以直接点击操作'))} alt={phone ? t(L('Last 100 Feet prototype, the arrival card', 'Last 100 Feet 原型：到达卡片')) : ''}/>
      </Phone>
    </div>
  </div>;
}
