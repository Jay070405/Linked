/** Props that make an image (or a wrapper around one) open in the case page's figure viewer (CaseChrome). `src`
    points at a larger file than the one shown; `w`/`h` give its size when the trigger isn't an <img>. */
export function zoomable(alt, {src, w, h, lang} = {}) {
  const zh = lang === 'zh';   // pass useCaseLang().lang to word the button in Chinese
  return {'data-zoom': src || '', 'data-zoom-alt': alt, ...(w ? {'data-zoom-w': w, 'data-zoom-h': h} : {}),
    'data-cursor': zh ? '放大查看' : 'Enlarge', role: 'button', tabIndex: 0, 'aria-label': zh ? `放大查看：${alt}` : `Enlarge: ${alt}`};
}
