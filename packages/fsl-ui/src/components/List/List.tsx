import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';

import type { ComponentMeta } from '../../semantics';

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Structure → CONTRACT.md §1 row: spacing `gap`. List is `Stack` with
// list semantics: the same rhythm, emitted as `<ul>`/`<ol>` + `<li>` so a
// screen reader announces "list, 3 items" instead of reading three unrelated
// paragraphs.
//
// Why a component rather than an `as` prop on `Stack`. A list is not one
// element but a *pair* whose parts are only valid together — `<li>` outside a
// list owner is invalid, and an `as` prop cannot enforce that its children
// became list items. Making it a pair is what lets the runtime scope guard say
// so (CONTRIBUTING §2.3), and it matches the reference: Chakra ships
// `List.Root` + `List.Item`, not a polymorphic stack.
//
// It consumes no colour token and paints nothing: the marker is a browser
// default the theme has no opinion about, and the ink belongs to whatever
// `Text` the caller puts inside. A frame-only Structure lawfully reads a subset
// of its row (CONTRACT §1 "legal vs required").
// ---------------------------------------------------------------------------

/** Formal semantic identity — List root (Structure entity, content list). */
export const listMeta = {
  displayName: 'List',
  entity: 'Structure',
  structure: 'root',
} as const satisfies ComponentMeta<'Structure'>;

/** Formal semantic identity — one item within a List. */
export const listItemMeta = {
  displayName: 'ListItem',
  entity: 'Structure',
  structure: 'content',
} as const satisfies ComponentMeta<'Structure'>;

/** A step of the stacking gap scale. */
export type ListGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Whether the items are ordered, and whether the marker shows.
 *
 * `unordered`/`ordered` are the two semantics; `plain` keeps `<ul>` semantics
 * and hides the marker, which is the shape most product lists want — a feature
 * list, a summary — and the one that otherwise gets hand-rolled with
 * `list-style: none`.
 */
export type ListVariant = 'plain' | 'unordered' | 'ordered';

const GAP: Record<ListGap, string> = {
  xs: vars.spacing.gap.stack.xs,
  sm: vars.spacing.gap.stack.sm,
  md: vars.spacing.gap.stack.md,
  lg: vars.spacing.gap.stack.lg,
  xl: vars.spacing.gap.stack.xl,
};

/** Props for the List component. */
export interface ListProps extends Omit<
  React.HTMLAttributes<HTMLUListElement>,
  'style' | 'className'
> {
  /**
   * Ordering and marker.
   * @default 'plain'
   */
  variant?: ListVariant;
  /**
   * Space between items, from the stacking gap scale.
   * @default 'sm'
   */
  gap?: ListGap;
  /** The items — `ListItem` elements. */
  children?: React.ReactNode;
}

/**
 * A content list with real list semantics.
 *
 * Entity = Structure. Use it wherever a set of items reads as a list: feature
 * lists, summaries, key points. A `Stack` renders a `<div>`, so the same
 * content announces as unrelated blocks; this announces as a list with a count.
 *
 * For a list the user *operates* — selects from, reorders, acts on — use
 * `ListBox` or `GridList`: those are Collection entities with keyboard
 * navigation, and this is presentation.
 *
 * @example
 * ```tsx
 * <List>
 *   <ListItem>Unlimited projects</ListItem>
 *   <ListItem>Priority support</ListItem>
 * </List>
 *
 * <List variant="ordered" gap="md">
 *   <ListItem>Install the CLI</ListItem>
 *   <ListItem>Run `fsl init`</ListItem>
 * </List>
 * ```
 */
export const List = ({
  variant = 'plain',
  gap = 'sm',
  children,
  ...props
}: ListProps) => {
  const Element = variant === 'ordered' ? 'ol' : 'ul';

  return (
    <Element
      {...(props as React.HTMLAttributes<HTMLElement>)}
      data-scope="list"
      data-part="root"
      data-variant={variant}
      style={
        {
          display: 'flex',
          flexDirection: 'column',
          gap: GAP[gap],
          // A marker needs room the browser reserves outside the content box;
          // `plain` has no marker, so it reclaims the indent rather than
          // leaving the hanging space every reset strips by hand.
          listStyle: variant === 'plain' ? 'none' : undefined,
          margin: 0,
          paddingInlineStart: variant === 'plain' ? 0 : undefined,
        } as React.CSSProperties
      }
    >
      {children}
    </Element>
  );
};
List.displayName = listMeta.displayName;

/** Props for the ListItem component. */
export interface ListItemProps extends Omit<
  React.LiHTMLAttributes<HTMLLIElement>,
  'style' | 'className'
> {
  /** The item's content. */
  children?: React.ReactNode;
}

/**
 * One item within a `List`.
 *
 * Renders an `<li>`, so it is only meaningful inside a `List` — a bare `<li>`
 * has no list owner and screen readers treat it as loose content.
 *
 * @example
 * ```tsx
 * <ListItem>Unlimited projects</ListItem>
 * ```
 */
export const ListItem = ({ children, ...props }: ListItemProps) => {
  return (
    <li {...props} data-scope="list" data-part="content">
      {children}
    </li>
  );
};
ListItem.displayName = listItemMeta.displayName;
