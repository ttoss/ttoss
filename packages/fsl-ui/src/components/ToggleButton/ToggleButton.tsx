import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  ToggleButton as RACToggleButton,
  type ToggleButtonProps as RACToggleButtonProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import {
  type ActionIconPlacement,
  type ActionLabellingProps,
  ActionTriggerContent,
  buildActionTriggerStyle,
  useIsGroupedActionTrigger,
  UTILITY_SILHOUETTE,
} from '../ActionTrigger/anatomy';
import type { IconProps } from '../Icon';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Action → CONTRACT.md §1 row (colors `action`, border
// `outline.control`, sizing `hit`, motion `feedback`), in the **utility**
// silhouette it shares with `ActionButton` (radii `control`, typography
// `label.md`, spacing `inset.control`): a toolbar toggle is an ambient
// operation on content, not a command the user commits to, so it must not
// wear the command silhouette `Button` uses.
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

/** Where the icon sits relative to the label. @see ActionIconPlacement */
export type ToggleButtonIconPlacement = ActionIconPlacement;

/** ToggleButton props *except* the labelling contract. */
export interface ToggleButtonOwnProps extends Omit<
  RACToggleButtonProps,
  'style' | 'children' | 'aria-label'
> {
  /**
   * Semantic emphasis. `secondary` is the default — a toolbar toggle is
   * ambient chrome; `muted` gives the quiet posture (no fill until hovered).
   * @default 'secondary'
   */
  evaluation?: EvaluationsFor<(typeof toggleButtonMeta)['entity']>;
  /**
   * An `<Icon>` element naming the glyph by intent. Omit `children` for the
   * **icon-only** form — the dominant shape for a toolbar toggle ("Bold",
   * "Grid view"): the button becomes a square and `aria-label` becomes
   * required by the type system.
   */
  icon?: React.ReactElement<IconProps>;
  /**
   * Which side of the label the `icon` sits on.
   * @default 'leading'
   */
  iconPlacement?: ToggleButtonIconPlacement;
  /**
   * Data scope identifier.
   * @default 'toggle-button'
   */
  'data-scope'?: string;
}

/** @see ToggleButtonOwnProps */
export type ToggleButtonProps = ToggleButtonOwnProps & ActionLabellingProps;

/**
 * A two-state toggle button (Action entity). Unlike `Button`, its selection
 * is persistent: the engaged state renders the `pressed` color (not the
 * transient `active`), and React Aria exposes it via `aria-pressed`.
 *
 * Use for toolbar toggles ("Bold", "Italic") and single on/off controls that
 * read as buttons. It wears the **utility** silhouette it shares with
 * `ActionButton` — a toggle operates on content, it is not a command the user
 * commits to. For a set of mutually-related toggles, wrap them in
 * `ToggleButtonGroup`.
 *
 * Anatomy (`data-part`): `root` · `icon` · `label`. Omit `children` for the
 * icon-only square, which is the common toolbar shape.
 *
 * @example
 * ```tsx
 * <ToggleButton>Bold</ToggleButton>
 * <ToggleButton defaultSelected>Grid view</ToggleButton>
 * <ToggleButton icon={<Icon intent="action.search" />} aria-label={label} />
 * ```
 */
export const ToggleButton = ({
  evaluation = 'secondary',
  icon,
  iconPlacement = 'leading',
  children,
  'data-scope': dataScope = 'toggle-button',
  ...props
}: ToggleButtonProps) => {
  const colors = vars.colors.action[evaluation];
  const hasIcon = icon !== undefined;
  const isIconOnly = hasIcon && children === undefined;
  const isGrouped = useIsGroupedActionTrigger();

  return (
    <RACToggleButton
      {...props}
      data-scope={dataScope}
      data-part="root"
      data-evaluation={evaluation}
      data-icon-placement={hasIcon ? iconPlacement : undefined}
      style={({
        isHovered,
        isPressed,
        isSelected,
        isDisabled,
        isFocusVisible,
      }) => {
        const flags = { isHovered, isPressed, isSelected, isDisabled };
        return buildActionTriggerStyle({
          silhouette: UTILITY_SILHOUETTE,
          hasIcon,
          isIconOnly,
          isDisabled,
          isFocusVisible,
          isGrouped,
          colors: {
            background: colors?.background
              ? resolveToggleBackground(colors.background, flags)
              : undefined,
            border: colors?.border
              ? resolveToggleBorder(colors.border, {
                  isFocusVisible,
                  isDisabled,
                  isSelected,
                })
              : undefined,
            text: colors?.text
              ? resolveToggleText(colors.text, flags)
              : undefined,
          },
        });
      }}
    >
      <ActionTriggerContent
        dataScope={dataScope}
        icon={icon}
        iconPlacement={iconPlacement}
      >
        {children}
      </ActionTriggerContent>
    </RACToggleButton>
  );
};
ToggleButton.displayName = toggleButtonMeta.displayName;
