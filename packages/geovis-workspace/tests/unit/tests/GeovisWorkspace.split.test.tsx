/**
 * The split map, edited from the sidebar: the app hands the workspace what it
 * does for a single map — `variables`, `onVariableChange`,
 * `visualizationSpec` — and the workspace keeps the side not being edited.
 */

import type { GeoVisSplitInput, VisualizationSpec } from '@ttoss/geovis';
import { render, renderHook, screen, within } from '@ttoss/test-utils/react';
import * as React from 'react';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  type GeovisWorkspaceSelection,
} from 'src';
import { bearingMenusOf, pickMenus } from 'src/split/cameraMenus';
import { useWorkspaceSplit } from 'src/split/WorkspaceSplit';

import { Provider } from './geovisWorkspaceTestUtils';
import { click } from './leftSidebarTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./geovisWorkspaceTestUtils').createGeoVisMock();
});

const splitInputs = (): GeoVisSplitInput[] => {
  return jest.requireMock('@ttoss/geovis').mockSplitInputs;
};

/** The ids of the specs each side draws now. */
const sides = () => {
  const inputs = splitInputs();
  const last = inputs[inputs.length - 1];
  return {
    a: (last.sides.a.spec as { id?: string }).id,
    b: (last.sides.b.spec as { id?: string }).id,
  };
};

const config: GeovisWorkspaceConfig = {
  leftSidebar: {
    initialState: 'open',
    sections: [
      {
        id: 'variacoes',
        header: { title: 'Variações' },
        body: {
          kind: 'variations',
          menuId: 'variacao',
          groups: [
            {
              id: 'indicadores',
              label: 'Indicadores',
              variations: [
                { value: 'taxa', label: 'Taxa' },
                { value: 'renda', label: 'Renda' },
              ],
            },
          ],
        },
      },
      {
        id: 'configuracoes',
        header: { title: 'Configurações' },
        body: {
          kind: 'settings',
          blocks: [
            {
              id: 'view',
              title: 'Visualização',
              control: {
                kind: 'choice',
                menuId: 'view',
                defaultValue: '2d',
                options: [
                  { value: '2d', label: '2D' },
                  { value: '3d', label: '3D' },
                ],
              },
            },
            {
              id: 'pitch',
              title: 'Inclinação',
              control: {
                kind: 'choice',
                menuId: 'pitch',
                defaultValue: '0',
                options: [
                  { value: '0', label: '0°' },
                  { value: '45', label: '45°' },
                ],
              },
            },
            {
              id: 'opacity',
              title: 'Opacidade',
              control: {
                kind: 'choice',
                menuId: 'opacity',
                defaultValue: '1',
                options: [
                  { value: '1', label: '100%' },
                  { value: '0.5', label: '50%' },
                ],
              },
              subBlocks: [
                {
                  id: 'bearing',
                  title: 'Rotação',
                  control: { kind: 'bearing', menuId: 'bearing' },
                },
              ],
            },
          ],
        },
      },
    ],
  },
};

/** The spec an app builds from a selection, as for a single map. */
const specOf = (selection: GeovisWorkspaceSelection): VisualizationSpec => {
  const view3d = selection.view === '3d';
  return {
    id: `spec-${selection.variacao}-${selection.opacity}`,
    engine: 'maplibre',
    view: { pitch: Number(selection.pitch ?? 0), bearing: 0 },
    sources: [],
    layers: [
      {
        id: 'fill',
        sourceId: 's',
        geometry: 'polygon',
        paint: { fillOpacity: Number(selection.opacity ?? 1) },
        ...(view3d && { extrusion: { maxHeight: 100 } }),
      },
    ],
  } as VisualizationSpec;
};

const INITIAL: GeovisWorkspaceSelection = {
  variacao: 'taxa',
  view: '2d',
  pitch: '0',
  opacity: '1',
};

const App = ({ onChange }: { onChange: jest.Mock }) => {
  const [selection, setSelection] = React.useState(INITIAL);
  const spec = React.useMemo(() => {
    return specOf(selection);
  }, [selection]);
  return (
    <GeovisWorkspace
      config={config}
      visualizationSpec={spec}
      variables={selection}
      onVariableChange={(next) => {
        onChange(next);
        setSelection(next);
      }}
    />
  );
};

/**
 * An app that builds its spec only when asked — as one that fetches the data
 * a selection needs before it can draw it.
 */
const SlowApp = () => {
  const [selection, setSelection] = React.useState(INITIAL);
  const [spec, setSpec] = React.useState(() => {
    return specOf(INITIAL);
  });
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSpec(specOf(selection));
        }}
      >
        build the spec
      </button>
      <GeovisWorkspace
        config={config}
        visualizationSpec={spec}
        variables={selection}
        onVariableChange={setSelection}
      />
    </>
  );
};

const renderApp = () => {
  splitInputs().length = 0;
  const onChange = jest.fn();
  render(<App onChange={onChange} />, { wrapper: Provider });
  return { onChange };
};

const pick = async (group: string, name: string) => {
  await click(
    within(screen.getByRole('radiogroup', { name: group })).getByRole('radio', {
      name,
    })
  );
};

const openTab = async (name: string) => {
  await click(screen.getByRole('button', { name }));
};

const splitMap = async () => {
  await click(screen.getByRole('button', { name: 'mock split' }));
};

const sideRadio = (side: 'A' | 'B') => {
  return within(screen.getByRole('radiogroup', { name: 'Map side' })).getByRole(
    'radio',
    { name: `Map ${side}` }
  );
};

describe('the split map, edited side by side', () => {
  test('no side block on a single map, and both sides on the app spec', () => {
    renderApp();
    expect(screen.queryByText('Editing side')).toBeNull();
    expect(sides()).toEqual({ a: 'spec-taxa-1', b: 'spec-taxa-1' });
  });

  test('splitting shows the block, with side A edited', async () => {
    renderApp();
    await splitMap();

    expect(screen.getByText('Editing side')).toBeInTheDocument();
    expect(sideRadio('A')).toHaveAttribute('aria-checked', 'true');
    expect(sideRadio('B')).toHaveAttribute('aria-checked', 'false');
  });

  test('editing one side leaves the other as it was', async () => {
    renderApp();
    await splitMap();
    await click(screen.getByRole('button', { name: /Renda/ }));

    expect(sides()).toEqual({ a: 'spec-renda-1', b: 'spec-taxa-1' });
  });

  test("switching sides hands back the other side's selection", async () => {
    const { onChange } = renderApp();
    await splitMap();
    await click(screen.getByRole('button', { name: /Renda/ }));

    await click(sideRadio('B'));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ variacao: 'taxa' })
    );
    expect(sideRadio('B')).toHaveAttribute('aria-checked', 'true');
    expect(sides()).toEqual({ a: 'spec-renda-1', b: 'spec-taxa-1' });

    // A click on the other half of the map switches too.
    await click(sideRadio('A'));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ variacao: 'renda' })
    );
  });

  test('a click on the other half of the map makes it the side edited', async () => {
    const { onChange } = renderApp();
    await splitMap();
    await click(screen.getByRole('button', { name: /Renda/ }));

    await click(screen.getByRole('button', { name: 'mock click half b' }));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ variacao: 'taxa' })
    );
  });

  test('copy makes the other side this one, swap exchanges them', async () => {
    renderApp();
    await splitMap();
    await click(screen.getByRole('button', { name: /Renda/ }));

    await click(screen.getByRole('button', { name: 'Swap sides' }));
    expect(sides()).toEqual({ a: 'spec-taxa-1', b: 'spec-renda-1' });

    await click(
      screen.getByRole('button', { name: "Copy side A's settings to side B" })
    );
    expect(sides()).toEqual({ a: 'spec-taxa-1', b: 'spec-taxa-1' });
  });

  test('the settings that move the camera are shared by both sides', async () => {
    const { onChange } = renderApp();
    await splitMap();
    await openTab('Configurações');
    await pick('Visualização', '3D');
    await pick('Inclinação', '45°');
    await pick('Opacidade', '50%');

    await click(sideRadio('B'));
    // B keeps its own opacity, and takes the camera's view and pitch.
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ view: '3d', pitch: '45', opacity: '1' })
    );

    await pick('Inclinação', '0°');
    await click(sideRadio('A'));
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ view: '3d', pitch: '0', opacity: '0.5' })
    );
  });

  test('picking the side already edited changes nothing', async () => {
    const { onChange } = renderApp();
    await splitMap();
    const calls = onChange.mock.calls.length;

    await click(sideRadio('A'));
    expect(onChange.mock.calls.length).toBe(calls);
  });

  test('a switched side keeps its stored spec until the app builds the new one', async () => {
    splitInputs().length = 0;
    render(<SlowApp />, { wrapper: Provider });
    await splitMap();
    await click(screen.getByRole('button', { name: /Renda/ }));
    await click(screen.getByRole('button', { name: 'build the spec' }));
    expect(sides()).toEqual({ a: 'spec-renda-1', b: 'spec-taxa-1' });

    await click(sideRadio('B'));
    // The app's spec still draws A's selection: B shows the one stored.
    expect(sides()).toEqual({ a: 'spec-renda-1', b: 'spec-taxa-1' });

    await click(screen.getByRole('button', { name: 'build the spec' }));
    expect(sides()).toEqual({ a: 'spec-renda-1', b: 'spec-taxa-1' });
  });

  test('back to a single map, the block goes away', async () => {
    renderApp();
    await splitMap();
    await click(screen.getByRole('button', { name: 'mock single' }));

    expect(screen.queryByText('Editing side')).toBeNull();
  });
});

test('outside a workspace the split reads a single map whose actions do nothing', () => {
  const { result } = renderHook(() => {
    return useWorkspaceSplit();
  });
  expect(result.current.isSplit).toBe(false);
  result.current.editSide('b');
  result.current.copyToOther();
  result.current.swapSides();
  expect(result.current.editing).toBe('a');
});

describe('camera menus', () => {
  test('every bearing control is one, sub-blocks included', () => {
    expect(bearingMenusOf(config.leftSidebar!.sections)).toEqual(['bearing']);
  });

  test('pickMenus takes only the menus a selection holds', () => {
    expect(
      pickMenus({ pitch: '45', view: '3d' }, new Set(['pitch', 'bearing']))
    ).toEqual({ pitch: '45' });
  });
});
