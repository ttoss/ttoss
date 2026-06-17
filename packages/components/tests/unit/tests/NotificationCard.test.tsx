import { NotificationCard } from '@ttoss/components';
import { fireEvent, render, screen } from '@ttoss/test-utils/react';

describe('NotificationCard', () => {
  test('renders message', () => {
    render(<NotificationCard type="info" message="Test message" />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  test('renders title when provided', () => {
    render(
      <NotificationCard type="success" title="Alert Title" message="Body" />
    );
    expect(screen.getByText('Alert Title')).toBeInTheDocument();
  });

  test('calls onClose when close button clicked (with title)', () => {
    const onClose = jest.fn();
    render(
      <NotificationCard
        type="error"
        title="Error"
        message="Something failed"
        onClose={onClose}
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when close button clicked (without title)', () => {
    const onClose = jest.fn();
    render(
      <NotificationCard type="warning" message="Watch out" onClose={onClose} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('renders actions with open_url as buttons that open the url', () => {
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => {
      return null;
    });

    render(
      <NotificationCard
        type="info"
        message="See details"
        actions={[
          {
            action: 'open_url',
            url: 'https://example.com',
            label: 'Click here',
          },
        ]}
      />
    );

    const actionButton = screen.getByRole('button', { name: 'Click here' });
    expect(actionButton).toBeInTheDocument();
    fireEvent.click(actionButton);
    expect(windowOpenSpy).toHaveBeenCalledWith('https://example.com', '_blank');

    windowOpenSpy.mockRestore();
  });

  test('renders action without label uses default label', () => {
    render(
      <NotificationCard
        type="info"
        message="See details"
        actions={[{ action: 'open_url', url: 'https://example.com' }]}
      />
    );
    expect(screen.getByRole('button', { name: 'Acessar' })).toBeInTheDocument();
  });

  test('renders nothing for actions when array is empty', () => {
    render(<NotificationCard type="info" message="msg" actions={[]} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('renders nothing for action without open_url type', () => {
    render(
      <NotificationCard
        type="info"
        message="msg"
        actions={[{ url: 'https://example.com', label: 'Click' }]}
      />
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  test('renders nothing when empty tags array is passed', () => {
    render(
      <NotificationCard type="info" title="Title" message="msg" tags={[]} />
    );
    expect(document.querySelectorAll('[class*="tag"]').length).toBe(0);
  });

  test('renders multiple actions as separate buttons', () => {
    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation(() => {
      return null;
    });

    render(
      <NotificationCard
        type="warning"
        message="Action required"
        actions={[
          { action: 'open_url', url: 'https://example.com/a', label: 'View' },
          {
            action: 'open_url',
            url: 'https://example.com/b',
            label: 'Dismiss',
          },
        ]}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'View' }));
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://example.com/a',
      '_blank'
    );

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(windowOpenSpy).toHaveBeenCalledWith(
      'https://example.com/b',
      '_blank'
    );

    windowOpenSpy.mockRestore();
  });

  test('renders caption when provided', () => {
    render(
      <NotificationCard type="neutral" message="msg" caption="2 hours ago" />
    );
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  test('renders string tags', () => {
    render(
      <NotificationCard
        type="success"
        title="Title"
        message="msg"
        tags={['urgent', 'new']}
      />
    );
    expect(screen.getByText('urgent')).toBeInTheDocument();
    expect(screen.getByText('new')).toBeInTheDocument();
  });

  test('renders ReactNode tags', () => {
    render(
      <NotificationCard
        type="info"
        title="Title"
        message="msg"
        tags={<span>custom-tag</span>}
      />
    );
    expect(screen.getByText('custom-tag')).toBeInTheDocument();
  });

  test('renders all notification types without crashing', () => {
    const types = ['success', 'error', 'warning', 'info', 'neutral'] as const;
    for (const type of types) {
      const { unmount } = render(
        <NotificationCard type={type} message={`${type} message`} />
      );
      expect(screen.getByText(`${type} message`)).toBeInTheDocument();
      unmount();
    }
  });
});
