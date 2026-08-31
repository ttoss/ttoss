/**
 * Workspace layout, the left sidebar and variable selection. Right-sidebar
 * slots, the warnings panel and the inspector/detail API each have their own
 * suite alongside this one.
 */

import { useGeoVis } from '@ttoss/geovis';
import { act, fireEvent, render, screen } from '@ttoss/test-utils/react';
import { GeovisWorkspace, useGeovisWorkspace } from 'src';
import { LEFT_SIDEBAR_CONTROL_CLEARANCE } from 'src/controlOffset';

import {
  config,
  openLeftSidebar,
  Provider,
  visualizationSpec,
} from './geovisWorkspaceTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./geovisWorkspaceTestUtils').createGeoVisMock();
});

test('renders the GeoVis map canvas inside the main content area', () => {
  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  expect(screen.getByTestId('geovis-canvas')).toBeInTheDocument();
});

test('renders with "bare" appearance (no card chrome) without breaking', () => {
  render(
    <GeovisWorkspace
      config={{ ...config, appearance: 'bare' }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByTestId('geovis-canvas')).toBeInTheDocument();
});

test('left sidebar is closed by default and shows the open button', () => {
  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
});

test('clicking the open button reveals the section tabs and items', async () => {
  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  await openLeftSidebar();

  // Both sections render as tabs; the active (first) tab's body is mounted.
  expect(screen.getByRole('button', { name: 'População' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Economia' })).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Faixa (% da pop 65+)' })
  ).toBeInTheDocument();

  // Switch to the economy tab to reach its variations.
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Economia' }));
  });
  expect(screen.getByRole('button', { name: 'PIB' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Open menu' })
  ).not.toBeInTheDocument();
});

test('closing the left sidebar brings the open button back', async () => {
  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  await openLeftSidebar();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
  });

  expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
});

test("shifts the map's layer control clear of the left sidebar while open", async () => {
  // Reads the live spec fed to `GeoVisProvider` so the test observes the exact
  // `control.offset` the workspace hands the map as the sidebar opens/closes.
  // A `controls` slot override replaces the whole sidebar (including its
  // built-in close button), so the probe renders its own close control via the
  // workspace context to drive the same open/close transitions.
  const ControlOffsetProbe = () => {
    const { spec } = useGeoVis();
    const { setLeftSidebarOpen } = useGeovisWorkspace();
    return (
      <>
        <div data-testid="control-offset">
          {JSON.stringify(spec.control?.offset ?? null)}
        </div>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => {
            return setLeftSidebarOpen({ open: false });
          }}
        />
      </>
    );
  };

  render(
    <GeovisWorkspace
      config={{ slots: { controls: { component: ControlOffsetProbe } } }}
      visualizationSpec={{
        ...visualizationSpec,
        control: { id: 'layers', position: 'bottom-left', items: [] },
      }}
    />,
    { wrapper: Provider }
  );

  // Closed: the control keeps its own (unset) offset — the map is untouched.
  expect(screen.getByTestId('control-offset')).toHaveTextContent('null');

  await openLeftSidebar();

  expect(screen.getByTestId('control-offset')).toHaveTextContent(
    JSON.stringify({ x: LEFT_SIDEBAR_CONTROL_CLEARANCE })
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Close menu' }));
  });

  expect(screen.getByTestId('control-offset')).toHaveTextContent('null');
});

test('left sidebar starts open when initialState is "open"', () => {
  render(
    <GeovisWorkspace
      config={{
        ...config,
        leftSidebar: { ...config.leftSidebar!, initialState: 'open' },
      }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByRole('button', { name: 'População' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Open menu' })
  ).not.toBeInTheDocument();
});

test('left sidebar stays closed when initialState is "closed"', () => {
  render(
    <GeovisWorkspace
      config={{
        ...config,
        leftSidebar: { ...config.leftSidebar!, initialState: 'closed' },
      }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
});

test('selecting an item marks it active without affecting other groups', async () => {
  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  await openLeftSidebar();

  // Choose PIB in the economy tab.
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Economia' }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'PIB' }));
  });
  expect(screen.getByRole('button', { name: 'PIB' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );

  // The population tab's variation is untouched by the economy selection.
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'População' }));
  });
  expect(
    screen.getByRole('button', { name: 'Faixa (% da pop 65+)' })
  ).toHaveAttribute('aria-pressed', 'false');
});

test('calls onVariableChange with the full next selection', async () => {
  const onVariableChange = jest.fn();

  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpec}
      onVariableChange={onVariableChange}
    />,
    { wrapper: Provider }
  );

  await openLeftSidebar();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Economia' }));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Renda média' }));
  });

  expect(onVariableChange).toHaveBeenCalledWith({
    population: undefined,
    economy: 'income',
  });
});

test('initializes selection from defaultValue', async () => {
  const configWithDefault: GeovisWorkspaceConfig = {
    leftSidebar: {
      sections: [
        {
          id: 'economy',
          header: { title: 'Economia' },
          body: {
            kind: 'variations',
            menuId: 'economy',
            defaultValue: 'gdp',
            groups: [
              {
                id: 'economy',
                label: 'Economia',
                variations: [
                  { value: 'gdp', label: 'PIB' },
                  { value: 'income', label: 'Renda média' },
                ],
              },
            ],
          },
        },
      ],
    },
  };

  render(
    <GeovisWorkspace
      config={configWithDefault}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  await openLeftSidebar();

  expect(screen.getByRole('button', { name: 'PIB' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});

test('controlled variables prop drives the active item', async () => {
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpec}
      variables={{ economy: 'income' }}
      onVariableChange={jest.fn()}
    />,
    { wrapper: Provider }
  );

  await openLeftSidebar();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Economia' }));
  });

  expect(screen.getByRole('button', { name: 'Renda média' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('button', { name: 'PIB' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});
