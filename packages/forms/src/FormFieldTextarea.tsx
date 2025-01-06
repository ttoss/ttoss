import { Textarea, type TextareaProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from './FormField';

export const FormFieldTextarea = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  warning,

  sx,
  ...textareaProps
}: {
  label?: string;
  name: TName;
  warning?: string;
} & TextareaProps) => {
  const id = `form-field-textarea-${name}`;

  return (
    <FormField
      label={label}
      name={name}
      id={id}
      sx={sx}
      warning={warning}
      render={({ field, fieldState }) => {
        return (
          <Textarea
            {...field}
            {...textareaProps}
            aria-invalid={fieldState.error ? 'true' : undefined}
          />
        );
      }}
    />
  );
};
