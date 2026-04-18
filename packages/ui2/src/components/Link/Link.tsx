import { vars } from '@ttoss/theme2/vars';
import type * as React from 'react';
import {
  Link as RACLink,
  type LinkProps as RACLinkProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

/**
 * Formal semantic identity — what this component *is* (Layer 1).
 */
export const linkMeta = {
  displayName: 'Link',
  entity: 'Navigation',
  structure: 'root',
  interaction: 'navigate.link',
} as const satisfies ComponentMeta<'Navigation'>;

/**
 * A navigation link built on React Aria with semantic tokens from CONTRACT.md.
 *
 * Entity = Navigation → colors: `navigation`, radii: `control`,
 * typography: `label.md`, motion: `feedback`.
 */
export interface LinkProps extends RACLinkProps {
  /**
   * Semantic emphasis.
   * @default 'primary'
   */
  evaluation?: EvaluationsFor<(typeof linkMeta)['entity']>;
}

/**
 * A link component for navigation, styled with navigation tokens.
 */
export const Link = ({ evaluation = 'primary', ...props }: LinkProps) => {
  const colors = vars.colors.navigation[evaluation];

  return (
    <RACLink
      {...props}
      data-scope="link"
      data-part="root"
      data-evaluation={evaluation}
      style={({ isHovered, isPressed, isDisabled, isFocusVisible }) => {
        return {
          boxSizing: 'border-box',
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: isDisabled ? 'none' : 'underline',
          textDecorationThickness: isHovered ? '2px' : '1px',
          borderRadius: vars.radii.control,
          transitionDuration: vars.motion.feedback.duration,
          transitionTimingFunction: vars.motion.feedback.easing,
          transitionProperty: 'color, text-decoration-thickness',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          ...(vars.text.label.md as React.CSSProperties),
          color: resolveInteractiveStyle(colors?.text, {
            isHovered,
            isPressed,
            isDisabled,
          }),
          outline: isFocusVisible
            ? `${vars.focus.ring.width} ${vars.focus.ring.style} ${vars.focus.ring.color}`
            : 'none',
        } as React.CSSProperties;
      }}
    />
  );
};
Link.displayName = linkMeta.displayName;
