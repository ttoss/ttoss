import { Switch, type SwitchProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField, type FormFieldProps } from './FormField';

export type FormFieldSwitchProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldProps<TFieldValues, TName> & Omit<SwitchProps, 'name'>;

export const FormFieldSwitch = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  disabled,
  ...props
}: FormFieldSwitchProps<TFieldValues, TName>) => {
  const {
    label,
    name,
    tooltip,
    inputTooltip,
    warning,
    sx,
    css,
    rules,
    id,
    defaultValue,
    ...switchProps
  } = props;

  return (
    <FormField
      id={id}
      label={label}
      name={name}
      tooltip={tooltip}
      inputTooltip={inputTooltip}
      warning={warning}
      sx={sx}
      css={css}
      defaultValue={defaultValue}
      rules={rules}
      disabled={disabled}
      render={({ field, fieldState }) => {
        return (
          <Switch
            {...switchProps}
            {...field}
            disabled={disabled}
            aria-invalid={!!fieldState.error}
          />
        );
      }}
    />
  );
};
