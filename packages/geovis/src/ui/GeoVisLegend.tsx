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
import { formatLabel } from './GeoVisLegend.formatters';

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
  return String(value);
};

/**
 * Parses a `reference` string and returns an array of React nodes.
 * Inline link syntax: `{link:visible text|https://example.com}` is
 * rendered as an `<a>` element.
 */
const parseReference = (text: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  const pattern = /\{link:([^|]+)\|([^}]+)\}/g;
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    nodes.push(
      <a key={key++} href={match[2]} rel="noopener noreferrer" target="_blank">
        {match[1]}
      </a>
    );
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
};

/**
 * Maps a `LegendPosition` value to CSS absolute-positioning properties.
 * The parent element must have `position: relative` (or equivalent) for
 * the overlay to be placed correctly. Returns `undefined` when no position
 * is specified.
 */
const resolvePositionStyle = (
  position: LegendPosition | undefined
): React.CSSProperties | undefined => {
  if (!position) return undefined;
  const base: React.CSSProperties = { position: 'absolute', zIndex: 10 };
  if (position === 'top-left') return { ...base, top: 10, left: 10 };
  if (position === 'top-right') return { ...base, top: 10, right: 10 };
  if (position === 'bottom-left') return { ...base, bottom: 10, left: 10 };
  return { ...base, bottom: 10, right: 10 };
};

const buildCategoricalItems = (legend: LegendSpec): LegendItem[] => {
  const colorBy = legend.colorBy;
  if (colorBy.type !== 'categorical') return [];

  const mapping = Object.entries(colorBy.mapping ?? {});
  // Empty mapping ⇒ adapter paints `['literal', fallbackColor]` (one solid
  // colour for every feature). Render a single "All" swatch so the legend
  // never disagrees with the painted layer.
  if (!mapping.length) {
    return [
      {
        binIndex: 0,
        label: 'All',
        color: resolveCategoricalFallbackColor(colorBy),
      },
    ];
  }

  return mapping.map(([label, color], index) => {
    return { binIndex: index, label, color };
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

  if (!breaks.length) {
    return [
      {
        binIndex: 0,
        label: 'All values',
        color: fallbackColor,
      },
    ];
  }

  const total = breaks.length + 1;
  const palette = resolvePalette(colorBy, total);
  const { labelFormat, normalization } = legend;

  // When `percentage` format has no explicit `denominator`, auto-derive it
  // from the max break so callers don't need to know the data scale.
  const effectiveLabelFormat =
    labelFormat?.type === 'percentage' &&
    !labelFormat.denominator &&
    breaks.length > 0
      ? { ...labelFormat, denominator: breaks[breaks.length - 1] }
      : labelFormat;

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
      spec: effectiveLabelFormat,
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
  /** Id of the legend entry to render (resolved from `spec.legends` or `layer.legends`). */
  legendId: string;
  /**
   * Quantitative legend breaks provided by the caller (already computed externally).
   * When omitted, the component falls back to `colorBy.thresholds` from the spec so
   * the legend stays in sync with the painted map without duplicating the threshold
   * list at the call site.
   * Pass an explicit empty array (`[]`) to force the single-bin "All values" rendering
   * regardless of any thresholds declared in the spec.
   */
  breaks?: number[];
  /** Optional formatter for quantitative break labels. */
  formatValue?: (value: number) => string;
  /** Optional CSS class for the legend container. */
  className?: string;
  /**
   * React node displayed as the source attribution below legend items.
   * Use this when you need rich HTML content (e.g. a custom anchor element)
   * that cannot be expressed through the `reference` string syntax.
   * Takes precedence over `LegendSpec.reference` when both are provided.
   */
  sourceNode?: React.ReactNode;
}

/**
 * Deduplicates, filters and sorts a raw breaks array.
 * When `breaks` is undefined falls back to `colorBy.thresholds` from the spec;
 * when `breaks` is an explicit empty array returns `[]` regardless of the spec.
 */
const computeNormalizedBreaks = (
  breaks: number[] | undefined,
  legend: LegendSpec | undefined
): number[] => {
  const source =
    breaks !== undefined
      ? breaks
      : legend?.colorBy.type === 'quantitative'
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

const buildReferenceContent = (
  sourceNode: React.ReactNode,
  legend: LegendSpec
): React.ReactNode => {
  if (sourceNode != null) return sourceNode;
  if (legend.reference != null) return parseReference(legend.reference);
  return null;
};

/**
 * Renders a static, non-interactive legend from the current GeoVis spec.
 *
 * Resolves the active `LegendSpec` by `legendId` (top-level `spec.legends`
 * first, then per-layer `layer.legends`) and emits one swatch per
 * categorical mapping entry or quantitative threshold bin.
 *
 * When `LegendSpec.position` is set the component applies CSS absolute
 * positioning so the legend can be overlaid on the map container without
 * coupling to the map engine. The parent element must have
 * `position: relative` (or equivalent).
 *
 * Designed for read-only display alongside `GeoVisCanvas`; it does not
 * subscribe to pointer or hover events and therefore never re-renders on
 * cursor activity.
 */
export const GeoVisLegend = ({
  legendId,
  breaks,
  formatValue = defaultFormatValue,
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

  const items = React.useMemo(() => {
    if (!legend) return [];
    if (legend.colorBy.type === 'categorical') {
      return buildCategoricalItems(legend);
    }
    return buildQuantitativeItems({
      legend,
      breaks: normalizedBreaks,
      formatValue,
    });
  }, [legend, normalizedBreaks, formatValue]);

  if (!legend || !items.length) return null;

  const positionStyle = resolvePositionStyle(legend.position);
  const referenceContent = buildReferenceContent(sourceNode, legend);

  const containerStyle: React.CSSProperties = positionStyle
    ? {
        ...positionStyle,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 6,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        padding: '8px 12px',
        width: '16rem',
      }
    : {};

  return (
    <div style={containerStyle}>
      {legend.title && (
        <p style={{ fontWeight: 600, margin: '0 0 2px' }}>{legend.title}</p>
      )}
      {legend.subtitle && (
        <p style={{ color: '#6b7280', fontSize: 12, margin: '0 0 4px' }}>
          {legend.subtitle}
        </p>
      )}
      <ul
        aria-label={legend.title ?? legend.id}
        className={className}
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
            <li
              key={`${legend.id}-${item.binIndex}`}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              <span
                aria-hidden="true"
                style={{
                  backgroundColor: item.color,
                  border: '1px solid #d1d5db',
                  display: 'inline-block',
                  height: 12,
                  marginRight: 8,
                  width: 12,
                }}
              />
              <span>{item.label}</span>
            </li>
          );
        })}
        {legend.noDataLabel && (
          <li style={{ display: 'flex', alignItems: 'center' }}>
            <span
              aria-hidden="true"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #9ca3af',
                display: 'inline-block',
                height: 12,
                marginRight: 8,
                width: 12,
              }}
            />
            <span>{legend.noDataLabel}</span>
          </li>
        )}
      </ul>
      {referenceContent != null && (
        <p
          style={{
            color: '#6b7280',
            fontSize: 11,
            margin: '6px 0 0',
          }}
        >
          {referenceContent}
        </p>
      )}
    </div>
  );
};
