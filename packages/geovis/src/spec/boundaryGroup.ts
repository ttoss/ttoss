import type {
  DataSource,
  GeoJSONObject,
  VisualizationLayer,
  VisualizationSpec,
} from './types';

export interface BoundaryGroup {
  sources: DataSource[];
  layers: VisualizationLayer[];
}

export interface BoundaryPaintOverrides {
  lineColor?: string;
  lineWidth?: number;
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

interface CreateBoundaryGroupOptions {
  /** Source ID — referenced by each layer's `sourceId`. */
  id: string;
  /** Inline GeoJSON object or a URL string that MapLibre will fetch. */
  data: string | GeoJSONObject;
  /** Layer ID. Defaults to `${id}-line`. */
  layerId?: string;
  /** Line paint overrides. Defaults: lineColor `'#6b7280'`, lineWidth `1`. */
  paint?: BoundaryPaintOverrides;
}

/**
 * Creates a `BoundaryGroup` containing a single GeoJSON source and a line
 * layer with sensible paint defaults.
 *
 * @returns A new BoundaryGroup ready to be used with `appendBoundaryGroup`
 *   or `useBoundaryToggle`.
 *
 * @example
 * ```ts
 * // URL — MapLibre fetches the GeoJSON internally
 * const states = createBoundaryGroup({
 *   id: 'brazil-states',
 *   data: 'https://example.com/estados.geojson',
 * });
 *
 * // Inline GeoJSON
 * const districts = createBoundaryGroup({
 *   id: 'sp-districts',
 *   data: { type: 'FeatureCollection', features: [...] },
 *   paint: { lineColor: '#ef4444', lineWidth: 2 },
 * });
 * ```
 */
export const createBoundaryGroup = (
  options: CreateBoundaryGroupOptions
): BoundaryGroup => {
  const { id, data, layerId, paint } = options;
  return {
    sources: [{ id, type: 'geojson', data }],
    layers: [
      {
        id: layerId ?? `${id}-line`,
        sourceId: id,
        geometry: 'line',
        paint: {
          lineColor: paint?.lineColor ?? '#6b7280',
          lineWidth: paint?.lineWidth ?? 1,
        },
      },
    ],
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Merges a `BoundaryGroup` into an existing `VisualizationSpec`.
 *
 * Appends the group's sources and layers to the spec's arrays.
 * Returns a new spec object — the original is not mutated.
 *
 * @param spec - The base spec (without the boundary group).
 * @param group - The boundary group to append.
 * @returns A new spec with the group's sources and layers appended.
 */
export const appendBoundaryGroup = (
  spec: VisualizationSpec,
  group: BoundaryGroup
): VisualizationSpec => {
  return {
    ...spec,
    sources: [...spec.sources, ...group.sources],
    layers: [...spec.layers, ...group.layers],
  };
};

/**
 * Sets the `visible` flag on every layer in `spec` whose `id` matches any
 * layer ID in `group`.
 *
 * When `visible` is `true` the property is omitted (default-visible).
 * When `visible` is `false` the property is explicitly set to `false`.
 *
 * Layers not belonging to the group are left untouched.
 * Returns a new spec object — the original is not mutated.
 *
 * @param spec - The spec containing the layers to toggle.
 * @param group - The boundary group whose layers should be toggled.
 * @param visible - `true` to show (omit visible property), `false` to hide.
 * @returns A new spec with the updated visibility flags.
 */
export const toggleBoundaryGroup = (
  spec: VisualizationSpec,
  group: BoundaryGroup,
  visible: boolean
): VisualizationSpec => {
  const groupLayerIds = new Set(
    group.layers.map((l) => {
      return l.id;
    })
  );
  const updateLayer = (layer: VisualizationLayer): VisualizationLayer => {
    if (!groupLayerIds.has(layer.id)) return layer;
    if (visible) {
      const { visible: _omit, ...rest } = layer;
      return rest;
    }
    return { ...layer, visible: false };
  };
  return {
    ...spec,
    layers: spec.layers.map(updateLayer),
  };
};

/**
 * Returns a new `BoundaryGroup` with overridden paint properties on every
 * line layer. The original group is not mutated.
 *
 * Only `lineColor` and `lineWidth` are supported — non-line layers are
 * returned unchanged.
 *
 * @param group - The boundary group to customize.
 * @param overrides - Partial paint properties to apply.
 * @returns A new BoundaryGroup with the overridden paint applied to line layers.
 *
 * @example
 * ```ts
 * const thickStates = customizeBoundaryGroup(statesGroup, {
 *   lineColor: '#ef4444',
 *   lineWidth: 3,
 * });
 * ```
 */
export const customizeBoundaryGroup = (
  group: BoundaryGroup,
  overrides: BoundaryPaintOverrides
): BoundaryGroup => {
  const paintOverride: Record<string, unknown> = {};
  if (overrides.lineColor !== undefined) {
    paintOverride.lineColor = overrides.lineColor;
  }
  if (overrides.lineWidth !== undefined) {
    paintOverride.lineWidth = overrides.lineWidth;
  }
  return {
    sources: group.sources,
    layers: group.layers.map((layer) => {
      if (layer.geometry !== 'line') {
        return layer;
      }
      return {
        ...layer,
        paint: { ...(layer.paint ?? {}), ...paintOverride },
      };
    }),
  };
};
