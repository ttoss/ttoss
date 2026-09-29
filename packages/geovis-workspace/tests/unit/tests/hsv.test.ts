import {
  hexToHsv,
  hsvToHex,
  isHex6,
  pointerFraction,
} from 'src/components/LeftSidebar/hsv';

describe('hsv', () => {
  test.each([
    [0, '#ff0000'],
    [60, '#ffff00'],
    [120, '#00ff00'],
    [180, '#00ffff'],
    [240, '#0000ff'],
    [300, '#ff00ff'],
    [360, '#ff0000'],
    [-60, '#ff00ff'],
  ])('hue %i at full saturation and value is %s', (h, hex) => {
    expect(hsvToHex({ h, s: 1, v: 1 })).toBe(hex);
  });

  test('round-trips a color through HSV', () => {
    for (const hex of ['#2171b5', '#cb181d', '#238b45', '#808080']) {
      expect(hsvToHex(hexToHsv(hex))).toBe(hex);
    }
  });

  test('reads a hex with or without #, in either case', () => {
    expect(hexToHsv('FF0000')).toEqual({ h: 0, s: 1, v: 1 });
    expect(hexToHsv('#00ff00').h).toBe(120);
    expect(hexToHsv('0000FF').h).toBe(240);
    // Magenta: red is the max and blue beats green, so hue wraps past 300.
    expect(hexToHsv('#ff00ff').h).toBe(300);
  });

  test('a grey keeps hue 0, and black has no saturation', () => {
    expect(hexToHsv('#808080')).toEqual({ h: 0, s: 0, v: 128 / 255 });
    expect(hexToHsv('#000000')).toEqual({ h: 0, s: 0, v: 0 });
  });

  test('anything but six hex digits reads as black', () => {
    expect(isHex6('3B82F6')).toBe(true);
    expect(isHex6(' #3b82f6 ')).toBe(true);
    expect(isHex6('3B8')).toBe(false);
    expect(isHex6('3B82FZ')).toBe(false);
    expect(hexToHsv('nope')).toEqual({ h: 0, s: 0, v: 0 });
  });

  test('a pointer position is a fraction of the box, clamped to it', () => {
    const element = {
      getBoundingClientRect: () => {
        return { left: 10, top: 20, width: 100, height: 50 };
      },
    } as unknown as HTMLElement;

    expect(pointerFraction({ clientX: 60, clientY: 45 }, element)).toEqual({
      x: 0.5,
      y: 0.5,
    });
    expect(pointerFraction({ clientX: -5, clientY: 500 }, element)).toEqual({
      x: 0,
      y: 1,
    });
  });

  test('a position that is not a number reads as the box corner', () => {
    const element = {
      getBoundingClientRect: () => {
        return { left: 0, top: 0, width: 100, height: 100 };
      },
    } as unknown as HTMLElement;

    expect(
      pointerFraction({ clientX: Number.NaN, clientY: Number.NaN }, element)
    ).toEqual({ x: 0, y: 0 });
  });

  test('an empty box reports its corner rather than dividing by zero', () => {
    const element = {
      getBoundingClientRect: () => {
        return { left: 0, top: 0, width: 0, height: 0 };
      },
    } as unknown as HTMLElement;

    expect(pointerFraction({ clientX: 5, clientY: 5 }, element)).toEqual({
      x: 0,
      y: 0,
    });
  });
});
