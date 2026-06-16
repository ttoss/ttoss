import { I18nProvider } from '@ttoss/react-i18n';
import { act, fireEvent, render, screen } from '@ttoss/test-utils/react';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  GeovisWorkspaceProvider,
  getInitialSelection,
  useGeovisWorkspace,
} from 'src';

jest.mock('@ttoss/geovis', () => {
  return {
    GeoVisProvider: ({ children }: React.PropsWithChildren) => {
      return <div data-testid="geovis-provider">{children}</div>;
    },
    GeoVisCanvas: () => {
      return <div data-testid="geovis-canvas" />;
    },
  };
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

test('calls onSelectionChange with the full next selection', async () => {
  const onSelectionChange = jest.fn();

  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpec}
      onSelectionChange={onSelectionChange}
    />,
    { wrapper: Provider }
  );

  await openLeftSidebar();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Renda média' }));
  });

  expect(onSelectionChange).toHaveBeenCalledWith({
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

test('controlled selection prop drives the active item', async () => {
  render(
    <GeovisWorkspace
      config={config}
      visualizationSpec={visualizationSpec}
      selection={{ economy: 'income' }}
      onSelectionChange={jest.fn()}
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
