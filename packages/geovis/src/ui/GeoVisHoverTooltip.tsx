import type * as React from 'react';
import ReactDOM from 'react-dom';

import type { MapClickInfo, MapHoverInfo } from './contexts';
import { useGeoVisHover } from './contexts';

const defaultFormatValue = (value: number | string): string => {
  return String(value);
};

const baseTooltipStyle: React.CSSProperties = {
  position: 'fixed',
  pointerEvents: 'none',
  background: 'rgba(15, 23, 42, 0.92)',
  color: '#f8fafc',
  padding: '6px 10px',
  borderRadius: 4,
  font: '12px/1.4 system-ui, sans-serif',
  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
  whiteSpace: 'nowrap',
  zIndex: 5,
};

export interface GeoVisHoverTooltipProps {
  /**
   * Custom renderer for the tooltip body. Receives the live hover snapshot
   * (`featureId`, `value`, etc.) and returns the React node to display. When
   * omitted, a default two-line layout is used (`Feature #<id>` + value).
   */
  render?: (info: MapHoverInfo) => React.ReactNode;
  /** Formatter applied to `info.value` when no `render` prop is provided. */
  formatValue?: (value: number | string) => string;
  /** Optional class for the tooltip container. */
  className?: string;
  /** Optional inline style overrides merged on top of the default tooltip style. */
  style?: React.CSSProperties;
  /** Pixel offset from the cursor; defaults to `{ x: 12, y: 12 }`. */
  offset?: { x: number; y: number };
  /** Label shown when `info.value` is `null` (no `mapData` for the feature). */
  emptyValueLabel?: string;
  /**
   * Custom content rendered inside the tooltip container. Takes precedence over
   * `render` and the default value layout. Use `useGeoVisHover()` or
   * `useGeoVisClick()` inside the children for live data.
   */
  children?: React.ReactNode;
}

/**
 * Renders a floating tooltip over the map whenever the user hovers a feature
 * on a polygon layer that has an `activeLegendId`. Uses `position: fixed` and
 * renders via `ReactDOM.createPortal` into `document.body`, so it does not
 * require a `position: relative` wrapper and is not clipped by overflow.
 *
 * The hover tracking (mousemove/leave wiring, cursor changes, feature-state
 * lookup) lives in `useMapHover`, set up by `<GeoVisProvider>`. This component
 * is a thin presentational layer that consumes the live hover snapshot from
 * the dedicated `GeoVisHoverContext` via `useGeoVisHover()`, so high-frequency
 * hover updates do not re-render `useGeoVis()` consumers.
 *
 *
 * @remarks
 * The tooltip renders via `ReactDOM.createPortal` into `document.body` and
 * uses `position: fixed`, so it is not clipped by `overflow: hidden` ancestors
 * and does not require any special wrapper around `<GeoVisCanvas>`.
 * `MapHoverInfo.point` already carries viewport-absolute coordinates, so the
 * tooltip is positioned correctly without any additional offset math.
 */
const renderTooltipBody = (
  info: MapHoverInfo | MapClickInfo,
  children: React.ReactNode | undefined,
  render: ((info: MapHoverInfo) => React.ReactNode) | undefined,
  formatValue: (value: number | string) => string,
  emptyValueLabel: string
): React.ReactNode => {
  if (children != null) {
    return children;
  }
  if (render) {
    return render(info as MapHoverInfo);
  }
  return (
    <>
      <div style={{ fontWeight: 600 }}>Feature #{String(info.featureId)}</div>
      <div>
        {info.value == null ? emptyValueLabel : formatValue(info.value)}
      </div>
    </>
  );
};

export const GeoVisHoverTooltip = ({
  render,
  formatValue = defaultFormatValue,
  className,
  style,
  offset = { x: 12, y: 12 },
  emptyValueLabel = 'No data',
  children,
}: GeoVisHoverTooltipProps) => {
  const hoveredMapFeature = useGeoVisHover();

  const activeInfo = hoveredMapFeature;
  if (!activeInfo) return null;
  if (typeof document === 'undefined' || !document.body) return null;

  const mergedStyle: React.CSSProperties = {
    ...baseTooltipStyle,
    left: activeInfo.point.x + offset.x,
    top: activeInfo.point.y + offset.y,
    ...style,
  };

  return ReactDOM.createPortal(
    <div className={className} role="tooltip" style={mergedStyle}>
      {renderTooltipBody(
        activeInfo,
        children,
        render,
        formatValue,
        emptyValueLabel
      )}
    </div>,
    document.body
  );
};
