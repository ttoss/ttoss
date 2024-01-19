import { FormFieldInput } from '@ttoss/forms';
import { FormSequenceFormFieldsBase } from './types';

export type FormSequenceFormFieldInputProps = FormSequenceFormFieldsBase & {
  type: 'input';
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
