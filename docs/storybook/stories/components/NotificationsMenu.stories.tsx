/* eslint-disable react-hooks/rules-of-hooks */
import { Meta, StoryObj } from '@storybook/react';
import {
  Notification,
  NotificationsMenu,
} from '@ttoss/components/NotificationsMenu';
import * as React from 'react';

export default {
  title: 'Components/NotificationsMenu',
  component: NotificationsMenu,
} as Meta;

const defaultNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Campanha criada com sucesso',
    message: 'Sua campanha "Promoção de Verão" foi criada e está ativa.',
    actions: [
      {
        action: 'open_url',
        url: 'https://example.com/campaign',
        label: 'Ver campanha',
      },
    ],
    createdAt: 'há 1 min',
    readAt: null,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Orçamento próximo do limite',
    message: 'Sua conta está utilizando 85% do orçamento mensal.',
    createdAt: 'há 25 min',
    readAt: null,
  },
  {
    id: '3',
    type: 'warning',
    title:
      'Limite da conta está próximo e precisa ser ajustado para evitar interrupções',
    message: 'Sua conta está utilizando 95% do orçamento mensal.',
    createdAt: 'há 30 min',
    readAt: null,
  },
  {
    id: '4',
    type: 'error',
    title: 'Falha na integração',
    message: 'Não foi possível conectar com a API do Facebook.',
    actions: [
      {
        action: 'open_url',
        url: 'https://example.com/try-again',
        label: 'Tentar novamente',
      },
    ],
    createdAt: 'há 3h',
    readAt: null,
  },
  {
    id: '5',
    type: 'info',
    title: 'Nova funcionalidade disponível',
    message: 'Agora você pode monitorar seus gastos em tempo real.',
    createdAt: 'há 2d',
    readAt: null,
  },
  {
    id: '6',
    type: 'info',
    title: 'Nova funcionalidade disponível',
    message:
      'Integrado com o Google Analytics para relatórios mais detalhados, e pode ser acessado através do menu de relatórios.',
    createdAt: 'há 20 min',
    readAt: '2023-10-01T12:00:00Z',
  },
];

const scrollNotifications: Notification[] = Array(25)
  .fill(null)
  .map((_, i) => {
    const base = defaultNotifications[i % defaultNotifications.length];
    return {
      ...base,
      id: `${i + 100}`,
      title: `${base.title}`,
      message: `${base.message}`,
    };
  });

export const Default: StoryObj = {
  args: {
    notifications: defaultNotifications,
    defaultOpen: true,
    onClose: () => {},
  },
};

export const Empty: StoryObj = {
  args: {
    notifications: [],
    defaultOpen: true,
  },
};

export const WithInfiniteScroll: StoryObj = {
  render: () => {
    const [notifications, setNotifications] = React.useState<Notification[]>(
      []
    );
    const [page, setPage] = React.useState(0);
    const [isOpen, setIsOpen] = React.useState(false);
    const [hasInitialized, setHasInitialized] = React.useState(false);
    const pageSize = 10;

    const loadMore = () => {
      const start = (page + 1) * pageSize;
      const end = start + pageSize;
      const nextItems = scrollNotifications.slice(start, end);

      setNotifications((prev) => {
        return [...prev, ...nextItems];
      });
      setPage((prev) => {
        return prev + 1;
      });
    };

    React.useEffect(() => {
      if (isOpen) {
        if (!hasInitialized) {
          const initial = scrollNotifications.slice(0, pageSize);
          setNotifications(initial);
          setPage(0);
          setHasInitialized(true);
        }
      } else {
        setNotifications([]);
        setPage(0);
        setHasInitialized(false);
      }
    }, [isOpen, hasInitialized]);

    return (
      <NotificationsMenu
        notifications={notifications}
        hasMore={notifications.length < scrollNotifications.length}
        onLoadMore={hasInitialized ? loadMore : undefined}
        defaultOpen={isOpen}
        onOpenChange={setIsOpen}
        unreadCount={
          scrollNotifications.filter((n) => {
            return n.readAt == null;
          }).length
        }
        onClose={() => {}}
      />
    );
  },
};

export const WithCloseButton: StoryObj = {
  render: () => {
    const [notifications, setNotifications] =
      React.useState<Notification[]>(defaultNotifications);
    const [isOpen, setIsOpen] = React.useState(true);

    const handleClose = (id: string) => {
      setNotifications((prev) => {
        return prev.filter((n) => {
          return n.id !== id;
        });
      });
    };

    return (
      <NotificationsMenu
        notifications={notifications.map((n) => {
          return {
            ...n,
            onClose: () => {
              return handleClose(n.id);
            },
          };
        })}
        defaultOpen={isOpen}
        onOpenChange={setIsOpen}
        onClose={() => {
          return setIsOpen(false);
        }}
      />
    );
  },
};

export const MarkAllAsReadOnOpen: StoryObj = {
  render: () => {
    const [notifications, setNotifications] = React.useState<
      (Notification & { readAt: string | null })[]
    >(
      defaultNotifications.map((n) => {
        return { ...n, readAt: n.readAt ?? null };
      })
    );
    const [isOpen, setIsOpen] = React.useState(false);

    const unreadCount = notifications.filter((n) => {
      return !n.readAt;
    }).length;

    const handleOpenChange = (open: boolean) => {
      setIsOpen(open);
      if (open) {
        setNotifications((prev) => {
          return prev.map((n) => {
            return { ...n, readAt: new Date().toISOString() };
          });
        });
      }
    };

    return (
      <NotificationsMenu
        notifications={notifications}
        defaultOpen={isOpen}
        onOpenChange={handleOpenChange}
        unreadCount={unreadCount}
        onClose={() => {
          return setIsOpen(false);
        }}
      />
    );
  },
};
