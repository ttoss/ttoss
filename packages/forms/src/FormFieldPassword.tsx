import { ErrorMessage } from './ErrorMessage';
import { FieldPath, FieldValues, useController } from 'react-hook-form';
import {
  Flex,
  InputPassword,
  type InputPasswordProps,
  Label,
  type LabelProps,
} from '@ttoss/ui';

export type FormFieldPasswordProps<TName> = {
  label?: string;
  name: TName;
} & InputPasswordProps &
  Pick<LabelProps, 'tooltip' | 'onTooltipClick'>;

export const FormFieldPassword = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  label,
  name,
  tooltip,
  onTooltipClick,
  sx,
  ...inputProps
}: FormFieldPasswordProps<TName>) => {
  const {
    field: { onChange, onBlur, value, ref },
    formState: { errors },
  } = useController<any>({
    name,
    defaultValue: '',
  });

  const id = `form-field-password-${name}`;

  const hasError = !!errors[name]?.message;

  return (
    <Flex sx={{ flexDirection: 'column', width: '100%', ...sx }}>
      {label && (
        <Label
          aria-disabled={inputProps.disabled}
          htmlFor={id}
          tooltip={tooltip}
          onTooltipClick={onTooltipClick}
        >
          {label}
        </Label>
      )}

      <InputPassword
        ref={ref}
        onChange={onChange}
        className={hasError ? 'error' : ''}
        onBlur={onBlur}
        value={value}
        name={name}
        id={id}
        {...inputProps}
      />

      <ErrorMessage name={name} />
    </Flex>
  );
};
