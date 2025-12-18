import { Flex, Text } from '@ttoss/ui';

import type { PlanCardPrice } from './PlanCard';
import type { PlanCardVariant } from './PlanCardVariant';
import { getPlanCardVariantStyles } from './PlanCardVariants';

export interface PlanCardPriceSlotProps {
  price: PlanCardPrice;
  variant?: PlanCardVariant;
}

export const PlanCardPriceSlot = ({
  price,
  variant = 'primary',
}: PlanCardPriceSlotProps) => {
  const variantStyles = getPlanCardVariantStyles(variant);

  return (
    <Flex
      sx={{
        paddingY: '6',
        paddingX: '8',
        width: 'full',
        alignItems: 'center',
        flexDirection: 'column',
        gap: '3',
      }}
    >
      <Flex sx={{ alignItems: 'baseline', gap: '4', justifyContent: 'center' }}>
        <Text
          sx={{
            fontSize: '4xl',
            fontWeight: 'bold',
            color: variantStyles.color,
          }}
        >
          {price.value}
        </Text>
        <Text
          sx={{
            fontSize: 'sm',
            color: variantStyles.secondaryColor,
          }}
        >
          {price.interval}
        </Text>
      </Flex>
      {price.description && (
        <Text
          sx={{
            fontSize: 'md',
            color: variantStyles.secondaryColor,
          }}
        >
          {price.description}
        </Text>
      )}
    </Flex>
  );
};
