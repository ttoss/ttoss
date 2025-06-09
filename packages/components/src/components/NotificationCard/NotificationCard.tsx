import { Icon } from '@ttoss/react-icons';
import { Box, Card, CloseButton, Text } from '@ttoss/ui';
import * as React from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info';

export const NotificationCard = (props: {
  type: NotificationType;
  title?: string | React.ReactNode;
  message: string | React.ReactNode;
  metaInfo?: string;
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
          {props.onClose && (
            <Box sx={{ marginLeft: 'auto' }}>
              <CloseButton onClick={props.onClose} />
            </Box>
          )}
        </Card.Title>
      )}
      <Card.Body
        sx={{
          ...sxMap[props.type].card,
          display: 'flex',
          flexDirection: 'column',
          gap: '2',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            width: '100%',
            gap: '4',
          }}
        >
          <Box sx={{ flex: 1 }}>{props.message}</Box>
        </Box>
        <Box sx={{ whiteSpace: 'nowrap', mt: 6 }}>
          {props.metaInfo && (
            <Text sx={{ fontSize: 'xs', color: 'text.secondary' }}>
              {props.metaInfo}
            </Text>
          )}
        </Box>
        {!props.title && props.onClose && (
          <Box sx={{ alignSelf: 'flex-end' }}>
            <CloseButton onClick={props.onClose} />
          </Box>
        )}
      </Card.Body>
    </Card>
  );
};
