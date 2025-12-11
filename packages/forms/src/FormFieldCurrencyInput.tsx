import { defineMessages, useI18n } from '@ttoss/react-i18n';
import type { TooltipProps } from '@ttoss/ui';
import type { FieldPath, FieldValues } from 'react-hook-form';

import {
  FormFieldNumericFormat,
  type FormFieldNumericFormatProps,
} from './FormFieldNumericFormat';

const messages = defineMessages({
  decimalSeparator: {
    defaultMessage: '.',
    description:
      'Decimal separator for currency formatting (e.g., "." for 1.23 or "," for 1,23)',
  },
  thousandSeparator: {
    defaultMessage: ',',
    description:
      'Thousand separator for currency formatting (e.g., "," for 1,000 or "." for 1.000)',
  },
});

export type FormFieldCurrencyInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = FormFieldNumericFormatProps<TFieldValues, TName> & {
  prefix: string;
  /** Optional tooltip content or props for the field label */
  tooltip?: string | TooltipProps;
};

export const FormFieldCurrencyInput = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  prefix,
  decimalSeparator,
  thousandSeparator,
  tooltip,
  ...formFieldNumericFormatProps
}: FormFieldCurrencyInputProps<TFieldValues, TName>) => {
  const { intl } = useI18n();

  const finalDecimalSeparator =
    decimalSeparator ?? intl.formatMessage(messages.decimalSeparator);
  const finalThousandSeparator =
    thousandSeparator ?? intl.formatMessage(messages.thousandSeparator);

  const labelTooltip =
    typeof tooltip === 'string' && tooltip
      ? ({ content: tooltip } as TooltipProps)
      : (tooltip as TooltipProps | undefined);

  return (
    <FormFieldNumericFormat
      fixedDecimalScale
      decimalScale={2}
      prefix={prefix}
      decimalSeparator={finalDecimalSeparator}
      thousandSeparator={finalThousandSeparator}
      labelTooltip={labelTooltip}
      placeholder={`${prefix} 0${finalDecimalSeparator}00`}
      allowNegative={false}
      {...formFieldNumericFormatProps}
    />
  );
};
