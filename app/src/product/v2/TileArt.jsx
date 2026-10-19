import {l100Shot, Phone, PROTO_H, PROTO_W, shotSrc} from './Device';

/* Pictures for the /product tiles, all made from each prototype's own screens. All decorative (the tile's text names the
   project). Layers marked [data-depth] lean toward the pointer. */

/** D1: the editor in its review state, with the Variables row lifted off the panel in front. */
export function RfaTileArt() {
  return <span className="pt-rfa">
    <span className="pt-rfa-editor" data-depth="8"><img src="/assets/product/ready-for-agents/tile.webp" width={1280} height={830} alt="" loading="lazy" decoding="async"/></span>
    <span className="pt-rfa-row" data-depth="20"><img src="/assets/product/ready-for-agents/tile-row.webp" width={300} height={295} alt="" loading="lazy" decoding="async"/></span>
  </span>;
}

/** D2: a print of one painting on the studio wall, the app's home in front. Screenshots only: no iframe here. */
export function AtelierTileArt() {
  return <span className="pt-atelier">
    <span className="pt-atelier-print" data-depth="8"><img src="/proto/atelier/art/blue-hour.webp" width={1600} height={844} alt="" loading="lazy" decoding="async"/></span>
    <span className="pt-atelier-phone" data-depth="20">
      <Phone><img className="v2-shot" src={shotSrc('home')} width={PROTO_W * 2} height={PROTO_H * 2} alt="" loading="lazy" decoding="async"/></Phone>
    </span>
  </span>;
}

/** D3: the complex's site plan with the route, the courier's photo card in front. Screenshots only. */
export function L100TileArt() {
  return <span className="pt-l100">
    <span className="pt-l100-plan" data-depth="8"><img src="/assets/product/last-100-feet/plan.webp" width={808} height={768} alt="" loading="lazy" decoding="async"/></span>
    <span className="pt-l100-phone" data-depth="20">
      <Phone><img className="v2-shot" src={l100Shot('c-step-building')} width={780} height={1688} alt="" loading="lazy" decoding="async"/></Phone>
    </span>
  </span>;
}

/** D4: the prototype's yearly-cost chart, with its cost-difference note lifted in front. Screenshots only. */
export function CntlTileArt() {
  return <span className="pt-cntl">
    <span className="pt-cntl-chart" data-depth="8"><img src="/assets/product/choose-not-to-lose/tile.webp" width={2176} height={1200} alt="" loading="lazy" decoding="async"/></span>
    <span className="pt-cntl-note" data-depth="20"><img src="/assets/product/choose-not-to-lose/tile-note.webp" width={2112} height={200} alt="" loading="lazy" decoding="async"/></span>
  </span>;
}
