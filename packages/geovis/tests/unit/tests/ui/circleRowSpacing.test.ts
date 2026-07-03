import { computeCircleRowSpacing } from 'src/ui/GeoVisLegend.circles';

describe('computeCircleRowSpacing', () => {
  test('returns 0 for radii at or below the threshold', () => {
    expect(computeCircleRowSpacing(4)).toBe(0);
    expect(computeCircleRowSpacing(10)).toBe(0);
  });

  test('scales up for radii above the threshold', () => {
    expect(computeCircleRowSpacing(12)).toBe(1);
    expect(computeCircleRowSpacing(16)).toBe(3);
  });
});
