import {
  abbreviateNumber,
  formatCompactNumber,
} from 'src/ui/GeoVisLegend.formatters';

describe('formatCompactNumber', () => {
  test('is exported as a reusable public helper', () => {
    expect(typeof formatCompactNumber).toBe('function');
  });

  test('abbreviates thousands with a "k" suffix', () => {
    expect(formatCompactNumber(1500)).toBe('1.5k');
    expect(formatCompactNumber(2000)).toBe('2k');
  });

  test('abbreviates millions with an "M" suffix', () => {
    expect(formatCompactNumber(2_000_000)).toBe('2M');
    expect(formatCompactNumber(1_500_000)).toBe('1.5M');
  });

  test('returns the plain number below 1000', () => {
    expect(formatCompactNumber(999)).toBe('999');
    expect(formatCompactNumber(0)).toBe('0');
  });

  test('omits the decimal for clean multiples of the unit', () => {
    expect(formatCompactNumber(1_000)).toBe('1k');
    expect(formatCompactNumber(250_000)).toBe('250k');
    expect(formatCompactNumber(500_000)).toBe('500k');
    expect(formatCompactNumber(1_000_000)).toBe('1M');
  });

  test('keeps a decimal only when the value is not a whole multiple', () => {
    expect(formatCompactNumber(62_500)).toBe('62.5k');
    expect(formatCompactNumber(1_250_000)).toBe('1.3M');
  });

  test('handles negative values symmetrically', () => {
    expect(formatCompactNumber(-1500)).toBe('-1.5k');
    expect(formatCompactNumber(-2_000_000)).toBe('-2M');
  });

  test('reuses abbreviateNumber so both helpers stay in parity', () => {
    const samples = [0, 999, 1500, 2000, 2_000_000, -1500];
    for (const v of samples) {
      expect(formatCompactNumber(v)).toBe(abbreviateNumber(v));
    }
  });
});
