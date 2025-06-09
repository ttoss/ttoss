import { Textarea, type TextareaProps } from '@ttoss/ui';
import { FieldPath, FieldValues } from 'react-hook-form';

import { FeedbackTooltipProps } from './FormFeedbackMessage';
import { FormField } from './FormField';

export const FormFieldTextarea = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  name,
  feedbackMessage,
  feedbackMaxLines,
  feedbackTooltipProps,
  feedbackVariant,
  feedbackTooltipLabel,
  sx,
  ...textareaProps
}: {
  label?: string;
  name: TName;
  feedbackMessage?: string | React.ReactNode;
  feedbackMaxLines?: number;
  feedbackTooltipProps?: FeedbackTooltipProps;
  feedbackVariant?: 'error' | 'warning' | 'info' | 'success';
  feedbackTooltipLabel?: string;
} & TextareaProps) => {
  const id = `form-field-textarea-${name}`;

  return (
    <FormField
      label={label}
      name={name}
      id={id}
      sx={sx}
      feedbackMessage={feedbackMessage}
      feedbackMaxLines={feedbackMaxLines}
      feedbackTooltipProps={feedbackTooltipProps}
      feedbackVariant={feedbackVariant}
      feedbackTooltipLabel={feedbackTooltipLabel}
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
