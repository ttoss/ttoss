import type { Map as MapLibreMap } from 'maplibre-gl';
import * as React from 'react';

import {
  resolveColorBy,
  type ResolvedColorBy,
  type ResolvedQuantitativeColorBy,
} from '../spec/colorBy';
import type {
  ColorBy,
  GeoJSONFeature,
  GeoJSONGeometry,
  LegendSpec,
  VisualizationLayer,
} from '../spec/types';
import { useGeoVis } from './GeoVisProvider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getInlineFeaturesForLayer = (
  layer: VisualizationLayer | undefined,
  data: { id: string; kind: string; geojson?: unknown }[]
): GeoJSONFeature[] | null => {
  if (!layer) return null;
  const entry = data.find((d) => {
    return d.id === layer.dataId;
  });
  if (!entry || entry.kind !== 'geojson-inline') return null;
  const g = entry.geojson as { type?: string; features?: GeoJSONFeature[] };
  if (g.type === 'FeatureCollection' && Array.isArray(g.features)) {
    return g.features;
  }
  return null;
};

const queryNativeFeatures = (
  map: MapLibreMap | null,
  sourceId: string | undefined
): GeoJSONFeature[] => {
  if (!map || !sourceId) return [];
  if (!map.getSource(sourceId)) return [];
  return map.querySourceFeatures(sourceId).map((f) => {
    return {
      type: 'Feature' as const,
      geometry: f.geometry as unknown as GeoJSONGeometry,
      properties: (f.properties ?? {}) as Record<string, unknown>,
    };
  });
};

// ---------------------------------------------------------------------------
// useResolvedColorBy
// ---------------------------------------------------------------------------

/**
 * Resolves a `ColorBy` against the active visualisation \u2014 returns the final
 * palette, default colour, and (for quantitative scales) the thresholds.
 *
 * Works for both `geojson-inline` data (resolved synchronously) and
 * `geojson-url` data (resolved after the MapLibre source loads).
 */
const useResolvedColorBy = (
  colorBy: ColorBy | undefined,
  layerId: string | undefined
): ResolvedColorBy | null => {
  const { runtime, spec } = useGeoVis();
  const [resolved, setResolved] = React.useState<ResolvedColorBy | null>(null);

  React.useEffect(() => {
    if (!colorBy) {
      setResolved(null);
      return;
    }

    const layer = spec.layers?.find((l) => {
      return l.id === layerId;
    });

    // 1. Try inline features first (synchronous).
    const inlineFeatures = getInlineFeaturesForLayer(layer, spec.data);
    if (inlineFeatures && inlineFeatures.length > 0) {
      setResolved(resolveColorBy(colorBy, inlineFeatures));
      return;
    }

    // 2. Wait for the engine to load the URL source, then query features.
    if (!runtime) return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map || !layer) return;

    let cancelled = false;
    let lastFeatureCount = 0;
    const sourceId = layer.dataId;

    const tryResolve = () => {
      if (cancelled) return;
      const features = queryNativeFeatures(map, sourceId);
      // Only re-resolve when the visible feature set grew \u2014 e.g. after
      // autoFit zooms out and `querySourceFeatures` starts returning entries
      // it could not see before. Avoids spurious re-renders on every event.
      if (features.length === 0 || features.length === lastFeatureCount) {
        return;
      }
      lastFeatureCount = features.length;
      setResolved(resolveColorBy(colorBy, features));
    };

    const onSourceData = (e: maplibregl.MapSourceDataEvent) => {
      if (e.sourceId !== sourceId || !e.isSourceLoaded) return;
      tryResolve();
    };

    // Try immediately (source may already be loaded when component mounts).
    tryResolve();
    map.on('sourcedata', onSourceData);
    map.on('idle', tryResolve);
    map.on('moveend', tryResolve);

    return () => {
      cancelled = true;
      map.off('sourcedata', onSourceData);
      map.off('idle', tryResolve);
      map.off('moveend', tryResolve);
    };
  }, [colorBy, layerId, runtime, spec]);

  return resolved;
};

// ---------------------------------------------------------------------------
// QuantitativeLegendBody
// ---------------------------------------------------------------------------

const formatNumber = (v: number): string => {
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return v.toLocaleString('en-US', { maximumFractionDigits: 2 });
};

const QuantitativeLegendBody = ({
  resolved,
  formatValue,
}: {
  resolved: ResolvedQuantitativeColorBy;
  formatValue?: (v: number) => string;
}) => {
  const fmt = formatValue ?? formatNumber;
  const { palette, defaultColor, thresholds } = resolved;
  const allColors = [defaultColor, ...palette.slice(1)];
  const gradient = `linear-gradient(to right, ${allColors.join(', ')})`;
  const minLabel = thresholds.length > 0 ? `< ${fmt(thresholds[0])}` : null;
  const maxLabel =
    thresholds.length > 0
      ? `\u2265 ${fmt(thresholds[thresholds.length - 1])}`
      : null;

  return (
    <>
      <div style={{ height: 8, background: gradient, borderRadius: 2 }} />
      {minLabel && maxLabel ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 2,
          }}
        >
          <span style={{ fontSize: 9, color: '#6b7280' }}>{minLabel}</span>
          <span style={{ fontSize: 9, color: '#6b7280' }}>{maxLabel}</span>
        </div>
      ) : (
        <div style={{ marginTop: 2 }}>
          <span style={{ fontSize: 9, color: '#6b7280' }}>auto-computed</span>
        </div>
      )}
    </>
  );
};

// ---------------------------------------------------------------------------
// CategoricalLegendBody
// ---------------------------------------------------------------------------

const CategoricalLegendBody = ({
  resolved,
}: {
  resolved: Extract<ResolvedColorBy, { type: 'categorical' }>;
}) => {
  return (
    <div style={{ display: 'grid', gap: 3 }}>
      {Object.entries(resolved.mapping).map(([value, color]) => {
        return (
          <div
            key={value}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                background: color,
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.12)',
              }}
            />
            <span style={{ fontSize: 10, color: '#4b5563' }}>{value}</span>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------------------
// GeoVisLegend
// ---------------------------------------------------------------------------

export interface GeoVisLegendProps {
  /** Id of the `LegendSpec` declared in `spec.legends[]`. */
  legendId: string;
  /**
   * Optional formatter for numeric thresholds (quantitative scale).
   * Defaults to a compact human-readable formatter (1.2M, 3.4k, etc.).
   */
  formatValue?: (v: number) => string;
  /** Optional inline style override for the outer container. */
  style?: React.CSSProperties;
  /** Optional CSS class name for the outer container. */
  className?: string;
}

/**
 * Renders the legend for a `LegendSpec` declared in `spec.legends[]`.
 *
 * Auto-resolves the colour ramp and thresholds from the visualisation data:
 * - Inline data is read synchronously from the spec.
 * - URL data is resolved after the MapLibre source loads (subscribes to
 *   `sourcedata` and `idle` events).
 *
 * Displays a gradient bar with min/max labels for quantitative scales, or
 * a stacked swatch list for categorical scales. Returns `null` when the
 * referenced legend is not defined or the colour ramp cannot be resolved yet.
 *
 * Must be rendered inside a `<GeoVisProvider>`.
 */
export const GeoVisLegend = ({
  legendId,
  formatValue,
  style,
  className,
}: GeoVisLegendProps) => {
  const { spec } = useGeoVis();
  const legend: LegendSpec | undefined = spec.legends?.find((l) => {
    return l.id === legendId;
  });

  // Find the layer that uses this legend's colorBy.property; fall back to
  // the legend.id matching a layer.id or the auto-generated `${layerId}-legend`
  // pattern.
  const layer = spec.layers?.find((l) => {
    if (l.id === legendId) return true;
    if (`${l.id}-legend` === legendId) return true;
    if (
      legend?.colorBy &&
      l.colorBy?.property === legend.colorBy.property &&
      l.colorBy?.type === legend.colorBy.type
    ) {
      return true;
    }
    return false;
  });

  // Use the legend's explicit colorBy when available, otherwise fall back to
  // the matched layer's colorBy (auto-generated by applyDefaults).
  const effectiveColorBy = legend?.colorBy ?? layer?.colorBy;
  const resolved = useResolvedColorBy(effectiveColorBy, layer?.id);

  if (!legend || !resolved) return null;

  return (
    <div
      className={className}
      style={{
        background: 'rgba(255,255,255,0.92)',
        borderRadius: 4,
        padding: '6px 10px',
        minWidth: 140,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        ...style,
      }}
    >
      {legend.label && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#374151',
            marginBottom: 4,
          }}
        >
          {legend.label}
        </div>
      )}
      {resolved.type === 'quantitative' ? (
        <QuantitativeLegendBody resolved={resolved} formatValue={formatValue} />
      ) : (
        <CategoricalLegendBody resolved={resolved} />
      )}
    </div>
  );
};
