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
 * import { FormFieldPhone } from '@ttoss/forms';
 *
 * // COMMON_PHONE_COUNTRY_CODES is the default — no need to pass it explicitly.
 * // Index 0 is the "Manual" entry; index 1 is US (+1).
 * const [countryCode, setCountryCode] = React.useState(
 *   COMMON_PHONE_COUNTRY_CODES[1].value // '+1'
 * );
 *
 * <FormFieldPhone
 *   name="phone"
 *   label="Phone"
 *   countryCode={countryCode}
 *   onCountryCodeChange={setCountryCode}
 * />
 * ```
 */

export type CountryCodeOption = {
  /** Label displayed in the dropdown (e.g. 'US +1'). */
  label: string;
  /** The calling-code value (e.g. '+1'). */
  value: string;
  /**
   * Optional phone number format for the local part specific to this country
   * (e.g. '(###) ###-####'). When the user selects this option the format
   * is used automatically, overriding the `format` prop of `FormFieldPhone`.
   */
  format?: string | ((value: string) => string);
};

/**
 * Sentinel value used as `countryCode` to indicate that the user wants to
 * type the entire phone number manually (no pattern mask is applied).
 * A `+` prefix is displayed before the input.
 */
export const MANUAL_PHONE_COUNTRY_CODE = 'manual';

/**
 * Common country calling codes sorted by numeric dial-code order.
 * The "Manual" option is listed first, allowing users to type the full
 * international number freely without any mask.
 */
export const COMMON_PHONE_COUNTRY_CODES: CountryCodeOption[] = [
  { label: 'Manual', value: MANUAL_PHONE_COUNTRY_CODE },
  { label: '🇺🇸 +1 (US/Canada)', value: '+1', format: '(###) ###-####' },
  { label: '🇿🇦 +27 (South Africa)', value: '+27', format: '## ### ####' },
  { label: '🇫🇷 +33 (France)', value: '+33', format: '# ## ## ## ##' },
  { label: '🇪🇸 +34 (Spain)', value: '+34', format: '### ### ###' },
  { label: '🇮🇹 +39 (Italy)', value: '+39', format: '### ### ####' },
  { label: '🇬🇧 +44 (UK)', value: '+44', format: '#### ### ####' },
  { label: '🇩🇪 +49 (Germany)', value: '+49', format: '### ########' },
  { label: '🇲🇽 +52 (Mexico)', value: '+52', format: '## ########' },
  { label: '🇦🇷 +54 (Argentina)', value: '+54', format: '## ########' },
  { label: '🇧🇷 +55 (Brazil)', value: '+55', format: '(##) #####-####' },
  { label: '🇦🇺 +61 (Australia)', value: '+61', format: '#### ### ###' },
  { label: '🇯🇵 +81 (Japan)', value: '+81', format: '##-####-####' },
  { label: '🇨🇳 +86 (China)', value: '+86', format: '###-####-####' },
  { label: '🇮🇳 +91 (India)', value: '+91', format: '#####-#####' },
  { label: '🇵🇹 +351 (Portugal)', value: '+351', format: '### ### ###' },
];
