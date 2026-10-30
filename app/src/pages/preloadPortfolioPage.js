// Share the import promises with React.lazy so navigation warms its destination
// while the circle expands, instead of revealing a loading placeholder.
const importers={
 desk:()=>import('./ArtDesk'), systems:()=>import('./SystemsIndex'),
 roco:()=>import('./RocoCase'), league:()=>import('./LeagueCase'), nexus:()=>import('./NexusCase'),
 maoxianjia:()=>import('./MaoxianjiaCase'),
 model:()=>import('./RocoModel'), vibecoding:()=>import('./VibeCoding'),
 'brand-motion':()=>import('./BrandMotion'), 'touch-on-beat':()=>import('./TouchOnBeat'), 'product-film':()=>import('./FilmCase'), hako:()=>import('./HakoFilm'), field01:()=>import('./Field01'),
 // /product, its case studies and /for/* share one module.
 product:()=>import('../product/ProductRoute'),
};
export const PRODUCT_TYPES=['product','product-case','for','about'];
export const loadedPages={};
const promises={};
export const pageLoaders=Object.fromEntries(Object.entries(importers).map(([type,load])=>[type,()=>
 promises[type]??=load().then(module=>{loadedPages[type]=module.default;return module;})
]));
export function preloadPortfolioPage(page){
 const type=page?.type==='system'?(page.item.id==='nexus'?'nexus':page.item.id==='league-of-legends'?'league':page.item.id==='maoxianjia'?'maoxianjia':'roco'):PRODUCT_TYPES.includes(page?.type)?'product':page?.type;
 return pageLoaders[type]?.().catch(()=>{});
}
