import { NotificationsBox, useNotifications } from '../../src';
import { NotificationsProvider, type NotifyParams } from '../../src/Provider';
import { render, screen, userEvent } from '@ttoss/test-utils';

const NOTIFICATION_MESSAGE = 'notification message test';

describe('Notifications Box Test', () => {
  const user = userEvent.setup({ delay: null });

  const Component = ({
    notifications,
  }: {
    notifications: NotifyParams | NotifyParams[];
  }) => {
    const { setNotifications } = useNotifications();

    return (
      <div>
        <NotificationsBox />
        <button
          onClick={() => {
            setNotifications(notifications);
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
        notifications={{ message: NOTIFICATION_MESSAGE, type: 'error' }}
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
        }).map<NotifyParams>((_, idx) => {
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

  test('Should resolve repeated notifications correctly', async () => {
    const repeatedNotifications: Array<NotifyParams> = [
      { message: 'single message', type: 'error' },
      { message: 'single message', type: 'error' },
    ];

    render(<Component notifications={repeatedNotifications} />, {
      wrapper: NotificationsProvider,
    });

    expect(screen.getByRole('button')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));

    const elements = screen.getAllByText('single message');

    expect(elements.length).toBe(2);

    await user.click(elements[0]);

    expect(screen.getByText('single message')).toBeInTheDocument();
  });

  test('Should resolve notifications with the same key', async () => {
    const keyedNotifications: Array<NotifyParams> = [
      { message: 'single message', type: 'error', key: 'message' },
      { message: 'single message', type: 'error', key: 'message' },
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
