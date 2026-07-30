import type { Meta, StoryFn } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVis } from '@ttoss/geovis';
import type { Map as MapLibreMap } from 'maplibre-gl';
import * as React from 'react';

import singleMapSpec from '../../../../packages/geovis/src/fixtures/single-map.json';
import { computeBbox, MapLabel } from './helpers/map-story-helpers';

export default {
  title: 'GeoVis/View/ZoomLimits',
  tags: ['autodocs'],
} as Meta;

const MAX_ZOOM_OUT = 3;
const MAX_ZOOM_IN = 7;
const INITIAL_ZOOM = 5;

const bbox = computeBbox(
  singleMapSpec.sources[0].data as GeoJSON.FeatureCollection
);
const center: [number, number] = bbox
  ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
  : [0, 0];

/**
 * Reuses the Single Map fixture but pins the camera between a floor
 * (`maxZoomOut`) and a ceiling (`maxZoomIn`) so both limits are reachable by
 * scrolling within a few zoom levels.
 */
const spec = {
  ...singleMapSpec,
  title: 'Zoom limits — maxZoomIn / maxZoomOut',
  description: `Scroll to zoom in and out: the camera is clamped between maxZoomOut=${MAX_ZOOM_OUT} (farthest out) and maxZoomIn=${MAX_ZOOM_IN} (closest in). The readout stops moving once a limit is hit.`,
  view: {
    center,
    zoom: INITIAL_ZOOM,
    maxZoomIn: MAX_ZOOM_IN,
    maxZoomOut: MAX_ZOOM_OUT,
  },
} as unknown as VisualizationSpec;

/** Live zoom readout: listens to the native map's `zoom` event. */
const ZoomReadout = () => {
  const { runtime } = useGeoVis();
  const [zoom, setZoom] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!runtime) return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;
    const update = () => {
      return setZoom(map.getZoom());
    };
    update();
    map.on('zoom', update);
    return () => {
      map.off('zoom', update);
    };
  }, [runtime]);

  return (
    <MapLabel>
      <div>current zoom: {zoom == null ? '…' : zoom.toFixed(2)}</div>
      <div>maxZoomOut (floor): {MAX_ZOOM_OUT}</div>
      <div>maxZoomIn (ceiling): {MAX_ZOOM_IN}</div>
    </MapLabel>
  );
};

export const ZoomLimits: StoryFn = () => {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <strong>{spec.title}</strong>
        <p>{spec.description}</p>
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 560,
          border: '1px solid #d4d4d8',
        }}
      >
        <GeoVisProvider spec={spec}>
          <GeoVisCanvas viewId="primary" />
          <ZoomReadout />
        </GeoVisProvider>
      </div>
    </div>
  );
};
