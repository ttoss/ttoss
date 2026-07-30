import { vars } from '@ttoss/fsl-theme/vars';
import type * as React from 'react';
import {
  Button as RACButton,
  Group as RACGroup,
  Input as RACInput,
  type LabelProps as RACLabelProps,
  SearchField as RACSearchField,
  type SearchFieldProps as RACSearchFieldProps,
} from 'react-aria-components';

import {
  buildFieldFrameStyle,
  buildFieldRootStyle,
  buildFieldValueStyle,
  type FieldAuthoring,
  FieldDescriptionPart,
  FieldLabelPart,
  type FieldLabelPartProps,
  FieldValidationMessagePart,
  useFieldLayout,
} from '../../components/Field/anatomy';
import { Icon } from '../../components/Icon';
import type { ComponentMeta } from '../../semantics';
import { buildEmbeddedTriggerStyle } from '../../tokens/embeddedTrigger';
import { ICON_SLOT_STYLE } from '../../tokens/iconSlot';
import { createCompositeScope } from '../scope';

// ---------------------------------------------------------------------------
// Composite scope — shares the (required, caller-localized) clear-button label
// from the root down to the control that renders the button, and the field's
// `isRequired` flag down to the label, which cannot otherwise know: React Aria
// tells a label nothing about its field, and the necessity marker belongs beside
// the label's own text. The flag is taken from the root's render props rather
// than its prop, because that is the authoritative value.
// Doubles as the presence guard for the sub-parts.
// ---------------------------------------------------------------------------

const searchFieldScope = createCompositeScope<{
  clearLabel: string;
  isRequired: boolean;
  isEmpty: boolean;
}>('SearchField');

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

/**
 * Props for the SearchField root.
 *
 * Both authoring forms, like every other field (ADR-022 addendum): pass
 * `label`/`description`/`errorMessage` for the one-line form, or compose
 * `SearchFieldLabel` + `SearchFieldControl` as children. Mixing them is a
 * compile error rather than a silent precedence rule.
 *
 * The one-line form is new in forms item D. Until then this composite had
 * **only** the slot form — props rendered nothing but the root — which is why
 * the field envelope reached only its label when C2 measured the family.
 */
export type SearchFieldProps = Omit<
  RACSearchFieldProps,
  'style' | 'className' | 'children'
> & {
  /**
   * Accessible label for the clear button (caller-localized — no default, per
   * the i18n rule / ADR-001). e.g. "Clear search".
   */
  clearLabel: string;
} & FieldAuthoring<React.ReactNode, { placeholder?: string }>;

/** Props for the SearchField label. */
export type SearchFieldLabelProps = Omit<RACLabelProps, 'style' | 'className'> &
  Pick<FieldLabelPartProps, 'contextualHelp'>;

/** The label slot of a SearchField. */
export const SearchFieldLabel = (props: SearchFieldLabelProps) => {
  const { isRequired } = searchFieldScope.use(searchFieldLabelMeta.displayName);

  return (
    <FieldLabelPart
      {...props}
      scope="search-field"
      colors={vars.colors.input.primary}
      isRequired={isRequired}
    />
  );
};
SearchFieldLabel.displayName = searchFieldLabelMeta.displayName;

/** Props for the SearchField control. */
export type SearchFieldControlProps = Omit<
  React.ComponentProps<typeof RACInput>,
  'style' | 'className'
>;

/**
 * The control slot — the search box.
 *
 * A **split** control, the shape the anatomy already defines for a field whose
 * value shares its box with adornments (`ComboBox`, `NumberField`): the frame
 * paints and hosts the glyph and the clear button, the `<input>` is borderless
 * and carries the value. It replaces a hand-rolled copy of the field chrome —
 * this file used to declare its own border, radius, motion, cascade and focus
 * ring, which is exactly the per-component drift the anatomy exists to prevent.
 *
 * `data-part="control"` stays on the `<input>` and the wrapper becomes `frame`.
 * Both were named `control` before (F-026), so `querySelector` returned the
 * wrapper — which reported `padding: 0` and `border-radius: 0`, because the
 * chrome was on the input — and a measurement read it as a defect until the DOM
 * was inspected by hand.
 *
 * The adornments are laid out in flow rather than absolutely positioned. The old
 * version reserved room for both with a `calc(icon.md + inset.control.md * 2)`
 * inline padding on the input — 48px each side, measured — and then floated the
 * glyph and button over it. That double-declares the same space: the frame is a
 * flex row, so the glyph and the trigger occupy it by being in it, and the value
 * gets what is left. It also meant the trailing 48px stayed reserved while the
 * clear button was hidden.
 */
export const SearchFieldControl = (props: SearchFieldControlProps) => {
  const { clearLabel, isEmpty } = searchFieldScope.use(
    searchFieldControlMeta.displayName
  );
  const { labelPosition } = useFieldLayout();
  const colors = vars.colors.input.primary;

  return (
    <RACGroup
      data-scope="search-field"
      data-part="frame"
      style={({ isDisabled, isInvalid, isFocusVisible }) => {
        return buildFieldFrameStyle({
          colors,
          labelPosition,
          isDisabled,
          isInvalid,
          isFocusVisible,
        });
      }}
    >
      <span
        data-scope="search-field"
        data-part="leadingAdornment"
        aria-hidden
        style={{
          ...ICON_SLOT_STYLE,
          flex: 'none',
          marginInlineStart: vars.spacing.inset.control.md,
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
        style={buildFieldValueStyle({ colors })}
      />

      {/*
        Hidden while there is nothing to clear. React Aria publishes the fact as
        `data-empty` on the root, which is a hook for **CSS** — and this package
        ships none, so the attribute alone changed nothing and the button sat
        there on an empty field. The header used to claim "the clear button is
        managed by React Aria (hidden while empty)"; it was not, and nothing
        failed, because a comment has no oracle. The state is read from the
        root's render props and travels the same scope as `clearLabel`.
      */}
      {!isEmpty && (
        <RACButton
          aria-label={clearLabel}
          data-scope="search-field"
          data-part="trailingAdornment"
          style={({ isHovered, isDisabled, isFocusVisible }) => {
            return buildEmbeddedTriggerStyle({
              colors,
              isHovered,
              isDisabled,
              isFocusVisible,
            });
          }}
        >
          <Icon intent="action.close" size="sm" />
        </RACButton>
      )}
    </RACGroup>
  );
};
SearchFieldControl.displayName = searchFieldControlMeta.displayName;

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
  label,
  contextualHelp,
  description,
  errorMessage,
  placeholder,
  ...props
}: SearchFieldProps) => {
  const { labelPosition } = useFieldLayout();
  const colors = vars.colors.input.primary;

  return (
    <RACSearchField
      {...props}
      data-scope="search-field"
      data-part="root"
      style={buildFieldRootStyle({ labelPosition })}
    >
      {({ isRequired, isEmpty }) => {
        return (
          <searchFieldScope.Provider
            value={{ clearLabel, isRequired, isEmpty }}
          >
            {children ?? (
              <>
                {label != null && (
                  <SearchFieldLabel contextualHelp={contextualHelp}>
                    {label}
                  </SearchFieldLabel>
                )}
                <SearchFieldControl placeholder={placeholder} />
                {description != null && (
                  <FieldDescriptionPart scope="search-field" colors={colors}>
                    {description}
                  </FieldDescriptionPart>
                )}
                <FieldValidationMessagePart
                  scope="search-field"
                  colors={colors}
                >
                  {errorMessage}
                </FieldValidationMessagePart>
              </>
            )}
          </searchFieldScope.Provider>
        );
      }}
    </RACSearchField>
  );
};
SearchField.displayName = searchFieldMeta.displayName;
