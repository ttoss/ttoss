import {
  FormFieldPatternFormat,
  FormFieldPatternFormatProps,
} from '../FormFieldPatternFormat';

export type FormFieldPhoneProps = {
  label: string;
  name: string;
} & Partial<FormFieldPatternFormatProps>;

export const FormFieldPhone = ({
  label,
  name,
  ...formFieldPatternFormatProps
}: FormFieldPhoneProps) => {
  return (
    <FormFieldPatternFormat
      name={name}
      label={label}
      format={'(##) #####-####' || '(##) ####-#####'}
      placeholder="(11) 91234-1234"
      {...formFieldPatternFormatProps}
    />
  );
};
