/* eslint-disable react-hooks/rules-of-hooks */
import { Meta, StoryObj } from '@storybook/react-webpack5';
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
    title: 'Campaign created successfully',
    message: 'Your campaign "Summer Promotion" has been created and is active.',
    actions: [
      {
        action: 'open_url',
        url: 'https://example.com/campaign',
        label: 'View campaign',
      },
    ],
    caption: '1 min ago',
    tags: ['New'],
  },
  {
    id: '2',
    type: 'warning',
    title: 'Budget nearing the limit',
    message: 'Your account is using 85% of the monthly budget.',
    caption: '25 min ago',
    tags: ['New'],
  },
  {
    id: '3',
    type: 'warning',
    title: 'Account limit is close',
    message: 'Your account is using 95% of the monthly budget.',
    caption: '30 min ago',
    tags: ['New'],
  },
  {
    id: '4',
    type: 'error',
    title: 'Integration failure',
    message: 'Could not connect to the Facebook API.',
    actions: [
      {
        action: 'open_url',
        url: 'https://example.com/try-again',
        label: 'Try again',
      },
    ],
    caption: '3h ago',
  },
  {
    id: '5',
    type: 'info',
    title: 'New feature available',
    message: 'You can now monitor your spending in real time.',
    caption: '2d ago',
  },
  {
    id: '6',
    type: 'info',
    title: 'New feature available',
    message:
      'Integrated with Google Analytics for more detailed reports, accessible through the reports menu.',
    caption: '20 min ago',
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
      tag: base.tags ?? (i % 2 === 0 ? ['New'] : undefined),
    };
  });

export const Default: StoryObj = {
  args: {
    notifications: defaultNotifications,
    count: defaultNotifications.filter((n) => {
      return n.tags;
    }).length,
    onClose: () => {},
    onClearAll: () => {},
  },
};

export const Empty: StoryObj = {
  args: {
    notifications: [],
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

    const orderedScrollNotifications = React.useMemo(() => {
      return [...scrollNotifications].sort((a, b) => {
        if (a.tags && !b.tags) return -1;
        if (!a.tags && b.tags) return 1;
        return 0;
      });
    }, []);

    const loadMore = () => {
      const start = (page + 1) * pageSize;
      const end = start + pageSize;
      const nextItems = orderedScrollNotifications.slice(start, end);

      setNotifications((prev) => {
        return [...prev, ...nextItems];
      });
      setPage((prev) => {
        return prev + 1;
      });
    };

    React.useEffect(() => {
      if (isOpen) {
        const initial = orderedScrollNotifications.slice(0, pageSize);
        setNotifications(initial);
        setPage(0);
        setHasInitialized(true);
      } else {
        setNotifications([]);
        setPage(0);
        setHasInitialized(false);
      }
    }, [isOpen, orderedScrollNotifications]);

    const count = orderedScrollNotifications.filter((n) => {
      return n.tags;
    }).length;

    return (
      <NotificationsMenu
        notifications={notifications}
        hasMore={notifications.length < orderedScrollNotifications.length}
        onLoadMore={hasInitialized ? loadMore : undefined}
        onOpenChange={setIsOpen}
        count={count}
        onClose={() => {}}
        onClearAll={() => {}}
      />
    );
  },
};

export const WithCloseButton: StoryObj = {
  render: () => {
    const [notifications, setNotifications] =
      React.useState<Notification[]>(defaultNotifications);
    const [isOpen, setIsOpen] = React.useState(false);

    const handleClose = (id: string) => {
      setNotifications((prev) => {
        return prev.filter((n) => {
          return n.id !== id;
        });
      });
    };

    const handleClearAll = () => {
      setNotifications([]);
    };

    const orderedNotifications = React.useMemo(() => {
      return [...notifications].sort((a, b) => {
        if (a.tags && !b.tags) return -1;
        if (!a.tags && b.tags) return 1;
        return 0;
      });
    }, [notifications]);

    const count = orderedNotifications.filter((n) => {
      return n.tags;
    }).length;

    return (
      <NotificationsMenu
        notifications={orderedNotifications.map((n) => {
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
        count={count}
        onClearAll={handleClearAll}
      />
    );
  },
};

export const WithOCANotificationOnly: StoryObj = {
  args: {
    notifications: [
      {
        id: '7',
        title: `Sua campanha está ganhando performance!`,
        message: (
          <>
            <p>
              🎯 BOAS NOTÍCIAS! O OneClick Ads reduziu significativamente o
              Custo por Conversão da sua Campanha!
            </p>
            <p>
              Nome da Campanha:{' '}
              <strong>
                $🤖 [Simbiose Digital ON] TESTE VENDAS ADV FEVEREIRO. Campanha —
                mussela
              </strong>
            </p>
            <p>
              Nome da Conta de Anúncio: <strong>BM 02 | Ecommerce | RDD</strong>
            </p>
            <p>Custo por conversão do dia 29/08 até 11/09: R$ 37,17</p>
            <p>
              Custo por conversão dos últimos 14 dias (12/09 até 25/09) com o
              OneClick Ads: R$ 32,86
            </p>
            <p>Redução total no Custo por Conversão: 12%</p>
            <p>
              🚀 Continue otimizando mais campanhas com o OneClickAds para
              manter a performance e escalar suas campanhas!
            </p>
            <p>
              Precisa de ajuda?{' '}
              <a
                href="https://api.whatsapp.com/send?phone=5516936180293&text=%22Ol%C3%A1,%20Sou%20usuario%20ativo%20e%20tenho%20perguntas%20sobre%20o%20OneClick%20Ads.%20Podem%20me%20orientar?%22"
                target="_blank"
                rel="noreferrer"
              >
                Clique aqui
              </a>{' '}
              para falar com nossos especialistas.
            </p>
          </>
        ),
        type: 'success',
        caption: '20 min ago',
        tags: ['Nova'],
      },
      {
        id: '8',
        title: `Sua Conta de Anúncios está ESCALANDO! 🚀`,
        message: (
          <>
            <p>
              🎯 BOAS NOTÍCIAS! Usando o OneClick Ads você está escalando mais
              seus anúncios!
            </p>
            <p>
              Conta de Anúncios: <strong>Conta Tannus</strong>
            </p>
            <p>Investimento do dia 20/09 até 22/09: R$ 656,10</p>
            <p>
              Investimento dos últimos 3 dias (23/09 até 25/09) com o OneClick
              Ads: R$ 1.176,84
            </p>
            <p>
              Aumento de <strong>79%</strong> no investimento!
            </p>
            <p>
              🚀 Continue otimizando mais campanhas com o OneClickAds para
              manter a performance e escalar suas campanhas!
            </p>
            <p>
              Precisa de ajuda?{' '}
              <a
                href="https://api.whatsapp.com/send?phone=5516936180293&text=%22Ol%C3%A1,%20Sou%20usuario%20ativo%20e%20tenho%20perguntas%20sobre%20o%20OneClick%20Ads.%20Podem%20me%20orientar?%22"
                target="_blank"
                rel="noreferrer"
              >
                Clique aqui
              </a>{' '}
              para falar com nossos especialistas.
            </p>
          </>
        ),
        type: 'success',
        caption: 'há 7 dias',
        tags: ['Nova'],
      },
    ],
    count: 2,
    onClose: () => {},
    onClearAll: () => {},
  },
};
