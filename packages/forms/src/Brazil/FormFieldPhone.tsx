import { Input, SxProp, Theme, ThemeUIStyleObject } from '@ttoss/ui';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { FormField } from '../FormField';

export type FormFieldPhoneProps = {
  label: string;
  name: string;
  warning?: string | React.ReactNode;
  inputTooltip?: {
    render: string | React.ReactNode;
    place: 'bottom' | 'top' | 'left' | 'right';
    openOnClick?: boolean;
    clickable?: boolean;
    variant?: 'info' | 'warning' | 'success' | 'error';
    sx?: ThemeUIStyleObject<Theme>;
  } & SxProp;
} & Partial<PatternFormatProps>;

export const FormFieldPhone = ({
  label,
  name,
  ...patternFormatProps
}: FormFieldPhoneProps) => {
  return (
    <FormField
      name={name}
      label={label}
      warning={patternFormatProps.warning}
      inputTooltip={patternFormatProps.inputTooltip}
      render={({ field }) => {
        const format =
          field.value?.length > 10 ? '(##) #####-####' : '(##) ####-#####';

        return (
          <PatternFormat
            name={field.name}
            value={field.value}
            onBlur={field.onBlur}
            onValueChange={(values) => {
              field.onChange(values.value);
            }}
            format={format}
            customInput={Input}
            placeholder="(11) 91234-1234"
            {...patternFormatProps}
          />
        );
      }}
    />
  );
};
