import type { LabelFormatSpec, NormalizationSpec } from '../spec/types';

/** Abbreviates large numbers: 1500 → "1.5k", 2000000 → "2M". */
export const abbreviateNumber = (v: number): string => {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) {
    return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (abs >= 1_000) {
    return `${(v / 1_000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return String(v);
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
  const denominator =
    normalization.denominatorLabel ?? normalization.denomitorLabel ?? '';
  if (normalization.type === 'ratio') {
    return ` ${normalization.numeratorLabel}/${denominator}`;
  }
  if (normalization.type === 'percentage') {
    return ` ${normalization.numeratorLabel}/${denominator}`;
  }
  if (normalization.type === 'rate') {
    const base = new Intl.NumberFormat('en-US').format(normalization.rateBase);
    return ` ${normalization.numeratorLabel} per ${base} ${denominator}`;
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
  if (isLast) return withSuffix(`>= ${fmt(lower!)}`);
  return withSuffix(`${fmt(lower!)}${separator}${fmt(upper!)}`);
};

export const formatCountLabel = (
  ctx: BinCtx,
  spec: Extract<LabelFormatSpec, { type: 'count' }>
): string => {
  const fmt = spec.abbreviate
    ? abbreviateNumber
    : (v: number) => {
        return v.toLocaleString();
      };
  const { lower, upper, isFirst, isLast, withSuffix } = ctx;
  if (isFirst) return withSuffix(`< ${fmt(upper!)}`);
  if (isLast) return withSuffix(`≥ ${fmt(lower!)}`);
  return withSuffix(`${fmt(lower!)} ≤ ${fmt(upper!)}`);
};

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
  if (isLast && upper === null) return withSuffix(`\u2265 ${fmt(lower!)}`);
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
  if (isFirst) return withSuffix(`< ${fmt(lower ?? upper!)}`);
  if (isLast) return withSuffix(`> ${fmt(upper ?? lower!)}`);
  return withSuffix(`${fmt(lower!)} \u2013 ${fmt(upper!)}`);
};

export const formatAutoLabel = (
  ctx: BinCtx,
  formatValue: (v: number) => string
): string => {
  const { lower, upper, isFirst, isLast, withSuffix } = ctx;
  if (isFirst) return withSuffix(`< ${formatValue(upper!)}`);
  if (isLast) return withSuffix(`\u2265 ${formatValue(lower!)}`);
  return withSuffix(`${formatValue(lower!)} \u2013 ${formatValue(upper!)}`);
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
  auto: (ctx, _spec, fv) => {
    return formatAutoLabel(ctx, fv);
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
