/**
 * The map export: the sidebar button, the dialog it opens over the workspace,
 * its toggles and file name, the download, and every way a capture can fail.
 */

import { GeoVisProvider } from '@ttoss/geovis';
import { I18nProvider } from '@ttoss/react-i18n';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@ttoss/test-utils/react';
import { toCanvas } from 'html-to-image';
import {
  GeovisWorkspace,
  type GeovisWorkspaceConfig,
  GeovisWorkspaceProvider,
} from 'src';
import { LeftSidebar } from 'src/components/LeftSidebar';
import { useMapExportContent } from 'src/export/useMapExportContent';

jest.mock('html-to-image', () => {
  return { toCanvas: jest.fn() };
});

/**
 * The mocked runtime, or `null` for none. Built once per map, as the real one
 * is stable across renders: a fresh identity per render would re-run the
 * dialog's capture effect on every render it causes.
 */
let mockRuntime: unknown = null;

const setNativeMap = (map: unknown) => {
  mockRuntime = {
    getAdapter: () => {
      return {
        getNativeInstance: () => {
          return map;
        },
      };
    },
  };
};

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  const base = require('./geovisWorkspaceTestUtils').createGeoVisMock();
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  const { createElement } = require('react');

  return {
    ...base,
    // Mounts a card per positioned legend, and the layer control when the spec
    // declares one, tagged as the real components tag them, so the export
    // finds them on screen.
    GeoVisProvider: ({
      spec,
      children,
    }: {
      spec: { legends?: { id: string; position?: string }[]; control?: object };
      children: React.ReactNode;
    }) => {
      const cards = (spec.legends ?? [])
        .filter((legend) => {
          return legend.position;
        })
        .map((legend) => {
          return createElement('div', {
            key: legend.id,
            'data-geovis-legend': legend.id,
          });
        });

      const layerControl = spec.control
        ? createElement('div', { 'data-geovis-layer-control': '' })
        : null;

      return createElement(
        base.GeoVisProvider,
        { spec },
        children,
        cards,
        layerControl
      );
    },
    useGeoVis: () => {
      return {
        ...base.useGeoVis(),
        runtime: mockRuntime,
      };
    },
    resolveLegend: (
      spec: { legends?: { id: string; title?: string }[] },
      id: string
    ) => {
      return spec.legends?.find((legend) => {
        return legend.id === id;
      });
    },
  };
});

const createContext = () => {
  return { drawImage: jest.fn() };
};

let contexts: ReturnType<typeof createContext>[];

/** A fake MapLibre map; `autoRender: false` holds the frame until `render()`. */
const createMap = ({
  autoRender = true,
  clientWidth = 200,
}: { autoRender?: boolean; clientWidth?: number } = {}) => {
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 200;
  Object.defineProperty(canvas, 'clientWidth', { value: clientWidth });
  let listener: (() => void) | undefined;

  return {
    getCanvas: () => {
      return canvas;
    },
    once: (_type: 'render', fn: () => void) => {
      listener = fn;
    },
    triggerRepaint: () => {
      if (autoRender) listener?.();
    },
    render: () => {
      listener?.();
    },
  };
};

const menuCanvas = document.createElement('canvas');
const legendCanvas = document.createElement('canvas');
const layerControlCanvas = document.createElement('canvas');

const isLegendCard = (node: HTMLElement) => {
  return node.dataset.geovisLegend !== undefined;
};

const isLayerControl = (node: HTMLElement) => {
  return node.dataset.geovisLayerControl !== undefined;
};

/**
 * Renders the legend cards and the layer control at once and the menu through
 * `capture`, so a test can hold or fail the menu alone.
 */
const captureMenuWith = (capture: () => Promise<HTMLCanvasElement>) => {
  jest.mocked(toCanvas).mockImplementation((node) => {
    if (isLegendCard(node)) return Promise.resolve(legendCanvas);
    if (isLayerControl(node)) return Promise.resolve(layerControlCanvas);
    return capture();
  });
};

/**
 * Animation frames requested and not yet run. Held rather than run on jsdom's
 * timer, so a test decides when the dialog has been painted.
 */
let frames: FrameRequestCallback[];

/** Runs every pending frame, and the frames they request in turn. */
const paint = async () => {
  await act(async () => {
    while (frames.length > 0) {
      frames.shift()?.(performance.now());
    }
  });
};

beforeEach(() => {
  contexts = [];
  frames = [];
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.push(callback);
    return frames.length;
  });
  setNativeMap(createMap());
  jest
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(() => {
      const context = createContext();
      contexts.push(context);
      return context as unknown as CanvasRenderingContext2D;
    });
  jest
    .spyOn(HTMLCanvasElement.prototype, 'toDataURL')
    .mockReturnValue('data:image/png;base64,preview');
  jest
    .spyOn(HTMLCanvasElement.prototype, 'toBlob')
    .mockImplementation((callback: BlobCallback) => {
      callback(new Blob(['png'], { type: 'image/png' }));
    });
  captureMenuWith(() => {
    return Promise.resolve(menuCanvas);
  });
  Object.assign(URL, {
    createObjectURL: jest.fn(() => {
      return 'blob:mapa';
    }),
    revokeObjectURL: jest.fn(),
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const config: GeovisWorkspaceConfig = {
  leftSidebar: {
    initialState: 'open',
    sections: [
      {
        id: 'variable',
        header: { title: 'Variável', icon: 'lucide:layers' },
        body: {
          kind: 'variations',
          menuId: 'variable',
          defaultValue: 'rate',
          groups: [
            {
              id: 'metrics',
              label: 'Métricas',
              variations: [
                { value: 'rate', label: 'Taxa cumulativa' },
                { value: 'range', label: 'Faixa etária' },
              ],
            },
          ],
        },
      },
      {
        id: 'time',
        header: { title: 'Período', icon: 'lucide:clock' },
        body: {
          kind: 'filters',
          blocks: [
            {
              id: 'year',
              title: 'Ano',
              control: {
                kind: 'timeline',
                menuId: 'ano',
                min: 2015,
                max: 2024,
                defaultValue: 2024,
              },
            },
          ],
        },
      },
    ],
  },
};

const spec = {
  id: 'export-spec',
  engine: 'maplibre' as const,
  title: 'Mapa de teste',
  sources: [],
  layers: [{ id: 'fill', activeLegendId: 'rate' }],
  legends: [{ id: 'rate', title: 'Taxa cumulativa', position: 'bottom-right' }],
};

const renderWorkspace = ({
  workspaceConfig = config,
  visualizationSpec = spec,
}: {
  workspaceConfig?: GeovisWorkspaceConfig;
  visualizationSpec?: object;
} = {}) => {
  return render(
    <I18nProvider locale="pt-BR">
      <GeovisWorkspace
        config={workspaceConfig}
        visualizationSpec={visualizationSpec as typeof spec}
      />
    </I18nProvider>
  );
};

/**
 * Clicks the sidebar's export button and, unless `painted: false`, lets the
 * dialog paint so the capture it waits for runs.
 */
const openExport = async ({ painted = true }: { painted?: boolean } = {}) => {
  await act(async () => {
    // By title rather than role: a closed sidebar is `aria-hidden`, which
    // leaves its button without an accessible name to match.
    fireEvent.click(screen.getAllByTitle('Exportar mapa como PNG')[0]);
  });

  if (painted) await paint();
};

const fileNameInput = () => {
  return screen.getByRole('textbox') as HTMLInputElement;
};

const toggle = (name: string) => {
  return screen.getByRole('switch', { name });
};

/** Every image drawn by the most recent composition, the frame first. */
const lastDrawn = () => {
  const context = contexts[contexts.length - 1];
  return context.drawImage.mock.calls.map((call) => {
    return call[0];
  });
};

test('the sidebar button opens the dialog with a preview of the current map', async () => {
  renderWorkspace();

  expect(screen.queryByRole('dialog')).toBeNull();

  await openExport();

  expect(
    screen.getByRole('dialog', { name: 'Exportar mapa' })
  ).toBeInTheDocument();
  expect(
    screen.getByRole('img', { name: 'Prévia do mapa exportado' })
  ).toHaveAttribute('src', 'data:image/png;base64,preview');
  // The canvas's own resolution, grouped for the declared locale.
  expect(screen.getByText('400 × 200 px')).toBeInTheDocument();
  expect(fileNameInput().value).toBe('taxa-cumulativa_2024');
  expect(toggle('Incluir legenda')).toHaveAttribute('aria-checked', 'true');
  expect(toggle('Incluir menu')).toHaveAttribute('aria-checked', 'false');
  // The legend card on screen, captured from the page, over the frame.
  expect(lastDrawn()).toEqual([expect.any(HTMLCanvasElement), legendCanvas]);
});

test('the dialog opens before the capture, with a spinner where the preview goes', async () => {
  const map = createMap();
  const triggerRepaint = jest.spyOn(map, 'triggerRepaint');
  setNativeMap(map);

  renderWorkspace();
  await openExport({ painted: false });

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('status', { name: 'Gerando prévia…' })).toBeVisible();
  // Held at the map canvas's size already, so the box does not resize when the
  // image replaces the spinner.
  expect(screen.getByText('400 × 200 px')).toBeInTheDocument();
  expect(triggerRepaint).not.toHaveBeenCalled();

  await paint();

  expect(triggerRepaint).toHaveBeenCalled();
  expect(screen.queryByRole('status', { name: 'Gerando prévia…' })).toBeNull();
  expect(
    screen.getByRole('img', { name: 'Prévia do mapa exportado' })
  ).toBeInTheDocument();
});

test('closing before the dialog paints never starts the capture', async () => {
  const map = createMap();
  const triggerRepaint = jest.spyOn(map, 'triggerRepaint');
  setNativeMap(map);

  renderWorkspace();
  await openExport({ painted: false });

  await act(async () => {
    fireEvent.keyDown(document, { key: 'Escape' });
  });
  await paint();

  expect(screen.queryByRole('dialog')).toBeNull();
  expect(triggerRepaint).not.toHaveBeenCalled();
  expect(toCanvas).not.toHaveBeenCalled();
});

test('toggling the legend recomposes the preview without it', async () => {
  renderWorkspace();
  await openExport();

  await act(async () => {
    fireEvent.click(toggle('Incluir legenda'));
  });

  expect(toggle('Incluir legenda')).toHaveAttribute('aria-checked', 'false');
  expect(lastDrawn()).not.toContain(legendCanvas);
});

test('a legend that cannot be rendered only matters while it is included', async () => {
  jest.mocked(toCanvas).mockImplementation((node) => {
    return isLegendCard(node)
      ? Promise.reject(new Error('fonts'))
      : Promise.resolve(menuCanvas);
  });

  renderWorkspace();
  await openExport();

  // The frame still lands, without the legend.
  expect(
    screen.getByRole('img', { name: 'Prévia do mapa exportado' })
  ).toBeInTheDocument();
  expect(lastDrawn()).not.toContain(legendCanvas);
  expect(screen.getByRole('alert')).toBeInTheDocument();

  await act(async () => {
    fireEvent.click(toggle('Incluir legenda'));
  });

  expect(screen.queryByRole('alert')).toBeNull();
});

test('including the menu draws the captured sidebar over the frame', async () => {
  renderWorkspace();
  await openExport();

  expect(toCanvas).toHaveBeenCalledWith(
    expect.any(HTMLElement),
    expect.objectContaining({ pixelRatio: 2 })
  );

  await act(async () => {
    fireEvent.click(toggle('Incluir menu'));
  });

  expect(toggle('Incluir menu')).toHaveAttribute('aria-checked', 'true');
  const context = contexts[contexts.length - 1];
  expect(context.drawImage).toHaveBeenLastCalledWith(
    menuCanvas,
    expect.any(Number),
    expect.any(Number)
  );
});

test('the menu carries the layer control, on top, when the map has one', async () => {
  renderWorkspace({ visualizationSpec: { ...spec, control: { items: [] } } });
  await openExport();

  // Captured with the menu, but drawn only once the menu is asked for.
  expect(lastDrawn()).not.toContain(layerControlCanvas);

  await act(async () => {
    fireEvent.click(toggle('Incluir menu'));
  });

  expect(lastDrawn()).toEqual([
    expect.any(HTMLCanvasElement),
    legendCanvas,
    menuCanvas,
    layerControlCanvas,
  ]);

  await act(async () => {
    fireEvent.click(toggle('Incluir menu'));
  });

  expect(lastDrawn()).not.toContain(menuCanvas);
  expect(lastDrawn()).not.toContain(layerControlCanvas);
});

test('a layer control that cannot be rendered fails the menu', async () => {
  jest.mocked(toCanvas).mockImplementation((node) => {
    if (isLegendCard(node)) return Promise.resolve(legendCanvas);
    if (isLayerControl(node)) return Promise.reject(new Error('fonts'));
    return Promise.resolve(menuCanvas);
  });

  renderWorkspace({ visualizationSpec: { ...spec, control: { items: [] } } });
  await openExport();

  expect(screen.queryByRole('alert')).toBeNull();

  await act(async () => {
    fireEvent.click(toggle('Incluir menu'));
  });

  expect(screen.getByRole('alert')).toBeInTheDocument();
});

test('the download waits for a menu still being rendered', async () => {
  let finish: (canvas: HTMLCanvasElement) => void = () => {};
  captureMenuWith(() => {
    return new Promise((resolve) => {
      finish = resolve;
    });
  });

  renderWorkspace();
  await openExport();

  await act(async () => {
    fireEvent.click(toggle('Incluir menu'));
  });

  const download = screen.getByRole('button', { name: 'Gerando…' });
  expect(download).toBeDisabled();

  await act(async () => {
    finish(menuCanvas);
  });

  expect(screen.getByRole('button', { name: 'Baixar PNG' })).toBeEnabled();
});

test('a menu that cannot be rendered only matters once it is asked for', async () => {
  captureMenuWith(() => {
    return Promise.reject(new Error('fonts'));
  });

  renderWorkspace();
  await openExport();

  expect(screen.queryByRole('alert')).toBeNull();

  await act(async () => {
    fireEvent.click(toggle('Incluir menu'));
  });

  expect(screen.getByRole('alert')).toHaveTextContent(
    'Não foi possível exportar o mapa.'
  );
});

test('the download saves the PNG under the cleaned file name and closes', async () => {
  const click = jest
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});

  renderWorkspace();
  await openExport();

  fireEvent.change(fileNameInput(), { target: { value: 'meu:mapa.png' } });
  expect(fileNameInput().value).toBe('meumapa');

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Baixar PNG' }));
  });

  expect(click).toHaveBeenCalled();
  expect(jest.mocked(click).mock.contexts[0]).toHaveProperty(
    'download',
    'meumapa.png'
  );
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('the download carries the menu when it is included', async () => {
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

  renderWorkspace();
  await openExport();

  await act(async () => {
    fireEvent.click(toggle('Incluir menu'));
  });
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Baixar PNG' }));
  });

  // Composed once more for the file, menu on top as in the preview.
  expect(contexts[contexts.length - 1].drawImage).toHaveBeenLastCalledWith(
    menuCanvas,
    expect.any(Number),
    expect.any(Number)
  );
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('an emptied file name downloads under the suggested one', async () => {
  const click = jest
    .spyOn(HTMLAnchorElement.prototype, 'click')
    .mockImplementation(() => {});

  renderWorkspace();
  await openExport();

  fireEvent.change(fileNameInput(), { target: { value: '   ' } });

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Baixar PNG' }));
  });

  expect(jest.mocked(click).mock.contexts[0]).toHaveProperty(
    'download',
    'taxa-cumulativa_2024.png'
  );
});

test('a failed encoding keeps the dialog open with the error', async () => {
  jest
    .mocked(HTMLCanvasElement.prototype.toBlob)
    .mockImplementation((callback: BlobCallback) => {
      callback(null);
    });

  renderWorkspace();
  await openExport();

  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Baixar PNG' }));
  });

  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Baixar PNG' })).toBeEnabled();
});

test('a tainted preview reports the error', async () => {
  jest.mocked(HTMLCanvasElement.prototype.toDataURL).mockImplementation(() => {
    throw new Error('SecurityError');
  });

  renderWorkspace();
  await openExport();

  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.queryByRole('img')).toBeNull();
});

test('without a runtime map there is nothing to export', async () => {
  mockRuntime = null;

  renderWorkspace();
  await openExport();

  expect(screen.getByRole('alert')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Baixar PNG' })).toBeDisabled();
});

test('a failed capture reports the error', async () => {
  jest.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

  renderWorkspace();
  await openExport();

  expect(screen.getByRole('alert')).toBeInTheDocument();
  // A failure is an answer: the spinner gives way to the error.
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.getByRole('button', { name: 'Baixar PNG' })).toBeDisabled();
});

test.each([
  [
    'Escape',
    () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    },
  ],
  [
    'the backdrop',
    () => {
      fireEvent.pointerDown(
        screen.getByRole('dialog').parentElement as HTMLElement
      );
    },
  ],
  [
    'Cancel',
    () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    },
  ],
  [
    'the ✕',
    () => {
      fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));
    },
  ],
])('closes on %s', async (_name, close) => {
  renderWorkspace();
  await openExport();

  await act(async () => {
    close();
  });

  expect(screen.queryByRole('dialog')).toBeNull();
});

test('other keys and clicks inside the card leave it open', async () => {
  renderWorkspace();
  await openExport();

  await act(async () => {
    fireEvent.keyDown(document, { key: 'Enter' });
    fireEvent.pointerDown(screen.getByRole('dialog'));
  });

  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

test('closing before the frame lands discards the capture', async () => {
  const map = createMap({ autoRender: false });
  setNativeMap(map);

  renderWorkspace();
  await openExport();

  await act(async () => {
    fireEvent.keyDown(document, { key: 'Escape' });
  });
  await act(async () => {
    map.render();
  });

  expect(toCanvas).not.toHaveBeenCalled();
});

test('closing before a failed capture settles reports nothing', async () => {
  const map = createMap({ autoRender: false });
  setNativeMap(map);
  jest.mocked(HTMLCanvasElement.prototype.getContext).mockReturnValue(null);

  renderWorkspace();
  await openExport();

  await act(async () => {
    fireEvent.keyDown(document, { key: 'Escape' });
  });
  await act(async () => {
    map.render();
  });

  expect(screen.queryByRole('dialog')).toBeNull();
});

test('closing while the legends render discards them', async () => {
  let finish: (canvas: HTMLCanvasElement) => void = () => {};
  let fail: (error: Error) => void = () => {};
  const pending = [
    new Promise<HTMLCanvasElement>((resolve) => {
      finish = resolve;
    }),
    new Promise<HTMLCanvasElement>((_resolve, reject) => {
      fail = reject;
    }),
  ];
  jest.mocked(toCanvas).mockImplementation((node) => {
    return isLegendCard(node) ? pending.shift()! : Promise.resolve(menuCanvas);
  });

  renderWorkspace();

  for (const settle of [
    () => {
      finish(legendCanvas);
    },
    () => {
      fail(new Error('fonts'));
    },
  ]) {
    await openExport();
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    await act(async () => {
      settle();
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  }

  // Never got as far as the menu.
  expect(
    jest.mocked(toCanvas).mock.calls.every(([node]) => {
      return isLegendCard(node);
    })
  ).toBe(true);
});

test('closing while the menu renders discards it', async () => {
  let finish: (canvas: HTMLCanvasElement) => void = () => {};
  let fail: (error: Error) => void = () => {};
  const pending = [
    new Promise<HTMLCanvasElement>((resolve) => {
      finish = resolve;
    }),
    new Promise<HTMLCanvasElement>((_resolve, reject) => {
      fail = reject;
    }),
  ];
  captureMenuWith(() => {
    return pending.shift()!;
  });

  renderWorkspace();

  for (const settle of [
    () => {
      finish(menuCanvas);
    },
    () => {
      fail(new Error('fonts'));
    },
  ]) {
    await openExport();
    await act(async () => {
      fireEvent.keyDown(document, { key: 'Escape' });
    });
    await act(async () => {
      settle();
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  }
});

test('a closed sidebar is not offered as the menu', async () => {
  renderWorkspace({
    workspaceConfig: {
      ...config,
      leftSidebar: { ...config.leftSidebar!, initialState: 'closed' },
    },
  });
  await openExport();

  expect(screen.queryByRole('switch', { name: 'Incluir menu' })).toBeNull();
  // Only the legend card is rendered: there is no menu to capture.
  expect(
    jest.mocked(toCanvas).mock.calls.every(([node]) => {
      return isLegendCard(node);
    })
  ).toBe(true);
});

test('a canvas with no layout width is read at one pixel per CSS pixel', async () => {
  setNativeMap(createMap({ clientWidth: 0 }));

  renderWorkspace();
  await openExport();

  expect(toCanvas).toHaveBeenCalledWith(
    expect.any(HTMLElement),
    expect.objectContaining({ pixelRatio: 1 })
  );
});

describe('what names the file', () => {
  const variationsBlock: GeovisWorkspaceConfig = {
    leftSidebar: {
      initialState: 'open',
      sections: [
        {
          id: 'filters',
          header: { title: 'Filtros' },
          body: {
            kind: 'filters',
            blocks: [
              {
                id: 'kind',
                title: 'Tipo',
                control: {
                  kind: 'variations',
                  menuId: 'kind',
                  defaultValue: 'farms',
                  variations: [{ value: 'farms', label: 'Fazendas' }],
                },
              },
            ],
          },
        },
      ],
    },
  };

  test('a variations block inside a filters tab, with no timeline', async () => {
    renderWorkspace({ workspaceConfig: variationsBlock });
    await openExport();

    expect(fileNameInput().value).toBe('fazendas');
  });

  test('the legend title, when no variation matches', async () => {
    renderWorkspace({
      workspaceConfig: {
        leftSidebar: {
          initialState: 'open',
          sections: [
            {
              id: 'filters',
              header: { title: 'Filtros' },
              body: { kind: 'filters', blocks: [] },
            },
          ],
        },
      },
    });
    await openExport();

    expect(fileNameInput().value).toBe('taxa-cumulativa');
  });

  test('the first top-level legend, when no layer names a resolvable one', async () => {
    renderWorkspace({
      workspaceConfig: {
        leftSidebar: {
          initialState: 'open',
          sections: [
            {
              id: 'filters',
              header: { title: 'Filtros' },
              body: { kind: 'filters', blocks: [] },
            },
          ],
        },
      },
      visualizationSpec: {
        ...spec,
        layers: [{ id: 'a' }, { id: 'b', activeLegendId: 'missing' }],
        legends: [{ id: 'other', title: 'Outra' }],
      },
    });
    await openExport();

    expect(fileNameInput().value).toBe('outra');
  });

  test('the spec title, with no legend at all', async () => {
    renderWorkspace({
      workspaceConfig: {
        leftSidebar: {
          initialState: 'open',
          sections: [
            {
              id: 'filters',
              header: { title: 'Filtros' },
              body: { kind: 'filters', blocks: [] },
            },
          ],
        },
      },
      visualizationSpec: { ...spec, layers: [], legends: undefined },
    });
    await openExport();

    expect(fileNameInput().value).toBe('mapa-de-teste');
    // No legend on screen, so nothing to include.
    expect(
      screen.queryByRole('switch', { name: 'Incluir legenda' })
    ).toBeNull();
    expect(lastDrawn()).toEqual([expect.any(HTMLCanvasElement)]);
  });

  test('a variations block found past other tabs and other blocks', async () => {
    renderWorkspace({
      workspaceConfig: {
        leftSidebar: {
          initialState: 'open',
          sections: [
            {
              id: 'settings',
              header: { title: 'Ajustes' },
              body: { kind: 'settings', blocks: [] },
            },
            {
              id: 'filters',
              header: { title: 'Filtros' },
              body: {
                kind: 'filters',
                blocks: [
                  {
                    id: 'year',
                    title: 'Ano',
                    control: { kind: 'timeline', min: 2000, max: 2010 },
                  },
                  ...(variationsBlock.leftSidebar!.sections[0].body.kind ===
                  'filters'
                    ? variationsBlock.leftSidebar!.sections[0].body.blocks
                    : []),
                ],
              },
            },
          ],
        },
      },
    });
    await openExport();

    // A timeline without a `menuId` still dates the file: its value is read
    // off the timeline itself, not the selection.
    expect(fileNameInput().value).toBe('fazendas_2000');
  });

  test('a config with no left sidebar names the map by its legend', () => {
    const { result } = renderHook(
      () => {
        return useMapExportContent();
      },
      {
        wrapper: ({ children }) => {
          return (
            <I18nProvider>
              <GeoVisProvider spec={spec as never}>
                <GeovisWorkspaceProvider config={{}}>
                  {children}
                </GeovisWorkspaceProvider>
              </GeoVisProvider>
            </I18nProvider>
          );
        },
      }
    );

    expect(result.current.title).toEqual({
      label: 'Taxa cumulativa',
      year: undefined,
    });
  });

  test('a workspace with no sections at all', async () => {
    render(
      <I18nProvider>
        <GeovisWorkspaceProvider config={{ leftSidebar: { sections: [] } }}>
          <LeftSidebar />
        </GeovisWorkspaceProvider>
      </I18nProvider>
    );

    // Outside `Layout` the button is inert: nothing opens, nothing throws.
    fireEvent.click(
      screen.getByRole('button', { name: 'Exportar mapa como PNG' })
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
