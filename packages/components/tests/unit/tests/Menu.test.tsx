import { fireEvent, render, screen } from '@ttoss/test-utils';

import { Menu } from '../../../src/components/Menu';

describe('Menu', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  test('should call onClose when close icon is clicked', () => {
    render(
      <Menu
        onOpen={() => {
          return null;
        }}
        isOpen={true}
        onClose={mockOnClose}
        srcLogo="logo.png"
      >
        <div>Menu Content</div>
      </Menu>
    );

    fireEvent.click(screen.getByTestId('button'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('should display the logo when srcLogo is provided', () => {
    const logoSrc = 'logo.png';
    render(
      <Menu
        onOpen={() => {
          return null;
        }}
        isOpen={true}
        onClose={mockOnClose}
        srcLogo={logoSrc}
      >
        <div>Menu Content</div>
      </Menu>
    );

    expect(screen.getByTestId('img')).toHaveAttribute('src', logoSrc);
  });

  test('should render children correctly', () => {
    render(
      <Menu
        onOpen={() => {
          return null;
        }}
        isOpen={true}
        onClose={mockOnClose}
      >
        <div>Child Component</div>
      </Menu>
    );

    expect(screen.getByText('Child Component')).toBeInTheDocument();
  });
});
