/**
 * datavizVars — the dataviz extension's typed CSS-var mirror (F-013).
 *
 * Var names derive from token paths alone, so the mirror must match the
 * names `toCssVars` emits for a `withDataviz`-extended theme.
 */
import { datavizVars, semanticDataviz } from 'src/dataviz';

describe('datavizVars', () => {
  test('mirrors series colors as var() references', () => {
    expect(datavizVars.color.series[1]).toBe(
      'var(--tt-dataviz-color-series-1)'
    );
    expect(datavizVars.color.series[8]).toBe(
      'var(--tt-dataviz-color-series-8)'
    );
  });

  test('mirrors reference and encoding leaves', () => {
    expect(datavizVars.color.reference.baseline).toBe(
      'var(--tt-dataviz-color-reference-baseline)'
    );
    expect(datavizVars.encoding.stroke.forecast).toBe(
      'var(--tt-dataviz-encoding-stroke-forecast)'
    );
  });

  test('has structural parity with the semantic dataviz tree', () => {
    const shapeOf = (obj: object): unknown => {
      return Object.fromEntries(
        Object.entries(obj)
          .filter(([key]) => {
            return !key.startsWith('$');
          })
          .map(([key, value]) => {
            return [
              key,
              typeof value === 'object' && value !== null
                ? shapeOf(value)
                : 'leaf',
            ];
          })
      );
    };
    expect(shapeOf(datavizVars)).toEqual(shapeOf(semanticDataviz));
  });

  test('every leaf is a var(--tt-dataviz-*) reference', () => {
    const leaves: string[] = [];
    const walk = (obj: object) => {
      for (const value of Object.values(obj)) {
        if (typeof value === 'object' && value !== null) {
          walk(value);
        } else {
          leaves.push(String(value));
        }
      }
    };
    walk(datavizVars);
    expect(leaves.length).toBeGreaterThan(0);
    for (const leaf of leaves) {
      expect(leaf).toMatch(/^var\(--tt-dataviz-[a-zA-Z0-9-]+\)$/);
    }
  });
});
