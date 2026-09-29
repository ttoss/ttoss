/**
 * The color picker's model: hue, saturation and value, which map one to one
 * onto what the reader drags — the value/saturation square and the hue bar —
 * and the hex strings the rest of the ramp editor speaks.
 */

/** `h` in degrees (0–360), `s` and `v` 0–1. */
export type Hsv = { h: number; s: number; v: number };

/** Six hex digits, with or without `#`, in either case. */
const HEX6 = /^#?[0-9a-f]{6}$/i;

/**
 * Whether a string is a full six-digit hex color.
 *
 * @param value - The candidate, with or without `#`.
 * @returns `true` for `#1a2b3c` or `1A2B3C`.
 *
 * @example
 * isHex6('3B82F6'); // true
 * isHex6('3B8'); // false
 */
export const isHex6 = (value: string): boolean => {
  return HEX6.test(value.trim());
};

/** Clamps to `[min, max]`; a non-number reads as `min`, never as `NaN`. */
const clamp = (value: number, min: number, max: number): number => {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
};

/**
 * HSV to a `#rrggbb` string.
 *
 * @param hsv - The color.
 * @returns Its hex, lower case.
 *
 * @example
 * hsvToHex({ h: 0, s: 1, v: 1 }); // '#ff0000'
 */
export const hsvToHex = ({ h, s, v }: Hsv): string => {
  const hue = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = v - c;
  // `hue` is in [0, 360), so the sector is always 0–5.
  const sectors: [number, number, number][] = [
    [c, x, 0],
    [x, c, 0],
    [0, c, x],
    [0, x, c],
    [x, 0, c],
    [c, 0, x],
  ];
  const [r, g, b] = sectors[Math.floor(hue / 60)] as [number, number, number];

  return `#${[r, g, b]
    .map((channel) => {
      return Math.round((channel + m) * 255)
        .toString(16)
        .padStart(2, '0');
    })
    .join('')}`;
};

/**
 * A `#rrggbb` string to HSV. A grey keeps hue 0, so the hue bar parks at red
 * rather than jumping.
 *
 * @param hex - Six hex digits, with or without `#`.
 * @returns The color, or black when the string is not a six-digit hex.
 *
 * @example
 * hexToHsv('#ff0000'); // { h: 0, s: 1, v: 1 }
 */
export const hexToHsv = (hex: string): Hsv => {
  if (!isHex6(hex)) return { h: 0, s: 0, v: 0 };

  const clean = hex.trim().replace(/^#/, '');
  const [r, g, b] = [0, 2, 4].map((start) => {
    return parseInt(clean.slice(start, start + 2), 16) / 255;
  }) as [number, number, number];
  const max = Math.max(r, g, b);
  const span = max - Math.min(r, g, b);

  const h =
    span === 0
      ? 0
      : max === r
        ? ((g - b) / span + (g < b ? 6 : 0)) * 60
        : max === g
          ? ((b - r) / span + 2) * 60
          : ((r - g) / span + 4) * 60;

  return { h, s: max === 0 ? 0 : span / max, v: max };
};

/**
 * Where a pointer sits inside an element, as fractions of its box, clamped to
 * it — so a drag that leaves the square keeps reporting its nearest edge.
 *
 * @param event - The pointer event.
 * @param element - The element the fractions are of.
 * @returns `x` and `y`, each 0–1.
 */
export const pointerFraction = (
  event: { clientX: number; clientY: number },
  element: HTMLElement
): { x: number; y: number } => {
  const box = element.getBoundingClientRect();
  return {
    x: box.width > 0 ? clamp((event.clientX - box.left) / box.width, 0, 1) : 0,
    y: box.height > 0 ? clamp((event.clientY - box.top) / box.height, 0, 1) : 0,
  };
};
