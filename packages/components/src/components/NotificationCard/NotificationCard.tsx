import { Icon } from '@ttoss/react-icons';
import { Box, Card, CloseButton, Link, Tag, Text } from '@ttoss/ui';
import * as React from 'react';

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export type NotificationAction = {
  action?: 'open_url';
  url?: string;
  label?: string;
};

export type NotificationCardProps = {
  type: NotificationType;
  title?: string | React.ReactNode;
  message: string | React.ReactNode;
  actions?: NotificationAction[];
  caption?: string | React.ReactNode;
  tags?: string[] | React.ReactNode;
  onClose?: () => void;
};

export const NotificationCard = (props: NotificationCardProps) => {
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
    neutral: {
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
    neutral: 'info',
  };

  const hasCaption = Boolean(props.caption);
  const hasActions = Boolean(props.actions && props.actions.length > 0);
  const hasTitle = Boolean(props.title);
  const shouldCenterVerticallyWithoutTitle =
    !hasCaption && !hasActions && !hasTitle;
  const shouldCenterVerticallyWithTitle =
    !hasCaption && !hasActions && hasTitle;
  const shouldAddMinHeight = !hasCaption && !hasActions;

  return (
    <Card sx={{ ...sxMap[props.type].card, width: 'full' }}>
      {props.title && (
        <Card.Title
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: ['md', 'xl'],
            paddingY: ['1', '2', '4'],
            paddingX: ['2', '4', '8'],
          }}
        >
          <Text sx={{ display: 'inline-flex', alignItems: 'center', gap: '2' }}>
            <Icon icon={icon[props.type]} />
            {props.title}
            {props.tags && <Tag>{props.tags}</Tag>}
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
          paddingY: ['1', '2', '4'],
          paddingX: ['2', '4', '8'],
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            minHeight: shouldAddMinHeight ? '40px' : 'auto',
            alignItems: shouldCenterVerticallyWithoutTitle
              ? 'center'
              : shouldCenterVerticallyWithTitle
                ? 'center'
                : 'flex-start',
            width: '100%',
            gap: '4',
          }}
        >
          <Box
            sx={{
              flex: 1,
            }}
          >
            <Text
              sx={{
                fontSize: ['sm', 'md'],
              }}
            >
              {props.message}
            </Text>
          </Box>
        </Box>
        {props.actions && props.actions.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {props.actions.map((action, index) => {
              return action.action === 'open_url' ? (
                <Link
                  key={index}
                  href={action.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: 'action.text.accent.default',
                    cursor: 'pointer',
                  }}
                >
                  {action.label || 'Acessar'}
                </Link>
              ) : null;
            })}
          </Box>
        )}
        {props.caption && (
          <Box sx={{ whiteSpace: 'nowrap', mt: 6 }}>
            <Text sx={{ fontSize: 'xs', color: 'text.secondary' }}>
              {props.caption}
            </Text>
          </Box>
        )}
        {!props.title && props.onClose && (
          <Box sx={{ alignSelf: 'flex-end' }}>
            <CloseButton onClick={props.onClose} />
          </Box>
        )}
      </Card.Body>
    </Card>
  );
};
