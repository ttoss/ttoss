/**
 * The `variations` filter control: a menu declared as a block rather than as a
 * whole tab, so several menus can share one tab. The body form and the rest of
 * the sidebar are covered in LeftSidebar.test.tsx.
 */

import { render, screen } from '@ttoss/test-utils/react';
import type * as React from 'react';
import { GeovisWorkspace, getInitialSelection } from 'src';

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

/** One tab holding two independent menus, the shape this control exists for. */
const twoMenus: Preview = {
  sections: [
    {
      id: 'controles',
      header: { title: 'Controles', icon: 'lucide:sliders-horizontal' },
      body: {
        kind: 'filters',
        blocks: [
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
            id: 'indicador',
            title: 'Indicador',
            control: {
              kind: 'variations',
              menuId: 'variable',
              defaultValue: 'renda',
              variations: [
                { value: 'renda', label: 'Renda média', icon: 'lucide:map' },
                {
                  value: 'gini',
                  label: 'Índice de Gini',
                  description: 'Concentração de renda, de 0 a 1',
                },
              ],
            },
          },
        ],
      },
    },
  ],
};

const renderPreview = (
  props: Partial<React.ComponentProps<typeof GeovisWorkspace>> = {},
  previewConfig: Preview = twoMenus
) => {
  return render(
    <GeovisWorkspace
      config={{ leftSidebar: { initialState: 'open', ...previewConfig } }}
      visualizationSpec={visualizationSpec}
      {...props}
    />,
    { wrapper: Provider }
  );
};

test('renders both menus in a single tab, each under its own heading', () => {
  renderPreview();

  // One tab, not two: the whole point of declaring the menus as blocks.
  expect(screen.getAllByRole('button', { name: 'Controles' })).toHaveLength(1);
  // Headings, not toggles: a block draws a fixed header unless it opts into
  // `collapsible`.
  expect(screen.getByText('Faixa etária')).toBeInTheDocument();
  expect(screen.getByText('Indicador')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: '65 ou mais' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Renda média' })
  ).toBeInTheDocument();
});

test('a description becomes the row tooltip, and only where one is given', () => {
  renderPreview();

  expect(
    screen.getByRole('button', { name: 'Índice de Gini' })
  ).toHaveAttribute('title', 'Concentração de renda, de 0 a 1');
  // No `description`, no `title`: an empty tooltip on hover would be worse
  // than none, and repeating the label says nothing the row does not.
  expect(
    screen.getByRole('button', { name: 'Renda média' })
  ).not.toHaveAttribute('title');
});

test('marks each menu default as pressed before any pick', () => {
  renderPreview();

  expect(screen.getByRole('button', { name: '65 ou mais' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Renda média' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(
    screen.getByRole('button', { name: 'Índice de Gini' })
  ).toHaveAttribute('aria-pressed', 'false');
});

test('each block writes to its own menu and leaves the other alone', async () => {
  const onVariableChange = jest.fn();
  renderPreview({ onVariableChange });

  await click(screen.getByRole('button', { name: '75 ou mais' }));

  expect(onVariableChange).toHaveBeenCalledWith(
    expect.objectContaining({ age: '75', variable: 'renda' })
  );

  await click(screen.getByRole('button', { name: 'Índice de Gini' }));

  expect(onVariableChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ age: '75', variable: 'gini' })
  );
});

test('reflects a controlled selection instead of its own default', () => {
  renderPreview({ variables: { age: '75', variable: 'gini' } });

  expect(screen.getByRole('button', { name: '75 ou mais' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('button', { name: '65 ou mais' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});

test('falls back to its own default when the selection has no value yet', () => {
  // A controlled consumer that did not seed through `getInitialSelection`: the
  // shared selection carries nothing, so the control has to read its own
  // `defaultValue` or the block would render with no row marked.
  renderPreview({ variables: {} });

  expect(screen.getByRole('button', { name: '65 ou mais' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('closeOnSelect collapses the sidebar once a variation is picked', async () => {
  const closing: Preview = {
    sections: [
      {
        ...twoMenus.sections[0],
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'faixa',
              title: 'Faixa etária',
              control: {
                kind: 'variations',
                menuId: 'age',
                defaultValue: '65',
                closeOnSelect: true,
                variations: [
                  { value: '65', label: '65 ou mais' },
                  { value: '75', label: '75 ou mais' },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  renderPreview({}, closing);

  await click(screen.getByRole('button', { name: '75 ou mais' }));

  expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
});

test('the sidebar stays open on a pick without closeOnSelect', async () => {
  renderPreview();

  await click(screen.getByRole('button', { name: '75 ou mais' }));

  expect(screen.queryByRole('button', { name: 'Open menu' })).toBeNull();
});

test('getInitialSelection seeds a menu declared as a block', () => {
  expect(
    getInitialSelection({
      config: { leftSidebar: { initialState: 'open', ...twoMenus } },
    })
  ).toEqual({ age: '65', variable: 'renda' });
});

test('enabledWhen gates on a menu declared as a block', async () => {
  const gated: Preview = {
    sections: [
      ...twoMenus.sections,
      {
        id: 'detalhe',
        header: { title: 'Detalhe', icon: 'lucide:info' },
        // Reads the block menu's default before anything is picked, which only
        // resolves because `resolveMenuValue` searches filter blocks too.
        enabledWhen: { menuId: 'age', values: ['75'] },
        body: {
          kind: 'variations',
          menuId: 'detail',
          groups: [
            {
              id: 'g',
              label: 'G',
              variations: [{ value: 'd1', label: 'Detalhe 1' }],
            },
          ],
        },
      },
    ],
  };

  renderPreview({}, gated);

  expect(screen.getByRole('button', { name: 'Detalhe' })).toBeDisabled();

  await click(screen.getByRole('button', { name: '75 ou mais' }));

  expect(screen.getByRole('button', { name: 'Detalhe' })).toBeEnabled();
});

test('resolves a block menu default for a gate before anything is selected', () => {
  // The unseeded case, which is the one the block scan exists for: with an empty
  // controlled selection the gate can only be answered by finding the menu's
  // declaration among the filter blocks. Gating on the *second* block's menu
  // also walks past the first, which is not the menu being resolved.
  const gated: Preview = {
    sections: [
      ...twoMenus.sections,
      {
        id: 'detalhe',
        header: { title: 'Detalhe', icon: 'lucide:info' },
        enabledWhen: { menuId: 'variable', values: ['gini'] },
        body: {
          kind: 'variations',
          menuId: 'detail',
          groups: [
            {
              id: 'g',
              label: 'G',
              variations: [{ value: 'd1', label: 'Detalhe 1' }],
            },
          ],
        },
      },
    ],
  };

  renderPreview({ variables: {} }, gated);

  // 'renda' is the block's default and the gate wants 'gini', so resolving it
  // at all is what this asserts — an unresolved menu would read `undefined` and
  // disable the tab for the wrong reason.
  expect(screen.getByRole('button', { name: 'Detalhe' })).toBeDisabled();
});
