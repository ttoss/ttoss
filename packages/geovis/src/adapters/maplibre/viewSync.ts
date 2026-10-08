import type maplibregl from 'maplibre-gl';

import type { VisualizationSpec } from '../../spec/types';

const syncCenter = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: VisualizationSpec['view']
): void => {
  if (!next?.center || next.center.length !== 2) return;
  const [lng, lat] = next.center;
  if (prev?.center?.[0] === lng && prev?.center?.[1] === lat) return;
  map.setCenter(next.center as maplibregl.LngLatLike);
};

const syncZoom = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: VisualizationSpec['view']
): void => {
  if (next?.zoom === undefined || next.zoom === prev?.zoom) return;
  map.setZoom(next.zoom);
};

const syncMaxZoom = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: VisualizationSpec['view']
): void => {
  if (prev?.maxZoomIn === next?.maxZoomIn) return;
  map.setMaxZoom(next?.maxZoomIn ?? null);
};

const syncMinZoom = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: VisualizationSpec['view']
): void => {
  if (prev?.maxZoomOut === next?.maxZoomOut) return;
  map.setMinZoom(next?.maxZoomOut ?? null);
};

/** The angles the next view changes, each only when it differs from the last. */
const changedAngles = (
  prev: VisualizationSpec['view'],
  next: NonNullable<VisualizationSpec['view']>
): { pitch?: number; bearing?: number } => {
  const changed: { pitch?: number; bearing?: number } = {};
  const pitch = next.pitch ?? 0;
  const bearing = next.bearing ?? 0;
  if ((prev?.pitch ?? 0) !== pitch) changed.pitch = pitch;
  if ((prev?.bearing ?? 0) !== bearing) changed.bearing = bearing;
  return changed;
};

/**
 * Moves the camera to the next spec's pitch and bearing, when either changed:
 * one ease over both when the view declares `cameraAngleTransitionMs`, a jump
 * otherwise. Only the changed angles are passed, so the ease never touches the
 * centre or zoom the reader panned to.
 */
const syncAngles = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: NonNullable<VisualizationSpec['view']>
): void => {
  const changed = changedAngles(prev, next);
  if (Object.keys(changed).length === 0) return;

  const duration = next.cameraAngleTransitionMs ?? 0;
  if (duration > 0) {
    map.easeTo({ ...changed, duration });
    return;
  }
  if (changed.pitch !== undefined) map.setPitch(changed.pitch);
  if (changed.bearing !== undefined) map.setBearing(changed.bearing);
};

export const syncMapView = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: VisualizationSpec['view']
): void => {
  if (!next) return;
  syncCenter(map, prev, next);
  syncMaxZoom(map, prev, next);
  syncMinZoom(map, prev, next);
  syncZoom(map, prev, next);
  syncAngles(map, prev, next);
};
