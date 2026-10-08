/**
 * The choice setting, the settings blocks shown only under another menu's
 * value, and the variation badge — the pieces of a 2D/3D "Visualização" block.
 */

import { render, screen, within } from '@ttoss/test-utils/react';
import * as React from 'react';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from 'src';

import { click, Provider, visualizationSpec } from './leftSidebarTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./leftSidebarTestUtils').createGeoVisMock();
});

const only3d = { menuId: 'view', values: ['3d'] };

const config: GeovisWorkspaceConfig = {
  leftSidebar: {
    initialState: 'open',
    sections: [
      {
        id: 'variacoes',
        header: { title: 'Variações', icon: 'lucide:layers' },
        body: {
          kind: 'variations',
          menuId: 'variacao',
          defaultValue: 'taxa',
          groups: [
            {
              id: 'base',
              label: 'Base',
              variations: [
                { value: 'taxa', label: 'Taxa', badge: '3D' },
                { value: 'pontos', label: 'Pontos' },
              ],
            },
          ],
        },
      },
      {
        id: 'configuracoes',
        header: { title: 'Configurações', icon: 'lucide:settings' },
        body: {
          kind: 'settings',
          blocks: [
            {
              id: 'visualizacao',
              title: 'Visualização',
              control: {
                kind: 'choice',
                menuId: 'view',
                defaultValue: '2d',
                glyphColors: ['#aaaaaa', '#bbbbbb', '#cccccc', '#dddddd'],
                options: [
                  {
                    value: '2d',
                    label: '2D',
                    sublabel: 'Plano',
                    glyph: 'flat',
                  },
                  {
                    value: '3d',
                    label: '3D',
                    sublabel: 'Extrudado',
                    glyph: 'extruded',
                    enabledWhen: { menuId: 'variacao', values: ['taxa'] },
                    disabledHint: 'Pontos não tem polígonos.',
                  },
                ],
              },
            },
            {
              id: 'altura',
              title: 'Altura',
              shownWhen: only3d,
              control: {
                kind: 'slider',
                menuId: 'scale',
                defaultValue: 3,
                stops: [
                  { value: 1, label: '1×' },
                  { value: 3, label: '3×' },
                ],
              },
            },
            {
              id: 'inclinacao',
              title: 'Inclinação',
              shownWhen: only3d,
              control: {
                kind: 'choice',
                menuId: 'pitch',
                options: [
                  { value: '30', label: '30°' },
                  { value: '45', label: '45°' },
                ],
              },
            },
            // Gated on settings menus, so their defaults resolve the gates
            // before the controls publish.
            {
              id: 'sombra',
              title: 'Sombra',
              shownWhen: { menuId: 'shadow', values: ['true'] },
              control: { kind: 'toggle', menuId: 'shadow', defaultValue: true },
            },
            {
              id: 'rampa',
              title: 'Rampa',
              shownWhen: { menuId: 'ramp', values: ['azuis'] },
              control: {
                kind: 'colorRamp',
                menuId: 'ramp',
                options: [{ id: 'azuis', label: 'Azuis', colors: ['#00f'] }],
              },
            },
            {
              id: 'rampa-escolhida',
              title: 'Rampa escolhida',
              shownWhen: { menuId: 'chosenRamp', values: ['verdes'] },
              control: {
                kind: 'colorRamp',
                menuId: 'chosenRamp',
                defaultValue: 'verdes',
                options: [{ id: 'verdes', label: 'Verdes', colors: ['#0f0'] }],
              },
            },
            {
              id: 'sem-opcoes',
              title: 'Sem opções',
              control: { kind: 'choice', menuId: 'none', options: [] },
            },
            {
              id: 'vazio',
              title: 'Vazio',
              shownWhen: { menuId: 'empty', values: ['x'] },
              control: { kind: 'choice', menuId: 'empty', options: [] },
            },
            {
              id: 'nunca',
              title: 'Nunca',
              shownWhen: { menuId: 'nowhere', values: ['x'] },
              control: { kind: 'toggle', menuId: 'never', defaultValue: false },
            },
          ],
        },
      },
    ],
  },
};

const renderSidebar = () => {
  const onVariableChange = jest.fn();
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpec}
      onVariableChange={onVariableChange}
    />,
    { wrapper: Provider }
  );
  return { onVariableChange };
};

const openSettings = async () => {
  await click(screen.getByRole('button', { name: 'Configurações' }));
};

const viewGroup = () => {
  return screen.getByRole('radiogroup', { name: 'Visualização' });
};

const option = (name: RegExp) => {
  return within(viewGroup()).getByRole('radio', { name });
};

test('the variation row carries its badge', () => {
  renderSidebar();
  expect(screen.getByText('3D')).toBeInTheDocument();
});

test('renders the options as cards, with glyphs in the given colors', async () => {
  const { onVariableChange } = renderSidebar();
  await openSettings();

  expect(option(/2D/)).toHaveAttribute('aria-checked', 'true');
  expect(option(/3D/)).toHaveAttribute('aria-checked', 'false');
  expect(within(viewGroup()).getByText('Plano')).toBeInTheDocument();
  // Flat: one face per cell. Extruded: front, side and top per cell.
  expect(option(/2D/).querySelectorAll('polygon')).toHaveLength(3);
  expect(option(/3D/).querySelectorAll('polygon')).toHaveLength(9);
  expect(option(/2D/).querySelector('polygon')).toHaveAttribute(
    'fill',
    '#aaaaaa'
  );
  expect(onVariableChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ view: '2d' })
  );
});

test('the 3D-only blocks appear once 3D is picked', async () => {
  const { onVariableChange } = renderSidebar();
  await openSettings();

  expect(screen.queryByText('Altura')).toBeNull();
  expect(screen.queryByRole('radiogroup', { name: 'Inclinação' })).toBeNull();

  await click(option(/3D/));

  expect(option(/3D/)).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByText('Altura')).toBeInTheDocument();
  const pitch = screen.getByRole('radiogroup', { name: 'Inclinação' });
  // No defaultValue: the first option is chosen.
  expect(within(pitch).getByRole('radio', { name: '30°' })).toHaveAttribute(
    'aria-checked',
    'true'
  );
  expect(onVariableChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ view: '3d', pitch: '30' })
  );
});

test('a closed gate disables the option, publishes the fallback, and remembers the pick', async () => {
  const { onVariableChange } = renderSidebar();
  await openSettings();
  await click(option(/3D/));

  await click(screen.getByRole('button', { name: 'Variações' }));
  await click(screen.getByRole('button', { name: /Pontos/ }));
  await openSettings();

  expect(option(/3D/)).toBeDisabled();
  expect(option(/2D/)).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByText('Pontos não tem polígonos.')).toBeInTheDocument();
  expect(screen.queryByText('Altura')).toBeNull();
  // The disabled glyph is drawn in greys, not the ramp.
  expect(option(/3D/).querySelector('polygon')).toHaveAttribute(
    'fill',
    '#E4DED3'
  );
  expect(onVariableChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ variacao: 'pontos', view: '2d' })
  );

  // Picking the inert card does nothing.
  await click(option(/3D/));
  expect(option(/2D/)).toHaveAttribute('aria-checked', 'true');

  await click(screen.getByRole('button', { name: 'Variações' }));
  await click(screen.getByRole('button', { name: /Taxa/ }));
  await openSettings();

  expect(option(/3D/)).toHaveAttribute('aria-checked', 'true');
  expect(onVariableChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ variacao: 'taxa', view: '3d' })
  );
});

test('blocks gated on settings menus resolve from their defaults', async () => {
  renderSidebar();
  await openSettings();

  expect(screen.getByText('Sombra')).toBeInTheDocument();
  expect(screen.getByText('Rampa')).toBeInTheDocument();
  expect(screen.getByText('Rampa escolhida')).toBeInTheDocument();
  // A choice with no options has no value, and a gate on a menu nothing
  // declares never opens.
  expect(screen.queryByText('Vazio')).toBeNull();
  expect(screen.queryByText('Nunca')).toBeNull();
});

test('a choice with no options renders an empty group and publishes nothing', async () => {
  const { onVariableChange } = renderSidebar();
  await openSettings();

  const group = screen.getByRole('radiogroup', { name: 'Sem opções' });
  expect(within(group).queryAllByRole('radio')).toHaveLength(0);
  expect(onVariableChange).not.toHaveBeenCalledWith(
    expect.objectContaining({ none: expect.anything() })
  );
});

/** An app that writes the view itself, as a permalink restore would. */
const ExternalWriter = () => {
  const [selection, setSelection] = React.useState<GeovisWorkspaceSelection>({
    variacao: 'taxa',
    view: '2d',
  });
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSelection((current) => {
            return { ...current, view: '3d' };
          });
        }}
      >
        restore 3d
      </button>
      <GeovisWorkspace
        config={config}
        visualizationSpec={visualizationSpec}
        variables={selection}
        onVariableChange={setSelection}
      />
    </>
  );
};

test('a value the app writes is adopted as the pick', async () => {
  render(<ExternalWriter />, { wrapper: Provider });
  await openSettings();
  expect(option(/2D/)).toHaveAttribute('aria-checked', 'true');

  await click(screen.getByRole('button', { name: 'restore 3d' }));

  expect(option(/3D/)).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByText('Altura')).toBeInTheDocument();
});
