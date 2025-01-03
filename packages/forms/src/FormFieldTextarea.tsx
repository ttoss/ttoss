import { FieldPath, FieldValues } from 'react-hook-form';
import { FormField } from './FormField';
import { Textarea, type TextareaProps } from '@ttoss/ui';

export const FormFieldTextarea = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  sx,
  ...textareaProps
}: {
  label?: string;
  name: TName;
} & TextareaProps) => {
  const id = `form-field-textarea-${name}`;

  return (
    <FormField
      label={label}
      name={name}
      id={id}
      sx={sx}
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
