import type { FieldPath, FieldValues } from 'react-hook-form';

import {
  FormFieldPhone as GenericFormFieldPhone,
  type FormFieldPhoneProps as GenericFormFieldPhoneProps,
} from '../FormFieldPhone';

export type FormFieldPhoneProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = Omit<
  GenericFormFieldPhoneProps<TFieldValues, TName>,
  'defaultCountryCode' | 'format'
>;

const BRAZIL_COUNTRY_CODE = '+55';

const getBrazilPhoneFormat = (value: string) => {
  return value.length > 10 ? '(##) #####-####' : '(##) ####-#####';
};

/**
 * Brazilian phone number form field.
 *
 * Wraps the generic `FormFieldPhone` with the Brazil country code (`+55`)
 * and the appropriate local number format pre-configured.
 *
 * @example
 * ```tsx
 * <FormFieldPhone name="phone" label="Phone" />
 * ```
 */
export const FormFieldPhone = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  placeholder = '(11) 91234-1234',
  countryCodeOptions = [],
  ...props
}: FormFieldPhoneProps<TFieldValues, TName>) => {
  return (
    <GenericFormFieldPhone
      {...props}
      defaultCountryCode={BRAZIL_COUNTRY_CODE}
      format={getBrazilPhoneFormat}
      placeholder={placeholder}
      countryCodeOptions={countryCodeOptions}
    />
  );
};
