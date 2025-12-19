import { Box, Card, Flex, Grid } from '@ttoss/ui';

import type {
  MetricType,
  SubscriptionCardProps,
} from './SubscriptionCard.types';
import { SubscriptionCardActionsSlot } from './SubscriptionCardActionsSlot';
import { SubscriptionCardHeaderSlot } from './SubscriptionCardHeaderSlot';
import { MetricCard } from './SubscriptionCardMetricCards';

/**
 * Skeleton component for the entire card in loading state.
 */
const SubscriptionCardSkeleton = ({
  compact = false,
}: {
  compact?: boolean;
}) => {
  return (
    <Card
      sx={{
        width: 'full',
        overflow: 'hidden',
      }}
    >
      {/* Top accent bar skeleton */}
      <Box
        sx={{
          height: '4px',
          width: 'full',
          backgroundColor: 'display.background.secondary.default',
        }}
      />

      {/* Header skeleton */}
      <Box sx={{ padding: compact ? '4' : '6' }}>
        <Flex sx={{ gap: compact ? '4' : '6', alignItems: 'flex-start' }}>
          {/* Icon skeleton */}
          <Box
            sx={{
              flexShrink: 0,
              borderRadius: 'full',
              backgroundColor: 'display.background.secondary.default',
              width: compact ? '48px' : '56px',
              height: compact ? '48px' : '56px',
            }}
          />

          {/* Content skeleton */}
          <Flex sx={{ flex: 1, flexDirection: 'column', gap: '3' }}>
            {/* Badges skeleton */}
            <Flex sx={{ gap: '2' }}>
              <Box
                sx={{
                  height: '24px',
                  width: '64px',
                  backgroundColor: 'display.background.secondary.default',
                  borderRadius: 'full',
                }}
              />
              <Box
                sx={{
                  height: '24px',
                  width: '64px',
                  backgroundColor: 'display.background.secondary.default',
                  borderRadius: 'full',
                }}
              />
            </Flex>

            {/* Title skeleton */}
            <Box
              sx={{
                height: compact ? '28px' : '32px',
                width: '256px',
                backgroundColor: 'display.background.secondary.default',
                borderRadius: 'md',
              }}
            />

            {/* Features skeleton */}
            <Flex sx={{ gap: '2' }}>
              <Box
                sx={{
                  height: '20px',
                  width: '96px',
                  backgroundColor: 'display.background.secondary.default',
                  borderRadius: 'full',
                }}
              />
              <Box
                sx={{
                  height: '20px',
                  width: '96px',
                  backgroundColor: 'display.background.secondary.default',
                  borderRadius: 'full',
                }}
              />
            </Flex>
          </Flex>

          {/* Actions skeleton */}
          <Flex sx={{ gap: '3' }}>
            <Box
              sx={{
                height: '40px',
                width: '128px',
                backgroundColor: 'display.background.secondary.default',
                borderRadius: 'md',
              }}
            />
            <Box
              sx={{
                height: '40px',
                width: '128px',
                backgroundColor: 'display.background.secondary.default',
                borderRadius: 'md',
              }}
            />
          </Flex>
        </Flex>
      </Box>

      {/* Metrics skeleton */}
      <Box
        sx={{
          paddingX: compact ? '4' : '6',
          paddingBottom: compact ? '4' : '6',
        }}
      >
        <Grid
          sx={{
            gap: '4',
            gridTemplateColumns: compact
              ? ['1fr', '1fr 1fr', '1fr 1fr 1fr']
              : ['1fr', '1fr 1fr', '1fr 1fr 1fr 1fr'],
          }}
        >
          {[1, 2, 3, 4].map((i) => {
            return (
              <Card
                key={i}
                sx={{
                  backgroundColor: 'display.background.muted.default',
                  padding: compact ? '4' : '6',
                }}
              >
                <Flex sx={{ gap: '4' }}>
                  <Box
                    sx={{
                      flexShrink: 0,
                      borderRadius: 'full',
                      backgroundColor: 'display.background.secondary.default',
                      width: compact ? '40px' : '48px',
                      height: compact ? '40px' : '48px',
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
                        height: compact ? '24px' : '32px',
                        width: '160px',
                        backgroundColor: 'display.background.secondary.default',
                        borderRadius: 'md',
                      }}
                    />
                  </Flex>
                </Flex>
              </Card>
            );
          })}
        </Grid>
      </Box>
    </Card>
  );
};

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
    return <SubscriptionCardSkeleton />;
  }

  return (
    <Card sx={{ width: 'full' }}>
      {/* Top accent bar */}
      <Flex
        sx={{
          height: '12px',
          width: 'full',
          backgroundColor: 'input.background.accent.default',
          borderTopLeftRadius: 'lg',
          borderTopRightRadius: 'lg',
        }}
      />

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
