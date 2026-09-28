import type { TrendIndicator } from '../DashboardCard';

/**
 * Formats a value already expressed in percent units (`12.5` → `12.5%`) in
 * `locale`, so the decimal separator and sign follow the reader's language.
 */
export const formatPercent = ({
  value,
  fractionDigits,
  locale,
  signed = false,
}: {
  value: number;
  fractionDigits: number;
  locale?: string;
  signed?: boolean;
}): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    signDisplay: signed ? 'exceptZero' : 'auto',
  }).format(value / 100);
};

export const formatByType = ({
  value,
  type,
  numberDecimalPlaces,
  currency,
  locale,
}: {
  value: number;
  type: 'number' | 'percentage' | 'currency';
  numberDecimalPlaces?: number;
  currency: string;
  locale?: string;
}): string => {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
      }).format(value);
    case 'percentage':
      return formatPercent({
        value,
        fractionDigits: numberDecimalPlaces ?? 2,
        locale,
      });
    case 'number':
    default:
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: numberDecimalPlaces ?? 2,
        maximumFractionDigits: numberDecimalPlaces ?? 2,
      }).format(value);
  }
};

export const formatNumber = ({
  value,
  type,
  numberDecimalPlaces,
  suffix,
  currency,
  locale,
}: {
  value: number | undefined;
  type: 'number' | 'percentage' | 'currency';
  numberDecimalPlaces?: number;
  suffix?: string;
  currency?: string;
  locale?: string;
}): string => {
  if (value === undefined || value === null) {
    return '-';
  }
  let formatted = formatByType({
    value,
    type,
    numberDecimalPlaces,
    currency: currency ?? 'USD',
    locale,
  });
  if (suffix) {
    formatted += ` ${suffix}`;
  }
  return formatted;
};

export const getTrendColors = (
  trend?: TrendIndicator
): { color: string; backgroundColor: string } => {
  if (trend?.status === 'positive') {
    return {
      color: 'feedback.text.positive.default',
      backgroundColor: 'feedback.background.positive.default',
    };
  }
  if (trend?.status === 'negative') {
    return {
      color: 'feedback.text.negative.default',
      backgroundColor: 'feedback.background.negative.default',
    };
  }
  return {
    color: 'input.text.muted.default',
    backgroundColor: 'display.border.muted.default',
  };
};
