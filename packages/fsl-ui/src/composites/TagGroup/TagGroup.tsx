import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Button as RACButton,
  Label as RACLabel,
  Tag as RACTag,
  TagGroup as RACTagGroup,
  type TagGroupProps as RACTagGroupProps,
  TagList as RACTagList,
  type TagProps as RACTagProps,
} from 'react-aria-components';

import { Icon } from '../../components/Icon';
import type { ComponentMeta } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import { createCompositeScope } from '../scope';

// ---------------------------------------------------------------------------
// Composite scope — shares the (localized) remove-button label from the group
// down to each Tag, and guards Tag against being rendered outside a TagGroup.
// ---------------------------------------------------------------------------

const tagGroupScope = createCompositeScope<{ removeLabel: string }>('TagGroup');

// ---------------------------------------------------------------------------
// Semantic identities — Layer 1
//
// Entity = Selection → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Selection carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`, border: `outline.control` + `selected`,
//   spacing: `inset.control`, typography: `label.md`, motion: `feedback`.
//
// A focusable list of removable/selectable tags (filters, keywords, chips).
// A chosen tag reflects the `selected` State (set membership — the FSL
// canonical answer to the "filter chip" ambiguity: `selected`, NOT `pressed`;
// a tag is not a toggle button). See colors.md → "Common confusions".
//
// FRICTION LOG (FSL validation): the ROADMAP structure lists `closeTrigger`,
// but Selection's structural roles (root/control/label/indicator/
// selectionControl/item) do NOT include `closeTrigger` (that role lives on
// Overlay/Feedback). Per "no taxonomy additions" the remove button ships as
// an INTERNAL data-part of the Tag (no `*Meta`, no legality claim) — the same
// internal-part pattern as SearchField's clear button. Only root + item carry
// metas. Admit `closeTrigger` to Selection via governance only when a real
// component needs it as a declared identity. See ROADMAP TagGroup row.
// ---------------------------------------------------------------------------

/** Formal semantic identity — TagGroup root (Selection entity). */
export const tagGroupMeta = {
  displayName: 'TagGroup',
  entity: 'Selection',
  structure: 'root',
} as const satisfies ComponentMeta<'Selection'>;

/** Formal semantic identity — Tag item (Selection entity, one of a set). */
export const tagMeta = {
  displayName: 'Tag',
  entity: 'Selection',
  structure: 'item',
  composition: 'selection',
} as const satisfies ComponentMeta<'Selection'>;

type InputColors = typeof vars.colors.input.primary;

/** Tag (item) chrome — pill that reflects the `selected` set-membership State. */
const buildTagStyle = ({
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
    boxSizing: 'border-box',
    display: 'inline-flex',
    alignItems: 'center',
    gap: vars.spacing.gap.inline.xs,
    minHeight: vars.sizing.hit.base,
    paddingBlock: vars.spacing.inset.control.sm,
    paddingInline: vars.spacing.inset.control.md,
    borderRadius: vars.radii.control,
    borderWidth: isSelected
      ? vars.border.outline.selected.width
      : vars.border.outline.control.width,
    borderStyle: vars.border.outline.control.style,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? vars.opacity.disabled : undefined,
    ...(vars.text.label.md as React.CSSProperties),
    transitionProperty: 'background-color, border-color, color',
    transitionDuration: vars.motion.feedback.duration,
    transitionTimingFunction: vars.motion.feedback.easing,
    backgroundColor: resolveInteractiveStyle(c?.background, {
      isDisabled,
      isSelected,
      isHovered,
    }),
    borderColor: resolveInteractiveStyle(c?.border, {
      isDisabled,
      isSelected,
      isFocusVisible,
    }),
    color:
      resolveInteractiveStyle(c?.text, { isDisabled, isSelected, isHovered }) ??
      c?.text?.default,
    outline: focusRingOutline(isFocusVisible),
  };
};

// ---------------------------------------------------------------------------
// TagGroup — root
// ---------------------------------------------------------------------------

/** Props for the TagGroup component. */
export interface TagGroupProps extends Omit<
  RACTagGroupProps,
  'style' | 'children' | 'className'
> {
  /** Group label displayed above the tags. */
  label?: React.ReactNode;
  /**
   * Accessible name for each tag's remove button (the icon is the sole carrier
   * of meaning). Documented English fallback, overridable (i18n rule §6.2).
   * Only rendered when the group is removable (`onRemove` set).
   * @default 'Remove'
   */
  removeLabel?: string;
  /** `Tag` children. */
  children?: React.ReactNode;
}

/**
 * A semantic tag group built on React Aria's `TagGroup` — a focusable list of
 * labels, keywords, filters, or chips with keyboard navigation, optional
 * selection, and optional removal.
 *
 * Entity = Selection → reads `vars.colors.input.primary.*`. A chosen tag uses
 * the `selected` State (set membership), never `pressed`. Pass
 * `selectionMode="single|multiple"` to make tags selectable and `onRemove` to
 * make them removable.
 *
 * @example
 * ```tsx
 * <TagGroup label="Filters" selectionMode="multiple" onRemove={remove}>
 *   <Tag id="react">React</Tag>
 *   <Tag id="vue">Vue</Tag>
 * </TagGroup>
 * ```
 */
export const TagGroup = ({
  label,
  removeLabel = 'Remove',
  children,
  ...props
}: TagGroupProps) => {
  const c = vars.colors.input.primary;

  return (
    <RACTagGroup
      {...props}
      data-scope="tag-group"
      data-part="root"
      style={{
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: vars.spacing.gap.stack.xs,
      }}
    >
      <tagGroupScope.Provider value={{ removeLabel }}>
        {label != null && (
          <RACLabel
            data-scope="tag-group"
            data-part="label"
            style={{
              ...(vars.text.label.md as React.CSSProperties),
              color: c?.text?.default,
            }}
          >
            {label}
          </RACLabel>
        )}
        <RACTagList
          data-scope="tag-group"
          data-part="list"
          style={{
            boxSizing: 'border-box',
            display: 'flex',
            flexWrap: 'wrap',
            gap: vars.spacing.gap.inline.sm,
            listStyle: 'none',
            margin: 0,
            padding: 0,
          }}
        >
          {children}
        </RACTagList>
      </tagGroupScope.Provider>
    </RACTagGroup>
  );
};
TagGroup.displayName = tagGroupMeta.displayName;

// ---------------------------------------------------------------------------
// Tag — individual removable/selectable item
// ---------------------------------------------------------------------------

/** Props for the Tag component. */
export interface TagProps extends Omit<RACTagProps, 'style' | 'className'> {
  /** Tag label content. */
  children?: React.ReactNode;
}

/**
 * A single tag inside a `TagGroup`. Reflects the `selected` State when picked
 * and renders a remove (close) affordance when the group is removable
 * (`onRemove`). Must be used inside a `TagGroup`.
 *
 * @example
 * ```tsx
 * <Tag id="react">React</Tag>
 * ```
 */
export const Tag = ({ children, ...props }: TagProps) => {
  const { removeLabel } = tagGroupScope.use(tagMeta.displayName);
  const c = vars.colors.input.primary;

  return (
    <RACTag
      {...props}
      data-scope="tag-group"
      data-part="item"
      style={({ isSelected, isHovered, isFocusVisible, isDisabled }) => {
        return buildTagStyle({
          c,
          isSelected,
          isHovered,
          isFocusVisible,
          isDisabled,
        });
      }}
    >
      {({ allowsRemoving }) => {
        return (
          <>
            <span data-scope="tag-group" data-part="label">
              {children}
            </span>
            {allowsRemoving && (
              <RACButton
                slot="remove"
                data-scope="tag-group"
                data-part="closeTrigger"
                style={{
                  boxSizing: 'border-box',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  border: 0,
                  background: 'transparent',
                  cursor: 'pointer',
                  padding: 0,
                  color: 'inherit',
                }}
              >
                <Icon intent="action.close" size="sm" label={removeLabel} />
              </RACButton>
            )}
          </>
        );
      }}
    </RACTag>
  );
};
Tag.displayName = tagMeta.displayName;
