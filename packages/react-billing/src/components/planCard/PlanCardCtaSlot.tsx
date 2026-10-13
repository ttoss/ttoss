import { defineMessages, useI18n } from '@ttoss/react-i18n';
import { Button, Flex } from '@ttoss/ui';

import type { PlanCardButtonProps } from './PlanCard';
import type { PlanCardVariant } from './PlanCardVariants';

export interface PlanCardCtaSlotProps {
  buttonProps?: PlanCardButtonProps;
  variant?: PlanCardVariant;
}

const messages = defineMessages({
  ctaLabel: {
    defaultMessage: 'Subscribe now',
    description: 'Plan card: default label of the call-to-action button.',
  },
});

export const PlanCardCtaSlot = ({ buttonProps }: PlanCardCtaSlotProps) => {
  const { intl } = useI18n();
  const {
    label: ctaLabel = intl.formatMessage(messages.ctaLabel),
    sx: buttonSx,
    leftIcon,
    variant: buttonVariant,
    ...restButtonProps
  } = buttonProps ?? {};

  return (
    <Flex
      sx={{
        marginTop: 'auto',
        paddingY: '2',
        paddingX: '6',
        width: 'full',
        justifyContent: 'center',
      }}
    >
      <Button
        {...restButtonProps}
        variant={buttonVariant ?? 'accent'}
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
