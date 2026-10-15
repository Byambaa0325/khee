/**
 * Alkhan khee (алхан хээ), the hammer border.
 *
 * Rule (J. Tömörkhuyag, "Хээ угалз бүтээх аргууд", 2010): ornament is laid out with a module stick,
 * and every stroke and every gap between strokes is one module wide. A band of interlocking T-shaped
 * hammers, hung alternately from the outer rule and the inner rule, then comes out 7 modules deep with
 * a repeat every 8 modules: outer rule, gap, head, gap, head, gap, inner rule. Heads are 5 modules
 * wide; stems are 3 modules long. The band has frieze symmetry p2mg.
 *
 * Corners are not documented. Here a side is mitred into the next along the corner diagonal, at a
 * phase where the meeting heads bend into a closed figure: "hook" (a squared spiral, every stroke
 * attached to a rule) or "box" (a square with a centre dot). Both keep every gap one module wide.
 *
 * Geometry is in module units; one SVG path of convex polygons, so abutting pieces merge without seams.
 */
import { PALETTE, frameParams } from './common.js';
import { numOf, strOf, t, type Pattern, type Rendered, type Values } from './schema.js';
import { num, polygonD, type Pt } from './svg.js';

export const BAND = 7;
export const PERIOD = 8;

export type Corner = 'hook' | 'box';
export type Layout = 'frame' | 'strip' | 'nineslice';

/**
 * Tile phase at each corner, and the side length (mod 8) that makes every side mirror-symmetric
 * about its middle, so that all four corners are the same figure.
 */
const CORNER: Record<Corner, { phase: number }> = {
  hook: { phase: 6 },
  box: { phase: 4 },
};
/** Side length in modules for p periods along a side, given the corner. */
export const sideLength = (corner: Corner, periods: number): number => PERIOD * periods + ((2 * CORNER[corner].phase + 1) % PERIOD);

interface Rect {
  u0: number;
  u1: number;
  v0: number;
  v1: number;
  /** Strokes hung from the inner rule can take an accent colour. */
  inner: boolean;
}

/**
 * The band's rectangles for u in [from, to], in band coordinates: u along the band, v across it
 * from the outer edge (0) to the inner edge (7). Tile origins sit at u = phase + 8k.
 */
export function bandRects(from: number, to: number, phase: number, stem: number): Rect[] {
  const rects: Rect[] = [
    { u0: from, u1: to, v0: 0, v1: 1, inner: false },
    { u0: from, u1: to, v0: 6, v1: 7, inner: false },
  ];
  const s = stem / 2;
  const k0 = Math.floor((from - phase) / PERIOD) - 1;
  const k1 = Math.ceil((to - phase) / PERIOD) + 1;
  for (let k = k0; k <= k1; k++) {
    const o = phase + k * PERIOD;
    // Hammer hung from the outer rule: stem down from v = 1, head at v = 4..5.
    rects.push({ u0: o + 0.5 - s, u1: o + 0.5 + s, v0: 1, v1: 4, inner: false });
    rects.push({ u0: o - 2, u1: o + 3, v0: 4, v1: 5, inner: false });
    // Hammer hung from the inner rule: stem up from v = 6, head at v = 2..3.
    rects.push({ u0: o + 4.5 - s, u1: o + 4.5 + s, v0: 3, v1: 6, inner: true });
    rects.push({ u0: o + 2, u1: o + 7, v0: 2, v1: 3, inner: true });
  }
  return rects.filter((r) => r.u1 > from && r.u0 < to);
}

/** Sutherland–Hodgman clip of a convex polygon by the half-plane a·u + b·v ≤ c. */
function clip(poly: Pt[], a: number, b: number, c: number): Pt[] {
  const out: Pt[] = [];
  const inside = (p: Pt) => a * p[0] + b * p[1] <= c + 1e-9;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    const pin = inside(p);
    const qin = inside(q);
    if (pin) out.push(p);
    if (pin !== qin) {
      const fp = a * p[0] + b * p[1] - c;
      const fq = a * q[0] + b * q[1] - c;
      const k = fp / (fp - fq);
      out.push([p[0] + k * (q[0] - p[0]), p[1] + k * (q[1] - p[1])]);
    }
  }
  return out;
}

const area = (poly: Pt[]) => Math.abs(poly.reduce((s, p, i) => s + p[0] * poly[(i + 1) % poly.length]![1] - poly[(i + 1) % poly.length]![0] * p[1], 0)) / 2;

export interface AlkhanShape {
  layout: Layout;
  corner: Corner;
  /** Periods along the top (strip length), and down the sides. */
  across: number;
  down: number;
  /** Stem width in modules (1 by the rule). */
  stem: number;
}

export interface AlkhanGeometry {
  /** Polygons in module units, outer-hung and inner-hung strokes. */
  outer: Pt[][];
  inner: Pt[][];
  /** Size in modules. */
  width: number;
  height: number;
  /** For a nine-slice border image: the slice width in modules. */
  slice?: number;
}

export function alkhanGeometry({ layout, corner, across, down, stem }: AlkhanShape): AlkhanGeometry {
  const outer: Pt[][] = [];
  const inner: Pt[][] = [];
  const add = (poly: Pt[], isInner: boolean) => {
    if (poly.length >= 3 && area(poly) > 1e-6) (isInner ? inner : outer).push(poly);
  };

  if (layout === 'strip') {
    // Phase 0 with length 8p + 1 starts and ends on an outer-hung stem, which closes both ends.
    const len = PERIOD * across + 1;
    for (const r of bandRects(0, len, 0, stem)) {
      let poly: Pt[] = [
        [r.u0, r.v0],
        [r.u1, r.v0],
        [r.u1, r.v1],
        [r.u0, r.v1],
      ];
      poly = clip(clip(poly, -1, 0, 0), 1, 0, len);
      add(poly, r.inner);
    }
    return { outer, inner, width: len, height: BAND };
  }

  // A nine-slice image is a square frame with one period between corners. The corner slice then
  // spans the band plus the margin that keeps the sides symmetric (see sideLength).
  const pAcross = layout === 'nineslice' ? 3 : across;
  const pDown = layout === 'nineslice' ? 3 : down;
  const W = sideLength(corner, pAcross);
  const H = sideLength(corner, pDown);
  const { phase } = CORNER[corner];

  // Band coordinates (u along, v inwards) to frame coordinates, side by side, clockwise. All four are
  // rotations, so polygon winding is kept and the nonzero fill merges the pieces.
  const sides: { len: number; map: (p: Pt) => Pt }[] = [
    { len: W, map: ([u, v]) => [u, v] },
    { len: H, map: ([u, v]) => [W - v, u] },
    { len: W, map: ([u, v]) => [W - u, H - v] },
    { len: H, map: ([u, v]) => [v, H - u] },
  ];
  for (const { len, map } of sides) {
    const rects = bandRects(0, len, phase, stem);
    if (corner === 'hook') {
      // Joins the bent head at each corner to the next outer-hung stem, so the hook hangs from a rule.
      rects.push({ u0: 4, u1: 6.5, v0: 2, v1: 3, inner: true });
      rects.push({ u0: len - 6.5, u1: len - 4, v0: 2, v1: 3, inner: true });
    }
    for (const r of rects) {
      let poly: Pt[] = [
        [r.u0, r.v0],
        [r.u1, r.v0],
        [r.u1, r.v1],
        [r.u0, r.v1],
      ];
      // The mitres: v ≤ u and v ≤ len − u.
      poly = clip(clip(poly, -1, 1, 0), 1, 1, len);
      add(poly.map(map), r.inner);
    }
  }
  const slice = layout === 'nineslice' ? (W - PERIOD) / 2 : undefined;
  return { outer, inner, width: W, height: H, slice };
}

export const alkhan: Pattern = {
  id: 'alkhan',
  name: t('Alkhan khee · hammer border', 'Алхан хээ'),
  summary: t(
    'Interlocking hammers on a module grid: every stroke and every gap is one module. The band is 7 modules deep and repeats every 8.',
    'Модны аргаар бүтээсэн алх: зураас бүр, завсар бүр нэг мод. Хүрээ 7 мод өргөн, 8 мод тутамд давтагдана.',
  ),
  params: [
    {
      key: 'layout',
      kind: 'choice',
      group: 'shape',
      label: t('Layout', 'Хэлбэр'),
      options: [
        { value: 'frame', label: t('Frame', 'Хүрээ') },
        { value: 'strip', label: t('Strip', 'Тууз') },
        { value: 'nineslice', label: t('CSS border image', 'CSS хүрээ') },
      ],
      default: 'frame',
      hint: t('The CSS border image tiles around any box; the CSS to use is shown below the preview.', 'CSS хүрээ нь ямар ч хайрцгийг тойрон давтагдана; ашиглах CSS-ийг доор харуулна.'),
    },
    {
      key: 'corner',
      kind: 'choice',
      group: 'shape',
      label: t('Corner', 'Булан'),
      options: [
        { value: 'hook', label: t('Hook', 'Дэгээ') },
        { value: 'box', label: t('Box', 'Хайрцаг') },
      ],
      default: 'hook',
    },
    {
      key: 'across',
      kind: 'number',
      group: 'shape',
      label: t('Repeats across', 'Хөндлөн давталт'),
      min: 2,
      max: 40,
      step: 1,
      default: 5,
      hint: t('Frame width, or strip length. The CSS border image needs none: it tiles.', 'Хүрээний өргөн эсвэл туузны урт. CSS хүрээ өөрөө давтагдана.'),
    },
    {
      key: 'down',
      kind: 'number',
      group: 'shape',
      label: t('Repeats down', 'Босоо давталт'),
      min: 2,
      max: 40,
      step: 1,
      default: 3,
      hint: t('Frame height.', 'Хүрээний өндөр.'),
    },
    {
      key: 'stem',
      kind: 'number',
      group: 'shape',
      label: t('Stem width', 'Ишний өргөн'),
      min: 0.5,
      max: 1.75,
      step: 0.25,
      default: 1,
      unit: 'module',
      hint: t('1 module by the rule. Painted chests often have thicker stems.', 'Дүрмээр 1 мод. Будгийн авдарт иш нь ихэвчлэн бүдүүн байдаг.'),
    },
    { key: 'module', kind: 'number', group: 'size', label: t('Module', 'Мод'), min: 1, max: 40, step: 0.5, default: 8, unit: 'px' },
    { key: 'ink', kind: 'color', group: 'colour', label: t('Colour', 'Өнгө'), default: PALETTE.red },
    {
      key: 'accent',
      kind: 'color',
      group: 'colour',
      label: t('Inner hammers', 'Дотор алх'),
      default: 'none',
      allowNone: true,
      hint: t('None paints them like the rest.', 'Сонгоогүй бол бусадтай ижил өнгөтэй.'),
    },
    ...frameParams(0),
  ],
  render(v: Values): Rendered {
    const m = numOf(v, 'module');
    const geo = alkhanGeometry({
      layout: strOf(v, 'layout') as Layout,
      corner: strOf(v, 'corner') as Corner,
      across: numOf(v, 'across'),
      down: numOf(v, 'down'),
      stem: numOf(v, 'stem'),
    });
    const pad = numOf(v, 'padding');
    const scale = (polys: Pt[][]) => polys.map((p) => polygonD(p.map(([x, y]) => [x * m + pad, y * m + pad] as Pt))).join('');
    const ink = strOf(v, 'ink');
    const accent = strOf(v, 'accent');
    const width = Math.round(geo.width * m + 2 * pad);
    const height = Math.round(geo.height * m + 2 * pad);
    let body = '';
    if (accent === 'none') body = `<path d="${scale([...geo.outer, ...geo.inner])}" fill="${ink}"/>`;
    else body = `<path d="${scale(geo.outer)}" fill="${ink}"/><path d="${scale(geo.inner)}" fill="${accent}"/>`;
    const bg = strOf(v, 'bg');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${num(geo.width * m + 2 * pad)} ${num(geo.height * m + 2 * pad)}"><title>Alkhan khee</title>${bg !== 'none' ? `<rect width="100%" height="100%" fill="${bg}"/>` : ''}${body}</svg>`;
    const rendered: Rendered = { svg, width, height, warnings: [] };
    if (geo.slice !== undefined) {
      const slice = num(geo.slice * m + pad);
      rendered.css = `border: ${slice}px solid transparent;\nborder-image: url("alkhan.svg") ${slice} round;`;
    }
    return rendered;
  },
};
