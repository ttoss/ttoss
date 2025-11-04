import { render, screen } from '@ttoss/test-utils/react';
import { Layout } from 'src/index';

describe('MainHeader', () => {
  test('should render MainHeader with correct semantic element', () => {
    render(<Layout.Main.Header>Main Header Content</Layout.Main.Header>);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Main Header Content');
  });
});

describe('MainFooter', () => {
  test('should render MainFooter with correct semantic element', () => {
    render(<Layout.Main.Footer>Main Footer Content</Layout.Main.Footer>);

    const footer = screen.getByText('Main Footer Content');
    expect(footer).toBeInTheDocument();
  });
});

describe('MainBody', () => {
  test('should render MainBody with correct semantic element', () => {
    render(<Layout.Main.Body>Main Body Content</Layout.Main.Body>);

    const body = screen.getByText('Main Body Content');
    expect(body).toBeInTheDocument();
  });
});
