import * as React from 'react';

import {
  resolveCategoricalFallbackColor,
  resolvePalette,
  resolveQuantitativeFallbackColor,
} from '../adapters/maplibre/legendTranslation';
import type {
  LegendSpec,
  VisualizationLayer,
  VisualizationSpec,
} from '../spec/types';
import { useGeoVis } from './contexts';

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

  const palette = resolvePalette(colorBy, breaks.length + 1);
  const items: LegendItem[] = [
    {
      binIndex: 0,
      label: `< ${formatValue(breaks[0])}`,
      color: fallbackColor,
    },
  ];

  for (let i = 1; i < breaks.length; i += 1) {
    items.push({
      binIndex: i,
      label: `${formatValue(breaks[i - 1])} - < ${formatValue(breaks[i])}`,
      color: palette[i] ?? fallbackColor,
    });
  }

  items.push({
    binIndex: breaks.length,
    label: `>= ${formatValue(breaks[breaks.length - 1])}`,
    color: palette[breaks.length] ?? fallbackColor,
  });

  return items;
};

/**
 * Renders a `percentage-extended` quantitative legend: a continuous gradient
 * bar where each color class occupies proportional width based on its
 * threshold range, with break-point tick marks and value labels.
 *
 * For open-ended first / last classes (< min threshold, >= max threshold) an
 * equal share of the visible range is allocated, matching common cartographic
 * convention (Robinson & Slocum "Thematic Cartography", ch. 18).
 */
const PercentageExtendedLegend = ({
  legend,
  breaks,
  formatValue,
}: {
  legend: LegendSpec;
  breaks: number[];
  formatValue: (value: number) => string;
}) => {
  const colorBy = legend.colorBy;
  if (colorBy.type !== 'quantitative' || !breaks.length) return null;

  const classCount = breaks.length + 1;
  const palette = resolvePalette(colorBy, classCount);
  const fallbackColor = resolveQuantitativeFallbackColor(colorBy, breaks);
  // `resolvePalette` always returns an array, but may have fewer entries than
  // `classCount` when `colorBy.colors` is shorter than the class count.
  // Pad missing entries with the fallback color so the gradient never lacks stops.
  const colors = Array.from({ length: classCount }, (_, i) => {
    return palette[i] ?? fallbackColor;
  });

  // Each class gets an equal share of the bar width.
  const pct = 100 / classCount;

  // Build CSS hard-stop gradient: color0 0% pct%, color1 pct% 2pct%, …
  const stops: string[] = [];
  for (const [i, color] of colors.entries()) {
    const start = (i * pct).toFixed(4);
    const end = ((i + 1) * pct).toFixed(4);
    stops.push(`${color} ${start}% ${end}%`);
  }
  const gradient = `linear-gradient(to right, ${stops.join(', ')})`;

  // Tick positions (percentage along bar) for each break — skip first (0%) and last (100%).
  const ticks = breaks.map((_, i) => {
    return ((i + 1) * pct).toFixed(4);
  });

  return (
    <div
      aria-label={legend.label ?? legend.id}
      style={{ width: '100%', minWidth: 160 }}
    >
      {/* Gradient bar */}
      <div
        style={{
          position: 'relative',
          height: 16,
          borderRadius: 3,
          overflow: 'hidden',
          background: gradient,
        }}
      >
        {/* Tick marks at each break point */}
        {ticks.map((pos, i) => {
          return (
            <div
              key={i}
              aria-hidden="true"
              data-testid="legend-tick"
              style={{
                position: 'absolute',
                left: `${pos}%`,
                top: 0,
                bottom: 0,
                width: 1,
                background: 'rgba(0,0,0,0.25)',
                transform: 'translateX(-50%)',
              }}
            />
          );
        })}
      </div>
      {/* Value labels at each break point + min/max ends */}
      <div style={{ position: 'relative', height: 18, marginTop: 2 }}>
        {/* Min label (left) */}
        <span
          aria-label={`Less than ${formatValue(breaks[0])}`}
          style={{
            position: 'absolute',
            left: 0,
            fontSize: 10,
            color: '#6b7280',
            whiteSpace: 'nowrap',
          }}
        >
          {'<\u00a0'}
          {formatValue(breaks[0])}
        </span>
        {/* Break labels at tick positions */}
        {breaks.slice(1).map((breakValue, i) => {
          return (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${((i + 2) * pct).toFixed(4)}%`,
                fontSize: 10,
                color: '#6b7280',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
              }}
            >
              {formatValue(breakValue)}
            </span>
          );
        })}
        {/* Max label (right) */}
        <span
          style={{
            position: 'absolute',
            right: 0,
            fontSize: 10,
            color: '#6b7280',
            whiteSpace: 'nowrap',
          }}
        >
          {'\u2265\u00a0'}
          {formatValue(breaks[breaks.length - 1])}
        </span>
      </div>
    </div>
  );
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
}

/**
 * Renders a static, non-interactive legend from the current GeoVis spec.
 *
 * Resolves the active `LegendSpec` by `legendId` (top-level `spec.legends`
 * first, then per-layer `layer.legends`) and emits one swatch per
 * categorical mapping entry or quantitative threshold bin. Designed for
 * read-only display alongside `GeoVisCanvas`; it does not subscribe to
 * pointer or hover events and therefore never re-renders on cursor activity.
 *
 * When the resolved `LegendSpec` has `type: 'percentage-extended'`, a
 * continuous gradient bar with proportional class bands is rendered instead
 * of the default swatch list.
 *
 * A `source` field on the `LegendSpec` renders a small bibliographic
 * attribution line below the legend body.
 */
export const GeoVisLegend = ({
  legendId,
  breaks,
  formatValue = defaultFormatValue,
  className,
}: GeoVisLegendProps) => {
  const { spec } = useGeoVis();

  const legend = React.useMemo(() => {
    return resolveLegend(spec, legendId);
  }, [spec, legendId]);

  const normalizedBreaks = React.useMemo(() => {
    // `undefined` means the caller did not provide breaks → fall back to
    // `colorBy.thresholds` so the legend stays in sync with the adapter.
    // An explicitly provided empty array (`[]`) means the caller intentionally
    // wants the single-bin "All values" rendering, bypassing the thresholds.
    const breakValues =
      breaks !== undefined
        ? breaks
        : legend?.colorBy.type === 'quantitative'
          ? (legend.colorBy.thresholds ?? [])
          : [];
    const deduped = new Set<number>();
    for (const value of breakValues) {
      if (!Number.isFinite(value)) continue;
      deduped.add(value);
    }
    return Array.from(deduped).sort((a, b) => {
      return a - b;
    });
  }, [breaks, legend]);

  const items = React.useMemo(() => {
    if (!legend) return [];
    if (legend.type === 'percentage-extended') return [];
    if (legend.colorBy.type === 'categorical') {
      return buildCategoricalItems(legend);
    }
    return buildQuantitativeItems({
      legend,
      breaks: normalizedBreaks,
      formatValue,
    });
  }, [legend, normalizedBreaks, formatValue]);

  if (!legend) return null;

  const isPercentageExtended =
    legend.type === 'percentage-extended' &&
    legend.colorBy.type === 'quantitative' &&
    normalizedBreaks.length > 0;

  if (!isPercentageExtended && !items.length) return null;

  const source = legend.source;

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
    >
      {isPercentageExtended ? (
        <PercentageExtendedLegend
          legend={legend}
          breaks={normalizedBreaks}
          formatValue={formatValue}
        />
      ) : (
        <ul
          aria-label={legend.label ?? legend.id}
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
        </ul>
      )}
      {source != null && (
        <div
          aria-label="source"
          style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}
        >
          {source}
        </div>
      )}
    </div>
  );
};
