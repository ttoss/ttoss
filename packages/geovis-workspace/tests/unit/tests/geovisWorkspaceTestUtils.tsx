import { I18nProvider } from '@ttoss/react-i18n';
import { act, fireEvent, screen } from '@ttoss/test-utils/react';
import type * as React from 'react';
import { type GeovisWorkspaceConfig } from 'src';

export interface MockClick {
  layerId: string;
  featureId: string | number;
  value: number | string | null;
}

export interface MockSpec {
  legends?: { id: string }[];
  mockResult?: unknown;
  mockClick?: MockClick | null;
}

/**
 * Builds the `@ttoss/geovis` module mock. Each suite installs it with
 *
 *     jest.mock('@ttoss/geovis', () => {
 *       return require('./geovisWorkspaceTestUtils').createGeoVisMock();
 *     });
 *
 * The `require` is deliberate: babel-jest hoists the factory above the file's
 * imports, so it cannot close over an imported binding.
 */
export const createGeoVisMock = () => {
  const ReactModule = jest.requireActual('react');
  const MockGeoVisContext = ReactModule.createContext<{
    spec: MockSpec;
    result: unknown;
    click: MockClick | null;
    dismiss: () => void;
  } | null>(null);
  // The map mode: single until a test splits it from the canvas's buttons.
  const MockMapModeContext = ReactModule.createContext({
    mode: 'single',
    activeSide: 'a',
    setMode: (_mode: string) => {},
    setActiveSide: (_side: string) => {},
  });
  // Every `split` the workspace hands the provider, latest last.
  const splitInputs: unknown[] = [];

  return {
    mockSplitInputs: splitInputs,
    useGeoVisMapMode: () => {
      return ReactModule.useContext(MockMapModeContext);
    },
    GeoVisProvider: ({
      spec,
      split,
      children,
    }: React.PropsWithChildren<{ spec: MockSpec; split?: unknown }>) => {
      const [mode, setMode] = ReactModule.useState('single');
      const [activeSide, setActiveSide] = ReactModule.useState('a');
      const changeMode = ReactModule.useCallback((next: string) => {
        setMode(next);
        setActiveSide('a');
      }, []);
      ReactModule.useEffect(() => {
        if (split) splitInputs.push(split);
      }, [split]);
      const mapMode = ReactModule.useMemo(() => {
        return { mode, activeSide, setMode: changeMode, setActiveSide };
      }, [mode, activeSide, changeMode]);
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
        <MockMapModeContext.Provider value={mapMode}>
          <MockGeoVisContext.Provider value={{ spec, result, click, dismiss }}>
            <div data-testid="geovis-provider">{children}</div>
          </MockGeoVisContext.Provider>
        </MockMapModeContext.Provider>
      );
    },
    GeoVisCanvas: () => {
      const { setMode, setActiveSide } =
        ReactModule.useContext(MockMapModeContext);
      return (
        <div data-testid="geovis-canvas">
          <button
            type="button"
            onClick={() => {
              setMode('split');
            }}
          >
            mock split
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('single');
            }}
          >
            mock single
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveSide('b');
            }}
          >
            mock click half b
          </button>
        </div>
      );
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
    // jsdom ships no `matchMedia`, so the roomy layout is what these tests
    // assume. The compact HUD is covered in LeftSidebar.test.tsx.
    useCompactViewport: () => {
      return false;
    },
  };
};

export const Provider = ({ children }: React.PropsWithChildren) => {
  return <I18nProvider>{children}</I18nProvider>;
};

export const config: GeovisWorkspaceConfig = {
  leftSidebar: {
    sections: [
      {
        id: 'population',
        header: { title: 'População' },
        body: {
          kind: 'variations',
          menuId: 'population',
          groups: [
            {
              id: 'population',
              label: 'População',
              variations: [
                { value: '5year-65plus', label: 'Faixa (% da pop 65+)' },
                { value: '0-14', label: '0 a 14 anos' },
              ],
            },
          ],
        },
      },
      {
        id: 'economy',
        header: { title: 'Economia' },
        body: {
          kind: 'variations',
          menuId: 'economy',
          groups: [
            {
              id: 'economy',
              label: 'Economia',
              variations: [
                { value: 'gdp', label: 'PIB' },
                { value: 'income', label: 'Renda média' },
              ],
            },
          ],
        },
      },
    ],
  },
};

export const visualizationSpec = {
  id: 'test-spec',
  engine: 'maplibre' as const,
  sources: [],
  layers: [],
};

export const visualizationSpecWithLegends = {
  ...visualizationSpec,
  legends: [{ id: 'classes' }],
};

export const resolvedWithWarnings = {
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

export const failingResult = {
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

export const visualizationSpecWithWarnings = {
  ...visualizationSpec,
  mockResult: resolvedWithWarnings,
};

export const failingVisualizationSpec = {
  ...visualizationSpec,
  mockResult: failingResult,
};

export const openLeftSidebar = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open menu' }));
  });
};

/**
 * The config with the right sidebar starting open: it has no button of its
 * own to open it, so a test reaching its panels mounts it open.
 */
export const openRight = <T extends { rightSidebar?: object }>(
  config: T
): T => {
  return {
    ...config,
    rightSidebar: { ...config.rightSidebar, initialState: 'open' },
  };
};
