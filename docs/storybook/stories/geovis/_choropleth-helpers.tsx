/**
 * Choropleth-specific story helpers shared across GeoVis stories.
 * Not public package artefacts — story utilities only.
 */
import { useGeoVis } from '@ttoss/geovis';
import type { Map as MapLibreMap } from 'maplibre-gl';
import * as React from 'react';

// ---------------------------------------------------------------------------
// ColorStep
// ---------------------------------------------------------------------------

export interface ColorStep {
  threshold: number;
  color: string;
}

// ---------------------------------------------------------------------------
// Paint expression builders
// ---------------------------------------------------------------------------

/**
 * Builds the MapLibre `step` paint expression for a property-driven choropleth.
 *
 * `field` can be:
 * - string: wraps as `['get', field]` — reads the value from a feature property.
 * - array:  used as-is, allowing arbitrary expressions
 *           (e.g. `['/', ['get', 'pop'], ['get', 'area']]`).
 *
 * Pure function (no side effects) so it can be unit-tested without React
 * or a MapLibre instance — the expression IS the contract: any change to
 * its shape directly changes which colour each feature gets.
 */
export const buildChoroplethPaintExpression = (
  field: string | readonly unknown[],
  defaultColor: string,
  steps: ColorStep[]
): unknown[] => {
  const getExpr = typeof field === 'string' ? ['get', field] : field;
  return [
    'step',
    getExpr,
    defaultColor,
    ...steps.flatMap(({ threshold, color }) => {
      return [threshold, color];
    }),
  ];
};

/**
 * Builds the MapLibre `step` paint expression for a feature-state-driven
 * choropleth (the `mapData` mechanism).
 *
 * `coalesce(['feature-state','value'], 0)` is required so that features
 * without a feature-state set fall into the `defaultColor` slot. Without
 * the coalesce, MapLibre returns `null` and the feature renders transparent
 * — indistinguishable from a missing geometry.
 *
 * Pure function for the same reason as `buildChoroplethPaintExpression`.
 */
export const buildFeatureStatePaintExpression = (
  defaultColor: string,
  steps: ColorStep[]
): unknown[] => {
  return [
    'step',
    ['coalesce', ['feature-state', 'value'], 0],
    defaultColor,
    ...steps.flatMap(({ threshold, color }) => {
      return [threshold, color];
    }),
  ];
};

// ---------------------------------------------------------------------------
// ChoroplethPainter
// ---------------------------------------------------------------------------

/**
 * Render-less component mounted inside a GeoVisProvider.
 * Applies a data-driven `step` colour expression via getNativeInstance().
 * Required because FillPaint.fillColor does not support MapLibre expressions (string only).
 *
 * `field` can be:
 * - string: uses ['get', field] — direct feature property
 * - array: used as an arbitrary MapLibre expression (e.g. ['/', ['get', 'pop'], ['get', 'area']])
 *
 * Retries on `idle` when the layer does not yet exist, to handle races
 * between React mounting and adapter style loading.
 */
export const ChoroplethPainter = ({
  layerId,
  field,
  defaultColor,
  steps,
}: {
  layerId: string;
  field: string | readonly unknown[];
  defaultColor: string;
  steps: ColorStep[];
}) => {
  const { runtime } = useGeoVis();

  React.useEffect(() => {
    if (!runtime) return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    let mounted = true;
    const expr = buildChoroplethPaintExpression(field, defaultColor, steps);

    const applyWhenReady = () => {
      if (!mounted) return;
      if (map.getLayer(layerId)) {
        map.setPaintProperty(layerId, 'fill-color', expr);
      } else {
        map.once('idle', applyWhenReady);
      }
    };

    if (map.isStyleLoaded()) {
      applyWhenReady();
    } else {
      map.once('load', applyWhenReady);
    }

    return () => {
      mounted = false;
    };
  }, [runtime, layerId, field, defaultColor, steps]);

  return null;
};

// ---------------------------------------------------------------------------
// FeatureStatePainter
// ---------------------------------------------------------------------------

/**
 * Render-less component mounted inside a GeoVisProvider.
 * Applies a `step` colour expression driven by `['feature-state', 'value']`
 * instead of a feature property.
 *
 * Use this with `mapData` sources where the value is injected at runtime via
 * `setFeatureState` — it does NOT read from GeoJSON properties.
 *
 * The paint expression is set once; the choropleth updates automatically as
 * the runtime applies new feature-state values when `mapData` changes.
 */
export const FeatureStatePainter = ({
  layerId,
  defaultColor,
  steps,
}: {
  layerId: string;
  defaultColor: string;
  steps: ColorStep[];
}) => {
  const { runtime } = useGeoVis();

  React.useEffect(() => {
    if (!runtime) return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    let mounted = true;

    const applyWhenReady = () => {
      if (!mounted) return;
      if (map.getLayer(layerId)) {
        const expr = buildFeatureStatePaintExpression(defaultColor, steps);
        map.setPaintProperty(layerId, 'fill-color', expr);
      } else {
        map.once('idle', applyWhenReady);
      }
    };

    if (map.isStyleLoaded()) {
      applyWhenReady();
    } else {
      map.once('load', applyWhenReady);
    }

    return () => {
      mounted = false;
    };
  }, [runtime, layerId, defaultColor, steps]);

  return null;
};

// ---------------------------------------------------------------------------
// MapOverlayLegend
// ---------------------------------------------------------------------------

/**
 * Gradient overlay positioned below the MapLabel (top-left of the panel).
 * Must be a direct child of a div with `position: relative` (the map panel);
 * does not need to be inside a GeoVisProvider.
 *
 * [cartography] Robinson & Slocum "Thematic Cartography" ch. 18:
 * In side-by-side comparison maps, the legend should be grouped with the
 * corresponding layer label, forming a cohesive informational block that
 * the reader processes BEFORE exploring the data — the pattern followed by
 * ESRI StoryMaps and ArcGIS Dashboards.
 * `top: 40` anchors the overlay immediately below the MapLabel (~32px tall).
 * Bottom-left (ILC) is preferred for isolated maps, but in split-compare
 * top-left groups label + scale and avoids overlap with MapLibre's
 * attribution bar (bottom-right).
 */
export const MapOverlayLegend = ({
  label,
  defaultColor,
  steps,
  formatValue,
}: {
  label?: string;
  defaultColor: string;
  steps: ColorStep[];
  formatValue?: (v: number) => string;
}) => {
  const colors = [
    defaultColor,
    ...steps.map((s) => {
      return s.color;
    }),
  ];
  const gradient = `linear-gradient(to right, ${colors.join(', ')})`;
  const fmt =
    formatValue ??
    ((v: number) => {
      return String(v);
    });
  const minLabel = `< ${fmt(steps[0].threshold)}`;
  const maxLabel = `> ${fmt(steps[steps.length - 1].threshold)}`;

  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        left: 8,
        zIndex: 1,
        pointerEvents: 'none',
        background: 'rgba(255,255,255,0.88)',
        borderRadius: 4,
        padding: '5px 8px',
        minWidth: 130,
      }}
    >
      {label && (
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#374151',
            marginBottom: 3,
          }}
        >
          {label}
        </div>
      )}
      <div style={{ height: 8, background: gradient, borderRadius: 2 }} />
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
    </div>
  );
};

// ---------------------------------------------------------------------------
// ColorSwatchLegend
// ---------------------------------------------------------------------------

/**
 * Swatch legend (colour square + value band) for the section below the maps.
 */
export const ColorSwatchLegend = ({
  title,
  defaultColor,
  steps,
  formatValue,
}: {
  title: string;
  defaultColor: string;
  steps: ColorStep[];
  formatValue?: (v: number) => string;
}) => {
  const fmt =
    formatValue ??
    ((v: number) => {
      return v.toLocaleString('en-US');
    });
  const entries: { color: string; label: string }[] = [
    { color: defaultColor, label: `< ${fmt(steps[0].threshold)}` },
    ...steps.map((s, i) => {
      return {
        color: s.color,
        label:
          i < steps.length - 1
            ? `${fmt(s.threshold)} \u2013 ${fmt(steps[i + 1].threshold)}`
            : `\u2265 ${fmt(s.threshold)}`,
      };
    }),
  ];

  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#374151',
          marginBottom: 6,
        }}
      >
        {title}
      </div>
      {entries.map((e, i) => {
        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 3,
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                background: e.color,
                borderRadius: 2,
                border: '1px solid rgba(0,0,0,0.12)',
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 11, color: '#4b5563' }}>{e.label}</span>
          </div>
        );
      })}
    </div>
  );
};
