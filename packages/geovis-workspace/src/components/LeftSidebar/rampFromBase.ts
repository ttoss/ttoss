/**
 * Builds a sequential ramp from one base color.
 *
 * The ramp a reader builds has to obey the same rule as the ones shipped
 * beside it: sequential and single-hue, so the only thing changing along the
 * scale is how much of one color there is. That is why this varies lightness
 * and leaves hue alone — a sweep that drifted in hue would leave the reader
 * unable to tell which of two colors carries the number.
 *
 * Saturation is eased down towards the light end rather than held flat: a pale
 * class at full saturation reads as a different color rather than as less of
 * the same one.
 */

/** Lightness the sweep runs between, as fractions. Neither end is pure. */
const LIGHTEST = 0.9;
const DARKEST = 0.28;

/** How much of the base saturation the lightest class keeps. */
const PALE_SATURATION = 0.55;

/** `#abc` and `#aabbcc` to `[r, g, b]` in 0–255, or `null` if it is neither. */
const parseHex = (hex: string): [number, number, number] | null => {
  const clean = hex.trim().replace(/^#/, '');

  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((part) => {
            return part + part;
          })
          .join('')
      : clean;

  if (!/^[0-9a-f]{6}$/i.test(full)) return null;

  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};

/** `[r, g, b]` in 0–255 to `{ h, s, l }` with `h` in degrees and the rest 0–1. */
const toHsl = ([r, g, b]: [number, number, number]) => {
  const [rf, gf, bf] = [r / 255, g / 255, b / 255];
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const span = max - min;
  const l = (max + min) / 2;

  if (span === 0) return { h: 0, s: 0, l };

  const s = span / (1 - Math.abs(2 * l - 1));

  const h =
    max === rf
      ? ((gf - bf) / span + (gf < bf ? 6 : 0)) * 60
      : max === gf
        ? ((bf - rf) / span + 2) * 60
        : ((rf - gf) / span + 4) * 60;

  return { h, s, l };
};

/** `{ h, s, l }` back to a `#rrggbb` string. */
const toHex = ({ h, s, l }: { h: number; s: number; l: number }): string => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  const sector = Math.floor(h / 60) % 6;
  const [r, g, b] = (
    [
      [c, x, 0],
      [x, c, 0],
      [0, c, x],
      [0, x, c],
      [x, 0, c],
      [c, 0, x],
    ] as [number, number, number][]
  )[sector];

  return `#${[r, g, b]
    .map((channel) => {
      return Math.round((channel + m) * 255)
        .toString(16)
        .padStart(2, '0');
    })
    .join('')}`;
};

/**
 * `classes` colors sweeping the base color's hue from light to dark.
 *
 * @param params.baseColor - The chosen color, as `#abc` or `#aabbcc`.
 * @param params.classes - How many classes the ramp has. Below 1 yields `[]`.
 * @returns The ramp, lightest first. An unparseable color yields `[]`, which
 *   the caller reads as "nothing to preview" rather than as a gray ramp that
 *   looks deliberate.
 *
 * @example
 * rampFromBase({ baseColor: '#2171B5', classes: 4 });
 * // ['#dce6ef', '#8bb4d7', '#3382c5', '#164b79'] — lightest to darkest
 */
export const rampFromBase = ({
  baseColor,
  classes,
}: {
  baseColor: string;
  classes: number;
}): string[] => {
  const rgb = parseHex(baseColor);

  if (!rgb || classes < 1) return [];

  const { h, s } = toHsl(rgb);

  // A single class is the base color's own midpoint, not the lightest end:
  // asked for one color, the reader means the one they picked.
  if (classes === 1) return [toHex({ h, s, l: (LIGHTEST + DARKEST) / 2 })];

  return Array.from({ length: classes }, (_, index) => {
    const t = index / (classes - 1);

    return toHex({
      h,
      s: s * (PALE_SATURATION + (1 - PALE_SATURATION) * t),
      l: LIGHTEST + (DARKEST - LIGHTEST) * t,
    });
  });
};
