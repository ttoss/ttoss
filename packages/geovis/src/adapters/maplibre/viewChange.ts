import type * as maplibregl from 'maplibre-gl';

import type { CameraView } from '../../runtime/adapter';

/** `onViewChange` subscribers of one adapter, shared by all its views. */
export type ViewChangeListeners = Set<(camera: CameraView) => void>;

/** Reads a mounted map's camera in the adapter-agnostic shape. */
const readCamera = (viewId: string, map: maplibregl.Map): CameraView => {
  const center = map.getCenter();
  return {
    viewId,
    center: [center.lng, center.lat],
    zoom: map.getZoom(),
    pitch: map.getPitch(),
    bearing: map.getBearing(),
  };
};

/**
 * Reports a mounted view's camera to the adapter's `onViewChange` subscribers
 * on every `move` — during the move, not only at its end, so a mirrored view
 * follows a drag frame by frame instead of catching up when it stops.
 *
 * @param params.map - The view's map.
 * @param params.viewId - The id the view was mounted with.
 * @param params.listeners - The adapter's subscribers, read at each move.
 *
 * @example
 * reportViewChanges({ map, viewId: 'default', listeners });
 */
export const reportViewChanges = ({
  map,
  viewId,
  listeners,
}: {
  map: maplibregl.Map;
  viewId: string;
  listeners: ViewChangeListeners;
}) => {
  map.on('move', () => {
    if (listeners.size === 0) return;
    const camera = readCamera(viewId, map);
    for (const listener of listeners) listener(camera);
  });
};

/**
 * Adds an `onViewChange` subscriber.
 *
 * @param listeners - The adapter's subscribers.
 * @param listener - The one to add.
 * @returns Its unsubscribe.
 *
 * @example
 * const unsubscribe = subscribeViewChanges(listeners, (camera) => {});
 */
export const subscribeViewChanges = (
  listeners: ViewChangeListeners,
  listener: (camera: CameraView) => void
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
