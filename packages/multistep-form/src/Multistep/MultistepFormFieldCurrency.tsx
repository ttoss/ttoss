import { FormFieldCurrencyInput } from '@ttoss/forms';
import { MultistepFormFieldsBase } from './types';

export type MultistepFormFieldCurrencyProps = MultistepFormFieldsBase & {
  variant: 'currency';
  label: string;
  defaultValue?: number;
};

export const MultistepFormFieldCurrency = ({
  defaultValue,
  label,
  fieldName,
}: MultistepFormFieldCurrencyProps) => {
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
