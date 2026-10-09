/**
 * Settings sub-blocks — controls nested under a block's own, with the value on
 * the heading — and the `list` layout of a choice.
 */

import { fireEvent, render, screen, within } from '@ttoss/test-utils/react';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSidebarChoiceSetting,
} from 'src';

import { click, Provider, visualizationSpec } from './leftSidebarTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./leftSidebarTestUtils').createGeoVisMock();
});

const only3d = { menuId: 'view', values: ['3d'] };

const heightChoice: GeovisWorkspaceSidebarChoiceSetting = {
  kind: 'choice',
  layout: 'list',
  menuId: 'height',
  defaultValue: 'pop',
  options: [
    {
      value: 'pop',
      label: 'População',
      sublabel: '0 – 100 mil hab.',
      icon: 'lucide:users',
      unit: 'habitantes',
    },
    {
      value: 'fam',
      label: 'Famílias',
      sublabel: '0 – 5 mil famílias',
      icon: 'lucide:heart',
      unit: 'famílias',
    },
    { value: 'sem', label: 'Sem unidade' },
    {
      value: 'fechada',
      label: 'Fechada',
      enabledWhen: { menuId: 'view', values: ['nunca'] },
    },
  ],
};

const configWith = (
  overrides: { height?: GeovisWorkspaceSidebarChoiceSetting } = {}
): GeovisWorkspaceConfig => {
  return {
    leftSidebar: {
      initialState: 'open',
      sections: [
        {
          id: 'configuracoes',
          header: { title: 'Configurações', icon: 'lucide:settings' },
          body: {
            kind: 'settings',
            blocks: [
              {
                id: 'visualizacao',
                title: 'Visualização',
                hint: 'Escolha o modo.',
                control: {
                  kind: 'choice',
                  menuId: 'view',
                  defaultValue: '2d',
                  options: [
                    { value: '2d', label: '2D' },
                    { value: '3d', label: '3D' },
                  ],
                },
                subBlocks: [
                  {
                    id: 'altura-representa',
                    title: 'Altura representa',
                    shownWhen: only3d,
                    control: overrides.height ?? heightChoice,
                  },
                  {
                    id: 'altura',
                    title: 'Altura das extrusões',
                    shownWhen: only3d,
                    control: {
                      kind: 'slider',
                      menuId: 'scale',
                      defaultValue: 3,
                      stops: [1, 2, 3].map((scale) => {
                        return { value: scale, label: `${scale}×` };
                      }),
                    },
                  },
                  {
                    id: 'opacidade',
                    title: 'Opacidade',
                    shownWhen: only3d,
                    control: {
                      kind: 'slider',
                      menuId: 'opacity',
                      defaultValue: 80,
                      unit: '%',
                    },
                  },
                  {
                    id: 'malha',
                    title: 'Malha',
                    shownWhen: only3d,
                    control: {
                      kind: 'slider',
                      menuId: 'mesh',
                      defaultValue: 12,
                    },
                  },
                  {
                    id: 'rotacao',
                    title: 'Rotação da câmera',
                    hint: 'Arraste o disco.',
                    shownWhen: only3d,
                    control: {
                      kind: 'bearing',
                      menuId: 'bearing',
                      defaultValue: 45,
                    },
                  },
                  {
                    id: 'sombra',
                    title: 'Sombra',
                    shownWhen: only3d,
                    control: {
                      kind: 'toggle',
                      menuId: 'shadow',
                      defaultValue: false,
                    },
                  },
                  {
                    id: 'rampa',
                    title: 'Rampa',
                    shownWhen: only3d,
                    control: {
                      kind: 'colorRamp',
                      menuId: 'ramp',
                      options: [
                        { id: 'azuis', label: 'Azuis', colors: ['#00f'] },
                      ],
                    },
                  },
                ],
              },
              {
                id: 'sozinho',
                title: 'Sozinho',
                control: {
                  kind: 'toggle',
                  menuId: 'alone',
                  defaultValue: true,
                },
                subBlocks: [
                  {
                    id: 'nunca',
                    title: 'Nunca aparece',
                    shownWhen: { menuId: 'alone', values: ['false'] },
                    control: {
                      kind: 'toggle',
                      menuId: 'never',
                      defaultValue: false,
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    },
  };
};

const renderSidebar = async ({
  config = configWith(),
  variables,
}: {
  config?: GeovisWorkspaceConfig;
  variables?: Record<string, string>;
} = {}) => {
  const onVariableChange = jest.fn();
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpec}
      variables={variables}
      onVariableChange={onVariableChange}
    />,
    { wrapper: Provider }
  );
  await click(screen.getByRole('button', { name: 'Configurações' }));
  return { onVariableChange };
};

const pick3d = async () => {
  const view = screen.getByRole('radiogroup', { name: 'Visualização' });
  await click(within(view).getByRole('radio', { name: '3D' }));
};

const heading = (title: string) => {
  return screen.getByText(title).parentElement as HTMLElement;
};

const heightGroup = () => {
  return screen.getByRole('radiogroup', { name: 'Altura representa' });
};

test('sub-blocks follow their gate: hidden in 2D, under the block in 3D', async () => {
  await renderSidebar();

  expect(screen.queryByText('Altura representa')).not.toBeInTheDocument();
  expect(screen.getByText('Escolha o modo.')).toBeInTheDocument();

  await pick3d();

  expect(screen.getByText('Altura representa')).toBeInTheDocument();
  expect(screen.getByText('Arraste o disco.')).toBeInTheDocument();
  // A gate that never opens leaves the sub-block stack empty.
  expect(screen.queryByText('Nunca aparece')).not.toBeInTheDocument();
});

test('a sub-block heading reads its control value on the right', async () => {
  await renderSidebar();
  await pick3d();

  expect(within(heading('Altura das extrusões')).getByText('3×')).toBeVisible();
  expect(within(heading('Opacidade')).getByText('80%')).toBeVisible();
  // A continuous track with no unit reads the bare number.
  expect(within(heading('Malha')).getByText('12')).toBeVisible();
  expect(
    within(heading('Rotação da câmera')).getByText('NE · 45°')
  ).toBeVisible();
  expect(
    within(heading('Altura representa')).getByText('habitantes')
  ).toBeVisible();
  // The controls leave their own readout to the heading: each reads once.
  expect(screen.getAllByText('3×')).toHaveLength(1);
  expect(screen.getAllByText('NE · 45°')).toHaveLength(1);
});

test('the heading follows the control as it moves', async () => {
  await renderSidebar();
  await pick3d();

  fireEvent.change(screen.getAllByRole('slider')[0], {
    target: { value: '0' },
  });
  expect(within(heading('Altura das extrusões')).getByText('1×')).toBeVisible();

  await click(screen.getByRole('button', { name: 'Rotate 45° right' }));
  expect(
    within(heading('Rotação da câmera')).getByText('E · 90°')
  ).toBeVisible();
});

test('a toggle or ramp sub-block shows no readout, the toggle no heading', async () => {
  await renderSidebar();
  await pick3d();

  // The toggle's row carries its title; there is no separate heading.
  expect(screen.getAllByText('Sombra')).toHaveLength(1);
  expect(
    screen.getByRole('button', { name: /Sombra/, pressed: false })
  ).toBeInTheDocument();
  expect(heading('Rampa').children).toHaveLength(1);
});

test('a list choice renders rows with icon, sublabel and a check on the chosen one', async () => {
  const { onVariableChange } = await renderSidebar();
  await pick3d();

  const rows = within(heightGroup()).getAllByRole('radio');
  expect(rows).toHaveLength(4);
  expect(rows[0]).toHaveAttribute('aria-checked', 'true');
  expect(within(rows[0]).getByText('0 – 100 mil hab.')).toBeInTheDocument();
  expect(within(rows[0]).getByTestId('choice-check')).toBeInTheDocument();
  expect(within(rows[1]).queryByTestId('choice-check')).not.toBeInTheDocument();
  // Gated shut: inert, but the list keeps its shape.
  expect(rows[3]).toBeDisabled();

  await click(rows[1]);

  expect(rows[1]).toHaveAttribute('aria-checked', 'true');
  expect(within(rows[1]).getByTestId('choice-check')).toBeInTheDocument();
  expect(onVariableChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ height: 'fam' })
  );
  expect(
    within(heading('Altura representa')).getByText('famílias')
  ).toBeVisible();
});

test('an option with no unit leaves the heading without a readout', async () => {
  await renderSidebar();
  await pick3d();

  await click(
    within(heightGroup()).getByRole('radio', { name: /Sem unidade/ })
  );

  expect(heading('Altura representa').children).toHaveLength(1);
});

test('a list declaring one option renders it as a read-only card', async () => {
  const { onVariableChange } = await renderSidebar({
    config: configWith({
      height: { ...heightChoice, options: [heightChoice.options[0]] },
    }),
  });
  await pick3d();

  expect(
    screen.queryByRole('radiogroup', { name: 'Altura representa' })
  ).not.toBeInTheDocument();
  expect(screen.getByText('População')).toBeInTheDocument();
  // The card names the dataset only; the range tells nothing apart.
  expect(screen.queryByText('0 – 100 mil hab.')).not.toBeInTheDocument();
  expect(
    within(heading('Altura representa')).getByText('habitantes')
  ).toBeVisible();
  // Still published, so the app reads the one value it draws.
  expect(onVariableChange).toHaveBeenCalledWith(
    expect.objectContaining({ height: 'pop' })
  );
});

test('a cards choice ignores the list-only fields', async () => {
  await renderSidebar({
    config: configWith({ height: { ...heightChoice, layout: 'cards' } }),
  });
  await pick3d();

  expect(within(heightGroup()).getAllByRole('radio')).toHaveLength(4);
  expect(screen.queryByTestId('choice-check')).not.toBeInTheDocument();
});

test('a sub-block control seeds a gate from its default', async () => {
  // `alone` defaults to `true`, so the sub-block gated on `false` stays shut
  // from the first render rather than flashing in.
  await renderSidebar({ variables: {} });
  expect(screen.queryByText('Nunca aparece')).not.toBeInTheDocument();
});

test('a sub-block gated on another sub-block resolves the default', async () => {
  await renderSidebar({
    config: {
      leftSidebar: {
        initialState: 'open',
        sections: [
          {
            id: 'configuracoes',
            header: { title: 'Configurações', icon: 'lucide:settings' },
            body: {
              kind: 'settings',
              blocks: [
                {
                  id: 'base',
                  title: 'Base',
                  control: {
                    kind: 'toggle',
                    menuId: 'base',
                    defaultValue: true,
                  },
                  subBlocks: [
                    {
                      id: 'escala',
                      title: 'Escala',
                      control: {
                        kind: 'choice',
                        menuId: 'scale',
                        defaultValue: 'b',
                        options: [
                          { value: 'a', label: 'A' },
                          { value: 'b', label: 'B' },
                        ],
                      },
                    },
                    {
                      id: 'dependente',
                      title: 'Dependente',
                      shownWhen: { menuId: 'scale', values: ['b'] },
                      control: {
                        kind: 'bearing',
                        menuId: 'bearing',
                      },
                    },
                  ],
                },
              ],
            },
          },
        ],
      },
    },
  });

  expect(screen.getByText('Dependente')).toBeInTheDocument();
  expect(within(heading('Dependente')).getByText('N · 0°')).toBeVisible();
});
