import {
  Textarea,
  type TextareaProps,
  Theme,
  ThemeUIStyleObject,
} from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FormField } from './FormField';

export const FormFieldTextarea = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  warning,
  inputTooltip,
  sx,
  ...textareaProps
}: {
  label?: string;
  name: TName;
  warning?: string | React.ReactNode;
  inputTooltip?: {
    render: string | React.ReactNode;
    place: 'bottom' | 'top' | 'left' | 'right';
    openOnClick?: boolean;
    clickable?: boolean;
    variant?: 'info' | 'warning' | 'success' | 'error';
    sx?: ThemeUIStyleObject<Theme>;
  };
} & TextareaProps) => {
  const id = `form-field-textarea-${name}`;

  return (
    <FormField
      label={label}
      name={name}
      id={id}
      sx={sx}
      warning={warning}
      inputTooltip={inputTooltip}
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
