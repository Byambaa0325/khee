export * from './schema.js';
export { PALETTE } from './common.js';
export { ulzii, ulziiGeometry, ulziiCircuits, oppositeOf, endsOf, type End, type Side, type UlziiGeometry, type UlziiShape } from './ulzii.js';
export { alkhan, alkhanGeometry, bandRects, sideLength, BAND, PERIOD, type AlkhanGeometry, type AlkhanShape, type Corner, type Layout } from './alkhan.js';
export { ugalz, arcChain, whorlClearance, type Scroll } from './ugalz.js';

import { alkhan } from './alkhan.js';
import type { Pattern } from './schema.js';
import { ugalz } from './ugalz.js';
import { ulzii } from './ulzii.js';

/** Every pattern, in the order the generator lists them. */
export const PATTERNS: Pattern[] = [ulzii, alkhan, ugalz];
export const patternById = (id: string): Pattern | undefined => PATTERNS.find((p) => p.id === id);
export type { Pt, Ribbon } from './svg.js';
export { PALETTES, CHIPS, paletteValues, matchingPalette, type Palette, type Role } from './palettes.js';
