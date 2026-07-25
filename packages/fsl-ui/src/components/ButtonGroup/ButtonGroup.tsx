import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';

import type { ComponentMeta } from '../../semantics';
import { ActionTriggerGroupProvider } from '../ActionTrigger/anatomy';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: spacing `gap`. ButtonGroup is a
// frame-only Structure host in the sense §1 "legal vs required" describes: it
// composes children and lays them out but paints nothing, so it lawfully reads
// no `vars.colors.*` — only the gap token. Because it evaluates no colour, it
// takes no `evaluation` prop either (§2.3 evidence rule: a prop must be read at
// runtime to earn its place) — the same reasoning `ToggleButtonGroup` follows.
//
// Why it exists next to `Stack`, `Toolbar` and `DialogActions`:
//   - `Stack` is the generic rhythm primitive — the caller picks the gap, so
//     every action row in a product can pick a different one.
//   - `Toolbar` is `role="toolbar"` with roving focus: one tab stop for the
//     whole bar. Correct for a formatting bar, wrong for a Save/Cancel pair,
//     where each command must be its own tab stop.
//   - `DialogActions` is dialog-scoped and reorders by `composition` per
//     platform; it throws outside a `<Dialog>`.
// What is left over — the action row of a form, a page header, a card, a wizard
// footer — is this component: one fixed rhythm for every action row in the
// product, plus the overflow behaviour below.
// ---------------------------------------------------------------------------

/** Formal semantic identity — ButtonGroup root (Structure entity). */
export const buttonGroupMeta = {
  displayName: 'ButtonGroup',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** Axis the group lays its actions along. */
export type ButtonGroupOrientation = 'horizontal' | 'vertical';

/** Where the actions sit along the axis that has free space. */
export type ButtonGroupAlign = 'start' | 'center' | 'end';

const ALIGN: Record<ButtonGroupAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
};

/**
 * Whether any child sticks out of the group's own box.
 *
 * The group is `position: relative`, which makes it the offset parent of its
 * children — that is what lets `offsetLeft` be read as a position *within the
 * group*. A negative offset catches `align="end"` (children pushed off the
 * start edge); an offset past the width catches `align="start"`. The 1px
 * tolerance absorbs sub-pixel layout rounding.
 *
 * Reliable only because grouped triggers do not shrink (see
 * `ActionTriggerGroupProvider`): a shrinking child would squash its label
 * instead of overflowing, and the row would look like it fits when it does not.
 */
const hasOverflowingChild = (root: HTMLElement): boolean => {
  const maxInlineEnd = root.offsetWidth + 1;

  return Array.from(root.children).some((node) => {
    const child = node as HTMLElement;
    return (
      child.offsetLeft < 0 ||
      child.offsetLeft + child.offsetWidth > maxInlineEnd
    );
  });
};

/**
 * Layout measurement must land before paint, or the group flashes as a row
 * before collapsing. On a server there is no layout to read and
 * `useLayoutEffect` warns, so the effect degrades to `useEffect` — the
 * measurement then simply runs on hydration.
 */
const useMeasurementEffect =
  typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/** Props for the ButtonGroup component. */
export interface ButtonGroupProps extends Omit<
  React.HTMLAttributes<HTMLDivElement>,
  'style' | 'className'
> {
  /**
   * Axis the actions are laid along.
   *
   * `horizontal` (default) is adaptive: when the row does not fit its
   * container the group lays the actions out in a column instead, so a pair of
   * commands stays readable and tappable in a narrow context rather than
   * clipping. `vertical` is a fixed column — it opts out of the measurement
   * entirely, which is also the escape hatch when you want the axis pinned.
   *
   * The axis actually rendered is published as `data-orientation`, and
   * `data-collapsed="true"` marks a horizontal request that had to give way.
   *
   * @default 'horizontal'
   */
  orientation?: ButtonGroupOrientation;
  /**
   * Where the actions sit along whichever axis has free space: the main axis
   * in a row (`justify-content`), the cross axis in a column
   * (`align-items`). A form footer typically wants `end`; a page header's
   * action cluster wants `start`.
   *
   * @default 'start'
   */
  align?: ButtonGroupAlign;
  /** The related actions — `Button`, `ActionButton` or `ToggleButton`. */
  children?: React.ReactNode;
}

/**
 * Lays out a set of related actions with one rhythm, and collapses the row to a
 * column when it no longer fits.
 *
 * Entity = Structure → spacing: `gap.inline.sm` between siblings. It paints
 * nothing and takes no colour: the actions carry the emphasis, the group
 * carries only the arrangement.
 *
 * **The gap is not a prop, deliberately.** `Stack` already offers a caller-picked
 * gap; if this component took one too it would be a Stack preset. Its reason to
 * exist is that the separation between sibling actions is *one* decision for the
 * whole product, made by the theme — so every action row in every surface shares
 * a rhythm. Both axes read the same token: a row that columnised because space
 * ran out is still the same set of actions, not a new stacking rhythm, so the
 * spacing does not change with the axis (this is the one place a Structure
 * component deliberately does not follow `Stack`'s inline/stack split).
 *
 * **What the group imposes on its children.** Exactly one thing: grouped
 * triggers stop shrinking. A trigger sets an explicit `min-width` (the `hit`
 * floor), which overrides a flex item's automatic minimum size, so in a tight
 * row it would squash below its own label. Holding the natural width is what
 * makes the overflow real and therefore measurable. Delivered by context, so it
 * reaches a `Button` wrapped in a `Tooltip` or a `DialogTrigger` too.
 *
 * **Keyboard.** Every action stays its own tab stop. Reach for `Toolbar` when
 * the set *should* behave as one stop with arrow-key navigation (a formatting
 * bar); reach for this when each action is an independent commitment.
 *
 * No `role` is emitted: an unnamed `role="group"` adds screen-reader noise
 * without adding meaning. Pass `role`/`aria-label` yourself when the cluster is
 * genuinely a named region, or use `Group` for a labelled, painted frame.
 *
 * @example
 * ```tsx
 * // Form footer: the pair pushes to the end, columnises when space runs out
 * <ButtonGroup align="end">
 *   <Button evaluation="secondary">Cancel</Button>
 *   <Button evaluation="primary">Save changes</Button>
 * </ButtonGroup>
 *
 * // Fixed column — no measurement
 * <ButtonGroup orientation="vertical">
 *   <Button>Duplicate</Button>
 *   <Button evaluation="negative" consequence="destructive">Delete</Button>
 * </ButtonGroup>
 * ```
 */
/** No verdict yet — distinct from any possible `children` value. */
const UNMEASURED = Symbol('unmeasured');

/**
 * Resolves whether an adaptive row has to become a column.
 *
 * The state is a **verdict keyed by what it answered about** — the `children`
 * identity — rather than a flag. Whenever the key does not match the current
 * children the group is *unsettled* and renders as a row, which is precisely
 * what gives the measurement a row to measure: a collapsed column cannot report
 * whether the row would fit, since its own width is the widest child rather than
 * the space available. Settling stores the new key, and a fresh `children`
 * identity (i.e. the parent re-rendered) invalidates it again — with no effect
 * needed to notice, and no way for the group's own updates to loop.
 *
 * The obvious shape — an `isMeasuring` boolean beside a `hasOverflow` boolean —
 * is broken: an invalidation arriving in the same flush as the previous settle
 * sets one atom `false` then `true`, React sees no net change, skips the
 * re-render, and the machine sticks in "measuring" forever, so the group never
 * collapses. A key that is only ever *replaced* cannot cancel itself out.
 */
const useAdaptiveColumn = ({
  isAdaptive,
  children,
  rootRef,
}: {
  isAdaptive: boolean;
  children: React.ReactNode;
  rootRef: React.RefObject<HTMLDivElement | null>;
}): boolean => {
  const [verdict, setVerdict] = React.useState<{
    key: unknown;
    isColumn: boolean;
  }>({ key: UNMEASURED, isColumn: false });

  const isSettled = verdict.key === children;

  const invalidate = React.useCallback(() => {
    setVerdict((previous) => {
      return previous.key === UNMEASURED
        ? previous
        : { key: UNMEASURED, isColumn: false };
    });
  }, []);

  // The group's own size does not change when its container does, so the
  // container is what has to be watched.
  useMeasurementEffect(() => {
    const container = rootRef.current?.parentElement;
    if (!isAdaptive || !container || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(invalidate);
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [isAdaptive, invalidate, rootRef]);

  // Reading layout and storing the answer is what a layout effect is for: this
  // synchronises React with an external system (the box model) that no render
  // can compute.
  useMeasurementEffect(() => {
    if (isSettled || !isAdaptive || rootRef.current === null) return;

    setVerdict({
      key: children,
      isColumn: hasOverflowingChild(rootRef.current),
    });
  }, [children, isAdaptive, isSettled, rootRef]);

  return isAdaptive && isSettled && verdict.isColumn;
};

export const ButtonGroup = ({
  orientation = 'horizontal',
  align = 'start',
  children,
  ...props
}: ButtonGroupProps) => {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const isAdaptive = orientation === 'horizontal';
  const hasCollapsed = useAdaptiveColumn({ isAdaptive, children, rootRef });
  const isColumn = hasCollapsed || !isAdaptive;
  const resolvedOrientation: ButtonGroupOrientation = isColumn
    ? 'vertical'
    : 'horizontal';

  return (
    <div
      {...props}
      ref={rootRef}
      data-scope="button-group"
      data-part="root"
      data-orientation={resolvedOrientation}
      data-collapsed={hasCollapsed ? 'true' : undefined}
      style={
        {
          boxSizing: 'border-box',
          // Block-level: an action row is a band across its container, which is
          // what gives `align` free space to work with. `position: relative`
          // makes the group its children's offset parent — the measurement
          // depends on it.
          display: 'flex',
          position: 'relative',
          maxInlineSize: '100%',
          flexDirection: isColumn ? 'column' : 'row',
          gap: vars.spacing.gap.inline.sm,
          alignItems: isColumn ? ALIGN[align] : 'center',
          justifyContent: isColumn ? 'flex-start' : ALIGN[align],
          flexWrap: 'nowrap',
        } as React.CSSProperties
      }
    >
      <ActionTriggerGroupProvider value>{children}</ActionTriggerGroupProvider>
    </div>
  );
};
ButtonGroup.displayName = buttonGroupMeta.displayName;
