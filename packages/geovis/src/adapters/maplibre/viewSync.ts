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

export const syncMapView = (
  map: maplibregl.Map,
  prev: VisualizationSpec['view'],
  next: VisualizationSpec['view']
): void => {
  if (!next) return;
  const p = prev ?? {};
  syncCenter(map, prev, next);
  syncMaxZoom(map, prev, next);
  syncMinZoom(map, prev, next);
  syncZoom(map, prev, next);
  const pp = p.pitch ?? 0;
  const np = next.pitch ?? 0;
  if (pp !== np) map.setPitch(np);
  const pb = p.bearing ?? 0;
  const nb = next.bearing ?? 0;
  if (pb !== nb) map.setBearing(nb);
};
