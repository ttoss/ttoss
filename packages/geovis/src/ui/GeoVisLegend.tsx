import { Link } from '@ttoss/ui';
import * as React from 'react';

import {
  resolveCategoricalFallbackColor,
  resolvePalette,
  resolveQuantitativeFallbackColor,
} from '../adapters/maplibre/legendTranslation';
import type {
  LegendPosition,
  LegendSpec,
  VisualizationLayer,
  VisualizationSpec,
} from '../spec/types';
import { useGeoVis } from './contexts';
import type { ProportionalCirclesConfig } from './GeoVisLegend.circles';
import {
  buildCircledItems,
  CirclesLegendItems,
  findProportionalCirclesConfig,
} from './GeoVisLegend.circles';
import { formatCompactNumber, formatLabel } from './GeoVisLegend.formatters';

interface LegendItem {
  binIndex: number;
  label: string;
  color: string;
}

const findLegendInLayer = (
  layer: VisualizationLayer,
  legendId: string
): LegendSpec | undefined => {
  return layer.legends?.find((legend) => {
    return legend.id === legendId;
  });
};

const resolveLegend = (
  spec: VisualizationSpec,
  legendId: string
): LegendSpec | undefined => {
  const topLevelLegend = spec.legends?.find((legend) => {
    return legend.id === legendId;
  });
  if (topLevelLegend) return topLevelLegend;
  for (const layer of spec.layers) {
    const layerLegend = findLegendInLayer(layer, legendId);
    if (layerLegend) return layerLegend;
  }
  return undefined;
};

const defaultFormatValue = (value: number): string => {
  return value.toLocaleString('en-US');
};

const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

export const parseReference = (text: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const pattern =
    /\{link:([^|{}\r\n]+)\|([^{}\r\n]*(?:\{[^{}\r\n]*\}[^{}\r\n]*)*)\}/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    const url = match[2];
    nodes.push(
      isSafeUrl(url) ? (
        <Link key={key++} href={url} target="_blank" rel="noopener noreferrer">
          {match[1]}
        </Link>
      ) : (
        match[1]
      )
    );
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
};

const resolvePositionStyle = (
  position: LegendPosition | undefined
): React.CSSProperties | undefined => {
  if (!position) return undefined;
  const base = { position: 'absolute' as const, zIndex: 10 };
  const coords =
    position === 'top-left'
      ? { top: 10, left: 10 }
      : position === 'top-right'
        ? { top: 10, right: 10 }
        : position === 'bottom-left'
          ? { bottom: 10, left: 10 }
          : { bottom: 10, right: 10 };
  return { ...base, ...coords };
};

const buildCategoricalItems = (legend: LegendSpec): LegendItem[] => {
  const colorBy = legend.colorBy;
  if (colorBy.type !== 'categorical') return [];
  const mapping = Object.entries(colorBy.mapping ?? {});
  if (!mapping.length)
    return [
      {
        binIndex: 0,
        label: 'All',
        color: resolveCategoricalFallbackColor(colorBy),
      },
    ];
  const fmtLabels =
    legend.labelFormat?.type === 'labels' ? legend.labelFormat.labels : [];
  return mapping.map(([key, color], index) => {
    return { binIndex: index, label: fmtLabels[index] ?? key, color };
  });
};

const buildQuantitativeItems = ({
  legend,
  breaks,
  formatValue,
}: {
  legend: LegendSpec;
  breaks: number[];
  formatValue: (value: number) => string;
}): LegendItem[] => {
  const colorBy = legend.colorBy;
  if (colorBy.type !== 'quantitative') return [];
  const fallbackColor = resolveQuantitativeFallbackColor(colorBy, breaks);
  if (!breaks.length)
    return [{ binIndex: 0, label: 'All values', color: fallbackColor }];
  const total = breaks.length + 1;
  const palette = resolvePalette(colorBy, total);
  const { labelFormat, normalization } = legend;
  const mkLabel = (
    lower: number | null,
    upper: number | null,
    index: number
  ) => {
    return formatLabel({
      lower,
      upper,
      index,
      total,
      spec: labelFormat,
      normalization,
      formatValue,
    });
  };
  const items: LegendItem[] = [
    { binIndex: 0, label: mkLabel(null, breaks[0], 0), color: fallbackColor },
  ];
  for (let i = 1; i < breaks.length; i += 1) {
    items.push({
      binIndex: i,
      label: mkLabel(breaks[i - 1], breaks[i], i),
      color: palette[i] ?? fallbackColor,
    });
  }
  items.push({
    binIndex: breaks.length,
    label: mkLabel(breaks[breaks.length - 1], null, breaks.length),
    color: palette[breaks.length] ?? fallbackColor,
  });
  return items;
};

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

const computeNormalizedBreaks = (
  breaks: number[] | undefined,
  legend: LegendSpec | undefined
): number[] => {
  const source =
    breaks !== undefined
      ? breaks
      : legend?.colorBy?.type === 'quantitative'
        ? (legend.colorBy.thresholds ?? [])
        : [];
  const deduped = new Set<number>();
  for (const value of source) {
    if (!Number.isFinite(value)) continue;
    deduped.add(value);
  }
  return Array.from(deduped).sort((a, b) => {
    return a - b;
  });
};

const shouldShowCircleItems = (
  circleConfig: ProportionalCirclesConfig | null,
  legend: LegendSpec | undefined,
  legends: VisualizationSpec['legends']
): boolean => {
  if (!circleConfig) return false;
  if (legends && legends.length > 1 && legend?.colorBy) return false;
  return true;
};

const resolveFormatter = (
  explicit: ((value: number) => string) | undefined,
  circleConfig: ProportionalCirclesConfig | null
): ((value: number) => string) => {
  return explicit ?? (circleConfig ? formatCompactNumber : defaultFormatValue);
};

const buildColorItems = (
  legend: LegendSpec | undefined,
  breaks: number[],
  formatValue: (value: number) => string
): LegendItem[] => {
  if (!legend || !legend.colorBy) return [];
  if (legend.colorBy.type === 'categorical') {
    return buildCategoricalItems(legend);
  }
  return buildQuantitativeItems({ legend, breaks, formatValue });
};

const hasLegendContent = (
  legend: LegendSpec | undefined,
  items: LegendItem[],
  circleItems: CircledLegendItem[]
): boolean => {
  if (!legend) return false;
  if (items.length === 0 && circleItems.length === 0) return false;
  return true;
};

const shouldShowTopDivider = (
  items: LegendItem[],
  circleItems: CircledLegendItem[],
  legends: VisualizationSpec['legends']
): boolean => {
  if (circleItems.length === 0) return false;
  if (items.length > 0) return false;
  if (!legends || legends.length <= 1) return false;
  return true;
};

const buildContainerStyle = (
  position: LegendPosition | undefined
): React.CSSProperties => {
  const positionStyle = resolvePositionStyle(position);
  if (!positionStyle) return {};
  return {
    ...positionStyle,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 6,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    padding: '8px 12px',
    width: '16rem',
  };
};

const buildReferenceContent = (
  sourceNode: React.ReactNode,
  legend: LegendSpec
): React.ReactNode => {
  if (sourceNode != null) return sourceNode;
  if (legend.reference != null) return parseReference(legend.reference);
  return null;
};

const BORDER_COLOR = '#d1d5db';
const MUTED_COLOR = '#6b7280';

const swatchBase: React.CSSProperties = {
  display: 'inline-block',
  height: 12,
  marginRight: 8,
  width: 12,
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};

export const GeoVisLegend = ({
  legendId,
  breaks,
  formatValue,
  className,
  sourceNode,
}: GeoVisLegendProps) => {
  const { spec } = useGeoVis();

  const legend = React.useMemo(() => {
    return resolveLegend(spec, legendId);
  }, [spec, legendId]);
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
    if (!shouldShowCircleItems(circleConfig, legend, spec.legends)) return [];
    return buildCircledItems(circleConfig, resolvedFormatValue);
  }, [circleConfig, resolvedFormatValue, legend, spec.legends]);

  if (!hasLegendContent(legend, items, circleItems)) return null;

  const referenceContent = buildReferenceContent(sourceNode, legend);
  const containerStyle = buildContainerStyle(legend.position);

  const showTopDivider = shouldShowTopDivider(items, circleItems, spec.legends);

  return (
    <div className={className} style={containerStyle}>
      {showTopDivider && (
        <div
          aria-hidden="true"
          style={{ borderTop: `1px solid ${BORDER_COLOR}`, margin: '4px 0' }}
        />
      )}
      {legend.title && (
        <p style={{ fontWeight: 600, margin: '0 0 2px', marginTop: 16 }}>
          {legend.title}
        </p>
      )}
      {legend.subtitle && (
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
        {legend.noDataLabel && (
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
