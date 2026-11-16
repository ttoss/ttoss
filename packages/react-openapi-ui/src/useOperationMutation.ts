import * as React from 'react';

import { buildOperationUrl, findOperation } from './core/operations';
import type { OperationParams, ResolvedOperation } from './core/types';
import { toError } from './errors';
import { useOpenApi } from './OpenApiProvider';

export type OperationMutationState = {
  operation: ResolvedOperation | undefined;
  /**
   * Sends the request. Resolves with the response body; rejects (and sets
   * `error`) when the request fails.
   */
  mutate: (args?: {
    params?: OperationParams;
    body?: unknown;
  }) => Promise<unknown>;
  data: unknown;
  error: Error | null;
  pending: boolean;
  reset: () => void;
};

/**
 * Calls a write operation (POST, PUT, PATCH, DELETE) by its `operationId` on
 * demand. Params are one flat object placed where the spec declares them.
 */
export const useOperationMutation = ({
  operationId,
}: {
  operationId: string;
}): OperationMutationState => {
  const { spec, fetcher } = useOpenApi();

  const operation = React.useMemo(() => {
    return spec ? findOperation({ spec, operationId }) : undefined;
  }, [spec, operationId]);

  const [state, setState] = React.useState<{
    data: unknown;
    error: Error | null;
    pending: boolean;
  }>({ data: undefined, error: null, pending: false });

  const mounted = React.useRef(true);
  React.useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const mutate = React.useCallback<OperationMutationState['mutate']>(
    async ({ params, body } = {}) => {
      if (!operation) {
        throw new Error(
          `Operation "${operationId}" not found in the OpenAPI spec.`
        );
      }
      setState((s) => {
        return { ...s, pending: true, error: null };
      });
      try {
        const url = buildOperationUrl({ operation, params });
        const data = await fetcher({ method: operation.method, url, body });
        if (mounted.current) {
          setState({ data, error: null, pending: false });
        }
        return data;
      } catch (error) {
        if (mounted.current) {
          setState((s) => {
            return { ...s, error: toError(error), pending: false };
          });
        }
        throw error;
      }
    },
    [operation, operationId, fetcher]
  );

  const reset = React.useCallback(() => {
    setState({ data: undefined, error: null, pending: false });
  }, []);

  return { operation, mutate, reset, ...state };
};
