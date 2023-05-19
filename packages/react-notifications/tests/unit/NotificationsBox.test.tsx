import { NotificationsBox, useNotifications } from '../../src';
import { NotificationsProvider, type NotifyParams } from '../../src/Provider';
import { render, screen, userEvent } from '@ttoss/test-utils';

const NOTIFICATION_MESSAGE = 'notification message test';

test('should render single notification message', async () => {
  const user = userEvent.setup({ delay: null });

  const Component = () => {
    const { setNotifications } = useNotifications();

    return (
      <div>
        <NotificationsBox />
        <button
          onClick={() => {
            setNotifications({ message: NOTIFICATION_MESSAGE, type: 'error' });
          }}
          type="button"
        >
          click
        </button>
      </div>
    );
  };

  render(<Component />, { wrapper: NotificationsProvider });

  expect(screen.getByRole('button')).toBeInTheDocument();

  await user.click(screen.getByRole('button'));

  expect(screen.getByText(NOTIFICATION_MESSAGE)).toBeInTheDocument();
});

test('should render a list of notification messages', async () => {
  const user = userEvent.setup({ delay: null });

  const numberOfMessages = 5;

  const Component = () => {
    const { setNotifications } = useNotifications();

    return (
      <div>
        <NotificationsBox />
        <button
          onClick={() => {
            const list: NotifyParams[] = Array.from({
              length: numberOfMessages,
            }).map((_, idx) => {
              return {
                message: `${NOTIFICATION_MESSAGE}-${idx + 1}`,
                type: 'error',
              };
            });

            setNotifications(list);
          }}
          type="button"
        >
          click
        </button>
      </div>
    );
  };

  render(<Component />, { wrapper: NotificationsProvider });

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
