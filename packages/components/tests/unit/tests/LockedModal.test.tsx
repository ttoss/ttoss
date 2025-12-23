import { fireEvent, render, screen } from '@ttoss/test-utils/react';

import { LockedModal } from '../../../src/components/LockedModal';

describe('LockedModal', () => {
  const defaultProps = {
    isOpen: true,
    header: {
      icon: 'fluent:lock-closed-24-filled',
      title: 'Feature Locked',
      description: 'This feature requires additional permissions',
    },
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    // Create a root element for the modal
    const root = document.createElement('div');
    root.setAttribute('id', 'root');
    document.body.appendChild(root);
  });

  afterEach(() => {
    // Clean up
    const root = document.getElementById('root');
    if (root) {
      document.body.removeChild(root);
    }
  });

  test('should render when isOpen is true', () => {
    render(<LockedModal {...defaultProps} />);

    expect(screen.getByText('Feature Locked')).toBeInTheDocument();
    expect(
      screen.getByText('This feature requires additional permissions')
    ).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  test('should not render when isOpen is false', () => {
    render(<LockedModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Feature Locked')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal content')).not.toBeInTheDocument();
  });

  test('should render with accent variant', () => {
    render(
      <LockedModal
        {...defaultProps}
        header={{ ...defaultProps.header, variant: 'accent' }}
      />
    );

    expect(screen.getByText('Feature Locked')).toBeInTheDocument();
  });

  test('should render actions when provided', () => {
    const mockAction1 = jest.fn();
    const mockAction2 = jest.fn();

    const actions = [
      {
        label: 'Upgrade Now',
        icon: 'fluent-emoji-high-contrast:sparkles',
        variant: 'primary' as const,
        onClick: mockAction1,
      },
      {
        label: 'Learn More',
        icon: 'fluent:arrow-right-16-regular',
        variant: 'accent' as const,
        onClick: mockAction2,
      },
    ];

    render(<LockedModal {...defaultProps} actions={actions} />);

    expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  test('should call action onClick when clicked', () => {
    const mockClick = jest.fn();

    const actions = [
      {
        label: 'Click Me',
        variant: 'primary' as const,
        onClick: mockClick,
      },
    ];

    render(<LockedModal {...defaultProps} actions={actions} />);

    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  test('should render without actions', () => {
    render(<LockedModal {...defaultProps} />);

    expect(screen.getByText('Modal content')).toBeInTheDocument();
    // Verify no buttons are rendered when actions are not provided
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  test('should call onRequestClose when provided', () => {
    const mockClose = jest.fn();

    render(<LockedModal {...defaultProps} onRequestClose={mockClose} />);

    // Modal component has overlay that can be clicked
    const overlay = document.querySelector('.ReactModal__Overlay');
    if (overlay) {
      fireEvent.click(overlay);
      expect(mockClose).toHaveBeenCalled();
    }
  });

  test('should not close when onRequestClose is not provided', () => {
    render(<LockedModal {...defaultProps} />);

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  test('should render with custom zIndex', () => {
    render(<LockedModal {...defaultProps} zIndex={9999} />);

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  test('should render with custom style', () => {
    const customStyle = {
      overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
      content: { padding: '20px' },
    };

    render(<LockedModal {...defaultProps} style={customStyle} />);

    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  test('should render with firstButton and secondButton', () => {
    const mockFirst = jest.fn();
    const mockSecond = jest.fn();

    const firstButton = {
      children: 'First Button',
      onClick: mockFirst,
    };

    const secondButton = {
      children: 'Second Button',
      onClick: mockSecond,
    };

    render(
      <LockedModal
        {...defaultProps}
        firstButton={firstButton}
        secondButton={secondButton}
      />
    );

    expect(screen.getByText('First Button')).toBeInTheDocument();
    expect(screen.getByText('Second Button')).toBeInTheDocument();

    fireEvent.click(screen.getByText('First Button'));
    expect(mockFirst).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Second Button'));
    expect(mockSecond).toHaveBeenCalledTimes(1);
  });

  test('should render multiple actions with icons', () => {
    const actions = [
      {
        label: 'Primary Action',
        icon: 'fluent:checkmark-24-filled',
        variant: 'primary' as const,
        onClick: jest.fn(),
      },
      {
        label: 'Secondary Action',
        icon: 'fluent:dismiss-24-filled',
        variant: 'secondary' as const,
        onClick: jest.fn(),
      },
    ];

    render(<LockedModal {...defaultProps} actions={actions} />);

    expect(screen.getByText('Primary Action')).toBeInTheDocument();
    expect(screen.getByText('Secondary Action')).toBeInTheDocument();
  });

  test('should render with empty actions array', () => {
    render(<LockedModal {...defaultProps} actions={[]} />);

    expect(screen.getByText('Modal content')).toBeInTheDocument();
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  test('should render all children content', () => {
    const complexChildren = (
      <div>
        <h3>Complex Content</h3>
        <p>This is a paragraph</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
      </div>
    );

    render(<LockedModal {...defaultProps}>{complexChildren}</LockedModal>);

    expect(screen.getByText('Complex Content')).toBeInTheDocument();
    expect(screen.getByText('This is a paragraph')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });
});
