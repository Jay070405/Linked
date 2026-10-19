import {useState} from 'react';
import {PHONE, useMedia} from '../../v2/motion';
import {L100_KIT, Phone, ProtoScreen} from '../../v2/Device';
import {ArrowRight, ArrowUpRight, Reset} from '../../v2/icons';

/* The prototype at full size with a short task list (v2/LivePrototype.jsx, re-skinned): a task opens the live
   prototype on the screen where it starts. Phones get a screenshot and links that open it full screen. */
export default function LiveTry({tasks, start = 'c-arrive', reduced = false, note}) {
  const phone = useMedia(PHONE);
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
                <span>{task.title}</span><ArrowUpRight width={18} height={18}/><span className="w3-sr"> (opens in a new tab)</span></a>
            : <button type="button" className={`w3-task${state.task === i ? ' is-current' : ''}`} aria-pressed={state.task === i} onClick={() => run(task, i)}>
                <span>{task.title}</span><ArrowRight width={18} height={18}/></button>}
          {!phone && state.task === i && task.hint ? <p className="w3-task-hint">{task.hint}</p> : null}
        </li>)}
      </ol>
      <div className="w3-live-tools">
        {phone ? null : <button type="button" className="w3-pill" onClick={reset}><Reset/>Reset the prototype</button>}
        <a className="w3-textlink" href={L100_KIT.openUrl(current?.screen || start)} target="_blank" rel="noopener">
          {phone ? 'Open the prototype full screen' : 'Open it in a new tab'}<ArrowUpRight/><span className="w3-sr"> (opens in a new tab)</span></a>
      </div>
      {note ? <p className="w3-small">{note}</p> : null}
    </div>
    <div className="w3-live-device">
      <Phone label="Last 100 Feet prototype">
        <ProtoScreen kit={L100_KIT} screen={state.screen} reload={state.reload} load={phone ? 'never' : 'near'} interactive={!phone}
          reduced={reduced} title="Last 100 Feet prototype, live and clickable" alt={phone ? 'Last 100 Feet prototype, the arrival card' : ''}/>
      </Phone>
    </div>
  </div>;
}
