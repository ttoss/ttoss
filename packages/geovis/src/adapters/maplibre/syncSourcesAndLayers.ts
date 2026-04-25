import type maplibregl from 'maplibre-gl';

import type { VisualizationSpec } from '../../spec/types';
import { toMaplibreLayer } from './layerTranslation';
import { toMaplibreSource } from './sourceTranslation';

/**
 * Removes layers that were present in `previousSpec` but are absent from
 * `spec`, provided they still exist in the live map.
 *
 * @remarks
 * Guarded by `map.getLayer()` to stay idempotent when the style has already
 * been reset (e.g. after `map.setStyle()`). Must be called before
 * `removeStaleSources` to avoid the MapLibre invariant violation of removing
 * a source that is still referenced by an active layer.
 */
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

/**
 * Removes sources that were present in `previousSpec` but are absent from
 * `spec`, provided they still exist in the live map.
 *
 * @remarks
 * Must be called after `removeStaleLayers` to avoid the MapLibre constraint
 * that a source cannot be removed while it is still referenced by a layer.
 */
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

/**
 * Adds sources from `spec` that do not yet exist in the map, and updates
 * GeoJSON source data when the data reference has changed.
 *
 * @remarks
 * Only GeoJSON sources support live data updates via `setData`. All other
 * source types are static after construction and must be removed and re-added
 * to be updated (handled by the stale-removal pass in `syncSourcesAndLayers`).
 *
 * Data updates are gated on reference inequality (`prevData !== source.data`)
 * to avoid redundant `setData` calls on every spec update cycle.
 */
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

/**
 * Adds layers from `spec` that do not yet exist in the map, and updates
 * visibility and paint properties for layers that already do.
 *
 * @remarks
 * Intentionally performs in-place property updates (`setLayoutProperty` /
 * `setPaintProperty`) rather than remove-and-re-add to avoid the visual
 * flicker and interruption of tile downloads that full layer removal causes.
 */
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
 * Reconciles the live MapLibre map's sources and layers with `spec`, using
 * `previousSpec` to compute the minimal diff.
 *
 * @remarks
 * When `previousSpec` is `null` (first mount or full style reset), only
 * additive operations (`upsertSources`, `upsertLayers`) run — there is
 * nothing stale to remove.
 *
 * Call order enforces MapLibre's dependency invariant:
 * 1. Remove stale layers (before their sources can be removed).
 * 2. Remove stale sources.
 * 3. Upsert sources (before layers that reference them).
 * 4. Upsert layers.
 *
 * @param previousSpec - The last known spec, used to identify stale entries.
 *   Pass `null` on first mount or after a `setStyle` reset.
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
