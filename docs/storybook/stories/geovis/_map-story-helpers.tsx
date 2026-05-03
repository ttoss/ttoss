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

// ---------------------------------------------------------------------------
// Bbox / FitBoundsToBbox
// ---------------------------------------------------------------------------

export type Bbox = [number, number, number, number];

/**
 * Walks every coordinate in a GeoJSON FeatureCollection and returns the
 * axis-aligned bounding box `[minLng, minLat, maxLng, maxLat]`. Returns null
 * when the collection has no usable coordinates.
 */
export const computeBbox = (fc: GeoJSON.FeatureCollection): Bbox | null => {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  const visit = (coords: unknown): void => {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === 'number' && typeof coords[1] === 'number') {
      const [lng, lat] = coords as [number, number];
      if (lng < minLng) minLng = lng;
      if (lat < minLat) minLat = lat;
      if (lng > maxLng) maxLng = lng;
      if (lat > maxLat) maxLat = lat;
      return;
    }
    for (const c of coords) visit(c);
  };

  for (const feature of fc.features) {
    if (!feature.geometry) continue;
    if (feature.geometry.type === 'GeometryCollection') {
      for (const g of feature.geometry.geometries) {
        visit((g as { coordinates?: unknown }).coordinates);
      }
    } else {
      visit(feature.geometry.coordinates);
    }
  }

  if (!Number.isFinite(minLng) || !Number.isFinite(minLat)) return null;
  return [minLng, minLat, maxLng, maxLat];
};

/**
 * Estimates a sensible `maxZoom` ceiling for `fitBounds` based on the
 * approximate area of the bounding box in km².
 * Prevents over-zoom on small geometries that would lose geographic context.
 */
export const estimateMaxZoom = (bbox: Bbox): number => {
  const areaKm2 = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1]) * 111 * 111;
  if (areaKm2 > 100_000) return 8; // country
  if (areaKm2 > 5_000) return 10; // state / large region
  if (areaKm2 > 100) return 13; // municipality
  return 15; // neighbourhood / district
};

/**
 * Render-less component that imperatively fits the camera so the supplied bbox
 * is centered inside the **useful area** of the map (viewport minus insets),
 * maximising the rendered geometry while clearing fixed UI overlays.
 *
 * MapLibre `fitBounds(bbox, { padding })` guarantees:
 *   center( bbox )  ===  center( viewport − padding )
 *
 * `overlayInsets` mirrors `PaddingOptions`. Set sides where overlays sit:
 *   - top/left for in-map labels and legends
 *   - leave bottom/right at 0 for overlays that sit on top of the map
 *     (e.g. MapLibre’s `AttributionControl` at bottom-right)
 *
 * Must be placed AFTER `GeoVisCanvas` in the JSX tree so that the MapLibre map
 * is already mounted when this component’s effect fires.
 */
export const FitBoundsToBbox = ({
  bbox,
  overlayInsets,
}: {
  bbox: Bbox | null;
  overlayInsets?: { top: number; bottom: number; left: number; right: number };
}) => {
  const { runtime } = useGeoVis();

  React.useEffect(() => {
    if (!runtime || !bbox) return;

    const map = runtime.getAdapter().getNativeInstance() as MapLibreMap | null;
    if (!map) return;

    const apply = () => {
      const container = map.getContainer();
      if (container.clientWidth === 0 || container.clientHeight === 0) return;
      const padding = overlayInsets ?? {
        top: Math.round(container.clientHeight * 0.06),
        bottom: Math.round(container.clientHeight * 0.06),
        left: Math.round(container.clientWidth * 0.06),
        right: Math.round(container.clientWidth * 0.06),
      };
      map.resize();
      map.fitBounds(
        [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ],
        {
          padding,
          animate: false,
          duration: 0,
          maxZoom: estimateMaxZoom(bbox),
        }
      );
    };

    map.once('idle', apply);

    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect || rect.width === 0 || rect.height === 0) return;
      apply();
    });
    observer.observe(map.getContainer());

    return () => {
      map.off('idle', apply);
      observer.disconnect();
    };
  }, [runtime, bbox, overlayInsets]);

  return null;
};

// ---------------------------------------------------------------------------
// FitBoundsToUrlSource
// ---------------------------------------------------------------------------

/**
 * Fetches a remote GeoJSON URL, computes its bbox once the data arrives, then
 * fits the camera via `FitBoundsToBbox`. The fit fires as soon as both the
 * fetch resolves and the map reports idle — whichever comes last.
 *
 * Must be placed AFTER `GeoVisCanvas` in the JSX tree.
 * Silently ignores fetch errors (story utility).
 */
export const FitBoundsToUrlSource = ({
  url,
  overlayInsets,
}: {
  url: string;
  overlayInsets?: { top: number; bottom: number; left: number; right: number };
}) => {
  const [bbox, setBbox] = React.useState<Bbox | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(url)
      .then((r) => {
        return r.json();
      })
      .then((fc: GeoJSON.FeatureCollection) => {
        if (!cancelled) setBbox(computeBbox(fc));
      })
      .catch(() => {
        // silently ignore errors in story context
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return <FitBoundsToBbox bbox={bbox} overlayInsets={overlayInsets} />;
};

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
