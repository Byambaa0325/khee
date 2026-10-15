/**
 * Declarative parameters. One list per pattern drives the generator form, the API's query parsing
 * and the clamping that keeps every request inside sane bounds.
 */
import { isColor } from './svg.js';

export interface Text {
  en: string;
  mn: string;
}

export type Group = 'shape' | 'size' | 'colour';

interface Base {
  key: string;
  label: Text;
  group: Group;
  /** Shown under the control. */
  hint?: Text;
}

export interface NumberSpec extends Base {
  kind: 'number';
  min: number;
  max: number;
  step: number;
  default: number;
  unit?: 'px' | 'module' | '°';
}

export interface ChoiceSpec extends Base {
  kind: 'choice';
  options: { value: string; label: Text }[];
  default: string;
}

export interface ColorSpec extends Base {
  kind: 'color';
  default: string;
  /** Allows "none": transparent, or "same as" for an accent colour. */
  allowNone?: boolean;
}

export interface BoolSpec extends Base {
  kind: 'bool';
  default: boolean;
}

export type ParamSpec = NumberSpec | ChoiceSpec | ColorSpec | BoolSpec;
export type Value = number | string | boolean;
export type Values = Record<string, Value>;

export interface Rendered {
  svg: string;
  width: number;
  height: number;
  /** Things the user should know about this result, e.g. overlapping bands. */
  warnings: Text[];
  /** Ready-to-paste CSS, for patterns that make a border image. */
  css?: string;
}

export interface Pattern {
  id: string;
  name: Text;
  summary: Text;
  params: ParamSpec[];
  /** Which colour parameter takes which palette role (see palettes.ts). */
  palette?: Record<string, 'outline' | 'band' | 'line' | 'ground' | 'accent'>;
  /** Settings for a small preview, e.g. on a palette card. */
  thumbnail?: Values;
  render(values: Values): Rendered;
}

/** Snaps to the step grid measured from min, then clamps. Steps below 1 keep 3 decimals. */
export function snap(spec: NumberSpec, n: number): number {
  const k = Math.round((n - spec.min) / spec.step);
  const v = Math.min(spec.max, Math.max(spec.min, spec.min + k * spec.step));
  return Math.round(v * 1000) / 1000;
}

export function defaults(params: ParamSpec[]): Values {
  return Object.fromEntries(params.map((p) => [p.key, p.default]));
}

/**
 * Values from untrusted strings (a query string or form). Anything missing or invalid falls back to
 * the default; numbers are snapped and clamped, so the output is always renderable.
 */
export function parseValues(params: ParamSpec[], input: Record<string, string | undefined>): Values {
  const out: Values = {};
  for (const p of params) {
    const raw = input[p.key];
    switch (p.kind) {
      case 'number': {
        const n = raw == null || raw.trim() === '' ? NaN : Number(raw);
        out[p.key] = Number.isFinite(n) ? snap(p, n) : p.default;
        break;
      }
      case 'choice':
        out[p.key] = p.options.some((o) => o.value === raw) ? raw! : p.default;
        break;
      case 'color': {
        const s = (raw ?? '').trim().toLowerCase();
        const hex = s.startsWith('#') ? s : `#${s}`;
        out[p.key] = s === 'none' && p.allowNone ? 'none' : isColor(hex) && s !== '' ? hex : p.default;
        break;
      }
      case 'bool':
        out[p.key] = raw == null ? p.default : raw === '1' || raw === 'true' || raw === 'on';
        break;
    }
  }
  return out;
}

/** Query string with only the values that differ from the defaults, in parameter order. */
export function toQuery(params: ParamSpec[], values: Values): string {
  const parts: string[] = [];
  for (const p of params) {
    const v = values[p.key];
    if (v === undefined || v === p.default) continue;
    const s = typeof v === 'boolean' ? (v ? '1' : '0') : String(v);
    parts.push(`${p.key}=${encodeURIComponent(p.kind === 'color' && s.startsWith('#') ? s.slice(1) : s)}`);
  }
  return parts.join('&');
}

/** Typed accessors used inside renderers. */
export const numOf = (v: Values, k: string): number => v[k] as number;
export const strOf = (v: Values, k: string): string => v[k] as string;
export const boolOf = (v: Values, k: string): boolean => v[k] as boolean;

export const t = (en: string, mn: string): Text => ({ en, mn });
