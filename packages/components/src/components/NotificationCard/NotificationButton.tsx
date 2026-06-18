import { Button, type ButtonProps } from '@ttoss/ui';
import * as React from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'neutral';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sxMap: Record<NotificationType, Record<string, any>> = {
  success: {
    backgroundColor: 'feedback.background.positive.default',
    borderColor: 'feedback.border.positive.default',
  },
  error: {
    backgroundColor: 'feedback.background.negative.default',
    borderColor: 'feedback.border.negative.default',
  },
  warning: {
    backgroundColor: 'feedback.background.caution.default',
    borderColor: 'feedback.border.caution.default',
  },
  info: {
    backgroundColor: 'feedback.background.primary.default',
    borderColor: 'feedback.border.primary.default',
  },
  neutral: {
    backgroundColor: 'feedback.background.primary.default',
    borderColor: 'feedback.border.primary.default',
  },
};

/** Props for NotificationButton */
export type NotificationButtonProps = Omit<ButtonProps, 'sx'> & {
  /** Notification type — controls background and border colors to match the card. */
  type: NotificationType;
};

/**
 * A button styled to match the NotificationCard of a given type.
 * Use this for action buttons rendered inside or alongside notification cards.
 */
export const NotificationButton = React.forwardRef<
  HTMLButtonElement,
  NotificationButtonProps
>(({ type, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      {...props}
      sx={{
        ...sxMap[type],
        borderRadius: 'lg',
        borderWidth: '1px',
        borderStyle: 'solid',
      }}
    />
  );
});

NotificationButton.displayName = 'NotificationButton';
