import { PAINT_KEYS, paintKeysFor } from 'src/spec/paintKeys';
import type { VisualizationSpec } from 'src/spec/types';
import { validatePaintKeys } from 'src/spec/validateSpec.paintChecks';

const specWith = (layer: Record<string, unknown>): VisualizationSpec => {
  return {
    layers: [{ id: 'districts', sourceId: 'src', ...layer }],
  } as unknown as VisualizationSpec;
};

describe('extruded polygon paint keys (D2)', () => {
  test('rejects lineColor on an extruded polygon: a prism has no outline', () => {
    const [issue] = validatePaintKeys(
      specWith({
        geometry: 'polygon',
        extrusion: { maxHeight: 4000 },
        paint: { lineColor: '#000' },
      })
    );

    expect(issue.subject.path).toBe('layers[districts].paint.lineColor');
    expect(issue.message).toContain('Accepted keys: fillColor, fillOpacity');
  });

  test('keeps lineColor on a flat polygon', () => {
    expect(
      validatePaintKeys(
        specWith({ geometry: 'polygon', paint: { lineColor: '#000' } })
      )
    ).toEqual([]);
  });

  test('reports kebab-case line-color on an extruded polygon as unknown', () => {
    const issues = validatePaintKeys(
      specWith({
        geometry: 'polygon',
        extrusion: { maxHeight: 4000 },
        paint: { 'line-color': '#000' },
      })
    );

    expect(issues).toHaveLength(1);
    expect(
      issues[0].repair.map((option) => {
        return option.kind;
      })
    ).toEqual(['allowed-values']);
  });

  test('paintKeysFor drops only lineColor for an extruded polygon', () => {
    expect(paintKeysFor({ geometry: 'polygon', extrusion: {} })).toEqual([
      'fillColor',
      'fillOpacity',
    ]);
    expect(paintKeysFor({ geometry: 'polygon' })).toEqual(PAINT_KEYS.polygon);
    expect(paintKeysFor({ geometry: 'line', extrusion: {} })).toEqual(
      PAINT_KEYS.line
    );
  });
});

const camelToKebab = (key: string): string => {
  return key.replace(/[A-Z]/g, (letter) => {
    return `-${letter.toLowerCase()}`;
  });
};

// One case per key the geometry accepts (`PAINT_KEYS`), so a key added there is
// covered without touching this file.
const KEBAB_CASES = Object.entries(PAINT_KEYS).flatMap(([geometry, keys]) => {
  return keys
    .map((key) => {
      return [geometry, key, camelToKebab(key)] as const;
    })
    .filter(([, key, kebab]) => {
      return kebab !== key;
    });
});

describe('kebab-case paint keys', () => {
  test.each(KEBAB_CASES)(
    '%s: reports %s written as %s',
    (geometry, _key, kebab) => {
      const issues = validatePaintKeys(
        specWith({ geometry, paint: { [kebab]: 1 } })
      );

      expect(issues).toHaveLength(1);
      expect(issues[0].code).toBe('invalid-schema');
      expect(issues[0].subject.path).toBe(`layers[districts].paint.${kebab}`);
    }
  );
});
