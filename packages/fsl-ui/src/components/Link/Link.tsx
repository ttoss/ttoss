import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Link as RACLink,
  type LinkProps as RACLinkProps,
} from 'react-aria-components';

import type { ComponentMeta, EvaluationsFor } from '../../semantics';
import { FOCUS_RING_OFFSET, focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

/**
 * Formal semantic identity — what this component *is* (Layer 1).
 */
export const linkMeta = {
  displayName: 'Link',
  entity: 'Navigation',
  structure: 'root',
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
  /**
   * Whether this link points at the user's present location.
   *
   * Sets `aria-current="page"` and resolves the `current` colour the theme has
   * always shipped at `navigation.{role}.text.current`. React Aria exposes no
   * equivalent flag, and it could not: only the app knows which route is live.
   *
   * This is what a sidebar needs to mark the active page. Without it, a link
   * to the current route renders identically to every other link — the gap
   * that pushed the Studio into using `Tabs` as navigation (F-002/F-017).
   */
  isCurrent?: boolean;
}

/**
 * A link component for navigation, styled with navigation tokens.
 *
 * @example
 * ```tsx
 * <Link href="/team" isCurrent={route === 'team'}>Team</Link>
 * ```
 */
export const Link = ({
  evaluation = 'primary',
  isCurrent = false,
  ...props
}: LinkProps) => {
  const colors = vars.colors.navigation[evaluation];

  return (
    <RACLink
      {...props}
      // `page` rather than `true`: the link names a destination, and a
      // sidebar's live entry is the current *page* in that set. AT announces
      // the specific token, and it is what APG's navigation pattern asks for.
      aria-current={isCurrent ? 'page' : undefined}
      data-scope="link"
      data-part="root"
      data-current={isCurrent ? 'true' : undefined}
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
            isCurrent,
            isDisabled,
            isHovered,
            isPressed,
          }),
          outline: focusRingOutline(isFocusVisible),
          outlineOffset: FOCUS_RING_OFFSET,
        } as React.CSSProperties;
      }}
    />
  );
};
Link.displayName = linkMeta.displayName;
