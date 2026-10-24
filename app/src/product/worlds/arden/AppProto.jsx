import {useEffect, useRef, useState} from 'react';
import {useCaseLang} from '../../i18n';
import {useNear} from '../../v2/Try';
import {WatchCard} from '../../v2/Walkthrough';
import {BASE} from './media';
import {APP} from './content';

/* The companion app, live: the built prototype (public/proto/arden, scripts/build-arden-proto.mjs) in an iframe at its
   own size, phone beside the glasses simulator, with two stills under it: the Lock Screen while recording and the Sizes
   board (scripts/capture-arden-screens.mjs). It loads when the section comes near; until then (and while it loads)
   a still of the same screen holds the place. Phones get the phone still and a link that opens it full screen. The
   app-video card is wired and shows once public/video/d5-arden-app.mp4 exists. */

const URL = '/proto/arden/';

export default function AppProto({phone, videos}) {
  const {t} = useCaseLang();
  const holder = useRef(null);
  const near = useNear(holder, '900px 0px');
  const [reload, setReload] = useState(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(false); }, [reload]);
  return <div className="ar-app">
    <div className="ar-app-top">
      <ol className="ar-app-tasks" aria-label={t(APP.tasksTitle)}>{APP.tasks.map((x, i) => <li key={i}><span className="ar-num-dot" aria-hidden="true">{i + 1}</span><span>{t(x)}</span></li>)}</ol>
      <div className="ar-app-side">
        <p className="ar-note">{t(APP.note)}</p>
        <div className="ar-app-tools">
          {phone ? null : <button type="button" className="ar-btn is-small" onClick={() => setReload(r => r + 1)}>
            <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true"><path d="M15.5 10a5.5 5.5 0 1 1-1.6-3.9M15.5 3.5v3.2h-3.2"/></svg>{t(APP.reset)}</button>}
          <a className="ar-link" href={URL} target="_blank" rel="noopener">{t(phone ? APP.openPhone : APP.newTab)}<span aria-hidden="true"> ↗</span><span className="ar-sr">{t({en: ' (opens in a new tab)', zh: '（在新标签页打开）'})}</span></a>
        </div>
        {videos.app ? <WatchCard className="ar-watch-card"/> : null}
      </div>
    </div>
    {phone
      ? <figure className="ar-app-phone">
        <a href={URL} target="_blank" rel="noopener" className="ar-app-phone-link">
          <img src={`${BASE}/app/phone.webp`} width={780} height={1688} alt={t(APP.shotAlt)} loading="lazy" decoding="async"/>
        </a>
        <figcaption>{t(APP.phoneNote)}</figcaption>
      </figure>
      : <div ref={holder} className="ar-app-frame" data-loaded={loaded || undefined}>
        <img className="ar-app-poster" src={`${BASE}/app/desk.webp`} width={2880} height={1624} alt="" aria-hidden="true" loading="lazy" decoding="async"/>
        {near ? <iframe key={reload} src={URL} title={t(APP.frameTitle)} loading="lazy" onLoad={() => setLoaded(true)}/> : null}
      </div>}
    <div className="ar-app-stills">
      {APP.stills.map(x => <figure key={x.name}>
        <img src={`${BASE}/app/${x.name}.webp`} width={2880} height={1624} alt={t(x.alt)} loading="lazy" decoding="async"/>
        <figcaption>{t(x.text)}</figcaption>
      </figure>)}
    </div>
    <p className="ar-note">{t(APP.system)}</p>
  </div>;
}
