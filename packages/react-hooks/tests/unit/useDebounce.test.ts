import { act, renderHook } from '@ttoss/test-utils';
import { useDebounce } from '../../src/useDebounce'; // Adjust the import path as needed

describe('useDebounce hook', () => {
  jest.useFakeTimers();

  test('should return the same value immediately', () => {
    const { result } = renderHook(() => {
      return useDebounce('test', 500);
    });

    expect(result.current).toBe('test');
  });

  test('should return the latest value after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => {
        return useDebounce(value, 500);
      },
      {
        initialProps: { value: 'first' },
      }
    );

    expect(result.current).toBe('first');

    rerender({ value: 'second' });

    expect(result.current).toBe('first');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('second');
  });

  test('should clear the previous timer if the value is updated quickly', () => {
    const { rerender } = renderHook(
      ({ value }) => {
        return useDebounce(value, 500);
      },
      {
        initialProps: { value: 'first' },
      }
    );

    rerender({ value: 'second' });
    rerender({ value: 'third' });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    const { result } = renderHook(() => {
      return useDebounce('third', 500);
    });
    expect(result.current).toBe('third');
  });

  afterEach(() => {
    jest.clearAllTimers();
  });
});
