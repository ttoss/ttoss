import { Card } from '@ttoss/ui';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

export const NotificationCard = (props: {
  type: NotificationType;
  title?: string;
  message: string;
}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sxMap: Record<NotificationType, Record<string, any>> = {
    success: {
      card: {
        borderColor: 'feedback.border.positive.default',
      },
    },
    error: {
      card: {
        borderColor: 'feedback.border.negative.default',
      },
    },
    warning: {
      card: {
        borderColor: 'feedback.border.caution.default',
      },
    },
    info: {
      card: {
        borderColor: 'feedback.border.primary.default',
      },
    },
  };

  return (
    <Card sx={sxMap[props.type].card}>
      {props.title && <Card.Title>{props.title}</Card.Title>}
      <Card.Body>{props.message}</Card.Body>
    </Card>
  );
};
