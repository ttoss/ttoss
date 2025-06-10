import { Textarea, type TextareaProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { TooltipProps } from './FormFeedbackMessage';
import { FormField } from './FormField';

export const FormFieldTextarea = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  feedback,
  sx,
  ...textareaProps
}: {
  label?: string;
  name: TName;
  feedback?:
    | {
        message?: string | React.ReactNode;
        maxLines?: number;
        tooltipProps?: TooltipProps;
        variant?: 'success' | 'warning' | 'error' | 'info';
      }
    | string;
} & TextareaProps) => {
  const id = `form-field-textarea-${name}`;

  return (
    <FormField
      label={label}
      name={name}
      id={id}
      sx={sx}
      feedback={feedback}
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
