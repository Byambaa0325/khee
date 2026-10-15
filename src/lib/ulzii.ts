/**
 * Ulzii (өлзий), the endless knot.
 *
 * Rule: an n × n grid of crossings, n odd. Every row and column runs out to a loose end, 4n ends in
 * all. Listed clockwise from the top-left, consecutive ends are joined in pairs by loops outside the
 * grid. Because each side has an odd number of ends, exactly two pairs wrap a corner, at opposite
 * corners; those loops are the knot's "ears". At crossing (i, j) the vertical band passes over when
 * i + j is even, which makes the band alternate over/under along its whole length.
 *
 * For odd n this closes into one band. n = 3 (a 5 × 5 lattice of centre lines including the outer
 * loops) is the classic knot: 9 drawn crossings, 2 of them kinks at the ears, knot type 7_4.
 * Larger odd n give 25, 49 and 81 drawn crossings. Even n never closes into one band.
 * See docs/GEOMETRY.md for the sources and the checks behind these statements.
 */
import { PALETTE, ribbonOf, ribbonParams } from './common.js';
import { boolOf, numOf, strOf, t, type Pattern, type Rendered, type Values } from './schema.js';
import { arcPoints, arcTo, boxOf, grow, pt, ribbonHalf, ribbonStrokes, rotate, svgDocument, type Pt } from './svg.js';

export type Side = 'T' | 'R' | 'B' | 'L';
export interface End {
  side: Side;
  /** Column for T and B, row for L and R. */
  index: number;
}

export interface UlziiShape {
  /** Crossings per side. */
  n: number;
  /** Distance between neighbouring bands, px. */
  cell: number;
  loops: 'square' | 'round';
  /** Mirror image: the ears sit on the other diagonal. */
  mirror: boolean;
}

export interface UlziiGeometry {
  /** Centre line of the band(s), one closed subpath per component. */
  d: string;
  /** Points on the centre line, for bounding boxes. */
  points: Pt[];
  /** Number of separate closed bands. 1 for odd n. */
  components: number;
  crossings: { at: Pt; row: number; col: number; verticalOver: boolean }[];
  /** Side of the outer square, px; the knot spans [0, size] before rotation. */
  size: number;
}

const OUTWARD: Record<Side, Pt> = { T: [0, -1], R: [1, 0], B: [0, 1], L: [-1, 0] };

/** The 4n loose ends, clockwise from the top-left corner. */
export function endsOf(n: number): End[] {
  const ends: End[] = [];
  for (let j = 0; j < n; j++) ends.push({ side: 'T', index: j });
  for (let i = 0; i < n; i++) ends.push({ side: 'R', index: i });
  for (let j = n - 1; j >= 0; j--) ends.push({ side: 'B', index: j });
  for (let i = n - 1; i >= 0; i--) ends.push({ side: 'L', index: i });
  return ends;
}

/**
 * The closed band(s) as sequences of end indices into endsOf(n): each entry is the end where the
 * band enters a row or column; it leaves at the opposite end of that row or column, then the loop
 * takes it to the paired end, which is the next entry.
 */
export function ulziiCircuits(n: number, mirror: boolean): number[][] {
  const ends = endsOf(n);
  const count = ends.length;
  const opposite = oppositeOf(ends);
  // Consecutive pairing; phase 1 (mirror) shifts every pair by one end.
  const phase = mirror ? 1 : 0;
  const partner = (k: number): number => ((((k - phase) % 2) + 2) % 2 === 0 ? (k + 1) % count : (k - 1 + count) % count);
  const seen = new Array<boolean>(count).fill(false);
  const circuits: number[][] = [];
  for (let start = 0; start < count; start++) {
    if (seen[start]) continue;
    const circuit: number[] = [];
    let k = start;
    do {
      circuit.push(k);
      const o = opposite(k);
      const p = partner(o);
      seen[k] = seen[o] = seen[p] = true;
      k = p;
    } while (k !== start);
    circuits.push(circuit);
  }
  return circuits;
}

/** Maps an end index to the index of the other end of the same row or column. */
export function oppositeOf(ends: End[]): (k: number) => number {
  const other: Record<Side, Side> = { T: 'B', B: 'T', L: 'R', R: 'L' };
  return (k) => {
    const e = ends[k]!;
    return ends.findIndex((x) => x.side === other[e.side] && x.index === e.index);
  };
}

export function ulziiGeometry({ n, cell: s, loops, mirror }: UlziiShape): UlziiGeometry {
  const ends = endsOf(n);
  const size = (n + 1) * s;
  const inset = loops === 'round' ? s / 2 : 0;
  const g = (k: number) => (k + 1) * s;

  const pos = (e: End): Pt => {
    switch (e.side) {
      case 'T':
        return [g(e.index), inset];
      case 'B':
        return [g(e.index), size - inset];
      case 'L':
        return [inset, g(e.index)];
      case 'R':
        return [size - inset, g(e.index)];
    }
  };
  const opposite = oppositeOf(ends);

  const points: Pt[] = [];
  /** Path data for the loop from end a to end b, which are paired. */
  const loop = (a: End, b: End): string => {
    const pa = pos(a);
    const pb = pos(b);
    if (a.side === b.side) {
      if (loops === 'square') {
        points.push(pb);
        return `L${pt(pb)}`;
      }
      const c: Pt = [(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2];
      const o = OUTWARD[a.side];
      const through: Pt = [c[0] + (o[0] * s) / 2, c[1] + (o[1] * s) / 2];
      points.push(...arcPoints(pa, pb, c, through));
      return arcTo(pa, pb, c, through);
    }
    // An ear: the loop wraps the corner between the two sides.
    const vertical = a.side === 'L' || a.side === 'R' ? a : b;
    const horizontal = a.side === 'T' || a.side === 'B' ? a : b;
    const corner: Pt = [vertical.side === 'L' ? 0 : size, horizontal.side === 'T' ? 0 : size];
    if (loops === 'square') {
      points.push(corner, pb);
      return `L${pt(corner)}L${pt(pb)}`;
    }
    const c: Pt = [corner[0] === 0 ? s / 2 : size - s / 2, corner[1] === 0 ? s / 2 : size - s / 2];
    const k = s / 2 / Math.SQRT2;
    const through: Pt = [c[0] + (corner[0] === 0 ? -k : k), c[1] + (corner[1] === 0 ? -k : k)];
    points.push(...arcPoints(pa, pb, c, through));
    return arcTo(pa, pb, c, through);
  };

  const circuits = ulziiCircuits(n, mirror);
  let d = '';
  for (const circuit of circuits) {
    d += `M${pt(pos(ends[circuit[0]!]!))}`;
    points.push(pos(ends[circuit[0]!]!));
    circuit.forEach((k, i) => {
      const o = opposite(k);
      const next = circuit[(i + 1) % circuit.length]!;
      d += `L${pt(pos(ends[o]!))}`;
      points.push(pos(ends[o]!));
      d += loop(ends[o]!, ends[next]!);
    });
    d += 'Z';
  }

  const crossings: UlziiGeometry['crossings'] = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) crossings.push({ at: [g(j), g(i)], row: i, col: j, verticalOver: (i + j) % 2 === 0 });

  return { d, points, components: circuits.length, crossings, size };
}

export const ulzii: Pattern = {
  id: 'ulzii',
  name: t('Ulzii · endless knot', 'Өлзий хээ'),
  summary: t(
    'One unbroken band on an odd grid of crossings, alternating over and under. The 3 × 3 grid is the classic knot (knot type 7₄).',
    'Сондгой тооны огтлолцол бүхий тор дээр тасралтгүй нэг тууз дээгүүр, доогуур ээлжилж гарна. 3 × 3 тор нь сонгодог өлзий (7₄ зангилаа).',
  ),
  params: [
    {
      key: 'n',
      kind: 'number',
      group: 'shape',
      label: t('Crossings per side', 'Нэг талын огтлолцол'),
      min: 3,
      max: 9,
      step: 2,
      default: 3,
      hint: t('Odd only: an even grid falls apart into several loops.', 'Зөвхөн сондгой: тэгш тор хэд хэдэн тусдаа гогцоо болно.'),
    },
    {
      key: 'loops',
      kind: 'choice',
      group: 'shape',
      label: t('Loops', 'Гогцоо'),
      options: [
        { value: 'round', label: t('Round', 'Дугуй') },
        { value: 'square', label: t('Square', 'Дөрвөлжин') },
      ],
      default: 'round',
    },
    {
      key: 'turn',
      kind: 'choice',
      group: 'shape',
      label: t('Orientation', 'Байрлал'),
      options: [
        { value: '0', label: t('Square', 'Шулуун') },
        { value: '45', label: t('Diamond', 'Ромбо') },
      ],
      default: '0',
    },
    { key: 'mirror', kind: 'bool', group: 'shape', label: t('Mirror image', 'Толин тусгал'), default: false },
    { key: 'cell', kind: 'number', group: 'size', label: t('Grid spacing', 'Торын алхам'), min: 8, max: 120, step: 1, default: 40, unit: 'px' },
    ...ribbonParams({ width: 15, outline: 3, centre: 2.5, fill: PALETTE.blue, centreColor: PALETTE.white }),
  ],
  render(v: Values): Rendered {
    const warnings: Rendered['warnings'] = [];
    const cell = numOf(v, 'cell');
    const ribbon = ribbonOf(v);
    // Neighbouring bands must not touch: keep at least 2 px between them.
    const maxBand = cell - 2 - 2 * ribbon.outline;
    if (ribbon.width > maxBand) {
      ribbon.width = Math.max(1, maxBand);
      warnings.push(t('Band narrowed so neighbouring bands do not touch.', 'Хөрш туузууд хүрэлцэхгүйн тулд туузыг нарийсгав.'));
    }
    const geo = ulziiGeometry({ n: numOf(v, 'n'), cell, loops: strOf(v, 'loops') === 'square' ? 'square' : 'round', mirror: boolOf(v, 'mirror') });
    const half = ribbonHalf(ribbon);

    // Each over-pass is redrawn on top as a short straight piece that covers the under band and its
    // outline. It must stay inside the straight part of the band: within half a cell of the crossing.
    const reach = Math.min(cell / 2 - 0.01, half + Math.max(0.75, ribbon.outline / 2));
    const over = geo.crossings
      .map(({ at: [x, y], verticalOver }) => (verticalOver ? `M${pt([x, y - reach])}L${pt([x, y + reach])}` : `M${pt([x - reach, y])}L${pt([x + reach, y])}`))
      .join('');
    const join = strOf(v, 'loops') === 'square' ? 'miter' : 'round';
    let body = ribbonStrokes(geo.d, ribbon, 'butt', join) + ribbonStrokes(over, ribbon, 'butt', 'miter');

    const c = geo.size / 2;
    const diamond = strOf(v, 'turn') === '45';
    let pts = geo.points;
    let margin = half;
    if (diamond) {
      pts = pts.map(([x, y]) => {
        const [rx, ry] = rotate([x - c, y - c], Math.PI / 4);
        return [rx + c, ry + c] as Pt;
      });
      body = `<g transform="rotate(45 ${c} ${c})">${body}</g>`;
      // A mitred square corner reaches half·√2 along the diagonal, which the turn makes an axis.
      if (join === 'miter') margin = half * Math.SQRT2;
    }
    const box = grow(boxOf(pts), margin + numOf(v, 'padding'));
    const doc = svgDocument(box, body, { background: strOf(v, 'bg'), title: 'Ulzii' });
    return { ...doc, warnings };
  },
};
