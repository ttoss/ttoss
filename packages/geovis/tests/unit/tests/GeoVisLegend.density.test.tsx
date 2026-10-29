/**
 * @jest-environment jsdom
 */

/**
 * A density legend: a gradient in the colours of the heatmap layer that
 * refers to it, with low and high labels — never swatches of its own.
 */

import { act, screen } from '@testing-library/react';
import { GeoVisProvider } from 'src/react/GeoVisProvider';
import { SEQUENTIAL_PALETTES } from 'src/spec/mapTypeDefaults/palettes';
import type { VisualizationLayer, VisualizationSpec } from 'src/spec/types';
import { GeoVisLegend } from 'src/ui/GeoVisLegend';
import {
  DensityGradient,
  densityGradientCss,
  resolveLegendScale,
} from 'src/ui/GeoVisLegend.gradient';

import { render } from '../renderWithI18n';

jest.setTimeout(30000);

jest.mock('src/adapters/maplibre/MapLibreAdapter', () => {
  return {
    __esModule: true,
    default: jest.fn(() => {
      return {
        id: 'maplibre',
        getCapabilities: jest.fn(),
        mount: jest.fn(() => {
          return { viewId: 'v', container: {}, destroy: jest.fn() };
        }),
        update: jest.fn(),
        destroy: jest.fn(),
        getNativeInstance: jest.fn(() => {
          return null;
        }),
      };
    }),
  };
});

const heatSpec = ({
  layer,
  lowLabel,
  highLabel,
}: {
  layer?: Partial<VisualizationLayer>;
  lowLabel?: string;
  highLabel?: string;
} = {}): VisualizationSpec => {
  return {
    engine: 'maplibre',
    view: { center: [-46.63, -23.55], zoom: 10 },
    sources: [
      {
        id: 'crashes',
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      },
    ],
    layers: [
      {
        id: 'heat',
        sourceId: 'crashes',
        geometry: 'heatmap',
        activeLegendId: 'density',
        paint: { heatmapColors: ['#fde68a', '#dc2626'] },
        ...layer,
      },
    ],
    legends: [
      {
        id: 'density',
        title: 'Traffic crashes',
        colorBy: { type: 'density', lowLabel, highLabel },
      },
    ],
  };
};

const renderLegend = async (spec: VisualizationSpec) => {
  const view = render(
    <GeoVisProvider spec={spec}>
      <GeoVisLegend legendId="density" />
    </GeoVisProvider>
  );
  await act(async () => {
    // Await for any pending state updates from GeoVisProvider
  });
  return view;
};

const gradientOf = (container: HTMLElement) => {
  return container.querySelector<HTMLElement>('[data-geovis-density-gradient]');
};

describe('density legend', () => {
  test('draws the heatmap layer’s colours as a gradient, with default labels', async () => {
    const { container } = await renderLegend(heatSpec());

    expect(gradientOf(container)?.style.backgroundImage).toBe(
      densityGradientCss(['#fde68a', '#dc2626'])
    );
    expect(screen.getByText('Less')).toBeTruthy();
    expect(screen.getByText('More')).toBeTruthy();
    expect(
      screen.getByRole('img', { name: 'Traffic crashes: Less to More' })
    ).toBeTruthy();
    expect(container.querySelectorAll('li')).toHaveLength(0);
  });

  test('shows the legend’s own labels in place of the defaults', async () => {
    await renderLegend(
      heatSpec({ lowLabel: 'Fewer crashes', highLabel: 'More crashes' })
    );

    expect(screen.getByText('Fewer crashes')).toBeTruthy();
    expect(screen.getByText('More crashes')).toBeTruthy();
  });

  test('draws a named palette in its colours', async () => {
    const { container } = await renderLegend(
      heatSpec({ layer: { paint: { heatmapColors: 'green' } } })
    );

    expect(gradientOf(container)?.style.backgroundImage).toBe(
      densityGradientCss(SEQUENTIAL_PALETTES.green)
    );
  });

  test('draws MapLibre’s ramp for a layer that declares no colours', async () => {
    const { container } = await renderLegend(
      heatSpec({ layer: { paint: {} } })
    );

    expect(gradientOf(container)?.style.backgroundImage).toBe(
      densityGradientCss(['royalblue', 'cyan', 'lime', 'yellow', 'red'])
    );
  });

  test('finds a legend the heatmap layer declares in its own legends', async () => {
    const spec = heatSpec();
    const legend = spec.legends![0];
    const { container } = await renderLegend({
      ...spec,
      legends: undefined,
      layers: [
        { ...spec.layers[0], activeLegendId: undefined, legends: [legend] },
      ],
    });

    expect(gradientOf(container)).not.toBeNull();
  });

  test('renders nothing when no heatmap layer refers to the legend', async () => {
    const { container } = await renderLegend(
      heatSpec({ layer: { activeLegendId: undefined } })
    );

    expect(container.firstChild).toBeNull();
  });

  test('tints the icon chip with the hottest colour', async () => {
    const spec = heatSpec();
    spec.legends![0].icon = 'lucide:car';
    const { container } = await renderLegend(spec);

    const chip = container.querySelector<HTMLElement>('span[aria-hidden]');
    expect(chip?.style.color).toBe('rgb(220, 38, 38)');
  });
});

describe('density legend footer', () => {
  test('separates the gradient from a reference footer', async () => {
    const spec = heatSpec();
    spec.legends![0].reference = 'Source: INFOSIGA-SP';
    const { container } = await renderLegend(spec);

    const scale = screen.getByRole('img', {
      name: 'Traffic crashes: Less to More',
    });
    expect(scale.style.borderBottom).not.toBe('');
    expect(container.textContent).toContain('Source: INFOSIGA-SP');
  });
});

describe('resolveLegendScale', () => {
  const legend = { id: 'l' };

  test('falls back to the swatches for a legend without density colours', () => {
    expect(
      resolveLegendScale({
        legend,
        items: [],
        circleItems: [{ label: '1M', radiusPx: 8 }],
        densityColors: undefined,
      })
    ).toEqual({ swatchColor: '#6b7a90', hasItems: true });
    expect(
      resolveLegendScale({
        legend,
        items: [],
        circleItems: [],
        densityColors: [],
      }).hasItems
    ).toBe(false);
  });
});

describe('DensityGradient', () => {
  test('uses the default labels for a legend that is not a density one', () => {
    render(
      <DensityGradient
        legend={{ id: 'plain' }}
        colors={['#000000', '#ffffff']}
        hasFooter={false}
      />
    );

    expect(
      screen.getByRole('img', { name: 'plain: Less to More' })
    ).toBeTruthy();
  });
});

describe('densityGradientCss', () => {
  test('repeats a single colour so the bar is still drawn', () => {
    expect(densityGradientCss(['#dc2626'])).toBe(
      'linear-gradient(to right, #dc2626, #dc2626)'
    );
  });
});
