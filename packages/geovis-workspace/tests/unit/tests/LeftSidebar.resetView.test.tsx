/**
 * Picking a different variation flies the map back to the spec's own `view`,
 * so every variation is read from the same starting frame.
 */

import { render, screen } from '@ttoss/test-utils/react';
import { GeovisWorkspace, type GeovisWorkspaceConfig } from 'src';
import { RESET_VIEW_DURATION_MS } from 'src/components/LeftSidebar/useResetMapView';

import { click, Provider } from './leftSidebarTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./leftSidebarTestUtils').createGeoVisMock();
});

const HOME = { center: [-46.63, -23.65] as [number, number], zoom: 9.3 };

const variations = [
  { value: 'a1', label: 'Item A1' },
  { value: 'a2', label: 'Item A2' },
];

const configWith = ({
  bodyReset,
  blockReset,
}: {
  bodyReset?: boolean;
  blockReset?: boolean;
} = {}): GeovisWorkspaceConfig => {
  return {
    leftSidebar: {
      initialState: 'open',
      sections: [
        {
          id: 'variacoes',
          header: { title: 'Variações', icon: 'lucide:layers' },
          body: {
            kind: 'variations',
            menuId: 'variable',
            defaultValue: 'a1',
            ...(bodyReset !== undefined && { resetViewOnChange: bodyReset }),
            groups: [{ id: 'g', label: 'Grupo', variations }],
          },
        },
        {
          id: 'recorte',
          header: { title: 'Recorte', icon: 'lucide:map' },
          body: {
            kind: 'filters',
            blocks: [
              {
                id: 'nivel',
                title: 'Nível',
                control: {
                  kind: 'variations',
                  menuId: 'level',
                  defaultValue: 'city',
                  ...(blockReset !== undefined && {
                    resetViewOnChange: blockReset,
                  }),
                  variations: [
                    { value: 'city', label: 'Município' },
                    { value: 'district', label: 'Distrito' },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
};

const renderWorkspace = ({
  config = configWith(),
  view = HOME,
}: {
  config?: GeovisWorkspaceConfig;
  /** The spec's `view`; `null` declares none. */
  view?: Record<string, unknown> | null;
} = {}) => {
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={{
        engine: 'maplibre',
        sources: [],
        layers: [],
        ...(view && { view }),
      }}
    />,
    { wrapper: Provider }
  );
};

const setViewMock = () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the mock's spy lives in the mocked module
  const { __setView } = require('@ttoss/geovis');
  __setView.mockClear();
  return __setView as jest.Mock;
};

test('a different variation flies back to the home view, angles included', async () => {
  const setView = setViewMock();
  renderWorkspace({ view: { ...HOME, pitch: 60, bearing: -25 } });

  await click(screen.getByRole('button', { name: 'Item A2' }));

  expect(setView).toHaveBeenCalledWith({
    center: HOME.center,
    zoom: HOME.zoom,
    pitch: 60,
    bearing: -25,
    duration: RESET_VIEW_DURATION_MS,
  });
});

test('a flat home view resets the angles to 0', async () => {
  const setView = setViewMock();
  renderWorkspace();

  await click(screen.getByRole('button', { name: 'Item A2' }));

  expect(setView).toHaveBeenCalledWith(
    expect.objectContaining({ pitch: 0, bearing: 0 })
  );
});

test('picking the variation already active leaves the camera alone', async () => {
  const setView = setViewMock();
  renderWorkspace();

  await click(screen.getByRole('button', { name: 'Item A1' }));

  expect(setView).not.toHaveBeenCalled();
});

test('a menu that opts out keeps the camera where it is', async () => {
  const setView = setViewMock();
  renderWorkspace({ config: configWith({ bodyReset: false }) });

  await click(screen.getByRole('button', { name: 'Item A2' }));

  expect(setView).not.toHaveBeenCalled();
});

test('a variations block resets too, unless it opts out', async () => {
  const setView = setViewMock();
  renderWorkspace();
  await click(screen.getByRole('button', { name: 'Recorte' }));

  await click(screen.getByRole('button', { name: 'Distrito' }));
  expect(setView).toHaveBeenCalledTimes(1);

  // Back to the active value: no move.
  await click(screen.getByRole('button', { name: 'Distrito' }));
  expect(setView).toHaveBeenCalledTimes(1);
});

test('a variations block that opts out keeps the camera where it is', async () => {
  const setView = setViewMock();
  renderWorkspace({ config: configWith({ blockReset: false }) });
  await click(screen.getByRole('button', { name: 'Recorte' }));

  await click(screen.getByRole('button', { name: 'Distrito' }));

  expect(setView).not.toHaveBeenCalled();
});

test('a spec without a fixed view has no home to fly to', async () => {
  const setView = setViewMock();
  renderWorkspace({ view: null });

  await click(screen.getByRole('button', { name: 'Item A2' }));

  expect(setView).not.toHaveBeenCalled();
});
