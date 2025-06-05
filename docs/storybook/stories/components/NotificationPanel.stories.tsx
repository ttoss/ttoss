/* eslint-disable react-hooks/rules-of-hooks */
import { Meta, StoryObj } from '@storybook/react';
import {
  Notification,
  NotificationPanel,
} from '@ttoss/components/NotificationPanel';
import * as React from 'react';

export default {
  title: 'Components/NotificationPanel',
  component: NotificationPanel,
} as Meta;

const defaultNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Campanha criada com sucesso',
    message: 'Sua campanha "Promoção de Verão" foi criada e está ativa.',
    presentation: 'SIMPLE',
    actions: [
      {
        action: 'open_url',
        url: 'https://example.com/campaign',
        label: 'Ver campanha',
      },
    ],
    createdAt: 'há 1 min',
  },
  {
    id: '2',
    type: 'warning',
    title: 'Orçamento próximo do limite',
    message: 'Sua conta está utilizando 85% do orçamento mensal.',
    presentation: 'LOCKED',
    createdAt: 'há 25 min',
  },
  {
    id: '3',
    type: 'error',
    title: 'Falha na integração',
    message: 'Não foi possível conectar com a API do Facebook.',
    presentation: 'BLOCKED',
    actions: [
      {
        action: 'open_url',
        url: 'https://example.com/try-again',
        label: 'Tentar novamente',
      },
    ],
    createdAt: 'há 3h',
  },
  {
    id: '4',
    type: 'info',
    title: 'Nova funcionalidade disponível',
    message: 'Agora você pode monitorar seus gastos em tempo real.',
    presentation: 'SIMPLE',
    createdAt: 'há 2d',
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
    const [isOpen, setIsOpen] = React.useState(true);
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
      <NotificationPanel
        notifications={notifications}
        hasMore={notifications.length < scrollNotifications.length}
        onLoadMore={hasInitialized ? loadMore : undefined}
        defaultOpen={isOpen}
        onOpenChange={setIsOpen}
        unreadCount={scrollNotifications.length}
      />
    );
  },
};
