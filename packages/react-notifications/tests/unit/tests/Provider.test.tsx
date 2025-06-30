import { render, screen, userEvent } from '@ttoss/test-utils';
import { NotificationsProvider, useNotifications } from 'src/index';

const PERSISTENT_MESSAGE = 'persistent notification';
const REGULAR_MESSAGE = 'regular notification';

describe('NotificationsProvider - clearNotifications with persist', () => {
  const user = userEvent.setup({ delay: null });

  const TestComponent = () => {
    const { addNotification, clearNotifications, notifications } =
      useNotifications();

    return (
      <div>
        <button
          onClick={() => {
            addNotification({
              message: REGULAR_MESSAGE,
              type: 'info',
              persist: false,
            });
          }}
          data-testid="add-regular"
          type="button"
        />

        <button
          onClick={() => {
            addNotification({
              message: PERSISTENT_MESSAGE,
              type: 'info',
              persist: true,
            });
          }}
          data-testid="add-persistent"
          type="button"
        />

        <button
          onClick={clearNotifications}
          data-testid="clear-all"
          type="button"
        />

        <div data-testid="notifications-count">
          {notifications?.length || 0}
        </div>

        <div data-testid="notifications-list">
          {notifications?.map((notification) => {
            return (
              <div
                key={notification.id}
                data-testid={`notification-${notification.id}`}
              >
                {notification.message}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  test('should remove only non-persistent notifications when clearNotifications is called', async () => {
    render(
      <NotificationsProvider>
        <TestComponent />
      </NotificationsProvider>
    );

    await user.click(screen.getByTestId('add-regular'));

    await user.click(screen.getByTestId('add-persistent'));

    expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
    expect(screen.getByText(REGULAR_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(PERSISTENT_MESSAGE)).toBeInTheDocument();

    await user.click(screen.getByTestId('clear-all'));

    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
    expect(screen.queryByText(REGULAR_MESSAGE)).not.toBeInTheDocument();
    expect(screen.getByText(PERSISTENT_MESSAGE)).toBeInTheDocument();
  });

  test('should remove all notifications when none are persistent', async () => {
    render(
      <NotificationsProvider>
        <TestComponent />
      </NotificationsProvider>
    );

    await user.click(screen.getByTestId('add-regular'));
    await user.click(screen.getByTestId('add-regular'));

    expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');

    await user.click(screen.getByTestId('clear-all'));

    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
    expect(screen.queryByText(REGULAR_MESSAGE)).not.toBeInTheDocument();
  });

  test('should keep all notifications when all are persistent', async () => {
    render(
      <NotificationsProvider>
        <TestComponent />
      </NotificationsProvider>
    );

    await user.click(screen.getByTestId('add-persistent'));
    await user.click(screen.getByTestId('add-persistent'));

    expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');

    await user.click(screen.getByTestId('clear-all'));

    expect(screen.getByTestId('notifications-count')).toHaveTextContent('2');
    expect(screen.getAllByText(PERSISTENT_MESSAGE)).toHaveLength(2);
  });
});
