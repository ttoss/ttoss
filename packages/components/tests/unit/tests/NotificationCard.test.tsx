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

  test('renders actions with open_url', () => {
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
    const link = screen.getByText('Click here');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', 'https://example.com');
  });

  test('renders action without label uses default label', () => {
    render(
      <NotificationCard
        type="info"
        message="See details"
        actions={[{ action: 'open_url', url: 'https://example.com' }]}
      />
    );
    expect(screen.getByText('Acessar')).toBeInTheDocument();
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
