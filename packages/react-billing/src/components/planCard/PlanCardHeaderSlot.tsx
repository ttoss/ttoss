import { Box, Flex, Heading, Text } from '@ttoss/ui';

import type { PlanCardVariant } from './PlanCardVariants';
import { getPlanCardVariantStyles } from './PlanCardVariants';

export interface PlanCardHeaderSlotProps {
  title: string;
  subtitle?: string;
  hasTopTag?: boolean;
  variant?: PlanCardVariant;
}

export const PlanCardHeaderSlot = ({
  title,
  subtitle,
  hasTopTag,
  variant = 'primary',
}: PlanCardHeaderSlotProps) => {
  const variantStyles = getPlanCardVariantStyles(variant);

  return (
    <Box
      sx={{
        paddingY: hasTopTag ? '4' : '8',
        paddingX: '8',
        width: 'full',
      }}
    >
      <Flex
        sx={{
          flexDirection: 'column',
          gap: '2',
          width: 'full',
          alignItems: 'center',
        }}
      >
        <Heading sx={{ fontSize: '3xl', color: variantStyles.color }}>
          {title}
        </Heading>
        {subtitle && (
          <Text
            sx={{
              fontSize: 'sm',
              color: variantStyles.secondaryColor,
            }}
          >
            {subtitle}
          </Text>
        )}
      </Flex>
    </Box>
  );
};
