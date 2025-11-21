import { useI18n } from '@ttoss/react-i18n';
import type { FieldPath, FieldValues } from 'react-hook-form';

import {
  FormFieldNumericFormat,
  type FormFieldNumericFormatProps,
} from './FormFieldNumericFormat';
import { getNumberFormatSeparators } from './getNumberFormatSeparators';

export type FormFieldCurrencyInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldNumericFormatProps<TFieldValues, TName> & {
  prefix: string;
};

export const FormFieldCurrencyInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  prefix,
  decimalSeparator,
  thousandSeparator,
  ...formFieldNumericFormatProps
}: FormFieldCurrencyInputProps<TFieldValues, TName>) => {
  const { locale } = useI18n();

  const separators = getNumberFormatSeparators(locale || 'en');

  const finalDecimalSeparator = decimalSeparator || separators.decimalSeparator;
  const finalThousandSeparator =
    thousandSeparator || separators.thousandSeparator;

  // Remove trailing space from prefix if it exists for placeholder generation
  const prefixForPlaceholder = prefix.trimEnd();

  return (
    <FormFieldNumericFormat
      fixedDecimalScale
      decimalScale={2}
      prefix={prefix}
      decimalSeparator={finalDecimalSeparator}
      thousandSeparator={finalThousandSeparator}
      placeholder={`${prefixForPlaceholder} 0${finalDecimalSeparator}00`}
      allowNegative={false}
      {...formFieldNumericFormatProps}
    />
  );
};
