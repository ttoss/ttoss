import { I18nProvider } from '@ttoss/react-i18n';
import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from '@ttoss/test-utils/react';
import type * as React from 'react';
import { GeovisWorkspace, type GeovisWorkspaceConfig } from 'src';

interface MockSpec {
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

type Preview = {
  sections: NonNullable<GeovisWorkspaceConfig['leftSidebar']>['sections'];
};

/** A full two-tab preview: a flat variations list and the three filter kinds. */
const preview: Preview = {
  sections: [
    {
      id: 'vars',
      header: { title: 'Variações', icon: 'lucide:layout-list' },
      body: {
        kind: 'variations',
        menuId: 'variable',
        defaultValue: 'a1',
        groups: [
          {
            id: 'g1',
            label: 'Grupo 1',
            variations: [
              { value: 'a1', label: 'Item A1', icon: 'lucide:map' },
              { value: 'a2', label: 'Item A2' },
            ],
          },
          {
            id: 'g2',
            label: 'Grupo 2',
            variations: [{ value: 'b1', label: 'Item B1' }],
          },
        ],
      },
    },
    {
      id: 'filtros',
      header: { title: 'Filtros', icon: 'lucide:filter' },
      body: {
        kind: 'filters',
        blocks: [
          {
            id: 'periodo',
            title: 'Linha do tempo',
            icon: 'lucide:clock',
            control: {
              kind: 'timeline',
              menuId: 'ano',
              min: 2022,
              max: 2024,
              step: 1,
              defaultValue: 2023,
              unitLabel: 'itens',
              histogram: [
                { key: 2022, count: 10 },
                { key: 2023, count: 20 },
                { key: 2024, count: 30 },
              ],
            },
          },
          {
            id: 'chips',
            title: 'Chips',
            control: {
              kind: 'chips',
              multiple: true,
              defaultSelected: ['x'],
              options: [
                { id: 'x', label: 'Chip X', emoji: '🟢' },
                { id: 'y', label: 'Chip Y', icon: 'lucide:leaf' },
                { id: 'z', label: 'Chip Z' },
              ],
            },
          },
          {
            id: 'loc',
            title: 'Local',
            icon: 'lucide:search',
            defaultOpen: false,
            control: {
              kind: 'locator',
              placeholder: 'Buscar município...',
              minChars: 2,
              options: [
                { id: '1', label: 'São Paulo', sublabel: 'SP · Brasil' },
                { id: '2', label: 'Santos' },
              ],
            },
          },
        ],
      },
    },
  ],
};

const renderPreview = (
  props: Partial<React.ComponentProps<typeof GeovisWorkspace>> = {},
  previewConfig: Preview = preview
) => {
  return render(
    <GeovisWorkspace
      config={{ leftSidebar: { initialState: 'open', ...previewConfig } }}
      visualizationSpec={visualizationSpec}
      {...props}
    />,
    { wrapper: Provider }
  );
};

const click = async (element: HTMLElement) => {
  await act(async () => {
    fireEvent.click(element);
  });
};

const openFiltros = async () => {
  await click(screen.getByRole('button', { name: 'Filtros' }));
};

test('header mirrors the active tab and the variations tab lists every variation', () => {
  renderPreview();

  // Header shows the active (first) tab's title; the tab bar has both tabs.
  expect(screen.getByText('Variações')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Variações' })).toHaveAttribute(
    'aria-current',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Filtros' })).toBeInTheDocument();

  // The flat list shows all variations across groups; the default is active.
  expect(screen.getByRole('button', { name: 'Item A1' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(screen.getByRole('button', { name: 'Item A2' })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  expect(screen.getByRole('button', { name: 'Item B1' })).toBeInTheDocument();
});

test('the chip filter count shows as a badge on the Filtros tab', () => {
  renderPreview();

  // `defaultSelected: ['x']` → the Filtros tab carries a "1" badge.
  const filtros = screen.getByRole('button', { name: 'Filtros' });
  expect(within(filtros).getByText('1')).toBeInTheDocument();
});

test('the header switches to the Filtros tab and reveals its controls', async () => {
  renderPreview();

  await openFiltros();

  expect(screen.getByRole('button', { name: 'Filtros' })).toHaveAttribute(
    'aria-current',
    'true'
  );
  // Two headers reading "Filtros" now: none — header text is "Filtros".
  expect(screen.getByText('Linha do tempo')).toBeInTheDocument();
  // The variations list is no longer mounted.
  expect(
    screen.queryByRole('button', { name: 'Item A1' })
  ).not.toBeInTheDocument();
});

test('selecting a variation reports it through the shared selection', async () => {
  const onVariableChange = jest.fn();
  renderPreview({ onVariableChange });

  await click(screen.getByRole('button', { name: 'Item A2' }));

  expect(screen.getByRole('button', { name: 'Item A2' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  expect(onVariableChange).toHaveBeenCalledWith(
    expect.objectContaining({ variable: 'a2' })
  );
});

test('the timeline publishes its default year to the shared selection on mount', () => {
  const onVariableChange = jest.fn();
  renderPreview({ onVariableChange });

  expect(onVariableChange).toHaveBeenCalledWith(
    expect.objectContaining({ ano: '2023' })
  );
});

test('the timeline seeds its year from a controlled selection', async () => {
  const onVariableChange = jest.fn();
  renderPreview({ variables: { ano: '2024' }, onVariableChange });

  await openFiltros();

  // Seeded at 2024 → the max stepper is a no-op and the footer shows 2024.
  const slider = screen.getByRole('slider');
  expect(slider).toHaveValue('2024');
});

test('the histogram, slider and steppers all drive the year', async () => {
  const onVariableChange = jest.fn();
  renderPreview({ onVariableChange });
  await openFiltros();

  // Clicking a histogram bar jumps to that year.
  await click(screen.getByTitle('2022: 10'));
  expect(onVariableChange).toHaveBeenCalledWith(
    expect.objectContaining({ ano: '2022' })
  );

  // The prev stepper clamps at the min (still 2022).
  await click(screen.getByRole('button', { name: '2022' }));
  const slider = screen.getByRole('slider');
  expect(slider).toHaveValue('2022');

  // The slider sets an explicit value.
  await act(async () => {
    fireEvent.change(slider, { target: { value: '2023' } });
  });
  expect(onVariableChange).toHaveBeenCalledWith(
    expect.objectContaining({ ano: '2023' })
  );

  // The next stepper advances then clamps at the max.
  await click(screen.getByRole('button', { name: '2024' }));
  expect(onVariableChange).toHaveBeenCalledWith(
    expect.objectContaining({ ano: '2024' })
  );
});

test('play advances the year on a timer and stops at the ceiling', async () => {
  jest.useFakeTimers();
  try {
    const onVariableChange = jest.fn();
    renderPreview({ onVariableChange });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    });
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();

    // 2023 → 2024 after one tick (default cadence is 1s).
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onVariableChange).toHaveBeenCalledWith(
      expect.objectContaining({ ano: '2024' })
    );

    // At the ceiling the next tick stops playback.
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

test('pressing play at the ceiling restarts from the minimum', async () => {
  jest.useFakeTimers();
  try {
    const onVariableChange = jest.fn();
    renderPreview({ variables: { ano: '2024' }, onVariableChange });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    });

    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('2022');
  } finally {
    jest.useRealTimers();
  }
});

test('toggling and clearing chips updates the badge', async () => {
  renderPreview();
  await openFiltros();

  const filtros = screen.getByRole('button', { name: 'Filtros' });
  expect(within(filtros).getByText('1')).toBeInTheDocument();

  // Turn on a second chip → badge 2, and a "clear" action appears.
  await click(screen.getByRole('button', { name: /Chip Y/ }));
  expect(within(filtros).getByText('2')).toBeInTheDocument();

  // In multiple-select mode, toggling an active chip removes just that one.
  await click(screen.getByRole('button', { name: /Chip X/ }));
  expect(within(filtros).getByText('1')).toBeInTheDocument();

  await click(screen.getByRole('button', { name: /Limpar 1 filtro/ }));
  expect(within(filtros).queryByText('1')).not.toBeInTheDocument();
});

test('a single-select chip filter keeps only one chip active', async () => {
  const singleChips: Preview = {
    sections: [
      preview.sections[0],
      {
        id: 'filtros',
        header: { title: 'Filtros', icon: 'lucide:filter' },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'chips',
              title: 'Chips',
              control: {
                kind: 'chips',
                multiple: false,
                options: [
                  { id: 'x', label: 'Chip X' },
                  { id: 'y', label: 'Chip Y' },
                ],
              },
            },
          ],
        },
      },
    ],
  };

  renderPreview({}, singleChips);
  await openFiltros();

  await click(screen.getByRole('button', { name: 'Chip X' }));
  const filtros = screen.getByRole('button', { name: 'Filtros' });
  expect(within(filtros).getByText('1')).toBeInTheDocument();

  // Selecting another replaces the first (single-select) → count stays 1.
  await click(screen.getByRole('button', { name: 'Chip Y' }));
  expect(within(filtros).getByText('1')).toBeInTheDocument();
  // Toggling the active one off clears it.
  await click(screen.getByRole('button', { name: 'Chip Y' }));
  expect(within(filtros).queryByText('1')).not.toBeInTheDocument();
});

test('the locator searches, selects, and clears', async () => {
  renderPreview();
  await openFiltros();

  // The locator block starts collapsed; expand it.
  await click(screen.getByRole('button', { name: /Local/ }));

  const input = screen.getByPlaceholderText('Buscar município...');

  // Below `minChars` → no dropdown.
  await act(async () => {
    fireEvent.change(input, { target: { value: 's' } });
  });
  expect(
    screen.queryByRole('button', { name: 'São Paulo' })
  ).not.toBeInTheDocument();

  // At/above `minChars` → matching results.
  await act(async () => {
    fireEvent.change(input, { target: { value: 'san' } });
  });
  const option = screen.getByRole('button', { name: 'Santos' });
  await act(async () => {
    fireEvent.mouseDown(option);
  });

  // The selected card and the enabled zoom action appear.
  expect(screen.getByText('Selecionado')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /Zoom em Santos/ })
  ).toBeInTheDocument();
});

test('the locator focus, sublabel card, and both clear paths', async () => {
  jest.useFakeTimers();
  try {
    renderPreview();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Filtros' }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Local/ }));
    });

    const input = screen.getByPlaceholderText('Buscar município...');

    // Focusing opens the dropdown; a match with a sublabel selects into a card.
    act(() => {
      fireEvent.focus(input);
    });
    act(() => {
      fireEvent.change(input, { target: { value: 'são' } });
    });
    act(() => {
      fireEvent.mouseDown(screen.getByRole('button', { name: 'São Paulo' }));
    });
    expect(screen.getByText('SP · Brasil')).toBeInTheDocument();

    // The inline "X" clears both the query and the selection.
    const clear = screen
      .getByPlaceholderText('Buscar município...')
      .parentElement?.querySelector('button');
    act(() => {
      fireEvent.mouseDown(clear as HTMLElement);
    });
    expect(screen.queryByText('SP · Brasil')).not.toBeInTheDocument();

    // Emptying the field via typing also clears the selection.
    act(() => {
      fireEvent.change(input, { target: { value: 'sa' } });
    });
    act(() => {
      fireEvent.change(input, { target: { value: '' } });
    });

    // Blurring hides the dropdown after its debounce.
    act(() => {
      fireEvent.blur(input);
    });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(
      screen.queryByRole('button', { name: 'Santos' })
    ).not.toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

test('the locator zoom action is disabled until something is selected', async () => {
  renderPreview();
  await openFiltros();
  await click(screen.getByRole('button', { name: /Local/ }));

  expect(
    screen.getByRole('button', { name: /Selecione um município/ })
  ).toBeInTheDocument();
});

test('the playback interval input accepts valid seconds and rejects the rest', async () => {
  renderPreview();
  await openFiltros();

  const interval = screen.getByRole('spinbutton');
  expect(interval).toHaveValue(1);

  // A value inside [0.1, 10] is accepted.
  await act(async () => {
    fireEvent.change(interval, { target: { value: '2.5' } });
  });
  expect(interval).toHaveValue(2.5);

  // Out-of-range and non-numeric values are ignored (stays at 2.5).
  await act(async () => {
    fireEvent.change(interval, { target: { value: '20' } });
  });
  expect(interval).toHaveValue(2.5);
  await act(async () => {
    fireEvent.change(interval, { target: { value: '0.05' } });
  });
  expect(interval).toHaveValue(2.5);
  await act(async () => {
    fireEvent.change(interval, { target: { value: '' } });
  });
  expect(interval).toHaveValue(2.5);
});

test('collapsing a filter block hides its body', async () => {
  renderPreview();
  await openFiltros();

  expect(screen.getByRole('slider')).toBeInTheDocument();
  await click(screen.getByRole('button', { name: /Linha do tempo/ }));
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();
});

test('the close button collapses the sidebar', async () => {
  renderPreview();

  await click(screen.getByRole('button', { name: 'Close menu' }));

  expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
});

test('a timeline without histogram or unit still renders and drives the year', async () => {
  const bare: Preview = {
    sections: [
      preview.sections[0],
      {
        id: 'filtros',
        header: { title: 'Filtros', icon: 'lucide:filter' },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'periodo',
              title: 'Linha do tempo',
              control: { kind: 'timeline', menuId: 'ano', min: 0, max: 3 },
            },
          ],
        },
      },
    ],
  };

  const onVariableChange = jest.fn();
  renderPreview({ onVariableChange }, bare);
  await openFiltros();

  // No histogram bars, but the slider still works.
  expect(screen.queryByTitle(/:/)).not.toBeInTheDocument();
  await act(async () => {
    fireEvent.change(screen.getByRole('slider'), { target: { value: '2' } });
  });
  expect(onVariableChange).toHaveBeenCalledWith(
    expect.objectContaining({ ano: '2' })
  );
});

test('a variations-only preview renders without a filters tab or footer year', () => {
  // The section carries no `header.icon`, exercising the tab's icon fallback
  // and the header's icon-absent branch.
  const varsOnly: Preview = {
    sections: [{ ...preview.sections[0], header: { title: 'Variações' } }],
  };
  renderPreview({}, varsOnly);

  expect(screen.getByRole('button', { name: 'Item A1' })).toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Filtros' })
  ).not.toBeInTheDocument();
});

test('empty sections mount no sidebar at all', () => {
  renderPreview({}, { sections: [] });

  // With no sections the `controls` slot has no content, so neither the sidebar
  // nor its reopen button mount — only the map remains.
  expect(
    screen.queryByRole('button', { name: 'Close menu' })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: 'Open menu' })
  ).not.toBeInTheDocument();
  expect(screen.queryByText('Variações')).not.toBeInTheDocument();
});
