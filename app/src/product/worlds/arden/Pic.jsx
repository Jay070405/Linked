import {ASSETS, PHONE_SET, frameSrc, photoSrc, stillSrc} from './media';

/* A render from the manifest: the 800 px set on narrow screens, the 1600 px set elsewhere (a <picture> with a media
   query, so phones always get the mobile set, whatever their density). The <picture> is display: contents, so the <img>
   lays out as if it were the parent's own child. */

export function Pic({name, alt = '', eager = false, ...img}) {
  const s = ASSETS.stills[name];
  if (!s) return null;
  const [w, h] = s.sizes[1600] || s.sizes[800];
  return <picture>
    <source media={PHONE_SET} srcSet={stillSrc(name, 800)}/>
    <img src={stillSrc(name, 1600)} width={w} height={h} alt={alt} decoding="async" {...(eager ? {fetchPriority: 'high'} : {loading: 'lazy'})} {...img}/>
  </picture>;
}

/** Frame i of a sequence, the same way: the first frame of each sequence is an ordinary picture in the page. */
export function Frame({name, i = 0, alt = '', eager = false, ...img}) {
  const s = ASSETS.seq[name];
  if (!s) return null;
  const [w, h] = s.sizes[1600] || s.sizes[800];
  return <picture>
    <source media={PHONE_SET} srcSet={frameSrc(name, 800, i)}/>
    <img src={frameSrc(name, 1600, i)} width={w} height={h} alt={alt} decoding="async" draggable={false} {...(eager ? {fetchPriority: 'high'} : {loading: 'lazy'})} {...img}/>
  </picture>;
}

/** A photograph from the manifest (lifestyle/, scenes/), the same way. */
export function Photo({dir, name, alt = '', eager = false, ...img}) {
  const s = ASSETS[dir === 'lifestyle' ? 'lifestyle' : dir]?.[name];
  if (!s) return null;
  const [w, h] = s.sizes[1600] || s.sizes[800];
  return <picture>
    <source media={PHONE_SET} srcSet={photoSrc(dir, name, 800)}/>
    <img src={photoSrc(dir, name, 1600)} width={w} height={h} alt={alt} decoding="async" {...(eager ? {fetchPriority: 'high'} : {loading: 'lazy'})} {...img}/>
  </picture>;
}
