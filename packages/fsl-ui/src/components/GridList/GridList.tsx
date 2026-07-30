import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Checkbox as RACCheckbox,
  GridList as RACGridList,
  GridListItem as RACGridListItem,
  type GridListItemProps as RACGridListItemProps,
  type GridListProps as RACGridListProps,
} from 'react-aria-components';

import type { ComponentMeta } from '../../semantics';
import { buildChoosableRowStyle } from '../../tokens/choosableRow';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import {
  SELECTION_BOX_BASE,
  SELECTION_CONTROL,
} from '../../tokens/selectionControl';
import { Icon } from '../Icon';

// ---------------------------------------------------------------------------
// Semantic identities — Layer 1 (per-part entity split, ADR-007)
//
// The CONTAINER is Entity = Collection → colors `informational`, radii
// `surface`, border `outline.surface`, spacing `inset.surface`. A
// content-carrying surface of rows.
//
// Each ITEM (row) is Entity = Selection → colors `input.primary`, radii
// `control`, border `outline.control` + `selected`, and carries a
// `selectionControl` (a checkbox) plus its content. Items keep the selection
// chrome of Checkbox/Select (the `selected` State) — NOT informational
// chrome. See ADR-007 + CONTRACT.md §1. The entity→ux-context contract test
// unions both entities' contexts, so this file lawfully reads both
// `vars.colors.informational.*` and `vars.colors.input.*`.
// ---------------------------------------------------------------------------

/** Formal semantic identity — GridList root (Collection entity, surface). */
export const gridListMeta = {
  displayName: 'GridList',
  entity: 'Collection',
  structure: 'root',
} as const satisfies ComponentMeta<'Collection'>;

/** Formal semantic identity — GridListItem (Selection entity, selectable row). */
export const gridListItemMeta = {
  displayName: 'GridListItem',
  entity: 'Selection',
  structure: 'item',
  composition: 'selection',
} as const satisfies ComponentMeta<'Selection'>;

type InputColors = typeof vars.colors.input.primary;

/** Row (item) chrome — reflects the `selected` set-membership State. */
const buildRowStyle = ({
  c,
  isSelected,
  isHovered,
  isFocusVisible,
  isDisabled,
}: {
  c: InputColors;
  isSelected?: boolean;
  isHovered?: boolean;
  isFocusVisible?: boolean;
  isDisabled?: boolean;
}): React.CSSProperties => {
  return {
    ...buildChoosableRowStyle(),
    // A GridList row holds a selection control beside its content, so it is the
    // one member that also needs an inline gap. The row's box is still the
    // shared one — only the extra child is local.
    gap: vars.spacing.gap.inline.sm,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? vars.opacity.disabled : undefined,
    transitionProperty: 'background-color, color',
    transitionDuration: vars.motion.feedback.duration,
    transitionTimingFunction: vars.motion.feedback.easing,
    backgroundColor: resolveInteractiveStyle(c?.background, {
      isDisabled,
      isSelected,
      isHovered,
    }),
    color:
      resolveInteractiveStyle(c?.text, { isDisabled, isSelected, isHovered }) ??
      c?.text?.default,
    outline: focusRingOutline(isFocusVisible),
  };
};

/**
 * Static box chrome for the row's selection checkbox — the shared
 * selection-control source, with the checkbox-shaped radius. This box had
 * kept the full `control` radius, which at 18px reads as a circle — the
 * ambiguity-with-Radio defect P3 slice 3 fixed on `Checkbox` and this second
 * copy silently kept.
 */
const SELECTION_BOX_STYLE = {
  ...SELECTION_BOX_BASE,
  borderWidth: vars.border.outline.control.width,
  borderRadius: SELECTION_CONTROL.checkboxRadius,
} satisfies React.CSSProperties;

/**
 * Selection-box colors resolved once (checked vs default). Hoisted so the
 * render callback stays under the cyclomatic-complexity limit.
 */
const buildSelectionBoxStyle = ({
  c,
  on,
}: {
  c: InputColors;
  on: boolean;
}): React.CSSProperties => {
  const text = c?.text;
  const key = on ? 'checked' : 'default';
  return {
    ...SELECTION_BOX_STYLE,
    backgroundColor: c?.background?.[key],
    borderColor: c?.border?.[key],
    color: text?.checked ?? text?.default,
  };
};

/**
 * The per-row selection control (a checkbox). Internal — RAC wires it to the
 * row's selection via `slot="selection"`; reads `input.primary` chrome.
 */
const RowSelectionControl = () => {
  const c = vars.colors.input.primary;

  return (
    <RACCheckbox
      slot="selection"
      data-scope="grid-list"
      data-part="selectionControl"
      style={{ display: 'inline-flex' }}
    >
      {({ isSelected, isIndeterminate }) => {
        const on = isSelected || isIndeterminate;
        return (
          <span aria-hidden style={buildSelectionBoxStyle({ c, on })}>
            {/* `text` (1em) resolves against the box's own glyph scale —
                `size="sm"` is container-fluid and overflowed the fixed box
                (measured on Checkbox, same mark). */}
            {on && (
              <Icon
                intent={
                  isIndeterminate
                    ? 'selection.indeterminate'
                    : 'selection.checked'
                }
                size="text"
              />
            )}
          </span>
        );
      }}
    </RACCheckbox>
  );
};

/** Props for the GridList component. */
export type GridListProps<T extends object = object> = Omit<
  RACGridListProps<T>,
  'style' | 'className'
>;

/**
 * A standalone semantic grid list built on React Aria's `GridList` — rows of
 * selectable content, each with a selection checkbox.
 *
 * Per ADR-007 the CONTAINER is Entity = Collection (an `informational`
 * surface) and each `GridListItem` is Entity = Selection (`input` chrome).
 * Set `selectionMode="single|multiple"`. Use `GridListItem` per row (pass
 * `textValue` when the row content is not plain text).
 *
 * @example
 * ```tsx
 * <GridList aria-label="Files" selectionMode="multiple">
 *   <GridListItem id="a" textValue="Report">Report.pdf</GridListItem>
 *   <GridListItem id="b" textValue="Notes">Notes.txt</GridListItem>
 * </GridList>
 * ```
 */
export const GridList = <T extends object = object>({
  children,
  ...props
}: GridListProps<T>) => {
  const surface = vars.colors.informational.primary;

  return (
    <RACGridList
      {...props}
      data-scope="grid-list"
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
    </RACGridList>
  );
};
GridList.displayName = gridListMeta.displayName;

/** Props for the GridListItem component. */
export type GridListItemProps = Omit<
  RACGridListItemProps,
  'style' | 'className' | 'children'
> & {
  /**
   * Row content. Plain nodes only — the item owns its render prop
   * internally (selection control + content wrapper), so React Aria's
   * function-children form is not part of this API.
   */
  children?: React.ReactNode;
};

/**
 * A single selectable row inside a `GridList`. Entity = Selection → reads
 * `vars.colors.input.primary.*`, renders a `selectionControl` checkbox, and
 * surfaces the `selected` State.
 *
 * @example
 * ```tsx
 * <GridListItem id="a" textValue="Report">Report.pdf</GridListItem>
 * ```
 */
export const GridListItem = ({ children, ...props }: GridListItemProps) => {
  const c = vars.colors.input.primary;

  return (
    <RACGridListItem
      {...props}
      data-scope="grid-list"
      data-part="item"
      style={({ isSelected, isHovered, isFocusVisible, isDisabled }) => {
        return buildRowStyle({
          c,
          isSelected,
          isHovered,
          isFocusVisible,
          isDisabled,
        });
      }}
    >
      {({ selectionMode }) => {
        return (
          <>
            {selectionMode !== 'none' && <RowSelectionControl />}
            <span
              data-scope="grid-list"
              data-part="content"
              style={{ flex: 1 }}
            >
              {children}
            </span>
          </>
        );
      }}
    </RACGridListItem>
  );
};
GridListItem.displayName = gridListItemMeta.displayName;
