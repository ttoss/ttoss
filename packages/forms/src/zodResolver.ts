import { zodResolver as hookformZodResolver } from '@hookform/resolvers/zod';
import type { FieldValues, Resolver } from 'react-hook-form';
import type { ZodType } from 'zod';

/**
 * Type-safe wrapper for `zodResolver` from `@hookform/resolvers/zod` that
 * supports Zod v4 classic schemas (ZodObject, ZodString, etc.).
 *
 * Zod v4.3+ updated internal type signatures (`_zod.version.minor` changed
 * from `0` to `3`), which broke the TypeScript overload resolution in
 * `@hookform/resolvers@5.x`. This wrapper bridges the compatibility gap while
 * preserving the runtime behaviour of the original resolver.
 *
 * @example
 * ```ts
 * import { z, zodResolver, useForm } from '@ttoss/forms';
 *
 * const schema = z.object({ name: z.string().min(1) });
 * const methods = useForm({ resolver: zodResolver(schema) });
 * ```
 */
export const zodResolver = <T extends FieldValues = FieldValues>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: ZodType<any, any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Resolver<T, any, T> => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return hookformZodResolver(schema as any) as unknown as Resolver<T, any, T>;
};
