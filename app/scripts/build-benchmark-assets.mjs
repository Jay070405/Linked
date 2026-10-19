// Copies what the Ready for agents page needs from the design-to-code benchmark (p2-benchmark), unchanged:
//   public/proto/benchmark/<run>/index.html   the two generated pricing pages the "Try the finding" demo re-themes
//                                             (S2-L0-r1, from the raw file; S2-L0V-r1, the same file plus variables)
//
//   node scripts/build-benchmark-assets.mjs [path-to-p2-benchmark]
//
// The pages are copied byte for byte: they are the agents' own output, including their Google Fonts link for Inter.
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, '..');
const bench = path.resolve(process.argv[2] || process.env.P2_BENCHMARK || path.join(app, '../../../视觉设计作品集/p2-benchmark'));
const log = [];

for (const run of ['S2-L0-r1', 'S2-L0V-r1']) {
  const to = path.join(app, 'public/proto/benchmark', run);
  await fs.mkdir(to, {recursive: true});
  await fs.copyFile(path.join(bench, 'runs', run, 'index.html'), path.join(to, 'index.html'));
  log.push(`page ${run}`);
}

console.log(`Benchmark assets:\n  ${log.join('\n  ')}`);
