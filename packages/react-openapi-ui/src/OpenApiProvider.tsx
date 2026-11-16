import * as React from 'react';

import type { OpenApiSpec } from './core/types';
import type { Fetcher } from './fetcher';

export type OpenApiContextValue = {
  spec: OpenApiSpec | null;
  /** True while `specUrl` is being fetched. */
  loading: boolean;
  error: Error | null;
  fetcher: Fetcher;
  /** Fetches `specUrl` again. A no-op when the spec was passed inline. */
  reload: () => void;
};

const OpenApiContext = React.createContext<OpenApiContextValue | null>(null);

export type OpenApiProviderProps = {
  /** The OpenAPI document, when the app already has it in memory. */
  spec?: OpenApiSpec;
  /**
   * Where to fetch the OpenAPI document from (e.g. `/api/v1/openapi.json`).
   * Fetched through `fetcher`, so it gets the same base URL and auth as the
   * API calls. Ignored when `spec` is given.
   */
  specUrl?: string;
  /** Performs every HTTP request the components make. See `createFetcher`. */
  fetcher: Fetcher;
  children?: React.ReactNode;
};

/**
 * Makes an OpenAPI spec and the means to call its API available to every
 * `@ttoss/react-openapi` component below it. Configure it once at the app root.
 */
export const OpenApiProvider = ({
  spec: inlineSpec,
  specUrl,
  fetcher,
  children,
}: OpenApiProviderProps) => {
  const [attempt, setAttempt] = React.useState(0);
  // Identifies the current fetch of `specUrl`; a result for an older key is
  // stale, which is how `loading` is derived without setting state in effects.
  const requestKey = inlineSpec || !specUrl ? null : `${attempt}:${specUrl}`;
  const [remote, setRemote] = React.useState<{
    key: string;
    spec: OpenApiSpec | null;
    error: Error | null;
  } | null>(null);

  React.useEffect(() => {
    if (!requestKey || !specUrl) {
      return;
    }
    const controller = new AbortController();
    fetcher({ method: 'get', url: specUrl, signal: controller.signal })
      .then((spec) => {
        setRemote({ key: requestKey, spec: spec as OpenApiSpec, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setRemote({
          key: requestKey,
          spec: null,
          error: error instanceof Error ? error : new Error(String(error)),
        });
      });
    return () => {
      controller.abort();
    };
  }, [requestKey, specUrl, fetcher]);

  const reload = React.useCallback(() => {
    setAttempt((n) => {
      return n + 1;
    });
  }, []);

  const value = React.useMemo<OpenApiContextValue>(() => {
    if (inlineSpec) {
      return { spec: inlineSpec, loading: false, error: null, fetcher, reload };
    }
    const current = remote?.key === requestKey ? remote : null;
    return {
      spec: current?.spec ?? null,
      loading: requestKey !== null && !current,
      error: current?.error ?? null,
      fetcher,
      reload,
    };
  }, [inlineSpec, remote, requestKey, fetcher, reload]);

  return (
    <OpenApiContext.Provider value={value}>{children}</OpenApiContext.Provider>
  );
};

/**
 * Reads the spec, its loading state and the fetcher from the nearest
 * `OpenApiProvider`.
 */
export const useOpenApi = (): OpenApiContextValue => {
  const context = React.useContext(OpenApiContext);
  if (!context) {
    throw new Error('useOpenApi must be used inside an <OpenApiProvider>.');
  }
  return context;
};
