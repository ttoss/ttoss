/* eslint-disable @typescript-eslint/no-use-before-define */
import * as React from 'react';

import type {
  PresentationMode,
  VisualizationLayer,
  VisualizationSpec,
  VisualizationView,
} from '../spec/types';
import { GeoVisCanvas } from './GeoVisCanvas';
import { GeoVisProvider, useGeoVis } from './GeoVisProvider';

/**
 * Render-prop signature: receives the active view and its primary layer plus
 * the sub-spec scoped to that view, so consumers can inject overlays
 * (legends, hover panels, custom paint) inside each rendered map.
 */
export interface GeoVisViewRenderArgs {
  view: VisualizationView;
  /** First layer referenced by `view.layers`, or `undefined` if empty. */
  layer: VisualizationLayer | undefined;
  /** Sub-spec containing only this view's layers (no `views`/`layerTemplates`). */
  subSpec: VisualizationSpec;
}

export interface GeoVisViewsProps {
  /**
   * Renders the per-view content placed inside each map container. When
   * omitted, only `<GeoVisCanvas>` is rendered for the active view.
   */
  renderView?: (args: GeoVisViewRenderArgs) => React.ReactNode;
  /** Optional override for the per-map container height. Defaults to 480px. */
  height?: number | string;
  /** Optional override for the presentation mode declared in the spec. */
  mode?: PresentationMode;
  className?: string;
  style?: React.CSSProperties;
}

const DEFAULT_HEIGHT = 480;

interface SwitcherProps {
  views: VisualizationView[];
  subSpecs: Record<string, VisualizationSpec>;
  layersById: Map<string, VisualizationLayer>;
  renderView?: (args: GeoVisViewRenderArgs) => React.ReactNode;
  height: number | string;
  mode: PresentationMode;
  className?: string;
  style?: React.CSSProperties;
}

const SwitchedView = ({
  views,
  subSpecs,
  layersById,
  renderView,
  height,
  mode,
  className,
  style,
}: SwitcherProps) => {
  const [activeViewId, setActiveViewId] = React.useState<string>(() => {
    return views[0]?.id ?? '';
  });

  const activeView = views.find((v) => {
    return v.id === activeViewId;
  });
  const activeLayer = activeView
    ? layersById.get(activeView.layers[0])
    : undefined;
  const activeSubSpec = activeViewId ? subSpecs[activeViewId] : undefined;

  return (
    <div className={className} style={{ display: 'grid', gap: 12, ...style }}>
      {mode === 'time-slider' ? (
        <TimeSliderControl
          views={views}
          activeViewId={activeViewId}
          onChange={setActiveViewId}
        />
      ) : (
        <TabBar
          views={views}
          activeViewId={activeViewId}
          onChange={setActiveViewId}
        />
      )}

      {activeSubSpec && activeView && (
        <div
          style={{
            position: 'relative',
            height,
            border: '1px solid #d4d4d8',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <GeoVisProvider spec={activeSubSpec}>
            <GeoVisCanvas
              viewId={activeView.id}
              style={{ width: '100%', height: '100%' }}
            />
            {renderView?.({
              view: activeView,
              layer: activeLayer,
              subSpec: activeSubSpec,
            })}
          </GeoVisProvider>
        </div>
      )}
    </div>
  );
};

interface TabBarProps {
  views: VisualizationView[];
  activeViewId: string;
  onChange: (id: string) => void;
}

const TabBar = ({ views, activeViewId, onChange }: TabBarProps) => {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 4,
        flexWrap: 'wrap',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: 4,
      }}
    >
      {views.map((view) => {
        const isActive = view.id === activeViewId;
        return (
          <button
            key={view.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              onChange(view.id);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '6px 6px 0 0',
              border: `1px solid ${isActive ? '#3b82f6' : '#d4d4d8'}`,
              borderBottom: isActive
                ? '2px solid #3b82f6'
                : '1px solid #d4d4d8',
              background: isActive ? '#eff6ff' : 'white',
              color: isActive ? '#1d4ed8' : '#374151',
              fontWeight: isActive ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {view.label ?? view.id}
          </button>
        );
      })}
    </div>
  );
};

const TimeSliderControl = ({ views, activeViewId, onChange }: TabBarProps) => {
  const activeIndex = Math.max(
    0,
    views.findIndex((v) => {
      return v.id === activeViewId;
    })
  );
  const activeLabel = views[activeIndex]?.label ?? views[activeIndex]?.id;

  return (
    <div
      style={{
        display: 'grid',
        gap: 6,
        padding: '8px 4px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          color: '#374151',
        }}
      >
        <span>{views[0]?.label ?? views[0]?.id}</span>
        <strong>{activeLabel}</strong>
        <span>
          {views[views.length - 1]?.label ?? views[views.length - 1]?.id}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={views.length - 1}
        step={1}
        value={activeIndex}
        onChange={(e) => {
          const idx = Number(e.target.value);
          const next = views[idx];
          if (next) onChange(next.id);
        }}
        style={{ width: '100%' }}
      />
    </div>
  );
};

interface SideBySideProps {
  views: VisualizationView[];
  subSpecs: Record<string, VisualizationSpec>;
  layersById: Map<string, VisualizationLayer>;
  renderView?: (args: GeoVisViewRenderArgs) => React.ReactNode;
  height: number | string;
  className?: string;
  style?: React.CSSProperties;
}

const SideBySide = ({
  views,
  subSpecs,
  layersById,
  renderView,
  height,
  className,
  style,
}: SideBySideProps) => {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gap: 12,
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        ...style,
      }}
    >
      {views.map((view) => {
        const layer = layersById.get(view.layers[0]);
        const subSpec = subSpecs[view.id];
        if (!subSpec) return null;
        return (
          <div
            key={view.id}
            style={{
              position: 'relative',
              height,
              border: '1px solid #d4d4d8',
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            {view.label && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 8,
                  zIndex: 2,
                  background: 'rgba(255,255,255,0.9)',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1f2937',
                  pointerEvents: 'none',
                }}
              >
                {view.label}
              </div>
            )}
            <GeoVisProvider spec={subSpec}>
              <GeoVisCanvas
                viewId={view.id}
                style={{ width: '100%', height: '100%' }}
              />
              {renderView?.({ view, layer, subSpec })}
            </GeoVisProvider>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Reads `useGeoVis().spec` and renders one or more `<GeoVisCanvas>` based on
 * `spec.presentation`. Must be used inside a `<GeoVisProvider>`. The provider
 * already runs `expandLayerTemplates`, so `spec.views` is guaranteed to be
 * populated when templates were declared.
 */
export const GeoVisViews = ({
  renderView,
  height = DEFAULT_HEIGHT,
  mode,
  className,
  style,
}: GeoVisViewsProps) => {
  const { spec } = useGeoVis();
  const views = React.useMemo(() => {
    return spec.views ?? [];
  }, [spec]);
  const resolvedMode: PresentationMode = mode ?? spec.presentation ?? 'tabs';

  const layersById = React.useMemo(() => {
    return new Map<string, VisualizationLayer>(
      spec.layers.map((l) => {
        return [l.id, l];
      })
    );
  }, [spec]);

  const subSpecs = React.useMemo<Record<string, VisualizationSpec>>(() => {
    return Object.fromEntries(
      views.map((view) => {
        const sub: VisualizationSpec = {
          ...spec,
          layers: spec.layers.filter((l) => {
            return view.layers.includes(l.id);
          }),
        };
        delete (sub as { views?: unknown }).views;
        delete (sub as { layerTemplates?: unknown }).layerTemplates;
        return [view.id, sub];
      })
    );
  }, [spec, views]);

  // No views to switch between — render the spec as-is.
  if (views.length === 0) {
    return (
      <div
        className={className}
        style={{ position: 'relative', height, ...style }}
      >
        <GeoVisCanvas
          viewId="default"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  // Side-by-side: mount every view simultaneously in a CSS grid.
  if (resolvedMode === 'side-by-side') {
    return (
      <SideBySide
        views={views}
        subSpecs={subSpecs}
        layersById={layersById}
        renderView={renderView}
        height={height}
        className={className}
        style={style}
      />
    );
  }

  // Default: tabs / single-filter / time-slider — one mounted map at a time.
  return (
    <SwitchedView
      views={views}
      subSpecs={subSpecs}
      layersById={layersById}
      renderView={renderView}
      height={height}
      mode={resolvedMode}
      className={className}
      style={style}
    />
  );
};
