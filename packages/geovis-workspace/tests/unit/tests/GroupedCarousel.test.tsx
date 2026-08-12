import { I18nProvider } from '@ttoss/react-i18n';
import { act, fireEvent, render, screen } from '@ttoss/test-utils/react';
import type * as React from 'react';
import { GeovisWorkspace, type GeovisWorkspaceConfig } from 'src';

interface MockSpec {
  legends?: { id: string }[];
  mockResult?: unknown;
}

jest.mock('@ttoss/geovis', () => {
  const ReactModule = jest.requireActual('react');
  const MockGeoVisContext = ReactModule.createContext<unknown>(null);

  return {
    GeoVisProvider: ({
      spec,
      children,
    }: React.PropsWithChildren<{ spec: MockSpec }>) => {
      const result = spec.mockResult ?? {
        status: 'resolved',
        spec,
        warnings: [],
      };

      return (
        <MockGeoVisContext.Provider
          value={{ spec, result, click: null, dismiss: () => {} }}
        >
          <div data-testid="geovis-provider">{children}</div>
        </MockGeoVisContext.Provider>
      );
    },
    GeoVisCanvas: () => {
      return <div data-testid="geovis-canvas" />;
    },
    useGeoVis: () => {
      return ReactModule.useContext(MockGeoVisContext);
    },
    useGeoVisClick: () => {
      return null;
    },
    useDismissGeoVisClick: () => {
      return () => {};
    },
    GeoVisLegend: () => {
      return null;
    },
  };
});

const Provider = ({ children }: React.PropsWithChildren) => {
  return <I18nProvider>{children}</I18nProvider>;
};

const visualizationSpec = {
  engine: 'maplibre' as const,
  sources: [],
  layers: [],
};

const menu = {
  id: 'variable',
  title: 'Variações',
  defaultValue: 'a1',
  groups: [
    {
      id: 'g1',
      label: 'Grupo 1',
      items: [
        { value: 'a1', label: 'Item A1' },
        { value: 'a2', label: 'Item A2' },
      ],
    },
    {
      id: 'g2',
      label: 'Grupo 2',
      items: [
        { value: 'b1', label: 'Item B1' },
        { value: 'b2', label: 'Item B2' },
      ],
    },
  ],
};

const groupedConfig: GeovisWorkspaceConfig = {
  leftSidebar: { initialState: 'open' },
  controls: { menus: [menu] },
};

test('renders a tab per group, its title, and only the open group items', () => {
  render(
    <GeovisWorkspace
      config={groupedConfig}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByText('Variações')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Grupo 1' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Grupo 2' })).toBeInTheDocument();

  // The open group is the one holding `defaultValue` ('a1' → Grupo 1).
  expect(screen.getByRole('button', { name: 'Grupo 1' })).toHaveAttribute(
    'aria-current',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Item A1' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Item B1' })
  ).not.toBeInTheDocument();
});

test('switching tabs shows the other group without changing the selection', async () => {
  const onVariableChange = jest.fn();

  render(
    <GeovisWorkspace
      config={groupedConfig}
      visualizationSpec={visualizationSpec}
      onVariableChange={onVariableChange}
    />,
    { wrapper: Provider }
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Grupo 2' }));
  });

  expect(screen.getByRole('button', { name: 'Item B1' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Item A1' })
  ).not.toBeInTheDocument();
  // Browsing a group never mutates the selection.
  expect(onVariableChange).not.toHaveBeenCalled();
});

test('selecting an item in the open group marks it active and reports it', async () => {
  const onVariableChange = jest.fn();

  render(
    <GeovisWorkspace
      config={groupedConfig}
      visualizationSpec={visualizationSpec}
      onVariableChange={onVariableChange}
    />,
    { wrapper: Provider }
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Item A2' }));
  });

  expect(screen.getByRole('button', { name: 'Item A2' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(onVariableChange).toHaveBeenCalledWith({ variable: 'a2' });
});

test('the open group follows a controlled selection into another group', () => {
  const { rerender } = render(
    <GeovisWorkspace
      config={groupedConfig}
      visualizationSpec={visualizationSpec}
      variables={{ variable: 'a1' }}
      onVariableChange={jest.fn()}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByRole('button', { name: 'Item A1' })).toBeInTheDocument();

  rerender(
    <GeovisWorkspace
      config={groupedConfig}
      visualizationSpec={visualizationSpec}
      variables={{ variable: 'b2' }}
      onVariableChange={jest.fn()}
    />
  );

  // Decision A: the carousel jumps to the group holding the new selection so
  // the active item is never hidden.
  expect(screen.getByRole('button', { name: 'Grupo 2' })).toHaveAttribute(
    'aria-current',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Item B2' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(
    screen.queryByRole('button', { name: 'Item A1' })
  ).not.toBeInTheDocument();
});

test('defaultGroupId opens that group even when the default value lives elsewhere', () => {
  const config: GeovisWorkspaceConfig = {
    leftSidebar: { initialState: 'open' },
    controls: {
      menus: [
        {
          id: 'variable',
          title: 'Variações',
          defaultValue: 'a1',
          defaultGroupId: 'g2',
          groups: menu.groups,
        },
      ],
    },
  };

  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  expect(screen.getByRole('button', { name: 'Grupo 2' })).toHaveAttribute(
    'aria-current',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Item B1' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Item A1' })
  ).not.toBeInTheDocument();
});

test('a single-group menu renders its items without any tabs', () => {
  const config: GeovisWorkspaceConfig = {
    leftSidebar: { initialState: 'open' },
    controls: {
      menus: [
        {
          id: 'variable',
          title: 'Só um',
          groups: [
            {
              id: 'g',
              label: 'Único',
              items: [{ value: 'x', label: 'Item X' }],
            },
          ],
        },
      ],
    },
  };

  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  expect(screen.getByRole('button', { name: 'Item X' })).toBeInTheDocument();
  // The lone group is not surfaced as a navigable tab.
  expect(
    screen.queryByRole('button', { name: 'Único' })
  ).not.toBeInTheDocument();
});

test('a single-group menu with no title renders only its items', () => {
  const config: GeovisWorkspaceConfig = {
    leftSidebar: { initialState: 'open' },
    controls: {
      menus: [
        {
          id: 'variable',
          groups: [
            {
              id: 'g',
              label: 'Único',
              items: [{ value: 'x', label: 'Item X' }],
            },
          ],
        },
      ],
    },
  };

  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  expect(screen.getByRole('button', { name: 'Item X' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Único' })
  ).not.toBeInTheDocument();
});

test('an empty grouped menu renders nothing', () => {
  const config: GeovisWorkspaceConfig = {
    leftSidebar: { initialState: 'open' },
    controls: {
      menus: [{ id: 'variable', title: 'Vazio', groups: [] }],
    },
  };

  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  expect(screen.queryByText('Vazio')).not.toBeInTheDocument();
});

test('shows a navigation arrow only for a direction with hidden tabs, and it scrolls', async () => {
  render(
    <GeovisWorkspace
      config={groupedConfig}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  const strip = screen.getByRole('group', { name: 'Variações' });

  // Nothing measured as overflowing yet → no arrows.
  expect(
    screen.queryByRole('button', { name: 'Scroll groups forward' })
  ).not.toBeInTheDocument();

  // Force horizontal overflow with more content to the right (at the start).
  Object.defineProperty(strip, 'scrollWidth', {
    value: 500,
    configurable: true,
  });
  Object.defineProperty(strip, 'clientWidth', {
    value: 100,
    configurable: true,
  });
  Object.defineProperty(strip, 'scrollLeft', {
    value: 0,
    writable: true,
    configurable: true,
  });

  await act(async () => {
    fireEvent.scroll(strip);
  });

  const forward = screen.getByRole('button', { name: 'Scroll groups forward' });
  expect(forward).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Scroll groups backward' })
  ).not.toBeInTheDocument();

  (strip as HTMLElement & { scrollBy: jest.Mock }).scrollBy = jest.fn();
  await act(async () => {
    fireEvent.click(forward);
  });
  expect(
    (strip as HTMLElement & { scrollBy: jest.Mock }).scrollBy
  ).toHaveBeenCalled();

  // Scroll to the end → only the backward arrow, which also scrolls.
  Object.defineProperty(strip, 'scrollLeft', {
    value: 400,
    writable: true,
    configurable: true,
  });
  await act(async () => {
    fireEvent.scroll(strip);
  });

  const backward = screen.getByRole('button', {
    name: 'Scroll groups backward',
  });
  expect(backward).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Scroll groups forward' })
  ).not.toBeInTheDocument();

  await act(async () => {
    fireEvent.click(backward);
  });
  expect(
    (strip as HTMLElement & { scrollBy: jest.Mock }).scrollBy
  ).toHaveBeenCalledTimes(2);
});

test('a grouped menu with no title still renders its tabs', () => {
  const config: GeovisWorkspaceConfig = {
    leftSidebar: { initialState: 'open' },
    controls: {
      menus: [{ id: 'variable', defaultValue: 'a1', groups: menu.groups }],
    },
  };

  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  expect(screen.getByRole('button', { name: 'Grupo 1' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Item A1' })).toBeInTheDocument();
  expect(screen.queryByText('Variações')).not.toBeInTheDocument();
});

test('a controlled selection outside every group leaves the open group put', () => {
  const { rerender } = render(
    <GeovisWorkspace
      config={groupedConfig}
      visualizationSpec={visualizationSpec}
      variables={{ variable: 'a1' }}
      onVariableChange={jest.fn()}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByRole('button', { name: 'Item A1' })).toBeInTheDocument();

  rerender(
    <GeovisWorkspace
      config={groupedConfig}
      visualizationSpec={visualizationSpec}
      variables={{ variable: 'unknown' }}
      onVariableChange={jest.fn()}
    />
  );

  // A selection matching no group cannot move navigation, so the carousel
  // stays on the open group with nothing marked active.
  expect(screen.getByRole('button', { name: 'Grupo 1' })).toHaveAttribute(
    'aria-current',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Item A1' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});

test('falls back to the first group when the open group leaves the config', () => {
  const { rerender } = render(
    <GeovisWorkspace
      config={{
        leftSidebar: { initialState: 'open' },
        controls: {
          menus: [
            {
              id: 'variable',
              title: 'Variações',
              defaultGroupId: 'g2',
              groups: menu.groups,
            },
          ],
        },
      }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  // Opened on g2 via defaultGroupId.
  expect(screen.getByRole('button', { name: 'Item B1' })).toBeInTheDocument();

  rerender(
    <GeovisWorkspace
      config={{
        leftSidebar: { initialState: 'open' },
        controls: {
          menus: [
            {
              id: 'variable',
              title: 'Variações',
              groups: [
                menu.groups[0],
                {
                  id: 'g3',
                  label: 'Grupo 3',
                  items: [{ value: 'c1', label: 'Item C1' }],
                },
              ],
            },
          ],
        },
      }}
      visualizationSpec={visualizationSpec}
    />
  );

  // The remembered open group ('g2') is gone, so the carousel falls back to
  // the first group.
  expect(screen.getByRole('button', { name: 'Item A1' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Item B1' })
  ).not.toBeInTheDocument();
});
