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
    // Mirrors the real hook: it only reads `matchMedia`, which `mockViewport`
    // stubs per test, and the HUD's whole point is to be compact-only.
    // `globalThis`, not `window` — babel rejects out-of-scope refs in a
    // `jest.mock` factory, and only `globalThis` is on its allowed list.
    useCompactViewport: () => {
      return Boolean(globalThis.matchMedia?.('(max-width: 639.98px)').matches);
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

/** The same preview with the variations list opted into auto-closing. */
const closeOnSelectPreview: Preview = {
  sections: preview.sections.map((section) => {
    return section.body.kind === 'variations'
      ? { ...section, body: { ...section.body, closeOnSelect: true } }
      : section;
  }),
};

test('closeOnSelect collapses the sidebar once a variation is picked', async () => {
  const onVariableChange = jest.fn();
  renderPreview({ onVariableChange }, closeOnSelectPreview);

  await click(screen.getByRole('button', { name: 'Item A2' }));

  expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument();
  // Closing rides on top of the selection, it does not replace it.
  expect(onVariableChange).toHaveBeenCalledWith(
    expect.objectContaining({ variable: 'a2' })
  );
});

test('the sidebar stays open on a pick without closeOnSelect', async () => {
  renderPreview();

  await click(screen.getByRole('button', { name: 'Item A2' }));

  expect(screen.queryByRole('button', { name: 'Open menu' })).toBeNull();
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

/** The same preview with the timeline opted into closing when playback starts. */
const closeOnPlayPreview: Preview = {
  sections: preview.sections.map((section) => {
    if (section.body.kind !== 'filters') {
      return section;
    }
    return {
      ...section,
      body: {
        ...section.body,
        blocks: section.body.blocks.map((block) => {
          return block.control.kind === 'timeline'
            ? { ...block, control: { ...block.control, closeOnPlay: true } }
            : block;
        }),
      },
    };
  }),
};

test('closeOnPlay collapses the sidebar and playback carries on behind it', async () => {
  jest.useFakeTimers();
  try {
    const onVariableChange = jest.fn();
    renderPreview({ onVariableChange }, closeOnPlayPreview);
    await openFiltros();

    await click(screen.getByRole('button', { name: 'Play' }));
    expect(
      screen.getByRole('button', { name: 'Open menu' })
    ).toBeInTheDocument();

    // The sidebar is gone but the time-lapse is running: 2023 → 2024.
    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(onVariableChange).toHaveBeenCalledWith(
      expect.objectContaining({ ano: '2024' })
    );
  } finally {
    jest.useRealTimers();
  }
});

test('pausing never closes the sidebar, only starting playback does', async () => {
  jest.useFakeTimers();
  try {
    renderPreview({}, closeOnPlayPreview);
    await openFiltros();
    await click(screen.getByRole('button', { name: 'Play' }));
    await click(screen.getByRole('button', { name: 'Open menu' }));

    await click(screen.getByRole('button', { name: 'Pause' }));

    expect(screen.queryByRole('button', { name: 'Open menu' })).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

test('the sidebar stays open on play without closeOnPlay', async () => {
  jest.useFakeTimers();
  try {
    renderPreview();
    await openFiltros();

    await click(screen.getByRole('button', { name: 'Play' }));

    expect(screen.queryByRole('button', { name: 'Open menu' })).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});

/**
 * Stubs `matchMedia` so `useCompactViewport` reports the compact layout, which
 * is the only one the HUD renders in. jsdom ships no implementation, so without
 * this the hook always answers "roomy".
 */
const mockViewport = (width: number) => {
  window.matchMedia = ((query: string) => {
    const limit = Number(/max-width:\s*([\d.]+)px/.exec(query)?.[1]);
    return {
      matches: width <= limit,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    };
  }) as unknown as typeof window.matchMedia;
};

/** The HUD's pause/play control, absent until the bar shows. */
const hudPlayControl = () => {
  const controls = screen.queryAllByRole('button', { name: /^(Play|Pause)$/ });
  // The sidebar's own control is the first; the HUD's is the one that outlives
  // it, so after `closeOnPlay` there is exactly one left.
  return controls.length === 1 ? controls[0] : null;
};

describe('the compact timeline HUD', () => {
  beforeEach(() => {
    mockViewport(390);
  });

  test('takes over the controls when play closes the sidebar', async () => {
    jest.useFakeTimers();
    try {
      const onVariableChange = jest.fn();
      renderPreview({ onVariableChange }, closeOnPlayPreview);
      await openFiltros();

      await click(screen.getByRole('button', { name: 'Play' }));

      // Sidebar gone, and a play/pause control still on screen: the HUD's.
      expect(
        screen.getByRole('button', { name: 'Open menu' })
      ).toBeInTheDocument();
      expect(hudPlayControl()).not.toBeNull();

      // It drives the same playback: pausing from the HUD stops the advance.
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(onVariableChange).toHaveBeenCalledWith(
        expect.objectContaining({ ano: '2023' })
      );

      await click(hudPlayControl()!);
      onVariableChange.mockClear();
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(onVariableChange).not.toHaveBeenCalled();

      // And it stays after pausing, so play can resume from it.
      expect(hudPlayControl()).not.toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test('is dismissable, and comes back on the next play', async () => {
    jest.useFakeTimers();
    try {
      renderPreview({}, closeOnPlayPreview);
      await openFiltros();
      await click(screen.getByRole('button', { name: 'Play' }));

      await click(screen.getByRole('button', { name: 'Close timeline' }));
      expect(hudPlayControl()).toBeNull();

      // Reopen the menu, play again: the bar is armed once more.
      await click(screen.getByRole('button', { name: 'Open menu' }));
      await click(screen.getByRole('button', { name: 'Pause' }));
      await click(screen.getByRole('button', { name: 'Play' }));
      expect(hudPlayControl()).not.toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test('never shows before playback starts', async () => {
    renderPreview({}, closeOnPlayPreview);
    await openFiltros();
    await click(screen.getByRole('button', { name: 'Close menu' }));

    // Sidebar closed, but nothing was played — no bar to show.
    expect(hudPlayControl()).toBeNull();
  });

  test('its steppers move the year and stop playback', async () => {
    jest.useFakeTimers();
    try {
      const onVariableChange = jest.fn();
      renderPreview({ onVariableChange }, closeOnPlayPreview);
      await openFiltros();
      await click(screen.getByRole('button', { name: 'Play' }));

      await click(screen.getByRole('button', { name: 'Previous step' }));
      expect(onVariableChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ ano: '2022' })
      );

      await click(screen.getByRole('button', { name: 'Next step' }));
      expect(onVariableChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ ano: '2023' })
      );

      // Stepping stops the auto-advance, so the year holds where it was put.
      onVariableChange.mockClear();
      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(onVariableChange).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  test('its rule jumps to the year of the bar pressed', async () => {
    jest.useFakeTimers();
    try {
      const onVariableChange = jest.fn();
      renderPreview({ onVariableChange }, closeOnPlayPreview);
      await openFiltros();
      await click(screen.getByRole('button', { name: 'Play' }));

      // Each segment carries its own step as its only accessible name.
      await click(screen.getByRole('button', { name: '2024' }));

      expect(onVariableChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ ano: '2024' })
      );
    } finally {
      jest.useRealTimers();
    }
  });

  /** A single timeline section, no histogram, opted into closing on play. */
  const bareTimeline = ({
    min,
    max,
    step,
  }: {
    min: number;
    max: number;
    step?: number;
  }): Preview => {
    return {
      sections: [
        {
          id: 'filtros',
          header: { title: 'Filtros', icon: 'lucide:filter' },
          body: {
            kind: 'filters',
            blocks: [
              {
                id: 'periodo',
                title: 'Linha do tempo',
                control: {
                  kind: 'timeline',
                  menuId: 'ano',
                  min,
                  max,
                  step,
                  defaultValue: min,
                  closeOnPlay: true,
                },
              },
            ],
          },
        },
      ],
    };
  };

  test('still draws the rule for a timeline that declares no histogram', async () => {
    jest.useFakeTimers();
    try {
      renderPreview({}, bareTimeline({ min: 2022, max: 2024 }));

      await click(screen.getByRole('button', { name: 'Play' }));

      // The rule comes from min/max/step, so it is there regardless — it is the
      // count beside the year that needs histogram data.
      expect(hudPlayControl()).not.toBeNull();
      expect(screen.getByRole('button', { name: '2022' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2024' })).toBeInTheDocument();
      expect(screen.queryByText(/reg\./)).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test.each([
    ['a single step has no range to draw', { min: 2024, max: 2024 }],
    ['too many steps would be sub-pixel', { min: 1900, max: 2026 }],
  ])('drops the rule when %s', async (_label, range) => {
    jest.useFakeTimers();
    try {
      renderPreview({}, bareTimeline(range));

      await click(screen.getByRole('button', { name: 'Play' }));

      // The bar is still there to pause with; only the rule is skipped.
      expect(hudPlayControl()).not.toBeNull();
      expect(
        screen.queryByRole('button', { name: String(range.min) })
      ).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });

  test('never shows above the compact breakpoint', async () => {
    jest.useFakeTimers();
    try {
      mockViewport(1280);
      renderPreview({}, closeOnPlayPreview);
      await openFiltros();

      await click(screen.getByRole('button', { name: 'Play' }));

      // The sidebar still closed on play, but the roomy layout keeps its own
      // control reachable, so no bar is added.
      expect(
        screen.getByRole('button', { name: 'Open menu' })
      ).toBeInTheDocument();
      expect(hudPlayControl()).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
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

/** The same preview with the chips publishing to the shared selection. */
const publishingChipsPreview: Preview = {
  sections: preview.sections.map((section) => {
    if (section.body.kind !== 'filters') return section;
    return {
      ...section,
      body: {
        ...section.body,
        blocks: section.body.blocks.map((block) => {
          return block.control.kind === 'chips'
            ? { ...block, control: { ...block.control, menuId: 'produtos' } }
            : block;
        }),
      },
    };
  }),
};

test('chips with a menuId publish their ids, comma-joined', async () => {
  const onVariableChange = jest.fn();
  renderPreview({ onVariableChange }, publishingChipsPreview);
  await openFiltros();

  // `defaultSelected: ['x']` reaches the parent on mount, without a click.
  expect(onVariableChange).toHaveBeenCalledWith(
    expect.objectContaining({ produtos: 'x' })
  );

  await click(screen.getByRole('button', { name: /Chip Y/ }));
  expect(onVariableChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ produtos: 'x,y' })
  );

  // Cleared reads as an empty string, not a missing key: the selection holds
  // one string per menu, so "nothing selected" has to be expressible.
  await click(screen.getByRole('button', { name: /Limpar 2 filtros/ }));
  expect(onVariableChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ produtos: '' })
  );
});

test('chips seed from a controlled selection, over defaultSelected', async () => {
  const onVariableChange = jest.fn();
  renderPreview(
    { variables: { produtos: 'y,z' }, onVariableChange },
    publishingChipsPreview
  );
  await openFiltros();

  // The badge counts two — the selection's `y,z`, not `defaultSelected`'s
  // single `x`. It is the count the chips expose; they carry no pressed state.
  const filtros = screen.getByRole('button', { name: 'Filtros' });
  expect(within(filtros).getByText('2')).toBeInTheDocument();

  // The only publish on mount is the timeline's own default year — the chips
  // carry their seeded value through untouched instead of rewriting it.
  expect(onVariableChange).toHaveBeenCalledTimes(1);
  expect(onVariableChange).toHaveBeenLastCalledWith({
    ano: '2023',
    produtos: 'y,z',
  });
});

test('chips without a menuId keep the selection to themselves', async () => {
  const onVariableChange = jest.fn();
  renderPreview({ onVariableChange });
  await openFiltros();

  await click(screen.getByRole('button', { name: /Chip Y/ }));

  // The badge counts it, but nothing about it reaches the parent.
  expect(onVariableChange).not.toHaveBeenCalledWith(
    expect.objectContaining({ produtos: expect.anything() })
  );
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

/** Adds an `enabledWhen` gate to the filters section of a given preview. */
const gate = (source: Preview): Preview => {
  return {
    sections: source.sections.map((section) => {
      return section.body.kind === 'filters'
        ? {
            ...section,
            enabledWhen: { menuId: 'variable', values: ['a1'] },
          }
        : section;
    }),
  };
};

/** Gated previews; `a1` (the default variation) opens the gate, `a2` closes it. */
const gatedPreview = gate(preview);
const gatedCloseOnPlayPreview = gate(closeOnPlayPreview);

describe('a section gated by enabledWhen', () => {
  test('renders an inert tab, and drops the footer value, while gated', async () => {
    const { rerender } = render(
      <GeovisWorkspace
        config={{ leftSidebar: { initialState: 'open', ...gatedPreview } }}
        visualizationSpec={visualizationSpec}
        variables={{ variable: 'a1' }}
      />,
      { wrapper: Provider }
    );

    // Gate open: the tab works and the footer reads the timeline's year.
    expect(screen.getByRole('button', { name: 'Filtros' })).toBeEnabled();
    expect(screen.getByText('2023')).toBeInTheDocument();

    rerender(
      <GeovisWorkspace
        config={{ leftSidebar: { initialState: 'open', ...gatedPreview } }}
        visualizationSpec={visualizationSpec}
        variables={{ variable: 'a2' }}
      />
    );

    const tab = screen.getByRole('button', { name: 'Filtros' });
    expect(tab).toBeDisabled();

    // Clicking it changes nothing: the header still mirrors the variations tab.
    await click(tab);
    expect(screen.getByText('Variações')).toBeInTheDocument();

    // The footer's readout goes too — a frozen year describes nothing on screen.
    expect(screen.queryByText('2023')).not.toBeInTheDocument();
  });

  test('falls back to an enabled section when the gate closes under it', async () => {
    const { rerender } = render(
      <GeovisWorkspace
        config={{ leftSidebar: { initialState: 'open', ...gatedPreview } }}
        visualizationSpec={visualizationSpec}
        variables={{ variable: 'a1' }}
      />,
      { wrapper: Provider }
    );

    await openFiltros();
    expect(screen.getByRole('slider')).toBeInTheDocument();

    rerender(
      <GeovisWorkspace
        config={{ leftSidebar: { initialState: 'open', ...gatedPreview } }}
        visualizationSpec={visualizationSpec}
        variables={{ variable: 'a2' }}
      />
    );

    // The filters body is gone rather than left reachable behind a dimmed tab,
    // and the variations tab is showing in its place.
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Item A1' })).toBeInTheDocument();
  });

  test('halts playback when the gate closes, freezing the value', async () => {
    jest.useFakeTimers();
    try {
      const onVariableChange = jest.fn();
      const props = (variable: string) => {
        return {
          config: {
            leftSidebar: { initialState: 'open' as const, ...gatedPreview },
          },
          visualizationSpec,
          variables: { variable },
          onVariableChange,
        };
      };

      const { rerender } = render(<GeovisWorkspace {...props('a1')} />, {
        wrapper: Provider,
      });

      await openFiltros();
      await click(screen.getByRole('button', { name: 'Play' }));

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(onVariableChange).toHaveBeenCalledWith(
        expect.objectContaining({ ano: '2024' })
      );

      rerender(<GeovisWorkspace {...props('a2')} />);
      onVariableChange.mockClear();

      // Auto-advance stops: nothing keeps writing a year the user can no longer
      // see or reach.
      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(onVariableChange).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  test('takes the compact HUD with it', async () => {
    mockViewport(390);
    jest.useFakeTimers();
    try {
      const props = (variable: string) => {
        return {
          config: {
            leftSidebar: {
              initialState: 'open' as const,
              ...gatedCloseOnPlayPreview,
            },
          },
          visualizationSpec,
          variables: { variable },
        };
      };

      const { rerender } = render(<GeovisWorkspace {...props('a1')} />, {
        wrapper: Provider,
      });

      await openFiltros();
      await click(screen.getByRole('button', { name: 'Play' }));
      expect(hudPlayControl()).not.toBeNull();

      rerender(<GeovisWorkspace {...props('a2')} />);

      // Playback has started and the HUD was never dismissed, so only the gate
      // can account for its absence here.
      expect(hudPlayControl()).toBeNull();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe('the map footer', () => {
  const configFor = (footer: boolean) => {
    return {
      footer,
      leftSidebar: { initialState: 'open' as const, ...preview },
    };
  };

  const renderFooter = (footer: boolean, variable = 'a1') => {
    return render(
      <GeovisWorkspace
        config={configFor(footer)}
        visualizationSpec={visualizationSpec}
        variables={{ variable }}
      />,
      { wrapper: Provider }
    );
  };

  /**
   * The sidebar's own footer names the variation too, so plain text queries
   * cannot tell the two apart. The map footer is the only one carrying the
   * label as a `title` — it needs one anyway, to reveal a truncated label.
   */
  const mapFooter = (label: string) => {
    return screen.queryByTitle(label);
  };

  test('mounts only when config.footer is set', () => {
    renderFooter(false);
    expect(mapFooter('Item A1')).toBeNull();
  });

  test('names the selected variation, and follows the selection', () => {
    const { rerender } = renderFooter(true);
    expect(mapFooter('Item A1')).toBeInTheDocument();

    rerender(
      <GeovisWorkspace
        config={configFor(true)}
        visualizationSpec={visualizationSpec}
        variables={{ variable: 'b1' }}
      />
    );

    expect(mapFooter('Item B1')).toBeInTheDocument();
    expect(mapFooter('Item A1')).toBeNull();
  });

  test('survives the sidebar closing', async () => {
    renderFooter(true);

    await click(screen.getByRole('button', { name: 'Close menu' }));

    // The sidebar took its own footer with it; this one is what still names
    // the view, which is the whole reason it exists.
    expect(
      screen.getByRole('button', { name: 'Open menu' })
    ).toBeInTheDocument();
    expect(mapFooter('Item A1')).toBeInTheDocument();
  });

  test('renders nothing when no variation matches the selection', () => {
    renderFooter(true, '__no_such_variation__');

    expect(mapFooter('Item A1')).toBeNull();
    expect(mapFooter('Item B1')).toBeNull();
  });
});

describe('the map footer position', () => {
  const renderAt = (footer: GeovisWorkspaceConfig['footer']) => {
    return render(
      <GeovisWorkspace
        config={{ footer, leftSidebar: { initialState: 'open', ...preview } }}
        visualizationSpec={visualizationSpec}
        variables={{ variable: 'a1' }}
      />,
      { wrapper: Provider }
    );
  };

  /**
   * Asserted through the anchoring edges rather than a class name: `left: 0`
   * versus `right: 0` versus the centring translate is the whole difference
   * between the three positions.
   */
  const styleOf = (label: string) => {
    const node = screen.getByTitle(label);
    return window.getComputedStyle(node);
  };

  test('centres by default, on both the boolean and an empty object', () => {
    const { unmount } = renderAt(true);
    expect(styleOf('Item A1').transform).toContain('translateX(-50%)');

    unmount();
    renderAt({});
    expect(styleOf('Item A1').transform).toContain('translateX(-50%)');
  });

  test('hugs the left edge on position: left', () => {
    renderAt({ position: 'left' });

    const style = styleOf('Item A1');
    expect(style.left).toBe('0px');
    expect(style.transform).not.toContain('translateX');
  });

  test('hugs the right edge on position: right', () => {
    renderAt({ position: 'right' });

    const style = styleOf('Item A1');
    expect(style.right).toBe('0px');
    expect(style.transform).not.toContain('translateX');
  });
});

describe('gate and footer edge cases', () => {
  test('the footer renders nothing when there is no sidebar to read', () => {
    render(
      <GeovisWorkspace
        config={{ footer: true }}
        visualizationSpec={visualizationSpec}
      />,
      { wrapper: Provider }
    );

    // No variations section means no variation to name; the bar stays away
    // rather than rendering empty.
    expect(screen.queryByTitle('Item A1')).toBeNull();
  });

  test('the footer steps above the compact timeline bar', async () => {
    mockViewport(390);
    jest.useFakeTimers();
    try {
      render(
        <GeovisWorkspace
          config={{
            footer: true,
            leftSidebar: { initialState: 'open', ...closeOnPlayPreview },
          }}
          visualizationSpec={visualizationSpec}
          variables={{ variable: 'a1' }}
        />,
        { wrapper: Provider }
      );

      expect(window.getComputedStyle(screen.getByTitle('Item A1')).bottom).toBe(
        '0px'
      );

      await openFiltros();
      await click(screen.getByRole('button', { name: 'Play' }));

      // The HUD now owns the bottom edge, so the bar lifts clear of it instead
      // of hiding underneath.
      expect(
        window.getComputedStyle(screen.getByTitle('Item A1')).bottom
      ).not.toBe('0px');
    } finally {
      jest.useRealTimers();
    }
  });

  test('a gate falls back to the variation default before the selection seeds', () => {
    // An empty controlled selection: `selection['variable']` is undefined, so
    // the gate has to read the variations body's `defaultValue` ('a1') to
    // decide. Without that fallback every gated tab would start disabled.
    render(
      <GeovisWorkspace
        config={{ leftSidebar: { initialState: 'open', ...gatedPreview } }}
        visualizationSpec={visualizationSpec}
        variables={{}}
      />,
      { wrapper: Provider }
    );

    expect(screen.getByRole('button', { name: 'Filtros' })).toBeEnabled();
  });

  test('keeps the selected section when every gate is closed', () => {
    // A config that gates itself shut entirely: there is no enabled section to
    // fall back to, so the card keeps showing the selected one rather than
    // rendering headerless and empty.
    const allGated: Preview = {
      sections: preview.sections.map((section) => {
        return {
          ...section,
          enabledWhen: { menuId: 'variable', values: ['__none__'] },
        };
      }),
    };

    render(
      <GeovisWorkspace
        config={{ leftSidebar: { initialState: 'open', ...allGated } }}
        visualizationSpec={visualizationSpec}
        variables={{ variable: 'a1' }}
      />,
      { wrapper: Provider }
    );

    expect(screen.getByRole('button', { name: 'Variações' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Item A1' })).toBeInTheDocument();
  });
});

test('a gate on a menu no section drives fails closed', () => {
  // Nothing writes `__ghost__`, so the gate can never resolve a value. Failing
  // closed makes a typo'd `menuId` visible as a permanently dimmed tab, rather
  // than silently behaving as if the gate were not there.
  const ghostGated: Preview = {
    sections: preview.sections.map((section) => {
      return section.body.kind === 'filters'
        ? {
            ...section,
            enabledWhen: { menuId: '__ghost__', values: ['anything'] },
          }
        : section;
    }),
  };

  render(
    <GeovisWorkspace
      config={{ leftSidebar: { initialState: 'open', ...ghostGated } }}
      visualizationSpec={visualizationSpec}
      variables={{ variable: 'a1' }}
    />,
    { wrapper: Provider }
  );

  expect(screen.getByRole('button', { name: 'Filtros' })).toBeDisabled();
});
