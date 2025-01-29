import { defaultTheme } from '../default/defaultTheme';

type Spacing = {
  px: string; // 1px
  0.5: string; // 2px
  1: string; // 4px
  1.5: string; // 6px
  2: string; // 8px
  2.5: string; // 10px
  3: string; // 12px
  3.5: string; // 14px
  4: string; // 16px
  5: string; // 20px
  6: string; // 24px
  7: string; // 28px
  8: string; // 32px
  9: string; // 36px
  10: string; // 40px
  12: string; // 48px
  14: string; // 56px
  16: string; // 64px
  20: string; // 80px
  24: string; // 96px
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
};

const defaultSpacing = defaultTheme.space as Spacing;

export const ocaSpace = Object.freeze({
  ...defaultSpacing,
  1: '0.140625rem', // 2.25px (inicial)
  2: '0.28125rem', // 4.5px (2.25px + 2.25px)
  3: '0.421875rem', // 6.75px (4.5px + 2.25px)
  4: '0.5625rem', // 9px (6.75px + 2.25px)
  5: '0.703125rem', // 11.25px (9px + 2.25px)
  6: '0.84375rem', // 13.5px (11.25px + 2.25px)
  7: '0.984375rem', // 15.75px (13.5px + 2.25px)
  8: '1.265625rem', // 20.25px (15.75px + 4.5px) **(início do incremento de 4.5px)**
  9: '1.546875rem', // 24.75px (20.25px + 4.5px)
  10: '1.828125rem', // 29.25px (24.75px + 4.5px)
  12: '2.109375rem', // 33.75px (29.25px + 4.5px)
  14: '2.390625rem', // 38.25px (33.75px + 4.5px)
  15: '2.671875rem', // 42.75px (38.25px + 4.5px)
  16: '3.28125rem', // 51.75px (início do incremento de 9px)
  20: '3.84375rem', // 60.75px (51.75px + 9px)
  24: '4.40625rem', // 69.75px (60.75px + 9px)
  28: '4.96875rem', // 78.75px (69.75px + 9px)
  32: '5.53125rem', // 87.75px (78.75px + 9px)
  36: '6.09375rem', // 96.75px (87.75px + 9px)
  40: '6.65625rem', // 105.75px (96.75px + 9px)
  44: '7.21875rem', // 114.75px (105.75px + 9px)
  48: '7.78125rem', // 123.75px (114.75px + 9px)
  52: '8.34375rem', // 132.75px (123.75px + 9px)
  56: '8.90625rem', // 141.75px (132.75px + 9px)
  60: '9.46875rem', // 150.75px (141.75px + 9px)
  64: '10.03125rem', // 159.75px (150.75px + 9px)
  72: '10.59375rem', // 168.75px (159.75px + 9px)
  80: '11.15625rem', // 177.75px (168.75px + 9px)
  96: '11.71875rem', // 186.75px (177.75px + 9px)
});
