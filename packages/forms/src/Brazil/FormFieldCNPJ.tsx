import {
  FormFieldPatternFormat,
  FormFieldPatternFormatProps,
} from '../FormFieldPatternFormat';

export type FormFieldCNPJProps = {
  label: string;
  name: string;
} & Partial<FormFieldPatternFormatProps>;

export const FormFieldCNPJ = ({
  label,
  name,
  ...formFieldPatternFormatProps
}: FormFieldCNPJProps) => {
  return (
    <FormFieldPatternFormat
      name={name}
      label={label}
      format="##.###.###/####-##"
      placeholder="12.345.678/0000-00"
      {...formFieldPatternFormatProps}
    />
  );
};
