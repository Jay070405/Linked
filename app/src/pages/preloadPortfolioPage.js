// Share the import promises with React.lazy so navigation warms its destination
// while the circle expands, instead of revealing a loading placeholder.
const importers={
 desk:()=>import('./ArtDesk'), systems:()=>import('./SystemsIndex'),
 roco:()=>import('./RocoCase'), league:()=>import('./LeagueCase'), nexus:()=>import('./NexusCase'),
 model:()=>import('./RocoModel'), vibecoding:()=>import('./VibeCoding'),
 'brand-motion':()=>import('./BrandMotion'), field01:()=>import('./Field01'),
};
export const loadedPages={};
const promises={};
export const pageLoaders=Object.fromEntries(Object.entries(importers).map(([type,load])=>[type,()=>
 promises[type]??=load().then(module=>{loadedPages[type]=module.default;return module;})
]));
export function preloadPortfolioPage(page){
 const type=page?.type==='system'?(page.item.id==='nexus'?'nexus':page.item.id==='league-of-legends'?'league':'roco'):page?.type;
 return pageLoaders[type]?.().catch(()=>{});
}
