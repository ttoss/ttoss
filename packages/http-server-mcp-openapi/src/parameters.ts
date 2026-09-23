import { resolveParameter } from './schema';
import {
  readServerManaged,
  type ServerManagedExtension,
} from './serverManaged';
import {
  DEFAULT_SERVER_MANAGED_EXTENSION,
  type OpenApiDocuments,
  type OpenApiSpec,
  type ResolvedToolOptions,
  type ServerManagedParameter,
} from './types';

/**
 * Folds `_` and `-` separators into camelCase. OpenAPI operation and parameter
 * names may be snake_case (`agent_id`) or kebab-case (`list-tools`); with the
 * default `argumentNames: 'camelCase'` both are folded into tool arguments.
 */
export const snakeToCamel = (str: string): string => {
  return str.replace(/[_-]([a-z])/g, (_, letter) => {
    return letter.toUpperCase();
  });
};

/** Maps a spec parameter or property name to a tool argument name. */
export type ToArgName = (name: string) => string;

const verbatim: ToArgName = (name) => {
  return name;
};

export const argNameMapper = (
  argumentNames: ResolvedToolOptions['argumentNames']
): ToArgName => {
  return argumentNames === 'verbatim' ? verbatim : snakeToCamel;
};

/**
 * Deduplicates parameter entries by `name`, keeping the last occurrence. When
 * path-item-level and operation-level parameters are concatenated (operation
 * last), this makes the operation-level entry win — as the OpenAPI spec requires.
 */
const dedupeByName = <T extends { name: string }>(items: T[]): T[] => {
  const byName = new Map<string, T>();
  for (const item of items) {
    byName.set(item.name, item);
  }
  return [...byName.values()];
};

const managedFields = (flag: {
  managed: boolean;
  value?: string;
}): { serverManaged: boolean; pinnedValue?: string } => {
  return flag.value === undefined
    ? { serverManaged: flag.managed }
    : { serverManaged: true, pinnedValue: flag.value };
};

/** Arguments shared by the parameter extractors. */
type ExtractParamsArgs = {
  parameters?: Array<{ name?: string; in?: string; [key: string]: unknown }>;
  spec: OpenApiSpec;
  /** Sibling documents cross-file `$ref`s resolve against. */
  documents?: OpenApiDocuments;
  /** Maps a spec name to its tool argument name. @default snakeToCamel */
  toArgName?: ToArgName;
  /** @default DEFAULT_SERVER_MANAGED_EXTENSION */
  serverManagedExtension?: ServerManagedExtension;
};

export const extractPathParams = (
  args: ExtractParamsArgs
): Array<{
  name: string;
  argName: string;
  serverManaged: boolean;
  pinnedValue?: string;
}> => {
  const toArgName = args.toArgName ?? snakeToCamel;
  const flag = args.serverManagedExtension ?? DEFAULT_SERVER_MANAGED_EXTENSION;
  const params = (args.parameters || [])
    .map((p) => {
      return resolveParameter(p, args.spec, args.documents);
    })
    .filter((p) => {
      return p.in === 'path';
    })
    .map((p) => {
      return {
        name: p.name || '',
        argName: toArgName(p.name || ''),
        ...managedFields(readServerManaged({ node: p, extension: flag })),
      };
    });
  return dedupeByName(params);
};

export const extractQueryParams = (
  args: ExtractParamsArgs
): Array<{
  name: string;
  argName: string;
  description: string;
  required: boolean;
  type: string;
  style?: string;
  explode?: boolean;
  serverManaged: boolean;
  pinnedValue?: string;
}> => {
  const toArgName = args.toArgName ?? snakeToCamel;
  const flag = args.serverManagedExtension ?? DEFAULT_SERVER_MANAGED_EXTENSION;
  const params = (args.parameters || [])
    .map((p) => {
      return resolveParameter(p, args.spec, args.documents);
    })
    .filter((p) => {
      return p.in === 'query';
    })
    .map((p) => {
      return {
        name: p.name || '',
        argName: toArgName(p.name || ''),
        description: p.description || '',
        required: p.required || false,
        type: p.schema?.type || 'string',
        style: p.style,
        explode: p.explode,
        ...managedFields(readServerManaged({ node: p, extension: flag })),
      };
    });
  return dedupeByName(params);
};

/** Lists the path and query params flagged as server-managed. */
type ManagedParam = {
  name: string;
  argName: string;
  serverManaged: boolean;
  pinnedValue?: string;
};

export const collectServerManagedParameters = (args: {
  pathParams: ManagedParam[];
  queryParams: ManagedParam[];
}): ServerManagedParameter[] => {
  const tagged = [
    ...args.pathParams.map((p) => {
      return { ...p, in: 'path' as const };
    }),
    ...args.queryParams.map((p) => {
      return { ...p, in: 'query' as const };
    }),
  ];
  return tagged
    .filter((p) => {
      return p.serverManaged;
    })
    .map((p) => {
      return {
        name: p.name,
        in: p.in,
        argName: p.argName,
        ...(p.pinnedValue === undefined ? {} : { value: p.pinnedValue }),
      };
    });
};
