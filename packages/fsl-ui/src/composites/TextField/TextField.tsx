import { vars } from '@ttoss/fsl-theme/vars';
import * as React from 'react';
import {
  type FieldErrorProps as RACFieldErrorProps,
  Input as RACInput,
  type InputProps as RACInputProps,
  type LabelProps as RACLabelProps,
  TextField as RACTextField,
  type TextFieldProps as RACTextFieldProps,
  type TextProps as RACTextProps,
} from 'react-aria-components';
import { Group as RACGroup } from 'react-aria-components';

import {
  buildFieldFrameStyle,
  buildFieldRootStyle,
  buildFieldValueStyle,
  type FieldAuthoring,
  FieldDescriptionPart,
  FieldInvalidGlyph,
  FieldLabelPart,
  type FieldLabelPartProps,
  FieldValidationMessagePart,
  useFieldLayout,
} from '../../components/Field/anatomy';
import {
  applyFieldFormat,
  type FieldFormat,
  fieldFormatInputProps,
  nextFieldFormatValue,
} from '../../components/Field/formats';
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
const textFieldScope = createCompositeScope<{
  isRequired: boolean;
  /** The active field format — the control resolves its input attributes from it. */
  format?: FieldFormat;
}>('TextField');

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
export type TextFieldLabelProps = Omit<RACLabelProps, 'style' | 'className'> &
  Pick<FieldLabelPartProps, 'contextualHelp'>;

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
 * The control slot of a TextField — since forms item H, the **split** shape:
 * a painted frame hosting a borderless input, the same anatomy the rest of
 * the family (`SearchField`, `NumberField`, `ComboBox`) already had. The
 * conversion is what gives the field a lawful home for in-box adornments —
 * the validation glyph today, `prefix`/`suffix` when a consumer pulls them —
 * instead of the reserved-padding-and-absolute-positioning hack item D
 * deleted from `SearchField`. `data-part="control"` stays on the element the
 * user types into (ADR-022).
 */
export const TextFieldControl = (props: TextFieldControlProps) => {
  const { format } = textFieldScope.use(textFieldControlMeta.displayName);
  const colors = vars.colors.input.primary;
  const { labelPosition } = useFieldLayout();

  // A format resolves the keyboard and the autofill token together with its
  // mask — declaring them separately at each call site is how they drift.
  // Caller-supplied attributes still win.
  const formatProps = format === undefined ? {} : fieldFormatInputProps(format);

  return (
    <RACGroup
      data-scope="text-field"
      data-part="frame"
      style={({ isHovered, isDisabled, isFocusVisible, isInvalid }) => {
        return buildFieldFrameStyle({
          colors,
          labelPosition,
          isHovered,
          isDisabled,
          isFocusVisible,
          isInvalid,
        });
      }}
    >
      {({ isInvalid }) => {
        return (
          <>
            <RACInput
              {...formatProps}
              {...props}
              data-scope="text-field"
              data-part="control"
              style={({ isHovered, isDisabled, isInvalid }) => {
                return buildFieldValueStyle({
                  colors,
                  isHovered,
                  isDisabled,
                  isInvalid,
                });
              }}
            />
            <FieldInvalidGlyph scope="text-field" isInvalid={isInvalid} />
          </>
        );
      }}
    </RACGroup>
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
> & {
  /**
   * A registered input format (`br.cpf`, `br.cep`, …) — resolves the mask,
   * the touch keyboard (`inputMode`) and the autofill token together
   * (ADR-026). The submitted value is the **masked** string; validation
   * (a CPF's checksum, say) stays with the caller's `validate`, because a
   * validate message is user-facing copy this package cannot ship (ADR-001).
   * Available in both authoring forms — it shapes the control's behaviour,
   * not the envelope's arrangement.
   */
  format?: FieldFormat;
} & FieldAuthoring<RACTextFieldProps['children']>;

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
  contextualHelp,
  description,
  errorMessage,
  placeholder,
  format,
  ...props
}: TextFieldProps) => {
  const { labelPosition } = useFieldLayout();
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  // --- format engine (ADR-026) -------------------------------------------
  // With a format the field runs controlled internally: the mask is applied
  // on every change and the caret restored by DIGIT position, so a literal
  // the mask inserts to the caret's left cannot displace it. The caret is
  // read from the control at event time and written back after commit —
  // React resets a controlled input's caret when its value is replaced.
  const [inner, setInner] = React.useState(() => {
    return format === undefined
      ? ''
      : applyFieldFormat(format, props.defaultValue ?? '');
  });
  const pendingCaret = React.useRef<number | null>(null);
  const controlOf = (node: HTMLElement | null) => {
    return node?.querySelector<HTMLInputElement>('[data-part="control"]');
  };

  const masked =
    format === undefined
      ? undefined
      : props.value !== undefined
        ? applyFieldFormat(format, props.value)
        : inner;

  const handleChange = (next: string) => {
    if (format === undefined) {
      props.onChange?.(next);
      return;
    }
    const input = controlOf(rootRef.current);
    const { value, caret } = nextFieldFormatValue({
      format,
      raw: next,
      rawCaret: input?.selectionStart ?? next.length,
      previous: masked ?? '',
    });
    pendingCaret.current = caret;
    if (props.value === undefined) setInner(value);
    props.onChange?.(value);
  };

  React.useLayoutEffect(() => {
    if (pendingCaret.current === null) return;
    const input = controlOf(rootRef.current);
    input?.setSelectionRange(pendingCaret.current, pendingCaret.current);
    pendingCaret.current = null;
  });

  const formatProps =
    format === undefined
      ? {}
      : { value: masked, defaultValue: undefined, onChange: handleChange };
  // ------------------------------------------------------------------------

  return (
    <RACTextField
      {...props}
      {...formatProps}
      ref={rootRef}
      data-scope="text-field"
      data-part="root"
      style={buildFieldRootStyle({ labelPosition })}
    >
      {(values) => {
        return (
          <textFieldScope.Provider
            value={{ isRequired: values.isRequired, format }}
          >
            {children === undefined ? (
              <>
                {label !== undefined && (
                  <TextFieldLabel contextualHelp={contextualHelp}>
                    {label}
                  </TextFieldLabel>
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
