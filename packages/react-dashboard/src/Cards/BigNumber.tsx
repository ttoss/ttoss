import { useI18n } from '@ttoss/react-i18n';
import { Icon } from '@ttoss/react-icons';
import { Box, Flex, Text } from '@ttoss/ui';
import { defineMessages } from 'react-intl';

import type {
  CardVariant,
  DashboardCard,
  StatusIndicator,
  TrendIndicator,
} from '../DashboardCard';
import { formatNumber, getTrendColors } from './cardUtils';
import { CardWrapper } from './Wrapper';

const messages = defineMessages({
  vsPrevious: {
    defaultMessage: 'vs. previous',
    description: 'Trend badge label comparing current value to previous period',
  },
});

const getValueColor = (color?: string, variant?: CardVariant): string => {
  if (variant === 'dark') {
    return 'action.text.primary.default';
  }
  if (variant === 'light-green') {
    return 'feedback.text.positive.default';
  }
  if (!color) {
    return 'feedback.text.positive.default';
  }
  if (['green', 'accent', 'positive'].includes(color.toLowerCase())) {
    return 'display.text.accent.default';
  }
  return 'display.text.primary.default';
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

const TrendDisplay = ({
  trend,
  vsPreviousLabel,
}: {
  trend: TrendIndicator;
  vsPreviousLabel: string;
}) => {
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
        {vsPreviousLabel}
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

/**
 * Displays a single key metric as a large formatted number with optional trend indicator,
 * additional info text, and status badge.
 */
export const BigNumber = (props: DashboardCard) => {
  const { intl } = useI18n();
  const total = props.data.value;
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

        {hasTrendValue && (
          <TrendDisplay
            trend={props.trend!}
            vsPreviousLabel={vsPreviousLabel}
          />
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
          <StatusDisplay
            status={props.status}
            hasPrevSection={hasPrevSection}
          />
        )}
      </Flex>
    </CardWrapper>
  );
};
