import * as React from 'react';

import type { GeoVisSplitSide } from './mapMode.split';

/** Closes the open picker on `Escape` or a pointer down outside any picker. */
export const useDismissPicker = (
  open: GeoVisSplitSide | null,
  close: () => void
) => {
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target?.closest?.('[data-split-picker]')) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, close]);
};

/**
 * Where each picker sits: flanking the divider at `center` — A's pill ending
 * just left of it, B's starting just right of it — or, when the free map is
 * too narrow for two pills side by side, stacked over the divider.
 *
 * @param side - The picker's side.
 * @param stacked - Whether the pills stack over the divider.
 * @param center - The divider's distance from the map's left edge, in px, or
 *   `null` before the map is measured — the pills then flank its middle.
 * @param width - The map's width, in px.
 */
export const pickerPlacement = ({
  side,
  stacked,
  center,
  width,
}: {
  side: GeoVisSplitSide;
  stacked: boolean;
  center: number | null;
  width: number;
}) => {
  if (center === null) {
    return {
      style:
        side === 'a'
          ? { top: 12, right: 'calc(50% + 12px)' }
          : { top: 12, left: 'calc(50% + 12px)' },
      menuAlign: side === 'a' ? ('right' as const) : ('left' as const),
    };
  }
  if (stacked) {
    return {
      style: {
        top: side === 'a' ? 12 : 56,
        left: center,
        transform: 'translateX(-50%)',
      },
      menuAlign: 'center' as const,
    };
  }
  if (side === 'a') {
    return {
      style: { top: 12, right: width - center + 12 },
      menuAlign: 'right' as const,
    };
  }
  return {
    style: { top: 12, left: center + 12 },
    menuAlign: 'left' as const,
  };
};
