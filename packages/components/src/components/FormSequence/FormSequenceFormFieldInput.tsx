import { FormFieldInput } from '@ttoss/forms';
import { FormSequenceFormFieldsBase } from './types';

export type FormSequenceFormFieldInputProps = FormSequenceFormFieldsBase & {
  variant: 'input';
  label: string;
  defaultValue?: string;
};

export const FormSequenceFormFieldInput = ({
  defaultValue,
  label,
  fieldName,
}: FormSequenceFormFieldInputProps) => {
  return (
    <FormFieldInput
      defaultValue={defaultValue}
      name={fieldName}
      label={label}
    />
  );
};
