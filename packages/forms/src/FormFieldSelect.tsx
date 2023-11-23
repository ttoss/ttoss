import { FieldPath, FieldValues } from 'react-hook-form';
import { FormField, FormFieldProps } from './FormField';
import { Select, SelectOption, type SelectProps } from '@ttoss/ui';

type FormFieldSelectProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<SelectProps, 'defaultValue'> & FormFieldProps<TFieldValues, TName>;

export const FormFieldSelect = <
  TFieldValues extends FieldValues = FieldValues,
>({
  label,
  name,
  id,
  defaultValue,
  sx,
  css,
  disabled,
  tooltip,
  onTooltipClick,
  ...selectProps
}: FormFieldSelectProps<TFieldValues>) => {
  return (
    <FormField
      name={name}
      label={label}
      id={id}
      defaultValue={defaultValue}
      disabled={disabled}
      tooltip={tooltip}
      onTooltipClick={onTooltipClick}
      sx={sx}
      css={css}
      render={({ field, fieldState }) => {
        const value = selectProps.options?.find((option) => {
          if ('value' in option) {
            return option.value === field.value;
          }

          return false;
        }) as SelectOption | undefined;

        return (
          <Select
            {...selectProps}
            {...field}
            isDisabled={disabled}
            defaultValue={value}
            value={value}
            onChange={(value) => {
              field.onChange(value?.value);
            }}
            aria-invalid={fieldState.error ? 'true' : undefined}
          />
        );
      }}
    />
  );
};
