import { render, screen } from '@ttoss/test-utils/react';
import { Icon, registerIconGlyphResolver, SemanticIcon } from 'src/index';

test('should render iconify-icon', () => {
  render(
    <p>
      <Icon icon="ant-design:down-square-filled" />
    </p>
  );

  const icon = screen.getByTestId('iconify-icon');

  expect(icon).toBeInTheDocument();
  expect(icon).toHaveAttribute('icon', 'ant-design:down-square-filled');
});

// ---------------------------------------------------------------------------
// SemanticIcon
// ---------------------------------------------------------------------------

describe('SemanticIcon', () => {
  const mockResolver = jest.fn();

  beforeEach(() => {
    mockResolver.mockReset();
    registerIconGlyphResolver(mockResolver);
  });

  test('renders with the glyph returned by the resolver', () => {
    mockResolver.mockReturnValue('lucide:search');

    render(
      <p>
        <SemanticIcon intent="action.search" />
      </p>
    );

    expect(screen.getByTestId('iconify-icon')).toHaveAttribute(
      'icon',
      'lucide:search'
    );
  });

  test('calls the resolver with the correct intent', () => {
    mockResolver.mockReturnValue('lucide:search');

    render(
      <p>
        <SemanticIcon intent="action.search" />
      </p>
    );

    expect(mockResolver).toHaveBeenCalledWith('action.search');
  });

  test('calls the resolver with each intent independently', () => {
    mockResolver.mockImplementation((intent: string) => {
      return `mock:${intent}`;
    });

    render(
      <p>
        <SemanticIcon intent="action.search" />
        <SemanticIcon intent="action.delete" />
      </p>
    );

    expect(mockResolver).toHaveBeenCalledWith('action.search');
    expect(mockResolver).toHaveBeenCalledWith('action.delete');
  });

  test('renders the updated glyph when resolver returns a different value', () => {
    mockResolver.mockReturnValue('fluent:add-24-regular');

    render(
      <p>
        <SemanticIcon intent="action.add" />
      </p>
    );

    expect(screen.getByTestId('iconify-icon')).toHaveAttribute(
      'icon',
      'fluent:add-24-regular'
    );
  });
});
