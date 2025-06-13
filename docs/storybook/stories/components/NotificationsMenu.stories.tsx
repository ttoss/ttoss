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
    tag: ['New'],
  },
  {
    id: '2',
    type: 'warning',
    title: 'Budget nearing the limit',
    message: 'Your account is using 85% of the monthly budget.',
    caption: '25 min ago',
    tag: ['New'],
  },
  {
    id: '3',
    type: 'warning',
    title: 'Account limit is close',
    message: 'Your account is using 95% of the monthly budget.',
    caption: '30 min ago',
    tag: ['New'],
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
      tag: base.tag ?? (i % 2 === 0 ? 'New' : undefined),
    };
  });

export const Default: StoryObj = {
  args: {
    notifications: defaultNotifications,
    count: defaultNotifications.filter((n) => {
      return n.tag;
    }).length,
    onClose: () => {},
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
        if (a.tag && !b.tag) return -1;
        if (!a.tag && b.tag) return 1;
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
      return n.tag;
    }).length;

    return (
      <NotificationsMenu
        notifications={notifications}
        hasMore={notifications.length < orderedScrollNotifications.length}
        onLoadMore={hasInitialized ? loadMore : undefined}
        onOpenChange={setIsOpen}
        count={count}
        onClose={() => {}}
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

    const orderedNotifications = React.useMemo(() => {
      return [...notifications].sort((a, b) => {
        if (a.tag && !b.tag) return -1;
        if (!a.tag && b.tag) return 1;
        return 0;
      });
    }, [notifications]);

    const count = orderedNotifications.filter((n) => {
      return n.tag;
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
      />
    );
  },
};
