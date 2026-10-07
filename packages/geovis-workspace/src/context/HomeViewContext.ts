import type { ViewState } from '@ttoss/geovis';
import * as React from 'react';

/**
 * The camera the app's spec opens on — `visualizationSpec.view` — which a
 * variation change returns the map to.
 *
 * Read from the app's spec rather than from `useGeoVis().spec`: a camera move
 * (a locator pick, say) syncs the runtime's `spec.view` to wherever it went, so
 * the runtime's copy stops being the starting point the moment the reader
 * navigates. The app's spec keeps it, including the angles of the mode it is
 * in — a 3D view returns to its own pitch and bearing.
 *
 * `undefined` outside `GeovisWorkspace`, or for a spec without `view`.
 */
export const HomeViewContext = React.createContext<ViewState | undefined>(
  undefined
);
