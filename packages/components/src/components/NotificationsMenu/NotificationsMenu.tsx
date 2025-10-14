import { Icon } from '@ttoss/react-icons';
import {
  Box,
  Button,
  Flex,
  IconButton,
  Text,
  useResponsiveValue,
} from '@ttoss/ui';
import * as React from 'react';

import { Drawer } from '../Drawer';
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
  onOpenChange?: (isOpen: boolean) => void;
  onClose?: () => void;
  onClearAll?: () => void;
};

export const NotificationsMenu = ({
  notifications,
  defaultOpen = false,
  hasMore = false,
  onOpenChange,
  count,
  onClose,
  onClearAll,
}: Props) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const menuWidth = useResponsiveValue(['100%', '600px']);
  const loadMoreRef = React.useRef<HTMLDivElement | null>(null);

  const [showCount] = React.useState(true);

  const togglePanel = () => {
    setIsOpen((prev) => {
      const next = !prev;
      onOpenChange?.(next);
      return next;
    });
  };

  return (
    <Flex
      sx={{
        position: 'relative',
        justifyContent: 'flex-start',
        zIndex: 'modal',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <IconButton
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
          <>
            <Drawer
              size={menuWidth}
              direction="right"
              open={isOpen}
              overlayOpacity={0}
              onClose={() => {
                setIsOpen(false);
                onOpenChange?.(false);
                onClose?.();
              }}
              sx={{
                '.EZDrawer__container': {
                  position: 'fixed',
                  height: 'full',
                  backgroundColor: 'display.background.secondary.default',
                  width: 'full',
                  maxWidth: '2',
                  boxShadow: '4',
                  borderLeft: '1px solid',
                  borderColor: 'display.border.primary.default',
                  paddingX: '5',
                  paddingTop: '4',
                  paddingBottom: '4',
                  transformOrigin: 'top right',
                },
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Flex
                  sx={{
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                    flexShrink: 0,
                  }}
                >
                  <Text sx={{ fontSize: 'lg', fontWeight: 'bold' }}>
                    Notificações
                  </Text>
                  <Flex sx={{ alignItems: 'center', gap: 2 }}>
                    {notifications.length > 0 && onClearAll && (
                      <Button
                        variant="ghost"
                        sx={{
                          borderRadius: 'md',
                          padding: 1,
                          paddingLeft: 3,
                          paddingRight: 3,
                          fontSize: 'sm',
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
                            ml: 1,
                            fontSize: 'sm',
                          }}
                        >
                          Limpar Tudo
                        </Text>
                      </Button>
                    )}
                    <IconButton
                      variant="ghost"
                      sx={{
                        borderRadius: 'full',
                        padding: 1,
                        '&:hover': {
                          backgroundColor: 'display.background.muted.default',
                        },
                      }}
                      onClick={() => {
                        setIsOpen(false);
                        onOpenChange?.(false);
                        onClose?.();
                      }}
                    >
                      <Icon icon="close" width={20} height={20} />
                    </IconButton>
                  </Flex>
                </Flex>
                <Flex
                  sx={{
                    flexDirection: 'column',
                    gap: 4,
                    flex: 1,
                    overflowY: 'auto',
                  }}
                >
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
            </Drawer>
          </>
        )}
      </Box>
    </Flex>
  );
};
