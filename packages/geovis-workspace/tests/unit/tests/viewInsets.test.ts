import type { VisualizationSpec } from '@ttoss/geovis';
import {
  LEFT_SIDEBAR_CONTROL_CLEARANCE,
  RIGHT_SIDEBAR_LEGEND_CLEARANCE,
} from 'src/controlOffset';
import { applySidebarViewInsets } from 'src/viewInsets';

const baseSpec: VisualizationSpec = {
  engine: 'maplibre',
  view: { center: [0, 0], zoom: 1 },
  sources: [],
  layers: [],
};

describe('applySidebarViewInsets', () => {
  test('adds the open right sidebar to the insets', () => {
    expect(
      applySidebarViewInsets({
        spec: baseSpec,
        leftSidebarOpen: false,
        rightSidebarOpen: true,
        compact: false,
      }).viewInsets
    ).toEqual({ right: RIGHT_SIDEBAR_LEGEND_CLEARANCE });
  });

  test("adds both sidebars to the app's own insets", () => {
    expect(
      applySidebarViewInsets({
        spec: { ...baseSpec, viewInsets: { top: 40, left: 10 } },
        leftSidebarOpen: true,
        rightSidebarOpen: true,
        compact: false,
      }).viewInsets
    ).toEqual({
      top: 40,
      left: 10 + LEFT_SIDEBAR_CONTROL_CLEARANCE,
      right: RIGHT_SIDEBAR_LEGEND_CLEARANCE,
    });
  });

  test.each([
    [
      'no sidebar is open',
      { leftSidebarOpen: false, rightSidebarOpen: false, compact: false },
    ],
    [
      'the viewport is compact',
      { leftSidebarOpen: true, rightSidebarOpen: true, compact: true },
    ],
  ])('keeps the spec as it is when %s', (_name, state) => {
    expect(applySidebarViewInsets({ spec: baseSpec, ...state })).toBe(baseSpec);
  });
});
