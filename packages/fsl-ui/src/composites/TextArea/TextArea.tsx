import { vars } from '@ttoss/fsl-theme/vars';
import {
  type FieldErrorProps as RACFieldErrorProps,
  type LabelProps as RACLabelProps,
  TextArea as RACTextArea,
  type TextAreaProps as RACTextAreaProps,
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
  useFieldLayout,
} from '../../components/Field/anatomy';
import type { ComponentMeta } from '../../semantics';
import { createCompositeScope } from '../scope';

// ---------------------------------------------------------------------------
// Composite scope — presence-only host guard (same contract as TextField).
// ---------------------------------------------------------------------------

// Stateful rather than presence-only: the host now has something its parts
// need. The label cannot know the field is required — React Aria does not tell
// it — and the necessity marker belongs beside the label text, so the root
// publishes the flag from its own render props (the authoritative value, not the
// prop). `scope.ts`'s authoring rule: share state when there is state to share.
const textAreaScope = createCompositeScope<{ isRequired: boolean }>('TextArea');

// ---------------------------------------------------------------------------
// Semantic identity — Layer 1
//
// Entity = Input → CONTRACT.md §1 row (colors `input.primary`, radii
// `control`, border `outline.control`, spacing `inset.control`, typography
// `label`, motion `feedback`). TextArea is the multiline sibling of TextField:
// the same Input parts, with the control rendered as React Aria's `TextArea`
// (a `<textarea>`). Validation flows through the `invalid` State exactly as in
// TextField. `rows` is exposed for the initial height; vertical resize is
// enabled so the user can grow it.
// ---------------------------------------------------------------------------

/** Formal semantic identity — TextArea root (Input entity). */
export const textAreaMeta = {
  displayName: 'TextArea',
  entity: 'Input',
  structure: 'root',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — label slot. */
export const textAreaLabelMeta = {
  displayName: 'TextAreaLabel',
  entity: 'Input',
  structure: 'label',
  composition: 'label',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — control slot (the `<textarea>`). */
export const textAreaControlMeta = {
  displayName: 'TextAreaControl',
  entity: 'Input',
  structure: 'control',
  composition: 'control',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — description slot. */
export const textAreaDescriptionMeta = {
  displayName: 'TextAreaDescription',
  entity: 'Input',
  structure: 'description',
  composition: 'description',
} as const satisfies ComponentMeta<'Input'>;

/** Formal semantic identity — status slot (validation message). */
export const textAreaErrorMeta = {
  displayName: 'TextAreaError',
  entity: 'Input',
  structure: 'validationMessage',
  composition: 'status',
} as const satisfies ComponentMeta<'Input'>;

/**
 * Props for the TextArea root.
 *
 * `rows` is one-line-only, the same shape `placeholder` has: React Aria puts it
 * on the `<textarea>` and the composed form passes it to `TextAreaControl`
 * directly, so the props form is where it would otherwise be unreachable — which
 * it was until the Studio's settings form asked for a three-row description.
 */
export type TextAreaProps = Omit<
  RACTextFieldProps,
  'style' | 'className' | 'children'
> &
  FieldAuthoring<RACTextFieldProps['children'], { rows?: number }>;

/** Props for the TextArea label. */
export type TextAreaLabelProps = Omit<RACLabelProps, 'style' | 'className'>;

/** The label slot of a TextArea. */
export const TextAreaLabel = ({ children, ...props }: TextAreaLabelProps) => {
  const { isRequired } = textAreaScope.use(textAreaLabelMeta.displayName);
  const colors = vars.colors.input.primary;

  return (
    <FieldLabelPart
      {...props}
      scope="text-area"
      colors={colors}
      isRequired={isRequired}
    >
      {children}
    </FieldLabelPart>
  );
};
TextAreaLabel.displayName = textAreaLabelMeta.displayName;

/** Props for the TextArea control. */
export type TextAreaControlProps = Omit<
  RACTextAreaProps,
  'style' | 'className'
>;

/**
 * The control slot — the actual `<textarea>`. Surfaces the `invalid` State
 * via `vars.colors.input.primary.*`; vertical resize is enabled.
 */
export const TextAreaControl = (props: TextAreaControlProps) => {
  textAreaScope.use(textAreaControlMeta.displayName);
  const colors = vars.colors.input.primary;
  const { labelPosition } = useFieldLayout();

  return (
    <RACTextArea
      {...props}
      data-scope="text-area"
      data-part="control"
      style={({ isHovered, isDisabled, isFocusVisible, isInvalid }) => {
        return buildFieldControlStyle({
          colors,
          labelPosition,
          multiline: true,
          isHovered,
          isDisabled,
          isFocusVisible,
          isInvalid,
        });
      }}
    />
  );
};
TextAreaControl.displayName = textAreaControlMeta.displayName;

/** Props for the TextArea description. */
export type TextAreaDescriptionProps = Omit<
  RACTextProps,
  'style' | 'className' | 'slot'
>;

/** Helper/description text linked to the control. */
export const TextAreaDescription = (props: TextAreaDescriptionProps) => {
  textAreaScope.use(textAreaDescriptionMeta.displayName);
  const colors = vars.colors.input.primary;

  return <FieldDescriptionPart {...props} scope="text-area" colors={colors} />;
};
TextAreaDescription.displayName = textAreaDescriptionMeta.displayName;

/** Props for the TextArea error. */
export type TextAreaErrorProps = Omit<
  RACFieldErrorProps,
  'style' | 'className'
>;

/** Validation message — rendered by React Aria only when the field is invalid. */
export const TextAreaError = (props: TextAreaErrorProps) => {
  textAreaScope.use(textAreaErrorMeta.displayName);
  const colors = vars.colors.input.primary;

  return (
    <FieldValidationMessagePart {...props} scope="text-area" colors={colors} />
  );
};
TextAreaError.displayName = textAreaErrorMeta.displayName;

/**
 * A multiline text input composite (Input entity) — the multiline sibling of
 * `TextField`. Composes `TextAreaLabel`, `TextAreaControl`,
 * `TextAreaDescription`, and `TextAreaError`. Validation is driven by React
 * Aria's `isInvalid` / `validate`.
 *
 * @example
 * ```tsx
 * <TextArea isRequired>
 *   <TextAreaLabel>Notes</TextAreaLabel>
 *   <TextAreaControl rows={4} />
 *   <TextAreaError />
 * </TextArea>
 * ```
 */
export const TextArea = ({
  children,
  label,
  description,
  errorMessage,
  placeholder,
  rows,
  ...props
}: TextAreaProps) => {
  const { labelPosition } = useFieldLayout();

  return (
    <RACTextField
      {...props}
      data-scope="text-area"
      data-part="root"
      style={buildFieldRootStyle({ labelPosition })}
    >
      {(values) => {
        return (
          <textAreaScope.Provider value={{ isRequired: values.isRequired }}>
            {children === undefined ? (
              <>
                {label !== undefined && <TextAreaLabel>{label}</TextAreaLabel>}
                <TextAreaControl placeholder={placeholder} rows={rows} />
                {description !== undefined && (
                  <TextAreaDescription>{description}</TextAreaDescription>
                )}
                <TextAreaError>{errorMessage}</TextAreaError>
              </>
            ) : typeof children === 'function' ? (
              children(values)
            ) : (
              children
            )}
          </textAreaScope.Provider>
        );
      }}
    </RACTextField>
  );
};
TextArea.displayName = textAreaMeta.displayName;
