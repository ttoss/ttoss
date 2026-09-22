/**
 * The single-hue sweep a reader's ramp is built from. The control's behaviour
 * around it is covered in LeftSidebar.colorRamp.test.tsx.
 */

import { rampFromBase } from 'src/components/LeftSidebar/rampFromBase';

/** `#rrggbb` to HSL, to assert on hue and lightness rather than on literals. */
const hsl = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((at) => {
    return parseInt(hex.slice(at, at + 2), 16) / 255;
  });

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const span = max - min;
  const l = (max + min) / 2;

  if (span === 0) return { h: 0, s: 0, l };

  const h =
    max === r
      ? ((g - b) / span + (g < b ? 6 : 0)) * 60
      : max === g
        ? ((b - r) / span + 2) * 60
        : ((r - g) / span + 4) * 60;

  return { h, s: span / (1 - Math.abs(2 * l - 1)), l };
};

describe('rampFromBase', () => {
  test('returns one color per class, lightest first', () => {
    const ramp = rampFromBase({ baseColor: '#2171B5', classes: 5 });

    expect(ramp).toHaveLength(5);
    expect(
      ramp.every((color) => {
        return /^#[0-9a-f]{6}$/.test(color);
      })
    ).toBe(true);

    const lightness = ramp.map((color) => {
      return hsl(color).l;
    });

    expect(lightness).toEqual([...lightness].sort().reverse());
  });

  /*
   * The rule the whole control rests on: a sequential ramp reads as more of one
   * color. A sweep that drifted in hue would leave the reader unable to tell
   * which of two colors carries the number.
   */
  test('holds the base hue across every class', () => {
    const base = hsl('#2171B5').h;

    for (const color of rampFromBase({ baseColor: '#2171B5', classes: 6 })) {
      expect(Math.abs(hsl(color).h - base)).toBeLessThan(1);
    }
  });

  /*
   * The hue is read off whichever channel leads, and the red-led case splits
   * again on whether the color sits above or below 180 degrees. Bases that
   * exercise each branch, so a sweep never silently lands on another hue.
   */
  test.each([
    ['#B5216F', 'red leads, above 180'],
    ['#B56F21', 'red leads, below 180'],
    ['#21B571', 'green leads'],
    ['#2171B5', 'blue leads'],
  ])('holds the hue of %s (%s)', (baseColor) => {
    const base = hsl(baseColor).h;

    for (const color of rampFromBase({ baseColor, classes: 4 })) {
      expect(Math.abs(hsl(color).h - base)).toBeLessThan(1);
    }
  });

  test('eases saturation down towards the light end', () => {
    const [lightest, ...rest] = rampFromBase({
      baseColor: '#2171B5',
      classes: 4,
    });

    expect(hsl(lightest).s).toBeLessThan(hsl(rest[rest.length - 1]).s);
  });

  test('reads three-digit hex the same as six', () => {
    expect(rampFromBase({ baseColor: '#abc', classes: 3 })).toEqual(
      rampFromBase({ baseColor: '#aabbcc', classes: 3 })
    );
  });

  /* Asked for one color, the reader means the one they picked — not an end. */
  test('gives a single class the base hue at mid lightness', () => {
    const [only] = rampFromBase({ baseColor: '#2171B5', classes: 1 });

    expect(hsl(only).l).toBeGreaterThan(0.4);
    expect(hsl(only).l).toBeLessThan(0.7);
  });

  /*
   * Empty rather than a gray ramp that looks deliberate: the editor reads the
   * empty sweep as "nothing to preview" and keeps the save button quiet.
   */
  test.each(['nope', '', '#12', '#1234567'])(
    'yields nothing for %p',
    (baseColor) => {
      expect(rampFromBase({ baseColor, classes: 4 })).toEqual([]);
    }
  );

  test('yields nothing when asked for fewer than one class', () => {
    expect(rampFromBase({ baseColor: '#2171B5', classes: 0 })).toEqual([]);
  });

  test('sweeps a gray base without inventing a hue', () => {
    for (const color of rampFromBase({ baseColor: '#808080', classes: 3 })) {
      expect(hsl(color).s).toBe(0);
    }
  });
});
