import { fireEvent, render, screen } from '@ttoss/test-utils';

import { SegmentedControl } from '../../../src';

// filepath: ttoss/packages/ui/tests/unit/tests/SegmentedControl.test.tsx

test('should render with string options', () => {
  render(<SegmentedControl options={['Option 1', 'Option 2', 'Option 3']} />);

  expect(screen.getByText('Option 1')).toBeInTheDocument();
  expect(screen.getByText('Option 2')).toBeInTheDocument();
  expect(screen.getByText('Option 3')).toBeInTheDocument();
});

test('should render with number options', () => {
  render(<SegmentedControl options={[1, 2, 3]} />);

  expect(screen.getByText('1')).toBeInTheDocument();
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText('3')).toBeInTheDocument();
});

test('should render with object options', () => {
  render(
    <SegmentedControl
      options={[
        { label: 'Label 1', value: 'value1' },
        { label: 'Label 2', value: 'value2' },
      ]}
    />
  );

  expect(screen.getByText('Label 1')).toBeInTheDocument();
  expect(screen.getByText('Label 2')).toBeInTheDocument();
});

test('should handle defaultValue prop', () => {
  render(
    <SegmentedControl
      options={['Option 1', 'Option 2', 'Option 3']}
      defaultValue="Option 2"
    />
  );

  const selectedOption = screen
    .getByText('Option 2')
    .closest('.rc-segmented-item');
  expect(selectedOption).toHaveClass('rc-segmented-item-selected');
});

test('should handle value prop', () => {
  render(
    <SegmentedControl
      options={['Option 1', 'Option 2', 'Option 3']}
      value="Option 3"
    />
  );

  const selectedOption = screen
    .getByText('Option 3')
    .closest('.rc-segmented-item');
  expect(selectedOption).toHaveClass('rc-segmented-item-selected');
});

test('should trigger onChange when option is clicked', () => {
  const handleChange = jest.fn();

  render(
    <SegmentedControl
      options={['Option 1', 'Option 2', 'Option 3']}
      onChange={handleChange}
    />
  );

  fireEvent.click(screen.getByText('Option 2'));

  expect(handleChange).toHaveBeenCalledWith('Option 2');
});

test('should apply disabled state to the component', () => {
  render(
    <SegmentedControl
      options={['Option 1', 'Option 2', 'Option 3']}
      disabled={true}
    />
  );

  const segmentedItem = screen
    .getByText('Option 1')
    .closest('.rc-segmented-item');
  expect(segmentedItem).toHaveClass('rc-segmented-item-disabled');
});

test('should apply disabled state to specific options', () => {
  render(
    <SegmentedControl
      options={[
        { label: 'Label 1', value: 'value1' },
        { label: 'Label 2', value: 'value2', disabled: true },
      ]}
    />
  );

  const disabledOption = screen
    .getByText('Label 2')
    .closest('.rc-segmented-item');
  expect(disabledOption).toHaveClass('rc-segmented-item-disabled');
});

test('should apply custom className', () => {
  render(
    <SegmentedControl
      options={['Option 1', 'Option 2']}
      className="custom-class"
    />
  );

  const container = screen.getByText('Option 1').closest('.custom-class');
  expect(container).toBeInTheDocument();
});
