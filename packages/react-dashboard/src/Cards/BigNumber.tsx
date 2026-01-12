import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Text } from '@ttoss/ui';

import type {
  CardVariant,
  DashboardCard,
  TrendIndicator,
} from '../DashboardCard';
import { CardWrapper } from './Wrapper';

const formatNumber = (
  value: number | undefined,
  type: 'number' | 'percentage' | 'currency',
  numberDecimalPlaces?: number
): string => {
  if (value === undefined || value === null) {
    return '-';
  }

  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value);
    case 'percentage':
      return `${value.toFixed(2)}%`;
    case 'number':
    default: {
      const formatted = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: numberDecimalPlaces ?? 2,
        maximumFractionDigits: numberDecimalPlaces ?? 2,
      }).format(value);
      return formatted;
    }
  }
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
    return 'display.text.primary.default';
  }
  if (['green', 'accent', 'positive'].includes(color.toLowerCase())) {
    return 'display.text.accent.default';
  }
  return 'display.text.primary.default';
};

const getTrendColor = (trend?: TrendIndicator): string => {
  const colors = {
    positive: 'feedback.text.positive.default',
    negative: 'feedback.text.negative.default',
    neutral: 'display.text.primary.default',
  };
  if (!trend) {
    return colors.neutral;
  }
  const isGoodTrend =
    (trend.type === 'higher' && trend.status === 'positive') ||
    (trend.type === 'lower' && trend.status === 'negative');

  if (isGoodTrend) {
    return colors.positive;
  }

  const isBadTrend =
    (trend.type === 'higher' && trend.status === 'negative') ||
    (trend.type === 'lower' && trend.status === 'positive');
  if (isBadTrend) {
    return colors.negative;
  }
  return colors.neutral;
};

export const BigNumber = (props: DashboardCard) => {
  const total = props.data.meta?.total ?? props.data.api?.total ?? undefined;
  const formattedValue = formatNumber(
    total,
    props.numberType,
    props.numberDecimalPlaces
  );

  const valueColor = getValueColor(props.color, props.variant);
  const variant = props.variant || 'default';

  return (
    <CardWrapper
      title={props.title}
      description={props.description || ''}
      variant={variant}
    >
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '2',
        }}
      >
        <Text
          sx={{
            color: valueColor,
            fontSize: '2xl',
            fontWeight: 'bold',
            lineHeight: '1.2',
          }}
        >
          {formattedValue}
        </Text>

        {props.trend && (
          <Flex
            sx={{
              alignItems: 'center',
              gap: '1',
            }}
          >
            <Box
              sx={{
                color: getTrendColor(props.trend),
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {props.trend.status === 'positive' ? (
                <Icon icon="mdi:arrow-up" width={16} />
              ) : props.trend.status === 'negative' ? (
                <Icon icon="mdi:arrow-down" width={16} />
              ) : null}
            </Box>
            <Text
              sx={{
                color: getTrendColor(props.trend),
                fontSize: 'sm',
                fontWeight: 'medium',
              }}
            >
              {props.trend.value.toFixed(1)}%{' '}
              {props.trend ? 'vs. período anterior' : ''}
            </Text>
          </Flex>
        )}

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
          <Flex
            sx={{
              alignItems: 'center',
              gap: '1',
              mt: props.trend || props.additionalInfo ? '2' : '1',
            }}
          >
            {props.status.icon && (
              <Box
                sx={{
                  color: 'feedback.text.positive.default',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Icon icon={props.status.icon} width={16} />
              </Box>
            )}
            <Text
              sx={{
                color: 'feedback.text.positive.default',
                fontSize: 'sm',
                fontWeight: 'medium',
              }}
            >
              {props.status.text}
            </Text>
          </Flex>
        )}
      </Flex>
    </CardWrapper>
  );
};
