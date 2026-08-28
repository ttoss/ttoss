import type { VisualizationSpec } from '@ttoss/geovis';
import {
  applyLeftSidebarControlOffset,
  applyRightSidebarLegendOffset,
  LEFT_SIDEBAR_CONTROL_CLEARANCE,
  RIGHT_SIDEBAR_LEGEND_CLEARANCE,
} from 'src/controlOffset';

type Legend = NonNullable<VisualizationSpec['legends']>[number];
type Layer = VisualizationSpec['layers'][number];

const legend = (overrides: Partial<Legend> = {}): Legend => {
  return { id: 'lg', ...overrides };
};

const baseSpec: VisualizationSpec = {
  engine: 'maplibre',
  sources: [],
  layers: [],
};

const withControl = (
  control: NonNullable<VisualizationSpec['control']>
): VisualizationSpec => {
  return { ...baseSpec, control };
};

const control = (
  overrides: Partial<NonNullable<VisualizationSpec['control']>> = {}
): NonNullable<VisualizationSpec['control']> => {
  return { id: 'layers', items: [], ...overrides };
};

describe('applyLeftSidebarControlOffset', () => {
  test('returns the spec untouched when it has no control', () => {
    const result = applyLeftSidebarControlOffset({
      spec: baseSpec,
      leftSidebarOpen: true,
    });

    expect(result).toBe(baseSpec);
  });

  test('returns the spec untouched while the sidebar is closed', () => {
    const spec = withControl(control({ position: 'bottom-left' }));

    const result = applyLeftSidebarControlOffset({
      spec,
      leftSidebarOpen: false,
    });

    expect(result).toBe(spec);
  });

  test.each(['bottom-right', 'top-right'] as const)(
    'returns the spec untouched for a %s-anchored control the sidebar never covers',
    (position) => {
      const spec = withControl(control({ position }));

      const result = applyLeftSidebarControlOffset({
        spec,
        leftSidebarOpen: true,
      });

      expect(result).toBe(spec);
    }
  );

  test('shifts a default-positioned control clear of the open sidebar', () => {
    // No `position` set → defaults to `bottom-left`, which the sidebar covers.
    const spec = withControl(control());

    const result = applyLeftSidebarControlOffset({
      spec,
      leftSidebarOpen: true,
    });

    expect(result).not.toBe(spec);
    expect(result.control?.offset).toEqual({
      x: LEFT_SIDEBAR_CONTROL_CLEARANCE,
    });
  });

  test('preserves a numeric original offset as the vertical distance', () => {
    const spec = withControl(control({ position: 'bottom-left', offset: 12 }));

    const result = applyLeftSidebarControlOffset({
      spec,
      leftSidebarOpen: true,
    });

    expect(result.control?.offset).toEqual({
      x: LEFT_SIDEBAR_CONTROL_CLEARANCE,
      y: 12,
    });
  });

  test("preserves an object offset's vertical distance and overrides x", () => {
    const spec = withControl(
      control({ position: 'top-left', offset: { x: 10, y: 7 } })
    );

    const result = applyLeftSidebarControlOffset({
      spec,
      leftSidebarOpen: true,
    });

    expect(result.control?.offset).toEqual({
      x: LEFT_SIDEBAR_CONTROL_CLEARANCE,
      y: 7,
    });
  });

  test('omits y when the original object offset has no vertical distance', () => {
    const spec = withControl(
      control({ position: 'bottom-left', offset: { x: 10 } })
    );

    const result = applyLeftSidebarControlOffset({
      spec,
      leftSidebarOpen: true,
    });

    expect(result.control?.offset).toEqual({
      x: LEFT_SIDEBAR_CONTROL_CLEARANCE,
    });
  });
});

const withLegends = (legends: Legend[]): VisualizationSpec => {
  return { ...baseSpec, legends };
};

describe('applyRightSidebarLegendOffset', () => {
  test('returns the spec untouched while the sidebar is closed', () => {
    const spec = withLegends([legend({ position: 'bottom-right' })]);

    const result = applyRightSidebarLegendOffset({
      spec,
      rightSidebarOpen: false,
    });

    expect(result).toBe(spec);
  });

  test('returns the spec untouched when no legend is right-anchored', () => {
    const spec = withLegends([
      legend({ position: 'bottom-left' }),
      legend({ id: 'no-position' }),
    ]);

    const result = applyRightSidebarLegendOffset({
      spec,
      rightSidebarOpen: true,
    });

    expect(result).toBe(spec);
  });

  test.each(['bottom-right', 'top-right'] as const)(
    'shifts a %s top-level legend clear of the open sidebar',
    (position) => {
      const spec = withLegends([legend({ position })]);

      const result = applyRightSidebarLegendOffset({
        spec,
        rightSidebarOpen: true,
      });

      expect(result).not.toBe(spec);
      expect(result.legends?.[0].offset).toEqual({
        x: RIGHT_SIDEBAR_LEGEND_CLEARANCE,
      });
    }
  );

  test('shifts a per-layer legend and keeps unaffected layers by reference', () => {
    const plainLayer: Layer = { id: 'a', sourceId: 's', geometry: 'polygon' };
    const legendLayer: Layer = {
      id: 'b',
      sourceId: 's',
      geometry: 'polygon',
      legends: [legend({ position: 'bottom-right' })],
    };
    const spec: VisualizationSpec = {
      ...baseSpec,
      layers: [plainLayer, legendLayer],
    };

    const result = applyRightSidebarLegendOffset({
      spec,
      rightSidebarOpen: true,
    });

    expect(result).not.toBe(spec);
    // The layer with no right-anchored legend keeps its identity.
    expect(result.layers[0]).toBe(plainLayer);
    expect(result.layers[1].legends?.[0].offset).toEqual({
      x: RIGHT_SIDEBAR_LEGEND_CLEARANCE,
    });
  });

  test('preserves a numeric original offset as the vertical distance', () => {
    const spec = withLegends([
      legend({ position: 'bottom-right', offset: 12 }),
    ]);

    const result = applyRightSidebarLegendOffset({
      spec,
      rightSidebarOpen: true,
    });

    expect(result.legends?.[0].offset).toEqual({
      x: RIGHT_SIDEBAR_LEGEND_CLEARANCE,
      y: 12,
    });
  });

  test("preserves an object offset's vertical distance and overrides x", () => {
    const spec = withLegends([
      legend({ position: 'top-right', offset: { x: 10, y: 7 } }),
    ]);

    const result = applyRightSidebarLegendOffset({
      spec,
      rightSidebarOpen: true,
    });

    expect(result.legends?.[0].offset).toEqual({
      x: RIGHT_SIDEBAR_LEGEND_CLEARANCE,
      y: 7,
    });
  });

  test('omits y when the original object offset has no vertical distance', () => {
    const spec = withLegends([
      legend({ position: 'bottom-right', offset: { x: 10 } }),
    ]);

    const result = applyRightSidebarLegendOffset({
      spec,
      rightSidebarOpen: true,
    });

    expect(result.legends?.[0].offset).toEqual({
      x: RIGHT_SIDEBAR_LEGEND_CLEARANCE,
    });
  });
});
