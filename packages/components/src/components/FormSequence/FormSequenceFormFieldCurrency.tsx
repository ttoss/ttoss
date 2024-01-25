import { FormFieldCurrencyInput } from '@ttoss/forms';
import { FormSequenceFormFieldsBase } from './types';

export type FormSequenceFormFieldCurrencyProps = FormSequenceFormFieldsBase & {
  variant: 'currency';
  label: string;
  defaultValue?: number;
};

export const FormSequenceFormFieldCurrency = ({
  defaultValue,
  label,
  fieldName,
}: FormSequenceFormFieldCurrencyProps) => {
  return (
    <FormFieldCurrencyInput
      defaultValue={defaultValue}
      decimalSeparator=","
      prefix="R$"
      thousandSeparator="."
      name={fieldName}
      label={label}
    />
  );
};
