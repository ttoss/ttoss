import { renderHook } from '@ttoss/test-utils';
import { useIconElement } from '../../src/hooks/useIconElement';
import alertIcon from '@iconify-icons/mdi-light/alert';

test('should return null if icon is an empty string', () => {
  const iconName = '';

  const { result } = renderHook(() => {
    return useIconElement(iconName);
  });

  expect(result?.current).toBeNull();
});

test('should render an icon based in a string', () => {
  const iconName = 'ant-design:down-square-filled';

  const { result } = renderHook(() => {
    return useIconElement(iconName);
  });

  expect(result?.current).not.toBeNull();
});

test('should render an icon based in a svg element', () => {
  const { result } = renderHook(() => {
    return useIconElement(alertIcon);
  });

  expect(result?.current).not.toBeNull();
});
