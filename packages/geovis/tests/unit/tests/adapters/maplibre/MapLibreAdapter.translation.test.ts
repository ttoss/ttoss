/**
 * Tests for translating the visualization spec into MapLibre sources and
 * layers.
 */

import {
  toMaplibreLayer,
  toMaplibreSource,
} from 'src/adapters/maplibre/MapLibreAdapter';
import type {
  DataSource,
  HeatmapPaint,
  RasterPaint,
  SymbolPaint,
  VisualizationLayer,
} from 'src/spec/types';

import {
  installMapLibreDomMocks,
  resetMapLibreDomMocks,
} from './mapLibreAdapterTestUtils';

jest.mock('maplibre-gl', () => {
  return {
    Map: jest.fn(),
    NavigationControl: jest.fn().mockImplementation(() => {
      return {};
    }),
  };
});

installMapLibreDomMocks();

beforeEach(() => {
  resetMapLibreDomMocks();
});

describe('toMaplibreSource', () => {
  test('geojson source with url string', () => {
    const source: DataSource = {
      id: 's1',
      type: 'geojson',
      data: 'https://example.com/data.geojson',
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'geojson',
      data: 'https://example.com/data.geojson',
    });
  });

  test('vector-tiles source', () => {
    const source: DataSource = {
      id: 's2',
      type: 'vector-tiles',
      tiles: ['https://example.com/{z}/{x}/{y}.pbf'],
      minzoom: 0,
      maxzoom: 14,
      attribution: '© Example',
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'vector',
      tiles: ['https://example.com/{z}/{x}/{y}.pbf'],
      minzoom: 0,
      maxzoom: 14,
      attribution: '© Example',
    });
  });

  test('raster-tiles source applies default tileSize 256', () => {
    const source: DataSource = {
      id: 's3',
      type: 'raster-tiles',
      tiles: ['https://example.com/{z}/{x}/{y}.png'],
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'raster',
      tileSize: 256,
    });
  });

  test('raster-tiles source respects explicit tileSize 512', () => {
    const source: DataSource = {
      id: 's3b',
      type: 'raster-tiles',
      tiles: ['https://tile.example/{z}/{x}/{y}.png'],
      tileSize: 512,
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'raster',
      tileSize: 512,
    });
  });

  test('image source', () => {
    const source: DataSource = {
      id: 's4',
      type: 'image',
      url: 'https://example.com/image.png',
      coordinates: [
        [-80, 25],
        [-80, 26],
        [-79, 26],
        [-79, 25],
      ],
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'image',
      url: 'https://example.com/image.png',
    });
  });

  test('raster-dem source with encoding', () => {
    const source: DataSource = {
      id: 's5',
      type: 'raster-dem',
      tiles: ['https://tiles.example/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'raster-dem',
      encoding: 'terrarium',
      tileSize: 256,
    });
  });

  test('video source', () => {
    const source: DataSource = {
      id: 's6',
      type: 'video',
      urls: ['https://example.com/v.mp4'],
      coordinates: [
        [-122, 37],
        [-122, 38],
        [-121, 38],
        [-121, 37],
      ],
    };
    expect(toMaplibreSource(source)).toMatchObject({
      type: 'video',
      urls: ['https://example.com/v.mp4'],
    });
  });
});

describe('toMaplibreLayer', () => {
  const base = { id: 'l1', sourceId: 's1', visible: true as const };

  test('polygon → fill with defaults', () => {
    const layer: VisualizationLayer = { ...base, geometry: 'polygon' };
    expect(toMaplibreLayer(layer)).toMatchObject({
      type: 'fill',
      paint: { 'fill-color': '#3b82f6' },
    });
  });

  test('polygon with custom paint', () => {
    const layer: VisualizationLayer = {
      ...base,
      geometry: 'polygon',
      paint: { fillColor: '#ff0000', lineColor: '#000' },
    };
    expect(toMaplibreLayer(layer)).toMatchObject({
      paint: { 'fill-color': '#ff0000' },
    });
  });

  test('polygon uses active categorical legend expression as fill-color', () => {
    const layer: VisualizationLayer = {
      ...base,
      geometry: 'polygon',
      paint: { fillColor: '#ff0000' },
      legends: [
        {
          id: 'status',
          colorBy: {
            type: 'categorical',
            property: 'status',
            mapping: {
              open: '#16a34a',
              closed: '#dc2626',
            },
            defaultColor: '#6b7280',
          },
        },
      ],
      activeLegendId: 'status',
    };

    expect(toMaplibreLayer(layer)).toMatchObject({
      paint: {
        'fill-color': [
          'match',
          [
            'to-string',
            ['coalesce', ['feature-state', 'value'], '__missing__'],
          ],
          'open',
          '#16a34a',
          'closed',
          '#dc2626',
          '#6b7280',
        ],
      },
    });
  });

  test('polygon uses threshold breaks when active legend scale is threshold', () => {
    const layer: VisualizationLayer = {
      ...base,
      geometry: 'polygon',
      legends: [
        {
          id: 'population',
          colorBy: {
            type: 'quantitative',
            property: 'population',
            scale: 'threshold',
            thresholds: [30, 10, 10],
            colors: ['#eff6ff', '#bfdbfe', '#60a5fa'],
            defaultColor: '#1e3a8a',
          },
        },
      ],
      activeLegendId: 'population',
    };

    expect(toMaplibreLayer(layer)).toMatchObject({
      paint: {
        'fill-color': [
          'step',
          ['to-number', ['coalesce', ['feature-state', 'value'], 0], 0],
          '#1e3a8a',
          10,
          '#bfdbfe',
          30,
          '#60a5fa',
        ],
      },
    });
  });

  test('polygon keeps static fill-color when active legend id does not resolve', () => {
    const layer: VisualizationLayer = {
      ...base,
      geometry: 'polygon',
      paint: { fillColor: '#ff0000' },
      legends: [
        {
          id: 'status',
          colorBy: {
            type: 'categorical',
            property: 'status',
            mapping: { open: '#16a34a' },
          },
        },
      ],
      activeLegendId: 'missing-id',
    };

    expect(toMaplibreLayer(layer)).toMatchObject({
      paint: { 'fill-color': '#ff0000' },
    });
  });

  test('line → line with defaults', () => {
    const layer: VisualizationLayer = { ...base, geometry: 'line' };
    expect(toMaplibreLayer(layer)).toMatchObject({
      type: 'line',
      paint: { 'line-color': '#3b82f6', 'line-width': 2 },
    });
  });

  test('point → circle', () => {
    const layer: VisualizationLayer = { ...base, geometry: 'point' };
    expect(toMaplibreLayer(layer)).toMatchObject({ type: 'circle' });
  });

  test('symbol → symbol layer with text/icon paint and layout', () => {
    const layer: VisualizationLayer = {
      ...base,
      geometry: 'symbol',
      paint: { textField: 'Hello', textSize: 14 } as SymbolPaint,
    };
    const result = toMaplibreLayer(layer);
    expect(result).toMatchObject({ type: 'symbol' });
    expect(
      (result as { layout: Record<string, unknown> }).layout
    ).toMatchObject({ 'text-field': 'Hello', 'text-size': 14 });
    expect((result as { paint: Record<string, unknown> }).paint).toMatchObject({
      'text-color': '#000000',
    });
  });

  test('heatmap → heatmap layer with heatmap paint properties', () => {
    const layer: VisualizationLayer = {
      ...base,
      geometry: 'heatmap',
      paint: { heatmapRadius: 20 } as HeatmapPaint,
    };
    const result = toMaplibreLayer(layer);
    expect(result).toMatchObject({ type: 'heatmap' });
    expect((result as { paint: Record<string, unknown> }).paint).toMatchObject({
      'heatmap-radius': 20,
      'heatmap-intensity': 1,
      'heatmap-weight': 1,
    });
  });

  test('raster → raster layer with raster paint properties', () => {
    const layer: VisualizationLayer = {
      ...base,
      geometry: 'raster',
      paint: { rasterOpacity: 0.5 } as RasterPaint,
    };
    const result = toMaplibreLayer(layer);
    expect(result).toMatchObject({ type: 'raster' });
    expect((result as { paint: Record<string, unknown> }).paint).toMatchObject({
      'raster-opacity': 0.5,
    });
  });

  test('raster paint defaults raster-opacity to 1 when unset', () => {
    const layer: VisualizationLayer = { ...base, geometry: 'raster' };
    const result = toMaplibreLayer(layer);
    expect((result as { paint: Record<string, unknown> }).paint).toMatchObject({
      'raster-opacity': 1,
    });
  });

  test('visible: false → layout visibility none', () => {
    const layer: VisualizationLayer = {
      ...base,
      geometry: 'polygon',
      visible: false,
    };
    expect(toMaplibreLayer(layer)).toHaveProperty('layout.visibility', 'none');
  });

  test('visible: true → layout visibility visible', () => {
    const layer: VisualizationLayer = { ...base, geometry: 'line' };
    expect(toMaplibreLayer(layer)).toHaveProperty(
      'layout.visibility',
      'visible'
    );
  });
});
