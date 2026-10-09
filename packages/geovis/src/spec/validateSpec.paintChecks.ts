import { PAINT_KEYS } from './paintKeys';
import type { GeoVisIssue, RepairOption } from './result';
import type { VisualizationLayer, VisualizationSpec } from './types';

/** `fill-color` → `fillColor`: the casing MapLibre's own keys arrive in. */
const kebabToCamel = (key: string): string => {
  return key.replace(/-([a-z])/g, (_, letter: string) => {
    return letter.toUpperCase();
  });
};

/**
 * The repairs for one unknown key: the same value under the camelCase key it
 * was meant to be, when there is one, and the keys the geometry accepts.
 */
const repairsFor = ({
  layer,
  key,
  value,
  allowed,
}: {
  layer: VisualizationLayer;
  key: string;
  value: unknown;
  allowed: ReadonlyArray<string>;
}): RepairOption[] => {
  const camel = kebabToCamel(key);
  const rename: RepairOption[] =
    camel !== key && allowed.includes(camel)
      ? [
          {
            kind: 'set-value',
            path: `layers[${layer.id}].paint.${camel}`,
            value,
            label: `Use '${camel}' instead of '${key}'`,
          },
        ]
      : [];
  return [
    ...rename,
    {
      kind: 'allowed-values',
      path: `layers[${layer.id}].paint`,
      values: allowed,
    },
  ];
};

/** One issue per `paint` key the layer's geometry does not accept. */
const validateLayerPaint = (layer: VisualizationLayer): GeoVisIssue[] => {
  const paint = (layer.paint ?? {}) as Record<string, unknown>;
  const allowed = PAINT_KEYS[layer.geometry];

  return Object.keys(paint)
    .filter((key) => {
      return !allowed.includes(key);
    })
    .map((key) => {
      return {
        code: 'invalid-schema' as const,
        subject: { path: `layers[${layer.id}].paint.${key}`, id: layer.id },
        message: `layer '${layer.id}' (${layer.geometry}) has unknown paint key '${key}'; it would be ignored at render time. Accepted keys: ${allowed.join(', ')}`,
        repair: repairsFor({ layer, key, value: paint[key], allowed }),
      };
    });
};

/**
 * Validates every layer's `paint` keys against its geometry's vocabulary
 * (`PAINT_KEYS`). The schema cannot: which keys are valid depends on the
 * layer's `geometry`. An unknown key — MapLibre's kebab-case `fill-color`, a
 * `lineWidth` on a polygon — would otherwise be dropped by the adapter, and
 * the layer would render in its default style with nothing reported.
 *
 * @param spec - The spec to check.
 * @returns One issue per unknown key.
 */
export const validatePaintKeys = (spec: VisualizationSpec): GeoVisIssue[] => {
  return spec.layers.flatMap(validateLayerPaint);
};
