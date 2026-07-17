import { render, screen } from '@testing-library/react';
import {
  type ComponentAction,
  componentReducer,
  ComponentStoreProvider,
  initialComponentState,
  useComponentStore,
} from 'src/studio/components/componentStore';

describe('componentReducer', () => {
  test('selectComponent replaces the selection and clears props', () => {
    const withProps = { ...initialComponentState, evaluation: 'primary' };
    const next = componentReducer(withProps, {
      type: 'selectComponent',
      key: 'buttonMeta',
    });
    expect(next.selection).toEqual({ kind: 'component', key: 'buttonMeta' });
    expect(next.evaluation).toBeUndefined();
  });

  test('selectPage switches to a page subject', () => {
    const next = componentReducer(initialComponentState, {
      type: 'selectPage',
      id: 'form',
    });
    expect(next.selection).toEqual({ kind: 'page', id: 'form' });
  });

  test('setEvaluation and setConsequence update props', () => {
    const withEval = componentReducer(initialComponentState, {
      type: 'setEvaluation',
      value: 'accent',
    });
    expect(withEval.evaluation).toBe('accent');
    const withConseq = componentReducer(withEval, {
      type: 'setConsequence',
      value: 'destructive',
    });
    expect(withConseq.consequence).toBe('destructive');
    // Clearing back to default.
    expect(
      componentReducer(withEval, { type: 'setEvaluation' }).evaluation
    ).toBeUndefined();
  });

  test('unknown action returns state unchanged (defensive default)', () => {
    const bogus = { type: 'nope' } as unknown as ComponentAction;
    expect(componentReducer(initialComponentState, bogus)).toBe(
      initialComponentState
    );
  });
});

describe('useComponentStore', () => {
  test('throws when used outside a provider', () => {
    const Consumer = () => {
      useComponentStore();
      return null;
    };
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      return render(<Consumer />);
    }).toThrow(
      'useComponentStore must be used within a ComponentStoreProvider'
    );
    spy.mockRestore();
  });

  test('provides the initial selection', () => {
    const Probe = () => {
      const store = useComponentStore();
      return <span data-testid="kind">{store.selection.kind}</span>;
    };
    render(
      <ComponentStoreProvider>
        <Probe />
      </ComponentStoreProvider>
    );
    expect(screen.getByTestId('kind').textContent).toBe('component');
  });
});
