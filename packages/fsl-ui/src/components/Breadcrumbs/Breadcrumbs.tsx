import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Breadcrumb as RACBreadcrumb,
  type BreadcrumbProps as RACBreadcrumbProps,
  Breadcrumbs as RACBreadcrumbs,
  type BreadcrumbsProps as RACBreadcrumbsProps,
  Link as RACLink,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Navigation → CONTRACT.md §1 row: colors `navigation`, radii
// `control`, typography `label.md`, motion `feedback`. Breadcrumbs is the
// trail; each Breadcrumb is an item. React Aria marks the last item
// `isCurrent` — that item renders the navigation `current` color and is not a
// link. The separator between items is decorative chrome (`aria-hidden`), not
// a semantic Icon.
// ---------------------------------------------------------------------------

/** Formal semantic identity — Breadcrumbs root (Navigation entity, trail). */
export const breadcrumbsMeta = {
  displayName: 'Breadcrumbs',
  entity: 'Navigation',
  structure: 'root',
} as const satisfies ComponentMeta<'Navigation'>;

/** Formal semantic identity — Breadcrumb item (Navigation entity). */
export const breadcrumbMeta = {
  displayName: 'Breadcrumb',
  entity: 'Navigation',
  structure: 'item',
} as const satisfies ComponentMeta<'Navigation'>;

/** Props for the Breadcrumbs container. */
export type BreadcrumbsProps<T extends object = object> = Omit<
  RACBreadcrumbsProps<T>,
  'style'
>;

/**
 * A breadcrumb trail (Navigation entity). Renders an ordered list of
 * `Breadcrumb` items; React Aria marks the last as the current location.
 *
 * @example
 * ```tsx
 * <Breadcrumbs>
 *   <Breadcrumb href="/">Home</Breadcrumb>
 *   <Breadcrumb href="/reports">Reports</Breadcrumb>
 *   <Breadcrumb>Q3</Breadcrumb>
 * </Breadcrumbs>
 * ```
 */
export const Breadcrumbs = <T extends object = object>(
  props: BreadcrumbsProps<T>
) => {
  return (
    <RACBreadcrumbs
      {...props}
      data-scope="breadcrumbs"
      data-part="root"
      style={
        {
          boxSizing: 'border-box',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: vars.spacing.gap.inline.sm,
          margin: 0,
          padding: 0,
          listStyle: 'none',
        } as React.CSSProperties
      }
    />
  );
};
Breadcrumbs.displayName = breadcrumbsMeta.displayName;

/** Props for a single Breadcrumb item. */
export interface BreadcrumbProps extends Omit<RACBreadcrumbProps, 'style'> {
  /**
   * Destination for this crumb. Omit on the final (current) crumb — the
   * current location is rendered as text, not a link.
   */
  href?: string;
  /** The crumb's visible label. */
  children?: React.ReactNode;
}

/**
 * One crumb in a `Breadcrumbs` trail. Renders a navigation link, except the
 * current (last) crumb which renders as text in the `current` color and is
 * followed by no separator.
 */
export const Breadcrumb = ({ href, children, ...props }: BreadcrumbProps) => {
  const colors = vars.colors.navigation.primary;

  return (
    <RACBreadcrumb {...props} data-scope="breadcrumbs" data-part="item">
      {({ isCurrent }) => {
        return (
          <span
            style={{
              boxSizing: 'border-box',
              display: 'inline-flex',
              alignItems: 'center',
              gap: vars.spacing.gap.inline.sm,
            }}
          >
            {isCurrent ? (
              <span
                data-scope="breadcrumbs"
                data-part="control"
                aria-current="page"
                style={{
                  ...(vars.text.label.md as React.CSSProperties),
                  color: colors?.text?.current ?? colors?.text?.default,
                }}
              >
                {children}
              </span>
            ) : (
              <RACLink
                href={href}
                data-scope="breadcrumbs"
                data-part="control"
                style={({
                  isHovered,
                  isPressed,
                  isDisabled,
                  isFocusVisible,
                }) => {
                  return {
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                    borderRadius: vars.radii.control,
                    textDecoration: isHovered ? 'underline' : 'none',
                    ...(vars.text.label.md as React.CSSProperties),
                    color: resolveInteractiveStyle(colors?.text, {
                      isHovered,
                      isPressed,
                      isDisabled,
                    }),
                    outline: focusRingOutline(isFocusVisible),
                  } as React.CSSProperties;
                }}
              >
                {children}
              </RACLink>
            )}

            {/* Decorative separator — omitted after the current crumb. */}
            {!isCurrent && (
              <span
                aria-hidden
                style={{
                  color: colors?.text?.default,
                  userSelect: 'none',
                }}
              >
                /
              </span>
            )}
          </span>
        );
      }}
    </RACBreadcrumb>
  );
};
Breadcrumb.displayName = breadcrumbMeta.displayName;
