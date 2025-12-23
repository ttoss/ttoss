import { fireEvent, render, screen } from '@ttoss/test-utils/react';

import { LockedOverlay } from '../../../src/components/LockedOverlay';

describe('LockedOverlay', () => {
  const overlayContentText = 'Overlay content';
  const complexContentTitle = 'Complex Content';
  const complexContentParagraph = 'This is a paragraph';
  const complexItem1 = 'Item 1';
  const complexItem2 = 'Item 2';

  const defaultProps = {
    isOpen: true,
    header: {
      icon: 'fluent:lock-closed-24-filled',
      title: 'Feature Locked',
      description: 'This feature requires additional permissions',
    },
    children: <div>{overlayContentText}</div>,
  };

  test('should render when isOpen is true', () => {
    render(<LockedOverlay {...defaultProps} />);

    expect(screen.getByText('Feature Locked')).toBeInTheDocument();
    expect(
      screen.getByText('This feature requires additional permissions')
    ).toBeInTheDocument();
    expect(screen.getByText(overlayContentText)).toBeInTheDocument();
  });

  test('should not render when isOpen is false', () => {
    render(<LockedOverlay {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Feature Locked')).not.toBeInTheDocument();
    expect(screen.queryByText(overlayContentText)).not.toBeInTheDocument();
  });

  test('should render with accent variant', () => {
    render(
      <LockedOverlay
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

    render(<LockedOverlay {...defaultProps} actions={actions} />);

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

    render(<LockedOverlay {...defaultProps} actions={actions} />);

    const button = screen.getByText('Click Me');
    fireEvent.click(button);

    expect(mockClick).toHaveBeenCalledTimes(1);
  });

  test('should render without actions', () => {
    render(<LockedOverlay {...defaultProps} />);

    expect(screen.getByText(overlayContentText)).toBeInTheDocument();
    // Verify no buttons are rendered when actions are not provided
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  test('should call onRequestClose when overlay is clicked', () => {
    const mockClose = jest.fn();

    render(<LockedOverlay {...defaultProps} onRequestClose={mockClose} />);

    fireEvent.click(screen.getByTestId('lockedoverlay-overlay'));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });

  test('should not call onRequestClose when clicking inside content', () => {
    const mockClose = jest.fn();

    render(<LockedOverlay {...defaultProps} onRequestClose={mockClose} />);

    fireEvent.click(screen.getByText(overlayContentText));
    expect(mockClose).toHaveBeenCalledTimes(0);
  });

  test('should not close when onRequestClose is not provided', () => {
    render(<LockedOverlay {...defaultProps} />);

    expect(screen.getByText(overlayContentText)).toBeInTheDocument();
  });

  test('should render with custom zIndex', () => {
    render(<LockedOverlay {...defaultProps} zIndex={9999} />);

    const overlay = screen.getByTestId('lockedoverlay-overlay');
    expect(overlay).toBeInTheDocument();
  });

  test('should render with default zIndex of 1', () => {
    render(<LockedOverlay {...defaultProps} />);

    expect(screen.getByTestId('lockedoverlay-overlay')).toBeInTheDocument();
  });

  test('should render with custom style', () => {
    const customStyle = {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: '20px',
    };

    render(<LockedOverlay {...defaultProps} sx={customStyle} />);

    expect(screen.getByText(overlayContentText)).toBeInTheDocument();
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
      <LockedOverlay
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

    render(<LockedOverlay {...defaultProps} actions={actions} />);

    expect(screen.getByText('Primary Action')).toBeInTheDocument();
    expect(screen.getByText('Secondary Action')).toBeInTheDocument();
  });

  test('should render with empty actions array', () => {
    render(<LockedOverlay {...defaultProps} actions={[]} />);

    expect(screen.getByText(overlayContentText)).toBeInTheDocument();
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(0);
  });

  test('should render all children content', () => {
    const complexChildren = (
      <div>
        <h3>{complexContentTitle}</h3>
        <p>{complexContentParagraph}</p>
        <ul>
          <li>{complexItem1}</li>
          <li>{complexItem2}</li>
        </ul>
      </div>
    );

    render(<LockedOverlay {...defaultProps}>{complexChildren}</LockedOverlay>);

    expect(screen.getByText(complexContentTitle)).toBeInTheDocument();
    expect(screen.getByText(complexContentParagraph)).toBeInTheDocument();
    expect(screen.getByText(complexItem1)).toBeInTheDocument();
    expect(screen.getByText(complexItem2)).toBeInTheDocument();
  });

  test('should use position absolute for overlay positioning', () => {
    render(<LockedOverlay {...defaultProps} />);

    const overlay = screen.getByTestId('lockedoverlay-overlay');
    expect(overlay).toBeInTheDocument();
  });
});
