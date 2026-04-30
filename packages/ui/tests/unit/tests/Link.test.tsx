import { render, screen } from '@ttoss/test-utils/react';
import { Link as LinkUi } from 'theme-ui';

import { Link } from '../../../src';

const CONTENT_LINK = 'Link Text';

jest.mock('theme-ui', () => {
  const actual = jest.requireActual('theme-ui');

  return {
    ...actual,
    Link: jest.fn(({ children, className, ...props }) => {
      return (
        <a className={className} data-testid="theme-ui-link" {...props}>
          {children}
        </a>
      );
    }),
  };
});

afterEach(() => {
  jest.mocked(LinkUi).mockClear();
});

test('should render Link with quiet class', () => {
  render(<Link quiet>{CONTENT_LINK}</Link>);

  const linkEl = screen.getByText(CONTENT_LINK);

  expect(linkEl).toBeInTheDocument();
  expect(linkEl).toHaveClass('quiet');
});

test('should use a more visible visited color by default', () => {
  render(<Link href="https://ttoss.dev">{CONTENT_LINK}</Link>);

  const themeUiLinkProps = jest.mocked(LinkUi).mock.calls[0]?.[0];

  expect(themeUiLinkProps).toMatchObject({
    sx: {
      ':visited': {
        color: 'navigation.text.primary.default',
      },
      '&.warning:visited': {
        color: 'feedback.text.caution.default',
      },
    },
  });
});

test('should keep custom visited styles when provided', () => {
  render(
    <Link
      href="https://ttoss.dev"
      sx={{
        fontWeight: 'bold',
        ':visited': {
          color: 'display.text.secondary.default',
        },
      }}
    >
      {CONTENT_LINK}
    </Link>
  );

  const themeUiLinkProps = jest.mocked(LinkUi).mock.calls[0]?.[0];

  expect(themeUiLinkProps).toMatchObject({
    sx: {
      fontWeight: 'bold',
      ':visited': {
        color: 'display.text.secondary.default',
      },
      '&.warning:visited': {
        color: 'feedback.text.caution.default',
      },
    },
  });
});
