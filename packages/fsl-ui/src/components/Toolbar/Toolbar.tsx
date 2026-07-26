import type * as React from 'react';
import {
  Toolbar as RACToolbar,
  type ToolbarProps as RACToolbarProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import {
  type ActionGroupAlign,
  ActionTriggerGroupProvider,
  buildActionGroupStyle,
} from '../ActionTrigger/anatomy';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: spacing `gap`. Toolbar is the
// **utility cluster**: a named `role="toolbar"` region whose controls are also
// reachable with the arrow keys (React Aria's `useToolbar` owns that).
// Like `ButtonGroup` and `ToggleButtonGroup` it is a frame-only Structure host
// in the sense §1 "legal vs required" describes — it composes and arranges, it
// paints nothing, so it lawfully reads no `vars.colors.*` and therefore takes no
// `evaluation` prop (§2.3 evidence rule: a prop must be read at runtime to earn
// its place).
//
// This is the reference system's "ActionGroup" (its `ActionButtonGroup`, built on
// the same React Aria `Toolbar`) under the name of the role it actually renders.
// Its chrome was removed in ADR-014: painting an `informational` bar made the
// component measure 80px around 34px controls — a card wrapping controls, which
// then read as bare text inside it.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Toolbar root (Structure entity, utility cluster). */
export const toolbarMeta = {
  displayName: 'Toolbar',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** Where the controls sit along the axis that has free space. */
export type ToolbarAlign = ActionGroupAlign;

/** Props for the Toolbar component. */
export interface ToolbarProps extends Omit<
  RACToolbarProps,
  'style' | 'className' | 'children'
> {
  /**
   * Layout **and** arrow-key axis — the two are one decision here, which is why
   * the prop drives behaviour and not just looks: `horizontal` navigates with
   * Left/Right, `vertical` with Up/Down.
   *
   * Unlike `ButtonGroup`, a toolbar does **not** collapse to a column when it
   * runs out of room: a toolbar that overflows moves its tail into an overflow
   * menu (`ActionMenu`), it does not restack. Columnising a formatting bar would
   * turn a compact strip into a wall.
   *
   * @default 'horizontal'
   */
  orientation?: RACToolbarProps['orientation'];
  /**
   * Where the controls sit along whichever axis has free space: the main axis in
   * a row (`justify-content`), the cross axis in a column (`align-items`). A bar
   * pinned to the end of a header wants `end`.
   *
   * @default 'start'
   */
  align?: ToolbarAlign;
  /** The controls to cluster. */
  children?: React.ReactNode;
}

/**
 * Groups controls that operate on content into a named region with arrow-key
 * navigation — the utility group of the Action family (`role="toolbar"`).
 *
 * Entity = Structure → spacing: `gap.inline.sm`, the same rhythm every group in
 * the family reads. It paints nothing.
 *
 * **Pick by what the set means:**
 *
 * - `Toolbar` — ambient operations *on* content (formatting, view controls,
 *   table actions). Announced as a named region, and the arrow keys walk it, so a
 *   long strip is quick to traverse.
 * - `ButtonGroup` — independent commitments (submit, cancel, delete). No region,
 *   no arrow keys, and the row collapses to a column when space runs out.
 * - `ToggleButtonGroup` — a selectable set (one/many of), where the engaged state
 *   *is* the value.
 *
 * Keyboard, precisely: React Aria adds the arrow keys, and every control remains
 * its own tab stop. APG's toolbar pattern asks for a *single* tab stop, which
 * `useToolbar` does not implement — it cannot manage the tabindex of arbitrary
 * children. Tracked as F-028; do not read this component as a single stop.
 *
 * Mixed controls are welcome: a `Select` for the font, `ToggleButton`s for the
 * styles, a `Separator` between clusters. What makes it a toolbar is the region
 * and its keyboard model, not the kind of control inside.
 *
 * **Chrome is composed, not built in.** Whether a bar has a background depends on
 * the surface it sits on — a bar on the page needs none, a floating one does —
 * so wrap it in a `Surface` when you want chrome (ADR-014).
 *
 * Give it an accessible name: an unnamed region is announced without telling the
 * user what it operates on.
 *
 * @example
 * ```tsx
 * <Toolbar aria-label={formattingLabel}>
 *   <ToggleButton icon={<Icon intent="action.edit" />} aria-label={boldLabel} />
 *   <Separator orientation="vertical" />
 *   <ActionButton icon={<Icon intent="action.search" />} aria-label={findLabel} />
 * </Toolbar>
 *
 * // With chrome, for a bar that floats above content
 * <Surface level="overlay" padding="sm">
 *   <Toolbar aria-label={formattingLabel}>…</Toolbar>
 * </Surface>
 * ```
 */
export const Toolbar = ({
  orientation = 'horizontal',
  align = 'start',
  children,
  ...props
}: ToolbarProps) => {
  return (
    <RACToolbar
      {...props}
      orientation={orientation}
      data-scope="toolbar"
      data-part="root"
      style={buildActionGroupStyle({
        isColumn: orientation === 'vertical',
        align,
      })}
    >
      <ActionTriggerGroupProvider value>{children}</ActionTriggerGroupProvider>
    </RACToolbar>
  );
};
Toolbar.displayName = toolbarMeta.displayName;
