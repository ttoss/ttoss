/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useGeoVis } from 'src/react/contexts';
import type { ViewInsets } from 'src/spec/types';
import type { ProximitySearch } from 'src/spec/types.proximity';
import { useCircleFrame } from 'src/ui/GeoVisProximitySearch.frame';

jest.mock('src/react/contexts', () => {
  return {
    ...jest.requireActual('src/react/contexts'),
    useGeoVis: jest.fn(),
  };
});

const frameFor = ({
  width,
  height,
  viewInsets,
  frame,
}: {
  width: number;
  height: number;
  viewInsets?: ViewInsets;
  frame?: ProximitySearch['frame'];
}) => {
  jest.mocked(useGeoVis).mockReturnValue({
    spec: { viewInsets },
  } as unknown as ReturnType<typeof useGeoVis>);
  const config = { query: jest.fn(), frame } as unknown as ProximitySearch;
  return renderHook(() => {
    return useCircleFrame({ config, width, height });
  }).result.current;
};

describe('useCircleFrame', () => {
  test('fills the map by default, keeping room for the bar under the circle', () => {
    // Half the height, less 64 px of room: the height is the smaller side.
    expect(frameFor({ width: 1200, height: 800 })).toEqual({
      pixels: 336,
      offset: [0, 0],
    });
    // Half the width, less 24 px: a tall, narrow map.
    expect(frameFor({ width: 500, height: 1000 })).toEqual({
      pixels: 226,
      offset: [0, 0],
    });
  });

  test("fits the free area the app's panels leave, centred in it", () => {
    expect(
      frameFor({ width: 1000, height: 800, viewInsets: { right: 400 } })
    ).toEqual({ pixels: 276, offset: [-200, 0] });
    expect(
      frameFor({
        width: 1200,
        height: 800,
        viewInsets: { left: 100, top: 60, bottom: 20 },
      })
    ).toEqual({ pixels: 296, offset: [50, 20] });
  });

  test('keeps a smallest circle on a cramped map', () => {
    expect(frameFor({ width: 300, height: 150 }).pixels).toBe(80);
  });

  test('compact keeps the circle 110–150 px across, centred in the free area', () => {
    expect(
      frameFor({ width: 1200, height: 800, frame: 'compact' }).pixels
    ).toBe(150);
    expect(frameFor({ width: 400, height: 800, frame: 'compact' }).pixels).toBe(
      110
    );
    expect(
      frameFor({
        width: 1200,
        height: 800,
        frame: 'compact',
        viewInsets: { right: 300 },
      }).offset
    ).toEqual([-150, 0]);
  });
});
