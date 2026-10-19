import {useState} from 'react';
import {PHONE, useMedia} from './motion';
import {Phone, ProtoScreen, protoUrl, resetProtoState} from './Device';
import {ArrowRight, ArrowUpRight, Reset} from './icons';

/** The prototype at full size with a short task list. A task opens the prototype on its first screen; Reset clears
    the prototype's saved drafts and orders and starts it from onboarding. Phones get a screenshot and links that
    open the prototype full screen instead. */
export default function LivePrototype({id, heading, lede, phoneLede, tasks, start = {screen: 'onboarding'}, reduced = false, note}) {
  const phone = useMedia(PHONE);
  const [state, setState] = useState({task: null, screen: start.screen, art: start.art, reload: 0});
  const run = (task, i) => setState(s => ({task: i, screen: task.screen, art: task.art, reload: s.reload + 1}));
  const reset = () => { resetProtoState(); setState(s => ({task: null, screen: start.screen, art: start.art, reload: s.reload + 1})); };
  const current = state.task == null ? null : tasks[state.task];
  return <section id={id} className="v2-live" aria-labelledby={`${id}-title`}>
    <div className="v2-live-copy">
      <div className="v2-section-head" data-reveal="">
        <h2 id={`${id}-title`} className="v2-h2">{heading}</h2>
        {(phone && phoneLede) || lede ? <p className="v2-lede">{(phone && phoneLede) || lede}</p> : null}
      </div>
      <ol className="v2-tasks" data-reveal="">
        {tasks.map((task, i) => <li key={task.id}>
          {phone
            ? <a className="v2-task" href={protoUrl(task.screen, task.art)} target="_blank" rel="noopener">
                <span className="v2-task-text">{task.title}</span><span className="v2-task-arrow"><ArrowUpRight/></span></a>
            : <button type="button" className={`v2-task${state.task === i ? ' is-current' : ''}`} aria-pressed={state.task === i} onClick={() => run(task, i)}>
                <span className="v2-task-text">{task.title}</span><span className="v2-task-arrow"><ArrowRight/></span></button>}
          {!phone && state.task === i && task.hint ? <p className="v2-task-hint">{task.hint}</p> : null}
        </li>)}
      </ol>
      <div className="v2-live-tools" data-reveal="">
        {phone ? null : <button type="button" className="v2-button" onClick={reset}><Reset/>Reset the prototype</button>}
        <a className="v2-link" href={protoUrl(current?.screen || start.screen, current?.art || start.art)} target="_blank" rel="noopener">
          <span className="v2-link-text">{phone ? 'Open the prototype full screen' : 'Open it in a new tab'}</span><ArrowUpRight/><span className="v2-sr"> (opens in a new tab)</span></a>
      </div>
      {note ? <p className="v2-live-note" data-reveal="">{note}</p> : null}
    </div>
    <div className="v2-live-device" data-reveal="">
      <Phone label="Atelier prototype">
        <ProtoScreen screen={state.screen} art={state.art} reload={state.reload} load={phone ? 'never' : 'near'} interactive={!phone}
          reduced={reduced} title="Atelier prototype, live and clickable" alt={phone ? 'The prototype’s first screen' : ''}/>
      </Phone>
    </div>
  </section>;
}
