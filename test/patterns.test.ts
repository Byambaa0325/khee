import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';
import {
  PATTERNS,
  alkhanGeometry,
  arcChain,
  defaults,
  endsOf,
  oppositeOf,
  parseValues,
  sideLength,
  toQuery,
  ulziiCircuits,
  ulziiGeometry,
  type AlkhanShape,
  type Pt,
} from '../src/lib/index.js';

describe('ulzii (endless knot)', () => {
  it('closes into a single band for every odd grid, in both phases', () => {
    for (const n of [1, 3, 5, 7, 9]) for (const mirror of [false, true]) expect(ulziiCircuits(n, mirror)).toHaveLength(1);
  });

  it('falls apart into several bands for even grids, as the component formula predicts', () => {
    // (m + n)/2 without corner loops, (m + n)/2 − 1 with loops at all four corners; 2 × 2 gives 1.
    for (const n of [2, 4, 6, 8]) {
      expect(ulziiCircuits(n, false)).toHaveLength(n);
      expect(ulziiCircuits(n, true)).toHaveLength(n - 1);
    }
  });

  it('visits every row and column once', () => {
    const [circuit] = ulziiCircuits(5, false);
    expect(circuit).toHaveLength(10);
  });

  it('alternates over and under along the whole band, loops included', () => {
    for (const n of [3, 5, 7, 9]) {
      for (const mirror of [false, true]) {
        const ends = endsOf(n);
        const opposite = oppositeOf(ends);
        const sequence: boolean[] = [];
        for (const k of ulziiCircuits(n, mirror)[0]!) {
          const e = ends[k]!;
          const vertical = e.side === 'T' || e.side === 'B';
          // Crossings along this row or column, in travel order.
          const along = [...Array(n).keys()];
          const forward = e.side === 'T' || e.side === 'L';
          for (const step of forward ? along : along.reverse()) {
            const [i, j] = vertical ? [step, e.index] : [e.index, step];
            const verticalOver = (i + j) % 2 === 0;
            sequence.push(vertical === verticalOver);
          }
          expect(opposite(opposite(k))).toBe(k);
        }
        expect(sequence).toHaveLength(2 * n * n);
        for (let s = 0; s < sequence.length; s++) expect(sequence[s]).not.toBe(sequence[(s + 1) % sequence.length]);
      }
    }
  });

  it('has n² drawn crossings and exactly two ears for odd n', () => {
    for (const n of [3, 5, 7]) {
      const g = ulziiGeometry({ n, cell: 20, loops: 'square', mirror: false });
      expect(g.crossings).toHaveLength(n * n);
      // An ear is a loop between two different sides: the path visits a corner point of the outer square.
      const corners = ['0 0', `${g.size} 0`, `0 ${g.size}`, `${g.size} ${g.size}`].filter((c) => g.d.includes(`L${c}L`));
      expect(corners).toHaveLength(2);
    }
  });
});

/** The frame as a grid of module cells, sampled at cell centres. */
function cells(shape: AlkhanShape): boolean[][] {
  const g = alkhanGeometry(shape);
  const polys = [...g.outer, ...g.inner];
  const inside = (poly: Pt[], [x, y]: Pt) => {
    // Convex polygons with clockwise screen winding: the point is on the same side of every edge.
    let sign = 0;
    for (let i = 0; i < poly.length; i++) {
      const [ax, ay] = poly[i]!;
      const [bx, by] = poly[(i + 1) % poly.length]!;
      const c = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
      if (Math.abs(c) < 1e-9) continue;
      if (sign === 0) sign = Math.sign(c);
      else if (Math.sign(c) !== sign) return false;
    }
    return true;
  };
  return Array.from({ length: g.height }, (_, y) => Array.from({ length: g.width }, (_, x) => polys.some((p) => inside(p, [x + 0.5, y + 0.5]))));
}

function components(grid: boolean[][]): number {
  const seen = grid.map((r) => r.map(() => false));
  let n = 0;
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < grid[0]!.length; x++) {
      if (!grid[y]![x] || seen[y]![x]) continue;
      n++;
      const stack: Pt[] = [[x, y]];
      seen[y]![x] = true;
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as Pt[]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (grid[ny]?.[nx] && !seen[ny]![nx]) {
            seen[ny]![nx] = true;
            stack.push([nx, ny]);
          }
        }
      }
    }
  return n;
}

describe('alkhan khee (hammer border)', () => {
  it('is 7 modules deep and repeats every 8, as the one-module rule gives', () => {
    const grid = cells({ layout: 'strip', corner: 'hook', across: 4, down: 2, stem: 1 });
    expect(grid).toHaveLength(7);
    const row = (y: number) => grid[y]!.map((c) => (c ? '#' : '.')).join('');
    for (let y = 0; y < 7; y++) expect(row(y).slice(8, 16)).toBe(row(y).slice(16, 24));
    expect(row(0)).toMatch(/^#+$/);
    expect(row(6)).toMatch(/^#+$/);
    // Ink covers 32 of the 56 cells in a period.
    expect(grid.flatMap((r) => r.slice(8, 16)).filter(Boolean)).toHaveLength(32);
  });

  it('never leaves a gap wider than one module, corners included', () => {
    for (const corner of ['hook', 'box'] as const) {
      const grid = cells({ layout: 'frame', corner, across: 4, down: 3, stem: 1 });
      const H = grid.length;
      const W = grid[0]!.length;
      for (let y = 0; y < H - 1; y++)
        for (let x = 0; x < W - 1; x++) {
          // Only inside the band (within 7 modules of an edge); the frame's middle is open.
          if (Math.min(x, y, W - 2 - x, H - 2 - y) >= 6) continue;
          const block = grid[y]![x]! || grid[y]![x + 1]! || grid[y + 1]![x]! || grid[y + 1]![x + 1]!;
          expect(block, `${corner} empty 2×2 at ${x},${y}`).toBe(true);
        }
    }
  });

  it('hangs every stroke of the hook frame from a rule; the box corner adds a free dot per corner', () => {
    expect(components(cells({ layout: 'frame', corner: 'hook', across: 3, down: 3, stem: 1 }))).toBe(2);
    expect(components(cells({ layout: 'frame', corner: 'box', across: 3, down: 3, stem: 1 }))).toBe(6);
  });

  it('draws four identical corners: a square frame has the symmetry of the square', () => {
    for (const corner of ['hook', 'box'] as const) {
      const grid = cells({ layout: 'frame', corner, across: 3, down: 3, stem: 1 });
      const n = grid.length;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          expect(grid[y]![x]).toBe(grid[x]![y]); // diagonal mirror
          expect(grid[y]![x]).toBe(grid[y]![n - 1 - x]); // vertical mirror
        }
    }
  });

  it('sizes the sides so both ends of a side meet the same corner', () => {
    expect(sideLength('hook', 3)).toBe(29);
    expect(sideLength('box', 3)).toBe(25);
    const g = alkhanGeometry({ layout: 'nineslice', corner: 'hook', across: 9, down: 9, stem: 1 });
    expect(g.width - 2 * g.slice!).toBe(8);
  });
});

describe('ugalz (scrolls)', () => {
  it('chains tangent arcs whose radius shrinks by q at each quarter turn', () => {
    const q = 0.8;
    const s = arcChain([0, 0], -Math.PI / 2, 40, q, 8, 1);
    expect(s.arcs).toHaveLength(8);
    let prev: Pt = [0, 0];
    s.arcs.forEach((a, k) => {
      expect(a.radius).toBeCloseTo(40 * q ** k, 9);
      // The arc starts where the last ended and stays at its radius.
      expect(Math.hypot(prev[0] - a.centre[0], prev[1] - a.centre[1])).toBeCloseTo(a.radius, 9);
      expect(Math.hypot(a.end[0] - a.centre[0], a.end[1] - a.centre[1])).toBeCloseTo(a.radius, 9);
      if (k > 0) {
        // Tangency: the joint and both centres are collinear.
        const c0 = s.arcs[k - 1]!.centre;
        const cross = (a.centre[0] - c0[0]) * (prev[1] - c0[1]) - (a.centre[1] - c0[1]) * (prev[0] - c0[0]);
        expect(Math.abs(cross)).toBeLessThan(1e-9);
      }
      prev = a.end;
    });
  });

  it('turns a full circle every four arcs, growing by q⁻⁴ per turn', () => {
    const s = arcChain([0, 0], 0, 100, 0.7, 8, -1);
    expect(s.arcs[4]!.radius / s.arcs[0]!.radius).toBeCloseTo(0.7 ** 4, 12);
    expect(s.samples.at(-1)!.turned).toBeCloseTo(4 * Math.PI, 12);
  });
});

describe('every pattern', () => {
  it('renders its defaults to SVG that resvg can rasterise, without warnings', () => {
    for (const p of PATTERNS) {
      const r = p.render(defaults(p.params));
      expect(r.warnings, p.id).toEqual([]);
      expect(r.svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
      const png = new Resvg(r.svg).render();
      expect(png.width).toBe(r.width);
      expect(png.height).toBe(r.height);
    }
  });

  it('renders the extremes of every number and every choice', () => {
    for (const p of PATTERNS) {
      for (const spec of p.params) {
        const options = spec.kind === 'number' ? [spec.min, spec.max] : spec.kind === 'choice' ? spec.options.map((o) => o.value) : spec.kind === 'bool' ? [true, false] : [];
        for (const value of options) {
          const r = p.render({ ...defaults(p.params), [spec.key]: value });
          expect(r.width, `${p.id} ${spec.key}=${value}`).toBeGreaterThan(0);
          expect(r.svg).not.toContain('NaN');
        }
      }
    }
  });
});

describe('parameters', () => {
  const params = PATTERNS[0]!.params;

  it('snaps, clamps and falls back to defaults on bad input', () => {
    const v = parseValues(params, { n: '4', cell: '100000', loops: 'zigzag', ink: 'abc', fill: 'nonsense', bg: 'none', mirror: '1' });
    expect(v.n).toBe(5);
    expect(v.cell).toBe(120);
    expect(v.loops).toBe('round');
    expect(v.ink).toBe('#abc');
    expect(v.fill).toBe(defaults(params).fill);
    expect(v.bg).toBe('none');
    expect(v.mirror).toBe(true);
  });

  it('round-trips through the query string, which keeps only changed values', () => {
    const v = { ...defaults(params), n: 7, ink: '#123456' };
    const q = toQuery(params, v);
    expect(q).toBe('n=7&ink=123456');
    expect(parseValues(params, Object.fromEntries(new URLSearchParams(q)))).toEqual(v);
  });
});

describe('palettes', () => {
  it('apply to every multi-colour pattern, render, and are recognised once applied', async () => {
    const { PALETTES, paletteValues, matchingPalette } = await import('../src/lib/index.js');
    expect(PALETTES.length).toBeGreaterThanOrEqual(6);
    for (const p of PATTERNS) {
      for (const palette of PALETTES) {
        const values = { ...defaults(p.params), ...paletteValues(p, palette) };
        expect(matchingPalette(p, values)?.id).toBe(palette.id);
        // A transparent ground keeps the match.
        expect(matchingPalette(p, { ...values, bg: 'none' })?.id).toBe(palette.id);
        expect(p.render({ ...values, ...p.thumbnail }).svg).toContain(paletteValues(p, palette)[Object.keys(p.palette!)[0]!] as string);
      }
    }
  });

  it('keeps the band readable on its ground and the centre line readable on its band', async () => {
    const { PALETTES } = await import('../src/lib/index.js');
    const lum = (hex: string) => {
      const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * c[0]! + 0.7152 * c[1]! + 0.0722 * c[2]!;
    };
    const contrast = (a: string, b: string) => {
      const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
      return (x! + 0.05) / (y! + 0.05);
    };
    for (const p of PALETTES) {
      expect(contrast(p.band, p.ground), `${p.id} band/ground`).toBeGreaterThanOrEqual(3);
      expect(contrast(p.line, p.band), `${p.id} line/band`).toBeGreaterThanOrEqual(3);
    }
  });
});
