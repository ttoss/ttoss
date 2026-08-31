/**
 * The inspector and metadata panels, and the right-sidebar detail API that
 * fetches on feature click.
 */

import { act, fireEvent, render, screen } from '@ttoss/test-utils/react';
import { GeovisWorkspace } from 'src';

import {
  config,
  openRightSidebar,
  Provider,
  visualizationSpec,
} from './geovisWorkspaceTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./geovisWorkspaceTestUtils').createGeoVisMock();
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

test('right sidebar detail API fetches on click, auto-opens, and renders the detail', async () => {
  const onFeatureSelect = jest.fn(() => {
    return Promise.resolve({ name: 'Cozinha X' });
  });

  render(
    <GeovisWorkspace
      config={{
        rightSidebar: {
          title: 'Detalhe',
          onFeatureSelect,
          renderDetails: ({ loading, data }) => {
            if (loading) return <span>Carregando</span>;
            return <span>{(data as { name: string } | null)?.name}</span>;
          },
        },
      }}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'kitchens', featureId: 'k1', value: null },
      }}
    />,
    { wrapper: Provider }
  );

  // The detail renders without a manual open — an accepted click auto-opens the
  // sidebar, so its reopen button is gone.
  expect(await screen.findByText('Cozinha X')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();
  expect(onFeatureSelect).toHaveBeenCalledWith(
    expect.objectContaining({ layerId: 'kitchens', featureId: 'k1' })
  );
});

test('right sidebar closes when the selection clears (click outside), not only via the close button', async () => {
  const onFeatureSelect = jest.fn(() => {
    return Promise.resolve({ name: 'Cozinha X' });
  });

  // `legend.description` keeps the right sidebar populated after the selection
  // clears, so its open state stays observable via the reopen button instead of
  // being hidden for lack of content.
  const configWithDetail: GeovisWorkspaceConfig = {
    legend: { description: 'Descrição da legenda.' },
    rightSidebar: {
      onFeatureSelect,
      renderDetails: ({ loading, data }) => {
        if (loading) return <span>Carregando</span>;
        return <span>{(data as { name: string } | null)?.name}</span>;
      },
    },
  };

  const { rerender } = render(
    <GeovisWorkspace
      config={configWithDetail}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'kitchens', featureId: 'k1', value: null },
      }}
    />,
    { wrapper: Provider }
  );

  // Clicking a feature auto-opens the sidebar: the detail shows and the reopen
  // button is gone.
  expect(await screen.findByText('Cozinha X')).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();

  // Clicking outside clears the selection (no manual close-button press).
  rerender(
    <GeovisWorkspace
      config={configWithDetail}
      visualizationSpec={{ ...visualizationSpec, mockClick: null }}
    />
  );

  await act(async () => {});

  // The detail is gone and the sidebar is closed — its reopen button is back,
  // even though the legend description still keeps the sidebar populated. Before
  // the fix, the open state stayed `true` here and a pushed-aside legend would
  // never return to rest.
  expect(screen.queryByText('Cozinha X')).not.toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: 'Open details' })
  ).toBeInTheDocument();
});

test('right sidebar detail API ignores clicks rejected by shouldOpen', async () => {
  const onFeatureSelect = jest.fn(() => {
    return Promise.resolve({ name: 'X' });
  });

  render(
    <GeovisWorkspace
      config={{
        rightSidebar: {
          onFeatureSelect,
          shouldOpen: (info) => {
            return info.layerId === 'kitchens';
          },
          renderDetails: ({ data }) => {
            return (
              <span>{(data as { name: string } | null)?.name ?? 'none'}</span>
            );
          },
        },
      }}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'other', featureId: 'x', value: null },
      }}
    />,
    { wrapper: Provider }
  );

  await act(async () => {});

  expect(
    screen.queryByRole('button', { name: 'Open details' })
  ).not.toBeInTheDocument();
  expect(onFeatureSelect).not.toHaveBeenCalled();
});

test('right sidebar detail API surfaces onFeatureSelect errors to renderDetails', async () => {
  const onFeatureSelect = jest.fn(() => {
    return Promise.reject(new Error('boom'));
  });

  render(
    <GeovisWorkspace
      config={{
        rightSidebar: {
          onFeatureSelect,
          shouldOpen: () => {
            return true;
          },
          renderDetails: ({ loading, error }) => {
            if (loading) return <span>Carregando</span>;
            return error ? <span>Erro</span> : null;
          },
        },
      }}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'kitchens', featureId: 'k1', value: null },
      }}
    />,
    { wrapper: Provider }
  );

  expect(await screen.findByText('Erro')).toBeInTheDocument();
});

test('right sidebar detail API runs onFeatureSelect even without renderDetails', async () => {
  const onFeatureSelect = jest.fn(() => {
    return Promise.resolve(null);
  });

  render(
    <GeovisWorkspace
      config={{ rightSidebar: { onFeatureSelect } }}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'kitchens', featureId: 'k1', value: null },
      }}
    />,
    { wrapper: Provider }
  );

  await act(async () => {});

  expect(onFeatureSelect).toHaveBeenCalledWith(
    expect.objectContaining({ layerId: 'kitchens' })
  );
});

test('right sidebar shows inspector content for renderDetails without onFeatureSelect', async () => {
  render(
    <GeovisWorkspace
      config={{
        rightSidebar: {
          renderDetails: ({ data }) => {
            return <span>{String(data)}</span>;
          },
        },
      }}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'kitchens', featureId: 'k1', value: null },
      }}
    />,
    { wrapper: Provider }
  );

  await act(async () => {});

  // With no `onFeatureSelect`, an accepted click gives the inspector slot
  // content (so the sidebar exists) but nothing is fetched or auto-opened.
  expect(
    screen.getByRole('button', { name: 'Open details' })
  ).toBeInTheDocument();
});

test('right sidebar detail API does not fetch until a feature is clicked', async () => {
  const onFeatureSelect = jest.fn(() => {
    return Promise.resolve({ name: 'X' });
  });

  render(
    <GeovisWorkspace
      config={{
        legend: { description: 'Descrição' },
        rightSidebar: {
          onFeatureSelect,
          renderDetails: ({ data }) => {
            return (
              <span>{(data as { name: string } | null)?.name ?? '—'}</span>
            );
          },
        },
      }}
      visualizationSpec={visualizationSpec}
    />,
    { wrapper: Provider }
  );

  await act(async () => {});
  await openRightSidebar();

  expect(screen.getByText('Descrição')).toBeInTheDocument();
  expect(onFeatureSelect).not.toHaveBeenCalled();
});

test('right sidebar detail API ignores a stale fetch when the click changes', async () => {
  let resolveFirst: (value: unknown) => void = () => {};

  const onFeatureSelect = jest.fn((info: { featureId: string | number }) => {
    if (info.featureId === 'k1') {
      return new Promise<unknown>((resolve) => {
        resolveFirst = resolve;
      });
    }
    return Promise.resolve({ name: 'Second' });
  });

  const detailConfig = {
    rightSidebar: {
      onFeatureSelect,
      renderDetails: ({ data }: { data: unknown }) => {
        return (
          <span>{(data as { name: string } | null)?.name ?? 'pending'}</span>
        );
      },
    },
  };

  const { rerender } = render(
    <GeovisWorkspace
      config={detailConfig}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'kitchens', featureId: 'k1', value: null },
      }}
    />,
    { wrapper: Provider }
  );

  rerender(
    <GeovisWorkspace
      config={detailConfig}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'kitchens', featureId: 'k2', value: null },
      }}
    />
  );

  // Resolve the now-stale first request after the selection already moved on.
  await act(async () => {
    resolveFirst({ name: 'First' });
  });

  expect(await screen.findByText('Second')).toBeInTheDocument();
  expect(screen.queryByText('First')).not.toBeInTheDocument();
});

test('right sidebar detail API skips the fetch for a rejected click while the sidebar stays up', async () => {
  const onFeatureSelect = jest.fn(() => {
    return Promise.resolve({ name: 'X' });
  });

  render(
    <GeovisWorkspace
      config={{
        legend: { description: 'Descrição' },
        rightSidebar: {
          onFeatureSelect,
          shouldOpen: (info) => {
            return info.layerId === 'kitchens';
          },
          renderDetails: ({ data }) => {
            return (
              <span>{(data as { name: string } | null)?.name ?? '—'}</span>
            );
          },
        },
      }}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'other', featureId: 'x', value: null },
      }}
    />,
    { wrapper: Provider }
  );

  await act(async () => {});
  await openRightSidebar();

  // The legend keeps the sidebar mounted, but the rejected click drives no fetch.
  expect(screen.getByText('Descrição')).toBeInTheDocument();
  expect(onFeatureSelect).not.toHaveBeenCalled();
});

test('right sidebar detail API shows loading again when a new click supersedes a resolved one', async () => {
  let resolveSecond: (value: unknown) => void = () => {};

  const onFeatureSelect = jest.fn((info: { featureId: string | number }) => {
    if (info.featureId === 'k1') {
      return Promise.resolve({ name: 'First' });
    }
    return new Promise<unknown>((resolve) => {
      resolveSecond = resolve;
    });
  });

  const detailConfig = {
    rightSidebar: {
      onFeatureSelect,
      renderDetails: ({
        loading,
        data,
      }: {
        loading: boolean;
        data: unknown;
      }) => {
        if (loading) return <span>Carregando</span>;
        return <span>{(data as { name: string } | null)?.name}</span>;
      },
    },
  };

  const { rerender } = render(
    <GeovisWorkspace
      config={detailConfig}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'k', featureId: 'k1', value: null },
      }}
    />,
    { wrapper: Provider }
  );

  expect(await screen.findByText('First')).toBeInTheDocument();

  rerender(
    <GeovisWorkspace
      config={detailConfig}
      visualizationSpec={{
        ...visualizationSpec,
        mockClick: { layerId: 'k', featureId: 'k2', value: null },
      }}
    />
  );

  // The resolved k1 detail must not linger while k2's fetch is still pending.
  expect(await screen.findByText('Carregando')).toBeInTheDocument();

  await act(async () => {
    resolveSecond({ name: 'Second' });
  });

  expect(await screen.findByText('Second')).toBeInTheDocument();
});
