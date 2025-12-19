import { Icon } from '@ttoss/react-icons';
import { Badge, Flex, Heading, Stack, Text } from '@ttoss/ui';

import {
  getSubscriptionCardHeaderIconSx,
  type SubscriptionCardVariant,
} from './SubscriptionCard.styles';
import type {
  SubscriptionCardFeatureTag,
  SubscriptionCardPrice,
  SubscriptionCardStatusBadgeProps,
  SubscriptionStatus,
} from './SubscriptionCard.types';

/**
 * Props for the SubscriptionCardStatusBadge component.
 */
export interface StatusBadgeProps {
  /**
   * The subscription status.
   */
  status: SubscriptionStatus;
}

/**
 * Renders a status badge for the subscription.
 */
export const SubscriptionCardStatusBadge = ({ status }: StatusBadgeProps) => {
  const config: Record<
    SubscriptionStatus,
    { icon: string; label: string; variant: string }
  > = {
    active: {
      icon: 'fluent:checkmark-circle-24-filled',
      label: 'Ativo',
      variant: 'positive',
    },
    inactive: {
      icon: 'fluent:dismiss-circle-24-filled',
      label: 'Inativo',
      variant: 'muted',
    },
    cancelled: {
      icon: 'fluent:error-circle-24-filled',
      label: 'Cancelado',
      variant: 'negative',
    },
  };

  const { icon, label, variant } = config[status];

  return (
    <Badge
      icon={icon}
      variant={variant as 'positive' | 'muted' | 'negative'}
      sx={{ borderRadius: 'full' }}
    >
      {label}
    </Badge>
  );
};

/**
 * Props for the SubscriptionCardHeaderSlot component.
 */
export interface SubscriptionCardHeaderSlotProps {
  /**
   * Visual variant for the icon wrapper.
   * @default 'spotlight'
   */
  variant?: SubscriptionCardVariant;
  /**
   * Plan icon to display.
   */
  icon?: string;
  /**
   * Name of the subscription plan.
   */
  planName: string;
  /**
   * Price configuration.
   */
  price: SubscriptionCardPrice;
  /**
   * Status badge configuration.
   */
  status: SubscriptionCardStatusBadgeProps;
  /**
   * Feature tags to display.
   */
  features?: SubscriptionCardFeatureTag[];
}

/**
 * Header slot containing plan info, status badges, and features.
 */
export const SubscriptionCardHeaderSlot = ({
  variant = 'spotlight-primary',
  icon,
  planName,
  price,
  status,
  features = [],
}: SubscriptionCardHeaderSlotProps) => {
  const scheduledUpdateLabel = 'Alteração Agendada';
  const cancellationLabel = 'Renovação Cancelada';
  const priceIntervalSuffix = price.interval ? '/' + price.interval : null;

  return (
    <Stack
      sx={{
        paddingY: '6',
        paddingX: '6',
        width: 'full',
      }}
    >
      <Flex
        sx={{
          gap: '6',
          alignItems: 'flex-start',
          flexDirection: ['column', 'row'],
        }}
      >
        {/* Icon */}
        {icon && (
          <Flex sx={getSubscriptionCardHeaderIconSx(variant)}>
            <Icon icon={icon as string} width={24} height={24} />
          </Flex>
        )}

        {/* Plan Details */}
        <Flex
          sx={{
            flexDirection: 'column',
            gap: '6',
          }}
        >
          {/* Status Badges */}
          <Flex sx={{ flexWrap: 'wrap', gap: '2', alignItems: 'center' }}>
            <SubscriptionCardStatusBadge status={status.status} />

            {status.interval && (
              <Badge variant="informative" sx={{ borderRadius: 'full' }}>
                {status.interval}
              </Badge>
            )}

            {status.hasScheduledUpdate && (
              <Badge
                icon="fluent:clock-24-regular"
                variant="informative"
                sx={{ borderRadius: 'full' }}
              >
                {scheduledUpdateLabel}
              </Badge>
            )}

            {status.hasCancellation && (
              <Badge
                icon="fluent:dismiss-circle-24-regular"
                variant="negative"
                sx={{ borderRadius: 'full' }}
              >
                {cancellationLabel}
              </Badge>
            )}
          </Flex>

          {/* Plan Name and Price */}
          <Flex
            sx={{
              flexDirection: ['column', 'row'],
              alignItems: ['flex-start', 'baseline'],
              gap: ['1', '3'],
            }}
          >
            <Heading
              as="h2"
              sx={{
                fontSize: '4xl',
                fontWeight: 'semibold',
                color: 'display.text.primary.default',
              }}
            >
              {planName}
            </Heading>
            <Text
              sx={{
                fontSize: 'lg',
                color: 'display.text.secondary.default',
              }}
            >
              {price.value}
              {priceIntervalSuffix}
            </Text>
          </Flex>

          {/* Feature Tags */}
          {features.length > 0 && (
            <Flex sx={{ flexWrap: 'wrap', gap: '2' }}>
              {features.map((feature, index) => {
                return (
                  <Badge
                    key={index}
                    icon={feature.icon ?? 'fluent:checkmark-24-filled'}
                    variant="muted"
                    sx={{ borderRadius: 'full' }}
                  >
                    {feature.label}
                  </Badge>
                );
              })}
            </Flex>
          )}
        </Flex>
      </Flex>
    </Stack>
  );
};
