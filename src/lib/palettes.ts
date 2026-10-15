/**
 * Colour schemes from Mongolian colour symbolism and the colours of painted furniture, felt and silk.
 * A palette names colours by role; each pattern maps the roles onto its own colour parameters
 * (Pattern.palette). The meaning of each palette and its sources are in docs/COLOUR.md.
 */
import { PALETTE } from './common.js';
import { t, type Pattern, type Text, type Values } from './schema.js';

export type Role = 'outline' | 'band' | 'line' | 'ground' | 'accent';

export interface Palette {
  id: string;
  name: Text;
  /** What the combination stands for, one sentence, from the sources in docs/COLOUR.md. */
  meaning: Text;
  /** Ink that outlines the bands. */
  outline: string;
  /** Main band colour. */
  band: string;
  /** Thin centre line inside the band. */
  line: string;
  /** Field the ornament is painted on. */
  ground: string;
  /** A second strong colour, for two-colour borders. */
  accent: string;
}

export const PALETTES: Palette[] = [
  {
    id: 'furniture',
    name: t('Painted ger furniture', 'Гэрийн будмал тавилга'),
    meaning: t(
      'The orange field of painted ger furniture, with ornament in blue, green and cream.',
      'Гэрийн будмал тавилгын улбар шар дэвсгэр дээр хөх, ногоон, цайвар өнгийн хээ.',
    ),
    outline: '#2b1b12',
    band: '#163f7a',
    line: '#f3e6c4',
    ground: '#f29a4a',
    accent: '#1e7a45',
  },
  {
    id: 'flag',
    name: t('State flag', 'Төрийн далбаа'),
    meaning: t(
      'Red for flourishing, blue for the Eternal Sky, and the gold of the Soyombo, as the law on state symbols defines them.',
      'Улаан нь мандан бадрахын, хөх нь мөнх тэнгэрийн бэлгэдэл, алтан шар соёмбо: Төрийн бэлгэ тэмдгийн тухай хуулиар.',
    ),
    outline: '#1b1a3a',
    band: '#f2c230',
    line: '#c8102e',
    ground: '#c8102e',
    accent: '#0057a8',
  },
  {
    id: 'emblem',
    name: t('State emblem', 'Төрийн сүлд'),
    meaning: t(
      'A gold tümen nasan band on the blue of the Eternal Sky, as on the state emblem, with the green of the motherland.',
      'Төрийн сүлдний адил мөнх тэнгэрийн хөх дэвсгэр дээр алтан шар түмэн насан хээ, эх орны ногоон.',
    ),
    outline: '#0b2a55',
    band: '#e8b520',
    line: '#0b3e7a',
    ground: '#1f5fae',
    accent: '#2e8b57',
  },
  {
    id: 'sky',
    name: t('Blue khadag', 'Хөх хадаг'),
    meaning: t('The blue of the sky on the white of milk and a pure heart.', 'Тэнгэрийн хөх, сүү ба ариун сэтгэлийн цагаан.'),
    outline: '#0b2a55',
    band: '#1f5fae',
    line: '#fbf7ec',
    ground: '#fbf7ec',
    accent: '#e8b520',
  },
  {
    id: 'khadag',
    name: t('Five-colour khadag', 'Таван өнгийн хадаг'),
    meaning: t(
      'Blue, yellow, white, red and green, given for lasting merit, prosperity and peace.',
      'Цэнхэр, шар, цагаан, улаан, ногоон: буян тогтоох, аж амьдрал чинээлэг, амар тайван байхын бэлгэдэл.',
    ),
    outline: '#0f3b24',
    band: '#1f5fae',
    line: '#f2c230',
    ground: '#fbf7ec',
    accent: '#c62828',
  },
  {
    id: 'lungta',
    name: t('Wind-horse flag', 'Хийморийн дарцаг'),
    meaning: t(
      'The five elements of the prayer flag: blue sky, white wind, red fire, green water, yellow earth.',
      'Хийморийн дарцагны таван махбод: хөх тэнгэр, цагаан салхи, улаан гал, ногоон ус, шар шороо.',
    ),
    outline: '#14305e',
    band: '#c62828',
    line: '#fbf7ec',
    ground: '#f2c230',
    accent: '#2e8b57',
  },
  {
    id: 'toono',
    name: t('Ger pillars', 'Тооно, багана'),
    meaning: t(
      'Dark-red woodwork with blue-green heads edged in gold, as ger pillars are painted.',
      'Гэрийн баганын будаг: хар улаан мод, алтан хүрээтэй хөхөвтөр ногоон толгой.',
    ),
    outline: '#1a0f0a',
    band: '#5bbfa8',
    line: '#7a1616',
    ground: '#7a1616',
    accent: '#e0b04f',
  },
  {
    id: 'black-white',
    name: t('Black and white', 'Хар цагаан'),
    meaning: t(
      'Black and white, the two founding colours of Mongolian colour symbolism, with the blue of the state.',
      'Монгол өнгөний бэлгэдлийн үндсэн хоёр өнгө болох хар, цагаан, төрийн хөхтэй.',
    ),
    outline: '#111111',
    band: '#111111',
    line: '#fbf7ec',
    ground: '#fbf7ec',
    accent: '#1f5fae',
  },
];

/** One-tap colours offered on every colour control: the chest colours plus black and white. */
export const CHIPS: string[] = [
  PALETTE.ink,
  '#ffffff',
  PALETTE.red,
  PALETTE.orange,
  PALETTE.yellow,
  PALETTE.green,
  '#1fa39a',
  PALETTE.blue,
  '#1d4f91',
  PALETTE.pink,
  PALETTE.tan,
  PALETTE.cream,
];

/** The parameter values a palette sets on a pattern. */
export function paletteValues(pattern: Pattern, palette: Palette): Values {
  const out: Values = {};
  for (const [key, role] of Object.entries(pattern.palette ?? {})) out[key] = palette[role];
  return out;
}

/** The palette whose colours the values match, if any. Switching the ground off keeps the match. */
export function matchingPalette(pattern: Pattern, values: Values): Palette | undefined {
  const map = pattern.palette ?? {};
  const keys = Object.keys(map);
  if (keys.length === 0) return undefined;
  return PALETTES.find((p) => {
    const v = paletteValues(pattern, p);
    return keys.every((k) => v[k] === values[k] || (map[k] === 'ground' && values[k] === 'none'));
  });
}
