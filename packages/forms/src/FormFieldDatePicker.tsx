import { DatePicker, type DateRange } from '@ttoss/components/DatePicker';
import type { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export interface DateRangePreset {
  label: string;
  getValue: () => DateRange;
}

export type FormFieldDatePickerProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> & {
  presets?: DateRangePreset[];
};

export const FormFieldDatePicker = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: FormFieldDatePickerProps<TFieldValues, TName>) => {
  const {
    label,
    name,
    labelTooltip,
    warning,
    sx,
    css,
    rules,
    id,
    defaultValue,
    presets,
    unsavedChangesGuard,
    disabled,
    ...datePickerProps
  } = props;

  return (
    <FormField
      id={id}
      label={label}
      name={name}
      labelTooltip={labelTooltip}
      warning={warning}
      sx={sx}
      css={css}
      defaultValue={defaultValue}
      rules={rules}
      disabled={disabled}
      unsavedChangesGuard={unsavedChangesGuard}
      render={({ field }) => {
        return (
          <DatePicker
            {...datePickerProps}
            disabled={disabled}
            value={field.value as DateRange | undefined}
            onChange={(range: DateRange | undefined) => {
              field.onChange(range);
            }}
            presets={presets}
          />
        );
      }}
    />
  );
};
