import {useState} from 'react';
import {PHONE, useMedia} from './motion';
import {ATELIER_KIT, Phone, ProtoScreen, resetProtoState} from './Device';
import {ArrowRight, ArrowUpRight, Reset} from './icons';

/** The prototype at full size with a short task list. A task opens the prototype on its first screen; Reset clears
    the prototype's saved drafts and orders and starts it from onboarding. Phones get a screenshot and links that
    open the prototype full screen instead. */
export default function LivePrototype({id, heading, lede, phoneLede, tasks, start = {screen: 'onboarding'}, reduced = false, note, kit = ATELIER_KIT, frame = 'phone',
  name = 'Atelier prototype', resetState = resetProtoState, phoneLink = true, phoneNote}) {
  const phone = useMedia(PHONE);
  const [state, setState] = useState({task: null, screen: start.screen, art: start.art, reload: 0});
  const run = (task, i) => setState(s => ({task: i, screen: task.screen, art: task.art, reload: s.reload + 1}));
  const reset = () => { resetState(); setState(s => ({task: null, screen: start.screen, art: start.art, reload: s.reload + 1})); };
  const current = state.task == null ? null : tasks[state.task];
  return <section id={id} className={`atw-live${frame === 'browser' ? ' is-wide' : ''}`} aria-labelledby={`${id}-title`}>
    <div className="atw-live-copy">
      <div className="atw-section-head" data-reveal="">
        <h2 id={`${id}-title`} className="atw-h2">{heading}</h2>
        {(phone && phoneLede) || lede ? <p className="atw-lede">{(phone && phoneLede) || lede}</p> : null}
      </div>
      <ol className="atw-tasks" data-reveal="">
        {tasks.map((task, i) => <li key={task.id}>
          {phone
            ? phoneLink ? <a className="atw-task" href={(kit.openUrl || kit.url)(task.screen, task.art)} target="_blank" rel="noopener">
                <span className="atw-task-text">{task.title}</span><span className="atw-task-arrow"><ArrowUpRight/></span></a>
              : <p className="atw-task is-static"><span className="atw-task-text">{task.title}</span></p>
            : <button type="button" className={`atw-task${state.task === i ? ' is-current' : ''}`} aria-pressed={state.task === i} onClick={() => run(task, i)}>
                <span className="atw-task-text">{task.title}</span><span className="atw-task-arrow"><ArrowRight/></span></button>}
          {!phone && state.task === i && task.hint ? <p className="atw-task-hint">{task.hint}</p> : null}
        </li>)}
      </ol>
      <div className="atw-live-tools" data-reveal="">
        {phone ? null : <button type="button" className="atw-button" onClick={reset}><Reset/>Reset the prototype</button>}
        {phone && !phoneLink ? null : <a className="atw-link" href={(kit.openUrl || kit.url)(current?.screen || start.screen, current?.art || start.art)} target="_blank" rel="noopener">
          <span className="atw-link-text">{phone ? 'Open the prototype full screen' : 'Open it in a new tab'}</span><ArrowUpRight/><span className="atw-sr"> (opens in a new tab)</span></a>}
      </div>
      {phone && phoneNote ? <p className="atw-live-note" data-reveal="">{phoneNote}</p> : null}
      {note && !(phone && phoneNote) ? <p className="atw-live-note" data-reveal="">{note}</p> : null}
    </div>
    <div className="atw-live-device" data-reveal="">
      {(() => { const Frame = Phone; return <Frame label={name}>
        <ProtoScreen kit={kit} screen={state.screen} art={state.art} reload={state.reload} load={phone ? 'never' : 'near'} interactive={!phone}
          reduced={reduced} title={`${name}, live and clickable`} alt={phone ? `${name}, first screen` : ''}/>
      </Frame>; })()}
    </div>
  </section>;
}
