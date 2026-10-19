import {useState} from 'react';
import {CNTL_KIT, ProtoScreen} from '../../v2/Device';
import {Window} from './Window';

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

export function TryTasks({tasks, t, linkOut = false}) {
  const {state, run, reset} = t;
  const current = state.task == null ? null : tasks[state.task];
  return <div className="cnr-try">
    <ol className="cnr-tasks">
      {tasks.map((task, i) => <li key={task.id} data-print="">
        {linkOut
          ? <a className="cnr-task" href={open(task.screen)} target="_blank" rel="noopener">
              <span className="cnr-task-box" aria-hidden="true"/><span className="cnr-task-text">{task.title}</span><span className="cnr-sr"> (opens in a new tab)</span></a>
          : <button type="button" className={`cnr-task${state.task === i ? ' is-current' : ''}`} aria-pressed={state.task === i} onClick={() => run(task, i)}>
              <span className="cnr-task-box" aria-hidden="true"/><span className="cnr-task-text">{task.title}</span></button>}
        {!linkOut && state.task === i && task.hint ? <p className="cnr-task-hint">{task.hint}</p> : null}
      </li>)}
    </ol>
    <div className="cnr-try-tools" data-print="">
      {linkOut ? null : <button type="button" className="cnr-key is-quiet" onClick={reset}>Reset the prototype</button>}
      <a className="cnr-link" href={open(current?.screen || START)} target="_blank" rel="noopener">{linkOut ? 'Open the prototype full screen' : 'Open it in a new tab'}<span className="cnr-sr"> (opens in a new tab)</span></a>
    </div>
  </div>;
}

export function TryWindow({t, still, shot = false}) {
  const {state} = t;
  return <Window label="Choose Not to Lose prototype" className="cnr-try-win">
    <ProtoScreen kit={CNTL_KIT} screen={state.screen} reload={state.reload} load={shot ? 'never' : 'near'} interactive={!shot}
      reduced={still} title="Choose Not to Lose prototype, live and clickable" alt={shot ? 'The Choose Not to Lose prototype: the yearly comparison of four fictional plans' : ''}/>
  </Window>;
}
