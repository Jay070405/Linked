import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { allWorks, systems } from '../src/portfolioData.js';
const result = await build({entryPoints:['src/usePortfolioRouting.js'],bundle:true,platform:'node',format:'esm',write:false});
const routing = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
assert.equal(routing.resolvePath('/works').type,'desk');
assert.equal(routing.resolvePath('/works/archive').type,'archive');
assert.equal(routing.resolvePath('/vibecoding').type,'vibecoding');
assert.equal(routing.resolvePath('/vibecoding/field01/').type,'field01');
assert.equal(routing.routeFor({type:'vibecoding'}),'/vibecoding');
assert.equal(routing.routeFor({type:'field01'}),'/vibecoding/field01');
assert.equal(routing.routeFor('/vibecoding/experiment-02'),null);
assert.equal(routing.resolvePath('/field01/assets/missing.glb'),null);
assert.equal(routing.resolvePath('/systems/roco').type,'system');
assert.equal(routing.resolvePath('/systems/roco/model').type,'model');
assert.equal(new Set(allWorks.map(w=>w.href)).size,25);
for (const work of allWorks) {
  assert.equal(routing.resolvePath(work.href).item.id,work.id);
  assert.equal(routing.routeFor({type:'art',item:work}),work.href);
}
for (const system of systems.filter(s=>s.status==='coming-soon')) {
  assert.equal(routing.resolvePath('/systems/'+system.slug),null);
  assert.equal(routing.routeFor({type:'system',item:system}),null);
}
assert.equal(routing.routeFor('//external.test/works'),null);
assert.equal(routing.routeFor('/works/missing'),null);
console.log('PASS: 25 original artwork routes; desk/archive/case/model plus Vibe coding/FIELD01 routes; no invented Coming Soon routes.');
