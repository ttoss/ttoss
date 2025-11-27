import { Checkbox, Flex, Label } from '@ttoss/ui';
import * as React from 'react';
import {
  type FieldPath,
  type FieldPathValue,
  type FieldValues,
  type RegisterOptions,
  useController,
} from 'react-hook-form';

type AuxiliaryCheckboxRules<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<
  RegisterOptions<TFieldValues, TName>,
  'valueAsNumber' | 'valueAsDate' | 'setValueAs' | 'disabled'
>;

/**
 * Props for the AuxiliaryCheckbox component.
 */
export type AuxiliaryCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  /**
   * The label to display next to the checkbox.
   */
  label: React.ReactNode;
  /**
   * The name of the checkbox field in the form.
   */
  name: TName;
  /**
   * The default value of the checkbox.
   * @default false
   */
  defaultValue?: boolean;
  /**
   * Validation rules for the checkbox field.
   */
  rules?: AuxiliaryCheckboxRules<TFieldValues, TName>;
  /**
   * Whether the checkbox is disabled.
   */
  disabled?: boolean;
};

/**
 * AuxiliaryCheckbox component renders a checkbox with its own form controller.
 *
 * This component is useful for adding a secondary checkbox to a FormField,
 * such as for input confirmation or conditional display of other fields.
 *
 * @example
 * ```tsx
 * <AuxiliaryCheckbox
 *   name="confirmEmail"
 *   label="I confirm this is my email address"
 * />
 * ```
 *
 * @example
 * ```tsx
 * <AuxiliaryCheckbox
 *   name="showAdvanced"
 *   label="Show advanced options"
 *   defaultValue={false}
 *   rules={{ required: 'You must confirm this option' }}
 * />
 * ```
 */
export const AuxiliaryCheckbox = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  defaultValue = false,
  rules,
  disabled,
}: AuxiliaryCheckboxProps<TFieldValues, TName>) => {
  const uniqueId = React.useId();
  const id = `auxiliary-checkbox-${name}-${uniqueId}`;

  const { field } = useController<TFieldValues, TName>({
    name,
    defaultValue: defaultValue as FieldPathValue<TFieldValues, TName>,
    rules,
  });

  const isDisabled = disabled ?? field.disabled;

  const { value, ...fieldWithoutValue } = field;

  return (
    <Label
      aria-disabled={isDisabled}
      htmlFor={id}
      sx={{
        flexDirection: 'row',
        alignItems: 'center',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      <Flex
        sx={{
          position: 'relative',
        }}
      >
        <Checkbox
          id={id}
          {...fieldWithoutValue}
          checked={value}
          disabled={isDisabled}
        />
      </Flex>
      {label}
    </Label>
  );
};
