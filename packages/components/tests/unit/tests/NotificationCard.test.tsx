/* eslint-disable prefer-arrow-functions/prefer-arrow-functions, react/prop-types, @typescript-eslint/no-explicit-any, react/display-name, formatjs/no-literal-string-in-jsx */
import { NotificationCard } from '@ttoss/components/NotificationCard';
import { fireEvent, render, screen } from '@ttoss/test-utils/react';

jest.mock('@ttoss/react-icons', () => ({
  Icon: ({ icon }: { icon: string }) => <span data-testid="icon">{icon}</span>,
}));

jest.mock('@ttoss/ui', () => {
  const mockBox = ({ children, sx }: any) => (
    <div data-testid="box" data-sx={JSON.stringify(sx)}>
      {children}
    </div>
  );

  const mockCard: any = ({ children, sx }: any) => (
    <div data-testid="card" data-sx={JSON.stringify(sx)}>
      {children}
    </div>
  );

  mockCard.Title = ({ children, sx }: any) => (
    <div data-testid="card-title" data-sx={JSON.stringify(sx)}>
      {children}
    </div>
  );

  mockCard.Body = ({ children, sx }: any) => (
    <div data-testid="card-body" data-sx={JSON.stringify(sx)}>
      {children}
    </div>
  );

  const mockCloseButton = ({ onClick }: any) => (
    <button type="button" onClick={onClick}>
      close
    </button>
  );

  const mockLink = ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );

  const mockTag = ({ children }: any) => <span>{children}</span>;

  const mockText = ({ children, sx }: any) => (
    <span data-sx={JSON.stringify(sx)}>{children}</span>
  );

  return {
    Box: mockBox,
    Card: mockCard,
    CloseButton: mockCloseButton,
    Link: mockLink,
    Tag: mockTag,
    Text: mockText,
  };
});

describe('NotificationCard size', () => {
  const getSx = (testId: string) =>
    JSON.parse(screen.getByTestId(testId).getAttribute('data-sx') || '{}');

  const renderComponent = (size?: 'auto' | 'sm' | 'md' | 'lg') => {
    render(
      <NotificationCard
        type="info"
        title="Notification title"
        message="Notification message"
        size={size}
      />
    );
  };

  test('uses auto size styles by default', () => {
    renderComponent();

    expect(getSx('card-title').fontSize).toEqual(['md', 'xl']);
    expect(getSx('card-body').paddingY).toEqual(['1', '2', '4']);
    expect(getSx('card-body').paddingX).toEqual(['2', '4', '8']);

    const messageText = screen.getByText('Notification message');
    expect(
      JSON.parse(messageText.getAttribute('data-sx') || '{}').fontSize
    ).toEqual(['sm', 'md']);
  });

  test('uses fixed small size styles when size is sm', () => {
    renderComponent('sm');

    expect(getSx('card-title').fontSize).toBe('md');
    expect(getSx('card-body').paddingY).toBe('1');
    expect(getSx('card-body').paddingX).toBe('2');

    const messageText = screen.getByText('Notification message');
    expect(
      JSON.parse(messageText.getAttribute('data-sx') || '{}').fontSize
    ).toBe('sm');
  });

  test('renders tags, actions, caption with functional close button', () => {
    const onClose = jest.fn();

    render(
      <NotificationCard
        type="success"
        title="Notification title"
        message="Notification message"
        tags={['tag-1', 'tag-2']}
        actions={[
          {
            action: 'open_url',
            label: 'Open link',
            url: 'https://example.com',
          },
        ]}
        caption="Notification caption"
        onClose={onClose}
      />
    );

    expect(screen.getByText('tag-1')).toBeInTheDocument();
    expect(screen.getByText('tag-2')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open link' })).toHaveAttribute(
      'href',
      'https://example.com'
    );
    expect(screen.getByText('Notification caption')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('renders non-array tags and skips unsupported actions', () => {
    render(
      <NotificationCard
        type="info"
        title="Notification title"
        message="Notification message"
        tags="single-tag"
        actions={[
          { action: 'invalid_action' as any, label: 'unsupported action' },
        ]}
      />
    );

    expect(screen.getByText('single-tag')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  test('renders close button in body when title is not provided', () => {
    const onClose = jest.fn();

    render(
      <NotificationCard
        type="warning"
        message="Notification message"
        onClose={onClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
