import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
const binary = readFileSync(new URL('./card.glb', import.meta.url));
if (binary.toString('utf8', 0, 4) !== 'glTF') throw new Error('Invalid Lanyard GLB');
const model = JSON.parse(binary.subarray(20, 20 + binary.readUInt32LE(12)).toString('utf8'));
for (const name of ['card', 'clip', 'clamp']) if (!model.nodes.some(node => node.name === name)) throw new Error(`Missing Lanyard node ${name}`);
const base = model.materials.find(material => material.name === 'base');
if (!base?.pbrMetallicRoughness?.baseColorTexture) throw new Error('Lanyard base texture atlas missing');
for (const asset of ['jay-badge-front.svg', 'jay-badge-back.svg', 'jay-lanyard.svg']) {
  const svg = readFileSync(new URL(`./assets/${asset}`, import.meta.url), 'utf8');
  if (!svg.includes('<svg') || !svg.includes('width=') || !svg.includes('height=')) throw new Error(`Invalid ${asset}`);
}
console.log('Validated Lanyard card/clip/clamp geometry, base texture atlas and custom SVG textures');
const files = ['SiteNavigation', 'AboutPanel', 'SplitFlapText', 'ParticleText', 'CountUp', 'FlowingMenu', 'GlassSurface'];
for (const file of files) {
  await build({ entryPoints: [fileURLToPath(new URL(`./${file}.jsx`, import.meta.url))], bundle: true, write: false, outdir: 'component-validation', platform: 'browser', format: 'esm', loader: { '.glb': 'dataurl', '.svg': 'dataurl', '.png': 'dataurl' }, logLevel: 'error' });
  console.log(`Compiled ${file}`);
}
