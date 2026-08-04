import type { VisualizationSpec } from '@ttoss/geovis';
import {
  applyLeftSidebarControlOffset,
  LEFT_SIDEBAR_CONTROL_CLEARANCE,
} from 'src/controlOffset';

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
