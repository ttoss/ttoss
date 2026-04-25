import type maplibregl from 'maplibre-gl';

import type { VisualizationSpec } from '../../spec/types';
import { toMaplibreLayer } from './layerTranslation';
import { toMaplibreSource } from './sourceTranslation';

/** Removes layers from `previousSpec` no longer present in `spec`. */
const removeStaleLayers = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  previousSpec: VisualizationSpec
): void => {
  for (const layer of previousSpec.layers) {
    const stillExists = spec.layers.some((nextLayer) => {
      return nextLayer.id === layer.id;
    });
    if (!stillExists && map.getLayer(layer.id)) {
      map.removeLayer(layer.id);
    }
  }
};

/** Removes sources from `previousSpec` no longer present in `spec`. Must be called after `removeStaleLayers`. */
const removeStaleSources = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  previousSpec: VisualizationSpec
): void => {
  for (const source of previousSpec.sources) {
    const stillExists = spec.sources.some((nextSource) => {
      return nextSource.id === source.id;
    });
    if (!stillExists && map.getSource(source.id)) {
      map.removeSource(source.id);
    }
  }
};

/** Adds new sources and updates GeoJSON source data when the data reference changes. */
const upsertSources = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  previousSpec: VisualizationSpec | null
): void => {
  for (const source of spec.sources) {
    if (!map.getSource(source.id)) {
      map.addSource(source.id, toMaplibreSource(source));
      continue;
    }
    if (source.type !== 'geojson') continue;
    const prevSource = previousSpec?.sources.find((s) => {
      return s.id === source.id;
    });
    const prevData =
      prevSource?.type === 'geojson' ? prevSource.data : undefined;
    if (prevData !== source.data) {
      (map.getSource(source.id) as maplibregl.GeoJSONSource).setData(
        source.data as maplibregl.GeoJSONSourceSpecification['data']
      );
    }
  }
};

const stripUndefinedPaint = (layer: maplibregl.LayerSpecification): void => {
  const paint = (layer as { paint?: Record<string, unknown> }).paint;
  if (!paint) return;
  (layer as { paint?: Record<string, unknown> }).paint = Object.fromEntries(
    Object.entries(paint).filter(([, value]) => {
      return value !== undefined;
    })
  );
};

/** Adds new layers and updates visibility/paint in-place (avoids remove-and-re-add flicker). */
const upsertLayers = (map: maplibregl.Map, spec: VisualizationSpec): void => {
  for (const layer of spec.layers) {
    const source = spec.sources.find((s) => {
      return s.id === layer.sourceId;
    });
    const sourceLayer =
      source && 'sourceLayer' in source
        ? (source as { sourceLayer?: string }).sourceLayer
        : undefined;
    const desiredLayer = toMaplibreLayer(layer, sourceLayer);
    stripUndefinedPaint(desiredLayer);

    if (!map.getLayer(layer.id)) {
      map.addLayer(desiredLayer);
      continue;
    }

    map.setLayoutProperty(
      layer.id,
      'visibility',
      layer.visible === false ? 'none' : 'visible'
    );

    const paint = (desiredLayer as { paint?: Record<string, unknown> }).paint;
    if (!paint) continue;
    for (const [property, value] of Object.entries(paint)) {
      map.setPaintProperty(
        layer.id,
        property,
        value as maplibregl.StyleSpecification
      );
    }
  }
};

/**
 * Reconciles the live MapLibre map's sources and layers with `spec`.
 * When `previousSpec` is `null` (first mount or style reset), only additive operations run.
 * Call order enforces MapLibre's dependency invariant: remove layers → remove sources → upsert sources → upsert layers.
 */
export const syncSourcesAndLayers = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  previousSpec: VisualizationSpec | null
): void => {
  if (previousSpec) {
    removeStaleLayers(map, spec, previousSpec);
    removeStaleSources(map, spec, previousSpec);
  }
  upsertSources(map, spec, previousSpec);
  upsertLayers(map, spec);
};
