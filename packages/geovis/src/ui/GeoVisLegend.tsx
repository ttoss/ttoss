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

const GeoVisLegendHeader = ({
  showTopDivider,
  title,
  subtitle,
}: {
  showTopDivider: boolean;
  title: string | undefined;
  subtitle: string | undefined;
}) => {
  return (
    <>
      {showTopDivider && (
        <div
          aria-hidden="true"
          style={{ borderTop: `1px solid ${BORDER_COLOR}`, margin: '4px 0' }}
        />
      )}
      {!!title && (
        <p style={{ fontWeight: 600, margin: '0 0 2px', marginTop: 16 }}>
          {title}
        </p>
      )}
      {!!subtitle && (
        <p style={{ color: MUTED_COLOR, fontSize: 12, margin: '0 0 4px' }}>
          {subtitle}
        </p>
      )}
    </>
  );
};

const GeoVisLegendItems = ({
  items,
  legendId,
  noDataLabel,
}: {
  items: LegendItem[];
  legendId: string;
  noDataLabel: string | undefined;
}) => {
  return (
    <>
      {items.map((item) => {
        return (
          <li key={`${legendId}-${item.binIndex}`} style={rowStyle}>
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
      {!!noDataLabel && (
        <li style={rowStyle}>
          <span
            aria-hidden="true"
            style={{
              ...swatchBase,
              backgroundColor: 'transparent',
              border: '1px solid #9ca3af',
            }}
          />
          <span>{noDataLabel}</span>
        </li>
      )}
    </>
  );
};

const GeoVisLegendItemsDivider = ({
  itemsCount,
  circleItemsCount,
}: {
  itemsCount: number;
  circleItemsCount: number;
}) => {
  if (itemsCount === 0 || circleItemsCount === 0) return null;
  return (
    <li
      aria-hidden="true"
      style={{
        borderTop: `1px solid ${BORDER_COLOR}`,
        margin: '4px 0',
        width: '100%',
      }}
    />
  );
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
  const swatchColor =
    items[0]?.color ?? legend.colorBy?.defaultColor ?? MUTED_COLOR;
  const showTopDivider = shouldShowTopDivider(
    items,
    circleItems,
    positionedLegendCount
  );
  return (
    <div className={className} style={buildContainerStyle(legend.position)}>
      <GeoVisLegendHeader
        showTopDivider={showTopDivider}
        title={legend.title}
        subtitle={legend.subtitle}
      />
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
        <GeoVisLegendItems
          items={items}
          legendId={legend.id}
          noDataLabel={legend.noDataLabel}
        />
        <GeoVisLegendItemsDivider
          itemsCount={items.length}
          circleItemsCount={circleItems.length}
        />
        <CirclesLegendItems
          circleItems={circleItems}
          swatchColor={swatchColor}
        />
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
    return buildColorItems(legend, normalizedBreaks, resolvedFormatValue, spec);
  }, [legend, normalizedBreaks, resolvedFormatValue, spec]);

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
