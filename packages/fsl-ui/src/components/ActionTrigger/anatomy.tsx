import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';

import { FOCUS_RING_OFFSET, focusRingOutline } from '../../tokens/focusRing';
import { ICON_SLOT_STYLE } from '../../tokens/iconSlot';
// Type-only import: a trigger must never pull the Icon implementation (and
// with it the whole glyph registry) into a consumer that renders text alone —
// the package's tree-shaking guarantee (README, ADR-006) depends on it. The
// caller passes a real `<Icon>` element; the type keeps the intent vocabulary
// enforced (anything without an `intent` prop fails to compile).
import type { IconProps } from '../Icon';

// ---------------------------------------------------------------------------
// Shared anatomy of an Action trigger and of the containers that group them.
// No value here is exported from the package; `ActionGroupAlign` is, re-exported
// under the per-component names the package uses for prop types
// (`ButtonGroupAlign`, `ToolbarAlign` — the convention `StackAlign`/`GridAlign`
// already follow), so renaming it is a public-API change.
//
// Every Action-entity trigger has the *same* anatomy:
//   root ▸ icon? ▸ label?    (`icon` and `label` are lawful Action roles)
// and the same geometry rules — centred flex row, `hit` floor on both axes,
// square when icon-only, focus ring floated off the edge.
//
// What differs between them is the **silhouette** (radius, type step, insets)
// and the **state cascade** (a toggle maps `isSelected → pressed`, a plain
// trigger does not). So this module owns anatomy + geometry, parameterised by
// silhouette; each component keeps its own colour resolution. Copying the
// geometry into each component instead is how the drift measured in F-022 and
// the icon-only rectangle got in: one shared source, one place to fix.
// ---------------------------------------------------------------------------

/**
 * Where the icon sits relative to the label. Both placements are legal `icon`
 * structural roles on Action — the choice is semantic, not decorative:
 *
 * - `leading` (default) — the glyph *reinforces* the action ("Delete" with a
 *   trash glyph). This is the common case.
 * - `trailing` — the glyph *announces what follows* the press: a disclosure
 *   chevron, an external-link arrow, a "next step" direction. Reach for it
 *   only when the glyph describes the consequence, not the action itself.
 */
export type ActionIconPlacement = 'leading' | 'trailing';

/**
 * Labelling contract for a trigger that can appear *either* labelled or
 * icon-only: it renders a visible label (`children`) or supplies `aria-label`.
 * The union makes `tsc` enforce that — the same mechanism `ConfirmationDialog`
 * uses for its flow-critical labels (ADR-001).
 *
 * A trigger with only one of those forms declares its own label prop instead:
 * `ActionMenu` requires `aria-label` outright, because an overflow trigger has no
 * labelled variant for the union to discriminate.
 */
export type ActionLabellingProps =
  | {
      /** Visible label. */
      children: React.ReactNode;
      /** Accessible name override — optional when a visible label exists. */
      'aria-label'?: string;
    }
  | {
      /** Icon-only trigger — no visible label. */
      children?: undefined;
      /**
       * Accessible name, required when there is no visible label. Supply it
       * already localized (fsl-ui never depends on an i18n runtime — ADR-001).
       */
      'aria-label': string;
    };

/**
 * The token quartet that distinguishes one Action silhouette from another.
 * Values are always `vars.*` references, never literals, so every silhouette
 * follows the active theme — a theme that squares its controls (`bruttal`)
 * squares both silhouettes, and a theme that retunes the command inset moves
 * only the command.
 */
export interface ActionSilhouette {
  /** Corner radius token. */
  radius: string;
  /** Composite text style token (spread into the style object). */
  text: React.CSSProperties;
  /** Block (vertical) padding token. */
  insetBlock: string;
  /** Inline (horizontal) padding token when a label is present. */
  insetInline: string;
}

/**
 * **Command** silhouette — `Button`. The assertive posture: the theme's
 * command radius (a pill in the base theme), semibold command type, and the
 * command-specific block inset that resolves the CTA to 40px on the desktop.
 *
 * It is the deliberate exception to the field row (see `UTILITY_SILHOUETTE`):
 * a command earns its extra 6px and its heavier weight. What it does *not*
 * change is the type size — `text.action.md` and `text.label.md` resolve to the
 * same size and differ in weight alone, so a CTA next to a toolbar control
 * reads as more assertive without the type visibly stepping.
 */
export const COMMAND_SILHOUETTE: ActionSilhouette = {
  radius: vars.radii.action,
  text: vars.text.action.md as React.CSSProperties,
  insetBlock: vars.spacing.inset.action.block,
  insetInline: vars.spacing.inset.control.lg,
};

/**
 * **Utility** silhouette — `ActionButton`, `ToggleButton`. The ambient
 * posture: the generic control radius, plain label type, and the tight control
 * inset. This is the distinction reference-grade systems draw between "commit
 * to this" and "operate on that".
 *
 * Its dimensions are not tuned per component — they are the **field row's**.
 * `sizing.hit` + `inset.control` + `text.label.md` is exactly what `TextField`
 * and `Select` declare, so a utility trigger lands at the same 34px (desktop,
 * base theme) as the field it stands beside in a toolbar or filter bar.
 * Shrinking the utility type on its own would break that alignment; the contrast
 * against a command is carried by height, weight, inset and radius instead. The
 * equality is asserted by the "utility triggers share the field row" contract
 * test — which is the authority, not this comment.
 */
export const UTILITY_SILHOUETTE: ActionSilhouette = {
  radius: vars.radii.control,
  text: vars.text.label.md as React.CSSProperties,
  insetBlock: vars.spacing.inset.control.sm,
  insetInline: vars.spacing.inset.control.md,
};

// ---------------------------------------------------------------------------
// Grouped triggers
//
// The one thing a parent is allowed to impose on a trigger: whether it may
// shrink. A flex item shrinks by default, and a trigger sets an explicit
// `min-width` (the `hit` floor), which *overrides* the automatic minimum size
// — so inside a tight flex row a trigger squashes below its label instead of
// overflowing. `ButtonGroup` needs the opposite: children that hold their
// natural width, so the row's overflow is observable and it can columnise.
//
// Expressed as context rather than injected style because that is this
// ecosystem's pattern (packages consume context; they do not take style props),
// and because it survives wrapping — a trigger inside a `Tooltip` or a
// `DialogTrigger` inside the group still resolves it, which a
// `cloneElement`-over-children approach could not.
//
// The reference system draws the same line: its ActionButton declares
// `flexShrink: { default: 1, isInGroup: 0 }`. Shrinking is disabled *by the
// group*, never globally — a lone trigger in a narrow container should still
// give way rather than overflow the page.
// ---------------------------------------------------------------------------

const ActionTriggerGroupContext = React.createContext(false);

/**
 * Marks its subtree as living inside an Action-trigger group. Internal, and
 * provided by any container that groups triggers — deliberately not a list here,
 * because membership grew while this file was being written and a comment cannot
 * be told when it grows again. The authority is
 * `grep -rl ActionTriggerGroupProvider src/`.
 */
export const ActionTriggerGroupProvider = ActionTriggerGroupContext.Provider;

/** Whether the calling trigger is rendered inside an Action-trigger group. */
export const useIsGroupedActionTrigger = (): boolean => {
  return React.useContext(ActionTriggerGroupContext);
};

// ---------------------------------------------------------------------------
// Shared anatomy of a *group* of Action triggers
//
// `ButtonGroup` (command row), `Toolbar` (utility cluster, arrow-key region) and
// `ToggleButtonGroup` (selectable set) are three different identities, but their
// arrangement is one decision, made here: the separation between sibling actions
// (`gap.inline.sm`), the axis, and where the set sits along the axis that has
// free space. Copying that into each container is how the same three lines drift
// apart — the lesson ADR-013 recorded for the triggers themselves.
//
// Chrome is deliberately absent: none of the three paints. A cluster that needs
// a bar composes one (`Surface` + the group), because whether a toolbar has
// chrome depends on the surface it sits on, not on the toolbar. `Toolbar` used to
// paint its own `informational` bar and it measured 80px tall around 34px
// controls — a card wrapping controls that then read as bare text (ADR-014).
// ---------------------------------------------------------------------------

/** Where a group's actions sit along the axis that has free space. */
export type ActionGroupAlign = 'start' | 'center' | 'end';

const GROUP_ALIGN: Record<ActionGroupAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
};

/**
 * Arrangement shared by the group containers that opt into it. `DialogActions`
 * is the standing exception: it predates this builder, reorders its children by
 * `composition` per platform, and uses the wider `gap.inline.md` — so the action
 * row currently has two rhythms, which is a real inconsistency and not a bug in
 * either place.
 *
 * `align` acts on whichever axis has free space — the main axis in a row
 * (`justify-content`), the cross axis in a column (`align-items`) — so the prop
 * means the same thing in both orientations.
 *
 * `isInline` is the one genuine difference between the containers: a command row
 * and a toolbar are **bands** across their container (block-level, so `align`
 * has space to distribute), while a segmented control is an **inline object**
 * sized by its content.
 */
export const buildActionGroupStyle = ({
  isColumn,
  align,
  isInline,
}: {
  isColumn: boolean;
  align: ActionGroupAlign;
  isInline?: boolean;
}): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: isInline ? 'inline-flex' : 'flex',
    flexDirection: isColumn ? 'column' : 'row',
    gap: vars.spacing.gap.inline.sm,
    alignItems: isColumn ? GROUP_ALIGN[align] : 'center',
    justifyContent: isColumn ? 'flex-start' : GROUP_ALIGN[align],
    flexWrap: 'nowrap',
  } as React.CSSProperties;
};

/** Resolved colour leaves a trigger paints, whatever cascade produced them. */
export interface ActionTriggerColors {
  background?: string;
  border?: string;
  text?: string;
}

/**
 * Geometry + resolved colours for a trigger root. Colour *resolution* stays
 * with the component (a toggle reads `pressed`, a plain trigger does not);
 * this owns everything that must be identical across triggers.
 */
export const buildActionTriggerStyle = ({
  silhouette,
  colors,
  hasIcon,
  isIconOnly,
  isDisabled,
  isFocusVisible,
  isGrouped,
}: {
  silhouette: ActionSilhouette;
  colors: ActionTriggerColors;
  hasIcon: boolean;
  isIconOnly: boolean;
  isDisabled?: boolean;
  isFocusVisible?: boolean;
  /** @see useIsGroupedActionTrigger */
  isGrouped?: boolean;
}): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hasIcon ? vars.spacing.gap.inline.xs : undefined,
    // Inside a group the trigger holds its natural width; on its own it stays
    // a normal flex item.
    flexShrink: isGrouped ? 0 : undefined,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    borderRadius: silhouette.radius,
    borderWidth: vars.border.outline.control.width,
    borderStyle: vars.border.outline.control.style,
    // `hit` is the ergonomic floor on BOTH axes: it drives the height and
    // supplies a square minimum, so a one-character trigger stays balanced
    // instead of collapsing to its content width.
    minHeight: vars.sizing.hit,
    minWidth: vars.sizing.hit,
    // Icon-only mirrors the block inset on the inline axis and pairs it with a
    // square glyph slot, so the box comes out square *by arithmetic* — same
    // padding, same content extent on both axes. Deriving it from
    // `aspect-ratio` instead lets the shrink-to-fit width win, which squeezes
    // the vertical inset and breaks height parity with a labelled trigger.
    paddingBlock: silhouette.insetBlock,
    paddingInline: isIconOnly ? silhouette.insetBlock : silhouette.insetInline,
    ...silhouette.text,
    transitionDuration: vars.motion.feedback.duration,
    transitionTimingFunction: vars.motion.feedback.easing,
    transitionProperty: 'background-color, border-color, color',
    backgroundColor: colors.background,
    borderColor: colors.border,
    color: colors.text,
    outline: focusRingOutline(isFocusVisible),
    outlineOffset: FOCUS_RING_OFFSET,
  } as React.CSSProperties;
};

/**
 * Ordered content of a trigger: the glyph on its declared side, the label when
 * there is one. Keeps the placement branching — and the glyph slot's sizing
 * rules — in one place for every trigger.
 */
export const ActionTriggerContent = ({
  dataScope,
  icon,
  iconPlacement,
  children,
}: {
  dataScope: string;
  icon?: React.ReactElement<IconProps>;
  iconPlacement: ActionIconPlacement;
  children?: React.ReactNode;
}) => {
  const isIconOnly = icon !== undefined && children === undefined;

  // One line tall (`1lh`), so the glyph occupies exactly the box a label line
  // would: that is what gives the icon-only form the same height as a labelled
  // trigger, keeping a single baseline in a toolbar that mixes both. Icon-only
  // squares the slot as well, so the two axes have identical content extent.
  // Where `lh` is unsupported the slot falls back to the glyph's own size —
  // still square, just a few px smaller.
  const glyphSlotStyle: React.CSSProperties = {
    ...ICON_SLOT_STYLE,
    blockSize: '1lh',
    ...(isIconOnly ? { inlineSize: '1lh' } : {}),
  };

  // The trigger owns the glyph scale (`text`, i.e. 1em): the glyph tracks the
  // label's size and its ink lands inside the cap-height band (F-022).
  // Everything else the caller set on the element — the intent, and `label`
  // when the glyph carries meaning — is preserved.
  const glyph = icon ? (
    <span
      data-scope={dataScope}
      data-part="icon"
      aria-hidden
      style={glyphSlotStyle}
    >
      {React.cloneElement(icon, { size: 'text' })}
    </span>
  ) : null;

  return (
    <>
      {iconPlacement === 'leading' && glyph}
      {children !== undefined && (
        <span data-scope={dataScope} data-part="label">
          {children}
        </span>
      )}
      {iconPlacement === 'trailing' && glyph}
    </>
  );
};
