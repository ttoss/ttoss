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
// Shared anatomy of an Action trigger — internal, never exported from the
// package.
//
// Every Action-entity trigger (`Button`, `ActionButton`, `ToggleButton`, and
// the ActionMenu/ActionGroup triggers that follow) has the *same* anatomy:
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
 * Labelling contract shared by every Action trigger. A trigger must be
 * nameable: either it renders a visible label (`children`) or — in the
 * icon-only form — it supplies `aria-label`. The union makes `tsc` enforce it,
 * the same mechanism `ConfirmationDialog` uses for its flow-critical labels
 * (ADR-001).
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
 * `sizing.hit` + `inset.control` + `text.label.md` is exactly what `TextField`,
 * `Select` and every other control declare, so a utility trigger lands at the
 * same 34px (desktop, base theme) as the field it stands beside in a toolbar or
 * filter bar. Shrinking the utility type on its own would break that alignment;
 * the contrast against a command is carried by height, weight, inset and
 * radius instead. Enforced by the "utility triggers share the field row"
 * contract test.
 */
export const UTILITY_SILHOUETTE: ActionSilhouette = {
  radius: vars.radii.control,
  text: vars.text.label.md as React.CSSProperties,
  insetBlock: vars.spacing.inset.control.sm,
  insetInline: vars.spacing.inset.control.md,
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
}: {
  silhouette: ActionSilhouette;
  colors: ActionTriggerColors;
  hasIcon: boolean;
  isIconOnly: boolean;
  isDisabled?: boolean;
  isFocusVisible?: boolean;
}): React.CSSProperties => {
  return {
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: hasIcon ? vars.spacing.gap.inline.xs : undefined,
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
