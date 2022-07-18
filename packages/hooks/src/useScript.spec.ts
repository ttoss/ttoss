import { act, renderHook } from '@ttoss/test-utils';

import { useScript } from './useScript';

const loadEvent = new Event('load');

const src = 'https://maps.googleapis.com/maps/api/js?key=GOOGLE_MAPS_API_KEY';

test('should load script', () => {
  /**
   * Arrange
   */

  const { result } = renderHook(() => useScript(src));

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
  expect(document.querySelectorAll('script')[0].getAttribute('src')).toBe(src);
  expect(result.current.status).toBe('ready');

  /**
   * Cleanup
   */
});
