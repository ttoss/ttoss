import { SegmentedControl, type SegmentedControlProps } from '@ttoss/ui';
import type { FieldPath, FieldPathValue, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export type FormFieldSegmentedControlProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> &
  Omit<SegmentedControlProps, 'value' | 'className'>;

export const FormFieldSegmentedControl = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  defaultValue = '' as FieldPathValue<TFieldValues, TName>,
  disabled,
  ...props
}: FormFieldSegmentedControlProps<TFieldValues, TName>) => {
  const {
    label,
    name,
    labelTooltip,
    warning,
    sx: fieldSx,
    css,
    rules,
    id,
    unsavedChangesGuard,
    auxiliaryCheckbox,
    onChange,
    variant = 'secondary',
    ...segmentedProps
  } = props;

  return (
    <FormField
      id={id}
      label={label}
      name={name}
      labelTooltip={labelTooltip}
      warning={warning}
      sx={fieldSx}
      css={css}
      defaultValue={defaultValue}
      rules={rules}
      disabled={disabled}
      unsavedChangesGuard={unsavedChangesGuard}
      auxiliaryCheckbox={auxiliaryCheckbox}
      render={({ field, fieldState }) => {
        return (
          <SegmentedControl
            {...segmentedProps}
            {...field}
            variant={variant}
            value={field.value}
            onChange={(v: string | number) => {
              field.onChange(v);
              onChange?.(v);
            }}
            disabled={disabled ?? field.disabled}
            aria-invalid={fieldState.error ? 'true' : undefined}
          />
        );
      }}
    />
  );
};

export default FormFieldSegmentedControl;
