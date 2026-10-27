// The room's own opening frames (scripts/capture-office-opening.mjs). Until the first live frame fades in over it, the homepage
// shows the one for the window's shape: within each shape the live camera stays put and the window only crops it sideways.
export const OFFICE_OPENING = [
  { media: '(max-aspect-ratio: 247/500)', src: '/assets/office3d/opening-tall.webp' },   // tall phones: the camera backs off to keep the monitor in
  { media: '(max-aspect-ratio: 899/1000)', src: '/assets/office3d/opening-portrait.webp' },
  { media: 'all', src: '/assets/office3d/opening-wide.webp' },
];
export const officeOpening = () => OFFICE_OPENING.find(still => matchMedia(still.media).matches).src;

let request;
export function preloadOffice() {
  if (!request) request = fetch('/assets/office3d/studio.glb').then(response => {
    if (!response.ok) throw new Error(`Office model: ${response.status}`);
    return response.arrayBuffer();
  }).catch(error => { request = undefined; throw error; });
  return request;
}
