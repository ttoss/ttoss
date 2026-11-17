import * as React from 'react';

import { buildOperationUrl, findOperation } from './core/operations';
import type { OperationParams, ResolvedOperation } from './core/types';
import { firstError, missingOperationError, toError } from './errors';
import { useOpenApi } from './OpenApiProvider';

export type OperationQueryState = {
  operation: ResolvedOperation | undefined;
  data: unknown;
  error: Error | null;
  /** True while the first response (or the spec) is loading. */
  loading: boolean;
  /** True while any request is in flight, including refetches. */
  fetching: boolean;
  refetch: () => void;
};

type QueryResult = { key: string; data: unknown; error: Error | null };

/**
 * The request URL, or the error that prevents building it (e.g. a missing
 * path param).
 */
const useRequestUrl = ({
  operation,
  paramsKey,
}: {
  operation?: ResolvedOperation;
  paramsKey: string;
}): { url?: string; error?: Error } => {
  return React.useMemo(() => {
    if (!operation) {
      return {};
    }
    try {
      const params = JSON.parse(paramsKey) as OperationParams;
      return { url: buildOperationUrl({ operation, params }) };
    } catch (error) {
      return { error: toError(error) };
    }
  }, [operation, paramsKey]);
};

/**
 * Sends the request identified by `requestKey` and keeps its result. A result
 * belongs to the key it was fetched for, so one for an older key is stale;
 * callers derive "fetching" from that instead of setting state in the effect.
 */
const useKeyedFetch = ({
  requestKey,
  operation,
  url,
}: {
  requestKey: string | null;
  operation?: ResolvedOperation;
  url?: string;
}): QueryResult | null => {
  const { fetcher } = useOpenApi();
  const [result, setResult] = React.useState<QueryResult | null>(null);

  React.useEffect(() => {
    if (!requestKey || !operation || !url) {
      return;
    }
    const controller = new AbortController();
    fetcher({ method: operation.method, url, signal: controller.signal })
      .then((data) => {
        setResult({ key: requestKey, data, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setResult((previous) => {
          return {
            key: requestKey,
            data: previous?.data,
            error: toError(error),
          };
        });
      });
    return () => {
      controller.abort();
    };
  }, [requestKey, operation, url, fetcher]);

  return result;
};

/**
 * Loading, fetching and error of a query. A result for an older request key
 * is stale: the request it answers was replaced, so it is still fetching.
 */
const deriveStatus = ({
  enabled,
  requestKey,
  result,
  specLoading,
  errors,
}: {
  enabled: boolean;
  requestKey: string | null;
  result: QueryResult | null;
  specLoading: boolean;
  errors: (Error | null | undefined)[];
}): Pick<OperationQueryState, 'error' | 'loading' | 'fetching'> => {
  if (!enabled) {
    return { error: null, loading: false, fetching: false };
  }
  const pending = requestKey !== null && result?.key !== requestKey;
  return {
    error: firstError([...errors, pending ? null : result?.error]),
    loading: specLoading || (pending && result === null),
    fetching: specLoading || pending,
  };
};

/**
 * Calls a GET operation by its `operationId` and tracks the response. Params
 * are one flat object; each lands in the path or the query string as the spec
 * declares it. Re-runs when the params change, keeping the previous data on
 * screen until the new response arrives.
 */
export const useOperationQuery = ({
  operationId,
  params,
  enabled = true,
}: {
  operationId: string;
  params?: OperationParams;
  enabled?: boolean;
}): OperationQueryState => {
  const { spec, loading: specLoading, error: specError } = useOpenApi();

  const operation = React.useMemo(() => {
    return spec ? findOperation({ spec, operationId }) : undefined;
  }, [spec, operationId]);

  // Params arrive as a fresh object each render; key the request on content.
  const request = useRequestUrl({
    operation,
    paramsKey: JSON.stringify(params ?? {}),
  });
  const [attempt, setAttempt] = React.useState(0);
  const requestKey =
    enabled && request.url ? `${attempt}:${request.url}` : null;
  const result = useKeyedFetch({ requestKey, operation, url: request.url });

  const refetch = React.useCallback(() => {
    setAttempt((n) => {
      return n + 1;
    });
  }, []);

  return {
    operation,
    data: result?.data,
    refetch,
    ...deriveStatus({
      enabled,
      requestKey,
      result,
      specLoading,
      errors: [
        specError,
        missingOperationError({ spec, operation, operationId }),
        request.error,
      ],
    }),
  };
};
