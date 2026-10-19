import type { Meta, StoryObj } from '@storybook/react-webpack5';
import type { VisualizationSpec } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVis } from '@ttoss/geovis';
import type { Map as MapLibreMap } from 'maplibre-gl';
import * as React from 'react';

import singleMapSpec from '../../../../packages/geovis/src/fixtures/single-map.json';
import { computeBbox, MapLabel } from './helpers/map-story-helpers';

/**
 * **Compass home.** Clicking the compass — the third button of the navigation
 * control, under `+` and `−` — flies the camera back to the map's home view
 * instead of only turning it north:
 *
 * - with `view.center`/`view.zoom` declared, to that view, `pitch` and
 *   `bearing` included — a tilted, turned map returns tilted and turned;
 * - without them, to a fresh fit of the data, as on first load.
 *
 * The home view is the one the spec declares: a camera move made through
 * `setView` — a search result, a "fly to" action — does not replace it.
 * Dragging the compass still rotates and tilts the map.
 *
 * ## What to check
 *
 * 1. **DeclaredView**: pan, zoom, rotate (right-drag) and tilt (Ctrl+drag).
 *    Click the compass: the camera flies back to zoom 5, pitch 45°, bearing
 *    −20°, and the readout agrees.
 * 2. Click **Fly elsewhere** (a `setView`), then the compass: it returns to
 *    the declared view, not to where `setView` went.
 * 3. Drag the compass: the map rotates, and releasing it does not fly home.
 * 4. **FitToData**: move the map, then click the compass — the camera fits
 *    the data again, flat and north-up.
 * 5. Hover the compass: its tooltip reads "click to return to the initial
 *    view".
 */

const bbox = computeBbox(
  singleMapSpec.sources[0].data as GeoJSON.FeatureCollection
);
const center: [number, number] = bbox
  ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
  : [0, 0];

const declaredSpec = {
  ...singleMapSpec,
  view: { center, zoom: 5, pitch: 45, bearing: -20 },
} as unknown as VisualizationSpec;

const fitSpec = {
  ...singleMapSpec,
  view: undefined,
} as unknown as VisualizationSpec;

/** Live camera readout, from the native map's `move` event. */
const CameraReadout = () => {
  const { runtime, setView } = useGeoVis();
  const [camera, setCamera] = React.useState('…');

  React.useEffect(() => {
    if (!runtime) return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;
    const update = () => {
      setCamera(
        `zoom ${map.getZoom().toFixed(2)} · pitch ${map.getPitch().toFixed(0)}° · bearing ${map.getBearing().toFixed(0)}°`
      );
    };
    update();
    map.on('move', update);
    return () => {
      map.off('move', update);
    };
  }, [runtime]);

  return (
    <MapLabel>
      <div>{camera}</div>
      {/* `MapLabel` passes pointer events through to the map; the button
          opts back in. */}
      <button
        type="button"
        style={{ marginTop: 6, pointerEvents: 'auto' }}
        onClick={() => {
          setView({
            center: [center[0] + 2, center[1] + 1],
            zoom: 6.5,
            pitch: 0,
            bearing: 60,
          });
        }}
      >
        Fly elsewhere (setView)
      </button>
    </MapLabel>
  );
};

const CompassHomeDemo = ({ spec }: { spec: VisualizationSpec }) => {
  return (
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
        <CameraReadout />
      </GeoVisProvider>
    </div>
  );
};

const meta = {
  title: 'GeoVis/CompassHome',
  component: CompassHomeDemo,
  tags: ['autodocs'],
} satisfies Meta<typeof CompassHomeDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A declared view, tilted and turned: the compass returns to it. */
export const DeclaredView: Story = {
  args: { spec: declaredSpec },
};

/** No `center`/`zoom`: the compass fits the data again. */
export const FitToData: Story = {
  args: { spec: fitSpec },
};
