import {
  FormFieldPatternFormat,
  FormFieldPatternFormatProps,
} from './FormFieldPatternFormat';

export type FormFieldCreditCardNumberProps = {
  label: string;
  name: string;
} & Partial<FormFieldPatternFormatProps>;

export const FormFieldCreditCardNumber = ({
  label,
  name,
  ...formFieldPatternFormatProps
}: FormFieldCreditCardNumberProps) => {
  return (
    <FormFieldPatternFormat
      name={name}
      label={label}
      warning={formFieldPatternFormatProps.warning}
      format="#### #### #### ####"
      placeholder="1234 1234 1234 1234"
      {...formFieldPatternFormatProps}
    />
  );
};
