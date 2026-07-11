import { NotificationsMenu } from '@ttoss/components';
import { fireEvent, render, screen } from '@ttoss/test-utils/react';

const baseNotification = {
  id: '1',
  type: 'info' as const,
  message: 'Test notification',
};

describe('NotificationsMenu', () => {
  test('renders bell button', () => {
    render(<NotificationsMenu notifications={[]} count={0} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('shows count badge when count > 0', () => {
    render(<NotificationsMenu notifications={[]} count={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  test('shows 99+ when count exceeds 99', () => {
    render(<NotificationsMenu notifications={[]} count={150} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  test('does not show badge when count is 0', () => {
    render(<NotificationsMenu notifications={[]} count={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  test('opens panel on bell click', () => {
    render(<NotificationsMenu notifications={[baseNotification]} count={1} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText('Test notification')).toBeInTheDocument();
  });

  test('shows empty state message when no notifications', () => {
    render(<NotificationsMenu notifications={[]} count={0} defaultOpen />);
    expect(screen.getByText('Nenhuma notificação')).toBeInTheDocument();
  });

  test('calls onOpenChange when toggled', () => {
    const onOpenChange = jest.fn();
    render(
      <NotificationsMenu
        notifications={[]}
        count={0}
        onOpenChange={onOpenChange}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  test('shows clear all button when onClearAll and notifications provided', () => {
    const onClearAll = jest.fn();
    render(
      <NotificationsMenu
        notifications={[baseNotification]}
        count={1}
        defaultOpen
        onClearAll={onClearAll}
      />
    );
    const clearBtn = screen.getByText('Limpar Tudo');
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn.closest('button')!);
    expect(onClearAll).toHaveBeenCalledTimes(1);
  });

  test('renders defaultOpen=true', () => {
    render(
      <NotificationsMenu
        notifications={[baseNotification]}
        count={1}
        defaultOpen
      />
    );
    expect(screen.getByText('Test notification')).toBeInTheDocument();
  });

  test('closes panel on outside click', () => {
    render(
      <div>
        <NotificationsMenu
          notifications={[baseNotification]}
          count={1}
          defaultOpen
        />
        <div data-testid="outside">outside</div>
      </div>
    );
    expect(screen.getByText('Test notification')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(screen.queryByText('Test notification')).not.toBeInTheDocument();
  });

  test('notification onClose calls parent onClose', () => {
    const onClose = jest.fn();
    const notifWithClose = {
      ...baseNotification,
      title: 'Notif',
      onClose: jest.fn(),
    };
    render(
      <NotificationsMenu
        notifications={[notifWithClose]}
        count={1}
        defaultOpen
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(notifWithClose.onClose).toHaveBeenCalledTimes(1);
  });
});
