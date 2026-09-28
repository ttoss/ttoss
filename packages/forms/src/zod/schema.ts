/**
 * Need this import to extend zod types on build time.
 */
import './typings.d';

import * as z from 'zod';

import { isCnpjValid } from '../Brazil/FormFieldCNPJ';
import { isCpfValid } from '../Brazil/FormFieldCPF';
import { installZodFallbackErrorMap, ttossIssue } from './i18n';

installZodFallbackErrorMap();

const PASSWORD_MIN_LENGTH = 8;

/**
 * Zod refinement for Brazilian CNPJ validation.
 *
 * This refinement uses Zod's `.refine()` method to perform custom validation.
 * According to the official Zod documentation, refinements are the recommended
 * way to add custom validation logic beyond what Zod's built-in validators provide.
 *
 * @see https://zod.dev/api#refinements
 * @example
 * ```typescript
 * const schema = z.object({
 *   cnpj: z.string().cnpj()
 * });
 * ```
 */
export const cnpjRefinement = (val: string) => {
  return isCnpjValid(val);
};

/**
 * Zod refinement for Brazilian CPF validation.
 * @example
 * ```typescript
 * const schema = z.object({
 *   cpf: z.string().cpf()
 * });
 * ```
 */
export const cpfRefinement = (val: string) => {
  return isCpfValid(val);
};

/**
 * Zod schema for password validation.
 * @example
 * ```typescript
 * const schema = z.object({
 *   password: passwordSchema({ required: true })
 * });
 * ```
 */
export const passwordSchema = (options?: { required?: boolean }) => {
  const schema = z
    .string()
    .trim()
    .refine(
      (value) => {
        return value.length >= PASSWORD_MIN_LENGTH;
      },
      ttossIssue('passwordMinLength', { min: PASSWORD_MIN_LENGTH })
    );

  if (options?.required) {
    return schema;
  }

  // For optional passwords, accept empty strings or valid passwords
  return z.union([z.literal(''), schema]).optional();
};

// Extend ZodString prototype with custom validation methods
// Without a message, the error comes from the ttoss catalog in the current
// locale (see ./i18n.ts); a message passed here always wins.
z.ZodString.prototype.cnpj = function (message?: string) {
  return this.refine(
    cnpjRefinement,
    message === undefined ? ttossIssue('invalidCnpj') : { error: message }
  );
};

z.ZodString.prototype.cpf = function (message?: string) {
  return this.refine(
    cpfRefinement,
    message === undefined ? ttossIssue('invalidCpf') : { error: message }
  );
};
