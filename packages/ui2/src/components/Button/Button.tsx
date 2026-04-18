import { vars } from '@ttoss/theme2/vars';
import type * as React from 'react';
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

/**
 * Formal semantic identity — what this component *is* (Layer 1).
 */
export const buttonMeta = {
  displayName: 'Button',
  entity: 'Action',
  structure: 'root',
  interaction: 'command',
} as const satisfies ComponentMeta<'Action'>;

/**
 * Displays a semantic action trigger (entity: Action, interaction: command).
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
}

/**
 * A semantic action button built on React Aria.
 */
export const Button = ({ evaluation = 'primary', ...props }: ButtonProps) => {
  const colors = vars.colors.action[evaluation];

  return (
    <RACButton
      {...props}
      data-scope="button"
      data-part="root"
      data-evaluation={evaluation}
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
          paddingBlock: vars.spacing.inset.control.md,
          paddingInline: vars.spacing.inset.control.md,
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
