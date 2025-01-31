import { Icon } from '@ttoss/react-icons';
import { Box, Card, CloseButton, Text } from '@ttoss/ui';

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
        backgroundColor: 'feedback.background.positive.default',
        borderColor: 'feedback.border.positive.default',
      },
    },
    error: {
      card: {
        backgroundColor: 'feedback.background.negative.default',
        borderColor: 'feedback.border.negative.default',
      },
    },
    warning: {
      card: {
        backgroundColor: 'feedback.background.caution.default',
        borderColor: 'feedback.border.caution.default',
      },
    },
    info: {
      card: {
        backgroundColor: 'feedback.background.primary.default',
        borderColor: 'feedback.border.primary.default',
      },
    },
  };

  const icon: Record<NotificationType, string> = {
    success: 'success-circle',
    error: 'error',
    warning: 'warning-alt',
    info: 'info',
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
          <Text sx={{ display: 'inline-flex', alignItems: 'center', gap: '2' }}>
            <Icon icon={icon[props.type]} />
            {props.title}
          </Text>
          {props.onClose && <CloseButton onClick={props.onClose} />}
        </Card.Title>
      )}
      <Card.Body
        sx={{
          ...sxMap[props.type].card,
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
