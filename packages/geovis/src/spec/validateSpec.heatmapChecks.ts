import {
  findHeatmapLayerForLegend,
  HEATMAP_PALETTE_NAMES,
  isHeatmapPaletteName,
} from './heatmap';
import type { GeoVisIssue } from './result';
import type {
  HeatmapPaint,
  LegendSpec,
  VisualizationLayer,
  VisualizationSpec,
} from './types';

/** The zoom-scaled heatmap keys, with the highest value each accepts. */
const ZOOM_SCALED_KEYS = {
  heatmapRadius: Infinity,
  heatmapOpacity: 1,
  heatmapIntensity: Infinity,
} as const;

type ZoomScaledKey = keyof typeof ZOOM_SCALED_KEYS;

const isStop = (stop: unknown): stop is [number, number] => {
  return (
    Array.isArray(stop) &&
    stop.length === 2 &&
    Number.isFinite(stop[0]) &&
    Number.isFinite(stop[1])
  );
};

/**
 * What is wrong with one zoom-scaled value — a number, or `[zoom, value]`
 * stops in strictly ascending zoom order — or `undefined` when it is valid.
 */
const zoomScaledProblem = ({
  value,
  max,
}: {
  value: unknown;
  max: number;
}): string | undefined => {
  const inRange = (n: number) => {
    return n >= 0 && n <= max;
  };
  const range = max === Infinity ? '0 or more' : `between 0 and ${max}`;
  if (typeof value === 'number') {
    return Number.isFinite(value) && inRange(value)
      ? undefined
      : `must be ${range}`;
  }
  if (!Array.isArray(value) || value.length === 0 || !value.every(isStop)) {
    return 'must be a number or a non-empty list of [zoom, value] pairs';
  }
  const ascending = value.every((stop, index) => {
    return index === 0 || stop[0] > value[index - 1][0];
  });
  if (!ascending) return 'must list its [zoom, value] pairs in ascending zoom';
  return value.every((stop) => {
    return inRange(stop[1]);
  })
    ? undefined
    : `must keep every value ${range}`;
};

const zoomScaledIssues = ({
  layer,
  paint,
}: {
  layer: VisualizationLayer;
  paint: Record<string, unknown>;
}): GeoVisIssue[] => {
  return (Object.keys(ZOOM_SCALED_KEYS) as ZoomScaledKey[]).flatMap((key) => {
    if (paint[key] === undefined) return [];
    const problem = zoomScaledProblem({
      value: paint[key],
      max: ZOOM_SCALED_KEYS[key],
    });
    if (!problem) return [];
    return [
      {
        code: 'invalid-schema' as const,
        subject: { path: `layers[${layer.id}].paint.${key}`, id: layer.id },
        message: `layer '${layer.id}' paint.${key} ${problem}`,
      },
    ];
  });
};

const colorsIssues = ({
  layer,
  colors,
}: {
  layer: VisualizationLayer;
  colors: unknown;
}): GeoVisIssue[] => {
  if (colors === undefined) return [];
  const path = `layers[${layer.id}].paint.heatmapColors`;
  if (typeof colors === 'string') {
    if (isHeatmapPaletteName(colors)) return [];
    return [
      {
        code: 'invalid-schema',
        subject: { path, id: layer.id },
        message: `layer '${layer.id}' paint.heatmapColors names unknown palette '${colors}'; the map would fall back to MapLibre's own ramp`,
        repair: [
          { kind: 'allowed-values', path, values: HEATMAP_PALETTE_NAMES },
        ],
      },
    ];
  }
  const valid =
    Array.isArray(colors) &&
    colors.length >= 2 &&
    colors.every((color) => {
      return typeof color === 'string' && color.length > 0;
    });
  if (valid) return [];
  return [
    {
      code: 'invalid-schema',
      subject: { path, id: layer.id },
      message: `layer '${layer.id}' paint.heatmapColors must be a palette name or a list of at least two colours`,
    },
  ];
};

const weightIssues = ({
  layer,
  weight,
}: {
  layer: VisualizationLayer;
  weight: HeatmapPaint['heatmapWeight'];
}): GeoVisIssue[] => {
  if (weight === undefined) return [];
  const valid =
    typeof weight === 'number'
      ? Number.isFinite(weight) && weight >= 0
      : typeof weight?.property === 'string' &&
        weight.property.length > 0 &&
        Number.isFinite(weight.max) &&
        weight.max > 0;
  if (valid) return [];
  return [
    {
      code: 'invalid-schema',
      subject: {
        path: `layers[${layer.id}].paint.heatmapWeight`,
        id: layer.id,
      },
      message: `layer '${layer.id}' paint.heatmapWeight must be a number of 0 or more, or { property, max } with a property name and a max greater than 0`,
    },
  ];
};

/** The issues of one heatmap layer's `paint` values. */
const validateHeatmapLayer = (layer: VisualizationLayer): GeoVisIssue[] => {
  if (layer.geometry !== 'heatmap') return [];
  const paint = (layer.paint ?? {}) as Record<string, unknown>;
  return [
    ...zoomScaledIssues({ layer, paint }),
    ...colorsIssues({ layer, colors: paint.heatmapColors }),
    ...weightIssues({
      layer,
      weight: paint.heatmapWeight as HeatmapPaint['heatmapWeight'],
    }),
  ];
};

/** The issue for a density legend no heatmap layer refers to. */
const validateDensityLegend = ({
  legend,
  path,
  spec,
}: {
  legend: LegendSpec;
  path: string;
  spec: VisualizationSpec;
}): GeoVisIssue[] => {
  if (legend.colorBy?.type !== 'density') return [];
  if (findHeatmapLayerForLegend(spec, legend)) return [];
  return [
    {
      code: 'invalid-schema',
      subject: { path, id: legend.id },
      message: `legend '${legend.id}' is a density legend, but no heatmap layer refers to it through activeLegendId or its own legends; it has no colours to show`,
    },
  ];
};

/**
 * Validates what heatmaps add beyond their paint keys: the zoom stops,
 * palette and weight of each heatmap layer's `paint` — which the schema
 * leaves open — and that every density legend has a heatmap layer to read
 * its colours from. Otherwise a bad value would reach MapLibre, which drops
 * the property and draws its default, and a stray density legend would
 * render nothing — both silently.
 *
 * @param spec - The spec to check.
 * @returns One issue per invalid value or unreferenced density legend.
 */
export const validateHeatmaps = (spec: VisualizationSpec): GeoVisIssue[] => {
  const legendIssues = [
    ...(spec.legends ?? []).map((legend) => {
      return { legend, path: `legends[${legend.id}].colorBy` };
    }),
    ...spec.layers.flatMap((layer) => {
      return (layer.legends ?? []).map((legend) => {
        return {
          legend,
          path: `layers[${layer.id}].legends[${legend.id}].colorBy`,
        };
      });
    }),
  ].flatMap(({ legend, path }) => {
    return validateDensityLegend({ legend, path, spec });
  });
  return [...spec.layers.flatMap(validateHeatmapLayer), ...legendIssues];
};
