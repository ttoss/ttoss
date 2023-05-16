import { FieldPath, FieldPathValue, FieldValues } from 'react-hook-form';
import { FormField, FormFieldProps } from './FormField';
import { Select, type SelectProps } from '@ttoss/ui';

type FormRadioOption = {
  value: string | number;
  label: string;
};

type SelectSwitchProps =
  | (SelectProps & { placeholder?: never })
  | (SelectProps & { defaultValue?: never });

const checkDefaultValue = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>(
  options: Array<FormRadioOption>,
  defaultValue?: FieldPathValue<TFieldValues, TName>,
  placeholder?: string
): FieldPathValue<TFieldValues, TName> => {
  if (defaultValue) {
    return defaultValue;
  }

  const hasEmptyValue = options.some((opt) => {
    return opt.value === '' || opt.value === 0;
  });

  const EMPTY_VALUE = '' as FieldPathValue<TFieldValues, TName>;

  if (placeholder && hasEmptyValue) {
    return EMPTY_VALUE;
  }

  if (placeholder && !hasEmptyValue) {
    options.unshift({
      label: placeholder,
      value: '',
    });
    return EMPTY_VALUE;
  }

  if (!placeholder && defaultValue) return EMPTY_VALUE;
  if (options.length === 0) return EMPTY_VALUE;

  return options?.[0]?.value as FieldPathValue<TFieldValues, TName>;
};

type FormFieldSelectProps<
  TFieldValues extends FieldValues,
  TName extends FieldPath<TFieldValues>
> = SelectSwitchProps &
  FormFieldProps & {
    label?: string;
    name: FieldPath<TFieldValues>;
    options: FormRadioOption[];
    defaultValue?: FieldPathValue<TFieldValues, TName>;
  };

export const FormFieldSelect = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  label,
  name,
  options,
  sx,
  ...selectProps
}: FormFieldSelectProps<TFieldValues, TName>) => {
  const { defaultValue, placeholder } = selectProps;

  const checkedDefaultValue = checkDefaultValue<TFieldValues, TName>(
    options,
    defaultValue,
    placeholder
  );

  return (
    <FormField
      name={name}
      label={label}
      disabled={selectProps.disabled}
      tooltip={selectProps.tooltip}
      onTooltipClick={selectProps.onTooltipClick}
      sx={sx}
      defaultValue={checkedDefaultValue}
      render={({ field }) => {
        return (
          <Select
            {...selectProps}
            {...field}
            {...{ ...selectProps, defaultValue: undefined }}
          >
            {options.map((option) => {
              return (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              );
            })}
          </Select>
        );
      }}
    />
  );
};
