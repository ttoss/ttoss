/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import { GeoVisProvider, useMapData } from 'src/react/GeoVisProvider';
import type { VisualizationSpec } from 'src/spec/types';

// Avoid touching the real adapter — Provider lazy-imports it but never finishes
// resolving in the test environment, which is fine: useMapData reads from the
// effective spec on context, not from the runtime.
jest.mock('src/adapters/maplibre/MapLibreAdapter', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      return {
        id: 'maplibre',
        getCapabilities: jest.fn(),
        mount: jest.fn(() => {
          return { viewId: 'v', container: {}, destroy: jest.fn() };
        }),
        update: jest.fn(),
        destroy: jest.fn(),
        getNativeInstance: jest.fn(() => {
          return null;
        }),
      };
    }),
  };
});

const spec: VisualizationSpec = {
  id: 's',
  engine: 'maplibre',
  view: { center: [0, 0], zoom: 1 },
  sources: [
    {
      id: 'states',
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    },
  ],
  layers: [{ id: 'fill', sourceId: 'states', geometry: 'polygon' }],
  mapData: [
    {
      mapDataId: 'pop',
      mapId: 'states',
      data: [
        { geometryId: 'BR', value: 211 },
        { geometryId: 1, value: 9.5 },
        { geometryId: 'AR', value: null },
      ],
    },
  ],
};

const Probe = ({ id }: { id: string }) => {
  const md = useMapData(id);
  return (
    <pre data-testid="out">
      {md
        ? JSON.stringify({
            mapDataId: md.mapDataId,
            mapId: md.mapId,
            entries: Array.from(md.values.entries()),
          })
        : 'undefined'}
    </pre>
  );
};

// 4.1
test('useMapData returns indexed Map<geometryId, value> for the requested id', () => {
  const { getByTestId } = render(
    <GeoVisProvider spec={spec}>
      <Probe id="pop" />
    </GeoVisProvider>
  );
  const out = JSON.parse(getByTestId('out').textContent ?? 'null');
  expect(out.mapDataId).toBe('pop');
  expect(out.mapId).toBe('states');
  expect(out.entries).toEqual(
    expect.arrayContaining([
      ['BR', 211],
      ['1', 9.5],
      ['AR', null],
    ])
  );
});
