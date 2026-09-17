// Audited V6 fixtures are independent of the port under test. No new random draws.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const directory=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(directory,'../..');
const source=path.resolve(root,'tests/fixtures/v6-model');
const require=createRequire(import.meta.url);
async function load(file){
 const {outputFiles}=await build({entryPoints:[path.join(directory,file)],bundle:true,platform:'node',format:'cjs',jsx:'automatic',write:false,external:['react','react-dom'],loader:{'.css':'empty'}});
 const module={exports:{}};vm.runInNewContext(outputFiles[0].text,{module,exports:module.exports,require,console,Intl,Math,Number,JSON},{filename:file});return module.exports;
}
const core=await load('roco-model-core.js');
const fixturePresets=JSON.parse(fs.readFileSync(path.join(source,'model-presets.json'),'utf8'));
const fixtureLedger=JSON.parse(fs.readFileSync(path.join(source,'model-ledger.json'),'utf8'));
const originalPresets=Array.isArray(fixturePresets)?fixturePresets:fixturePresets.presets;
const originalRows=fixtureLedger.records;
let assertions=0;
function check(condition,message){assert.ok(condition,message);assertions++;}
function equal(actual,expected,message){if(typeof expected==='number')check(Math.abs(actual-expected)<=Math.max(1,Math.abs(expected))*1e-12,`${message}: ${actual} != ${expected}`);else check(actual===expected,`${message}: ${actual} != ${expected}`);}
for(const fixture of originalPresets){const result=core.calculate(fixture.balls,fixture.income_multiplier_scenario);equal(result.status,fixture.status,fixture.id+' status');for(const [key,value]of Object.entries(fixture.outputs))equal(result.outputs[key],value,fixture.id+' '+key);}
for(const fixture of originalRows.filter(row=>row.kind==='simulated')){const result=core.calculate(fixture.balls,fixture.income_multiplier_scenario);for(const [key,value]of Object.entries(fixture.expected))equal(result.outputs[key],value,fixture.id+' '+key);check(fixture.eligible_for_calibration===false&&fixture.eligible_for_observed_summary===false,fixture.id+' is not evidence');}
check(core.observed.length===10&&core.simulations.length===10,'10 observations and 10 simulations');
for(const key of core.BALL_KEYS){const cal=core.calibration[key];const rows=core.observed.filter(row=>cal.source_observed_ids.includes(row.id));equal(rows.length,cal.batch_count,key+' batch count');equal(rows.reduce((s,row)=>s+row.balls[key],0),cal.balls,key+' source balls');equal(rows.reduce((s,row)=>s+row.shiny_records_observed,0),cal.shiny_records,key+' source shiny');equal(rows.reduce((s,row)=>s+row.material_observed,0),cal.material,key+' source material');equal(rows.reduce((s,row)=>s+row.raw_income_observed,0),cal.raw_income,key+' source income');check(rows.every(row=>row.eligible_for_calibration&&core.BALL_KEYS.every(k=>k===key||row.balls[k]===0)),key+' is single-ball observed only');}
const totals={total_balls:6632,shiny_records_observed:13,material_observed:499,raw_income_observed:144462100,personal_ball_cost:243202000};
for(const [key,expected]of Object.entries(totals))equal(core.observed.reduce((sum,row)=>sum+row[key],0),expected,'observed '+key);
equal(core.observed.filter(row=>!row.eligible_for_calibration).length,4,'mixed excluded batches');
for(const value of [-1,.5,NaN,Infinity,Number.MAX_SAFE_INTEGER,null,false,'500',undefined])equal(core.calculate({fairy:value,advanced:0,net:0},2).status,'invalid','invalid count '+String(value));
for(const value of [0,-1,NaN,Infinity,null,true,'2'])equal(core.calculate({fairy:1,advanced:0,net:0},value).status,'invalid','invalid multiplier '+String(value));
for(const raw of [null,{}, {fairy:'',advanced:'0',net:'0'},{fairy:'1.5',advanced:'0',net:'0'},{fairy:'-1',advanced:'0',net:'0'},{fairy:'1e3',advanced:'0',net:'0'}])equal(core.parseCounts(raw),null,'invalid UI input');
const zero=core.calculate({fairy:0,advanced:0,net:0},2);equal(zero.status,'empty','zero status');equal(zero.outputs.expected_income_cost_ratio,null,'zero does not imply payback');equal(zero.outputs.picture_book_income_model,null,'book income is unmodeled');
const one=core.calculate({fairy:500,advanced:500,net:0},1).outputs,two=core.calculate({fairy:500,advanced:500,net:0},2).outputs;
for(const key of ['expected_shiny_records','probability_at_least_one_under_assumptions','expected_material','personal_ball_cost'])equal(one[key],two[key],'multiplier preserves '+key);
equal(two.expected_conditional_income,one.expected_conditional_income*2,'income multiplier only');
check(JSON.stringify(core.simulations.map(row=>row.shiny_count_model_draw))==='[0,1,1,1,1,1,2,2,0,0]','canonical saved draw sequence unchanged');
const pages=[['RocoCase.jsx','case'],['RocoModel.jsx','model']];
const spec=JSON.parse(fs.readFileSync(path.join(directory,'roco-spec-data.json'),'utf8'));
equal(spec.s3Tables.length,11,'complete S3 configuration');
equal(spec.s5Tables.length,11,'complete S5 configuration');
for(const table of [...spec.s3Tables,...spec.s5Tables])check(table.rows.length>=4&&table.rows.every(row=>row.length===table.rows[0].length),table.title+' preserves three headers and aligned data');
for(const [scheme,count]of [['A',5],['B',9]])equal(spec.s5Tables.filter((table,i)=>i<3||table.title.startsWith(scheme)).length,count,scheme+' includes shared and scheme-specific tables');
for(const image of [...spec.functions.flatMap(step=>step.images),...spec.wireframes])check(fs.existsSync(path.join(root,'public',image.src)),'source screenshot exists '+image.src);
for(const name of ['s3-flow','s5-a-flow','s5-b-flow'])for(const extension of ['jpg','svg'])check(fs.existsSync(path.join(root,'public/assets/roco/current',name+'.'+extension)),'flow asset exists '+name+'.'+extension);
for(const [file,name]of pages){const {default:Component}=await load(file);for(const lang of ['zh','en']){const html=renderToStaticMarkup(React.createElement(Component,{lang,reduced:true,onNavigate:()=>{}}));check(html.includes('rco-page'),'renders '+name+' '+lang);check(!/>NaN</.test(html)&&!/>undefined</.test(html),'no unresolved values '+name+' '+lang);for(const asset of [...new Set([...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)/g)].map(match=>match[1]))])check(fs.existsSync(path.join(root,'public',asset)),'local resource exists '+asset);}}
console.log(`PASS: ${assertions} assertions; four canonical presets, ten canonical simulation expectations, calibration lineage, observed totals, invalid/empty inputs, multiplier invariants, and four bilingual server renders.`);
