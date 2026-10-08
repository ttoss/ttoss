import { useGeoVis } from '@ttoss/geovis';
import * as React from 'react';

import { HomeViewContext } from '../../context/HomeViewContext';

/** How long the camera takes to fly back to the home view, in milliseconds. */
export const RESET_VIEW_DURATION_MS = 800;

/**
 * Returns a function flying the camera back to the home view — the `view` the
 * app's spec opens on (see `HomeViewContext`) — angles included.
 *
 * Does nothing when the spec declares no `center` and `zoom`: a spec that
 * leaves the camera to fit its data has no fixed home to fly to.
 *
 * @returns The reset.
 *
 * @example
 * const resetMapView = useResetMapView();
 * resetMapView(); // back to the spec's center, zoom, pitch and bearing
 */
export const useResetMapView = () => {
  const { setView } = useGeoVis();
  const home = React.useContext(HomeViewContext);

  return () => {
    if (!home?.center || home.zoom === undefined) return;
    setView({
      center: home.center,
      zoom: home.zoom,
      pitch: home.pitch ?? 0,
      bearing: home.bearing ?? 0,
      duration: RESET_VIEW_DURATION_MS,
    });
  };
};
