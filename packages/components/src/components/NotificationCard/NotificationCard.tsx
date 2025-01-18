import { Box, Card, CloseButton } from '@ttoss/ui';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

export const NotificationCard = (props: {
  type: NotificationType;
  title?: string;
  message: string;
  onClose?: () => void;
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
    <Card sx={{ ...sxMap[props.type].card, width: 'full' }}>
      {props.title && (
        <Card.Title
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'xl',
          }}
        >
          {props.title}
          {props.onClose && <CloseButton onClick={props.onClose} />}
        </Card.Title>
      )}
      <Card.Body
        sx={{
          display: 'flex',
          gap: '4',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {props.message}
        {!props.title && props.onClose && (
          <Box sx={{ alignSelf: 'flex-start' }}>
            <CloseButton onClick={props.onClose} />
          </Box>
        )}
      </Card.Body>
    </Card>
  );
};
