import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { allWorks, systems } from '../src/portfolioData.js';
// Route resolution needs the data and routing helpers, not the browser-only page
// imports and CSS pulled in by the navigation preloader.
const result = await build({
  entryPoints:['src/usePortfolioRouting.js'],bundle:true,platform:'node',format:'esm',write:false,
  plugins:[{
    name:'stub-page-preloader',
    setup(build) {
      build.onResolve({filter:/\/preloadPortfolioPage(?:\.js)?$/},args=>({path:args.path,namespace:'route-test'}));
      build.onLoad({filter:/.*/,namespace:'route-test'},()=>({contents:'export function preloadPortfolioPage() {}',loader:'js'}));
    },
  }],
});
const routing = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
assert.equal(routing.resolvePath('/works').type,'desk');
assert.equal(routing.resolvePath('/works/archive').type,'archive');
assert.equal(routing.resolvePath('/vibecoding').type,'vibecoding');
assert.equal(routing.resolvePath('/vibecoding/field01/').type,'field01');
assert.equal(routing.resolvePath('/other-project').type,'vibecoding');
assert.equal(routing.resolvePath('/other-project/field01/').type,'field01');
assert.equal(routing.resolvePath('/other-project/jay-lin').type,'brand-motion');
assert.equal(routing.routeFor({type:'vibecoding'}),'/other-project');
assert.equal(routing.routeFor({type:'field01'}),'/other-project/field01');
assert.equal(routing.routeFor({type:'brand-motion'}),'/other-project/jay-lin');
assert.equal(routing.routeFor('/other-project/experiment-03'),null);
assert.equal(routing.routeFor('/vibecoding/experiment-02'),null);
assert.equal(routing.resolvePath('/field01/assets/missing.glb'),null);
assert.equal(routing.resolvePath('/systems').type,'systems');
assert.equal(routing.resolvePath('/systems/').type,'systems');
assert.equal(routing.routeFor({type:'systems'}),'/systems');
assert.equal(routing.resolvePath('/systems/roco').type,'system');
assert.equal(routing.resolvePath('/systems/roco/model').type,'model');
assert.equal(routing.resolvePath('/systems/nexus').item.video,'/assets/nexus/nexus-chapter-one.mp4');
assert.equal(routing.routeFor({type:'system',item:{id:'nexus'}}),'/systems/nexus');
const maoxianjia = routing.resolvePath('/systems/maoxianjia');
assert.equal(maoxianjia.type,'system');
assert.equal(maoxianjia.item.id,'maoxianjia');
assert.equal(maoxianjia.item.title,'毛险家');
assert.equal(maoxianjia.item.status,'available');
assert.equal(routing.routeFor(maoxianjia),'/systems/maoxianjia');
assert.equal(routing.routeFor('/systems/maoxianjia'),'/systems/maoxianjia');
assert.equal(routing.resolvePath('/systems/maoxianjia/?preview=1#demo').item.id,'maoxianjia');
assert.equal(systems.length,5);
const genshin = systems.find(system=>system.id==='genshin-impact');
assert.equal(genshin.title,'原神');
assert.equal(genshin.status,'coming-soon');
assert.equal(genshin.detailAvailable,false);
assert.equal(new Set(allWorks.map(w=>w.href)).size,25);
for (const work of allWorks) {
  assert.equal(routing.resolvePath(work.href).item.id,work.id);
  assert.equal(routing.routeFor({type:'art',item:work}),work.href);
}
for (const system of systems.filter(s=>s.status==='coming-soon')) {
  assert.equal(routing.resolvePath('/systems/'+system.slug),null);
  assert.equal(routing.routeFor({type:'system',item:system}),null);
}
assert.equal(routing.resolvePath('/product').type,'product');
assert.equal(routing.resolvePath('/product/').type,'product');
// the flagship case, Atelier, and the research write-up kept as the flagship's appendix
for (const slug of ['ready-for-agents','atelier','design-to-code']) {
  assert.equal(routing.resolvePath('/product/'+slug).item.slug,slug);
  assert.equal(routing.routeFor({type:'product-case',item:{slug}}),'/product/'+slug);
}
// in-progress product cases have a tile on /product but no page yet
for (const slug of ['last-100-feet','choose-not-to-lose']) {
  assert.equal(routing.resolvePath('/product/'+slug),null);
  assert.equal(routing.routeFor({type:'product-case',item:{slug}}),null);
}
// Roco and League moved to Systems: their old product addresses open the Systems pages
for (const [from,to,id] of [['/product/roco','/systems/roco','roco'],['/product/where-players-break','/systems/league-of-legends','league-of-legends']]) {
  assert.equal(routing.resolvePath(from).type,'system');
  assert.equal(routing.resolvePath(from).item.id,id);
  assert.equal(routing.resolvePath(from+'/').item.id,id);
  assert.equal(routing.routeFor(from),to);
}
assert.equal(routing.resolvePath('/product/missing'),null);
assert.equal(routing.resolvePath('/for/figma').type,'for');
assert.equal(routing.resolvePath('/for/elsewhere'),null);
assert.equal(routing.routeFor('//external.test/works'),null);
assert.equal(routing.routeFor('/works/missing'),null);
console.log('PASS: 25 original artwork routes; 5 Systems entries with Maoxianjia direct/roundtrip routing and Genshin preserved as Coming Soon; desk/archive/case/model plus Other Project/FIELD01/Brand & Motion routes and legacy links; no invented Coming Soon routes; product index, Ready for agents and Atelier with the design-to-code appendix, two cases in progress, Roco and League redirected to Systems, and /for/figma.');
