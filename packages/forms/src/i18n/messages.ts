import { defineMessages } from '@ttoss/react-i18n';

/**
 * Validation messages shared by the Yup locale and the Zod error map, so a
 * translation written once applies to both.
 */
export const validationMessages = defineMessages({
  required: {
    defaultMessage: 'Field is required',
    description: 'Field is required',
  },
  invalidType: {
    defaultMessage: 'Invalid Value for Field of type {type}',
    description: 'Invalid Value',
  },
  minLength: {
    defaultMessage: 'Field must be at least {min} characters',
    description: 'Min length field',
  },
  invalidCpf: {
    defaultMessage: 'Invalid CPF',
    description: 'Zod refinement: the value is not a valid Brazilian CPF.',
  },
  invalidCnpj: {
    defaultMessage: 'Invalid CNPJ',
    description: 'Zod refinement: the value is not a valid Brazilian CNPJ.',
  },
  passwordMinLength: {
    defaultMessage: 'Password must be at least {min} characters long',
    description: 'passwordSchema: the password is shorter than the minimum.',
  },
});
