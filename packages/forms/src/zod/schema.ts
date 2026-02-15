/**
 * Need this import to extend zod types on build time.
 */
import './typings.d';

import * as z from 'zod';

import { isCnpjValid } from '../Brazil/FormFieldCNPJ';
import { isCpfValid } from '../Brazil/FormFieldCPF';

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
    .min(8, 'Password must be at least 8 characters long');

  if (options?.required) {
    return schema;
  }

  // For optional passwords, accept empty strings or valid passwords
  return z.union([z.literal(''), schema]).optional();
};

// Extend ZodString prototype with custom validation methods
z.ZodString.prototype.cnpj = function (message = 'Invalid CNPJ') {
  return this.refine(cnpjRefinement, { message });
};

z.ZodString.prototype.cpf = function (message = 'Invalid CPF') {
  return this.refine(cpfRefinement, { message });
};

// Extend ZodEffects prototype for chainability
z.ZodEffects.prototype.cnpj = function (message = 'Invalid CNPJ') {
  return this.refine(cnpjRefinement, { message });
};

z.ZodEffects.prototype.cpf = function (message = 'Invalid CPF') {
  return this.refine(cpfRefinement, { message });
};
