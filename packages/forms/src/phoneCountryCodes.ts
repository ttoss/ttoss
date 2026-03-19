import { type CountryCodeOption } from './FormFieldPhone';

/**
 * A curated list of the most common country calling codes paired with their
 * typical local phone number format patterns (using `#` as digit placeholders).
 *
 * Import this constant and pass it to the `countryCodeOptions` prop of
 * `FormFieldPhone` to give users a ready-made country-code picker that also
 * automatically updates the number format when they switch countries.
 *
 * @example
 * ```tsx
 * import { COMMON_PHONE_COUNTRY_CODES, FormFieldPhone } from '@ttoss/forms';
 *
 * const [countryCode, setCountryCode] = React.useState(
 *   COMMON_PHONE_COUNTRY_CODES[0].value
 * );
 *
 * <FormFieldPhone
 *   name="phone"
 *   label="Phone"
 *   countryCode={countryCode}
 *   onCountryCodeChange={setCountryCode}
 *   countryCodeOptions={COMMON_PHONE_COUNTRY_CODES}
 * />
 * ```
 */
export const COMMON_PHONE_COUNTRY_CODES: CountryCodeOption[] = [
  { label: '🇺🇸 +1 (US/Canada)', value: '+1', format: '(###) ###-####' },
  { label: '🇬🇧 +44 (UK)', value: '+44', format: '#### ### ####' },
  { label: '🇩🇪 +49 (Germany)', value: '+49', format: '### ########' },
  { label: '🇫🇷 +33 (France)', value: '+33', format: '# ## ## ## ##' },
  { label: '🇮🇹 +39 (Italy)', value: '+39', format: '### ### ####' },
  { label: '🇪🇸 +34 (Spain)', value: '+34', format: '### ### ###' },
  { label: '🇵🇹 +351 (Portugal)', value: '+351', format: '### ### ###' },
  { label: '🇧🇷 +55 (Brazil)', value: '+55', format: '(##) #####-####' },
  { label: '🇦🇷 +54 (Argentina)', value: '+54', format: '## ########' },
  { label: '🇲🇽 +52 (Mexico)', value: '+52', format: '## ########' },
  { label: '🇯🇵 +81 (Japan)', value: '+81', format: '##-####-####' },
  { label: '🇨🇳 +86 (China)', value: '+86', format: '###-####-####' },
  { label: '🇮🇳 +91 (India)', value: '+91', format: '#####-#####' },
  { label: '🇦🇺 +61 (Australia)', value: '+61', format: '#### ### ###' },
  { label: '🇿🇦 +27 (South Africa)', value: '+27', format: '## ### ####' },
];
