import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  ListBox as RACListBox,
  ListBoxItem as RACListBoxItem,
  type ListBoxItemProps as RACListBoxItemProps,
  type ListBoxProps as RACListBoxProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';

// ---------------------------------------------------------------------------
// Semantic identities — Layer 1 (per-part entity split, ADR-007)
//
// The CONTAINER is Entity = Collection → CONTRACT.md §1 row: colors
// `informational`, radii `surface`, border `outline.surface`, spacing
// `inset.surface`, elevation `flat`/`raised`. It is a content-carrying
// surface that holds the options.
//
// Each ITEM is Entity = Selection → colors `input.primary`, radii `control`,
// border `outline.control` + `selected`, spacing `inset.control`. Option
// selection is set-membership data provision, so items keep the exact
// selection chrome of Select/Checkbox/RadioGroup (the `selected` State) —
// NOT informational chrome. See ADR-007 + CONTRACT.md §1 "Collection
// containers with Selection items". The entity→ux-context contract test
// unions both entities' contexts, so this file lawfully reads both
// `vars.colors.informational.*` and `vars.colors.input.*`.
// ---------------------------------------------------------------------------

/** Formal semantic identity — ListBox root (Collection entity, surface). */
export const listBoxMeta = {
  displayName: 'ListBox',
  entity: 'Collection',
  structure: 'root',
} as const satisfies ComponentMeta<'Collection'>;

/** Formal semantic identity — ListBoxItem (Selection entity, one of a set). */
export const listBoxItemMeta = {
  displayName: 'ListBoxItem',
  entity: 'Selection',
  structure: 'item',
  composition: 'selection',
} as const satisfies ComponentMeta<'Selection'>;

/** Props for the ListBox component. */
export type ListBoxProps<T extends object = object> = Omit<
  RACListBoxProps<T>,
  'style' | 'className'
>;

/**
 * A standalone semantic list box built on React Aria's `ListBox` — a
 * selectable list of options.
 *
 * Per ADR-007 the CONTAINER is Entity = Collection (an `informational`
 * surface) and each `ListBoxItem` is Entity = Selection (`input` chrome). Set
 * `selectionMode="single|multiple"`. Use `ListBoxItem` for each option.
 *
 * @example
 * ```tsx
 * <ListBox aria-label="Frameworks" selectionMode="multiple">
 *   <ListBoxItem id="react">React</ListBoxItem>
 *   <ListBoxItem id="vue">Vue</ListBoxItem>
 * </ListBox>
 * ```
 */
export const ListBox = <T extends object = object>({
  children,
  ...props
}: ListBoxProps<T>) => {
  const surface = vars.colors.informational.primary;

  return (
    <RACListBox
      {...props}
      data-scope="list-box"
      data-part="root"
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: vars.spacing.gap.stack.xs,
        padding: vars.spacing.inset.surface.sm,
        borderRadius: vars.radii.surface,
        borderWidth: vars.border.outline.surface.width,
        borderStyle: vars.border.outline.surface.style,
        borderColor: surface?.border?.default ?? 'transparent',
        backgroundColor: surface?.background?.default,
      }}
    >
      {children}
    </RACListBox>
  );
};
ListBox.displayName = listBoxMeta.displayName;

/** Props for the ListBoxItem component. */
export type ListBoxItemProps = Omit<RACListBoxItemProps, 'style' | 'className'>;

/**
 * A single option inside a `ListBox`. Entity = Selection → reads
 * `vars.colors.input.primary.*` and surfaces the `selected` State (set
 * membership) — the same chrome as `SelectItem`.
 *
 * @example
 * ```tsx
 * <ListBoxItem id="react">React</ListBoxItem>
 * ```
 */
export const ListBoxItem = ({ children, ...props }: ListBoxItemProps) => {
  const c = vars.colors.input.primary;

  return (
    <RACListBoxItem
      {...props}
      data-scope="list-box"
      data-part="item"
      style={({
        isHovered,
        isPressed,
        isDisabled,
        isFocusVisible,
        isSelected,
      }) => {
        return {
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          paddingBlock: vars.spacing.inset.control.md,
          paddingInline: vars.spacing.inset.control.md,
          borderRadius: vars.radii.control,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? vars.opacity.disabled : undefined,
          ...(vars.text.label.md as React.CSSProperties),
          backgroundColor: resolveInteractiveStyle(c?.background, {
            isDisabled,
            isSelected,
            isHovered,
            isPressed,
          }),
          color:
            resolveInteractiveStyle(c?.text, {
              isDisabled,
              isSelected,
              isHovered,
            }) ?? c?.text?.default,
          outline: focusRingOutline(isFocusVisible),
          outlineOffset: '2px',
          transitionProperty: 'background-color, color',
          transitionDuration: vars.motion.feedback.duration,
          transitionTimingFunction: vars.motion.feedback.easing,
        } as React.CSSProperties;
      }}
    >
      {children}
    </RACListBoxItem>
  );
};
ListBoxItem.displayName = listBoxItemMeta.displayName;
