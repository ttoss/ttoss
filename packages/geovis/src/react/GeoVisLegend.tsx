import * as React from 'react';

import type {
  LegendSpec,
  VisualizationLayer,
  VisualizationSpec,
} from '../spec/types';
import { useGeoVis } from './GeoVisProvider';

const DEFAULT_LEGEND_COLORS = [
  '#dbeafe',
  '#93c5fd',
  '#60a5fa',
  '#3b82f6',
  '#1d4ed8',
];

const DEFAULT_MISSING_COLOR = '#9ca3af';

interface LegendItem {
  binIndex: number;
  label: string;
  color: string;
}

const ensurePalette = (
  colors: string[] | undefined,
  length: number
): string[] => {
  const palette = [...(colors?.length ? colors : DEFAULT_LEGEND_COLORS)];
  while (palette.length < length) {
    palette.push(palette[palette.length - 1] ?? DEFAULT_MISSING_COLOR);
  }
  return palette;
};

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
  if (mapping.length) {
    return mapping.map(([label, color], index) => {
      return {
        binIndex: index,
        label,
        color,
      };
    });
  }

  const palette = ensurePalette(colorBy.colors, colorBy.colors?.length ?? 1);
  return palette.map((color, index) => {
    return {
      binIndex: index,
      label: `Category ${index + 1}`,
      color,
    };
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

  const fallbackColor = colorBy.defaultColor ?? DEFAULT_MISSING_COLOR;
  if (!breaks.length) {
    return [
      {
        binIndex: 0,
        label: 'All values',
        color: fallbackColor,
      },
    ];
  }

  const palette = ensurePalette(colorBy.colors, breaks.length + 1);
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
  /** Id of the legend entry to render. */
  legendId: string;
  /** Quantitative legend breaks provided by the caller (already computed externally). */
  breaks?: number[];
  /** Optional formatter for quantitative break labels. */
  formatValue?: (value: number) => string;
  /** Optional CSS class for the legend container. */
  className?: string;
}

/**
 * Renders a headless legend from the current GeoVis spec.
 *
 * Uses local runtime state for hover/disable interactions (`hoveredBin`,
 * `disabledBins`) so consumers can compose styles and event effects without
 * persisting transient UI state in the visualization spec.
 */
export const GeoVisLegend = ({
  legendId,
  breaks = [],
  formatValue = defaultFormatValue,
  className,
}: GeoVisLegendProps) => {
  const { spec } = useGeoVis();

  const [hoveredBin, setHoveredBin] = React.useState<number | null>(null);
  const [disabledBins, setDisabledBins] = React.useState<Set<number>>(() => {
    return new Set<number>();
  });

  const legend = React.useMemo(() => {
    return resolveLegend(spec, legendId);
  }, [spec, legendId]);

  const normalizedBreaks = React.useMemo(() => {
    const deduped = new Set<number>();
    for (const value of breaks) {
      if (!Number.isFinite(value)) continue;
      deduped.add(value);
    }
    return Array.from(deduped).sort((a, b) => {
      return a - b;
    });
  }, [breaks]);

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

  const toggleBin = React.useCallback((binIndex: number) => {
    setDisabledBins((previous) => {
      const next = new Set(previous);
      if (next.has(binIndex)) next.delete(binIndex);
      else next.add(binIndex);
      return next;
    });
  }, []);

  if (!legend || !items.length) return null;

  return (
    <div
      aria-label={legend.label ?? legend.id}
      className={className}
      role="list"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 4,
      }}
    >
      {items.map((item) => {
        const disabled = disabledBins.has(item.binIndex);
        return (
          <button
            aria-pressed={disabled}
            data-hovered={hoveredBin === item.binIndex}
            key={`${legend.id}-${item.binIndex}`}
            onClick={() => {
              toggleBin(item.binIndex);
            }}
            onMouseEnter={() => {
              setHoveredBin(item.binIndex);
            }}
            onMouseLeave={() => {
              setHoveredBin(null);
            }}
            type="button"
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
          </button>
        );
      })}
    </div>
  );
};
