import { Icon } from '@ttoss/react-icons';
import { Button, Flex } from '@ttoss/ui';

import type { SubscriptionPanelAction } from './SubscriptionPanel.types';

/**
 * Props for the SubscriptionPanelActionsSlot component.
 */
export interface SubscriptionPanelActionsSlotProps {
  /**
   * Action buttons to render.
   */
  actions: SubscriptionPanelAction[];
}

/**
 * Renders action buttons for the subscription card.
 */
export const SubscriptionPanelActionsSlot = ({
  actions,
}: SubscriptionPanelActionsSlotProps) => {
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
