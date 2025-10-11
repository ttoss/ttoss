import { Icon } from '@ttoss/react-icons';
import { Box, Button, Card, Flex, IconButton, Text } from '@ttoss/ui';
import * as React from 'react';

import {
  NotificationCard,
  NotificationCardProps,
} from '../NotificationCard/NotificationCard';

export type Notification = NotificationCardProps & {
  id: string;
  group?: string;
};

type Props = {
  notifications: Notification[];
  defaultOpen?: boolean;
  hasMore?: boolean;
  count: number;
  onLoadMore?: () => void;
  onOpenChange?: (isOpen: boolean) => void;
  onClose?: () => void;
  onClearAll?: () => void;
};

export const NotificationsMenu = ({
  notifications,
  defaultOpen = false,
  hasMore = false,
  onLoadMore,
  onOpenChange,
  count,
  onClose,
  onClearAll,
}: Props) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const [menuWidth, setMenuWidth] = React.useState(600); // Default width, will be adjusted
  const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);
  const [menuLeft, setMenuLeft] = React.useState(0);
  const [menuTop, setMenuTop] = React.useState(0);

  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  const [showCount, setShowCount] = React.useState(true);

  const togglePanel = () => {
    setIsOpen((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  };

  React.useEffect(() => {
    const handleResize = () => {
      return setWindowWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      return window.removeEventListener('resize', handleResize);
    };
  }, []);

  React.useEffect(() => {
    if (!isOpen || !buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const margin = 12;
    const desiredWidth = notifications.length === 0 ? 300 : 600;
    const buttonCenterX = rect.left + rect.width / 2;

    if (
      window.innerWidth <= 480 ||
      desiredWidth + margin * 2 > window.innerWidth
    ) {
      const newWidth = Math.max(window.innerWidth - margin * 2, 320);
      const left = Math.round((window.innerWidth - newWidth) / 2);
      setMenuLeft(left);
      setMenuTop(Math.round(rect.bottom + 8));
      setMenuWidth(newWidth);
      setShowCount(false);
      return;
    }

    const centeredLeft = Math.round(buttonCenterX - desiredWidth / 2);
    const fitsWhenCentered =
      centeredLeft >= margin &&
      centeredLeft + desiredWidth <= window.innerWidth - margin;

    let newWidth = desiredWidth;

    if (!fitsWhenCentered) {
      const spaceRight = window.innerWidth - rect.right;
      const spaceLeft = rect.left;

      const available = Math.max(spaceLeft, spaceRight);
      newWidth = Math.min(desiredWidth, Math.max(available - margin, 300));
    }

    let left = Math.round(buttonCenterX - newWidth / 2);
    left = Math.max(
      margin,
      Math.min(left, window.innerWidth - newWidth - margin)
    );

    setMenuLeft(left);
    setMenuTop(Math.round(rect.bottom + 8));
    setMenuWidth(newWidth);
    setShowCount(false);
  }, [isOpen, notifications.length, windowWidth]);

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
          {count > 0 && showCount && (
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
              {count > 99 ? '99+' : count}
            </Box>
          )}
        </IconButton>

        {isOpen && (
          <div ref={containerRef}>
            <Card
              sx={{
                position: 'fixed',
                top: `${menuTop}px`,
                left: `${menuLeft}px`,
                right: 'auto',
                width: `${menuWidth}px`,
                maxHeight: '550px',
                overflowY: 'auto',
                zIndex: 'modal',
                padding: 0,
                boxShadow: 'xl',
                borderRadius: '2xl',
                backgroundColor: 'display.background.secondary.default',
              }}
            >
              <Box sx={{ width: '100%' }}>
                <Flex sx={{ flexDirection: 'column', gap: 4 }}>
                  {notifications.length > 0 && onClearAll && (
                    <Flex
                      sx={{
                        justifyContent: 'flex-end',
                        p: 2,
                        marginBottom: -2,
                      }}
                    >
                      <Button
                        variant="ghost"
                        sx={{
                          borderRadius: 'md',
                          padding: 1,
                          paddingLeft: 10,
                          paddingRight: 10,
                          fontSize: 'md',
                          color: 'display.text.muted.default',
                          border: '1px solid',
                          borderColor: 'display.border.default',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          '&:hover': {
                            backgroundColor: 'action.background.muted.default',
                            color: 'display.text.default',
                            borderColor: 'action.border.default',
                          },
                        }}
                        onClick={onClearAll}
                      >
                        <Icon icon="delete" width={16} height={16} />
                        <Text
                          sx={{
                            ml: -1,
                            marginTop: -0.4,
                            fontSize: 'sm',
                          }}
                        >
                          Limpar Tudo
                        </Text>
                      </Button>
                    </Flex>
                  )}
                  {notifications.length === 0 ? (
                    <Text
                      sx={{
                        color: 'display.text.muted.default',
                        textAlign: 'center',
                        p: 4,
                      }}
                    >
                      Nenhuma notificação
                    </Text>
                  ) : (
                    notifications.map((notification) => {
                      return (
                        <NotificationCard
                          key={notification.id}
                          {...notification}
                          onClose={() => {
                            notification.onClose?.();
                            onClose?.();
                          }}
                        />
                      );
                    })
                  )}
                  {hasMore && <div ref={loadMoreRef} style={{ height: 1 }} />}
                </Flex>
              </Box>
            </Card>
          </div>
        )}
      </Box>
    </Flex>
  );
};
