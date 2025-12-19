import { Icon } from '@ttoss/react-icons';
import { Button, Flex } from '@ttoss/ui';

import type { SubscriptionCardAction } from './SubscriptionCard.types';

/**
 * Props for the SubscriptionCardActionsSlot component.
 */
export interface SubscriptionCardActionsSlotProps {
  /**
   * Action buttons to render.
   */
  actions: SubscriptionCardAction[];
}

/**
 * Renders action buttons for the subscription card.
 */
export const SubscriptionCardActionsSlot = ({
  actions,
}: SubscriptionCardActionsSlotProps) => {
  if (actions.length === 0) {
    return null;
  }

  return (
    <Flex
      sx={{
        gap: '3',
        flexDirection: ['column', 'row'],
        flexShrink: 0,
        paddingX: '6',
        paddingBottom: '6',
      }}
    >
      {actions.map((action, index) => {
        const {
          label,
          onClick,
          leftIcon,
          isLoading,
          variant = 'secondary',
          disabled,
          ...buttonProps
        } = action;

        return (
          <Button
            key={index}
            onClick={onClick}
            variant={variant}
            disabled={disabled || isLoading}
            leftIcon={isLoading ? undefined : leftIcon}
            sx={{
              gap: '2',
              justifyContent: 'center',
              minWidth: 'fit-content',
            }}
            {...buttonProps}
          >
            {isLoading ? (
              <>
                <Icon icon="fluent:spinner-ios-20-regular" />
                Processando...
              </>
            ) : (
              label
            )}
          </Button>
        );
      })}
    </Flex>
  );
};
