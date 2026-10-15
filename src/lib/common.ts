import { numOf, strOf, t, type ParamSpec, type Values } from './schema.js';
import type { Ribbon } from './svg.js';

/** Colours of a painted Mongolian chest (avdar). */
export const PALETTE = {
  ink: '#1b120b',
  red: '#b3261e',
  orange: '#e85a23',
  yellow: '#f7c531',
  green: '#12935a',
  blue: '#1990d5',
  pink: '#e8458f',
  tan: '#b08c5e',
  cream: '#fff6e6',
  white: '#fbf7ef',
} as const;

export interface RibbonDefaults {
  width: number;
  outline: number;
  centre: number;
  fill: string;
  centreColor: string;
}

/** Parameters for a ribbon-drawn pattern (knot, scrolls), in the order the form shows them. */
export function ribbonParams(d: RibbonDefaults): ParamSpec[] {
  return [
    { key: 'band', kind: 'number', group: 'size', label: t('Band width', 'Туузны өргөн'), min: 1, max: 80, step: 0.5, default: d.width, unit: 'px' },
    { key: 'outline', kind: 'number', group: 'size', label: t('Outline', 'Хүрээ зураас'), min: 0, max: 12, step: 0.25, default: d.outline, unit: 'px' },
    { key: 'centre', kind: 'number', group: 'size', label: t('Centre line', 'Голын зураас'), min: 0, max: 20, step: 0.25, default: d.centre, unit: 'px' },
    { key: 'ink', kind: 'color', group: 'colour', label: t('Outline colour', 'Хүрээний өнгө'), default: PALETTE.ink },
    { key: 'fill', kind: 'color', group: 'colour', label: t('Band colour', 'Туузны өнгө'), default: d.fill },
    { key: 'line', kind: 'color', group: 'colour', label: t('Centre line colour', 'Голын зураасны өнгө'), default: d.centreColor },
    ...frameParams(),
  ];
}

/** Background and padding, shared by every pattern. */
export function frameParams(padding = 8): ParamSpec[] {
  return [
    {
      key: 'bg',
      kind: 'color',
      group: 'colour',
      label: t('Background', 'Дэвсгэр'),
      default: 'none',
      allowNone: true,
      hint: t('None keeps the background transparent.', 'Сонгоогүй бол дэвсгэр тунгалаг байна.'),
    },
    { key: 'padding', kind: 'number', group: 'size', label: t('Padding', 'Захын зай'), min: 0, max: 200, step: 1, default: padding, unit: 'px' },
  ];
}

export function ribbonOf(v: Values): Ribbon {
  return {
    width: numOf(v, 'band'),
    outline: numOf(v, 'outline'),
    centreWidth: numOf(v, 'centre'),
    ink: strOf(v, 'ink'),
    fill: strOf(v, 'fill'),
    centre: strOf(v, 'line'),
  };
}
