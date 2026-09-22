import * as React from 'react';

/** How much of the map each sidebar is covering, in pixels. */
export type MapInset = { left: number; right: number };

const NONE: MapInset = { left: 0, right: 0 };

/** Measured widths, before the open flags decide what is actually covering. */
type Widths = { container: number; left: number; right: number };

/**
 * How much of the map is left once the open sidebars are accounted for.
 *
 * Measured rather than derived from the panel's declared width: the sidebars
 * are absolutely positioned overlays, so the map keeps its full width and
 * nothing in the layout says how much of it is still visible. Reading the
 * rendered boxes also stays correct when the panel's width or its inset changes
 * in the theme, which a constant repeated here would not.
 *
 * The open flags are arguments rather than something to measure: a closed
 * sidebar is translated out of view, not resized, so its box is the same width
 * either way.
 *
 * A panel as wide as the workspace — the mobile full-screen case — reports
 * nothing: there is no remaining map to center against, so whatever is centered
 * on this inset falls back to the middle of the screen.
 *
 * Where `ResizeObserver` is missing, as in jsdom, nothing is measured and the
 * inset stays at zero, which is the same centering the workspace had before.
 *
 * @param params.container - The workspace box the sidebars are anchored to.
 * @param params.left - The left sidebar's overlay.
 * @param params.right - The right sidebar's overlay.
 * @param params.leftOpen - Whether the left sidebar is showing.
 * @param params.rightOpen - Whether the right sidebar is showing.
 * @returns The covered width on each side.
 *
 * @example
 * useMapInset({ container, left, right, leftOpen: true, rightOpen: false });
 * // { left: 340, right: 0 }
 */
export const useMapInset = ({
  container,
  left,
  right,
  leftOpen,
  rightOpen,
}: {
  container: React.RefObject<HTMLElement | null>;
  left: React.RefObject<HTMLElement | null>;
  right: React.RefObject<HTMLElement | null>;
  leftOpen: boolean;
  rightOpen: boolean;
}): MapInset => {
  const [widths, setWidths] = React.useState<Widths>({
    container: 0,
    left: 0,
    right: 0,
  });

  React.useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return undefined;

    const observer = new ResizeObserver(() => {
      setWidths({
        container: container.current?.getBoundingClientRect().width ?? 0,
        left: left.current?.getBoundingClientRect().width ?? 0,
        right: right.current?.getBoundingClientRect().width ?? 0,
      });
    });

    for (const node of [container.current, left.current, right.current]) {
      if (node) observer.observe(node);
    }

    return () => {
      return observer.disconnect();
    };
  }, [container, left, right]);

  return React.useMemo(() => {
    if (widths.container === 0) return NONE;

    const covered = (width: number, open: boolean) => {
      // A panel as wide as the workspace leaves no map to center against.
      return open && width < widths.container ? width : 0;
    };

    return {
      left: covered(widths.left, leftOpen),
      right: covered(widths.right, rightOpen),
    };
  }, [widths, leftOpen, rightOpen]);
};
