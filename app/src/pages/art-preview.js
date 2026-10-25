// The art pages show 1600 px webp previews (public/assets/art/preview); a work page's "enlarge original" keeps the full file.
const ART = /^\/assets\/art\/([^/]+)\.(?:png|jpe?g)$/;
export const artPreview = src => typeof src === 'string' && ART.test(src) ? src.replace(ART, '/assets/art/preview/$1.webp') : src;
