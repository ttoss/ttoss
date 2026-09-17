/**
 * Shared setup for the LeftSidebar suites: the `@ttoss/geovis` mock, the
 * two-tab preview config and the render/interaction helpers. The compact
 * timeline HUD has its own suite in LeftSidebar.timeline.test.tsx.
 */

import { I18nProvider } from '@ttoss/react-i18n';
import { act, fireEvent, screen } from '@ttoss/test-utils/react';
import type * as React from 'react';
// Type-only: this module is required from a `jest.mock` factory, so it must
// not pull `src` (and through it the mocked `@ttoss/geovis`) in at runtime.
import { type GeovisWorkspaceConfig } from 'src';

interface MockSpec {
  mockResult?: unknown;
}

/**
 * Hoisted above imports by the `jest.mock` factory, so it is required, not
 * imported, at the call site.
 */
export const createGeoVisMock = () => {
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
};

export const Provider = ({ children }: React.PropsWithChildren) => {
  return <I18nProvider>{children}</I18nProvider>;
};

/**
 * An app that declares a locale for its own text without shipping a message
 * bundle for it — the shape that separates the declared locale from the one
 * react-intl resolves messages with.
 */
export const PtBrProvider = ({ children }: React.PropsWithChildren) => {
  return <I18nProvider locale="pt-BR">{children}</I18nProvider>;
};

export const visualizationSpec = {
  engine: 'maplibre' as const,
  sources: [],
  layers: [],
};

export type Preview = {
  sections: NonNullable<GeovisWorkspaceConfig['leftSidebar']>['sections'];
};

/** A full two-tab preview: a flat variations list and the three filter kinds. */
export const preview: Preview = {
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
            collapsible: true,
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
/**
 * A settings zone covering both slider shapes, the color ramp, and the toggle.
 *
 * The four sliders cover the matrix: `malha` is a ladder with a caption and
 * steppers, `opacidade` a continuous range with steppers but no caption,
 * `simples` a caption without steppers, and `minimo` neither — so the row under
 * the track is absent entirely. None but `opacidade` declares `min`/`max`/`step`,
 * which is what exercises the control's own fallbacks.
 *
 * The three ramp blocks cover where the chosen ramp comes from: `cores`
 * declares a `defaultValue` off the first option, `cores-auto` declares none
 * and falls to the first option, and `cores-vazio` has no options to fall to.
 */
export const settingsPreview: Preview = {
  sections: [
    preview.sections[0],
    {
      id: 'config',
      header: { title: 'Configurações', icon: 'lucide:settings' },
      body: {
        kind: 'settings',
        blocks: [
          {
            id: 'malha',
            title: 'Malha',
            icon: 'lucide:hexagon',
            control: {
              kind: 'slider',
              menuId: 'malha',
              stops: [
                { value: 320, label: '320 km', hint: '10 células' },
                { value: 160, label: '160 km', hint: '40 células' },
                { value: 80, label: '80 km', hint: '160 células' },
              ],
              defaultValue: 160,
              endLabels: ['Panorâmico', 'Detalhado'],
              stepButtons: true,
            },
          },
          {
            id: 'opacidade',
            title: 'Opacidade',
            control: {
              kind: 'slider',
              menuId: 'opacidade',
              min: 30,
              max: 100,
              step: 5,
              defaultValue: 85,
              unit: '%',
              stepButtons: true,
            },
          },
          {
            id: 'simples',
            title: 'Simples',
            collapsible: true,
            defaultOpen: false,
            hint: 'Sem passos nem unidade.',
            control: {
              kind: 'slider',
              menuId: 'simples',
              defaultValue: 10,
              endLabels: ['Pouco', 'Muito'],
            },
          },
          {
            id: 'minimo',
            title: 'Mínimo',
            control: { kind: 'slider', menuId: 'minimo', defaultValue: 4 },
          },
          {
            id: 'cores',
            title: 'Cor da malha',
            icon: 'lucide:droplet',
            control: {
              kind: 'colorRamp',
              menuId: 'cores',
              defaultValue: 'verdes',
              options: [
                {
                  id: 'azuis',
                  label: 'Azuis',
                  colors: ['#C6DBEF', '#6BAED6', '#2171B5', '#08306B'],
                },
                {
                  id: 'verdes',
                  label: 'Verdes',
                  colors: ['#C7E9C0', '#74C476', '#238B45', '#00441B'],
                },
              ],
            },
          },
          {
            id: 'cores-auto',
            title: 'Cor automática',
            control: {
              kind: 'colorRamp',
              menuId: 'coresAuto',
              options: [
                {
                  id: 'quente',
                  label: 'Quente',
                  colors: ['#FEE6CE', '#E6550D'],
                },
                { id: 'fria', label: 'Fria', colors: ['#DEEBF7', '#3182BD'] },
              ],
            },
          },
          {
            id: 'cores-vazio',
            title: 'Cor sem rampas',
            control: { kind: 'colorRamp', menuId: 'coresVazio', options: [] },
          },
          {
            id: 'ocultar',
            title: 'Ocultar vazios',
            hint: 'Células sem registro somem.',
            control: {
              kind: 'toggle',
              menuId: 'ocultar',
              icon: 'lucide:eye-off',
              defaultValue: false,
            },
          },
          {
            id: 'rotulos',
            title: 'Rótulos',
            control: {
              kind: 'toggle',
              menuId: 'rotulos',
              defaultValue: true,
            },
          },
        ],
      },
    },
  ],
};

export const click = async (element: HTMLElement) => {
  await act(async () => {
    fireEvent.click(element);
  });
};

export const openFiltros = async () => {
  await click(screen.getByRole('button', { name: 'Filtros' }));
};

export const openConfig = async () => {
  await click(screen.getByRole('button', { name: 'Configurações' }));
};

/** The same preview with the timeline opted into closing when playback starts. */
export const closeOnPlayPreview: Preview = {
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

/**
 * Stubs `matchMedia` so `useCompactViewport` reports the compact layout, which
 * is the only one the HUD renders in. jsdom ships no implementation, so without
 * this the hook always answers "roomy".
 */
export const mockViewport = (width: number) => {
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
export const hudPlayControl = () => {
  const controls = screen.queryAllByRole('button', { name: /^(Play|Pause)$/ });
  // The sidebar's own control is the first; the HUD's is the one that outlives
  // it, so after `closeOnPlay` there is exactly one left.
  return controls.length === 1 ? controls[0] : null;
};
