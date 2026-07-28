import { vars } from '@ttoss/fsl-theme/vars';
import {
  type FieldErrorProps as RACFieldErrorProps,
  Input as RACInput,
  type InputProps as RACInputProps,
  type LabelProps as RACLabelProps,
  TextField as RACTextField,
  type TextFieldProps as RACTextFieldProps,
  type TextProps as RACTextProps,
} from 'react-aria-components';

import {
  buildFieldControlStyle,
  buildFieldRootStyle,
  type FieldAuthoring,
  FieldDescriptionPart,
  FieldLabelPart,
  FieldValidationMessagePart,
} from '../../components/Field/anatomy';
import type { ComponentMeta } from '../../semantics';
import { createCompositeScope } from '../scope';

// ---------------------------------------------------------------------------
// Composite scope — presence-only host guard.
//
// `TextField` is the host. `TextFieldLabel`, `TextFieldControl`,
// `TextFieldDescription`, and `TextFieldError` assert this scope at render
// time — rendered standalone they throw with a clear message instead of
// silently producing a detached label/input/error that is not wired into
// any field's a11y tree.
// ---------------------------------------------------------------------------

// Stateful rather than presence-only: the host now has something its parts
// need. The label cannot know the field is required — React Aria does not tell
// it — and the necessity marker belongs beside the label text, so the root
// publishes the flag from its own render props (the authoritative value, not the
// prop). `scope.ts`'s authoring rule: share state when there is state to share.
const textFieldScope = createCompositeScope<{ isRequired: boolean }>(
  'TextField'
);

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// TextField is the canonical composite: one Input entity rendered as four
// parts in four composition slots (label, control, description, status).
// Each sub-part owns a ComponentMeta (I2) with its `composition` role (I1).
//
// Entity = Input → CONTRACT.md §1 row:
//   colors: `input.primary` (single neutral chrome — Input carries no
//   authorial Evaluation per ENTITY_EVALUATION),
//   radii: `control`, border: `outline.control`,
//   sizing: `hit`, spacing: `inset.control`, typography: `label`,
//   motion: `feedback`, elevation: `flat`.
//
// Validation feedback flows from React Aria's `isInvalid` (or `validate`
// callback) into the `invalid` token State on the control, the label, and
// the validation message.
// ---------------------------------------------------------------------------

/** Formal semantic identity — TextField root (Input entity, root part). */
export const textFieldMeta = {
  displayName: 'TextField',
  entity: 'Input',
  structure: 'root',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — label slot. */
export const textFieldLabelMeta = {
  displayName: 'TextFieldLabel',
  entity: 'Input',
  structure: 'label',
  composition: 'label',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — control slot (the actual input element). */
export const textFieldControlMeta = {
  displayName: 'TextFieldControl',
  entity: 'Input',
  structure: 'control',
  composition: 'control',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — description slot (helper text). */
export const textFieldDescriptionMeta = {
  displayName: 'TextFieldDescription',
  entity: 'Input',
  structure: 'description',
  composition: 'description',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — status slot (validation message). */
export const textFieldErrorMeta = {
  displayName: 'TextFieldError',
  entity: 'Input',
  structure: 'validationMessage',
  composition: 'status',
} as const satisfies ComponentMeta<'Input'>;

// ---------------------------------------------------------------------------
// TextFieldLabel — label slot
// ---------------------------------------------------------------------------

/** Props for the TextField label. */
export type TextFieldLabelProps = Omit<RACLabelProps, 'style' | 'className'>;

/** The label slot of a TextField. Wired to React Aria for a11y linkage. */
export const TextFieldLabel = ({ children, ...props }: TextFieldLabelProps) => {
  const { isRequired } = textFieldScope.use(textFieldLabelMeta.displayName);
  const colors = vars.colors.input.primary;

  return (
    <FieldLabelPart
      {...props}
      scope="text-field"
      colors={colors}
      isRequired={isRequired}
    >
      {children}
    </FieldLabelPart>
  );
};
TextFieldLabel.displayName = textFieldLabelMeta.displayName;

// ---------------------------------------------------------------------------
// TextFieldControl — the <input> itself
// ---------------------------------------------------------------------------

/** Props for the TextField control. */
export type TextFieldControlProps = Omit<RACInputProps, 'style' | 'className'>;

/**
 * The control slot of a TextField — the actual `<input>` element. Reads
 * `isInvalid` from React Aria's render-props and surfaces the `invalid`
 * State via `vars.colors.input.primary.*`.
 */
export const TextFieldControl = (props: TextFieldControlProps) => {
  textFieldScope.use(textFieldControlMeta.displayName);
  const colors = vars.colors.input.primary;

  return (
    <RACInput
      {...props}
      data-scope="text-field"
      data-part="control"
      style={({ isHovered, isDisabled, isFocusVisible, isInvalid }) => {
        return buildFieldControlStyle({
          colors,
          isHovered,
          isDisabled,
          isFocusVisible,
          isInvalid,
        });
      }}
    />
  );
};
TextFieldControl.displayName = textFieldControlMeta.displayName;

// ---------------------------------------------------------------------------
// TextFieldDescription — supporting helper text
// ---------------------------------------------------------------------------

/** Props for the TextField description. */
export type TextFieldDescriptionProps = Omit<
  RACTextProps,
  'style' | 'className' | 'slot'
>;

/** Helper/description text linked to the control via React Aria's slot. */
export const TextFieldDescription = (props: TextFieldDescriptionProps) => {
  textFieldScope.use(textFieldDescriptionMeta.displayName);
  const colors = vars.colors.input.primary;

  return <FieldDescriptionPart {...props} scope="text-field" colors={colors} />;
};
TextFieldDescription.displayName = textFieldDescriptionMeta.displayName;

// ---------------------------------------------------------------------------
// TextFieldError — validation message (status slot)
// ---------------------------------------------------------------------------

/** Props for the TextField error. */
export type TextFieldErrorProps = Omit<
  RACFieldErrorProps,
  'style' | 'className'
>;

/**
 * Validation message — rendered by React Aria only when the field is
 * invalid. Uses the `invalid` State of the canonical `input.primary`
 * subtree (mirroring the control's invalid coloring).
 */
export const TextFieldError = (props: TextFieldErrorProps) => {
  textFieldScope.use(textFieldErrorMeta.displayName);
  const colors = vars.colors.input.primary;

  return (
    <FieldValidationMessagePart {...props} scope="text-field" colors={colors} />
  );
};
TextFieldError.displayName = textFieldErrorMeta.displayName;

// ---------------------------------------------------------------------------
// TextField — root (orchestrator + container)
// ---------------------------------------------------------------------------

/**
 * Props for the TextField root.
 *
 * The composite owns its layout; pass `style`/`className` on a wrapping
 * element rather than on the composite root. See CONTRIBUTING §4.
 *
 * Authoring is a union: supply `label`/`description`/`errorMessage` for the
 * one-line form, **or** compose the slots as `children`. Mixing them is a type
 * error rather than a precedence rule.
 */
export type TextFieldProps = Omit<
  RACTextFieldProps,
  'style' | 'className' | 'children'
> &
  FieldAuthoring<RACTextFieldProps['children']>;

/**
 * A semantic text input composite built on React Aria's `TextField`.
 *
 * Validation feedback is driven by React Aria's `isInvalid` prop or `validate`
 * callback and surfaces on the control, the label and the validation message
 * via the `invalid` token State (ADR-017).
 *
 * Two ways to author it, and the type system allows exactly one at a time:
 *
 * @example One line — the common field.
 * ```tsx
 * <TextField
 *   label="Email"
 *   name="email"
 *   type="email"
 *   isRequired
 *   description="We never share your email."
 * />
 * ```
 *
 * @example Composed — when the arrangement is unusual.
 * ```tsx
 * <TextField isRequired>
 *   <TextFieldLabel>Email</TextFieldLabel>
 *   <TextFieldControl type="email" />
 *   <TextFieldDescription>We never share your email.</TextFieldDescription>
 *   <TextFieldError />
 * </TextField>
 * ```
 *
 * In the one-line form the validation message is always mounted, so a field
 * with no `errorMessage` still shows the browser's own constraint message —
 * which is the better copy for `isRequired` and `type="email"`, and is already
 * localized by the platform.
 */
export const TextField = ({
  children,
  label,
  description,
  errorMessage,
  placeholder,
  ...props
}: TextFieldProps) => {
  return (
    <RACTextField
      {...props}
      data-scope="text-field"
      data-part="root"
      style={buildFieldRootStyle()}
    >
      {(values) => {
        return (
          <textFieldScope.Provider value={{ isRequired: values.isRequired }}>
            {children === undefined ? (
              <>
                {label !== undefined && (
                  <TextFieldLabel>{label}</TextFieldLabel>
                )}
                <TextFieldControl placeholder={placeholder} />
                {description !== undefined && (
                  <TextFieldDescription>{description}</TextFieldDescription>
                )}
                <TextFieldError>{errorMessage}</TextFieldError>
              </>
            ) : typeof children === 'function' ? (
              children(values)
            ) : (
              children
            )}
          </textFieldScope.Provider>
        );
      }}
    </RACTextField>
  );
};
TextField.displayName = textFieldMeta.displayName;
