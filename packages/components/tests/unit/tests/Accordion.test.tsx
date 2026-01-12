import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { Box } from '@ttoss/ui';

import { Accordion } from '../../../src/components/Accordion';

describe('Accordion Component', () => {
  const defaultItems = [
    {
      id: 'item-1',
      title: 'Section 1',
      content: 'Content for section 1',
    },
    {
      id: 'item-2',
      title: 'Section 2',
      content: 'Content for section 2',
    },
    {
      id: 'item-3',
      title: 'Section 3',
      content: 'Content for section 3',
    },
  ];

  test('renders accordion with items', () => {
    render(<Accordion items={defaultItems} />);

    expect(screen.getByText('Section 1')).toBeInTheDocument();
    expect(screen.getByText('Section 2')).toBeInTheDocument();
    expect(screen.getByText('Section 3')).toBeInTheDocument();
  });

  test('content is hidden by default', () => {
    render(<Accordion items={defaultItems} />);

    expect(screen.queryByText('Content for section 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Content for section 2')).not.toBeInTheDocument();
    expect(screen.queryByText('Content for section 3')).not.toBeInTheDocument();
  });

  test('expands item when clicked', async () => {
    const user = userEvent.setup();
    render(<Accordion items={defaultItems} />);

    await user.click(screen.getByText('Section 1'));

    expect(screen.getByText('Content for section 1')).toBeInTheDocument();
    expect(screen.queryByText('Content for section 2')).not.toBeInTheDocument();
  });

  test('collapses expanded item when clicked again', async () => {
    const user = userEvent.setup();
    render(<Accordion items={defaultItems} defaultExpanded={0} />);

    expect(screen.getByText('Content for section 1')).toBeInTheDocument();

    await user.click(screen.getByText('Section 1'));

    expect(screen.queryByText('Content for section 1')).not.toBeInTheDocument();
  });

  test('single mode: expanding one item collapses others', async () => {
    const user = userEvent.setup();
    render(<Accordion items={defaultItems} defaultExpanded={0} />);

    expect(screen.getByText('Content for section 1')).toBeInTheDocument();

    await user.click(screen.getByText('Section 2'));

    expect(screen.queryByText('Content for section 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content for section 2')).toBeInTheDocument();
  });

  test('multiple mode: allows multiple items expanded', async () => {
    const user = userEvent.setup();
    render(<Accordion items={defaultItems} multiple />);

    await user.click(screen.getByText('Section 1'));
    await user.click(screen.getByText('Section 2'));

    expect(screen.getByText('Content for section 1')).toBeInTheDocument();
    expect(screen.getByText('Content for section 2')).toBeInTheDocument();
    expect(screen.queryByText('Content for section 3')).not.toBeInTheDocument();
  });

  test('defaultExpanded with single index', () => {
    render(<Accordion items={defaultItems} defaultExpanded={1} />);

    expect(screen.queryByText('Content for section 1')).not.toBeInTheDocument();
    expect(screen.getByText('Content for section 2')).toBeInTheDocument();
    expect(screen.queryByText('Content for section 3')).not.toBeInTheDocument();
  });

  test('defaultExpanded with array of indices', () => {
    render(
      <Accordion items={defaultItems} defaultExpanded={[0, 2]} multiple />
    );

    expect(screen.getByText('Content for section 1')).toBeInTheDocument();
    expect(screen.queryByText('Content for section 2')).not.toBeInTheDocument();
    expect(screen.getByText('Content for section 3')).toBeInTheDocument();
  });

  test('calls onAccordionChange callback when item is toggled', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Accordion items={defaultItems} onAccordionChange={handleChange} />);

    await user.click(screen.getByText('Section 1'));

    expect(handleChange).toHaveBeenCalledWith([0]);

    await user.click(screen.getByText('Section 1'));

    expect(handleChange).toHaveBeenCalledWith([]);
  });

  test('disabled items cannot be toggled', async () => {
    const user = userEvent.setup();
    const items = [
      ...defaultItems.slice(0, 1),
      { ...defaultItems[1], disabled: true },
    ];

    render(<Accordion items={items} />);

    await user.click(screen.getByText('Section 2'));

    expect(screen.queryByText('Content for section 2')).not.toBeInTheDocument();
  });

  test('renders with React nodes as title and content', () => {
    const items = [
      {
        id: 'custom',
        title: <span data-testid="custom-title">Custom Title</span>,
        content: <div data-testid="custom-content">Custom Content</div>,
      },
    ];

    render(<Accordion items={items} defaultExpanded={0} />);

    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
  });

  test('accessibility: aria attributes are correct', () => {
    render(<Accordion items={defaultItems} />);

    const button = screen.getByText('Section 1').closest('button');

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls');
    expect(button).toHaveAttribute('id');
  });

  test('accessibility: aria-expanded changes when toggled', async () => {
    const user = userEvent.setup();
    render(<Accordion items={defaultItems} />);

    const button = screen.getByText('Section 1').closest('button');

    expect(button).toHaveAttribute('aria-expanded', 'false');

    await user.click(button!);

    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  test('accessibility: panel has correct region role and labelledby', () => {
    render(<Accordion items={defaultItems} defaultExpanded={0} />);

    const panel = screen.getByText('Content for section 1').closest('div');

    expect(panel).toHaveAttribute('role', 'region');
    expect(panel).toHaveAttribute('aria-labelledby');
  });

  test('custom renderItem function', async () => {
    const user = userEvent.setup();
    const customRender = jest.fn(({ item, isExpanded, toggle, ids }) => {
      return (
        <Box key={ids.itemId}>
          <button
            data-testid={`custom-button-${item.id}`}
            onClick={toggle}
            aria-expanded={isExpanded}
          >
            {item.title}
          </button>
          {isExpanded && (
            <div data-testid={`custom-panel-${item.id}`}>{item.content}</div>
          )}
        </Box>
      );
    });

    render(<Accordion items={defaultItems} renderItem={customRender} />);

    expect(customRender).toHaveBeenCalledTimes(3);

    const customButton = screen.getByTestId('custom-button-item-1');
    expect(customButton).toBeInTheDocument();
    expect(customButton).toHaveAttribute('aria-expanded', 'false');

    await user.click(customButton);

    expect(screen.getByTestId('custom-panel-item-1')).toBeInTheDocument();
    expect(customButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('items without id use index-based keys', () => {
    const items = [
      { title: 'No ID 1', content: 'Content 1' },
      { title: 'No ID 2', content: 'Content 2' },
    ];

    render(<Accordion items={items} />);

    expect(screen.getByText('No ID 1')).toBeInTheDocument();
    expect(screen.getByText('No ID 2')).toBeInTheDocument();
  });

  test('applies custom sx styles', () => {
    const { container } = render(
      <Accordion
        items={defaultItems}
        sx={{ backgroundColor: 'red', padding: 10 }}
      />
    );

    const accordionBox = container.firstChild as HTMLElement;
    expect(accordionBox).toHaveStyle({ padding: '10px' });
  });
});
