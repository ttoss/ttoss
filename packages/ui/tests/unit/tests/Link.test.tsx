import { Link } from '../../../src';
import { render, screen } from '@ttoss/test-utils';

const CONTENT_LINK = 'Link Text';

test('should render Link with quiet class', () => {
  render(<Link quiet>{CONTENT_LINK}</Link>);

  const linkEl = screen.getByText(CONTENT_LINK);

  expect(linkEl).toBeInTheDocument();
  expect(linkEl).toHaveClass('quiet');
});
