import { render, screen } from '@ttoss/test-utils/react';
import { Layout } from 'src/index';

describe('MainHeader', () => {
  test('should render MainHeader with correct semantic element', () => {
    render(<Layout.Main.Header>Main Header Content</Layout.Main.Header>);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveTextContent('Main Header Content');
  });

  test('should apply containerSx to the inner Container component', () => {
    render(
      <Layout.Main.Header containerSx={{ padding: '10px' }}>
        Main Header Content
      </Layout.Main.Header>
    );

    const container = screen.getByTestId('main-header-container');
    expect(container).toHaveStyle({ padding: '10px' });
  });
});

describe('MainFooter', () => {
  test('should render MainFooter with correct semantic element', () => {
    render(<Layout.Main.Footer>Main Footer Content</Layout.Main.Footer>);

    const footer = screen.getByText('Main Footer Content');
    expect(footer).toBeInTheDocument();
  });

  test('should apply containerSx to the inner Container component', () => {
    render(
      <Layout.Main.Footer containerSx={{ padding: '10px' }}>
        Main Footer Content
      </Layout.Main.Footer>
    );

    const container = screen.getByTestId('main-footer-container');
    expect(container).toHaveStyle({ padding: '10px' });
  });
});

describe('MainBody', () => {
  test('should render MainBody with correct semantic element', () => {
    render(<Layout.Main.Body>Main Body Content</Layout.Main.Body>);

    const body = screen.getByText('Main Body Content');
    expect(body).toBeInTheDocument();
  });

  test('should apply containerSx to the inner Container component', () => {
    render(
      <Layout.Main.Body containerSx={{ padding: '10px' }}>
        Main Body Content
      </Layout.Main.Body>
    );

    const container = screen.getByTestId('main-body-container');
    expect(container).toHaveStyle({ padding: '10px' });
  });
});
