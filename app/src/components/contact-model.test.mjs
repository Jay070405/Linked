import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {author} from '../portfolioData.js';
import {resumeFor,contactLinks,contactState,tabDestination} from './contact-model.js';
import {resolveProductPath,productRouteFor,isProductPath,productTitle} from '../product/content.js';

test('contact rows choose the actual EN/ZH PDFs and omit phone and unset LinkedIn',()=>{
  for(const lang of ['en','zh']) {
    const rows=contactLinks(author,lang);
    assert.deepEqual(rows.map(r=>r.id),['email','resume']);
    assert.equal(rows[0].href,`mailto:${author.email}`);
    assert.equal(rows[1].href,lang==='en'?'/assets/docs/jay-lin-resume-en.pdf':author.resume);
    assert.ok(existsSync(new URL(`../../public${resumeFor(author,lang)}`,import.meta.url)));
    assert.ok(!rows.some(r=>r.href.startsWith('tel:')));
  }
  assert.equal(contactLinks({...author,linkedin:'  '},'en').length,2);
  assert.equal(contactLinks({...author,linkedin:'https://www.linkedin.com/in/example'},'zh').at(-1).id,'linkedin');
});

test('contact closes on Escape and outside action; repeated open/close is stable',()=>{
  let state=contactState(false,'open');assert.equal(state,true);
  for(const action of ['escape','outside','close']){
    assert.equal(contactState(state,action),false);
    assert.equal(contactState(contactState(false,action),'open'),true);
  }
  assert.equal(contactState(true,'open'),true);
  assert.equal(contactState(false,'toggle'),true);
  assert.equal(contactState(true,'toggle'),false);
});

test('Tab cycles both ways including conditional LinkedIn and an unknown active element',()=>{
  for(const count of [4,5]) {
    assert.equal(tabDestination(count-1,count,false),0);
    assert.equal(tabDestination(0,count,true),count-1);
    assert.equal(tabDestination(-1,count,false),0);
    let i=0;for(let n=0;n<count;n++)i=tabDestination(i,count,false);assert.equal(i,0);
  }
  assert.equal(tabDestination(-1,0,false),-1);
});

test('/about resolves through the product entry with localized titles and deployment rewrite',()=>{
  for(const path of ['/about','/about/','/about?lang=zh#loop']) {
    assert.deepEqual(resolveProductPath(path),{type:'about'});assert.ok(isProductPath(path));
    assert.equal(productRouteFor(resolveProductPath(path)),'/about');
  }
  assert.equal(resolveProductPath('/about/missing'),null);assert.equal(isProductPath('/about/missing'),false);
  assert.equal(productTitle({type:'about'},'en'),'About');assert.equal(productTitle({type:'about'},'zh'),'关于我');
  const config=JSON.parse(readFileSync(new URL('../../vercel.json',import.meta.url),'utf8'));
  assert.ok(config.rewrites.some(r=>r.source==='/about'&&r.destination==='/product.html'));
  assert.ok(!config.redirects.some(r=>r.source==='/about'));
});
