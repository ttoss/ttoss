import { Icon } from '@ttoss/react-icons';
import { Box, Card, Flex, IconButton, Link, Text } from '@ttoss/ui';
import * as React from 'react';

import { NotificationCard } from '../NotificationCard/NotificationCard';

export type Notification = {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  actions?: {
    action?: 'open_url';
    url?: string;
    label?: string;
  }[];
  createdAt: string;
  readAt?: string | null;
  onClose?: () => void;
};

type Props = {
  notifications: Notification[];
  defaultOpen?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  unreadCount?: number;
  onClose?: () => void;
};

const renderMessage = (message: string, actions?: Notification['actions']) => {
  if (!actions || actions.length === 0) return message;

  return (
    <Flex sx={{ flexDirection: 'column', gap: 2 }}>
      <Text>{message}</Text>
      {actions.map((action, index) => {
        if (action.action === 'open_url') {
          return (
            <Link
              key={index}
              href={action.url}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'action.text.accent.default', cursor: 'pointer' }}
            >
              {action.label || 'Acessar'}
            </Link>
          );
        }
        return null;
      })}
    </Flex>
  );
};

export const NotificationsMenu = ({
  notifications,
  defaultOpen = false,
  hasMore = false,
  onLoadMore,
  onOpenChange,
  unreadCount,
  onClose,
}: Props) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [openToLeft, setOpenToLeft] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  const togglePanel = () => {
    setIsOpen((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  };

  const unread =
    unreadCount ??
    notifications.filter((n) => {
      if (defaultOpen) {
        return 0;
      }
      return n.readAt === null;
    }).length;

  React.useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const spaceRight = window.innerWidth - rect.right;
    const spaceLeft = rect.left;

    setOpenToLeft(spaceRight < 400 && spaceLeft > spaceRight);
  }, [isOpen]);

  React.useEffect(() => {
    if (!hasMore || !onLoadMore || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 1.0,
      }
    );

    observer.observe(loadMoreRef.current);

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasMore, onLoadMore, notifications.length]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onOpenChange?.(false);
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onOpenChange, onClose]);

  return (
    <Flex sx={{ position: 'relative', justifyContent: 'flex-start' }}>
      <Box sx={{ position: 'relative' }}>
        <IconButton
          ref={buttonRef}
          variant="ghost"
          sx={{
            position: 'relative',
            borderRadius: 'full',
            padding: 1,
            transition: 'background-color 0.3s ease',
            '&:hover': {
              backgroundColor: 'action.background.muted.default',
            },
          }}
          onClick={togglePanel}
        >
          <Box sx={{ color: 'display.text.muted.default' }}>
            <Icon icon="mdi:bell-outline" width={22} height={22} />
          </Box>
          {unread > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                minWidth: '14px',
                height: '14px',
                paddingX: 1,
                borderRadius: 'full',
                backgroundColor: 'action.background.negative.default',
                color: 'feedback.text.primary.default',
                fontSize: '10px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              {unread > 99 ? '99+' : unread}
            </Box>
          )}
        </IconButton>

        {isOpen && (
          <Card
            sx={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: openToLeft ? 'auto' : 0,
              right: openToLeft ? 0 : 'auto',
              width: ['90vw', '400px'],
              maxHeight: '400px',
              overflowY: 'auto',
              zIndex: 10,
              padding: 0,
              boxShadow: 'xl',
              borderRadius: '2xl',
              backgroundColor: 'display.background.secondary.default',
            }}
          >
            <Box ref={containerRef}>
              <Flex sx={{ flexDirection: 'column', gap: 2 }}>
                {notifications.length === 0 && (
                  <Text
                    sx={{
                      color: 'display.text.muted.default',
                      textAlign: 'center',
                      p: 4,
                    }}
                  >
                    Nenhuma notificação
                  </Text>
                )}

                {notifications.map((notification) => {
                  return (
                    <NotificationCard
                      key={notification.id}
                      type={notification.type}
                      title={notification.title}
                      message={renderMessage(
                        notification.message,
                        notification.actions
                      )}
                      onClose={notification.onClose || onClose}
                      metaInfo={notification.createdAt}
                    />
                  );
                })}

                {hasMore && <div ref={loadMoreRef} style={{ height: 1 }} />}
              </Flex>
            </Box>
          </Card>
        )}
      </Box>
    </Flex>
  );
};
