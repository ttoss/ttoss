import type { LayerFilter } from '../../spec/types';

/** Comparison operators that compile to `[operator, ['get', property], value]`. */
const COMPARISON_EXPRESSIONS: Record<string, string> = {
  eq: '==',
  neq: '!=',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
};

/**
 * Compiles a `LayerFilter` to a MapLibre filter expression, reading the
 * property directly from `feature.properties` via `['get', property]` — the
 * same direct-access path `propertyName` uses elsewhere in this package, not
 * the `mapData`-joined feature-state value.
 */
export const layerFilterToExpression = (filter: LayerFilter): unknown[] => {
  const getProp = ['get', filter.property];
  if (filter.operator === 'in') {
    return ['in', getProp, ['literal', filter.value]];
  }
  if (filter.operator === 'not-in') {
    return ['!', ['in', getProp, ['literal', filter.value]]];
  }
  return [COMPARISON_EXPRESSIONS[filter.operator], getProp, filter.value];
};
