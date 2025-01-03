import {
  FormFieldNumericFormat,
  FormFieldNumericFormatProps,
} from './FormFieldNumericFormat';

export type FormFieldCurrencyInputProps = {
  label?: string;
  name: string;
  prefix: string;
} & FormFieldNumericFormatProps;

export const FormFieldCurrencyInput = ({
  label,
  name,
  prefix,
  decimalSeparator,
  thousandSeparator,
  ...formFieldNumericFormatProps
}: FormFieldCurrencyInputProps) => {
  return (
    <FormFieldNumericFormat
      name={name}
      label={label}
      warning={formFieldNumericFormatProps.warning}
      warningMessage={formFieldNumericFormatProps.warningMessage}
      fixedDecimalScale
      decimalScale={2}
      prefix={prefix}
      decimalSeparator={decimalSeparator}
      thousandSeparator={thousandSeparator}
      placeholder={`${prefix} 0${decimalSeparator}00`}
      allowNegative={false}
      {...formFieldNumericFormatProps}
    />
  );
};
