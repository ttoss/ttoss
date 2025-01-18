import { render, screen, userEvent } from '@ttoss/test-utils';
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

    Array.from({
      length: numberOfMessages,
    }).forEach((_, idx) => {
      expect(
        screen.getByText(`${NOTIFICATION_MESSAGE}-${idx + 1}`)
      ).toBeInTheDocument();
    });
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
});
