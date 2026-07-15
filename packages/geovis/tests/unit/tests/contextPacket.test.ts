import { buildContextPacket } from 'src/runtime/contextPacket';
import type { GeoVisResult } from 'src/spec/result';
import type { VisualizationSpec } from 'src/spec/types';

const RESOLVED = (spec: VisualizationSpec): GeoVisResult => {
  return { status: 'resolved', spec, warnings: [] };
};

const makeSpec = (): VisualizationSpec => {
  return {
    engine: 'maplibre',
    sources: [
      {
        id: 'src-1',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [{ id: 'lyr-1', sourceId: 'src-1', geometry: 'polygon' }],
  };
};

describe('buildContextPacket — legend summary', () => {
  test('a legend with no colorBy summarizes to just its id', () => {
    const spec: VisualizationSpec = {
      ...makeSpec(),
      legends: [{ id: 'legend-1' }],
    };
    const packet = buildContextPacket(spec, RESOLVED(spec));
    expect(packet.legends).toEqual([{ id: 'legend-1' }]);
  });

  test('a categorical legend reports scaleKind without a domain', () => {
    const spec: VisualizationSpec = {
      ...makeSpec(),
      legends: [
        {
          id: 'legend-1',
          colorBy: { type: 'categorical', property: 'status' },
        },
      ],
    };
    const packet = buildContextPacket(spec, RESOLVED(spec));
    expect(packet.legends).toEqual([
      { id: 'legend-1', scaleKind: 'categorical' },
    ]);
  });

  test('a threshold legend reports [min, max] as domain, never the full break list', () => {
    const spec: VisualizationSpec = {
      ...makeSpec(),
      legends: [
        {
          id: 'legend-1',
          colorBy: {
            type: 'quantitative',
            property: 'value',
            scale: 'threshold',
            thresholds: [10, 50, 30, 90],
          },
          labelFormat: { type: 'range', unit: 'inhabitants' },
        },
      ],
    };
    const packet = buildContextPacket(spec, RESOLVED(spec));
    expect(packet.legends).toEqual([
      {
        id: 'legend-1',
        scaleKind: 'threshold',
        domain: [10, 90],
        unit: 'inhabitants',
      },
    ]);
  });

  test('a threshold legend with no thresholds omits domain', () => {
    const spec: VisualizationSpec = {
      ...makeSpec(),
      legends: [
        {
          id: 'legend-1',
          colorBy: {
            type: 'quantitative',
            property: 'value',
            scale: 'threshold',
          },
        },
      ],
    };
    const packet = buildContextPacket(spec, RESOLVED(spec));
    expect(packet.legends[0].domain).toBeUndefined();
  });

  test('unit is omitted when labelFormat is not the range variant', () => {
    const spec: VisualizationSpec = {
      ...makeSpec(),
      legends: [
        {
          id: 'legend-1',
          colorBy: {
            type: 'quantitative',
            property: 'value',
            scale: 'threshold',
            thresholds: [1, 2],
          },
          labelFormat: { type: 'count' },
        },
      ],
    };
    const packet = buildContextPacket(spec, RESOLVED(spec));
    expect(packet.legends[0].unit).toBeUndefined();
  });
});

describe('buildContextPacket — warnings and lastResult', () => {
  test('warnings mirror a resolved result’s warnings; lastResult is the result verbatim', () => {
    const spec = makeSpec();
    const result: GeoVisResult = {
      status: 'resolved',
      spec,
      warnings: [
        {
          code: 'policy-violation',
          subject: { path: 'layers[lyr-1]' },
          message: 'raw counts on a choropleth',
        },
      ],
    };
    const packet = buildContextPacket(spec, result);
    expect(packet.warnings).toBe(result.warnings);
    expect(packet.lastResult).toBe(result);
  });

  test('warnings is empty for a non-resolved result', () => {
    const spec = makeSpec();
    const result: GeoVisResult = {
      status: 'mismatch',
      issues: [
        {
          code: 'unknown-source',
          subject: { path: 'layers[lyr-1].sourceId' },
          message: 'unknown source',
        },
      ],
    };
    const packet = buildContextPacket(spec, result);
    expect(packet.warnings).toEqual([]);
    expect(packet.lastResult).toBe(result);
  });
});

describe('buildContextPacket — mapType passthrough', () => {
  test('mapType is included when declared on the spec', () => {
    const spec: VisualizationSpec = { ...makeSpec(), mapType: 'choropleth' };
    const packet = buildContextPacket(spec, RESOLVED(spec));
    expect(packet.mapType).toBe('choropleth');
  });
});
