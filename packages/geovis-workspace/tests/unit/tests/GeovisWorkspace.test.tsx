import { I18nProvider } from '@ttoss/react-i18n';
import { act, fireEvent, render, screen } from '@ttoss/test-utils/react';
import type * as React from 'react';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  GeovisWorkspaceProvider,
  getInitialSelection,
  LayerListControls,
  useGeovisWorkspace,
} from 'src';

interface MockClick {
  layerId: string;
  featureId: string | number;
  value: number | string | null;
}

interface MockSpec {
  legends?: { id: string }[];
  mockResult?: unknown;
  mockClick?: MockClick | null;
}

jest.mock('@ttoss/geovis', () => {
  const ReactModule = jest.requireActual('react');
  const MockGeoVisContext = ReactModule.createContext<{
    spec: MockSpec;
    result: unknown;
    click: MockClick | null;
    dismiss: () => void;
  } | null>(null);

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

      const [click, setClick] = ReactModule.useState<MockClick | null>(() => {
        return spec.mockClick ?? null;
      });

      ReactModule.useEffect(() => {
        setClick(spec.mockClick ?? null);
      }, [spec.mockClick]);

      const dismiss = ReactModule.useCallback(() => {
        setClick(null);
      }, []);

      return (
        <MockGeoVisContext.Provider value={{ spec, result, click, dismiss }}>
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
    useGeoVisClick: () => {
      const context = ReactModule.useContext(MockGeoVisContext);
      if (!context) {
        throw new Error('useGeoVisClick used outside GeoVisProvider');
      }
      return context.click;
    },
    useDismissGeoVisClick: () => {
      const context = ReactModule.useContext(MockGeoVisContext);
      if (!context) {
        throw new Error('useDismissGeoVisClick used outside GeoVisProvider');
      }
      return context.dismiss;
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

const resolvedWithWarnings = {
  status: 'resolved' as const,
  spec: visualizationSpec,
  warnings: [
    {
      code: 'policy-violation' as const,
      subject: { path: 'metadata.metricField', id: 'policy-invalid' },
      message: 'Spec violates policy.',
      repair: [
        {
          kind: 'set-value' as const,
          path: 'metadata.metricField',
          value: 'safe-field',
          label: "Use 'safe-field'",
        },
      ],
    },
  ],
};

const failingResult = {
  status: 'mismatch' as const,
  issues: [
    {
      code: 'unknown-map-data-id' as const,
      subject: { path: 'layers[0].mapDataId', id: 'missing-id' },
      message: 'Unknown map data id.',
      repair: [
        {
          kind: 'allowed-values' as const,
          path: 'layers[0].mapDataId',
          values: ['choropleth', 'dots'],
        },
      ],
    },
  ],
};

const visualizationSpecWithWarnings = {
  ...visualizationSpec,
  mockResult: resolvedWithWarnings,
};

const failingVisualizationSpec = {
  ...visualizationSpec,
  mockResult: failingResult,
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

test('warnings panel shows a resolved result warning with its i18n text and subject', async () => {
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpecWithWarnings}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(
    screen.getByText('This map violates the cartography policy.')
  ).toBeInTheDocument();
  expect(
    screen.getByText('metadata.metricField (policy-invalid)')
  ).toBeInTheDocument();
});

test('warnings panel shows a blocking failure that follows a successful resolve', async () => {
  const { rerender } = render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  rerender(
    <GeovisWorkspace
      config={config}
      visualizationSpec={failingVisualizationSpec}
    />
  );

  await openRightSidebar();

  expect(
    screen.getByText('A layer references a map data id that does not exist.')
  ).toBeInTheDocument();
  expect(screen.getByTestId('geovis-canvas')).toBeInTheDocument();
});

test('warnings panel falls back to the raw message for a code with no catalog entry', async () => {
  const specWithUnknownCode = {
    ...visualizationSpec,
    mockResult: {
      status: 'resolved' as const,
      spec: visualizationSpec,
      warnings: [
        {
          code: 'made-up-code' as never,
          subject: { path: '$' },
          message: 'Raw untranslated message.',
        },
      ],
    },
  };

  render(
    <GeovisWorkspace config={config} visualizationSpec={specWithUnknownCode} />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.getByText('Raw untranslated message.')).toBeInTheDocument();
});

test('an allowed-values repair renders one button per value and calls onRepair with the chosen value', async () => {
  const onRepair = jest.fn();

  const { rerender } = render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpec}
      onRepair={onRepair}
    />,
    { wrapper: Provider }
  );

  rerender(
    <GeovisWorkspace
      config={config}
      visualizationSpec={failingVisualizationSpec}
      onRepair={onRepair}
    />
  );

  await openRightSidebar();

  const choroplethButton = screen.getByRole('button', { name: 'choropleth' });
  const dotsButton = screen.getByRole('button', { name: 'dots' });
  expect(choroplethButton).toBeInTheDocument();
  expect(dotsButton).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(choroplethButton);
  });

  expect(onRepair).toHaveBeenCalledWith({
    kind: 'set-value',
    path: 'layers[0].mapDataId',
    value: 'choropleth',
  });
});

test('a set-value repair calls onRepair with the option as-is', async () => {
  const onRepair = jest.fn();

  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpecWithWarnings}
      onRepair={onRepair}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: "Use 'safe-field'" }));
  });

  expect(onRepair).toHaveBeenCalledWith({
    kind: 'set-value',
    path: 'metadata.metricField',
    value: 'safe-field',
    label: "Use 'safe-field'",
  });
});

test('a set-value repair without a label falls back to the stringified value', async () => {
  const specWithUnlabeledRepair = {
    ...visualizationSpec,
    mockResult: {
      status: 'resolved' as const,
      spec: visualizationSpec,
      warnings: [
        {
          code: 'policy-violation' as const,
          subject: { path: 'metadata.metricField' },
          message: 'Spec violates policy.',
          repair: [
            {
              kind: 'set-value' as const,
              path: 'metadata.metricField',
              value: 'safe-field',
            },
          ],
        },
      ],
    },
  };

  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={specWithUnlabeledRepair}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(
    screen.getByRole('button', { name: 'safe-field' })
  ).toBeInTheDocument();
});

test('repair buttons render disabled rather than hidden when onRepair is omitted', async () => {
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpecWithWarnings}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(
    screen.getByRole('button', { name: "Use 'safe-field'" })
  ).toBeDisabled();
});

test('cold start: a failing result before any resolve shows the empty state instead of the canvas', () => {
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={failingVisualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByText('Map could not be shown')).toBeInTheDocument();
  expect(
    screen.getByText('A layer references a map data id that does not exist.')
  ).toBeInTheDocument();
  expect(screen.queryByTestId('geovis-canvas')).not.toBeInTheDocument();
});

test('cold start: the warnings panel itself suppresses issues even when the sidebar shows for the legend slot', async () => {
  render(
    <GeovisWorkspace
      config={{ ...config, legend: { description: 'Descrição' } }}
      visualizationSpec={failingVisualizationSpec}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.getByText('Descrição')).toBeInTheDocument();
  // Shown once, by the map's cold-start empty state — not a second time by
  // the warnings panel, which is also visible now (for the legend slot).
  expect(
    screen.getAllByText('A layer references a map data id that does not exist.')
  ).toHaveLength(1);
});

test('once a resolve succeeds, a later failure keeps the canvas instead of re-showing the cold-start state', () => {
  const { rerender } = render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={failingVisualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByText('Map could not be shown')).toBeInTheDocument();

  rerender(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />
  );

  expect(screen.getByTestId('geovis-canvas')).toBeInTheDocument();
  expect(screen.queryByText('Map could not be shown')).not.toBeInTheDocument();

  rerender(
    <GeovisWorkspace
      config={config}
      visualizationSpec={failingVisualizationSpec}
    />
  );

  expect(screen.getByTestId('geovis-canvas')).toBeInTheDocument();
  expect(screen.queryByText('Map could not be shown')).not.toBeInTheDocument();
});

test('right sidebar is absent when nothing is selected on the map', () => {
  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();
});

test('inspector panel shows the selected feature and clearing the selection removes it', async () => {
  const { rerender } = render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();

  rerender(
    <GeovisWorkspace
      config={config}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'districts-fill', featureId: 'sp', value: 42 },
      }}
    />
  );

  await openRightSidebar();

  expect(screen.getByText('districts-fill')).toBeInTheDocument();
  expect(screen.getByText('42')).toBeInTheDocument();
  expect(screen.getByText('sp')).toBeInTheDocument();
});

test('inspector panel shows a fallback when the selected feature has no value', async () => {
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'districts-fill', featureId: 'sp', value: null },
      }}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.getByText('No value')).toBeInTheDocument();
});

test('dismissing the inspector selection clears the panel and closes the sidebar content', async () => {
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'districts-fill', featureId: 'sp', value: 42 },
      }}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.getByText('districts-fill')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss selection' }));
  });

  expect(screen.queryByText('districts-fill')).not.toBeInTheDocument();
});

test('metadata panel shows the map type and pluralized source count', async () => {
  const specWithMetadata = {
    ...visualizationSpec,
    mapType: 'choropleth',
    sources: [{ id: 's1' }, { id: 's2' }],
  };

  render(
    <GeovisWorkspace config={config} visualizationSpec={specWithMetadata} />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.getByText('Map type: choropleth')).toBeInTheDocument();
  expect(screen.getByText('2 sources')).toBeInTheDocument();
});

test('metadata panel uses the singular form for a single source', async () => {
  const specWithOneSource = {
    ...visualizationSpec,
    sources: [{ id: 's1' }],
  };

  render(
    <GeovisWorkspace config={config} visualizationSpec={specWithOneSource} />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.getByText('1 source')).toBeInTheDocument();
});

test('metadata panel contributes no content and no sidebar when the spec has neither mapType nor sources', () => {
  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();
});

test('metadata panel is absent while another slot keeps the sidebar open', async () => {
  render(
    <GeovisWorkspace
      config={{ ...config, legend: { description: 'Descrição' } }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  await openRightSidebar();

  expect(screen.getByText('Descrição')).toBeInTheDocument();
  expect(screen.queryByText(/Map type:/)).not.toBeInTheDocument();
  expect(screen.queryByText(/source/)).not.toBeInTheDocument();
});

test('LayerListControls renders a visibility checkbox per layer and calls onLayerVisibilityChange on toggle', async () => {
  const onLayerVisibilityChange = jest.fn();

  const specWithLayers = {
    ...visualizationSpec,
    layers: [
      {
        id: 'districts-fill',
        title: 'Districts',
        visible: true,
        activeLegendId: 'classes',
      },
      { id: 'roads', visible: false },
    ],
  };

  render(
    <GeovisWorkspace
      config={{ slots: { controls: { component: LayerListControls } } }}
      visualizationSpec={specWithLayers}
      onLayerVisibilityChange={onLayerVisibilityChange}
    />,
    { wrapper: Provider }
  );

  await openLeftSidebar();

  const districtsCheckbox = screen.getByRole('checkbox', {
    name: 'Toggle visibility of layer districts-fill',
  });
  const roadsCheckbox = screen.getByRole('checkbox', {
    name: 'Toggle visibility of layer roads',
  });

  expect(districtsCheckbox).toBeChecked();
  expect(screen.getByText('Districts')).toBeInTheDocument();
  expect(screen.getByText('classes')).toBeInTheDocument();

  expect(roadsCheckbox).not.toBeChecked();
  expect(screen.getByText('roads')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(districtsCheckbox);
  });

  expect(onLayerVisibilityChange).toHaveBeenCalledWith('districts-fill', false);

  await act(async () => {
    fireEvent.click(roadsCheckbox);
  });

  expect(onLayerVisibilityChange).toHaveBeenCalledWith('roads', true);
});
