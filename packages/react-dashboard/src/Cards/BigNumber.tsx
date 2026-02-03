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
      return `${value.toFixed(numberDecimalPlaces ?? 2)}%`;
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
      color: '#15803d',
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
            fontSize: '1.65rem',
            fontWeight: 'bold',
            lineHeight: '1.2',
          }}
        >
          {formattedValue}
        </Text>

        {typeof props.trend?.value === 'number' && (
          <Flex
            sx={{
              alignItems: 'center',
              gap: '1',
            }}
          >
            <Box
              sx={{
                color: getTrendColor(props.trend).color,
                backgroundColor: getTrendColor(props.trend).backgroundColor,
                padding: '1',
                fontSize: 'xs',
                fontWeight: 'bold',
                borderRadius: 'sm',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <TrendIcon trend={props.trend} />
              {props.trend.value.toFixed(1)}%{' '}
            </Box>
            <Text
              sx={{
                color: 'input.background.muted.disabled',
                fontSize: 'xs',
                fontWeight: 'medium',
              }}
            >
              {props.trend ? 'vs. anterior' : ''}
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
