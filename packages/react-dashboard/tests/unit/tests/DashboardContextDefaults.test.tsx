import { act, renderHook } from '@ttoss/test-utils/react';
import { DashboardContext } from 'src/DashboardProvider';

describe('DashboardContext defaults', () => {
  test('should expose callable default no-op handlers', () => {
    const { result } = renderHook(() => {
      return DashboardContext._currentValue;
    });

    expect(() => {
      act(() => {
        result.current.updateFilter('any', 'value');
        result.current.startEdit();
        result.current.cancelEdit();
        result.current.saveEdit();
        result.current.saveAsNew();
        result.current.confirmSaveAsNew('title');
        result.current.cancelSaveAsNew();
        result.current.addCard({
          w: 1,
          h: 1,
          card: {
            title: 'Card',
            numberType: 'number',
            type: 'bigNumber',
            sourceType: [{ source: 'api' }],
            data: {},
          },
        });
        result.current.removeCard('id');
        result.current.updateCard('id', { title: 'updated' });
        result.current.onLayoutChange([]);
      });
    }).not.toThrow();
  });
});
