import { I18nProvider } from '@ttoss/react-i18n';
import { act, fireEvent, render, screen } from '@ttoss/test-utils/react';
import type * as React from 'react';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  GeovisWorkspaceProvider,
  getInitialSelection,
  useGeovisWorkspace,
} from 'src';

jest.mock('@ttoss/geovis', () => {
  const ReactModule = jest.requireActual('react');
  const MockGeoVisContext = ReactModule.createContext<{
    spec: { legends?: { id: string }[] };
  } | null>(null);

  return {
    GeoVisProvider: ({
      spec,
      children,
    }: React.PropsWithChildren<{ spec: { legends?: { id: string }[] } }>) => {
      return (
        <MockGeoVisContext.Provider value={{ spec }}>
          <div data-testid="geovis-provider">{children}</div>
        </MockGeoVisContext.Provider>
      );
    },
    GeoVisCanvas: () => {
      return <div data-testid="geovis-canvas" />;
    },
    useGeoVis: () => {
      const context = ReactModule.useContext(MockGeoVisContext);
      if (!context) throw new Error('useGeoVis used outside GeoVisProvider');
      return context;
    },
    GeoVisLegend: ({ legendId }: { legendId: string }) => {
      return <div data-testid={`legend-${legendId}`}>{legendId}</div>;
    },
  };
});

const Provider = ({ children }: React.PropsWithChildren) => {
  return <I18nProvider>{children}</I18nProvider>;
};

const config: GeovisWorkspaceConfig = {
  controls: {
    menus: [
      {
        id: 'population',
        title: 'População',
        items: [
          { value: '5year-65plus', label: 'Faixa (% da pop 65+)' },
          { value: '0-14', label: '0 a 14 anos' },
        ],
      },
      {
        id: 'economy',
        title: 'Economia',
        items: [
          { value: 'gdp', label: 'PIB' },
          { value: 'income', label: 'Renda média' },
        ],
      },
    ],
  },
};

const visualizationSpec = {
  id: 'test-spec',
  engine: 'maplibre' as const,
  sources: [],
  layers: [],
};

const visualizationSpecWithLegends = {
  ...visualizationSpec,
  legends: [{ id: 'classes' }],
};

const openLeftSidebar = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  });
};

const openRightSidebar = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open details' }));
  });
};

test('renders the GeoVis map canvas inside the main content area', () => {
  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
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

test('clicking the open button reveals the menu groups and items', async () => {
  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  await openLeftSidebar();

  expect(screen.getByText('População')).toBeInTheDocument();
  expect(screen.getByText('Economia')).toBeInTheDocument();
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

test('left sidebar starts open when initialState is "open"', () => {
  render(
    <GeovisWorkspace
      config={{ ...config, leftSidebar: { initialState: 'open' } }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByText('População')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Open menu' })
  ).not.toBeInTheDocument();
});

test('left sidebar stays closed when initialState is "closed"', () => {
  render(
    <GeovisWorkspace
      config={{ ...config, leftSidebar: { initialState: 'closed' } }}
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

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'PIB' }));
  });

  expect(screen.getByRole('button', { name: 'PIB' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
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
    fireEvent.click(screen.getByRole('button', { name: 'Renda média' }));
  });

  expect(onVariableChange).toHaveBeenCalledWith({
    population: undefined,
    economy: 'income',
  });
});

test('initializes selection from defaultValue', async () => {
  const configWithDefault: GeovisWorkspaceConfig = {
    controls: {
      menus: [
        {
          id: 'economy',
          title: 'Economia',
          defaultValue: 'gdp',
          items: [
            { value: 'gdp', label: 'PIB' },
            { value: 'income', label: 'Renda média' },
          ],
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

  expect(screen.getByRole('button', { name: 'Renda média' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('button', { name: 'PIB' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
});

test('right sidebar renders only when a slot has content', () => {
  const { rerender } = render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();

  rerender(
    <GeovisWorkspace
      config={{ ...config, legend: { description: 'Descrição' } }}
      visualizationSpec={visualizationSpec}
    />
  );

  expect(
    screen.getByRole('button', { name: 'Open details' })
  ).toBeInTheDocument();
});

test('left sidebar controls are absent when controls has no menus', () => {
  render(
    <GeovisWorkspace
      config={{ legend: { description: 'Descrição' } }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Open menu' })
  ).not.toBeInTheDocument();
});

test('right sidebar shows a custom title', async () => {
  render(
    <GeovisWorkspace
      config={{
        ...config,
        legend: { description: 'Descrição' },
        rightSidebar: { title: 'Camadas' },
      }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.getByText('Camadas')).toBeInTheDocument();
});

test('right sidebar renders the legend panel from the config', async () => {
  const configWithLegend: GeovisWorkspaceConfig = {
    ...config,
    rightSidebar: { title: 'População 65+' },
    legend: {
      description: 'Proporção da população total com 65 anos ou mais.',
      sources: {
        title: 'Fonte dos dados:',
        items: [
          { label: 'SEADE (2025)', href: 'https://example.com/seade' },
          { label: 'Geometria: Distritos Municipais.' },
        ],
      },
    },
  };

  render(
    <GeovisWorkspace
      config={configWithLegend}
      visualizationSpec={visualizationSpecWithLegends}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(
    screen.getByText('Proporção da população total com 65 anos ou mais.')
  ).toBeInTheDocument();
  expect(screen.getByTestId('legend-classes')).toBeInTheDocument();
  expect(screen.getByText('Fonte dos dados:')).toBeInTheDocument();
  expect(
    screen.getByText('Geometria: Distritos Municipais.')
  ).toBeInTheDocument();

  const link = screen.getByRole('link', { name: 'SEADE (2025)' });
  expect(link).toHaveAttribute('href', 'https://example.com/seade');
  expect(link).toHaveAttribute('target', '_blank');
});

test('right sidebar shows when the legend slot only has sources configured', async () => {
  render(
    <GeovisWorkspace
      config={{
        ...config,
        legend: { sources: { items: [{ label: 'SEADE (2025)' }] } },
      }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.getByText('SEADE (2025)')).toBeInTheDocument();
});

test('right sidebar is absent when the legend slot has no content and nothing else configures it', () => {
  render(
    <GeovisWorkspace
      config={{ ...config, legend: {} }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();
});

test('hiding the legend slot suppresses it even when the spec has legends', () => {
  render(
    <GeovisWorkspace
      config={{ ...config, slots: { legend: { hidden: true } } }}
      visualizationSpec={visualizationSpecWithLegends}
    />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();
});

test('a controls slot override replaces the default menu panel and keeps the sidebar visible', async () => {
  const CustomControls = () => {
    return <div data-testid="custom-controls">custom</div>;
  };

  render(
    <GeovisWorkspace
      config={{ slots: { controls: { component: CustomControls } } }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  await openLeftSidebar();

  expect(screen.getByTestId('custom-controls')).toBeInTheDocument();
  expect(screen.queryByText('População')).not.toBeInTheDocument();
});

test('hiding the map slot renders no canvas', () => {
  render(
    <GeovisWorkspace
      config={{ ...config, slots: { map: { hidden: true } } }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.queryByTestId('geovis-canvas')).not.toBeInTheDocument();
});

test('a map slot override replaces the default canvas', () => {
  const CustomMap = () => {
    return <div data-testid="custom-map">custom map</div>;
  };

  render(
    <GeovisWorkspace
      config={{ ...config, slots: { map: { component: CustomMap } } }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByTestId('custom-map')).toBeInTheDocument();
  expect(screen.queryByTestId('geovis-canvas')).not.toBeInTheDocument();
});

test('right sidebar shows via a slot override even when legend has no config', async () => {
  const CustomMetadata = () => {
    return <div data-testid="custom-metadata">meta</div>;
  };

  render(
    <GeovisWorkspace
      config={{ ...config, slots: { metadata: { component: CustomMetadata } } }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.getByTestId('custom-metadata')).toBeInTheDocument();
});

test('hidden takes precedence over an override for a right-sidebar slot', async () => {
  const CustomMetadata = () => {
    return <div data-testid="custom-metadata">meta</div>;
  };

  render(
    <GeovisWorkspace
      config={{
        ...config,
        legend: { description: 'Descrição' },
        slots: { metadata: { component: CustomMetadata, hidden: true } },
      }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.queryByTestId('custom-metadata')).not.toBeInTheDocument();
});

test('hiding the controls slot removes the left sidebar even with menus configured', () => {
  render(
    <GeovisWorkspace
      config={{ ...config, slots: { controls: { hidden: true } } }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Open menu' })
  ).not.toBeInTheDocument();
});

test('closing the right sidebar brings its open button back', async () => {
  render(
    <GeovisWorkspace
      config={{ ...config, legend: { description: 'Descrição' } }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }));
  });

  expect(
    screen.getByRole('button', { name: 'Open details' })
  ).toBeInTheDocument();
});

test('right sidebar starts open when initialState is "open"', () => {
  render(
    <GeovisWorkspace
      config={{
        ...config,
        legend: { description: 'Descrição' },
        rightSidebar: { title: 'Camadas', initialState: 'open' },
      }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByText('Camadas')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();
});

test('getInitialSelection seeds the selection from menu defaultValues', () => {
  expect(getInitialSelection({ config })).toEqual({
    population: undefined,
    economy: undefined,
  });

  expect(
    getInitialSelection({
      config: {
        controls: {
          menus: [
            {
              id: 'economy',
              title: 'Economia',
              defaultValue: 'gdp',
              items: [{ value: 'gdp', label: 'PIB' }],
            },
          ],
        },
      },
    })
  ).toEqual({ economy: 'gdp' });
});

test('useGeovisWorkspace throws when used outside provider', () => {
  const BrokenComponent = () => {
    useGeovisWorkspace();
    return null;
  };

  expect(() => {
    render(<BrokenComponent />, { wrapper: Provider });
  }).toThrow(
    'useGeovisWorkspace must be used within a GeovisWorkspaceProvider'
  );
});

test('GeovisWorkspaceProvider exposes context to consumers', () => {
  const Consumer = () => {
    const { selection } = useGeovisWorkspace();
    return <div>{selection.population ?? 'none'}</div>;
  };

  render(
    <GeovisWorkspaceProvider config={config}>
      <Consumer />
    </GeovisWorkspaceProvider>,
    { wrapper: Provider }
  );

  expect(screen.getByText('none')).toBeInTheDocument();
});
