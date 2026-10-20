import {useState} from 'react';
import {CNTL_KIT, ProtoScreen} from '../../v2/Device';
import {L, UI, useCaseLang} from '../../i18n';
import {Window} from './Window';

const T = {
  reset: L('Reset the prototype', '重置原型'),
  openTab: L('Open it in a new tab', '在新标签页打开'),
  openFull: L('Open the prototype full screen', '全屏打开原型'),
  name: L('Choose Not to Lose prototype', 'Choose Not to Lose 原型'),
  live: L('Choose Not to Lose prototype, live and clickable', 'Choose Not to Lose 原型，可以直接点'),
  shot: L('The Choose Not to Lose prototype: the yearly comparison of four fictional plans', 'Choose Not to Lose 原型：四个虚构方案的全年比较'),
};

/* Try it (D4 world): four tasks printed on the receipt like a to-do slip, and the live prototype set down across the
   desk at full width, over the tape. A task loads the prototype where it starts; Reset starts it over. Narrow screens
   and the plain reading mode get a capture and links that open the prototype in a new tab, since it's built for a
   desktop screen. (Re-skin of v2/LivePrototype.jsx, with ProtoScreen from the shared kit, imported as is.) */

const START = 'compare';
export function useTry() {
  const [state, setState] = useState({task: null, screen: START, reload: 0});
  return {
    state,
    run: (task, i) => setState(s => ({task: i, screen: task.screen, reload: s.reload + 1})),
    reset: () => setState(s => ({task: null, screen: START, reload: s.reload + 1})),
  };
}

const open = screen => CNTL_KIT.url(screen);

export function TryTasks({tasks, t: tryIt, linkOut = false}) {
  const {t} = useCaseLang();
  const {state, run, reset} = tryIt;
  const current = state.task == null ? null : tasks[state.task];
  return <div className="cnr-try">
    <ol className="cnr-tasks">
      {tasks.map((task, i) => <li key={task.id} data-print="">
        {linkOut
          ? <a className="cnr-task" href={open(task.screen)} target="_blank" rel="noopener">
              <span className="cnr-task-box" aria-hidden="true"/><span className="cnr-task-text">{t(task.title)}</span><span className="cnr-sr">{t(UI.opensInNewTab)}</span></a>
          : <button type="button" className={`cnr-task${state.task === i ? ' is-current' : ''}`} aria-pressed={state.task === i} onClick={() => run(task, i)}>
              <span className="cnr-task-box" aria-hidden="true"/><span className="cnr-task-text">{t(task.title)}</span></button>}
        {!linkOut && state.task === i && task.hint ? <p className="cnr-task-hint">{t(task.hint)}</p> : null}
      </li>)}
    </ol>
    <div className="cnr-try-tools" data-print="">
      {linkOut ? null : <button type="button" className="cnr-key is-quiet" onClick={reset}>{t(T.reset)}</button>}
      <a className="cnr-link" href={open(current?.screen || START)} target="_blank" rel="noopener">{t(linkOut ? T.openFull : T.openTab)}<span className="cnr-sr">{t(UI.opensInNewTab)}</span></a>
    </div>
  </div>;
}

export function TryWindow({t: tryIt, still, shot = false}) {
  const {t} = useCaseLang();
  const {state} = tryIt;
  return <Window label={t(T.name)} className="cnr-try-win">
    <ProtoScreen kit={CNTL_KIT} screen={state.screen} reload={state.reload} load={shot ? 'never' : 'near'} interactive={!shot}
      reduced={still} title={t(T.live)} alt={shot ? t(T.shot) : ''}/>
  </Window>;
}
