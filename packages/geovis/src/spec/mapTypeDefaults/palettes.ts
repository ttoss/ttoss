export const SEQUENTIAL_PALETTES = {
  blue: [
    '#C6DBEF',
    '#9ECAE1',
    '#6BAED6',
    '#4292C6',
    '#2171B5',
    '#08519C',
    '#08306B',
  ],
  green: [
    '#C7E9C0',
    '#A1D99B',
    '#74C476',
    '#41AB5D',
    '#238B45',
    '#006D2C',
    '#00441B',
  ],
  red: [
    '#FCBBA1',
    '#FC9272',
    '#FB6A4A',
    '#EF3B2C',
    '#CB181D',
    '#A50F15',
    '#67000D',
  ],
} as const;

export const CATEGORICAL_PALETTE = [
  '#4E79A7',
  '#F28E2B',
  '#E15759',
  '#76B7B2',
  '#59A14F',
  '#EDC948',
  '#B07AA1',
  '#FF9DA7',
  '#9C755F',
  '#BAB0AC',
  '#86BCB6',
  '#D37295',
  '#A0CBE8',
  '#FFBE7D',
] as const;

export const DEFAULT_SEQUENTIAL_PALETTE = SEQUENTIAL_PALETTES.blue;
