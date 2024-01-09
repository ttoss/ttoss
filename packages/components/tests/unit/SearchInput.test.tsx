/* eslint-disable @typescript-eslint/no-explicit-any */
import { SearchInput } from '../../src/components/SearchInput';
import { act, fireEvent, render } from '@ttoss/test-utils'; // Ajuste o caminho do import conforme necessário

jest.mock('@ttoss/react-hooks', () => {
  return {
    useDebounce: (value: any) => {
      return value;
    },
  };
});

describe('SearchInput', () => {
  jest.useFakeTimers();

  test('should render correctly', () => {
    const { getByRole } = render(<SearchInput onChange={() => {}} />);
    expect(getByRole('textbox')).toBeInTheDocument();
  });

  test('should call onChange with the debounced value', async () => {
    const handleChange = jest.fn();
    const { getByRole } = render(<SearchInput onChange={handleChange} />);

    const input = getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(handleChange).toHaveBeenCalledWith('test');
  });

  test('should show loading icon when loading is true', () => {
    const { getByTestId } = render(
      <SearchInput onChange={() => {}} loading={true} />
    );
    expect(getByTestId('iconify-icon')).toBeInTheDocument();
    expect(getByTestId('iconify-icon')).toHaveAttribute('icon', 'loading');
  });
});
