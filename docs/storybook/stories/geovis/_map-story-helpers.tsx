/**
 * Internal helpers shared across GeoVis stories.
 * Not public package artefacts — story utilities only.
 */
import type { VisualizationSpec, VisualizationView } from '@ttoss/geovis';
import { GeoVisCanvas, GeoVisProvider, useGeoVis } from '@ttoss/geovis';
import type { Map as MapLibreMap } from 'maplibre-gl';
import * as React from 'react';

// ---------------------------------------------------------------------------
// MapSync
// ---------------------------------------------------------------------------

export type MapRef = React.MutableRefObject<MapLibreMap | null>;
export type LockRef = React.MutableRefObject<boolean>;

/**
 * Rendered inside a GeoVisProvider.
 * Registers the native map in `selfRef` and synchronises movements with `peerRef`.
 * `lockRef` is shared between the two MapSync instances to prevent feedback loops.
 * `animate: false` in jumpTo prevents peer animation from generating new move events.
 */
export const MapSync = ({
  selfRef,
  peerRef,
  lockRef,
}: {
  selfRef: MapRef;
  peerRef: MapRef;
  lockRef: LockRef;
}) => {
  const { runtime } = useGeoVis();

  React.useEffect(() => {
    if (!runtime) return;
    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;
    selfRef.current = map;
    return () => {
      selfRef.current = null;
    };
  }, [runtime, selfRef]);

  React.useEffect(() => {
    if (!runtime) return;
    const self = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!self) return;

    const onMove = () => {
      if (lockRef.current || !peerRef.current) return;
      lockRef.current = true;
      peerRef.current.jumpTo({
        center: self.getCenter(),
        zoom: self.getZoom(),
        bearing: self.getBearing(),
        pitch: self.getPitch(),
        animate: false,
      });
      lockRef.current = false;
    };

    self.on('move', onMove);
    return () => {
      return self.off('move', onMove);
    };
  }, [runtime, peerRef, lockRef]);

  return null;
};

// ---------------------------------------------------------------------------
// MapLabel
// ---------------------------------------------------------------------------

export const MapLabel = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: 8,
        left: 8,
        background: 'rgba(255,255,255,0.88)',
        borderRadius: 6,
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 600,
        color: '#374151',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>
  );
};

// ---------------------------------------------------------------------------
// ChoroplethPainter
// ---------------------------------------------------------------------------

export interface ColorStep {
  threshold: number;
  color: string;
}

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

    const getExpr = typeof field === 'string' ? ['get', field] : field;
    const expr = [
      'step',
      getExpr,
      defaultColor,
      ...steps.flatMap(({ threshold, color }) => {
        return [threshold, color];
      }),
    ];

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
// MapOverlayLegend
// ---------------------------------------------------------------------------

/**
 * Gradient overlay positioned below the MapLabel (top-left of the panel).
 * Must be a direct child of a div with `position: relative` (the map panel);
 * does not need to be inside a GeoVisProvider.
 *
 * [cartography] Robinson & Slocum “Thematic Cartography” ch. 18:
 * In side-by-side comparison maps, the legend should be grouped with the
 * corresponding layer label, forming a cohesive informational block that
 * the reader processes BEFORE exploring the data — the pattern followed by
 * ESRI StoryMaps and ArcGIS Dashboards.
 * `top: 40` anchors the overlay immediately below the MapLabel (~32px tall).
 * Bottom-left (ILC) is preferred for isolated maps, but in split-compare
 * top-left groups label + scale and avoids overlap with MapLibre’s
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
        // Anchored below the MapLabel (top: 8, ~28px tall) — see JSDoc comment.
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
// ---------------------------------------------------------------------------
// GeoVisSplitLayout
// ---------------------------------------------------------------------------

/**
 * Renders a two-panel split-compare from a spec that declares `views[]`.
 * Each view produces a `GeoVisProvider` with filtered layers and automatic
 * movement synchronisation — the consumer does not need to manage
 * `MapRef`, `LockRef`, or `MapSync` directly.
 *
 * The `render` prop receives the current `VisualizationView` and should return
 * children to mount INSIDE that view’s `GeoVisProvider` (e.g. `ChoroplethPainter`,
 * `MapOverlayLegend`). It is the escape hatch for logic not yet declarable in
 * the spec (e.g. MapLibre expressions in paint).
 *
 * Requires exactly 2 views in `spec.views`. Displays a visual warning if absent.
 */
export const GeoVisSplitLayout = ({
  spec,
  height = 480,
  leftBorder,
  rightBorder,
  render,
}: {
  spec: VisualizationSpec;
  height?: number;
  leftBorder?: string;
  rightBorder?: string;
  render?: (view: VisualizationView) => React.ReactNode;
}) => {
  const views = spec.views ?? [];
  const [left, right] = views as [
    VisualizationView | undefined,
    VisualizationView | undefined,
  ];

  const leftRef = React.useRef<MapRef['current']>(null);
  const rightRef = React.useRef<MapRef['current']>(null);
  const lockRef = React.useRef(false) as LockRef;

  if (!left || !right) {
    return (
      <div style={{ padding: 12, color: '#ef4444', fontSize: 13 }}>
        GeoVisSplitLayout: spec.views must contain exactly 2 views.
      </div>
    );
  }

  const filterLayers = (ids: string[]) => {
    return spec.layers.filter((l) => {
      return ids.includes(l.id);
    });
  };

  const leftSpec: VisualizationSpec = {
    ...spec,
    id: `${spec.id}--left`,
    layers: filterLayers(left.layers),
    views: undefined,
  };
  const rightSpec: VisualizationSpec = {
    ...spec,
    id: `${spec.id}--right`,
    layers: filterLayers(right.layers),
    views: undefined,
  };

  const canvasStyle: React.CSSProperties = { width: '100%', height: '100%' };
  const panelBase: React.CSSProperties = {
    position: 'relative',
    flex: 1,
    overflow: 'hidden',
    borderRadius: 4,
  };

  return (
    <div style={{ display: 'flex', gap: 4, height }}>
      <div style={{ ...panelBase, border: leftBorder ?? '1px solid #d4d4d8' }}>
        <MapLabel>{left.label}</MapLabel>
        <GeoVisProvider spec={leftSpec}>
          <GeoVisCanvas viewId={left.id} style={canvasStyle} />
          <MapSync selfRef={leftRef} peerRef={rightRef} lockRef={lockRef} />
          {render?.(left)}
        </GeoVisProvider>
      </div>
      <div style={{ ...panelBase, border: rightBorder ?? '1px solid #d4d4d8' }}>
        <MapLabel>{right.label}</MapLabel>
        <GeoVisProvider spec={rightSpec}>
          <GeoVisCanvas viewId={right.id} style={canvasStyle} />
          <MapSync selfRef={rightRef} peerRef={leftRef} lockRef={lockRef} />
          {render?.(right)}
        </GeoVisProvider>
      </div>
    </div>
  );
};

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
            ? `${fmt(s.threshold)} – ${fmt(steps[i + 1].threshold)}`
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
