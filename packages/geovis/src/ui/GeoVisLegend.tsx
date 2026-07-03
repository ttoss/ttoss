import * as React from 'react';

import type { LegendSpec, VisualizationSpec } from '../spec/types';
import { useGeoVis } from './contexts';
import type { CircledLegendItem } from './GeoVisLegend.circles';
import {
  buildCircledItems,
  CirclesLegendItems,
  findProportionalCirclesConfig,
} from './GeoVisLegend.circles';
import type { LegendItem } from './GeoVisLegend.utils';
import {
  BORDER_COLOR,
  buildColorItems,
  buildContainerStyle,
  buildReferenceContent,
  computeNormalizedBreaks,
  hasLegendContent,
  MUTED_COLOR,
  resolveFormatter,
  resolveLegend,
  rowStyle,
  shouldShowCircleItems,
  shouldShowTopDivider,
  swatchBase,
} from './GeoVisLegend.utils';

export { parseReference } from './GeoVisLegend.utils';

export interface GeoVisLegendProps {
  /** Id of the legend to resolve from the spec's legend registry. */
  legendId: string;
  /** Explicit break points; overrides the legend's own `thresholds`. */
  breaks?: number[];
  /**
   * Formats numeric bin/circle values for display. When omitted, the default
   * is the locale formatter for choropleth/categorical legends and the compact
   * formatter (e.g. `500k`) for proportional-circle legends.
   */
  formatValue?: (value: number) => string;
  /** Optional class applied to the legend container. */
  className?: string;
  /** Optional node rendered as the legend's reference/attribution footer. */
  sourceNode?: React.ReactNode;
}

const useGeoVisLegend = (spec: VisualizationSpec, legendId: string) => {
  return React.useMemo(() => {
    return resolveLegend(spec, legendId);
  }, [spec, legendId]);
};

const GeoVisLegendBody = ({
  className,
  legend,
  items,
  circleItems,
  referenceContent,
  positionedLegendCount,
}: {
  className: string | undefined;
  legend: LegendSpec;
  items: LegendItem[];
  circleItems: CircledLegendItem[];
  referenceContent: React.ReactNode;
  positionedLegendCount: number;
}) => {
  const showTopDivider = shouldShowTopDivider(
    items,
    circleItems,
    positionedLegendCount
  );
  return (
    <div className={className} style={buildContainerStyle(legend.position)}>
      {showTopDivider && (
        <div
          aria-hidden="true"
          style={{ borderTop: `1px solid ${BORDER_COLOR}`, margin: '4px 0' }}
        />
      )}
      {!!legend.title && (
        <p style={{ fontWeight: 600, margin: '0 0 2px', marginTop: 16 }}>
          {legend.title}
        </p>
      )}
      {!!legend.subtitle && (
        <p style={{ color: MUTED_COLOR, fontSize: 12, margin: '0 0 4px' }}>
          {legend.subtitle}
        </p>
      )}
      <ul
        aria-label={legend.title ?? legend.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 4,
          margin: 0,
          padding: 0,
          listStyle: 'none',
        }}
      >
        {items.map((item) => {
          return (
            <li key={`${legend.id}-${item.binIndex}`} style={rowStyle}>
              <span
                aria-hidden="true"
                style={{
                  ...swatchBase,
                  backgroundColor: item.color,
                  border: `1px solid ${BORDER_COLOR}`,
                }}
              />
              <span>{item.label}</span>
            </li>
          );
        })}
        {!!legend.noDataLabel && (
          <li style={rowStyle}>
            <span
              aria-hidden="true"
              style={{
                ...swatchBase,
                backgroundColor: 'transparent',
                border: '1px solid #9ca3af',
              }}
            />
            <span>{legend.noDataLabel}</span>
          </li>
        )}
        {items.length > 0 && circleItems.length > 0 && (
          <li
            aria-hidden="true"
            style={{
              borderTop: `1px solid ${BORDER_COLOR}`,
              margin: '4px 0',
              width: '100%',
            }}
          />
        )}
        <CirclesLegendItems circleItems={circleItems} />
      </ul>
      {referenceContent != null && (
        <p style={{ color: MUTED_COLOR, fontSize: 11, margin: '6px 0 0' }}>
          {referenceContent}
        </p>
      )}
    </div>
  );
};

export const GeoVisLegend = ({
  legendId,
  breaks,
  formatValue,
  className,
  sourceNode,
}: GeoVisLegendProps) => {
  const { spec } = useGeoVis();

  const legend = useGeoVisLegend(spec, legendId);
  const normalizedBreaks = React.useMemo(() => {
    return computeNormalizedBreaks(breaks, legend);
  }, [breaks, legend]);
  const circleConfig = React.useMemo(() => {
    return findProportionalCirclesConfig(spec);
  }, [spec]);
  const resolvedFormatValue = React.useMemo(() => {
    return resolveFormatter(formatValue, circleConfig);
  }, [formatValue, circleConfig]);

  const items = React.useMemo(() => {
    return buildColorItems(legend, normalizedBreaks, resolvedFormatValue);
  }, [legend, normalizedBreaks, resolvedFormatValue]);

  const circleItems = React.useMemo(() => {
    if (!shouldShowCircleItems(circleConfig, legend, spec)) return [];
    return buildCircledItems(circleConfig!, resolvedFormatValue);
  }, [circleConfig, resolvedFormatValue, legend, spec]);

  const positionedLegendCount = React.useMemo(() => {
    return (spec.legends ?? []).filter((l) => {
      return l.position;
    }).length;
  }, [spec.legends]);

  if (!legend) return null;
  if (!hasLegendContent(legend, items, circleItems)) return null;

  const referenceContent = buildReferenceContent(sourceNode, legend);

  return (
    <GeoVisLegendBody
      className={className}
      legend={legend}
      items={items}
      circleItems={circleItems}
      referenceContent={referenceContent}
      positionedLegendCount={positionedLegendCount}
    />
  );
};
