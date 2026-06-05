import type { LabelFormatSpec, NormalizationSpec } from 'src/spec/types';
import { formatLabel } from 'src/ui/GeoVisLegend.formatters';

const noNorm: NormalizationSpec | undefined = undefined;
const rawNorm: NormalizationSpec = {
  type: 'raw',
  numeratorLabel: 'inhabitants',
};

const fv = (v: number) => {
  return String(v);
};

describe("formatLabel — type: 'labels'", () => {
  /**
   * 1. Happy path — all explicit labels provided.
   * Chosen because it is the canonical use case: the consumer supplies one
   * label per bin and the formatter should return them verbatim.
   */
  test('returns the explicit label for each bin when all labels are provided', () => {
    const spec: LabelFormatSpec = {
      type: 'labels',
      labels: ['Low', 'Medium', 'High', 'Very High'],
    };

    expect(
      formatLabel({
        lower: null,
        upper: 50,
        index: 0,
        total: 4,
        spec,
        normalization: noNorm,
        formatValue: fv,
      })
    ).toBe('Low');
    expect(
      formatLabel({
        lower: 50,
        upper: 100,
        index: 1,
        total: 4,
        spec,
        normalization: noNorm,
        formatValue: fv,
      })
    ).toBe('Medium');
    expect(
      formatLabel({
        lower: 100,
        upper: 200,
        index: 2,
        total: 4,
        spec,
        normalization: noNorm,
        formatValue: fv,
      })
    ).toBe('High');
    expect(
      formatLabel({
        lower: 200,
        upper: null,
        index: 3,
        total: 4,
        spec,
        normalization: noNorm,
        formatValue: fv,
      })
    ).toBe('Very High');
  });

  /**
   * 2. Partial labels — fewer labels than bins.
   * Chosen because the graceful degradation path must be tested independently:
   * only the out-of-range bins should fall back to range-style formatting,
   * while covered bins still use the explicit label.
   */
  test('falls back to range-style label for bins beyond the labels array', () => {
    const spec: LabelFormatSpec = {
      type: 'labels',
      labels: ['Low'],
    };

    // Bin 0 is covered by explicit label
    expect(
      formatLabel({
        lower: null,
        upper: 50,
        index: 0,
        total: 3,
        spec,
        normalization: noNorm,
        formatValue: fv,
      })
    ).toBe('Low');
    // Bin 1 falls back to range style
    expect(
      formatLabel({
        lower: 50,
        upper: 100,
        index: 1,
        total: 3,
        spec,
        normalization: noNorm,
        formatValue: fv,
      })
    ).toBe('50 - 100');
    // Bin 2 (last) falls back to range style
    expect(
      formatLabel({
        lower: 100,
        upper: null,
        index: 2,
        total: 3,
        spec,
        normalization: noNorm,
        formatValue: fv,
      })
    ).toBe('> 100');
  });

  /**
   * 3. Extended suffix — explicit labels still receive the normalization suffix.
   * Chosen as a domain-specific edge case: the `extended` flag must honour
   * labels provided via `labels[]` the same way it honours all other types.
   */
  test('appends normalization suffix to explicit labels when extended is true', () => {
    const spec: LabelFormatSpec = {
      type: 'labels',
      labels: ['Low', 'High'],
      extended: true,
    };

    expect(
      formatLabel({
        lower: null,
        upper: 50,
        index: 0,
        total: 2,
        spec,
        normalization: rawNorm,
        formatValue: fv,
      })
    ).toBe('Low inhabitants');
    expect(
      formatLabel({
        lower: 50,
        upper: null,
        index: 1,
        total: 2,
        spec,
        normalization: rawNorm,
        formatValue: fv,
      })
    ).toBe('High inhabitants');
  });
});
