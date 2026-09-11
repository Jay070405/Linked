import geometry from './assets/brand-geometry.json';
export {geometry};
export function fitBrandWord(width,height){
 const word=geometry.word,scale=Math.min(width*.985/word.width,height*.8/word.height);
 return {scale,x:(width-word.width*scale)/2,y:(height-word.height*scale)/2};
}
export default function BrandWordmark({className='',outline=false,guides=false}){
 const word=geometry.word;
 return <svg className={`brand-word-vector ${className}`} viewBox={`0 0 ${word.width} ${word.height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  {guides?<g fill="none" stroke="currentColor" strokeWidth=".55" opacity=".45">{word.paths.map((letter,i)=>{const[x0,y0,x1,y1]=letter.bounds;return <path className="brand-glyph-guide" key={i} pathLength="1" d={`M${x0-15} ${y0+50}V${y0-15}H${x0+50} M${x1-50} ${y0-15}H${x1+15}V${y0+50} M${x0-15} ${y1-50}V${y1+15}H${x0+50} M${x1-50} ${y1+15}H${x1+15}V${y1-50}`} vectorEffect="non-scaling-stroke"/>;})}</g>:word.paths.map((letter,i)=><path className={outline?'brand-glyph-stroke':'brand-glyph-fill'} key={i} d={letter.d} pathLength="1" fill={outline?'none':'currentColor'} stroke={outline?'currentColor':'none'} strokeWidth={outline?'1.15':undefined} vectorEffect="non-scaling-stroke"/>)}
 </svg>;
}
