/**
 * The `choice` filter control: a required single choice declared as a
 * `filters` block — a list with counts, or a grid of compact buttons. The
 * choice itself is covered in LeftSidebar.choice.test.tsx.
 */

import { render, screen, within } from '@ttoss/test-utils/react';
import type * as React from 'react';
import { GeovisWorkspace } from 'src';
import { resolveMenuValue } from 'src/components/LeftSidebar/useSections';

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

/** A list with counts and a grid, plus sections gated on each menu. */
const choiceFilters: Preview = {
  sections: [
    {
      id: 'filtros',
      header: { title: 'Filtros', icon: 'lucide:filter' },
      body: {
        kind: 'filters',
        blocks: [
          {
            id: 'recortes',
            title: 'Recortes',
            control: {
              kind: 'choice',
              menuId: 'level',
              layout: 'list',
              // No `defaultValue`: the first option is the default.
              options: [
                { value: 'distrito', label: 'Distritos', count: 96 },
                { value: 'subprefeitura', label: 'Subprefeituras', count: 32 },
              ],
            },
          },
          {
            id: 'faixa',
            title: 'Faixa etária',
            control: {
              kind: 'choice',
              menuId: 'age',
              defaultValue: 'todos',
              layout: { kind: 'grid', columns: 2 },
              options: [
                { value: 'todos', label: 'Todos', icon: 'lucide:users' },
                { value: '70-74', label: '70 a 74 anos' },
                {
                  value: '75',
                  label: '75 ou mais',
                  enabledWhen: { menuId: 'level', values: ['subprefeitura'] },
                },
              ],
            },
          },
        ],
      },
    },
    {
      id: 'distritos',
      header: { title: 'Por distrito', icon: 'lucide:map' },
      // Resolves from the list's first option, before anything is picked.
      enabledWhen: { menuId: 'level', values: ['distrito'] },
      body: {
        kind: 'variations',
        menuId: 'd',
        groups: [
          {
            id: 'g',
            label: 'G',
            variations: [{ value: 'd1', label: 'D1' }],
          },
        ],
      },
    },
    {
      id: 'idosos',
      header: { title: 'Idosos', icon: 'lucide:user' },
      // Resolves from the grid's `defaultValue`.
      enabledWhen: { menuId: 'age', values: ['70-74'] },
      body: {
        kind: 'variations',
        menuId: 'i',
        groups: [
          {
            id: 'g',
            label: 'G',
            variations: [{ value: 'i1', label: 'I1' }],
          },
        ],
      },
    },
  ],
};

const renderPreview = (
  props: Partial<React.ComponentProps<typeof GeovisWorkspace>> = {}
) => {
  const onVariableChange = jest.fn();
  render(
    <GeovisWorkspace
      config={{ leftSidebar: { initialState: 'open', ...choiceFilters } }}
      visualizationSpec={visualizationSpec}
      onVariableChange={onVariableChange}
      {...props}
    />,
    { wrapper: Provider }
  );
  return { onVariableChange };
};

const group = (name: string) => {
  return screen.getByRole('radiogroup', { name });
};

test('a list choice shows each count, and the pick moves the tint', async () => {
  const { onVariableChange } = renderPreview();
  const recortes = group('Recortes');

  expect(
    within(recortes)
      .getAllByTestId('choice-count')
      .map((pill) => {
        return pill.textContent;
      })
  ).toEqual(['96', '32']);
  // A count replaces the check on the chosen row.
  expect(within(recortes).queryByTestId('choice-check')).toBeNull();
  expect(
    within(recortes).getByRole('radio', { name: /Distritos/ })
  ).toHaveAttribute('aria-checked', 'true');

  await click(within(recortes).getByRole('radio', { name: /Subprefeituras/ }));

  expect(
    within(recortes).getByRole('radio', { name: /Subprefeituras/ })
  ).toHaveAttribute('aria-checked', 'true');
  expect(onVariableChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ level: 'subprefeitura' })
  );
});

test('a grid choice renders compact buttons, with a check on the chosen one', async () => {
  const { onVariableChange } = renderPreview();
  const faixa = group('Faixa etária');
  const todos = within(faixa).getByRole('radio', { name: 'Todos' });
  const band = within(faixa).getByRole('radio', { name: '70 a 74 anos' });

  // The full label is the tooltip, since the cell cuts it with an ellipsis.
  expect(band).toHaveAttribute('title', '70 a 74 anos');
  expect(todos).toHaveAttribute('aria-checked', 'true');
  expect(within(todos).getByTestId('choice-check')).toBeInTheDocument();
  expect(within(band).queryByTestId('choice-check')).toBeNull();

  await click(band);

  expect(band).toHaveAttribute('aria-checked', 'true');
  expect(within(band).getByTestId('choice-check')).toBeInTheDocument();
  expect(onVariableChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ age: '70-74' })
  );
});

test('gates resolve a choice block menu from its default', async () => {
  renderPreview();

  expect(screen.getByRole('button', { name: 'Por distrito' })).toBeEnabled();
  expect(screen.getByRole('button', { name: 'Idosos' })).toBeDisabled();

  await click(
    within(group('Faixa etária')).getByRole('radio', { name: '70 a 74 anos' })
  );

  expect(screen.getByRole('button', { name: 'Idosos' })).toBeEnabled();
});

test('a grid option behind a closed gate is disabled', async () => {
  renderPreview();
  const faixa = group('Faixa etária');

  expect(
    within(faixa).getByRole('radio', { name: '75 ou mais' })
  ).toBeDisabled();

  await click(
    within(group('Recortes')).getByRole('radio', { name: /Subprefeituras/ })
  );

  expect(
    within(faixa).getByRole('radio', { name: '75 ou mais' })
  ).toBeEnabled();
});

test('resolveMenuValue skips a filter block that declares no default', () => {
  // A chips block publishes its own value, so a menu it drives has no
  // declared default to fall back to.
  expect(
    resolveMenuValue({
      sections: [
        {
          id: 'f',
          header: { title: 'F', icon: 'lucide:filter' },
          body: {
            kind: 'filters',
            blocks: [
              {
                id: 'temas',
                title: 'Temas',
                control: {
                  kind: 'chips',
                  menuId: 'temas',
                  options: [{ id: 'a', label: 'A' }],
                },
              },
            ],
          },
        },
      ],
      selection: {},
      menuId: 'temas',
    })
  ).toBeUndefined();
});

test('a choice block without options resolves to no value', () => {
  expect(
    resolveMenuValue({
      sections: [
        {
          id: 'f',
          header: { title: 'F', icon: 'lucide:filter' },
          body: {
            kind: 'filters',
            blocks: [
              {
                id: 'vazio',
                title: 'Vazio',
                control: { kind: 'choice', menuId: 'vazio', options: [] },
              },
            ],
          },
        },
      ],
      selection: {},
      menuId: 'vazio',
    })
  ).toBeUndefined();
});
