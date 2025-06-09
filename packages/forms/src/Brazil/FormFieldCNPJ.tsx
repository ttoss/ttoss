import { Input } from '@ttoss/ui';
import { PatternFormat, PatternFormatProps } from 'react-number-format';

import { FormField } from '..';
import { FeedbackTooltipProps } from '../FormFeedbackMessage';

export type FormFieldCNPJProps = {
  label: string;
  name: string;
  feedbackMessage?: string | React.ReactNode;
  feedbackMaxLines?: number;
  feedbackTooltipProps?: FeedbackTooltipProps;
  feedbackVariant?: 'error' | 'warning' | 'info' | 'success';
} & Partial<PatternFormatProps>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isCnpjValid = (cnpj: any) => {
  if (cnpj?.length != 14) {
    return false;
  }

  if (
    cnpj == '00000000000000' ||
    cnpj == '11111111111111' ||
    cnpj == '22222222222222' ||
    cnpj == '33333333333333' ||
    cnpj == '44444444444444' ||
    cnpj == '55555555555555' ||
    cnpj == '66666666666666' ||
    cnpj == '77777777777777' ||
    cnpj == '88888888888888' ||
    cnpj == '99999999999999'
  ) {
    return false;
  }

  // Valida DVs
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let soma = 0;
  let pos = size - 7;
  for (let i = size; i >= 1; i--) {
    soma += numbers.charAt(size - i) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  let result = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (result != digits.charAt(0)) {
    return false;
  }

  size = size + 1;
  numbers = cnpj.substring(0, size);
  soma = 0;
  pos = size - 7;
  for (let i = size; i >= 1; i--) {
    soma += numbers.charAt(size - i) * pos--;
    if (pos < 2) {
      pos = 9;
    }
  }
  result = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (result != digits.charAt(1)) {
    return false;
  }

  return true;
};

export const FormFieldCNPJ = ({
  label,
  name,
  ...patternFormatProps
}: FormFieldCNPJProps) => {
  return (
    <FormField
      name={name}
      label={label}
      feedbackMessage={patternFormatProps.feedbackMessage}
      feedbackMaxLines={patternFormatProps.feedbackMaxLines}
      feedbackTooltipProps={patternFormatProps.feedbackTooltipProps}
      feedbackVariant={patternFormatProps.feedbackVariant}
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
