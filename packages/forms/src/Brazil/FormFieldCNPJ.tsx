import { FormField } from '..';
import { Input } from '@ttoss/ui';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

export type FormFieldCNPJProps = {
  label: string;
  name: string;
} & Partial<PatternFormatProps>;

export const FormFieldCNPJ = ({
  label,
  name,
  ...patternFormatProps
}: FormFieldCNPJProps) => {
  return (
    <FormField
      name={name}
      label={label}
      render={({ field }) => {
        return (
          <PatternFormat
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onValueChange={(values) => {
              field.onChange(values.value);
            }}
            format={'##.###.###/####-##'}
            customInput={Input}
            placeholder="12.345.678/0000-00"
            {...patternFormatProps}
          />
        );
      }}
    />
  );
};
