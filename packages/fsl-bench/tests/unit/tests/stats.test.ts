import { formatInterval, formatPercent, wilson } from '../../../src/stats.ts';

describe('wilson', () => {
  test('is centered near the observed proportion for large n', () => {
    const interval = wilson({ successes: 80, total: 100 });
    expect(interval.point).toBe(0.8);
    expect(interval.lower).toBeGreaterThan(0.7);
    expect(interval.upper).toBeLessThan(0.88);
  });

  test('does not collapse at 100% with small n', () => {
    const interval = wilson({ successes: 5, total: 5 });
    expect(interval.point).toBe(1);
    expect(interval.upper).toBe(1);
    // 5/5 is weak evidence — the lower bound must stay far from 1.
    expect(interval.lower).toBeLessThan(0.7);
    expect(interval.lower).toBeGreaterThan(0.4);
  });

  test('does not collapse at 0% with small n', () => {
    const interval = wilson({ successes: 0, total: 5 });
    expect(interval.point).toBe(0);
    expect(interval.lower).toBe(0);
    expect(interval.upper).toBeGreaterThan(0.3);
  });

  test('handles empty cells', () => {
    expect(wilson({ successes: 0, total: 0 })).toEqual({
      point: 0,
      lower: 0,
      upper: 0,
    });
  });
});

describe('formatting', () => {
  test('formatPercent renders whole percents', () => {
    expect(formatPercent(0.8)).toBe('80%');
  });

  test('formatInterval renders point + bounds', () => {
    expect(formatInterval(wilson({ successes: 5, total: 5 }))).toMatch(
      /^100% \[\d+%–100%\]$/
    );
  });
});
