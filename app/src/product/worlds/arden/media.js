import ASSETS from './data/assets.json';

/* Where the Arden renders and photographs live (public/assets/product/arden), read from the manifest that
   scripts/build-arden-assets.mjs writes. Nothing here hard-codes a frame count or a size: re-running the script with
   new renders changes the page, and a render that doesn't exist yet is simply absent (callers fall back). Every image
   comes in a 1600 px and an 800 px set: phones get the 800 set (Pic.jsx). */

export {ASSETS};
export const BASE = ASSETS.base;
export const PHONE_SET = '(max-width: 760px)';

/** 1600 or 800: the smaller set when it covers `cssWidth` CSS pixels at this screen's density (phones always 800). */
export function pickWidth(cssWidth) {
  if (typeof window === 'undefined') return 1600;
  if (matchMedia(PHONE_SET).matches) return 800;
  return cssWidth * (window.devicePixelRatio || 1) <= 880 ? 800 : 1600;
}

export const has = name => !!ASSETS.stills[name];
export const stillSrc = (name, w = 1600) => `${BASE}/still/${name}-${w}.webp`;
export const plateOf = name => ASSETS.stills[name]?.plate || '#f5f5f7';
export const photoSrc = (dir, name, w = 1600) => `${BASE}/${dir}/${name}-${w}.webp`;

export const seqInfo = name => ASSETS.seq?.[name] || null;
export const frameSrc = (name, w, i) => `${ASSETS.seq[name].base}/${w}/${String(i + 1).padStart(2, '0')}.webp`;
