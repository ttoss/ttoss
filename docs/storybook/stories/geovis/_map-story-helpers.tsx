/**
 * Internal helpers shared across GeoVis stories.
 * Not public package artefacts — story utilities only.
 */
import type {
  PartialVisualizationSpec,
  PresentationMode,
  VisualizationSpec,
  VisualizationView,
} from '@ttoss/geovis';
import {
  DEFAULT_BASEMAP_STYLE,
  GeoVisCanvas,
  GeoVisProvider,
  useGeoVis,
} from '@ttoss/geovis';

// ---------------------------------------------------------------------------
// Basemap catalogue
// ---------------------------------------------------------------------------

/**
 * Free, no-API-key basemap styles compatible with MapLibre GL JS.
 * Default is `Bright` (OpenFreeMap) — production-ready, MIT-licensed, no
 * rate limits. `Demotiles` is MapLibre's own demo style and is intentionally
 * minimal; use it only for engine development/testing.
 */
export const BASEMAPS = {
  Bright: DEFAULT_BASEMAP_STYLE,
  Positron: 'https://tiles.openfreemap.org/styles/positron',
  Liberty: 'https://tiles.openfreemap.org/styles/liberty',
  Demotiles: 'https://demotiles.maplibre.org/style.json',
} as const;

export type BasemapArgs = { basemapStyleUrl: string };

/**
 * Shared Storybook `argTypes` block for the basemap selector.
 * Spread into the story `Meta.argTypes` object.
 */
export const BASEMAP_ARG_TYPE = {
  basemapStyleUrl: {
    name: 'Basemap',
    control: 'select',
    options: Object.keys(BASEMAPS) as (keyof typeof BASEMAPS)[],
    mapping: BASEMAPS as Record<string, string>,
  },
} as const;

/** Default Storybook args — `Bright` is the default basemap.
 *  Uses the option key (not the URL) so the select control shows the
 *  initial selection correctly; Storybook's `mapping` resolves it to the URL
 *  before passing it to the story. */
export const DEFAULT_BASEMAP_ARGS: BasemapArgs = {
  basemapStyleUrl: 'Bright',
};

/**
 * Returns a new spec with `basemap.styleUrl` replaced.
 * All other spec fields are preserved unchanged (shallow clone). Accepts
 * either a fully-typed `VisualizationSpec` or a `PartialVisualizationSpec`.
 */
export const applyBasemap = <T extends PartialVisualizationSpec>(
  spec: T,
  styleUrl: string
): T => {
  return {
    ...spec,
    basemap: { ...spec.basemap, styleUrl },
  };
};

// ---------------------------------------------------------------------------
// Presentation mode (multi-view stories)
// ---------------------------------------------------------------------------

/** Presentation modes currently supported by `<GeoVisViews>`. */
export const PRESENTATION_MODES: readonly PresentationMode[] = [
  'tabs',
  'side-by-side',
  'single-filter',
  'time-slider',
] as const;

export type PresentationArgs = { presentationMode: PresentationMode };

/** Storybook `argTypes` block for the presentation-mode selector. */
export const PRESENTATION_ARG_TYPE = {
  presentationMode: {
    name: 'View mode',
    control: 'radio',
    options: PRESENTATION_MODES,
  },
} as const;

/** Default args for stories using `<GeoVisViews>`. `tabs` is the default. */
export const DEFAULT_PRESENTATION_ARGS: PresentationArgs = {
  presentationMode: 'tabs',
};
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
    const ref = selfRef;
    ref.current = map;
    // Teardown: clear the ref so stale instances don't linger.
    const teardown = (): void => {
      ref.current = null;
    };
    return teardown;
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
      });
      lockRef.current = false;
    };

    self.on('move', onMove);
    return () => {
      self.off('move', onMove);
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
// ColorSwatchLegend
// ---------------------------------------------------------------------------

/**
 * Default colour ramp used when no explicit `colors` are declared on a layer.
 * Matches the `DEFAULT_PALETTE` in `colorBy.ts` (Blues 5).
 */
export const DEFAULT_AUTO_COLORS = [
  '#eff3ff',
  '#bdd7e7',
  '#6baed6',
  '#3182bd',
  '#08519c',
] as const;

/**
 * A single threshold–colour pair used to build a stepped choropleth ramp.
 */
export interface ColorStep {
  /** Lower bound (inclusive) at which this colour band starts. */
  threshold: number;
  /** CSS colour string (hex, rgb, named) applied to features with value ≥ threshold. */
  color: string;
}

/**
 * Swatch legend (colour square + value band) for the section below the maps.
 */
/**
 * Renders a two-panel split-compare from a spec that declares `views[]`.
 * Each view produces a `GeoVisProvider` with filtered layers and automatic
 * movement synchronisation — the consumer does not need to manage
 * `MapRef`, `LockRef`, or `MapSync` directly.
 *
 * The `render` prop receives the current `VisualizationView` and should return
 * children to mount INSIDE that view’s `GeoVisProvider` (e.g. legends,
 * overlays). It is the escape hatch for logic not yet declarable in
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
    return (spec.layers ?? []).filter((l) => {
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
  steps = [],
  colors,
  formatValue,
}: {
  title: string;
  defaultColor?: string;
  /** Explicit threshold–colour steps. When empty and `colors` is set, a gradient bar is rendered instead. */
  steps?: ColorStep[];
  /** Palette for gradient-only display (used when `steps` is empty). */
  colors?: readonly string[];
  formatValue?: (v: number) => string;
}) => {
  // Gradient-only mode: no explicit thresholds, just show the colour ramp.
  if (steps.length === 0 && colors && colors.length > 0) {
    const gradient = `linear-gradient(to right, ${[...colors].join(', ')})`;
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
        <div style={{ height: 8, background: gradient, borderRadius: 2 }} />
        <div style={{ marginTop: 2, fontSize: 9, color: '#6b7280' }}>
          auto-computed scale
        </div>
      </div>
    );
  }

  const effectiveDefault = defaultColor ?? (colors ? colors[0] : '#cccccc');
  const fmt =
    formatValue ??
    ((v: number) => {
      return v.toLocaleString('en-US');
    });
  const entries: { color: string; label: string }[] =
    steps.length > 0
      ? [
          { color: effectiveDefault, label: `< ${fmt(steps[0].threshold)}` },
          ...steps.map((s, i) => {
            return {
              color: s.color,
              label:
                i < steps.length - 1
                  ? `${fmt(s.threshold)} – ${fmt(steps[i + 1].threshold)}`
                  : `\u2265 ${fmt(s.threshold)}`,
            };
          }),
        ]
      : [];

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
