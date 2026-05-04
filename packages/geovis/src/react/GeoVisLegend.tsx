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

export interface GeoVisLegendProps {
  /** Id of the legend entry to render (resolved from `spec.legends` or `layer.legends`). */
  legendId: string;
  /** Quantitative legend breaks provided by the caller (already computed externally). */
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
 */
export const GeoVisLegend = ({
  legendId,
  breaks = [],
  formatValue = defaultFormatValue,
  className,
}: GeoVisLegendProps) => {
  const { spec } = useGeoVis();

  const legend = React.useMemo(() => {
    return resolveLegend(spec, legendId);
  }, [spec, legendId]);

  const normalizedBreaks = React.useMemo(() => {
    // Prefer the explicit `breaks` prop; fall back to `colorBy.thresholds` so
    // callers do not have to duplicate the break list that is already declared
    // in the spec and used by the adapter for the map expression.
    const source =
      breaks.length > 0
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

  return (
    <ul
      aria-label={legend.label ?? legend.id}
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
  );
};
