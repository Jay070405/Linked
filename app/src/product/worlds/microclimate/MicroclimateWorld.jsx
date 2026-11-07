import {useEffect, useRef, useState} from 'react';
import {L, useCaseLang} from '../../i18n';
import './microclimate.css';

/* Microclimate, a heated three-zone office chair. The page is a site of its own (built in aigc-vibecoding/microclimate/web:
   one live three.js chair behind every section, a thermal camera, an arm panel you can press, the chair taken apart,
   a clickable iOS app), served as static files from /assets/product/microclimate/site/ and shown here full height
   under the site's header, the way FIELD / 01 sits in Other Project.
   The frame posts the tone of the section it is on, so the header above it changes with it. The site's language goes
   in as ?lang; when the visitor switches it, the frame reloads itself in the other language at the same place. */

const SRC = '/assets/product/microclimate/site/index.html';
const BG = {dark: '#000000', light: '#f5f5f7', mist: '#e9ecf0', white: '#ffffff'};

export default function MicroclimateWorld({item}) {
  const {lang, htmlLang, t} = useCaseLang();
  const frame = useRef(null);
  const [src] = useState(() => `${SRC}?lang=${lang}`);     // the language it opens in; later switches go in as messages
  const [tone, setTone] = useState('dark');
  useEffect(() => {
    const onMessage = event => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.mc === 'tone' && BG[event.data.tone]) setTone(event.data.tone);
    };
    addEventListener('message', onMessage);
    return () => removeEventListener('message', onMessage);
  }, []);
  useEffect(() => { frame.current?.contentWindow?.postMessage({mc: 'lang', lang}, location.origin); }, [lang]);

  return <article className="mc-world" lang={htmlLang} data-nav-tone={tone === 'dark' ? 'dark' : 'light'} data-mc-tone={tone} style={{'--mc-bg': BG[tone]}}>
    <h1 className="mc-title">{item.pageTitle}</h1>
    <iframe ref={frame} className="mc-frame" src={src} title={t(L('Microclimate, the chair in 3D', '小气候：可以操作的三维椅子'))}
      allow="fullscreen" onLoad={() => frame.current?.focus({preventScroll: true})}/>
  </article>;
}
