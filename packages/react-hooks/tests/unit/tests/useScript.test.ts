import { act, renderHook } from '@ttoss/test-utils/react';
import { useScript } from 'src/index';

const loadEvent = new Event('load');

const src = 'https://maps.googleapis.com/maps/api/js?key=GOOGLE_MAPS_API_KEY';

test('should load script', () => {
  /**
   * Arrange
   */
  const { result } = renderHook(() => {
    return useScript(src);
  });

  /**
   * Assert
   */
  expect(result.current.status).toBe('loading');

  /**
   * Act
   */
  act(() => {
    document.querySelectorAll('script')[0].dispatchEvent(loadEvent);
  });

  /**
   * Assert
   */
  expect(document.querySelectorAll('script')[0]).toHaveAttribute('src', src);
  expect(result.current.status).toBe('ready');

  /**
   * Cleanup
   */
});

test('should be idle when src is empty', () => {
  const { result } = renderHook(() => {
    return useScript('');
  });

  expect(result.current.status).toBe('idle');
});

test('should reuse an existing script and report its status', () => {
  const existingSrc = 'https://example.com/existing.js';
  const script = document.createElement('script');
  script.src = existingSrc;
  script.setAttribute('data-status', 'ready');
  document.body.appendChild(script);

  const { result } = renderHook(() => {
    return useScript(existingSrc);
  });

  expect(result.current.status).toBe('ready');
  expect(
    document.querySelectorAll(`script[src="${existingSrc}"]`)
  ).toHaveLength(1);
});

test('should report error when the script fails to load', () => {
  const failingSrc = 'https://example.com/failing.js';

  const { result } = renderHook(() => {
    return useScript(failingSrc);
  });

  expect(result.current.status).toBe('loading');

  act(() => {
    document
      .querySelector(`script[src="${failingSrc}"]`)
      ?.dispatchEvent(new Event('error'));
  });

  expect(result.current.status).toBe('error');
  expect(document.querySelector(`script[src="${failingSrc}"]`)).toHaveAttribute(
    'data-status',
    'error'
  );
});

test('should share status between instances using the same src', () => {
  const sharedSrc = 'https://example.com/shared.js';

  const first = renderHook(() => {
    return useScript(sharedSrc);
  });

  act(() => {
    document
      .querySelector(`script[src="${sharedSrc}"]`)
      ?.dispatchEvent(new Event('load'));
  });

  first.unmount();

  const second = renderHook(() => {
    return useScript(sharedSrc);
  });

  expect(second.result.current.status).toBe('ready');
});

test('should track a pre-existing script without data-status', () => {
  const untrackedSrc = 'https://example.com/untracked.js';
  const script = document.createElement('script');
  script.src = untrackedSrc;
  document.body.appendChild(script);

  const { result } = renderHook(() => {
    return useScript(untrackedSrc);
  });

  expect(result.current.status).toBe('error');

  act(() => {
    script.dispatchEvent(new Event('load'));
  });

  expect(result.current.status).toBe('ready');
});
