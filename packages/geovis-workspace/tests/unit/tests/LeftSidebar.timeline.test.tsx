/**
 * The compact timeline HUD: the bar that takes over playback once a
 * `closeOnPlay` timeline collapses the sidebar. Compact-viewport only.
 * The rest of the left sidebar is covered in LeftSidebar.test.tsx.
 */

import { act, render, screen } from '@ttoss/test-utils/react';
import type * as React from 'react';
import { GeovisWorkspace } from 'src';

import {
  click,
  closeOnPlayPreview,
  hudPlayControl,
  mockViewport,
  openFiltros,
  type Preview,
  preview,
  Provider,
  visualizationSpec,
} from './leftSidebarTestUtils';

jest.mock('@ttoss/geovis', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- the factory is hoisted above imports
  return require('./leftSidebarTestUtils').createGeoVisMock();
});

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
