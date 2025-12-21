import { MetricCard } from '@ttoss/components/MetricCard';
import { Card, Flex, Spinner } from '@ttoss/ui';

import { getSubscriptionCardAccentBarSx } from './SubscriptionCard.styles';
import type {
  MetricType,
  SubscriptionCardProps,
} from './SubscriptionCard.types';
import { SubscriptionCardActionsSlot } from './SubscriptionCardActionsSlot';
import { SubscriptionCardHeaderSlot } from './SubscriptionCardHeaderSlot';

/**
 * Renders a metric card based on its type.
 */
const renderMetricCard = (params: {
  metric: MetricType;
  index: number;
  isLoading: boolean;
}) => {
  const { metric, index, isLoading } = params;
  return <MetricCard key={index} metric={metric} isLoading={isLoading} />;
};

/**
 * SubscriptionCard displays comprehensive subscription information including
 * plan details, status, actions, and various metrics.
 *
 * It supports three types of metrics:
 * - **Date**: For displaying dates like expiration or renewal
 * - **Percentage**: For usage-based metrics with progress bars
 * - **Number**: For count-based metrics
 *
 * @example
 * ```tsx
 * <SubscriptionCard
 *   planName="Premium Plan"
 *   price={{ value: "R$ 99,00", interval: "mês" }}
 *   status={{ status: "active", interval: "Mensal" }}
 *   features={[{ label: "Feature 1" }, { label: "Feature 2" }]}
 *   actions={[
 *     { label: "Upgrade", onClick: () => {}, variant: "accent" },
 *     { label: "Cancel", onClick: () => {}, variant: "danger" },
 *   ]}
 *   metrics={[
 *     { type: "date", label: "Expira em", date: "15/01/2025", icon: "fluent:calendar-24-regular" },
 *     { type: "percentage", label: "Uso", current: 75, max: 100, icon: "fluent:data-usage-24-regular" },
 *   ]}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Compact mode for smaller spaces
 * <SubscriptionCard
 *   planName="Basic Plan"
 *   price={{ value: "R$ 29,00", interval: "mês" }}
 *   status={{ status: "active" }}
 *   compact
 * />
 * ```
 */
export const SubscriptionCard = ({
  variant = 'accent',
  icon,
  planName,
  price,
  status,
  features = [],
  actions = [],
  metrics = [],
  isLoading = false,
}: SubscriptionCardProps) => {
  if (isLoading) {
    /**
     * use skeleton loader in the future here
     */
    return (
      <Card
        sx={{
          width: 'full',
          height: '400px',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spinner />
      </Card>
    );
  }

  return (
    <Card sx={{ width: 'full' }}>
      {/* Top accent bar */}
      <Flex sx={getSubscriptionCardAccentBarSx(variant)} />

      <Flex
        sx={{
          width: 'full',
          paddingX: '6',
          paddingY: '6',
          flexDirection: 'column',
        }}
      >
        {/* Header Section */}
        <Flex
          sx={{
            paddingY: '10',
            paddingX: '3',
            width: 'full',
            flexDirection: ['column', 'column', 'row'],
            alignItems: ['stretch', 'stretch', 'center'],
            justifyContent: 'space-between',
            gap: '6',
            borderBottom: 'sm',
            borderBottomColor: 'display.border.muted.default',
          }}
        >
          <SubscriptionCardHeaderSlot
            icon={icon}
            planName={planName}
            price={price}
            status={status}
            features={features}
            variant={variant}
          />

          {actions.length > 0 && (
            <SubscriptionCardActionsSlot actions={actions} />
          )}
        </Flex>

        {/* Metrics Section */}
        {metrics.length > 0 && (
          <>
            <Flex
              sx={{
                paddingY: '10',
                paddingX: '3',
                width: 'full',
                flexWrap: 'wrap',
                gap: '10',
                justifyContent: 'center',
              }}
            >
              {metrics.map((metric, index) => {
                return renderMetricCard({ metric, index, isLoading });
              })}
            </Flex>
          </>
        )}
      </Flex>
    </Card>
  );
};
