import { Box, Flex, Text } from '@ttoss/ui';

import type { DashboardCard, TrendIndicator } from '../DashboardCard';
import { CardWrapper } from './Wrapper';

const formatByType = ({
  value,
  type,
  numberDecimalPlaces,
  currency,
}: {
  value: number;
  type: 'number' | 'percentage' | 'currency';
  numberDecimalPlaces?: number;
  currency: string;
}): string => {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency,
      }).format(value);
    case 'percentage':
      return `${value.toFixed(numberDecimalPlaces ?? 2)}%`;
    case 'number':
    default:
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: numberDecimalPlaces ?? 2,
        maximumFractionDigits: numberDecimalPlaces ?? 2,
      }).format(value);
  }
};

const formatNumber = ({
  value,
  type,
  numberDecimalPlaces,
  suffix,
  currency = 'BRL',
}: {
  value: number | undefined;
  type: 'number' | 'percentage' | 'currency';
  numberDecimalPlaces?: number;
  suffix?: string;
  currency?: string;
}): string => {
  if (value === undefined || value === null) {
    return '-';
  }
  let formatted = formatByType({ value, type, numberDecimalPlaces, currency });
  if (suffix) {
    formatted += ` ${suffix}`;
  }
  return formatted;
};

const getTrendColors = (
  trend?: TrendIndicator
): { color: string; backgroundColor: string } => {
  if (!trend || trend.status === 'neutral' || !trend.status) {
    return {
      color: 'input.text.muted.default',
      backgroundColor: 'display.border.muted.default',
    };
  }
  if (trend.status === 'positive') {
    return {
      color: 'feedback.text.positive.default',
      backgroundColor: 'feedback.background.positive.default',
    };
  }
  return {
    color: 'feedback.text.negative.default',
    backgroundColor: 'feedback.background.negative.default',
  };
};

/**
 * Builds a smooth SVG polyline path from a data array.
 * Normalises values to fit within the given width/height.
 */
const buildSparklinePath = (
  data: number[],
  width: number,
  height: number
): string => {
  if (data.length < 2) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const step = width / (data.length - 1);
  return data
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
};

const SPARKLINE_W = 200;
const SPARKLINE_H = 40;

type SparklineProps = {
  data: number[];
  previousData?: number[];
  trendStatus?: TrendIndicator['status'];
};

const Sparkline = ({ data, previousData, trendStatus }: SparklineProps) => {
  if (data.length < 2) return null;

  const currentPath = buildSparklinePath(data, SPARKLINE_W, SPARKLINE_H);
  const previousPath = previousData
    ? buildSparklinePath(previousData, SPARKLINE_W, SPARKLINE_H)
    : null;

  // Use theme-matching stroke colors via currentColor inheritance
  const currentColor =
    trendStatus === 'negative'
      ? '#ef4444' // red-500 approximate
      : '#22c55e'; // green-500 approximate

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${SPARKLINE_W} ${SPARKLINE_H}`}
        width="100%"
        height={SPARKLINE_H}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {previousPath && (
          <path
            d={previousPath}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity={0.4}
          />
        )}
        <path
          d={currentPath}
          fill="none"
          stroke={currentColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  );
};

type TrendBadgeProps = {
  trend: TrendIndicator;
};

const TrendBadge = ({ trend }: TrendBadgeProps) => {
  const trendColors = getTrendColors(trend);
  return (
    <Flex sx={{ alignItems: 'center', gap: '1' }}>
      <Box
        sx={{
          color: trendColors.color,
          backgroundColor: trendColors.backgroundColor,
          padding: '1',
          fontSize: 'xs',
          fontWeight: 'semibold',
          borderRadius: 'sm',
        }}
      >
        {trend.value > 0 ? '+' : ''}
        {trend.value.toFixed(1)}%
      </Box>
      <Text
        sx={{
          color: 'input.background.muted.disabled',
          fontSize: 'xs',
          fontWeight: 'medium',
        }}
      >
        vs. anterior
      </Text>
    </Flex>
  );
};

/**
 * Displays a key metric as a large number with a sparkline trend chart below.
 * Uses `data.meta.daily` (or `data.api.daily`) as the time-series data for the sparkline.
 * Use `type: 'lineChart'` to render this card.
 */
// eslint-disable-next-line complexity
export const BigNumberSparkline = (props: DashboardCard) => {
  const total = props.data.meta?.total ?? props.data.api?.total;
  const daily = props.data.meta?.daily ?? props.data.api?.daily;
  const dailyPrevious =
    props.data.meta?.dailyPrevious ?? props.data.api?.dailyPrevious;
  const variant = props.variant ?? 'default';

  const formattedValue = formatNumber({
    value: total,
    type: props.numberType,
    numberDecimalPlaces: props.numberDecimalPlaces,
    suffix: props.suffix,
    currency: props.currency,
  });

  return (
    <CardWrapper
      title={props.title}
      description={props.description ?? ''}
      variant={variant}
    >
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <Text
          sx={{
            color:
              variant === 'dark'
                ? 'action.text.primary.default'
                : 'feedback.text.positive.default',
            fontSize: '2xl',
            fontWeight: 'semibold',
            lineHeight: 'shorter',
          }}
        >
          {formattedValue}
        </Text>

        {typeof props.trend?.value === 'number' && (
          <TrendBadge trend={props.trend} />
        )}

        {daily && daily.length >= 2 && (
          <Sparkline
            data={daily}
            previousData={dailyPrevious ?? undefined}
            trendStatus={props.trend?.status}
          />
        )}

        {props.additionalInfo && (
          <Text
            sx={{
              color: 'display.text.secondary.default',
              fontSize: 'sm',
            }}
          >
            {props.additionalInfo}
          </Text>
        )}
      </Flex>
    </CardWrapper>
  );
};
