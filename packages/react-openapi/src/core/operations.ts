import { resolveSchema } from './schema';
import {
  HTTP_METHODS,
  type OpenApiOperation,
  type OpenApiParameter,
  type OpenApiSchema,
  type OpenApiSpec,
  type OperationParams,
  type ResolvedOperation,
} from './types';

type RawOperation = OpenApiOperation & {
  operation_id?: string;
  request_body?: OpenApiOperation['requestBody'];
};

/**
 * Some servers serve the spec snake_cased (`operation_id`, `request_body`);
 * the camelCase OpenAPI keys are restored so the rest of the code reads one
 * shape.
 */
const normalizeOperation = (raw: RawOperation): OpenApiOperation => {
  return {
    ...raw,
    operationId: raw.operationId ?? raw.operation_id ?? '',
    requestBody: raw.requestBody ?? raw.request_body,
  };
};

/**
 * Locates an operation by its `operationId`. Path-level parameters are merged
 * into the operation's own (the operation wins on a name clash), as OpenAPI
 * specifies.
 */
export const findOperation = ({
  spec,
  operationId,
}: {
  spec: OpenApiSpec;
  operationId: string;
}): ResolvedOperation | undefined => {
  for (const [pathTemplate, pathItem] of Object.entries(spec.paths ?? {})) {
    for (const method of HTTP_METHODS) {
      const raw = pathItem[method] as RawOperation | undefined;
      if (!raw) {
        continue;
      }
      const operation = normalizeOperation(raw);
      if (operation.operationId !== operationId) {
        continue;
      }
      const own = operation.parameters ?? [];
      const inherited = (pathItem.parameters ?? []).filter((param) => {
        return !own.some((o) => {
          return o.name === param.name && o.in === param.in;
        });
      });
      return {
        method,
        pathTemplate,
        operation: { ...operation, parameters: [...inherited, ...own] },
      };
    }
  }
  return undefined;
};

export const getParameters = ({
  operation,
  location,
}: {
  operation: ResolvedOperation;
  location: OpenApiParameter['in'];
}): OpenApiParameter[] => {
  return (operation.operation.parameters ?? []).filter((param) => {
    return param.in === location;
  });
};

export const hasQueryParameter = ({
  operation,
  name,
}: {
  operation: ResolvedOperation;
  name: string;
}): boolean => {
  return getParameters({ operation, location: 'query' }).some((param) => {
    return param.name === name;
  });
};

const isEmpty = (value: unknown): boolean => {
  return value === undefined || value === null || value === '';
};

/**
 * Builds the request URL for an operation. Each param is placed where the spec
 * declares it: path params fill the template, query params go to the query
 * string, and anything the spec does not declare is ignored — so callers can
 * pass one flat object of params.
 */
export const buildOperationUrl = ({
  operation,
  params = {},
}: {
  operation: ResolvedOperation;
  params?: OperationParams;
}): string => {
  let url = operation.pathTemplate;
  for (const param of getParameters({ operation, location: 'path' })) {
    const value = params[param.name];
    if (isEmpty(value)) {
      throw new Error(
        `Missing path parameter "${param.name}" for operation "${operation.operation.operationId}".`
      );
    }
    url = url.replace(`{${param.name}}`, encodeURIComponent(String(value)));
  }
  const search = getParameters({ operation, location: 'query' })
    .filter((param) => {
      return !isEmpty(params[param.name]);
    })
    .map((param) => {
      return `${encodeURIComponent(param.name)}=${encodeURIComponent(String(params[param.name]))}`;
    })
    .join('&');
  return search ? `${url}?${search}` : url;
};

/**
 * The resolved schema of an operation's first 2xx JSON response body.
 */
export const getResponseSchema = ({
  operation,
  spec,
}: {
  operation: ResolvedOperation;
  spec: OpenApiSpec;
}): OpenApiSchema | undefined => {
  const responses = operation.operation.responses ?? {};
  const okKey = Object.keys(responses).find((code) => {
    return code.startsWith('2');
  });
  if (!okKey) {
    return undefined;
  }
  const content = responses[okKey].content ?? {};
  const json =
    content['application/json'] ??
    Object.entries(content).find(([type]) => {
      return type.includes('json');
    })?.[1];
  return resolveSchema({ schema: json?.schema, spec });
};
