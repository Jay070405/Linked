// The art pages show webp copies of the artworks: 1600 px previews (public/assets/art/preview) on the desk, in the archive
// and in thumbnails, and 2560 px versions (public/assets/art/large) as a work page's main image, sharp on high-density
// screens. A work page's "enlarge original" keeps the full file.
const ART = /^\/assets\/art\/([^/]+)\.(?:png|jpe?g)$/;
const copy = folder => src => typeof src === 'string' && ART.test(src) ? src.replace(ART, `/assets/art/${folder}/$1.webp`) : src;
export const artPreview = copy('preview');
export const artLarge = copy('large');
