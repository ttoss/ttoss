/**
 * Right sidebar and slot configuration: which slots make the sidebar appear,
 * slot overrides, hiding, and the workspace provider/context API.
 */

import { act, fireEvent, render, screen } from '@ttoss/test-utils/react';
import {
  GeovisWorkspace,
  GeovisWorkspaceProvider,
  getInitialSelection,
  useGeovisWorkspace,
} from 'src';

import {
  config,
  openLeftSidebar,
  openRight,
  Provider,
  visualizationSpec,
  visualizationSpecWithLegends,
} from './geovisWorkspaceTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./geovisWorkspaceTestUtils').createGeoVisMock();
});

test('right sidebar renders only when a slot has content', () => {
  const { rerender } = render(
    <GeovisWorkspace
      config={openRight(config)}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Close details' })
  ).not.toBeInTheDocument();

  rerender(
    <GeovisWorkspace
      config={openRight({ ...config, legend: { description: 'Descrição' } })}
      visualizationSpec={visualizationSpec}
    />
  );

  expect(
    screen.getByRole('button', { name: 'Close details' })
  ).toBeInTheDocument();
});

test('left sidebar controls are absent when leftSidebar has no sections', () => {
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
      config={openRight({
        ...config,
        legend: { description: 'Descrição' },
        rightSidebar: { title: 'Camadas' },
      })}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

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
      config={openRight(configWithLegend)}
      visualizationSpec={visualizationSpecWithLegends}
    />,
    { wrapper: Provider }
  );

  expect(
    screen.getByText('Proporção da população total com 65 anos ou mais.')
  ).toBeInTheDocument();
  // Spec legends are map overlays now — the legend slot no longer auto-dumps
  // them into the right sidebar; it shows only the consumer's config.legend.
  expect(screen.queryByTestId('legend-classes')).not.toBeInTheDocument();
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
      config={openRight({
        ...config,
        legend: { sources: { items: [{ label: 'SEADE (2025)' }] } },
      })}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByText('SEADE (2025)')).toBeInTheDocument();
});

test('right sidebar is absent when the legend slot has no content and nothing else configures it', () => {
  render(
    <GeovisWorkspace
      config={openRight({ ...config, legend: {} })}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Close details' })
  ).not.toBeInTheDocument();
});

test('hiding the legend slot suppresses it even when the spec has legends', () => {
  render(
    <GeovisWorkspace
      config={openRight({ ...config, slots: { legend: { hidden: true } } })}
      visualizationSpec={visualizationSpecWithLegends}
    />,
    { wrapper: Provider }
  );

  expect(
    screen.queryByRole('button', { name: 'Close details' })
  ).not.toBeInTheDocument();
});

test('a controls slot override replaces the default sidebar and keeps the sidebar visible', async () => {
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
      config={openRight({
        ...config,
        slots: { metadata: { component: CustomMetadata } },
      })}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByTestId('custom-metadata')).toBeInTheDocument();
});

test('hidden takes precedence over an override for a right-sidebar slot', async () => {
  const CustomMetadata = () => {
    return <div data-testid="custom-metadata">meta</div>;
  };

  render(
    <GeovisWorkspace
      config={openRight({
        ...config,
        legend: { description: 'Descrição' },
        slots: { metadata: { component: CustomMetadata, hidden: true } },
      })}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

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

test('closing the right sidebar hides it, leaving no button over the map to reopen it', async () => {
  render(
    <GeovisWorkspace
      config={openRight({ ...config, legend: { description: 'Descrição' } })}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Close details' }));
  });

  // Hidden from the reader — and nothing over the map opens it again.
  expect(
    screen.queryByRole('button', { name: 'Close details' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();
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
    screen.getByRole('button', { name: 'Close details' })
  ).toBeInTheDocument();
});

test("a content component replaces the right sidebar's panels, and opens it through the workspace", async () => {
  const Content = () => {
    const { setRightSidebarOpen } = useGeovisWorkspace();
    return (
      <div>
        <p>Painel do app</p>
        <button
          type="button"
          onClick={() => {
            setRightSidebarOpen({ open: false });
          }}
        >
          Fechar painel
        </button>
      </div>
    );
  };

  render(
    <GeovisWorkspace
      config={openRight({
        ...config,
        legend: { description: 'Descrição' },
        rightSidebar: { title: 'Camadas', content: Content },
      })}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByText('Painel do app')).toBeInTheDocument();
  // The app's component owns the whole sidebar: no title, no default panels.
  expect(screen.queryByText('Camadas')).not.toBeInTheDocument();
  expect(screen.queryByText('Descrição')).not.toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Fechar painel' }));
  });
  expect(
    screen.queryByRole('button', { name: 'Fechar painel' })
  ).not.toBeInTheDocument();
});

test('a content component alone is enough to mount the right sidebar', () => {
  const Content = () => {
    return <p>Painel do app</p>;
  };

  render(
    <GeovisWorkspace
      config={{ rightSidebar: { content: Content } }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByText('Painel do app')).toBeInTheDocument();
});

test('getInitialSelection seeds the selection from section defaultValues', () => {
  expect(getInitialSelection({ config })).toEqual({
    population: undefined,
    economy: undefined,
  });

  expect(
    getInitialSelection({
      config: {
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
                    variations: [{ value: 'gdp', label: 'PIB' }],
                  },
                ],
              },
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

test('GeovisWorkspaceProvider manages left sidebar open state uncontrolled', async () => {
  const Consumer = () => {
    const { isLeftSidebarOpen, setLeftSidebarOpen } = useGeovisWorkspace();
    return (
      <button
        type="button"
        onClick={() => {
          return setLeftSidebarOpen({ open: !isLeftSidebarOpen });
        }}
      >
        {isLeftSidebarOpen ? 'open' : 'closed'}
      </button>
    );
  };

  render(
    <GeovisWorkspaceProvider config={config}>
      <Consumer />
    </GeovisWorkspaceProvider>,
    { wrapper: Provider }
  );

  // No controlled prop → the provider seeds and flips its own internal state.
  expect(screen.getByRole('button', { name: 'closed' })).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'closed' }));
  });

  expect(screen.getByRole('button', { name: 'open' })).toBeInTheDocument();
});

test('GeovisWorkspaceProvider manages right sidebar open state uncontrolled', async () => {
  const Consumer = () => {
    const { isRightSidebarOpen, setRightSidebarOpen } = useGeovisWorkspace();
    return (
      <button
        type="button"
        onClick={() => {
          return setRightSidebarOpen({ open: !isRightSidebarOpen });
        }}
      >
        {isRightSidebarOpen ? 'open' : 'closed'}
      </button>
    );
  };

  render(
    <GeovisWorkspaceProvider config={config}>
      <Consumer />
    </GeovisWorkspaceProvider>,
    { wrapper: Provider }
  );

  // No controlled prop → the provider seeds and flips its own internal state.
  expect(screen.getByRole('button', { name: 'closed' })).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'closed' }));
  });

  expect(screen.getByRole('button', { name: 'open' })).toBeInTheDocument();
});
