import type { ResolvedOperation } from './core/types';

/** Wraps a rejection reason that is not an `Error` (e.g. a string). */
export const toError = (error: unknown): Error => {
  return error instanceof Error ? error : new Error(String(error));
};

/**
 * The error for an `operationId` the loaded spec does not declare; null while
 * the spec is loading or when the operation exists.
 */
export const missingOperationError = ({
  spec,
  operation,
  operationId,
}: {
  spec: unknown;
  operation?: ResolvedOperation;
  operationId: string;
}): Error | null => {
  return spec && !operation
    ? new Error(`Operation "${operationId}" not found in the OpenAPI spec.`)
    : null;
};

/** The first error present, in priority order. */
export const firstError = (
  errors: (Error | null | undefined)[]
): Error | null => {
  return (
    errors.find((error) => {
      return !!error;
    }) ?? null
  );
};
