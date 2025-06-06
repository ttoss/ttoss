import { Textarea, type TextareaProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from './FormField';
import { WarningTooltipProps } from './FormWarningMessage';

export const FormFieldTextarea = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  warning,
  warningMaxLines,
  sx,
  ...textareaProps
}: {
  label?: string;
  name: TName;
  warning?: string | React.ReactNode;
  warningMaxLines?: number;
  warningTooltip?: WarningTooltipProps;
} & TextareaProps) => {
  const id = `form-field-textarea-${name}`;

  return (
    <FormField
      label={label}
      name={name}
      id={id}
      sx={sx}
      warning={warning}
      warningMaxLines={warningMaxLines}
      warningTooltip={textareaProps.warningTooltip}
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
