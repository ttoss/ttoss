import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from 'react-aria-components';

import type {
  ComponentMeta,
  CompositionsFor,
  ConsequencesFor,
  EvaluationsFor,
} from '../../semantics';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import {
  type ActionIconPlacement,
  type ActionLabellingProps,
  ActionTriggerContent,
  buildActionTriggerStyle,
  UTILITY_SILHOUETTE,
} from '../ActionTrigger/anatomy';
import type { IconProps } from '../Icon';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Action → CONTRACT.md §1 row: colors `action`, border
// `outline.control`, sizing `hit`, motion `feedback`, elevation `flat`.
// Within that row it takes the **utility** silhouette (radii `control`,
// typography `label.md`, spacing `inset.control`) rather than the command one
// `Button` wears — see the JSDoc for why that is a semantic choice and not a
// size variant.
// ---------------------------------------------------------------------------

/** Formal semantic identity — ActionButton root (Action entity). */
export const actionButtonMeta = {
  displayName: 'ActionButton',
  entity: 'Action',
  structure: 'root',
} as const satisfies ComponentMeta<'Action'>;

/** Where the icon sits relative to the label. @see ActionIconPlacement */
export type ActionButtonIconPlacement = ActionIconPlacement;

/** ActionButton props *except* the labelling contract. */
export interface ActionButtonOwnProps extends Omit<
  RACButtonProps,
  'style' | 'children' | 'aria-label'
> {
  /**
   * Semantic emphasis. `secondary` is the default: an ambient operation
   * announces itself with a quiet fill, not with the authority of a command.
   *
   * Use `muted` for the **quiet** posture — a toolbar control that shows no
   * fill until hovered. Use `negative` for a destructive row action; pair it
   * with `consequence="destructive"` so a confirm wrapper can dispatch on it.
   * @default 'secondary'
   */
  evaluation?: EvaluationsFor<(typeof actionButtonMeta)['entity']>;
  /**
   * Effect on state this action produces. Emitted as `data-consequence` for
   * host integrations and tests; never used for coloring (that is
   * `evaluation`).
   * @default 'neutral'
   */
  consequence?: ConsequencesFor<(typeof actionButtonMeta)['entity']>;
  /**
   * Slot this action occupies inside a parent composite (FSL §4). Emitted as
   * `data-composition`.
   */
  composition?: CompositionsFor<(typeof actionButtonMeta)['entity']>;
  /**
   * An `<Icon>` element naming the glyph by intent. The button forces the
   * `text` size step, so the glyph tracks the label and its ink lands inside
   * the cap-height band.
   *
   * Omit `children` for the **icon-only** form — the dominant shape for a
   * toolbar control: the button becomes a square at the utility height and
   * `aria-label` becomes required by the type system.
   *
   * @example
   * ```tsx
   * <ActionButton icon={<Icon intent="action.close" />} aria-label={removeLabel} />
   * ```
   */
  icon?: React.ReactElement<IconProps>;
  /**
   * Which side of the label the `icon` sits on.
   * @default 'leading'
   */
  iconPlacement?: ActionButtonIconPlacement;
  /**
   * Data scope identifier.
   * @default 'action-button'
   */
  'data-scope'?: string;
}

/**
 * Displays a semantic action trigger (entity: Action) in the **utility**
 * silhouette — the ambient posture, for operations *on* content rather than
 * commitments in a flow: toolbar controls, table-row actions, the trigger of
 * an overflow menu, a card's inline "edit".
 *
 * `ActionButton` and `Button` are both Action/root and read the same colour
 * tree; what separates them is the weight of the commitment, exactly as
 * `Meter` and `ProgressBar` are both Feedback/root separated by meaning. That
 * makes the pair a semantic distinction rather than a size variant, which is
 * why neither carries a `size` prop (CONTRACT §4):
 *
 * - **Command** (`Button`) — "commit to this": submit, confirm, the primary
 *   action of a surface. Wears the theme's command radius, semibold type and
 *   the generous command inset (~40px on the desktop).
 * - **Utility** (`ActionButton`) — "operate on that": ambient, repeatable,
 *   often icon-only. Wears the control radius, plain label type and the tight
 *   control inset (~32px), so it recedes beside a command.
 *
 * Entity = Action → colors: `action`, radii: `control`, border:
 * `outline.control`, sizing: `hit` (floor on both axes), spacing:
 * `inset.control` (`sm` block / `md` inline) plus `gap.inline.xs` between
 * glyph and label, typography: `label.md`, motion: `feedback`.
 *
 * Anatomy (`data-part`): `root` · `icon` · `label`.
 *
 * @example
 * ```tsx
 * // Toolbar: icon-only is the common shape
 * <ActionButton icon={<Icon intent="action.search" />} aria-label={searchLabel} />
 *
 * // Row action, quiet until hovered
 * <ActionButton evaluation="muted" icon={<Icon intent="action.close" />}>
 *   Remove
 * </ActionButton>
 * ```
 */
export type ActionButtonProps = ActionButtonOwnProps & ActionLabellingProps;

/**
 * A semantic utility action button built on React Aria.
 */
export const ActionButton = ({
  evaluation = 'secondary',
  consequence = 'neutral',
  composition,
  icon,
  iconPlacement = 'leading',
  children,
  'data-scope': dataScope = 'action-button',
  ...props
}: ActionButtonProps) => {
  const colors = vars.colors.action[evaluation];
  const hasIcon = icon !== undefined;
  const isIconOnly = hasIcon && children === undefined;

  return (
    <RACButton
      {...props}
      data-scope={dataScope}
      data-part="root"
      data-evaluation={evaluation}
      data-consequence={consequence}
      data-composition={composition}
      data-icon-placement={hasIcon ? iconPlacement : undefined}
      style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => {
        return buildActionTriggerStyle({
          silhouette: UTILITY_SILHOUETTE,
          hasIcon,
          isIconOnly,
          isDisabled,
          isFocusVisible,
          colors: {
            background: resolveInteractiveStyle(colors?.background, {
              isHovered,
              isPressed,
              isDisabled,
            }),
            border: resolveInteractiveStyle(colors?.border, {
              isDisabled,
              isFocusVisible,
            }),
            text:
              resolveInteractiveStyle(colors?.text, {
                isHovered,
                isPressed,
                isDisabled,
              }) ?? colors?.text?.default,
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
    </RACButton>
  );
};
ActionButton.displayName = actionButtonMeta.displayName;
