// Where a page's dot-matrix name stands, and how large. Two things read this and must agree to the pixel:
// the cover of the site's page change (components/dot-transition.js), which writes the name of the place you arrive in,
// and the page's own head (kit.jsx), which shows the same word in the same place. When the cover's dots drain away the word
// is simply still there: the page opens on what the transition said.
export const HEAD_PAGES = {product: 'PRODUCT', systems: 'SYSTEMS'}; // the pages that open on such a head, by the first part of their path

export function headMetrics(W, H, letters) {
  const size = Math.max(40, Math.min(W * .15, H * .2, 190, W * .82 / (letters * .62))); // the type's size: its letters are .62 of it wide
  const y = Math.round(Math.max(H * .3, 96 + size * .62));                             // the middle of the word, from the top of the page (clear of the site's bar)
  return {size: Math.round(size), y, band: Math.round(y + size * .5 + Math.max(64, Math.min(H * .12, 112)))};
}

// the two looks a head (and the cover) can have: they follow the cartridge that is in the machine on the home page
export const headTone = side => (side === 'game' ? {bg: '#EFE3CB', ink: '#14110D'} : {bg: '#0A0B0D', ink: '#F2F2EF'});
export const readSide = () => { try { const v = sessionStorage.getItem('jl-side'); return v === 'game' ? 'game' : 'product'; } catch { return 'product'; } };
