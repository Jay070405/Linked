import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registerHooks} from 'node:module';
import {ARDEN_PARTS} from './arden-parts.js';

// Node does not resolve Vite's extensionless JSX imports. Load the real i18n
// module, translating its single Provider JSX expression for this data test.
const i18n=new URL('../product/i18n.jsx',import.meta.url).href;
const hook=registerHooks({
  resolve(specifier,context,next) {
    if(specifier==='../../i18n'&&context.parentURL?.endsWith('/arden/content.js'))return {url:i18n,shortCircuit:true};
    return next(specifier,context);
  },
  load(url,context,next) {
    if(url===i18n) return {format:'module',shortCircuit:true,source:"import {createElement} from 'react';\n"+readFileSync(new URL(url),'utf8').replace("<LangContext.Provider value={lang === 'zh' ? 'zh' : 'en'}>{children}</LangContext.Provider>","createElement(LangContext.Provider, {value:lang === 'zh' ? 'zh' : 'en'}, children)")};
    return next(url,context);
  },
});
let PARTS;
try { ({PARTS}=await import('../product/worlds/arden/content.js')); } finally {hook.deregister();}
test('homepage names match all 27 real Arden case-page parts in both languages',()=>{
  assert.equal(ARDEN_PARTS.length,27);
  assert.deepEqual(ARDEN_PARTS,PARTS.map(({id,n,name})=>({id,n,en:name.en,zh:name.zh})));
});
