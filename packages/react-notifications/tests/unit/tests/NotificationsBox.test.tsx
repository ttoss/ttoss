import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { NotificationsBox, useNotifications } from 'src/index';
import { type Notification, NotificationsProvider } from 'src/Provider';

const NOTIFICATION_MESSAGE = 'notification message test';

describe('Notifications Box Test', () => {
  const user = userEvent.setup({ delay: null });

  const Component = ({
    notifications,
  }: {
    notifications: Notification | Notification[];
  }) => {
    const { addNotification } = useNotifications();

    return (
      <div>
        <NotificationsBox />
        <button
          onClick={() => {
            addNotification(notifications);
          }}
          type="button"
        >
          click
        </button>
      </div>
    );
  };

  test('should render single notification message', async () => {
    render(
      <Component
        notifications={{
          message: NOTIFICATION_MESSAGE,
          type: 'error',
        }}
      />,
      { wrapper: NotificationsProvider }
    );

    expect(screen.getByRole('button')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));

    expect(screen.getByText(NOTIFICATION_MESSAGE)).toBeInTheDocument();
  });

  test('should render a list of notification messages', async () => {
    const numberOfMessages = 5;

    render(
      <Component
        notifications={Array.from({
          length: numberOfMessages,
        }).map<Notification>((_, idx) => {
          return {
            message: `${NOTIFICATION_MESSAGE}-${idx + 1}`,
            type: 'error',
          };
        })}
      />,
      {
        wrapper: NotificationsProvider,
      }
    );

    expect(screen.getByRole('button')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));

    for (const [idx] of Array.from({
      length: numberOfMessages,
    }).entries()) {
      expect(
        screen.getByText(`${NOTIFICATION_MESSAGE}-${idx + 1}`)
      ).toBeInTheDocument();
    }
  });

  test('Should resolve notifications with the same key', async () => {
    const keyedNotifications: Array<Notification> = [
      { message: 'single message', type: 'error', id: 'message' },
      { message: 'single message', type: 'error', id: 'message' },
    ];

    render(<Component notifications={keyedNotifications} />, {
      wrapper: NotificationsProvider,
    });

    expect(screen.getByRole('button')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));

    const elements = screen.getAllByText('single message');

    expect(elements.length).toBe(1);
  });

  test('should not render notifications with non-box viewType when defaultViewType is not box', async () => {
    // When defaultViewType is 'modal' and notification viewType is 'header',
    // the NotificationsBox should not show the notification (both are non-box)
    const ComponentWithNonBoxTypes = () => {
      const { addNotification } = useNotifications();

      return (
        <div>
          <div data-testid="box-container">
            <NotificationsBox />
          </div>
          <button
            onClick={() => {
              addNotification({
                message: 'Header notification',
                type: 'info',
                viewType: 'header',
              });
            }}
            type="button"
          >
            add
          </button>
        </div>
      );
    };

    render(
      <NotificationsProvider defaultViewType="modal">
        <ComponentWithNonBoxTypes />
      </NotificationsProvider>
    );

    const boxContainer = screen.getByTestId('box-container');

    // Initially empty
    expect(boxContainer.textContent).toBe('');

    await user.click(screen.getByRole('button'));

    // NotificationsBox should still be empty because viewType='header'
    // and defaultViewType='modal' are both non-box
    expect(boxContainer.textContent).toBe('');
  });

  test('should not render notifications with boxId when NotificationsBox has no id', async () => {
    const ComponentWithBoxId = () => {
      const { addNotification } = useNotifications();

      return (
        <div>
          <NotificationsBox />
          <button
            onClick={() => {
              addNotification({
                message: 'Boxed notification',
                type: 'info',
                boxId: 'specific-box',
              });
            }}
            type="button"
          >
            add
          </button>
        </div>
      );
    };

    render(
      <NotificationsProvider>
        <ComponentWithBoxId />
      </NotificationsProvider>
    );

    await user.click(screen.getByRole('button'));

    expect(screen.queryByText('Boxed notification')).not.toBeInTheDocument();
  });

  test('should render notifications with matching boxId', async () => {
    const ComponentWithMatchingBoxId = () => {
      const { addNotification } = useNotifications();

      return (
        <div>
          <NotificationsBox id="box-1" />
          <button
            onClick={() => {
              addNotification({
                message: 'Box 1 notification',
                type: 'success',
                boxId: 'box-1',
              });
            }}
            type="button"
          >
            add
          </button>
        </div>
      );
    };

    render(
      <NotificationsProvider>
        <ComponentWithMatchingBoxId />
      </NotificationsProvider>
    );

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Box 1 notification')).toBeInTheDocument();
  });

  test('should not render notifications with non-matching boxId', async () => {
    const ComponentWithNonMatchingBoxId = () => {
      const { addNotification } = useNotifications();

      return (
        <div>
          <NotificationsBox id="box-1" />
          <button
            onClick={() => {
              addNotification({
                message: 'Box 2 notification',
                type: 'warning',
                boxId: 'box-2',
              });
            }}
            type="button"
          >
            add
          </button>
        </div>
      );
    };

    render(
      <NotificationsProvider>
        <ComponentWithNonMatchingBoxId />
      </NotificationsProvider>
    );

    await user.click(screen.getByRole('button'));

    expect(screen.queryByText('Box 2 notification')).not.toBeInTheDocument();
  });

  test('should render notifications passed directly via props', () => {
    const directNotifications: Notification[] = [
      { id: 1, message: 'Direct notification 1', type: 'info' },
      { id: 2, message: 'Direct notification 2', type: 'success' },
    ];

    render(
      <NotificationsProvider>
        <NotificationsBox notifications={directNotifications} />
      </NotificationsProvider>
    );

    expect(screen.getByText('Direct notification 1')).toBeInTheDocument();
    expect(screen.getByText('Direct notification 2')).toBeInTheDocument();
  });

  test('should handle removing notification by clicking close button', async () => {
    const ComponentWithClose = () => {
      const { addNotification } = useNotifications();

      return (
        <div>
          <NotificationsBox />
          <button
            onClick={() => {
              addNotification({
                message: 'Closable notification',
                type: 'info',
                id: 'closable-1',
              });
            }}
            type="button"
          >
            add
          </button>
        </div>
      );
    };

    render(
      <NotificationsProvider>
        <ComponentWithClose />
      </NotificationsProvider>
    );

    await user.click(screen.getByRole('button', { name: 'add' }));

    expect(screen.getByText('Closable notification')).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(screen.queryByText('Closable notification')).not.toBeInTheDocument();
  });

  test('should render with title when provided', async () => {
    const ComponentWithTitle = () => {
      const { addNotification } = useNotifications();

      return (
        <div>
          <NotificationsBox />
          <button
            onClick={() => {
              addNotification({
                title: 'Important Title',
                message: 'Message with title',
                type: 'error',
              });
            }}
            type="button"
          >
            add
          </button>
        </div>
      );
    };

    render(
      <NotificationsProvider>
        <ComponentWithTitle />
      </NotificationsProvider>
    );

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Important Title')).toBeInTheDocument();
    expect(screen.getByText('Message with title')).toBeInTheDocument();
  });

  test('should handle multiple boxes with different ids correctly', async () => {
    const ComponentWithMultipleBoxes = () => {
      const { addNotification } = useNotifications();

      return (
        <div>
          <div data-testid="box-1">
            <NotificationsBox id="box-1" />
          </div>
          <div data-testid="box-2">
            <NotificationsBox id="box-2" />
          </div>
          <div data-testid="box-default">
            <NotificationsBox />
          </div>
          <button
            onClick={() => {
              addNotification([
                { message: 'For box 1', type: 'info', boxId: 'box-1' },
                { message: 'For box 2', type: 'success', boxId: 'box-2' },
                { message: 'For default box', type: 'warning' },
              ]);
            }}
            type="button"
          >
            add all
          </button>
        </div>
      );
    };

    render(
      <NotificationsProvider>
        <ComponentWithMultipleBoxes />
      </NotificationsProvider>
    );

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('For box 1')).toBeInTheDocument();
    expect(screen.getByText('For box 2')).toBeInTheDocument();
    expect(screen.getByText('For default box')).toBeInTheDocument();
  });
});
