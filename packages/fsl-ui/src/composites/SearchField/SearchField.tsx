import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Button as RACButton,
  Input as RACInput,
  Label as RACLabel,
  type LabelProps as RACLabelProps,
  SearchField as RACSearchField,
  type SearchFieldProps as RACSearchFieldProps,
} from 'react-aria-components';

import { Icon } from '../../components/Icon';
import type { ComponentMeta } from '../../semantics';
import { focusRingOutline } from '../../tokens/focusRing';
import { resolveInteractiveStyle } from '../../tokens/resolveInteractiveStyle';
import { createCompositeScope } from '../scope';

// ---------------------------------------------------------------------------
// Composite scope — shares the (required, caller-localized) clear-button label
// from the root down to the control that renders the button. Doubles as the
// presence guard for the sub-parts.
// ---------------------------------------------------------------------------

const searchFieldScope = createCompositeScope<{ clearLabel: string }>(
  'SearchField'
);

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Input → CONTRACT.md §1 row (colors `input.primary`, radii
// `control`, border `outline.control`, spacing `inset.control`, typography
// `label`, motion `feedback`).
//
// FRICTION LOG: the ROADMAP row listed the parts as "closeTrigger + icon", but
// the Input entity's structural roles are
// root/control/label/description/leadingAdornment/trailingAdornment/validationMessage
// — it has neither `closeTrigger` nor `icon`. The correct existing roles are
// `leadingAdornment` (the search glyph) and `trailingAdornment` (the clear
// button). No taxonomy change — the resolution was to pick the right roles.
// The glyphs come from the internal Icon layer (B1): `action.search` and
// `action.close`.
// ---------------------------------------------------------------------------

/** Formal semantic identity — SearchField root (Input entity). */
export const searchFieldMeta = {
  displayName: 'SearchField',
  entity: 'Input',
  structure: 'root',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — label slot. */
export const searchFieldLabelMeta = {
  displayName: 'SearchFieldLabel',
  entity: 'Input',
  structure: 'label',
  composition: 'label',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — control slot (search box). */
export const searchFieldControlMeta = {
  displayName: 'SearchFieldControl',
  entity: 'Input',
  structure: 'control',
  composition: 'control',
} as const satisfies ComponentMeta<'Input'>;

/** Props for the SearchField root. */
export interface SearchFieldProps extends Omit<
  RACSearchFieldProps,
  'style' | 'className' | 'children'
> {
  /**
   * Accessible label for the clear button (caller-localized — no default, per
   * the i18n rule / ADR-001). e.g. "Clear search".
   */
  clearLabel: string;
  /**
   * Field parts (label, input, clear button, …). Plain nodes only — the
   * composite provides its own scope context, so React Aria's
   * function-children form is not part of this API.
   */
  children?: React.ReactNode;
}

/**
 * A search input composite (Input entity). Renders a labelled search box with
 * a leading search glyph and a trailing clear button (shown once there is
 * text). Compose with `SearchFieldLabel` and `SearchFieldControl`.
 *
 * @example
 * ```tsx
 * <SearchField clearLabel="Clear search" onSubmit={run}>
 *   <SearchFieldLabel>Search</SearchFieldLabel>
 *   <SearchFieldControl placeholder="Search…" />
 * </SearchField>
 * ```
 */
export const SearchField = ({
  clearLabel,
  children,
  ...props
}: SearchFieldProps) => {
  return (
    <RACSearchField
      {...props}
      data-scope="search-field"
      data-part="root"
      style={
        {
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: vars.spacing.gap.stack.xs,
        } as React.CSSProperties
      }
    >
      <searchFieldScope.Provider value={{ clearLabel }}>
        {children}
      </searchFieldScope.Provider>
    </RACSearchField>
  );
};
SearchField.displayName = searchFieldMeta.displayName;

/** Props for the SearchField label. */
export type SearchFieldLabelProps = Omit<RACLabelProps, 'style' | 'className'>;

/** The label slot of a SearchField. */
export const SearchFieldLabel = (props: SearchFieldLabelProps) => {
  searchFieldScope.use(searchFieldLabelMeta.displayName);
  const colors = vars.colors.input.primary;

  return (
    <RACLabel
      {...props}
      data-scope="search-field"
      data-part="label"
      style={
        {
          color: colors?.text?.default,
          ...(vars.text.label.md as React.CSSProperties),
        } as React.CSSProperties
      }
    />
  );
};
SearchFieldLabel.displayName = searchFieldLabelMeta.displayName;

/** Props for the SearchField control. */
export type SearchFieldControlProps = Omit<
  React.ComponentProps<typeof RACInput>,
  'style' | 'className'
>;

// Inline room reserved for the leading glyph / trailing clear button, sized to
// the icon token plus the control inset (CONTRIBUTING §4 layout-literal rule).
const ADORNMENT_INSET = `calc(${vars.sizing.icon.md} + ${vars.spacing.inset.control.md} * 2)`;

/**
 * The control slot — the search box. Renders the leading search glyph
 * (`leadingAdornment`), the `<input>`, and the trailing clear button
 * (`trailingAdornment`, labelled by the root's `clearLabel`). The clear
 * button is managed by React Aria (hidden while empty).
 */
export const SearchFieldControl = (props: SearchFieldControlProps) => {
  const { clearLabel } = searchFieldScope.use(
    searchFieldControlMeta.displayName
  );
  const colors = vars.colors.input.primary;

  return (
    <div
      data-scope="search-field"
      data-part="control"
      style={{
        boxSizing: 'border-box',
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        inlineSize: '100%',
      }}
    >
      <span
        data-scope="search-field"
        data-part="leadingAdornment"
        aria-hidden
        style={{
          position: 'absolute',
          insetInlineStart: vars.spacing.inset.control.md,
          display: 'inline-flex',
          color: colors?.text?.default,
          pointerEvents: 'none',
        }}
      >
        <Icon intent="action.search" size="sm" />
      </span>

      <RACInput
        {...props}
        data-scope="search-field"
        data-part="control"
        style={({ isHovered, isDisabled, isFocusVisible, isInvalid }) => {
          return {
            boxSizing: 'border-box',
            inlineSize: '100%',
            minHeight: vars.sizing.hit,
            paddingBlock: vars.spacing.inset.control.sm,
            // Leave room for the leading glyph and trailing clear button.
            paddingInlineStart: ADORNMENT_INSET,
            paddingInlineEnd: ADORNMENT_INSET,
            borderRadius: vars.radii.control,
            borderWidth: vars.border.outline.control.width,
            borderStyle: vars.border.outline.control.style,
            transitionDuration: vars.motion.feedback.duration,
            transitionTimingFunction: vars.motion.feedback.easing,
            transitionProperty: 'background-color, border-color, color',
            backgroundColor: resolveInteractiveStyle(colors?.background, {
              isHovered,
              isDisabled,
              isInvalid,
            }),
            borderColor: resolveInteractiveStyle(colors?.border, {
              isDisabled,
              isInvalid,
              isFocusVisible,
            }),
            color:
              resolveInteractiveStyle(colors?.text, {
                isHovered,
                isDisabled,
                isInvalid,
              }) ?? colors?.text?.default,
            outline: focusRingOutline(isFocusVisible),
            ...(vars.text.label.md as React.CSSProperties),
          } as React.CSSProperties;
        }}
      />

      <RACButton
        aria-label={clearLabel}
        data-scope="search-field"
        data-part="trailingAdornment"
        style={{
          position: 'absolute',
          insetInlineEnd: vars.spacing.inset.control.md,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: 0,
          background: 'transparent',
          color: colors?.text?.default,
          padding: 0,
        }}
      >
        <Icon intent="action.close" size="sm" />
      </RACButton>
    </div>
  );
};
SearchFieldControl.displayName = searchFieldControlMeta.displayName;
