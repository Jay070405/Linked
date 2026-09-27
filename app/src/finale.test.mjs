import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {build} from 'esbuild';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const {outputFiles} = await build({entryPoints: [path.join(here, 'Finale.jsx')], bundle: true, platform: 'node', format: 'cjs', jsx: 'automatic', write: false, external: ['react', 'react-dom', 'three', 'gsap', 'gsap/ScrollTrigger'], loader: {'.css': 'empty'}});
const module = {exports: {}};
vm.runInNewContext(outputFiles[0].text, {module, exports: module.exports, require, console, URL}, {filename: 'Finale.jsx'});
const Finale = module.exports.default;
const render = props => renderToStaticMarkup(React.createElement(Finale, {onAbout() {}, ...props}));

const PHILOSOPHY = {
  zh: '我希望作品不只被看见，也能让人愿意走近、探索，并留下来。规则赋予选择意义，画面让世界值得相信。真正打动人的体验，藏在两者相遇的地方。',
  en: 'I want to make work that invites people to come closer, explore, and stay. Rules give choices meaning. Images make a world believable. The experiences that stay with us happen where the two meet.',
};

for (const lang of ['zh', 'en']) for (const reduced of [false, true]) {
  test(`renders · ${lang}${reduced ? ' · reduced motion' : ''}`, () => {
    const html = render({lang, reduced});
    assert.ok(!/undefined|\[object Object\]/.test(html), 'nothing leaked into the markup');
    assert.match(html, /<section[^>]*class="finale-journey"[^>]*id="practice"/);
    assert.match(html, new RegExp(`data-nav-tone="${reduced ? 'dark' : 'light'}"`));
    assert.equal((html.match(/class="mask"/g) || []).length, 8, 'eight masked lines');
    assert.ok(!html.includes('expressive-title'), 'the scrubbed titles do not use the one-shot ExpressiveTitle');
    assert.match(html, /class="world-scene"/, 'the 3D mount renders on the server');
    assert.ok(!/blossom-scene|finale-halo|philosophy-ribbon/.test(html), 'the old blossom layers are gone');
  });

}

const TITLE = {zh: ['从一个念头，', '到一个世界。'], en: ['FROM A THOUGHT,', 'TO A WORLD.']};

for (const lang of ['zh', 'en']) {
  test(`the title is set letter by letter and still reads as one line each · ${lang}`, () => {
    const html = render({lang, reduced: false});
    const title = html.match(/<div class="bloom-title">(.*?)<\/div>/)[1];
    const lines = title.split('<span class="mask" aria-hidden="true">').slice(1).map(line => line.split('<span class="visually-hidden">')[0]);
    assert.deepEqual(lines.map(line => line.replace(/<[^>]+>/g, '')), TITLE[lang]);
    const letters = lines.map(line => [...line.matchAll(/<span class="ch">(.*?)<\/span>/g)].map(match => match[1]).join(''));
    assert.deepEqual(letters, TITLE[lang].map(line => line.replaceAll(' ', '')), 'every letter is its own layer');
    assert.match(title, new RegExp(`<span class="visually-hidden">${TITLE[lang].join(' ')}</span>`), 'assistive tech hears the whole title once');
  });
}

for (const lang of ['zh', 'en']) {
  test(`keeps the philosophy word for word · ${lang}`, () => {
    const paragraph = render({lang, reduced: false}).match(/<p class="reading-text">(.*?)<\/p>/)[1];
    const text = [...paragraph.matchAll(/<span>(.*?)<\/span>/g)].map(match => match[1]).join('');
    assert.equal(text.trim().replaceAll('&#x27;', "'"), PHILOSOPHY[lang]);
  });
}

test('every film-grade layer is decorative', () => {
  const html = render({lang: 'zh', reduced: false});
  for (const layer of ['finale-iris', 'finale-grain']) {
    assert.match(html, new RegExp(`class="${layer}"[^>]*aria-hidden="true"`), `${layer} is hidden from assistive tech`);
  }
});
