import { FormFieldRadio } from '@ttoss/forms';
import { FormSequenceFormFieldsBase } from './types';

export type FormSequenceFormFieldRadioProps = FormSequenceFormFieldsBase & {
  type: 'radio';
  defaultValue?: string;
  options: {
    label: string;
    value: string;
    disabled?: boolean;
  }[];
};

export const FormSequenceFormFieldRadio = ({
  options,
  defaultValue,
  fieldName,
}: FormSequenceFormFieldRadioProps) => {
  return (
    <FormFieldRadio
      name={fieldName}
      options={options}
      defaultValue={defaultValue}
    />
  );
};
