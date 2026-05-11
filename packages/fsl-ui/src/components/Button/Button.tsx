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

/**
 * Formal semantic identity — what this component *is* (Layer 1).
 */
export const buttonMeta = {
  displayName: 'Button',
  entity: 'Action',
  structure: 'root',
} as const satisfies ComponentMeta<'Action'>;

/**
 * Displays a semantic action trigger (entity: Action).
 *
 * Entity = Action → colors: `action`, radii: `control`, border: `outline.control`,
 * sizing: `hit.base`, spacing: `inset.control.md`, typography: `label.md`, motion: `feedback`.
 */
export interface ButtonProps extends Omit<RACButtonProps, 'style'> {
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
   * NOT used for coloring — visual distinction (if any) is a theme /
   * host-CSS concern, matching the same contract as `MenuItem`.
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
   * Data scope identifier for the button.
   * @default 'button'
   */
  'data-scope'?: string;
}

/**
 * A semantic action button built on React Aria.
 */
export const Button = ({
  evaluation = 'primary',
  consequence = 'neutral',
  composition,
  'data-scope': dataScope = 'button',
  ...props
}: ButtonProps) => {
  const colors = vars.colors.action[evaluation];

  return (
    <RACButton
      {...props}
      data-scope={dataScope}
      data-part="root"
      data-evaluation={evaluation}
      data-consequence={consequence}
      data-composition={composition}
      style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => {
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
          // Block padding is intentionally tight — `min-height: hit.base`
          // already enforces the vertical hit target, so we let it drive
          // height and use a wider inline inset for visual breathing
          // (matches MUI/Bootstrap/Tailwind ~1:3 vertical:horizontal ratio).
          paddingBlock: vars.spacing.inset.control.sm,
          paddingInline: vars.spacing.inset.control.lg,
          ...(vars.text.label.md as React.CSSProperties),
          transitionDuration: vars.motion.feedback.duration,
          transitionTimingFunction: vars.motion.feedback.easing,
          transitionProperty: 'background-color, border-color, color',
          backgroundColor: resolveInteractiveStyle(colors?.background, {
            isHovered,
            isPressed,
            isDisabled,
          }),
          borderColor: resolveInteractiveStyle(colors?.border, {
            isDisabled,
            isFocusVisible,
          }),
          color:
            resolveInteractiveStyle(colors?.text, {
              isHovered,
              isPressed,
              isDisabled,
            }) ?? colors?.text?.default,
          outline: isFocusVisible
            ? `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
            : 'none',
        } as React.CSSProperties;
      }}
    />
  );
};
Button.displayName = buttonMeta.displayName;
