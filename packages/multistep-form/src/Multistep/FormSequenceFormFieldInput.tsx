import { FormFieldInput } from '@ttoss/forms';
import { MultistepFormFieldsBase } from './types';

export type MultistepFormFieldInputProps = MultistepFormFieldsBase & {
  variant: 'input';
  label: string;
  defaultValue?: string;
};

export const MultistepFormFieldInput = ({
  defaultValue,
  label,
  fieldName,
}: MultistepFormFieldInputProps) => {
  return (
    <FormFieldInput
      defaultValue={defaultValue}
      name={fieldName}
      label={label}
    />
  );
};
