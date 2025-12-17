import { Flex, Text } from '@ttoss/ui';

import type { PlanCardPrice } from './PlanCard';
import type { PlanCardVariant } from './PlanCardVariant';

export interface PlanCardPriceSlotProps {
  price: PlanCardPrice;
  variant?: PlanCardVariant;
}

export const PlanCardPriceSlot = ({
  price,
  variant = 'default',
}: PlanCardPriceSlotProps) => {
  const isEnterprise = variant === 'enterprise';

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
            color: isEnterprise ? 'white' : 'display.text.primary.default',
          }}
        >
          {price.value}
        </Text>
        <Text
          sx={{
            fontSize: 'sm',
            color: isEnterprise ? 'white' : 'display.text.secondary.default',
          }}
        >
          {price.interval}
        </Text>
      </Flex>
      {price.description && (
        <Text
          sx={{
            fontSize: 'md',
            color: isEnterprise ? 'white' : 'display.text.secondary.default',
          }}
        >
          {price.description}
        </Text>
      )}
    </Flex>
  );
};
