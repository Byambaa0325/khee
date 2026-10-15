/**
 * Renders a pattern to SVG and PNG files from the command line.
 *   npm run render -- ulzii out/ulzii n=5 loops=square
 * Writes <out>.svg and <out>.png. Parameters are the same as the web generator's query string.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { parseValues, patternById } from '../src/lib/index.js';

const [id, out, ...pairs] = process.argv.slice(2);
const pattern = id ? patternById(id) : undefined;
if (!pattern || !out) {
  console.error('usage: npm run render -- <ulzii|alkhan|ugalz> <out path without extension> [key=value ...]');
  process.exit(2);
}
const values = parseValues(pattern.params, Object.fromEntries(pairs.map((p) => p.split('=') as [string, string])));
const r = pattern.render(values);
mkdirSync(dirname(out), { recursive: true });
writeFileSync(`${out}.svg`, r.svg);
writeFileSync(`${out}.png`, new Resvg(r.svg, { fitTo: { mode: 'zoom', value: 2 } }).render().asPng());
for (const w of r.warnings) console.warn('warning:', w.en);
if (r.css) console.log(r.css);
console.log(`${out}.svg ${r.width}×${r.height}`);
