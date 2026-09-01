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

export const openRightSidebar = async () => {
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open details' }));
  });
};
