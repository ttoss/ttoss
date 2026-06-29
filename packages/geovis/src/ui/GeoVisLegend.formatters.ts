import type { LabelFormatSpec, NormalizationSpec } from '../spec/types';

/** Compact units, checked from largest to smallest. */
const COMPACT_UNITS = [
  { threshold: 1_000_000, divisor: 1_000_000, suffix: 'M' },
  { threshold: 1_000, divisor: 1_000, suffix: 'k' },
] as const;

/**
 * Abbreviates large numbers, attaching a decimal place **only when it carries
 * information**. The scaled value is rounded to a single decimal; when that
 * result is a whole number the decimal is dropped, so clean multiples read as
 * `2M` / `500k` while genuinely fractional values keep precision (`1.5k`,
 * `62.5k`, `2.5M`). Values below 1000 are returned unchanged.
 *
 * @example abbreviateNumber(2_000_000) // "2M"
 * @example abbreviateNumber(62_500)    // "62.5k"
 * @example abbreviateNumber(250_000)   // "250k"
 */
export const abbreviateNumber = (v: number): string => {
  for (const { threshold, divisor, suffix } of COMPACT_UNITS) {
    if (Math.abs(v) < threshold) continue;
    const scaled = Math.round((v / divisor) * 10) / 10;
    const text = Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(1);
    return `${text}${suffix}`;
  }
  return String(v);
};

/**
 * Public, reusable compact-number formatter (e.g. `1500 → "1.5k"`,
 * `2_000_000 → "2M"`). It is the exported, stable name for the same
 * abbreviation behaviour as {@link abbreviateNumber}; consumers should prefer
 * this alias. Exposed so application code (and stories) can format compact
 * values without re-implementing the rule. Does NOT change the legend's
 * default `formatValue` — opt in by passing it explicitly.
 */
export const formatCompactNumber = (value: number): string => {
  return abbreviateNumber(value);
};

/**
 * Returns the extended semantic suffix derived from `normalization` metadata.
 * Called only when `labelFormat.extended` is `true`.
 */
export const getExtendedSuffix = (
  normalization: NormalizationSpec | undefined
): string => {
  if (!normalization) return '';
  if (normalization.type === 'raw') {
    return normalization.numeratorLabel
      ? ` ${normalization.numeratorLabel}`
      : '';
  }
  const denominator = normalization.denominatorLabel ?? '';
  if (normalization.type === 'ratio') {
    return ` ${normalization.numeratorLabel}/${denominator}`;
  }
  if (normalization.type === 'percentage') {
    return ` ${normalization.numeratorLabel}/${denominator}`;
  }
  if (normalization.type === 'rate') {
    const base = normalization.rateBase.toLocaleString();
    return ` ${normalization.numeratorLabel}/${base} ${denominator}`;
  }
  return '';
};

export interface BinCtx {
  lower: number | null;
  upper: number | null;
  isFirst: boolean;
  isLast: boolean;
  withSuffix: (s: string) => string;
}

export const formatRangeLabel = (
  ctx: BinCtx,
  spec: Extract<LabelFormatSpec, { type: 'range' }> | undefined,
  formatValue: (v: number) => string
): string => {
  const separator = spec?.separator ?? ' - ';
  const unit = spec?.unit ?? '';
  const fmt = (v: number) => {
    return `${formatValue(v)}${unit}`;
  };
  const { lower, upper, isFirst, isLast, withSuffix } = ctx;
  if (isFirst) return withSuffix(`< ${fmt(upper!)}`);
  if (isLast) return withSuffix(`> ${fmt(lower!)}`);
  return withSuffix(`${fmt(lower!)}${separator}${fmt(upper!)}`);
};

export const formatCountLabel = (
  ctx: BinCtx,
  spec: Extract<LabelFormatSpec, { type: 'count' }>
): string => {
  const fmt = spec.abbreviate
    ? abbreviateNumber
    : (v: number) => {
        return v.toLocaleString('en-US');
      };
  const { lower, upper, isFirst, isLast, withSuffix } = ctx;
  if (isFirst) return withSuffix(`< ${fmt(upper!)}`);
  if (isLast) return withSuffix(`> ${fmt(lower!)}`);
  return withSuffix(`${fmt(lower!)} ≤ ${fmt(upper!)}`);
};

/**
 * Formats a percentage label for a single legend bin.
 *
 * IMPORTANT: The `lower === null` / `upper === null` guards on the first and
 * last branches are intentional and must not be simplified to a bare
 * `isFirst` / `isLast` check. This function is the only formatter that
 * explicitly verifies the null boundary before using the non-null assertion
 * on the opposite bound. Removing the null check would cause mid-range labels
 * to be rendered when the first/last bin has non-null bounds, diverging from
 * the `< N` / `> M` format that consumers expect.
 */
export const formatPercentageLabel = (
  ctx: BinCtx,
  spec: Extract<LabelFormatSpec, { type: 'percentage' }>
): string => {
  const decimals = spec.decimals ?? 0;
  const denominator = spec.denominator ?? 1;
  const fmt = (v: number) => {
    return `${((v / denominator) * 100).toFixed(decimals)}%`;
  };
  const { lower, upper, isFirst, isLast, withSuffix } = ctx;
  if (isFirst && lower === null) return withSuffix(`< ${fmt(upper!)}`);
  if (isLast && upper === null) return withSuffix(`> ${fmt(lower!)}`);
  return withSuffix(`${fmt(lower!)} \u2013 ${fmt(upper!)}`);
};

export const formatStdDevLabel = (
  ctx: BinCtx,
  spec: Extract<LabelFormatSpec, { type: 'stdDev' }>,
  formatValue: (v: number) => string
): string => {
  const u = spec.unit ?? '\u03c3';
  const fmt = (v: number) => {
    return `${formatValue(v)}${u}`;
  };
  const { lower, upper, isFirst, isLast, withSuffix } = ctx;
  if (isFirst) return withSuffix(`< ${fmt(upper!)}`);
  if (isLast) return withSuffix(`> ${fmt(lower!)}`);
  return withSuffix(`${fmt(lower!)} \u2013 ${fmt(upper!)}`);
};

/**
 * Returns the explicit label at `index` when available. Falls back to the
 * default range-style formatter for bins beyond the `labels` array length.
 *
 * This allows partial overrides: the consumer can supply labels only for the
 * first N bins while leaving the rest computed automatically.
 */
export const formatLabelsLabel = (
  ctx: BinCtx,
  spec: Extract<LabelFormatSpec, { type: 'labels' }>,
  formatValue: (v: number) => string,
  index: number
): string => {
  const explicit = spec.labels[index];
  if (explicit !== undefined) return ctx.withSuffix(explicit);
  return formatRangeLabel(ctx, undefined, formatValue);
};

type DispatchFn = (
  ctx: BinCtx,
  spec: LabelFormatSpec,
  fv: (v: number) => string,
  idx: number
) => string;

const FORMAT_DISPATCH: Partial<Record<string, DispatchFn>> = {
  count: (ctx, spec) => {
    return formatCountLabel(
      ctx,
      spec as Extract<LabelFormatSpec, { type: 'count' }>
    );
  },
  percentage: (ctx, spec) => {
    return formatPercentageLabel(
      ctx,
      spec as Extract<LabelFormatSpec, { type: 'percentage' }>
    );
  },
  stdDev: (ctx, spec, fv) => {
    return formatStdDevLabel(
      ctx,
      spec as Extract<LabelFormatSpec, { type: 'stdDev' }>,
      fv
    );
  },
  custom: (ctx, spec, _fv, idx) => {
    return ctx.withSuffix(
      (spec as Extract<LabelFormatSpec, { type: 'custom' }>).formatter(
        ctx.lower,
        ctx.upper,
        idx
      )
    );
  },
  labels: (ctx, spec, fv, idx) => {
    return formatLabelsLabel(
      ctx,
      spec as Extract<LabelFormatSpec, { type: 'labels' }>,
      fv,
      idx
    );
  },
};

/**
 * Formats a single legend bin label from its lower/upper bounds using the
 * provided `LabelFormatSpec`. Falls back to range-style output when the
 * spec is omitted.
 */
export const formatLabel = (opts: {
  lower: number | null;
  upper: number | null;
  index: number;
  total: number;
  spec: LabelFormatSpec | undefined;
  normalization: NormalizationSpec | undefined;
  formatValue: (v: number) => string;
}): string => {
  const { lower, upper, index, total, spec, normalization, formatValue } = opts;
  const isFirst = index === 0;
  const isLast = index === total - 1;
  const suffix = spec?.extended ? getExtendedSuffix(normalization) : '';
  const withSuffix = (label: string) => {
    return `${label}${suffix}`;
  };
  const ctx: BinCtx = { lower, upper, isFirst, isLast, withSuffix };
  if (!spec || spec.type === 'range') {
    return formatRangeLabel(ctx, spec, formatValue);
  }
  const handler = FORMAT_DISPATCH[spec.type];
  if (handler) return handler(ctx, spec, formatValue, index);
  return withSuffix(`${lower ?? '\u221e'} \u2013 ${upper ?? '\u221e'}`);
};
