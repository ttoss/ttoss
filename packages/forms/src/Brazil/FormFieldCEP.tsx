import {
  FormFieldPatternFormat,
  FormFieldPatternFormatProps,
} from '../FormFieldPatternFormat';

export type FormFieldCEPProps = {
  label: string;
  name: string;
} & Partial<FormFieldPatternFormatProps>;

export const FormFieldCEP = ({
  label,
  name,
  ...formFieldPatternFormatProps
}: FormFieldCEPProps) => {
  return (
    <FormFieldPatternFormat
      name={name}
      label={label}
      format="#####-###"
      placeholder="12345-678"
      {...formFieldPatternFormatProps}
    />
  );
};
