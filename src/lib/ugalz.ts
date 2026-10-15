/**
 * Ugalz (угалз), horn and cloud scrolls.
 *
 * Rule: a scroll is a chain of tangent quarter-circle arcs whose radius shrinks by a fixed ratio q at
 * each arc, as in the documented Chinese auspicious-cloud construction and the classical compass
 * construction of the Ionic volute. With r_k = R·q^k the chain follows a logarithmic spiral that grows
 * q⁻⁴ per turn to within 1.4 % for any q ≥ 0.6, and it is exact in SVG: one arc command per quarter
 * turn. The band's edges are concentric arcs, so a constant-width ribbon is exact too.
 *
 * No measured value of q exists for Mongolian ugalz; the default is a starting point, not a canon.
 */
import { PALETTE, ribbonOf, ribbonParams } from './common.js';
import { boolOf, numOf, strOf, t, type Pattern, type Rendered, type Text, type Values } from './schema.js';
import { boxOf, grow, num, pt, ribbonHalf, ribbonStrokes, rotate, svgDocument, type Pt } from './svg.js';

export interface Scroll {
  /** Path data starting with M. */
  d: string;
  /** Points on the centre line, in order, each with the angle turned so far (radians). */
  samples: { p: Pt; turned: number }[];
  /** Each arc's centre, radius and end point, in order. */
  arcs: { centre: Pt; radius: number; end: Pt }[];
}

/**
 * A chain of quarter arcs from `start`, heading `heading` (radians, screen coordinates: 0 is +x and
 * angles grow clockwise on screen). turn = +1 curls clockwise on screen, −1 anticlockwise.
 */
export function arcChain(start: Pt, heading: number, r0: number, q: number, arcs: number, turn: 1 | -1, lead = 0): Scroll {
  let p: Pt = start;
  let h: Pt = [Math.cos(heading), Math.sin(heading)];
  let d = `M${pt(p)}`;
  const samples: Scroll['samples'] = [{ p, turned: 0 }];
  const arcList: Scroll['arcs'] = [];
  if (lead > 0) {
    p = [p[0] + h[0] * lead, p[1] + h[1] * lead];
    d += `L${pt(p)}`;
    samples.push({ p, turned: 0 });
  }
  let turned = 0;
  for (let k = 0; k < arcs; k++) {
    const r = r0 * q ** k;
    // Centre on the inside of the turn; after a quarter turn the point is c + r·h and the heading is n.
    const n: Pt = turn > 0 ? [-h[1], h[0]] : [h[1], -h[0]];
    const c: Pt = [p[0] + r * n[0], p[1] + r * n[1]];
    const end: Pt = [c[0] + r * h[0], c[1] + r * h[1]];
    for (let i = 1; i <= 8; i++) {
      const a = (i / 8) * (Math.PI / 2);
      // Point at angle a along the arc: c − r·n·cos a + r·h·sin a.
      samples.push({ p: [c[0] - r * n[0] * Math.cos(a) + r * h[0] * Math.sin(a), c[1] - r * n[1] * Math.cos(a) + r * h[1] * Math.sin(a)], turned: turned + a });
    }
    d += `A${num(r)} ${num(r)} 0 0 ${turn > 0 ? 1 : 0} ${pt(end)}`;
    arcList.push({ centre: c, radius: r, end });
    p = end;
    h = n;
    turned += Math.PI / 2;
  }
  return { d, samples, arcs: arcList };
}

/**
 * Smallest gap between the edges of neighbouring whorls of one scroll, px: the distance between centre
 * line points a full turn or more apart, less the ribbon's full width. Negative means the band overlaps.
 */
export function whorlClearance(scroll: Scroll, fullWidth: number): number {
  let min = Infinity;
  const s = scroll.samples;
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j < s.length; j++) {
      if (s[j]!.turned - s[i]!.turned < 1.75 * Math.PI) continue;
      min = Math.min(min, Math.hypot(s[i]!.p[0] - s[j]!.p[0], s[i]!.p[1] - s[j]!.p[1]));
    }
  }
  return min - fullWidth;
}

/**
 * Smallest centre radius at which neighbouring motifs of an n-fold rosette keep `gap` px between
 * their centre lines (bisection; the distance grows with the radius).
 */
export function fitHub(motif: (a: number, out: number) => Scroll[], n: number, gap: number): number {
  const minDist = (hub: number) => {
    const a = motif(0, hub).flatMap((s) => s.samples.map((x) => x.p));
    const b = motif((2 * Math.PI) / n, hub).flatMap((s) => s.samples.map((x) => x.p));
    let min = Infinity;
    for (const p of a) for (const q of b) min = Math.min(min, Math.hypot(p[0] - q[0], p[1] - q[1]));
    return min;
  };
  let lo = 0;
  let hi = 4000;
  if (minDist(lo) >= gap) return lo;
  for (let i = 0; i < 30; i++) {
    const mid = (lo + hi) / 2;
    if (minDist(mid) >= gap) hi = mid;
    else lo = mid;
  }
  return Math.ceil(hi);
}

const ROSETTE_ORDERS =['2', '3', '4', '5', '6', '8', '10', '12', '16'];

export const ugalz: Pattern = {
  id: 'ugalz',
  name: t('Ugalz · horn scrolls', 'Угалз хээ'),
  summary: t(
    'Scrolls drawn as chains of quarter circles, each smaller than the last by a fixed ratio: a compass construction of a logarithmic spiral.',
    'Дугуйн дөрөвний нэг нумуудыг тогтмол харьцаагаар багасган залгаж буй эргүүлэг: логарифм спиралийг циркулиар бүтээх арга.',
  ),
  params: [
    {
      key: 'form',
      kind: 'choice',
      group: 'shape',
      label: t('Form', 'Хэлбэр'),
      options: [
        { value: 'horns', label: t('Pair of horns', 'Эвэр угалз') },
        { value: 'single', label: t('Single scroll', 'Дан угалз') },
        { value: 'rosette', label: t('Rosette', 'Тойрог угалз') },
      ],
      default: 'horns',
    },
    {
      key: 'curl',
      kind: 'choice',
      group: 'shape',
      label: t('Curl', 'Эргэлт'),
      options: [
        { value: 'out', label: t('Outwards', 'Гадагш') },
        { value: 'in', label: t('Inwards', 'Дотогш') },
      ],
      default: 'out',
    },
    {
      key: 'ratio',
      kind: 'number',
      group: 'shape',
      label: t('Shrink per quarter turn', 'Дөрөвний нэг эргэлт тутмын багасалт'),
      min: 0.5,
      max: 0.95,
      step: 0.01,
      default: 0.8,
      hint: t('Each arc is this fraction of the one before. Lower curls tighter.', 'Нум бүр өмнөхийнхөө энэ хувь. Бага утга нь илүү нягт эргэлдэнэ.'),
    },
    { key: 'arcs', kind: 'number', group: 'shape', label: t('Quarter turns', 'Дөрөвний нэг эргэлт'), min: 1, max: 16, step: 1, default: 6 },
    {
      key: 'count',
      kind: 'choice',
      group: 'shape',
      label: t('Rosette repeats', 'Тойргийн давталт'),
      options: ROSETTE_ORDERS.map((n) => ({ value: n, label: t(n, n) })),
      default: '6',
      hint: t('The orders recorded for Mongolian ornament.', 'Монгол хээнд тэмдэглэгдсэн давталтын тоо.'),
    },
    { key: 'ring', kind: 'bool', group: 'shape', label: t('Ring in the rosette', 'Тойргийн цагираг'), default: true },
    { key: 'radius', kind: 'number', group: 'size', label: t('First arc radius', 'Эхний нумын радиус'), min: 4, max: 200, step: 1, default: 40, unit: 'px' },
    { key: 'stem', kind: 'number', group: 'size', label: t('Stem length', 'Ишний урт'), min: 0, max: 200, step: 1, default: 30, unit: 'px' },
    {
      key: 'hub',
      kind: 'number',
      group: 'size',
      label: t('Rosette centre radius', 'Тойргийн төвийн радиус'),
      min: 0,
      max: 400,
      step: 1,
      default: 0,
      unit: 'px',
      hint: t('0 fits the repeats as close as they go without touching.', '0 бол давталтуудыг хүрэлцэхгүй хамгийн ойр байрлуулна.'),
    },
    ...ribbonParams({ width: 9, outline: 2.5, centre: 2, fill: PALETTE.green, centreColor: PALETTE.yellow }),
  ],
  palette: { ink: 'outline', fill: 'band', line: 'line', bg: 'ground' },
  thumbnail: { form: 'horns', radius: 16, stem: 10, band: 4.5, outline: 1.25, centre: 1, padding: 3 },
  render(v: Values): Rendered {
    const warnings: Text[] = [];
    const ribbon = ribbonOf(v);
    const half = ribbonHalf(ribbon);
    const q = numOf(v, 'ratio');
    const r0 = numOf(v, 'radius');
    const form = strOf(v, 'form');
    const outwards = strOf(v, 'curl') === 'out';
    const stem = numOf(v, 'stem');
    const up = -Math.PI / 2;

    // Stop curling before the band would overlap the previous whorl or run out of radius.
    const asked = numOf(v, 'arcs');
    let arcs = asked;
    while (arcs > 1 && (r0 * q ** (arcs - 1) < half || whorlClearance(arcChain([0, 0], up, r0, q, arcs, 1, stem), 2 * half) < 0)) arcs--;
    if (arcs < asked) {
      warnings.push(
        t(
          `Stopped at ${arcs} quarter turns: another would overlap the band. Raise the shrink ratio or narrow the band for more.`,
          `${arcs} эргэлтэд зогсов: дахин эргэвэл тууз давхцана. Илүү эргэлт хэрэгтэй бол харьцааг ихэсгэх эсвэл туузыг нарийсгана уу.`,
        ),
      );
    }

    // One motif in local coordinates: the stem rises from (0, 0) to (0, −stem), then the horns curl,
    // the left one anticlockwise and the right one clockwise when they curl outwards.
    const turns: (1 | -1)[] = form === 'single' ? [outwards ? 1 : -1] : [outwards ? -1 : 1, outwards ? 1 : -1];
    /** The motif turned by angle a about the origin and moved out to radius `out`. */
    const motif = (a: number, out: number) => turns.map((turn) => arcChain(rotate([0, -out], a), up + a, r0, q, arcs, turn, stem));
    const scrolls = motif(0, 0);
    if (form === 'horns' && !outwards) {
      // Inward horns curl towards each other; check that the two do not cross.
      const a = scrolls[0]!.samples;
      const b = scrolls[1]!.samples;
      let min = Infinity;
      for (const s of a) if (s.turned > 0) for (const u of b) if (u.turned > 0) min = Math.min(min, Math.hypot(s.p[0] - u.p[0], s.p[1] - u.p[1]));
      if (min < 2 * half) warnings.push(t('The two horns run into each other.', 'Хоёр эвэр хоорондоо давхцаж байна.'));
    }

    let d = '';
    let points: Pt[] = [];
    if (form === 'rosette') {
      const n = Number(strOf(v, 'count'));
      const hub = numOf(v, 'hub') > 0 ? numOf(v, 'hub') : fitHub(motif, n, 2 * half + Math.max(2, half / 2));
      for (let k = 0; k < n; k++) {
        for (const s of motif((2 * Math.PI * k) / n, hub)) {
          d += s.d;
          points.push(...s.samples.map((x) => x.p));
        }
      }
      if (boolOf(v, 'ring') && hub > 0) {
        d += `M${num(hub)} 0A${num(hub)} ${num(hub)} 0 1 1 ${num(-hub)} 0A${num(hub)} ${num(hub)} 0 1 1 ${num(hub)} 0Z`;
        points.push([hub, 0], [-hub, 0], [0, hub], [0, -hub]);
      }
    } else {
      for (const s of scrolls) {
        d += s.d;
        points.push(...s.samples.map((x) => x.p));
      }
    }
    if (points.length === 0) points = [[0, 0]];
    const body = ribbonStrokes(d, ribbon, 'round', 'round');
    const box = grow(boxOf(points), half + numOf(v, 'padding'));
    return { ...svgDocument(box, body, { background: strOf(v, 'bg'), title: 'Ugalz' }), warnings };
  },
};
