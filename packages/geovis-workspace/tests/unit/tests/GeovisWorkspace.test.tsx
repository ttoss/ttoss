import { I18nProvider } from '@ttoss/react-i18n';
import { act, fireEvent, render, screen } from '@ttoss/test-utils/react';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  GeovisWorkspaceProvider,
  getInitialSelection,
  useGeovisWorkspace,
} from 'src';

type MockClickInfo = {
  layerId: string;
  sourceId: string;
  featureId: string | number;
  value: number | string | null;
  lngLat: [number, number];
  point: { x: number; y: number };
};

// Controls what `useGeoVisClick()` returns inside FeatureClickBridge. Reset in
// beforeEach; set via `mockClick(...)` to simulate a map click.
let mockClickInfo: MockClickInfo | null = null;

jest.mock('@ttoss/geovis', () => {
  return {
    GeoVisProvider: ({ children }: React.PropsWithChildren) => {
      return <div data-testid="geovis-provider">{children}</div>;
    },
    GeoVisCanvas: () => {
      return <div data-testid="geovis-canvas" />;
    },
    useGeoVisClick: () => {
      return mockClickInfo;
    },
  };
});

const feature = (
  featureId: string | number,
  overrides: Partial<MockClickInfo> = {}
): MockClickInfo => {
  return {
    layerId: 'regions-fill',
    sourceId: 'regions',
    featureId,
    value: null,
    lngLat: [-46.6, -23.5],
    point: { x: 0, y: 0 },
    ...overrides,
  };
};

beforeEach(() => {
  mockClickInfo = null;
});

const Provider = ({ children }: React.PropsWithChildren) => {
  return <I18nProvider>{children}</I18nProvider>;
};

const config: GeovisWorkspaceConfig = {
  leftSidebar: {
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
  rightSidebar: {},
};

const visualizationSpec = {
  id: 'test-spec',
  engine: 'maplibre' as const,
  sources: [],
  layers: [],
};

const openLeftSidebar = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
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
      config={{
        ...config,
        leftSidebar: { ...config.leftSidebar!, initialState: 'open' },
      }}
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
    leftSidebar: {
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

test('right sidebar renders only when defined in the config', () => {
  const { rerender } = render(
    <GeovisWorkspace
      config={{ leftSidebar: config.leftSidebar }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();

  rerender(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />
  );

  expect(
    screen.getByRole('button', { name: 'Open details' })
  ).toBeInTheDocument();
});

test('left sidebar controls are absent when leftSidebar is undefined', () => {
  render(
    <GeovisWorkspace
      config={{ rightSidebar: {} }}
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
      config={{ ...config, rightSidebar: { title: 'Camadas' } }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open details' }));
  });

  expect(screen.getByText('Camadas')).toBeInTheDocument();
});

test('right sidebar renders the legendWithColor panel from the config', async () => {
  const configWithLegend: GeovisWorkspaceConfig = {
    ...config,
    rightSidebar: {
      title: 'População 65+',
      legendWithColor: {
        description: 'Proporção da população total com 65 anos ou mais.',
        legend: {
          title: 'Classes',
          items: [
            { color: '#eff3ff', label: '0% – 5%' },
            { color: '#08519c', label: '20% – 100%' },
          ],
        },
        sources: {
          title: 'Fonte dos dados:',
          items: [
            { label: 'SEADE (2025)', href: 'https://example.com/seade' },
            { label: 'Geometria: Distritos Municipais.' },
          ],
        },
      },
    },
  };

  render(
    <GeovisWorkspace
      config={configWithLegend}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open details' }));
  });

  expect(
    screen.getByText('Proporção da população total com 65 anos ou mais.')
  ).toBeInTheDocument();
  expect(screen.getByText('Classes')).toBeInTheDocument();
  expect(screen.getByText('0% – 5%')).toBeInTheDocument();
  expect(screen.getByText('Fonte dos dados:')).toBeInTheDocument();
  expect(
    screen.getByText('Geometria: Distritos Municipais.')
  ).toBeInTheDocument();

  const link = screen.getByRole('link', { name: 'SEADE (2025)' });
  expect(link).toHaveAttribute('href', 'https://example.com/seade');
  expect(link).toHaveAttribute('target', '_blank');
});

test('closing the right sidebar brings its open button back', async () => {
  render(
    <GeovisWorkspace config={config} visualizationSpec={visualizationSpec} />,
    { wrapper: Provider }
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open details' }));
  });

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
        leftSidebar: {
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

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

// Builds a fresh element each render: reusing the same element reference would
// make React bail out and skip re-rendering the click bridge, so it would never
// re-read the (updated) mocked click selection.
const renderWorkspace = (
  rightSidebar: GeovisWorkspaceConfig['rightSidebar']
) => {
  const element = () => {
    return (
      <GeovisWorkspace
        config={{ rightSidebar }}
        visualizationSpec={visualizationSpec}
      />
    );
  };

  const view = render(element(), { wrapper: Provider });

  const click = async (info: MockClickInfo | null) => {
    await act(async () => {
      mockClickInfo = info;
      view.rerender(element());
    });
  };

  return { ...view, click };
};

test('runs onFeatureSelect on click, opens the right sidebar and renders the details', async () => {
  const onFeatureSelect = jest.fn().mockResolvedValue({ name: 'Centro' });

  const { click } = renderWorkspace({
    onFeatureSelect,
    renderDetails: ({ data, feature }) => {
      return (
        <div>{`data:${String((data as { name?: string })?.name)} id:${String(
          feature?.featureId
        )}`}</div>
      );
    },
  });

  await click(feature(42));

  expect(onFeatureSelect).toHaveBeenCalledWith(
    expect.objectContaining({ featureId: 42 })
  );
  // The sidebar auto-opened, so its close button is present (open button gone).
  expect(
    screen.getByRole('button', { name: 'Close details' })
  ).toBeInTheDocument();
  expect(await screen.findByText('data:Centro id:42')).toBeInTheDocument();
});

test('renderDetails receives the loading state before the data resolves', async () => {
  const pending = deferred<{ name: string }>();

  const { click } = renderWorkspace({
    onFeatureSelect: () => {
      return pending.promise;
    },
    renderDetails: ({ loading, data }) => {
      return (
        <div>
          {loading
            ? 'loading'
            : `data:${String((data as { name?: string })?.name)}`}
        </div>
      );
    },
  });

  await click(feature(1));

  expect(screen.getByText('loading')).toBeInTheDocument();

  await act(async () => {
    pending.resolve({ name: 'Norte' });
  });

  expect(await screen.findByText('data:Norte')).toBeInTheDocument();
});

test('renderDetails receives the error when onFeatureSelect rejects', async () => {
  const onFeatureSelect = jest.fn().mockRejectedValue(new Error('boom'));

  const { click } = renderWorkspace({
    onFeatureSelect,
    renderDetails: ({ loading, error }) => {
      if (loading) {
        return <div>loading</div>;
      }

      return <div>{`error:${(error as Error)?.message}`}</div>;
    },
  });

  await click(feature(7));

  expect(await screen.findByText('error:boom')).toBeInTheDocument();
});

test('a newer click supersedes an in-flight request (stale response ignored)', async () => {
  const first = deferred<{ name: string }>();
  const second = deferred<{ name: string }>();

  const onFeatureSelect = jest
    .fn()
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise);

  const { click } = renderWorkspace({
    onFeatureSelect,
    renderDetails: ({ data }) => {
      return <div>{`data:${String((data as { name?: string })?.name)}`}</div>;
    },
  });

  await click(feature(1));
  await click(feature(2));

  // Resolve the stale (first) request last — it must not overwrite the latest.
  await act(async () => {
    second.resolve({ name: 'second' });
  });
  await act(async () => {
    first.resolve({ name: 'first' });
  });

  expect(screen.getByText('data:second')).toBeInTheDocument();
  expect(screen.queryByText('data:first')).not.toBeInTheDocument();
});

test('clearing the selection removes the rendered details', async () => {
  const onFeatureSelect = jest.fn().mockResolvedValue({ name: 'Centro' });

  const { click } = renderWorkspace({
    onFeatureSelect,
    renderDetails: ({ data }) => {
      return <div>{`data:${String((data as { name?: string })?.name)}`}</div>;
    },
  });

  await click(feature(42));

  expect(await screen.findByText('data:Centro')).toBeInTheDocument();

  await click(null);

  expect(screen.queryByText('data:Centro')).not.toBeInTheDocument();
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
