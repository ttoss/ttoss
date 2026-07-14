import { useI18n } from '@ttoss/react-i18n';
import { Box, Flex, Text } from '@ttoss/ui';
import { defineMessages } from 'react-intl';

import type { DashboardCard, TrendIndicator } from '../DashboardCard';
import { formatNumber, getTrendColors } from './cardUtils';
import { CardWrapper } from './Wrapper';

const messages = defineMessages({
  vsPrevious: {
    defaultMessage: 'vs. previous',
    description: 'Trend badge label comparing current value to previous period',
  },
});

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

const getTrendStrokeToken = (status?: TrendIndicator['status']): string => {
  if (status === 'positive') return 'feedback.text.positive.default';
  if (status === 'negative') return 'feedback.text.negative.default';
  return 'input.text.muted.default';
};

type SparklineProps = {
  data: number[];
  previousData?: number[];
  trendStatus?: TrendIndicator['status'];
  title: string;
};

/**
 * Reusable SVG sparkline primitive. Exported so consumers can compose it
 * independently of BigNumberSparkline.
 */
export const Sparkline = ({
  data,
  previousData,
  trendStatus,
  title,
}: SparklineProps) => {
  if (data.length < 2) return null;

  const currentPath = buildSparklinePath(data, SPARKLINE_W, SPARKLINE_H);
  const previousPath = previousData
    ? buildSparklinePath(previousData, SPARKLINE_W, SPARKLINE_H)
    : null;

  const strokeToken = getTrendStrokeToken(trendStatus);

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <svg
        viewBox={`0 0 ${SPARKLINE_W} ${SPARKLINE_H}`}
        width="100%"
        height={SPARKLINE_H}
        preserveAspectRatio="xMidYMid meet"
        aria-label={title}
        role="img"
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
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: `var(--theme-color-${strokeToken.replace(/\./g, '-')}, currentColor)`,
          }}
        />
      </svg>
    </Box>
  );
};

type TrendBadgeProps = {
  trend: TrendIndicator;
  vsPreviousLabel: string;
};

const TrendBadge = ({ trend, vsPreviousLabel }: TrendBadgeProps) => {
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
        {vsPreviousLabel}
      </Text>
    </Flex>
  );
};

/**
 * Displays a key metric as a large number with a sparkline trend chart below.
 *
 * Pass `data.value` for the aggregated total, `data.series` for the current-period
 * time-series, and `data.previousSeries` for the optional comparison overlay.
 * Use `type: 'bigNumberSparkline'` to render this card via `DashboardCard`.
 */
// eslint-disable-next-line complexity
export const BigNumberSparkline = (props: DashboardCard) => {
  const { intl } = useI18n();
  const total = props.data.value;
  const daily = props.data.series;
  const dailyPrevious = props.data.previousSeries;
  const variant = props.variant ?? 'default';
  const locale = props.locale ?? intl.locale;

  const formattedValue = formatNumber({
    value: total,
    type: props.numberType,
    numberDecimalPlaces: props.numberDecimalPlaces,
    suffix: props.suffix,
    currency: props.currency,
    locale,
  });

  const vsPreviousLabel = intl.formatMessage(messages.vsPrevious);

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
          <TrendBadge trend={props.trend} vsPreviousLabel={vsPreviousLabel} />
        )}

        {daily && daily.length >= 2 && (
          <Sparkline
            data={daily}
            previousData={dailyPrevious ?? undefined}
            trendStatus={props.trend?.status}
            title={props.title}
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
