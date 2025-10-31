import { fireEvent, render, screen } from '@ttoss/test-utils';

import { Menu } from '../../../src/components/Menu/Menu';

jest.mock('@ttoss/react-icons', () => {
  return {
    Icon: ({ icon }: { icon?: string }) => {
      return <span data-testid="icon" data-icon={icon} />;
    },
  };
});

jest.mock('@ttoss/ui', () => {
  return {
    // Wrapper Box mock: distinguish wrapper vs nav by data-testid
    Box: (props: {
      children?: React.ReactNode;
      style?: React.CSSProperties;
      as?: string;
    }) => {
      const { children, style, as } = props;
      return (
        <div
          data-testid={`ttoss-box${as ? `-${as}` : '-wrapper'}`}
          data-as={as}
          style={style}
        >
          {children}
        </div>
      );
    },
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Menu component', () => {
  test('renders default trigger icon when no trigger or triggerIcon provided', () => {
    render(
      <Menu>
        <div>child</div>
      </Menu>
    );

    const icon = screen.getByTestId('icon');
    expect(icon).toBeInTheDocument();
    expect(icon.getAttribute('data-icon')).toBe('menu-open');
  });

  test('uses trigger ReactNode when provided', () => {
    render(
      <Menu trigger={<span data-testid="custom-trigger">X</span>}>
        <div>child</div>
      </Menu>
    );

    expect(screen.getByTestId('custom-trigger')).toBeInTheDocument();
    expect(screen.queryByTestId('icon')).toBeNull();
  });

  test('uses triggerIcon when trigger is not provided', () => {
    render(
      <Menu triggerIcon={<span data-testid="trigger-icon">TI</span>}>
        <div>child</div>
      </Menu>
    );

    expect(screen.getByTestId('trigger-icon')).toBeInTheDocument();
    expect(screen.queryByTestId('icon')).toBeNull();
  });

  test('does not render trigger when hideTrigger is true', () => {
    render(
      <Menu hideTrigger>
        <div>child</div>
      </Menu>
    );

    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByTestId('ttoss-box-wrapper')).toBeInTheDocument();
  });

  test('applies fixedTrigger styles with provided fixedOffset', () => {
    render(
      <Menu fixedTrigger fixedOffset={{ top: 10, right: 20 }}>
        <div>child</div>
      </Menu>
    );

    const wrapper = screen.getByTestId('ttoss-box-wrapper');
    expect(wrapper.style.position).toBe('fixed');
    expect(wrapper.style.top).toBe('10px');
    expect(wrapper.style.right).toBe('20px');
    expect(wrapper.style.zIndex).toBe('9999');
  });

  test('applies default fixedOffset values when not provided', () => {
    render(
      <Menu fixedTrigger>
        <div>child</div>
      </Menu>
    );

    const wrapper = screen.getByTestId('ttoss-box-wrapper');
    expect(wrapper.style.position).toBe('fixed');
    expect(wrapper.style.top).toBe('16px');
    expect(wrapper.style.right).toBe('16px');
  });

  test('opens the menu and renders MenuList with merged styles (sx and menuListProps.style)', () => {
    render(
      <Menu
        sx={{ background: 'yellow' }}
        menuListProps={{ style: { background: 'blue' } }}
      >
        <div data-testid="child">Child content</div>
      </Menu>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // MenuList is rendered but may be hidden due to animation styles;
    // include hidden: true so Testing Library finds it.
    const menuList = screen.getByRole('menu', { hidden: true });
    expect(menuList).toBeInTheDocument();

    expect(menuList.style.minWidth).toBe('240px');
    expect(menuList.style.maxHeight).toBe('400px');
    expect(menuList.style.overflowY).toBe('auto');
    expect(menuList.style.background).toBe('blue');

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
