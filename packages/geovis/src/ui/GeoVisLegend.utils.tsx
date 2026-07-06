import { Link } from '@ttoss/ui';
import type * as React from 'react';

import {
  resolveCategoricalFallbackColor,
  resolvePalette,
  resolveQuantitativeFallbackColor,
} from '../adapters/maplibre/legendTranslation';
import { getProportionalCirclesAutoLegendId } from '../spec/mapTypeDefaults/proportionalCircles';
import type {
  LegendPosition,
  LegendSpec,
  VisualizationLayer,
  VisualizationSpec,
} from '../spec/types';
import type {
  CircledLegendItem,
  ProportionalCirclesConfig,
} from './GeoVisLegend.circles';
import { formatCompactNumber, formatLabel } from './GeoVisLegend.formatters';

export interface LegendItem {
  binIndex: number;
  label: string;
  color: string;
}

export const findLegendInLayer = (
  layer: VisualizationLayer,
  legendId: string
): LegendSpec | undefined => {
  return layer.legends?.find((legend) => {
    return legend.id === legendId;
  });
};

export const resolveLegend = (
  spec: VisualizationSpec,
  legendId: string
): LegendSpec | undefined => {
  const topLevelLegend = spec.legends?.find((legend) => {
    return legend.id === legendId;
  });
  if (topLevelLegend) return topLevelLegend;
  // With `legendEnabled: false`, the proportionalCircles resolver keeps its
  // auto-generated legend off `spec.legends` but still attaches it to the
  // layer so the adapter can resolve colorBy. That layer copy is adapter-only
  // data — resolving it here would render a legend the spec explicitly
  // disabled. The auto legend is recognised by its deterministic id, so
  // user-authored layer legends still resolve normally.
  if (
    spec.legendEnabled === false &&
    legendId === getProportionalCirclesAutoLegendId(spec)
  ) {
    return undefined;
  }
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

export const resolvePositionStyle = (
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

export const buildCategoricalItems = (legend: LegendSpec): LegendItem[] => {
  const colorBy = legend.colorBy;
  if (!colorBy || colorBy.type !== 'categorical') return [];
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
    return {
      binIndex: index,
      label: fmtLabels[index] ?? key,
      color: color as string,
    };
  });
};

export const buildQuantitativeItems = ({
  legend,
  breaks,
  formatValue,
}: {
  legend: LegendSpec;
  breaks: number[];
  formatValue: (value: number) => string;
}): LegendItem[] => {
  const colorBy = legend.colorBy;
  if (!colorBy || colorBy.type !== 'quantitative') return [];
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

export const getBreaksSource = (
  breaks: number[] | undefined,
  legend: LegendSpec | undefined
): number[] => {
  if (breaks !== undefined) return breaks;
  if (legend?.colorBy?.type !== 'quantitative') return [];
  return legend.colorBy.thresholds ?? [];
};

export const computeNormalizedBreaks = (
  breaks: number[] | undefined,
  legend: LegendSpec | undefined
): number[] => {
  const source = getBreaksSource(breaks, legend);
  const deduped = new Set<number>();
  for (const value of source) {
    if (!Number.isFinite(value)) continue;
    deduped.add(value);
  }
  return Array.from(deduped).sort((a, b) => {
    return a - b;
  });
};

export const shouldShowCircleItems = (
  circleConfig: ProportionalCirclesConfig | null,
  legend: LegendSpec | undefined,
  spec: VisualizationSpec
): boolean => {
  if (!circleConfig) return false;
  // The size key is part of the auto-generated legend; when the spec disables
  // it, the circles must not leak into user legends either.
  if (spec.legendEnabled === false) return false;
  // The auto-generated size legend always owns the circle reference items,
  // regardless of its own `colorBy` — that field is independent of other
  // legends' and must not be used to decide ownership.
  if (legend?.id === getProportionalCirclesAutoLegendId(spec)) return true;
  const legends = spec.legends;
  if (legends && legends.length > 1 && legend?.colorBy) return false;
  return true;
};

/**
 * The proportionalCircles auto-generated legend always carries a `colorBy`
 * (`buildColorBy` in `mapTypeDefaults/proportionalCircles.ts`) purely so the
 * adapter has a legend to build a `circle-color` expression from — every bin
 * it defines resolves to the same flat color, so it carries no real visual
 * distinction. Rendering it as a value-band list would just duplicate the
 * circle size key with meaningless identical-color rows; this legend's UI
 * job is the circle reference key only (see `shouldShowCircleItems`).
 */
export const shouldShowColorItems = (
  legend: LegendSpec | undefined,
  spec: VisualizationSpec
): boolean => {
  if (legend?.id === getProportionalCirclesAutoLegendId(spec)) return false;
  return true;
};

export const resolveFormatter = (
  explicit: ((value: number) => string) | undefined,
  circleConfig: ProportionalCirclesConfig | null
): ((value: number) => string) => {
  return explicit ?? (circleConfig ? formatCompactNumber : defaultFormatValue);
};

export const buildColorItems = (
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

export const hasLegendContent = (
  legend: LegendSpec | undefined,
  items: LegendItem[],
  circleItems: CircledLegendItem[]
): boolean => {
  if (!legend) return false;
  if (items.length === 0 && circleItems.length === 0) return false;
  return true;
};

export const shouldShowTopDivider = (
  items: LegendItem[],
  circleItems: CircledLegendItem[],
  positionedLegendCount: number
): boolean => {
  if (circleItems.length === 0) return false;
  if (items.length > 0) return false;
  if (positionedLegendCount <= 1) return false;
  return true;
};

export const buildContainerStyle = (
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

export const buildReferenceContent = (
  sourceNode: React.ReactNode,
  legend: LegendSpec | undefined
): React.ReactNode => {
  if (sourceNode != null) return sourceNode;
  if (legend?.reference != null) return parseReference(legend.reference);
  return null;
};

export const BORDER_COLOR = '#d1d5db';
export const MUTED_COLOR = '#6b7280';

export const swatchBase: React.CSSProperties = {
  display: 'inline-block',
  height: 12,
  marginRight: 8,
  width: 12,
};

export const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
};
