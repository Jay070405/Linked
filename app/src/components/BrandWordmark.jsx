import geometry from './assets/brand-geometry.json';
export {geometry};
export function fitBrandWord(width,height){
 const word=geometry.word,scale=Math.min(width*.985/word.width,height*.8/word.height);
 return {scale,x:(width-word.width*scale)/2,y:(height-word.height*scale)/2};
}
export default function BrandWordmark({className='',outline=false}){
 const word=geometry.word;
 return <svg className={`brand-word-vector ${className}`} viewBox={`0 0 ${word.width} ${word.height}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  {word.paths.map((letter,i)=><path className={outline?'brand-glyph-stroke':'brand-glyph-fill'} key={i} d={letter.d} pathLength="1" fill={outline?'none':'currentColor'} stroke={outline?'currentColor':'none'} strokeWidth={outline?'1.15':undefined} vectorEffect="non-scaling-stroke"/>)}
 </svg>;
}
