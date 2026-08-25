import type {
  Catalog,
  FilterDomain,
  FilterField,
  FilterKind,
  Metric,
} from './schema/types';

/** One option of a categorical filter's computed domain, with its row count. */
export interface FilterOption {
  value: string | number;
  label: string;
  count?: number;
}

/**
 * The domain `computeFilterDomain` derives from data rows at runtime — never
 * part of the catalog contract itself, where `FilterField.domain` is always
 * `{ mode: 'runtime' }` (the catalog only declares that a domain exists; the
 * application computes its actual shape from the rows it holds).
 */
export type ComputedFilterDomain =
  | { mode: 'values'; values: FilterOption[] }
  | { mode: 'range'; min: number; max: number }
  | { mode: 'interval'; start: string; end: string };

/** Widget a `FilterControl` expects to be rendered as. */
export type FilterControlKind =
  'select' | 'multi-select' | 'range-slider' | 'date-range';

/** Where the filtered property lives, resolved to a labelled reference. */
export interface FilterControlSource {
  kind: 'dataset' | 'geography';
  id: string;
  /** Label of the referenced dataset/geography, or the id when it resolves to nothing. */
  label: string;
}

/**
 * Everything a UI needs to render one filter, with catalog references already
 * resolved — so a component maps over these instead of walking the catalog
 * and cross-referencing datasets, geographies and metrics itself.
 */
export interface FilterControl {
  id: string;
  label: string;
  description?: string;
  /** Data type of the filtered property. */
  kind: FilterKind;
  /** Widget to render, derived from `kind` and whether multiple values are allowed. */
  control: FilterControlKind;
  /** Feature property the emitted predicate reads. */
  property: string;
  source: FilterControlSource;
  operators: FilterField['operators'];
  domain: FilterDomain;
  /** Unit of the filtered measure, inherited from `metricId` when declared. */
  unit?: string;
  /** Formatting hint for displaying bounds and values, inherited from `metricId`. */
  formatter?: Metric['formatter'];
  /**
   * `true` when `domain.mode` is `'runtime'` — the control cannot render its
   * options or bounds until `computeFilterDomain` is called with the data.
   */
  requiresData: boolean;
}

const resolveControlKind = ({
  kind,
  multiple,
}: {
  kind: FilterKind;
  multiple?: boolean;
}): FilterControlKind => {
  if (kind === 'numeric') return 'range-slider';
  if (kind === 'temporal') return 'date-range';
  return multiple === true ? 'multi-select' : 'select';
};

const resolveSource = ({
  catalog,
  filter,
}: {
  catalog: Catalog;
  filter: FilterField;
}): FilterControlSource => {
  if (filter.sourceGeographyId !== undefined) {
    const geography = catalog.geographies.find((candidate) => {
      return candidate.id === filter.sourceGeographyId;
    });
    return {
      kind: 'geography',
      id: filter.sourceGeographyId,
      label: geography?.title ?? filter.sourceGeographyId,
    };
  }

  const datasetId = filter.sourceDatasetId ?? '';
  const dataset = catalog.datasets.find((candidate) => {
    return candidate.id === datasetId;
  });

  return { kind: 'dataset', id: datasetId, label: dataset?.title ?? datasetId };
};

/**
 * Projects `catalog.filters` into render-ready descriptors, resolving each
 * filter's source and its metric's display hints.
 *
 * Call it on a catalog that already passed `validateCatalog`: on an
 * unvalidated one, a reference that resolves to nothing falls back to the raw
 * id rather than throwing, so a broken catalog degrades to a usable — if
 * unlabelled — control instead of an empty screen.
 *
 * @param catalog - The catalog whose filters should be rendered.
 * @returns One descriptor per entry in `catalog.filters`, in declaration order.
 */
export const getFilterControls = (catalog: Catalog): FilterControl[] => {
  return catalog.filters.map((filter) => {
    const metric = catalog.metrics.find((candidate) => {
      return candidate.id === filter.metricId;
    });

    return {
      id: filter.id,
      label: filter.title,
      description: filter.description,
      kind: filter.kind,
      control: resolveControlKind({
        kind: filter.kind,
        multiple: filter.multiple,
      }),
      property: filter.property,
      source: resolveSource({ catalog, filter }),
      operators: filter.operators,
      domain: filter.domain,
      unit: metric?.unit,
      formatter: metric?.formatter,
      requiresData: filter.domain.mode === 'runtime',
    };
  });
};

const readCell = ({
  row,
  property,
}: {
  row: Record<string, unknown>;
  property: string;
}): unknown => {
  return row[property];
};

const computeValuesDomain = ({
  rows,
  property,
}: {
  rows: ReadonlyArray<Record<string, unknown>>;
  property: string;
}): ComputedFilterDomain | undefined => {
  const counts = new Map<string | number, number>();

  for (const row of rows) {
    const cell = readCell({ row, property });
    if (typeof cell !== 'string' && typeof cell !== 'number') continue;
    counts.set(cell, (counts.get(cell) ?? 0) + 1);
  }

  if (counts.size === 0) return undefined;

  const values: FilterOption[] = [...counts.entries()]
    .map(([value, count]) => {
      return { value, label: String(value), count };
    })
    .sort((a, b) => {
      return a.label.localeCompare(b.label);
    });

  return { mode: 'values', values };
};

const computeRangeDomain = ({
  rows,
  property,
}: {
  rows: ReadonlyArray<Record<string, unknown>>;
  property: string;
}): ComputedFilterDomain | undefined => {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let seen = false;

  for (const row of rows) {
    const cell = readCell({ row, property });
    if (typeof cell !== 'number' || !Number.isFinite(cell)) continue;
    seen = true;
    if (cell < min) min = cell;
    if (cell > max) max = cell;
  }

  return seen ? { mode: 'range', min, max } : undefined;
};

const computeIntervalDomain = ({
  rows,
  property,
}: {
  rows: ReadonlyArray<Record<string, unknown>>;
  property: string;
}): ComputedFilterDomain | undefined => {
  let start: string | undefined;
  let end: string | undefined;

  for (const row of rows) {
    const cell = readCell({ row, property });
    if (typeof cell !== 'string' || cell.length === 0) continue;
    if (start === undefined || cell < start) start = cell;
    if (end === undefined || cell > end) end = cell;
  }

  if (start === undefined || end === undefined) return undefined;
  return { mode: 'interval', start, end };
};

/**
 * Derives a concrete domain for a filter whose catalog domain is `'runtime'`,
 * by scanning the rows the application already holds. Pure — it reads the
 * rows passed to it and fetches nothing, keeping data access on the
 * application's side of the line PRD-004 draws.
 *
 * Values that do not match the filter's `kind` are skipped rather than
 * coerced: a numeric column holding `'12'` as text is a data problem the
 * catalog should not paper over by silently parsing it.
 *
 * @param filter - The filter whose domain should be computed.
 * @param rows - Feature rows keyed by property name.
 * @returns The computed domain, or `undefined` when no row carries a usable value.
 */
export const computeFilterDomain = ({
  filter,
  rows,
}: {
  filter: FilterField;
  rows: ReadonlyArray<Record<string, unknown>>;
}): ComputedFilterDomain | undefined => {
  const property = filter.property;

  if (filter.kind === 'categorical') {
    return computeValuesDomain({ rows, property });
  }

  if (filter.kind === 'numeric') {
    return computeRangeDomain({ rows, property });
  }

  return computeIntervalDomain({ rows, property });
};
