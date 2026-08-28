/**
 * The named measure of a **side panel** — a region that stands beside the main
 * content rather than inside it.
 *
 * Two components size one, and they must agree: `AppShell` gives its `sidebar`
 * and `aside` a grid track, and `Drawer` gives the same region a temporary
 * surface when there is no room for a track. A sidebar that changes width the
 * moment it becomes a drawer would read as a different panel, so the scale is
 * one source rather than a constant in each file — the same rule that pulled
 * the trigger silhouette into `ActionTrigger/anatomy` (ADR-013).
 *
 * ## Why a named scale rather than a length
 *
 * A panel width is a layout decision with a small number of right answers, and
 * a raw length in consumer code is the arbitrary value the system exists to
 * prevent (CONTRACT §4). It is **not** a `size` prop in the sense §4 forbids:
 * that rule is about control density — a denser control is a different
 * component — while this is the measure of a region, the same kind of choice
 * `Container`'s named widths express.
 *
 * `rem` rather than `px` so a panel grows with the user's font size; the
 * regions it sizes hold text.
 */
export const PANEL_WIDTH = {
  sm: '13rem',
  md: '16rem',
  lg: '20rem',
} as const;

/** A named side-panel measure. */
export type PanelWidth = keyof typeof PANEL_WIDTH;
