import { Button, type ButtonProps } from '@ttoss/ui';

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'neutral';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sxMap: Record<NotificationType, Record<string, any>> = {
  success: {
    backgroundColor: 'feedback.background.positive.active',
    borderColor: 'feedback.border.positive.active',
  },
  error: {
    backgroundColor: 'feedback.background.negative.active',
    borderColor: 'feedback.border.negative.active',
  },
  warning: {
    backgroundColor: 'feedback.background.caution.active',
    borderColor: 'feedback.border.caution.active',
  },
  info: {
    backgroundColor: 'feedback.background.primary.active',
    borderColor: 'feedback.border.primary.active',
  },
  neutral: {
    backgroundColor: 'feedback.background.primary.active',
    borderColor: 'feedback.border.primary.active',
  },
};

/** Props for NotificationButton */
export type NotificationButtonProps = Omit<ButtonProps, 'type'> & {
  /** Notification type — controls background and border colors to match the card. */
  type: NotificationType;
};

/**
 * A button styled to match the NotificationCard of a given type.
 * Use this for action buttons rendered inside or alongside notification cards.
 */
export const NotificationButton = ({
  type,
  ...props
}: NotificationButtonProps) => {
  return (
    <Button
      type="button"
      {...props}
      sx={{
        ...sxMap[type],
        color: 'display.text.primary.default',
        borderRadius: 'lg',
        borderWidth: 'sm',
        borderStyle: 'solid',
      }}
    />
  );
};
