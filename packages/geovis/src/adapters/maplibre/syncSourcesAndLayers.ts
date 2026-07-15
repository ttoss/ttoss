import type maplibregl from 'maplibre-gl';

import type { VisualizationSpec } from '../../spec/types';
import {
  resolveLegendFillColorExpression,
  stripUndefinedPaint,
  toMaplibreLayer,
} from './layerTranslation';
import {
  resolvePromoteIdForSource,
  toMaplibreSource,
} from './sourceTranslation';

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
      const hoverCompanionId = `${layer.id}-hover-outline`;
      const selectedCompanionId = `${layer.id}-selected-outline`;
      const clickAnchorId = `${layer.id}-click-anchor`;
      if (map.getLayer(hoverCompanionId)) map.removeLayer(hoverCompanionId);
      if (map.getLayer(selectedCompanionId))
        map.removeLayer(selectedCompanionId);
      if (map.getLayer(clickAnchorId)) map.removeLayer(clickAnchorId);
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
      map.addSource(
        source.id,
        toMaplibreSource(source, {
          promoteId: resolvePromoteIdForSource(spec, source.id),
        })
      );
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

/**
 * Writes one paint property of an existing layer.
 *
 * For `mapData` polygon layers without explicit `fillColor`, legacy callers may
 * still inject a custom `fill-color` expression externally. Preserve that old
 * behaviour only when the layer has no active legend expression of its own.
 * When an active legend resolves, the adapter owns the choropleth colour and
 * must update `fill-color` on spec changes so the declared legend colours win.
 */
const writePaintProperty = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  layer: VisualizationSpec['layers'][number],
  property: string,
  value: unknown
): void => {
  if (property === 'fill-color' && layer.mapDataId) {
    const hasExplicitFillColor = !!(
      layer.paint as { fillColor?: string } | undefined
    )?.fillColor;
    const hasLegendFillColor =
      resolveLegendFillColorExpression(layer, spec.legends, spec.mapData) !==
      undefined;
    if (!hasExplicitFillColor && !hasLegendFillColor) return;
  }
  map.setPaintProperty(
    layer.id,
    property,
    value as maplibregl.StyleSpecification
  );
};

interface CompanionOutlineSpec {
  sourceId: string;
  sourceLayer: string | undefined;
  companionId: string;
  stateKey: 'hover' | 'selected';
  lineColor: string;
  lineWidth: number;
  visible: boolean;
}

/**
 * Adds or updates a feature-state-driven line companion layer that renders
 * a highlight outline when `outline.stateKey` is `true` on a feature.
 */
const upsertCompanionOutline = (
  map: maplibregl.Map,
  outline: CompanionOutlineSpec
): void => {
  const {
    sourceId,
    sourceLayer,
    companionId,
    stateKey,
    lineColor,
    lineWidth,
    visible,
  } = outline;
  const visibility = visible ? 'visible' : 'none';
  const widthExpr = [
    'case',
    ['boolean', ['feature-state', stateKey], false],
    lineWidth,
    0,
  ];
  if (!map.getLayer(companionId)) {
    const layerSpec: Record<string, unknown> = {
      id: companionId,
      type: 'line',
      source: sourceId,
      layout: { visibility },
      paint: { 'line-color': lineColor, 'line-width': widthExpr },
    };
    if (sourceLayer) layerSpec['source-layer'] = sourceLayer;
    map.addLayer(layerSpec as maplibregl.LayerSpecification);
  } else {
    map.setLayoutProperty(companionId, 'visibility', visibility);
    map.setPaintProperty(companionId, 'line-color', lineColor);
    map.setPaintProperty(companionId, 'line-width', widthExpr);
  }
};

/**
 * Upserts hover and selected outline companion layers for a single spec layer.
 * Exported so `patchDispatch.ts` can keep companion visibility in sync when a
 * layer's `visible` field is patched outside a full `syncSourcesAndLayers` pass
 * (`dispatch({ type: 'toggle-layer' })`, PRD-002).
 */
export const upsertOutlineCompanions = (
  map: maplibregl.Map,
  layer: VisualizationSpec['layers'][number],
  sourceLayer: string | undefined
): void => {
  const isVisible = layer.visible !== false;
  const hoverCompanionId = `${layer.id}-hover-outline`;
  if (layer.hoverPaint) {
    upsertCompanionOutline(map, {
      sourceId: layer.sourceId,
      sourceLayer,
      companionId: hoverCompanionId,
      stateKey: 'hover',
      lineColor: layer.hoverPaint.lineColor ?? '#333333',
      lineWidth: layer.hoverPaint.lineWidth ?? 2,
      visible: isVisible,
    });
  } else if (map.getLayer(hoverCompanionId)) {
    map.removeLayer(hoverCompanionId);
  }

  const selectedCompanionId = `${layer.id}-selected-outline`;
  if (layer.selectedPaint) {
    upsertCompanionOutline(map, {
      sourceId: layer.sourceId,
      sourceLayer,
      companionId: selectedCompanionId,
      stateKey: 'selected',
      lineColor: layer.selectedPaint.lineColor ?? '#1a1a1a',
      lineWidth: layer.selectedPaint.lineWidth ?? 3,
      visible: isVisible,
    });
  } else if (map.getLayer(selectedCompanionId)) {
    map.removeLayer(selectedCompanionId);
  }
};

/**
 * Upserts the click-anchor symbol companion layer for a single spec layer.
 * Exported for the same reason as `upsertOutlineCompanions` above.
 */
export const upsertClickAnchorCompanion = (
  map: maplibregl.Map,
  layer: VisualizationSpec['layers'][number],
  sourceLayer: string | undefined
): void => {
  const clickAnchorId = `${layer.id}-click-anchor`;
  if (layer.clickAnchor?.iconImage) {
    const iconImage = layer.clickAnchor.iconImage;
    const iconSize = layer.clickAnchor.iconSize ?? 1;
    const visibility = layer.visible !== false ? 'visible' : 'none';
    if (!map.getLayer(clickAnchorId)) {
      const anchorLayerSpec: Record<string, unknown> = {
        id: clickAnchorId,
        type: 'symbol',
        source: layer.sourceId,
        filter: ['boolean', ['feature-state', 'selected'], false],
        layout: { 'icon-image': iconImage, 'icon-size': iconSize, visibility },
      };
      if (sourceLayer) anchorLayerSpec['source-layer'] = sourceLayer;
      map.addLayer(anchorLayerSpec as maplibregl.LayerSpecification);
    } else {
      map.setLayoutProperty(clickAnchorId, 'icon-image', iconImage);
      map.setLayoutProperty(clickAnchorId, 'icon-size', iconSize);
      map.setLayoutProperty(clickAnchorId, 'visibility', visibility);
    }
  } else if (map.getLayer(clickAnchorId)) {
    map.removeLayer(clickAnchorId);
  }
};

/** Resolves the underlying vector-tile `source-layer` for a spec layer, falling back to its source's. */
const resolveSourceLayerFor = (
  spec: VisualizationSpec,
  layer: VisualizationSpec['layers'][number]
): string | undefined => {
  const source = spec.sources.find((s) => {
    return s.id === layer.sourceId;
  });
  const sourceLayer =
    source && 'sourceLayer' in source
      ? (source as { sourceLayer?: string }).sourceLayer
      : undefined;
  return layer.sourceLayer ?? sourceLayer;
};

/**
 * Recomputes one already-mounted layer's paint from its current spec-driven
 * bindings (`mapData`, legends, `sizeBy`) and writes every property via
 * `setPaintProperty`. This is the same recomputation `upsertLayers` performs
 * below for an existing layer during a full `update()` — factored out so a
 * lighter-weight patch (`dispatch({ type: 'set-map-data' })`, PRD-002) can
 * trigger it without a full `syncSourcesAndLayers` pass. No-op if the layer
 * isn't on the map yet.
 */
export const reapplyLayerPaint = (
  map: maplibregl.Map,
  spec: VisualizationSpec,
  layer: VisualizationSpec['layers'][number]
): void => {
  if (!map.getLayer(layer.id)) return;
  const desiredLayer = toMaplibreLayer(
    layer,
    resolveSourceLayerFor(spec, layer),
    spec.legends,
    spec.mapData,
    spec.scaleMaxValue
  );
  stripUndefinedPaint(desiredLayer);
  const paint = (desiredLayer as { paint?: Record<string, unknown> }).paint;
  if (!paint) return;
  for (const [property, value] of Object.entries(paint)) {
    writePaintProperty(map, spec, layer, property, value);
  }
};

/** Adds new layers and updates visibility/paint in-place (avoids remove-and-re-add flicker). */
const upsertLayers = (map: maplibregl.Map, spec: VisualizationSpec): void => {
  for (const layer of spec.layers) {
    const sourceLayer = resolveSourceLayerFor(spec, layer);
    const desiredLayer = toMaplibreLayer(
      layer,
      sourceLayer,
      spec.legends,
      spec.mapData,
      spec.scaleMaxValue
    );
    stripUndefinedPaint(desiredLayer);

    if (!map.getLayer(layer.id)) {
      map.addLayer(desiredLayer);
    } else {
      map.setLayoutProperty(
        layer.id,
        'visibility',
        layer.visible === false ? 'none' : 'visible'
      );
      reapplyLayerPaint(map, spec, layer);
    }

    const effectiveSourceLayer = layer.sourceLayer ?? sourceLayer;
    upsertOutlineCompanions(map, layer, effectiveSourceLayer);
    upsertClickAnchorCompanion(map, layer, effectiveSourceLayer);
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
