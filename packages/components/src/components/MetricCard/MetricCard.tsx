import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Icon, type IconType } from '@ttoss/react-icons';
import { Box, Card, Flex, Text, TooltipIcon } from '@ttoss/ui';

import type {
  DateMetric,
  Metric,
  MetricCardProps,
  NumberMetric,
  PercentageMetric,
} from './MetricCard.types';

const messages = defineMessages({
  ofMax: {
    defaultMessage: 'of {max}',
    description: 'Text shown before the max value, e.g. "of 10" or "of ∞".',
  },
  percentageUsed: {
    defaultMessage: '{percentage}% used',
    description: 'Footer shown for percentage metrics, e.g. "80% used".',
  },
  unlimited: {
    defaultMessage: 'Unlimited',
    description: 'Shown when a metric has no maximum limit.',
  },
  infinity: {
    defaultMessage: '∞',
    description: 'Infinity symbol used when the maximum limit is unlimited.',
  },
  nearLimit: {
    defaultMessage: 'Near limit',
    description: 'Alert shown when usage is close to the limit.',
  },
  reachedLimit: {
    defaultMessage: 'Reached limit',
    description: 'Alert shown when usage has reached or exceeded the limit.',
  },
});

/**
 * Icon wrapper for metric cards.
 */
const MetricIconWrapper = ({ icon }: { icon?: IconType }) => {
  return (
    <Flex
      sx={{
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'full',
        border: 'md',
        borderColor: 'display.border.muted.default',
        backgroundColor: 'display.background.muted.default',
        color: 'display.text.secondary.default',
        width: '48px',
        height: '48px',
        flexShrink: 0,
      }}
    >
      {icon && <Icon icon={icon} />}
    </Flex>
  );
};

/**
 * Card header with label, tooltip, and optional clickable icon.
 */
const MetricCardHeader = ({
  label,
  tooltip,
  isClickable,
}: {
  label: string;
  tooltip?: string | (() => void);
  isClickable: boolean;
}) => {
  const isTooltipAction = typeof tooltip === 'function';
  const tooltipText = typeof tooltip === 'string' ? tooltip : undefined;

  return (
    <Flex sx={{ alignItems: 'center', gap: '2' }}>
      <Text
        sx={{
          fontSize: 'sm',
          fontWeight: 'medium',
          color: 'display.text.secondary.default',
        }}
      >
        {label}
      </Text>

      {tooltipText && (
        <TooltipIcon
          icon="fluent:info-24-regular"
          tooltip={{ children: tooltipText }}
          variant="info"
        />
      )}

      {isTooltipAction && (
        <Text
          onClick={(e) => {
            e.stopPropagation();
            tooltip();
          }}
          sx={{
            fontSize: 'sm',
            color: 'display.text.secondary.default',
            cursor: 'pointer',
            ':hover': {
              color: 'action.text.primary.default',
            },
          }}
        >
          <Icon icon="fluent:info-24-regular" inline />
        </Text>
      )}

      {isClickable && (
        <Text
          sx={{
            fontSize: 'sm',
            color: 'display.text.secondary.default',
          }}
        >
          <Icon icon="fluent:open-24-regular" inline />
        </Text>
      )}
    </Flex>
  );
};

/**
 * Renders the content for a date metric.
 */
const DateMetricContent = ({ metric }: { metric: DateMetric }) => {
  return (
    <>
      <Text
        sx={{
          fontSize: '2xl',
          fontWeight: 'bold',
          color: 'display.text.primary.default',
        }}
      >
        {metric.date}
      </Text>

      {metric.remainingDaysMessage && (
        <Flex sx={{ alignItems: 'center', gap: '2' }}>
          <Text
            sx={{
              fontSize: 'sm',
              color: metric.isWarning
                ? 'feedback.text.caution.default'
                : 'display.text.secondary.default',
            }}
          >
            <Icon
              icon={
                metric.isWarning
                  ? 'fluent:warning-24-regular'
                  : 'fluent:clock-24-regular'
              }
              inline
            />
          </Text>
          <Text
            sx={{
              fontSize: 'sm',
              color: metric.isWarning
                ? 'feedback.text.caution.default'
                : 'display.text.secondary.default',
            }}
          >
            {metric.remainingDaysMessage}
          </Text>
        </Flex>
      )}
    </>
  );
};

/**
 * Renders the content for a percentage metric.
 */
const PercentageMetricContent = ({ metric }: { metric: PercentageMetric }) => {
  const { intl } = useI18n();

  const percentage =
    metric.max === null || metric.max <= 0
      ? null
      : Math.min(Math.round((metric.current / metric.max) * 100), 100);

  const formatValue =
    metric.formatValue ||
    ((val: number) => {
      return val.toString();
    });

  const showAlert =
    percentage !== null &&
    metric.showAlertThreshold !== undefined &&
    percentage >= metric.showAlertThreshold;

  const isOverLimit = percentage !== null && percentage >= 100;
  const maxText =
    metric.max !== null
      ? formatValue(metric.max)
      : intl.formatMessage(messages.infinity);

  return (
    <>
      <Flex
        sx={{
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: '2',
        }}
      >
        <Text
          sx={{
            fontSize: '2xl',
            fontWeight: 'bold',
            color: 'display.text.primary.default',
          }}
        >
          {formatValue(metric.current)}
        </Text>
        <Text
          sx={{
            fontSize: 'sm',
            color: 'display.text.secondary.default',
          }}
        >
          {intl.formatMessage(messages.ofMax, { max: maxText })}
        </Text>
      </Flex>

      <Box
        sx={{
          width: 'full',
          height: '8px',
          backgroundColor: 'display.background.secondary.default',
          borderRadius: 'full',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: 'full',
            width: percentage !== null ? `${percentage}%` : '100%',
            backgroundColor: 'action.background.primary.default',
            borderRadius: 'full',
            transition: 'width 0.5s ease-out',
          }}
        />
      </Box>

      <Flex
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'xs',
        }}
      >
        <Text sx={{ color: 'display.text.secondary.default' }}>
          {percentage !== null
            ? intl.formatMessage(messages.percentageUsed, { percentage })
            : intl.formatMessage(messages.unlimited)}
        </Text>

        {showAlert && !isOverLimit && (
          <Flex
            sx={{
              alignItems: 'center',
              gap: '1',
              color: 'feedback.text.caution.default',
            }}
          >
            <Icon icon="fluent:warning-24-regular" />
            <Text sx={{ fontWeight: 'medium' }}>
              {intl.formatMessage(messages.nearLimit)}
            </Text>
          </Flex>
        )}

        {showAlert && isOverLimit && (
          <Flex
            sx={{
              alignItems: 'center',
              gap: '1',
              color: 'feedback.text.negative.default',
            }}
          >
            <Icon icon="fluent:warning-24-regular" />
            <Text
              sx={{
                fontWeight: 'medium',
                color: 'feedback.text.negative.default',
              }}
            >
              {intl.formatMessage(messages.reachedLimit)}
            </Text>
          </Flex>
        )}
      </Flex>
    </>
  );
};

/**
 * Renders the content for a number metric.
 */
const NumberMetricContent = ({ metric }: { metric: NumberMetric }) => {
  const { intl } = useI18n();

  const formatValue =
    metric.formatValue ||
    ((val: number) => {
      return val.toString();
    });

  const maxText =
    metric.max !== null
      ? formatValue(metric.max)
      : intl.formatMessage(messages.infinity);

  return (
    <>
      <Flex sx={{ alignItems: 'baseline', gap: '3' }}>
        <Text
          sx={{
            fontSize: '2xl',
            fontWeight: 'bold',
            color: 'display.text.primary.default',
          }}
        >
          {formatValue(metric.current)}
        </Text>
        <Text
          sx={{
            fontSize: 'sm',
            color: 'display.text.secondary.default',
          }}
        >
          {intl.formatMessage(messages.ofMax, { max: maxText })}
        </Text>
      </Flex>

      {metric.footerText && (
        <Text
          sx={{
            fontSize: 'xs',
            color: 'display.text.secondary.default',
            lineHeight: 'relaxed',
            maxWidth: '300px',
          }}
        >
          {metric.footerText}
        </Text>
      )}
    </>
  );
};

/**
 * MetricCard component displays a metric in a consistent card layout.
 *
 * It supports three metric types:
 * - **date**: displays a date and optional remaining-days message
 * - **percentage**: displays current/max values and a progress bar
 * - **number**: displays current/max values and an optional footer text
 *
 * @example
 * ```tsx
 * <MetricCard
 *   metric={{
 *     type: 'date',
 *     label: 'Renewal date',
 *     date: '31/12/2025',
 *     icon: 'fluent:calendar-24-regular',
 *     remainingDaysMessage: '10 days remaining',
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <MetricCard
 *   metric={{
 *     type: 'percentage',
 *     label: 'Plan usage',
 *     current: 350,
 *     max: 1000,
 *     icon: 'fluent:gauge-24-regular',
 *     showAlertThreshold: 80,
 *   }}
 * />
 * ```
 */
export const MetricCard = ({ metric, isLoading = false }: MetricCardProps) => {
  if (isLoading) {
    return null;
  }

  const isClickable = Boolean(metric.onClick || metric.helpArticleAction);

  return (
    <Card
      onClick={metric.onClick || metric.helpArticleAction}
      sx={{
        backgroundColor: 'display.background.muted.default',
        padding: '6',
        cursor: isClickable ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        minWidth: ['full', 'full', '400px'],
        ':hover': {
          transform: 'scale(1.01)',
        },
      }}
    >
      <Flex sx={{ gap: '4', width: 'full' }}>
        <MetricIconWrapper icon={metric.icon} />

        <Flex sx={{ flex: 1, flexDirection: 'column', gap: '2' }}>
          <MetricCardHeader
            label={metric.label}
            tooltip={metric.tooltip}
            isClickable={isClickable}
          />

          {metric.type === 'date' && <DateMetricContent metric={metric} />}
          {metric.type === 'percentage' && (
            <PercentageMetricContent metric={metric} />
          )}
          {metric.type === 'number' && <NumberMetricContent metric={metric} />}
        </Flex>
      </Flex>
    </Card>
  );
};

export type { Metric };
