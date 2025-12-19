import { Icon, type IconType } from '@ttoss/react-icons';
import { Box, Card, Flex, Text, TooltipIcon } from '@ttoss/ui';

import type {
  DateMetric,
  NumberMetric,
  PercentageMetric,
} from './SubscriptionCard.types';

/**
 * Union type for all metric types.
 */
type Metric = DateMetric | PercentageMetric | NumberMetric;

/**
 * Props for the unified MetricCard component.
 */
export interface MetricCardProps {
  /**
   * The metric configuration to display.
   */
  metric: Metric;
  /**
   * Whether the card is in loading state.
   */
  isLoading?: boolean;
}

/**
 * Skeleton component for loading state.
 */
const MetricCardSkeleton = () => {
  return (
    <Card
      sx={{
        backgroundColor: 'display.background.muted.default',
        padding: '6',
        minWidth: ['100%', '100%', '400px'],
      }}
    >
      <Flex sx={{ gap: '4' }}>
        <Box
          sx={{
            flexShrink: 0,
            borderRadius: 'full',
            backgroundColor: 'display.background.secondary.default',
            width: '48px',
            height: '48px',
          }}
        />
        <Flex sx={{ flex: 1, flexDirection: 'column', gap: '3' }}>
          <Box
            sx={{
              height: '16px',
              width: '128px',
              backgroundColor: 'display.background.secondary.default',
              borderRadius: 'md',
            }}
          />
          <Box
            sx={{
              height: '32px',
              width: '160px',
              backgroundColor: 'display.background.secondary.default',
              borderRadius: 'md',
            }}
          />
        </Flex>
      </Flex>
    </Card>
  );
};

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
  tooltip?: string;
  isClickable: boolean;
}) => {
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
      {tooltip && (
        <TooltipIcon
          icon="fluent:info-24-regular"
          tooltip={{ children: tooltip }}
          variant="info"
        />
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
      {/* Date value */}
      <Text
        sx={{
          fontSize: '2xl',
          fontWeight: 'bold',
          color: 'display.text.primary.default',
        }}
      >
        {metric.date}
      </Text>

      {/* Remaining days message */}
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
    metric.showAlertThreshold &&
    percentage >= metric.showAlertThreshold;

  return (
    <>
      {/* Value display */}
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
          de {metric.max !== null ? formatValue(metric.max) : '∞'}
        </Text>
      </Flex>

      {/* Progress bar */}
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

      {/* Footer with percentage and alert */}
      <Flex
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 'xs',
        }}
      >
        <Text sx={{ color: 'display.text.secondary.default' }}>
          {percentage !== null ? `${percentage}% utilizado` : 'Ilimitado'}
        </Text>
        {showAlert && (percentage === null || percentage !== 100) && (
          <Flex
            sx={{
              alignItems: 'center',
              gap: '1',
              color: 'feedback.text.caution.default',
            }}
          >
            <Icon icon="fluent:warning-24-regular" />
            <Text sx={{ fontWeight: 'medium' }}>Próximo do limite</Text>
          </Flex>
        )}
        {showAlert && percentage !== null && percentage >= 100 && (
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
              Atingiu o limite
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
  const formatValue =
    metric.formatValue ||
    ((val: number) => {
      return val.toString();
    });

  return (
    <>
      {/* Value display */}
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
          de {metric.max !== null ? formatValue(metric.max) : '∞'}
        </Text>
      </Flex>

      {/* Footer text */}
      {metric.footerText && (
        <Text
          sx={{
            fontSize: 'xs',
            color: 'display.text.secondary.default',
            lineHeight: 'relaxed',
          }}
        >
          {metric.footerText}
        </Text>
      )}
    </>
  );
};

/**
 * Unified MetricCard component that displays different types of metrics.
 *
 * This component provides a consistent card layout for displaying various metric types
 * including dates, percentages, and numbers. It automatically adapts its content based
 * on the metric type while maintaining a unified visual design.
 *
 * @example
 * ```tsx
 * // Date metric
 * <MetricCard
 *   metric={{
 *     type: 'date',
 *     label: 'Expiration Date',
 *     date: '31/12/2025',
 *     icon: 'fluent:calendar-24-regular',
 *     remainingDaysMessage: '10 days remaining',
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Percentage metric with progress bar
 * <MetricCard
 *   metric={{
 *     type: 'percentage',
 *     label: 'Plan Usage',
 *     current: 350,
 *     max: 1000,
 *     icon: 'fluent:gauge-24-regular',
 *     showAlertThreshold: 80,
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Number metric
 * <MetricCard
 *   metric={{
 *     type: 'number',
 *     label: 'Active Projects',
 *     current: 3,
 *     max: 5,
 *     icon: 'fluent:people-24-regular',
 *     footerText: 'Add more projects to your plan',
 *   }}
 * />
 * ```
 */
export const MetricCard = ({ metric, isLoading = false }: MetricCardProps) => {
  if (isLoading) {
    return <MetricCardSkeleton />;
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
