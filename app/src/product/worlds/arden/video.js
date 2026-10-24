import {useEffect, useState} from 'react';

/* The walkthrough videos are recorded after the page ships. The "Watch the walkthrough" button and the app-video card
   are wired (v2/Walkthrough, stem d5-eyelid) but stay hidden until public/video/<stem>-page.mp4 and <stem>-app.mp4
   exist. One HEAD request each, at idle time after load; a dev server's HTML fallback doesn't count (the answer has to
   be a video). */

const cache = new Map();

function check(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url, {method: 'HEAD', cache: 'no-cache'})
      .then(r => r.ok && /^video\//.test(r.headers.get('content-type') || ''))
      .catch(() => false));
  }
  return cache.get(url);
}

export function useVideos(stem) {
  const [ready, setReady] = useState({page: false, app: false});
  useEffect(() => {
    let off = false;
    const run = () => {
      for (const which of ['page', 'app']) check(`/video/${stem}-${which}.mp4`).then(ok => { if (ok && !off) setReady(s => ({...s, [which]: true})); });
    };
    const id = typeof requestIdleCallback === 'function' ? requestIdleCallback(run, {timeout: 2500}) : setTimeout(run, 800);
    return () => { off = true; (typeof cancelIdleCallback === 'function' ? cancelIdleCallback : clearTimeout)(id); };
  }, [stem]);
  return ready;
}
