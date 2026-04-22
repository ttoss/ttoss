/**
 * @jest-environment jsdom
 */

import { render } from '@testing-library/react';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import { GeoVisViews } from 'src/react/GeoVisViews';
import type { PresentationMode, VisualizationSpec } from 'src/spec/types';

jest.mock('src/runtime/createRuntime', () => {
  return {
    createRuntime: jest.fn(() => {
      return {
        spec: {},
        mount: jest.fn(() => {
          return { viewId: 'v', container: {}, destroy: jest.fn() };
        }),
        update: jest.fn(),
        applyPatch: jest.fn(),
        destroy: jest.fn(),
        getAdapter: jest.fn(),
      };
    }),
  };
});

jest.mock('src/adapters/maplibre/MapLibreAdapter', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      return {
        id: 'maplibre',
        getCapabilities: jest.fn(),
        mount: jest.fn(),
        update: jest.fn(),
        destroy: jest.fn(),
        getNativeInstance: jest.fn(() => {
          return null;
        }),
      };
    }),
  };
});

jest.mock('src/react/GeoVisCanvas', () => {
  return {
    GeoVisCanvas: ({ viewId }: { viewId: string }) => {
      return <div data-testid={`canvas-${viewId}`}>{viewId}</div>;
    },
  };
});

const buildSpec = (presentation?: PresentationMode): VisualizationSpec => {
  return {
    id: 'test',
    engine: 'maplibre',
    view: { center: [0, 0], zoom: 1 },
    data: [
      {
        id: 'src',
        geojson: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      { id: 'l1', type: 'fill', source: 'src' },
      { id: 'l2', type: 'fill', source: 'src' },
    ],
    views: [
      { id: 'v1', label: '2020', layers: ['l1'] },
      { id: 'v2', label: '2021', layers: ['l2'] },
    ],
    presentation,
  };
};

describe('GeoVisViews', () => {
  test('renders all views as panels in side-by-side mode', () => {
    const spec = buildSpec('side-by-side');
    const { getByTestId } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisViews />
      </GeoVisProvider>
    );
    expect(getByTestId('canvas-v1')).toBeTruthy();
    expect(getByTestId('canvas-v2')).toBeTruthy();
  });

  test('renders only the active view in tabs mode', () => {
    const spec = buildSpec('tabs');
    const { getByTestId, queryByTestId } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisViews />
      </GeoVisProvider>
    );
    expect(getByTestId('canvas-v1')).toBeTruthy();
    expect(queryByTestId('canvas-v2')).toBeNull();
  });

  test('renders a range slider in time-slider mode', () => {
    const spec = buildSpec('time-slider');
    const { container, getByTestId } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisViews />
      </GeoVisProvider>
    );
    expect(getByTestId('canvas-v1')).toBeTruthy();
    expect(container.querySelector('input[type="range"]')).toBeTruthy();
  });

  test('falls back to a single canvas when spec has no views', () => {
    const spec: VisualizationSpec = {
      id: 'test',
      engine: 'maplibre',
      view: { center: [0, 0], zoom: 1 },
      data: [],
      layers: [],
    };
    const { getByTestId } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisViews />
      </GeoVisProvider>
    );
    expect(getByTestId('canvas-default')).toBeTruthy();
  });

  test('invokes renderView with the active view and its primary layer', () => {
    const spec = buildSpec('tabs');
    const seen: string[] = [];
    render(
      <GeoVisProvider spec={spec}>
        <GeoVisViews
          renderView={({ view, layer }) => {
            seen.push(`${view.id}:${layer?.id ?? 'none'}`);
            return null;
          }}
        />
      </GeoVisProvider>
    );
    expect(seen).toContain('v1:l1');
  });

  test('mode prop overrides spec.presentation', () => {
    const spec = buildSpec('tabs');
    const { getByTestId } = render(
      <GeoVisProvider spec={spec}>
        <GeoVisViews mode="side-by-side" />
      </GeoVisProvider>
    );
    expect(getByTestId('canvas-v1')).toBeTruthy();
    expect(getByTestId('canvas-v2')).toBeTruthy();
  });
});
