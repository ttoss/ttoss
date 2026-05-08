import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { MapClickInfo, VisualizationSpec } from '@ttoss/geovis';
import {
  GeoVisCanvas,
  GeoVisProvider,
  useGeoVis,
  useGeoVisClick,
} from '@ttoss/geovis';
import type { Map as MapLibreMap } from 'maplibre-gl';
import * as React from 'react';

import clickedSymbolSpec from '../../../../packages/geovis/src/fixtures/clicked-symbol.json';

export default {
  title: 'GeoVis/Fixtures/CenterOnClickedSymbol',
  parameters: { layout: 'fullscreen' },
  tags: ['autodocs'],
} as Meta;

/**
 * Displays the last clicked location in a floating badge.
 */
const ClickBadge = ({ info }: { info: MapClickInfo }) => {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        left: 16,
        background: 'rgba(0,0,0,0.72)',
        color: '#fff',
        padding: '8px 14px',
        borderRadius: 6,
        fontSize: 13,
        lineHeight: 1.5,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      <strong>Clicked feature</strong>
      <br />
      Layer: {info.layerId}
      <br />
      Coords: {info.lngLat[0].toFixed(5)}, {info.lngLat[1].toFixed(5)}
    </div>
  );
};

/**
 * Inner component — must be a child of GeoVisProvider to use context hooks.
 * Reads the last click from `useGeoVisClick` and calls `setView` to fly
 * the camera to the clicked feature's coordinates.
 */
const CUSTOM_MARKER_URL =
  'https://maplibre.org/maplibre-gl-js/docs/assets/custom_marker.png';

const CenterOnClick = () => {
  const { runtime, setView } = useGeoVis();
  const clickInfo = useGeoVisClick();

  React.useEffect(() => {
    if (!runtime) return;

    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    const loadImage = async () => {
      if (map.hasImage('custom-marker')) return;
      const { data } = await map.loadImage(CUSTOM_MARKER_URL);
      map.addImage('custom-marker', data);
    };

    const canvas = map.getCanvas();
    const setCursorPointer = () => {
      canvas.style.cursor = 'pointer';
    };
    const resetCursor = () => {
      canvas.style.cursor = '';
    };

    map.on('mouseenter', 'markers-layer', setCursorPointer);
    map.on('mouseleave', 'markers-layer', resetCursor);

    if (map.isStyleLoaded()) {
      loadImage();
    } else {
      map.once('load', loadImage);
    }

    return () => {
      map.off('mouseenter', 'markers-layer', setCursorPointer);
      map.off('mouseleave', 'markers-layer', resetCursor);
    };
  }, [runtime]);

  React.useEffect(() => {
    if (!clickInfo) return;
    setView({ center: clickInfo.lngLat });
  }, [clickInfo, setView]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <GeoVisCanvas viewId="primary" />
      {clickInfo && <ClickBadge info={clickInfo} />}
    </div>
  );
};

/**
 * Click any circle marker to fly the map to that location.
 *
 * Demonstrates the `useGeoVisClick` + `setView` pattern from the
 * [MapLibre "Center the map on a clicked symbol" example](https://maplibre.org/maplibre-gl-js/docs/examples/center-the-map-on-a-clicked-symbol/).
 *
 * The click handler works on **any geometry type** (point, line, polygon,
 * symbol, heatmap) — the only requirement is that the layer has
 * `activeLegendId` set and that the GeoJSON features carry a top-level `id`.
 */
export const CenterOnClickedSymbol: StoryFn = () => {
  return (
    <GeoVisProvider spec={clickedSymbolSpec as unknown as VisualizationSpec}>
      <CenterOnClick />
    </GeoVisProvider>
  );
};
