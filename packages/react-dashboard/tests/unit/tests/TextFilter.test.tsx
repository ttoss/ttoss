import { render, screen, userEvent } from '@ttoss/test-utils/react';
import { TextFilter } from 'src/Filters/TextFilter';

describe('TextFilter', () => {
  const user = userEvent.setup({ delay: null });

  test('should render label', () => {
    render(
      <TextFilter
        name="test-input"
        label="Test Input"
        value=""
        onChange={() => {}}
      />
    );

    expect(screen.getByText('Test Input')).toBeInTheDocument();
  });

  test('should render input with value', () => {
    render(
      <TextFilter
        name="test-input"
        label="Test Input"
        value="initial value"
        onChange={() => {}}
      />
    );

    const input = screen.getByDisplayValue('initial value');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('initial value');
  });

  test('should render placeholder', () => {
    render(
      <TextFilter
        name="test-input"
        label="Test Input"
        value=""
        placeholder="Enter text here"
        onChange={() => {}}
      />
    );

    expect(screen.getByPlaceholderText('Enter text here')).toBeInTheDocument();
  });

  test('should call onChange when input value changes', async () => {
    const handleChange = jest.fn();

    render(
      <TextFilter
        name="test-input"
        label="Test Input"
        value=""
        onChange={handleChange}
      />
    );

    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');

    expect(handleChange).toHaveBeenCalled();
  });

  test('should handle string value', () => {
    render(
      <TextFilter
        name="test-input"
        label="Test Input"
        value="string value"
        onChange={() => {}}
      />
    );

    const input = screen.getByDisplayValue('string value');
    expect(input).toHaveValue('string value');
  });

  test('should handle number value', () => {
    render(
      <TextFilter
        name="test-input"
        label="Test Input"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value={123 as any}
        onChange={() => {}}
      />
    );

    const input = screen.getByDisplayValue('123');
    expect(input).toHaveValue('123');
  });

  test('should handle boolean value', () => {
    render(
      <TextFilter
        name="test-input"
        label="Test Input"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value={true as any}
        onChange={() => {}}
      />
    );

    const input = screen.getByDisplayValue('true');
    expect(input).toHaveValue('true');
  });

  test('should handle empty string value', () => {
    render(
      <TextFilter
        name="test-input"
        label="Test Input"
        value=""
        onChange={() => {}}
      />
    );

    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('');
  });
});
