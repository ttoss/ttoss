import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  ToggleButton as RACToggleButton,
  type ToggleButtonProps as RACToggleButtonProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Action → CONTRACT.md §1 row (colors `action`, radii `control`,
// border `outline.control`, sizing `hit.base`, spacing `inset.control`,
// typography `label.md`, motion `feedback`).
//
// FRICTION LOG (ROADMAP B2 "proof case for `pressed` ≠ `active`):
// ToggleButton is the component that proves the Action token tree needs BOTH
// `active` (transient pointer-down) and `pressed` (persistent toggle-on)
// state colors. React Aria exposes the persistent state as `isSelected`; the
// shared `resolveInteractiveStyle` cascade maps `isSelected → checked` (the
// Selection semantics) and does not model `pressed` at all. Rather than bend
// the global STATE_PRIORITY tuple (entity-specific flag→state mapping does
// not belong in one shared cascade), ToggleButton resolves its colors inline
// and maps `isSelected → pressed`. No taxonomy change was required —
// `pressed` already exists in STATES and in the Action color tree
// (`vars.colors.action.*.*.pressed`, FSL Lexicon §7). This is a documented,
// intentional divergence from the helper, not a workaround.
// ---------------------------------------------------------------------------

/** Formal semantic identity — ToggleButton root (Action entity, toggle). */
export const toggleButtonMeta = {
  displayName: 'ToggleButton',
  entity: 'Action',
  structure: 'root',
} as const satisfies ComponentMeta<'Action'>;

type ActionColors = typeof vars.colors.action.primary;

/** Flags the toggle cascade reads. */
type ToggleFlags = {
  isHovered?: boolean;
  isPressed?: boolean;
  isSelected?: boolean;
  isDisabled?: boolean;
};

/**
 * Background cascade: disabled ▸ transient press (`active`) ▸ persistent
 * toggle (`pressed`) ▸ hover ▸ default. The `active` level dominates
 * `pressed` so a click on an engaged toggle still gives press feedback.
 */
const resolveToggleBackground = (
  bg: NonNullable<ActionColors['background']>,
  { isDisabled, isPressed, isSelected, isHovered }: ToggleFlags
): string | undefined => {
  if (isDisabled) return bg.disabled;
  if (isPressed) return bg.active;
  if (isSelected) return bg.pressed;
  if (isHovered) return bg.hover;
  return bg.default;
};

/** Text cascade — same order, with `?? default` since not every voice defines every state. */
const resolveToggleText = (
  text: NonNullable<ActionColors['text']>,
  { isDisabled, isPressed, isSelected, isHovered }: ToggleFlags
): string | undefined => {
  if (isDisabled) return text.disabled;
  if (isPressed) return text.active ?? text.default;
  if (isSelected) return text.pressed ?? text.default;
  if (isHovered) return text.hover ?? text.default;
  return text.default;
};

/** Border cascade: focus ring wins ▸ disabled ▸ toggle-on ▸ default. */
const resolveToggleBorder = (
  border: NonNullable<ActionColors['border']>,
  {
    isFocusVisible,
    isDisabled,
    isSelected,
  }: Pick<ToggleFlags, 'isDisabled' | 'isSelected'> & {
    isFocusVisible?: boolean;
  }
): string | undefined => {
  if (isFocusVisible) return border.focused;
  if (isDisabled) return border.disabled;
  if (isSelected) return border.pressed ?? border.default;
  return border.default;
};

/** Props for the ToggleButton component. */
export interface ToggleButtonProps extends Omit<RACToggleButtonProps, 'style'> {
  /**
   * Semantic emphasis.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof toggleButtonMeta)['entity']>;
}

/**
 * A two-state toggle button (Action entity). Unlike `Button`, its selection
 * is persistent: the engaged state renders the `pressed` color (not the
 * transient `active`), and React Aria exposes it via `aria-pressed`.
 *
 * Use for toolbar toggles ("Bold", "Italic") and single on/off controls that
 * read as buttons. For a set of mutually-related toggles, wrap them in
 * `ToggleButtonGroup`.
 *
 * @example
 * ```tsx
 * <ToggleButton>Bold</ToggleButton>
 * <ToggleButton defaultSelected>Grid view</ToggleButton>
 * ```
 */
export const ToggleButton = ({
  evaluation = 'primary',
  ...props
}: ToggleButtonProps) => {
  const colors = vars.colors.action[evaluation];

  return (
    <RACToggleButton
      {...props}
      data-scope="toggle-button"
      data-part="root"
      data-evaluation={evaluation}
      style={({
        isHovered,
        isPressed,
        isSelected,
        isDisabled,
        isFocusVisible,
      }) => {
        const flags = { isHovered, isPressed, isSelected, isDisabled };
        return {
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          borderRadius: vars.radii.control,
          borderWidth: vars.border.outline.control.width,
          borderStyle: vars.border.outline.control.style,
          minHeight: vars.sizing.hit.base,
          paddingBlock: vars.spacing.inset.control.sm,
          paddingInline: vars.spacing.inset.control.lg,
          ...(vars.text.label.md as React.CSSProperties),
          transitionDuration: vars.motion.feedback.duration,
          transitionTimingFunction: vars.motion.feedback.easing,
          transitionProperty: 'background-color, border-color, color',
          backgroundColor: colors?.background
            ? resolveToggleBackground(colors.background, flags)
            : undefined,
          borderColor: colors?.border
            ? resolveToggleBorder(colors.border, {
                isFocusVisible,
                isDisabled,
                isSelected,
              })
            : undefined,
          color: colors?.text
            ? resolveToggleText(colors.text, flags)
            : undefined,
          outline: focusRingOutline(isFocusVisible),
        } as React.CSSProperties;
      }}
    />
  );
};
ToggleButton.displayName = toggleButtonMeta.displayName;
