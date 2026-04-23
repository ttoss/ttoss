import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Text } from '@ttoss/ui';

import type {
  CardVariant,
  DashboardCard,
  StatusIndicator,
  TrendIndicator,
} from '../DashboardCard';
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

const getValueColor = (color?: string, variant?: CardVariant): string => {
  // For dark variant, always use white
  if (variant === 'dark') {
    return 'action.text.primary.default';
  }

  // For light-green variant, use green/accent color
  if (variant === 'light-green') {
    return 'feedback.text.positive.default';
  }

  // For default variant
  if (!color) {
    return 'feedback.text.positive.default';
  }
  if (['green', 'accent', 'positive'].includes(color.toLowerCase())) {
    return 'display.text.accent.default';
  }
  return 'display.text.primary.default';
};

const getTrendColor = (
  trend?: TrendIndicator
): { color: string; backgroundColor: string } => {
  const colors = {
    positive: {
      color: 'feedback.text.positive.default',
      backgroundColor: 'feedback.background.positive.default',
    },
    negative: {
      color: 'feedback.text.negative.default',
      backgroundColor: 'feedback.background.negative.default',
    },
    neutral: {
      color: 'input.text.muted.default',
      backgroundColor: 'display.border.muted.default',
    },
  };
  if (!trend) {
    return colors.neutral;
  }
  const isGoodTrend = trend.status === 'positive';

  if (isGoodTrend) {
    return colors.positive;
  }

  const isBadTrend = trend.status === 'negative';
  if (isBadTrend) {
    return colors.negative;
  }
  return colors.neutral;
};

const TrendIcon = ({ trend }: { trend: TrendIndicator }) => {
  let icon = 'mdi:minus';
  if (
    (trend.type === 'higher' && trend.status === 'positive') ||
    (trend.type === 'lower' && trend.status === 'negative')
  ) {
    icon = 'mdi:arrow-up';
  } else if (
    (trend.type === 'higher' && trend.status === 'negative') ||
    (trend.type === 'lower' && trend.status === 'positive')
  ) {
    icon = 'mdi:arrow-down';
  }
  return <Icon icon={icon} width={12} />;
};

const TrendDisplay = ({ trend }: { trend: TrendIndicator }) => {
  const trendColors = getTrendColor(trend);
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
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <TrendIcon trend={trend} />
        {trend.value.toFixed(1)}%{' '}
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

const StatusDisplay = ({
  status,
  hasPrevSection,
}: {
  status: StatusIndicator;
  hasPrevSection: boolean;
}) => {
  return (
    <Flex
      sx={{
        alignItems: 'center',
        gap: '1',
        mt: hasPrevSection ? '2' : '1',
      }}
    >
      {status.icon && (
        <Box
          sx={{
            color: 'feedback.text.positive.default',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Icon icon={status.icon} width={16} />
        </Box>
      )}
      <Text
        sx={{
          color: 'feedback.text.positive.default',
          fontSize: 'sm',
          fontWeight: 'medium',
        }}
      >
        {status.text}
      </Text>
    </Flex>
  );
};

const getBigNumberTotal = (data: DashboardCard['data']): number | undefined => {
  return data.meta?.total ?? data.api?.total;
};

/**
 * Displays a single key metric as a large formatted number with optional trend indicator,
 * additional info text, and status badge.
 */
export const BigNumber = (props: DashboardCard) => {
  const total = getBigNumberTotal(props.data);
  const formattedValue = formatNumber({
    value: total,
    type: props.numberType,
    numberDecimalPlaces: props.numberDecimalPlaces,
    suffix: props.suffix,
    currency: props.currency,
  });

  const valueColor = getValueColor(props.color, props.variant);
  const variant = props.variant || 'default';
  const description = props.description || '';
  const hasTrendValue = typeof props.trend?.value === 'number';
  const hasPrevSection = hasTrendValue || Boolean(props.additionalInfo);

  return (
    <CardWrapper
      title={props.title}
      description={description}
      variant={variant}
    >
      <Flex sx={{ flexDirection: 'column', gap: '2' }}>
        <Text
          sx={{
            color: valueColor,
            fontSize: '2xl',
            fontWeight: 'semibold',
            lineHeight: 'shorter',
          }}
        >
          {formattedValue}
        </Text>

        {hasTrendValue && <TrendDisplay trend={props.trend!} />}

        {props.additionalInfo && (
          <Text
            sx={{
              color: getValueColor(props.color, props.variant),
              fontSize: 'sm',
              mt: '1',
            }}
          >
            {props.additionalInfo}
          </Text>
        )}

        {props.status && (
          <StatusDisplay
            status={props.status}
            hasPrevSection={hasPrevSection}
          />
        )}
      </Flex>
    </CardWrapper>
  );
};
