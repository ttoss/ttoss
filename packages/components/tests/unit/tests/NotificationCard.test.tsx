/* eslint-disable prefer-arrow-functions/prefer-arrow-functions, react/prop-types, @typescript-eslint/no-explicit-any, react/display-name, formatjs/no-literal-string-in-jsx */
import { NotificationCard } from '@ttoss/components/NotificationCard';
import { render, screen } from '@ttoss/test-utils/react';

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
});
