/** Small, dependency-free SVG helpers shared by the patterns. */

export type Pt = [number, number];

/** A number for SVG output: at most 3 decimals, no trailing zeros, no "-0". */
export function num(n: number): string {
  const r = Math.round(n * 1000) / 1000;
  return Object.is(r, -0) ? '0' : String(r);
}

export const pt = ([x, y]: Pt): string => `${num(x)} ${num(y)}`;

/** Closed polygon as path data. */
export const polygonD = (pts: Pt[]): string => `M${pts.map(pt).join('L')}Z`;

export const rotate = ([x, y]: Pt, a: number): Pt => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];

export interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function boxOf(points: Pt[]): Box {
  const b: Box = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const [x, y] of points) {
    b.minX = Math.min(b.minX, x);
    b.minY = Math.min(b.minY, y);
    b.maxX = Math.max(b.maxX, x);
    b.maxY = Math.max(b.maxY, y);
  }
  return b;
}

export const grow = (b: Box, d: number): Box => ({ minX: b.minX - d, minY: b.minY - d, maxX: b.maxX + d, maxY: b.maxY + d });

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
const escAttr = (s: string) => s.replace(/[&<>"]/g, (c) => ESC[c]!);

/**
 * Wraps drawing elements in a standalone SVG document. The viewBox is the box, rounded outwards
 * to whole pixels so the output has integer width and height.
 */
export function svgDocument(box: Box, body: string, opts: { background?: string; title?: string } = {}): { svg: string; width: number; height: number } {
  const x = Math.floor(box.minX);
  const y = Math.floor(box.minY);
  const width = Math.ceil(box.maxX) - x;
  const height = Math.ceil(box.maxY) - y;
  const bg = opts.background && opts.background !== 'none' ? `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${opts.background}"/>` : '';
  const title = opts.title ? `<title>${escAttr(opts.title)}</title>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${x} ${y} ${width} ${height}">${title}${bg}${body}</svg>`;
  return { svg, width, height };
}

/** The painted-ribbon look of a chest: an ink outline, a coloured band and a thin centre line. */
export interface Ribbon {
  /** Width of the coloured band, px. */
  width: number;
  /** Ink outline on each side of the band, px. */
  outline: number;
  /** Width of the centre line, px. 0 draws none. */
  centreWidth: number;
  ink: string;
  fill: string;
  centre: string;
}

/** Half the full width of a ribbon, outline included. */
export const ribbonHalf = (r: Ribbon): number => r.width / 2 + r.outline;

/**
 * The three strokes of a ribbon along path data d. Drawing every outline before every fill is what
 * lets overlapping parts of one ribbon merge without seams, so callers pass all the ribbon's path
 * data in one string.
 */
export function ribbonStrokes(d: string, r: Ribbon, cap: 'butt' | 'round' | 'square', join: 'miter' | 'round'): string {
  const stroke = (color: string, w: number) =>
    `<path d="${d}" fill="none" stroke="${color}" stroke-width="${num(w)}" stroke-linecap="${cap}" stroke-linejoin="${join}"${join === 'miter' ? ' stroke-miterlimit="4"' : ''}/>`;
  let out = '';
  if (r.outline > 0 && r.ink !== 'none') out += stroke(r.ink, r.width + 2 * r.outline);
  if (r.fill !== 'none') out += stroke(r.fill, r.width);
  if (r.centreWidth > 0 && r.centre !== 'none') out += stroke(r.centre, Math.min(r.centreWidth, r.width));
  return out;
}

/**
 * Path data for a circular arc from a to b about centre c that passes on the side of `through`
 * (any point on the wanted side of the chord, e.g. the outermost point of a loop).
 */
export function arcTo(a: Pt, b: Pt, c: Pt, through: Pt): string {
  const r = Math.hypot(a[0] - c[0], a[1] - c[1]);
  const ang = (p: Pt) => Math.atan2(p[1] - c[1], p[0] - c[0]);
  const ccwDist = (from: number, to: number) => {
    const d = (to - from) % (2 * Math.PI);
    return d < 0 ? d + 2 * Math.PI : d;
  };
  const ta = ang(a);
  const tb = ang(b);
  const tm = ang(through);
  // SVG's sweep flag 1 is the direction of increasing angle, which is clockwise on screen (y down).
  const positive = ccwDist(ta, tm) < ccwDist(ta, tb);
  const sweep = positive ? ccwDist(ta, tb) : ccwDist(tb, ta);
  const large = sweep > Math.PI + 1e-9 ? 1 : 0;
  return `A${num(r)} ${num(r)} 0 ${large} ${positive ? 1 : 0} ${pt(b)}`;
}

/** Points along the same arc as arcTo, for bounding boxes and tests. */
export function arcPoints(a: Pt, b: Pt, c: Pt, through: Pt, n = 16): Pt[] {
  const r = Math.hypot(a[0] - c[0], a[1] - c[1]);
  const ang = (p: Pt) => Math.atan2(p[1] - c[1], p[0] - c[0]);
  const norm = (d: number) => ((d % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const ta = ang(a);
  const positive = norm(ang(through) - ta) < norm(ang(b) - ta);
  const sweep = positive ? norm(ang(b) - ta) : -norm(ta - ang(b));
  const out: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = ta + (sweep * i) / n;
    out.push([c[0] + r * Math.cos(t), c[1] + r * Math.sin(t)]);
  }
  return out;
}

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
export const isColor = (s: string): boolean => HEX.test(s);
