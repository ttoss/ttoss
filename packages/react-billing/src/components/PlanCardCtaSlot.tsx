import { Button, Flex } from '@ttoss/ui';

import type { PlanCardButtonProps } from './PlanCard';
import type { PlanCardVariant } from './PlanCardVariant';

export interface PlanCardCtaSlotProps {
  buttonProps?: PlanCardButtonProps;
  variant?: PlanCardVariant;
}

export const PlanCardCtaSlot = ({ buttonProps }: PlanCardCtaSlotProps) => {
  const {
    label: ctaLabel = 'Assine agora',
    sx: buttonSx,
    leftIcon,
    variant,
    ...restButtonProps
  } = buttonProps ?? {};

  return (
    <Flex
      sx={{
        paddingY: '2',
        paddingX: '6',
        width: 'full',
        justifyContent: 'center',
      }}
    >
      <Button
        {...restButtonProps}
        variant={variant ?? 'accent'}
        leftIcon={leftIcon}
        sx={{
          width: 'full',
          justifyContent: 'center',
          fontWeight: 'semibold',
          ...buttonSx,
        }}
      >
        {ctaLabel}
      </Button>
    </Flex>
  );
};
