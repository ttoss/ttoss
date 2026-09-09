/**
 * A variation pick the consumer serves asynchronously: while the promise
 * returned from `onVariableChange` is in flight, every menu is inert. The rows
 * themselves are covered in LeftSidebar.test.tsx and
 * LeftSidebar.variationsBlock.test.tsx.
 */

import { act, render, screen, waitFor } from '@ttoss/test-utils/react';
import type * as React from 'react';
import { GeovisWorkspace } from 'src';

import {
  click,
  type Preview,
  Provider,
  visualizationSpec,
} from './leftSidebarTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./leftSidebarTestUtils').createGeoVisMock();
});

/** Two menus and a timeline, so the lock can be watched across all three. */
const preview: Preview = {
  sections: [
    {
      id: 'controles',
      header: { title: 'Controles', icon: 'lucide:sliders-horizontal' },
      body: {
        kind: 'filters',
        blocks: [
          {
            id: 'indicador',
            title: 'Indicador',
            control: {
              kind: 'variations',
              menuId: 'variable',
              defaultValue: 'renda',
              variations: [
                { value: 'renda', label: 'Renda média' },
                { value: 'gini', label: 'Índice de Gini' },
              ],
            },
          },
          {
            id: 'faixa',
            title: 'Faixa etária',
            control: {
              kind: 'variations',
              menuId: 'age',
              defaultValue: '65',
              variations: [
                { value: '65', label: '65 ou mais' },
                { value: '75', label: '75 ou mais' },
              ],
            },
          },
          {
            id: 'periodo',
            title: 'Linha do tempo',
            control: {
              kind: 'timeline',
              menuId: 'ano',
              min: 2022,
              max: 2024,
              defaultValue: 2023,
            },
          },
        ],
      },
    },
  ],
};

const renderPreview = (
  props: Partial<React.ComponentProps<typeof GeovisWorkspace>> = {}
) => {
  return render(
    <GeovisWorkspace
      config={{ leftSidebar: { initialState: 'open', ...preview } }}
      visualizationSpec={visualizationSpec}
      {...props}
    />,
    { wrapper: Provider }
  );
};

/** A promise held open until the test decides how it ends. */
const deferred = () => {
  let resolve!: (value?: unknown) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise((res, rej) => {
    resolve = res as typeof resolve;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const row = (name: string) => {
  return screen.getByRole('button', { name });
};

test('a pending pick makes every menu inert, in both menus', async () => {
  const wait = deferred();
  renderPreview({
    onVariableChange: () => {
      return wait.promise;
    },
  });

  await click(row('Índice de Gini'));

  // The picked row stays reachable-looking but inert; it is the one being
  // served, so it must not read as unavailable.
  expect(row('Índice de Gini')).toBeDisabled();
  expect(row('Índice de Gini')).toHaveAttribute('aria-pressed', 'true');

  // Its own menu and the neighbouring one both stop responding.
  expect(row('Renda média')).toBeDisabled();
  expect(row('65 ou mais')).toBeDisabled();
  expect(row('75 ou mais')).toBeDisabled();

  // The timeline is untouched: the lock is on the menus.
  expect(screen.getByRole('slider')).toBeEnabled();

  await act(async () => {
    wait.resolve();
  });

  await waitFor(() => {
    return expect(row('Renda média')).toBeEnabled();
  });
  expect(row('75 ou mais')).toBeEnabled();
});

test('a rejected request releases the menus too', async () => {
  const wait = deferred();
  renderPreview({
    onVariableChange: () => {
      return wait.promise;
    },
  });

  await click(row('Índice de Gini'));
  expect(row('Renda média')).toBeDisabled();

  await act(async () => {
    wait.reject(new Error('upstream unavailable'));
  });

  // A failed request is a reason to let the user pick again, not to strand the
  // sidebar on a wait that will never end.
  await waitFor(() => {
    return expect(row('Renda média')).toBeEnabled();
  });
});

test('a synchronous consumer never locks anything', async () => {
  const onVariableChange = jest.fn();
  renderPreview({ onVariableChange });

  await click(row('Índice de Gini'));

  expect(row('Renda média')).toBeEnabled();
  expect(row('65 ou mais')).toBeEnabled();
});

test('a timeline tick never locks the menus, promise or not', async () => {
  const wait = deferred();
  renderPreview({
    onVariableChange: () => {
      return wait.promise;
    },
  });

  // The same handler that locks on a pick: what decides is where the change
  // came from, not what the consumer hands back.
  await click(screen.getByRole('button', { name: '2024' }));

  expect(row('Renda média')).toBeEnabled();
  expect(row('Índice de Gini')).toBeEnabled();
});

test('a locked row reports nothing when pressed', async () => {
  const wait = deferred();
  const onVariableChange = jest.fn(() => {
    return wait.promise;
  });
  renderPreview({ onVariableChange });

  await click(row('Índice de Gini'));
  // Counted from here: the timeline publishes its own default on mount, so the
  // pick is not the handler's first call.
  const afterPick = onVariableChange.mock.calls.length;

  await click(row('65 ou mais'));
  await click(row('Renda média'));

  // Neither the neighbouring menu nor the row it replaced can queue a second
  // request behind the first.
  expect(onVariableChange).toHaveBeenCalledTimes(afterPick);
});
