import type * as maplibregl from 'maplibre-gl';
import { focusPins, reapplyPinFocus } from 'src/adapters/maplibre/pinFocus';
import type { VisualizationSpec } from 'src/spec/types';

const spec: VisualizationSpec = {
  engine: 'maplibre',
  sources: [],
  layers: [
    { id: 'hospitals', sourceId: 's', geometry: 'symbol' },
    { id: 'clinics', sourceId: 's', geometry: 'symbol', visible: false },
    { id: 'areas', sourceId: 's', geometry: 'polygon' },
    { id: 'not-mounted', sourceId: 's', geometry: 'symbol' },
  ],
};

/** A map with every layer but `not-mounted`, recording visibility writes. */
const buildMap = () => {
  const visibility = new Map<string, string>();
  const map = {
    getLayer: jest.fn((id: string) => {
      return id === 'not-mounted' ? undefined : { id };
    }),
    setLayoutProperty: jest.fn((id: string, key: string, value: string) => {
      if (key === 'visibility') visibility.set(id, value);
    }),
  };
  return { map: map as unknown as maplibregl.Map, visibility };
};

const FOCUS = { layerId: 'hospitals', featureId: 7 };

describe('focusPins', () => {
  test('hides every mounted pin layer while a pin is in focus', () => {
    const { map, visibility } = buildMap();

    focusPins(map, spec, FOCUS);

    expect(Object.fromEntries(visibility)).toEqual({
      hospitals: 'none',
      clinics: 'none',
    });
  });

  test('cleared, shows each pin layer as the spec says', () => {
    const { map, visibility } = buildMap();

    focusPins(map, spec, FOCUS);
    focusPins(map, spec, null);

    expect(Object.fromEntries(visibility)).toEqual({
      hospitals: 'visible',
      clinics: 'none',
    });
  });
});

describe('reapplyPinFocus', () => {
  test('hides the pins again after a sync showed them, while a pin is in focus', () => {
    const { map, visibility } = buildMap();
    focusPins(map, spec, FOCUS);
    visibility.set('hospitals', 'visible');

    reapplyPinFocus(map, spec);

    expect(visibility.get('hospitals')).toBe('none');
  });

  test('writes nothing on a map with no pin in focus', () => {
    const { map } = buildMap();

    reapplyPinFocus(map, spec);

    expect(map.setLayoutProperty).not.toHaveBeenCalled();
  });
});
