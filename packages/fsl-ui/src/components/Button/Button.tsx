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
import { resolveConsequenceInk } from '../../tokens/consequenceInk';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import { resolveSurfaceBoundStyle } from '../../tokens/surfaceScope';
import {
  type ActionIconPlacement,
  type ActionLabellingProps,
  ActionTriggerContent,
  buildActionTriggerStyle,
  COMMAND_SILHOUETTE,
  useIsGroupedActionTrigger,
} from '../ActionTrigger/anatomy';
import type { IconProps } from '../Icon';

/**
 * Formal semantic identity — what this component *is* (Layer 1).
 */
export const buttonMeta = {
  displayName: 'Button',
  entity: 'Action',
  structure: 'root',
} as const satisfies ComponentMeta<'Action'>;

/** Where the icon sits relative to the label. @see ActionIconPlacement */
export type ButtonIconPlacement = ActionIconPlacement;

/**
 * Button props *except* the labelling contract — the reusable half.
 *
 * Composites that always render a visible label (e.g. `FormSubmit`) extend
 * this and declare `children` themselves, instead of carrying the
 * icon-only branch of `ButtonProps` they can never take.
 */
export interface ButtonOwnProps extends Omit<
  RACButtonProps,
  'style' | 'children' | 'aria-label'
> {
  /**
   * Semantic emphasis.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof buttonMeta)['entity']>;
  /**
   * Effect on state this button's action produces. Emitted as
   * `data-consequence` on the DOM so host integrations (confirm wrappers,
   * telemetry, undo/redo hooks) and tests can observe the contract.
   *
   * Carries colour in exactly one case: `destructive` on the **quiet** rung
   * (`evaluation="muted"`) tints the ink, because a part that paints no fill
   * has nowhere else to say it — see {@link resolveConsequenceInk}. On every
   * filled rung the fill is the voice and `evaluation` owns it.
   *
   * @default 'neutral'
   */
  consequence?: ConsequencesFor<(typeof buttonMeta)['entity']>;
  /**
   * Slot this button occupies inside a parent composite (FSL §4).
   * Emitted as `data-composition` on the DOM and consumed at runtime by
   * composites that need to reorder or style actions by role — notably
   * `DialogActions`, which reorders children per platform convention
   * (iOS vs Windows).
   *
   * Orthogonal to `evaluation` (authorial voice) and `consequence`
   * (effect on state): composition is purely *positional* semantics.
   */
  composition?: CompositionsFor<(typeof buttonMeta)['entity']>;
  /**
   * An `<Icon>` element naming the glyph by intent. Button forces the `text`
   * size step, so the glyph tracks the label's own size and its ink lands
   * inside the cap-height band — pass the intent, let the button own the
   * scale.
   *
   * Omit `children` to render an **icon-only** button: the control becomes a
   * square (the block inset is mirrored on the inline axis and the glyph slot
   * squares to one line) and `aria-label` becomes required. The square
   * resolves to the same height as a labelled CTA, so a toolbar mixing the two
   * keeps one baseline.
   *
   * @example
   * ```tsx
   * <Button icon={<Icon intent="action.search" />}>Search</Button>
   * ```
   */
  icon?: React.ReactElement<IconProps>;
  /**
   * Which side of the label the `icon` sits on.
   * @default 'leading'
   */
  iconPlacement?: ButtonIconPlacement;
  /**
   * Data scope identifier for the button.
   * @default 'button'
   */
  'data-scope'?: string;
}

/**
 * Displays a semantic action trigger (entity: Action) in the **command**
 * silhouette — the assertive posture, for actions the user commits to:
 * submitting a form, confirming a dialog, the primary action of a surface.
 *
 * For ambient operations *on* content — toolbar controls, row actions, the
 * trigger of an overflow menu — reach for `ActionButton`, which wears the
 * quieter utility silhouette. Both are Action/root; what separates them is the
 * weight of the commitment, the same way `Meter` and `ProgressBar` are both
 * Feedback/root separated by meaning.
 *
 * Entity = Action → colors: `action`, radii: `action`, border: `outline.control`,
 * sizing: `hit` (ergonomic floor — drives both height and the square minimum
 * width), spacing: `inset.action.block` (block) + `inset.control.lg` (inline)
 * plus `gap.inline.xs` between glyph and label, typography: `action.md`,
 * motion: `feedback`.
 *
 * Anatomy (`data-part`): `root` · `icon` · `label` — the sub-parts are lawful
 * `icon` / `label` structural roles for Action, so the glyph and the text are
 * observable identities rather than anonymous spans.
 */
export type ButtonProps = ButtonOwnProps & ActionLabellingProps;

/**
 * A semantic action button built on React Aria.
 *
 * @example
 * ```tsx
 * <Button evaluation="accent">Save changes</Button>
 * <Button icon={<Icon intent="action.close" />} evaluation="muted">Dismiss</Button>
 * <Button icon={<Icon intent="disclosure.expand" />} iconPlacement="trailing">
 *   More
 * </Button>
 * <Button icon={<Icon intent="action.close" />} aria-label={closeLabel} />
 * ```
 */
export const Button = ({
  evaluation = 'primary',
  consequence = 'neutral',
  composition,
  icon,
  iconPlacement = 'leading',
  children,
  'data-scope': dataScope = 'button',
  ...props
}: ButtonProps) => {
  const colors = vars.colors.action[evaluation];
  const hasIcon = icon !== undefined;
  const isIconOnly = hasIcon && children === undefined;
  const isGrouped = useIsGroupedActionTrigger();

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
        const flags = { isDisabled, isHovered, isPressed };
        return buildActionTriggerStyle({
          silhouette: COMMAND_SILHOUETTE,
          hasIcon,
          isIconOnly,
          isDisabled,
          isFocusVisible,
          isGrouped,
          colors: {
            // The quiet rung's resting fill and edge follow the published
            // surface (CONTRACT §3.4); every other read is the plain cascade.
            background: resolveSurfaceBoundStyle({
              evaluation,
              states: colors?.background,
              flags,
            }),
            border: resolveSurfaceBoundStyle({
              evaluation,
              states: colors?.border,
              flags: { isDisabled, isFocusVisible },
            }),
            text: resolveConsequenceInk({
              consequence,
              evaluation,
              flags,
              ink:
                resolveInteractiveStyle(colors?.text, flags) ??
                colors?.text?.default,
            }),
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
Button.displayName = buttonMeta.displayName;
