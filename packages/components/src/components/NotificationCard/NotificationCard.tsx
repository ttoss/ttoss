import { Icon } from '@ttoss/react-icons';
import { Box, Card, CloseButton, Tag, Text } from '@ttoss/ui';
import type * as React from 'react';

import { NotificationButton } from './NotificationButton';

type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'neutral';

export type NotificationAction =
  | { action: 'open_url'; url: string; label?: string }
  | { action: 'callback'; onClick: () => void; label?: string };

export type NotificationCardProps = {
  type: NotificationType;
  title?: string | React.ReactNode;
  message: string | React.ReactNode;
  actions?: NotificationAction[];
  caption?: string | React.ReactNode;
  tags?: string[] | React.ReactNode;
  onClose?: () => void;
};

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

const iconMap: Record<NotificationType, string> = {
  success: 'success-circle',
  error: 'error',
  warning: 'warning-alt',
  info: 'info',
  neutral: 'info',
};

const NotificationCardTags = ({
  tags,
}: {
  tags: string[] | React.ReactNode;
}) => {
  if (!tags) {
    return null;
  }

  if (Array.isArray(tags)) {
    if (tags.length === 0) {
      return null;
    }
    return (
      <>
        {tags.map((tag, index) => {
          return <Tag key={index}>{tag}</Tag>;
        })}
      </>
    );
  }

  return <Tag>{tags}</Tag>;
};

const NotificationCardTitle = ({
  type,
  title,
  tags,
  onClose,
}: {
  type: NotificationType;
  title: React.ReactNode;
  tags?: string[] | React.ReactNode;
  onClose?: () => void;
}) => {
  return (
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
      <Text
        sx={{
          display: 'inline-flex',
          alignItems: 'flex-start',
          gap: '2',
          flexDirection: 'row',
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '2' }}>
          <Icon icon={iconMap[type]} />
          {title}
        </Box>
        <NotificationCardTags tags={tags} />
      </Text>
      {onClose && (
        <Box sx={{ marginLeft: 'auto' }}>
          <CloseButton onClick={onClose} />
        </Box>
      )}
    </Card.Title>
  );
};

const NotificationCardActions = ({
  type,
  actions,
}: {
  type: NotificationType;
  actions: NotificationAction[];
}) => {
  if (actions.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 2,
        mt: 2,
      }}
    >
      {actions.map((action, index) => {
        const onClick =
          action.action === 'open_url'
            ? () => {
                return window.open(action.url, '_blank');
              }
            : action.onClick;

        return (
          <NotificationButton key={index} type={type} onClick={onClick}>
            {action.label || 'Acessar'}
          </NotificationButton>
        );
      })}
    </Box>
  );
};

const NotificationCardBody = ({
  type,
  message,
  actions,
  caption,
  onClose,
  hasTitle,
}: {
  type: NotificationType;
  message: React.ReactNode;
  actions?: NotificationAction[];
  caption?: React.ReactNode;
  onClose?: () => void;
  hasTitle: boolean;
}) => {
  const hasCaption = Boolean(caption);
  const hasActions = Boolean(actions?.length);
  const shouldCenter = !hasCaption && !hasActions;
  const bodyAlign = shouldCenter ? 'center' : 'flex-start';
  const bodyMinHeight = shouldCenter && !hasTitle ? '40px' : 'auto';

  return (
    <Card.Body
      sx={{
        ...sxMap[type].card,
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
          minHeight: bodyMinHeight,
          alignItems: bodyAlign,
          width: '100%',
          gap: '4',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Text sx={{ fontSize: ['sm', 'md'] }}>{message}</Text>
        </Box>
      </Box>
      {actions && <NotificationCardActions type={type} actions={actions} />}
      {caption && (
        <Box sx={{ whiteSpace: 'nowrap', mt: 6 }}>
          <Text sx={{ fontSize: 'xs', color: 'text.secondary' }}>
            {caption}
          </Text>
        </Box>
      )}
      {!hasTitle && onClose && (
        <Box sx={{ alignSelf: 'flex-end' }}>
          <CloseButton onClick={onClose} />
        </Box>
      )}
    </Card.Body>
  );
};

export const NotificationCard = (props: NotificationCardProps) => {
  const hasTitle = Boolean(props.title);

  return (
    <Card sx={{ ...sxMap[props.type].card, width: 'full' }}>
      {props.title && (
        <NotificationCardTitle
          type={props.type}
          title={props.title}
          tags={props.tags}
          onClose={props.onClose}
        />
      )}
      <NotificationCardBody
        type={props.type}
        message={props.message}
        actions={props.actions}
        caption={props.caption}
        onClose={props.onClose}
        hasTitle={hasTitle}
      />
    </Card>
  );
};
