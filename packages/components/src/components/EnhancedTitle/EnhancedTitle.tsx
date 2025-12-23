import { Icon } from '@ttoss/react-icons';
import { Badge, Flex, Heading, Stack, Text } from '@ttoss/ui';

import { getEnhancedTitleIconSx } from './EnhancedTitle.styles';
import type { EnhancedTitleProps } from './EnhancedTitle.types';

/**
 * EnhancedTitle component renders a structured title section with icon, badges, and metadata.
 *
 * This component is useful for displaying rich title sections with status indicators,
 * feature tags, and supplementary information in a consistent layout.
 *
 * @example
 * ```tsx
 * <EnhancedTitle
 *   icon="fluent:shield-24-filled"
 *   title="Starter Plan"
 *   frontTitle="R$ 49,90/mês"
 *   description="Perfect for small teams"
 *   variant="primary"
 *   topBadges={[
 *     { label: 'Active', variant: 'positive', icon: 'fluent:checkmark-circle-24-filled' }
 *   ]}
 *   bottomBadges={[
 *     { label: 'OneClick Tracking', icon: 'fluent:checkmark-24-filled' }
 *   ]}
 * />
 * ```
 *
 * @example
 * ```tsx
 * <EnhancedTitle
 *   title="Pro Plan"
 *   frontTitle="$99/month"
 *   variant="accent"
 *   topBadges={[
 *     { label: 'Most Popular', variant: 'informative' }
 *   ]}
 * />
 * ```
 */
export const EnhancedTitle = ({
  variant = 'spotlight-primary',
  icon,
  title,
  description,
  frontTitle,
  topBadges = [],
  bottomBadges = [],
}: EnhancedTitleProps) => {
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
          <Flex sx={getEnhancedTitleIconSx(variant)}>
            <Icon icon={icon} width={24} height={24} />
          </Flex>
        )}

        {/* Content */}
        <Flex
          sx={{
            flexDirection: 'column',
            gap: ['4', '5'],
            flex: 1,
          }}
        >
          {/* Top Badges */}
          {topBadges.length > 0 && (
            <Flex sx={{ flexWrap: 'wrap', gap: '2', alignItems: 'center' }}>
              {topBadges.map((badge, index) => {
                return (
                  <Badge
                    key={index}
                    icon={badge.icon}
                    variant={badge.variant ?? 'muted'}
                    sx={{ borderRadius: 'full' }}
                  >
                    {badge.label}
                  </Badge>
                );
              })}
            </Flex>
          )}

          {/* Title and Front Title */}
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
              {title}
            </Heading>
            {frontTitle && (
              <Text
                sx={{
                  fontSize: 'xl',
                  color: 'display.text.secondary.default',
                }}
              >
                {frontTitle}
              </Text>
            )}
          </Flex>

          {/* Description */}
          {description && (
            <Text
              sx={{
                fontSize: 'md',
                color: 'display.text.secondary.default',
              }}
            >
              {description}
            </Text>
          )}

          {/* Bottom Badges */}
          {bottomBadges.length > 0 && (
            <Flex sx={{ flexWrap: 'wrap', gap: '2' }}>
              {bottomBadges.map((badge, index) => {
                return (
                  <Badge
                    key={index}
                    icon={badge.icon ?? 'fluent:checkmark-24-filled'}
                    variant={badge.variant ?? 'muted'}
                    sx={{ borderRadius: 'full' }}
                  >
                    {badge.label}
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
