import type { CallToolResult, McpServer } from '@modelcontextprotocol/server';

import { LEGACY_RESOURCE_URI_KEY } from './registerAppResource';
import { registerDirectTool, resolveToolSchemas, type Tool } from './tool';
import {
  rankTools,
  suggestionsFor,
  summaryOf,
  type ToolSearchArgs,
} from './toolSearch';

/** How {@link registerTools} exposes tools as a catalog. */
export interface ToolCatalogOptions {
  /**
   * Tools that are also registered as standalone MCP tools, beside the
   * catalog. They stay reachable through the catalog too.
   *
   * Defaults to the tools linked to an MCP Apps view: a host finds a tool's
   * view through that tool's own `tools/list` entry, so a view behind `call`
   * would never render.
   */
  direct?: (args: { tool: Tool }) => boolean;
  /**
   * The names of the catalog's three tools, to avoid a collision with a
   * direct tool or to serve two catalogs from one server.
   * @default { search: 'search', describe: 'describe', call: 'call' }
   */
  names?: { search?: string; describe?: string; call?: string };
  /**
   * Replaces the default ranking, e.g. with embeddings. Receives only the
   * tools `visible` lets through; the result is cut to `limit`.
   * {@link rankTools} is the default, for a fallback.
   */
  search?: (args: ToolSearchArgs) => Tool[] | Promise<Tool[]>;
  /**
   * How many tools `search` returns when the model does not say.
   * @default 10
   */
  searchLimit?: number;
  /**
   * Runs on every catalog call. A tool it rejects is absent from `search`,
   * `describe`, and `call`, which answers it as an unknown name. Direct tools
   * are listed on `tools/list` regardless.
   *
   * @example
   * ```typescript
   * visible: ({ tool }) => canUse({ identity: getIdentity(), tool: tool.name }),
   * ```
   */
  visible?: (args: { tool: Tool }) => boolean;
}

const DEFAULT_SEARCH_LIMIT = 10;

const jsonResult = ({
  data,
  isError = false,
}: {
  data: Record<string, unknown>;
  isError?: boolean;
}): CallToolResult => {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data) }],
    structuredContent: data,
    ...(isError ? { isError: true } : {}),
  };
};

const errorMessageOf = (error: unknown): string => {
  return error instanceof Error ? error.message : String(error);
};

type Issue = {
  message: string;
  path?: ReadonlyArray<PropertyKey | { key: PropertyKey }>;
};

const formatIssue = (issue: Issue): string => {
  const path = (issue.path ?? [])
    .map((segment) => {
      return String(typeof segment === 'object' ? segment.key : segment);
    })
    .join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
};

const linksAppView = ({ tool }: { tool: Tool }): boolean => {
  const ui = tool._meta?.ui;
  return (
    (typeof ui === 'object' && ui !== null && 'resourceUri' in ui) ||
    tool._meta?.[LEGACY_RESOURCE_URI_KEY] !== undefined
  );
};

/** What the three catalog tools share. */
interface Catalog {
  names: { search: string; describe: string; call: string };
  /** Every catalog tool, for counts and tags that never vary per request. */
  tools: Tool[];
  searchLimit: number;
  searchTools: NonNullable<ToolCatalogOptions['search']>;
  /** The tools this request may see. */
  visibleTools: () => Tool[];
  /** A tool this request may see, by name. */
  find: (name: string) => Tool | undefined;
}

const catalogOf = ({
  tools,
  options,
}: {
  tools: Tool[];
  options: ToolCatalogOptions;
}): Catalog => {
  const byName = new Map<string, Tool>();
  for (const tool of tools) {
    if (byName.has(tool.name)) {
      throw new Error(`Two tools are named "${tool.name}".`);
    }
    byName.set(tool.name, tool);
  }

  const isVisible = (tool: Tool): boolean => {
    return options.visible ? options.visible({ tool }) : true;
  };

  return {
    names: {
      search: 'search',
      describe: 'describe',
      call: 'call',
      ...options.names,
    },
    tools,
    searchLimit: options.searchLimit ?? DEFAULT_SEARCH_LIMIT,
    searchTools: options.search ?? rankTools,
    visibleTools: () => {
      return tools.filter(isVisible);
    },
    find: (name) => {
      const tool = byName.get(name);
      return tool && isVisible(tool) ? tool : undefined;
    },
  };
};

const searchToolOf = ({
  names,
  tools,
  searchLimit,
  searchTools,
  visibleTools,
}: Catalog): Tool => {
  const tags = [
    ...new Set(
      tools.flatMap((tool) => {
        return tool.tags ?? [];
      })
    ),
  ].sort();

  return {
    name: names.search,
    description:
      `Find tools by keyword among the ${tools.length} this server offers. ` +
      `Returns each match's name and summary; get input schemas with "${names.describe}", then run one with "${names.call}".` +
      (tags.length > 0 ? ` Tags: ${tags.join(', ')}.` : ''),
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Words describing the action, e.g. "create agent". Empty lists every tool.',
        },
        tag: {
          type: 'string',
          description: 'Only tools with this tag.',
          ...(tags.length > 0 ? { enum: tags } : {}),
        },
        limit: {
          type: 'integer',
          minimum: 1,
          description: `Maximum number of results. Defaults to ${searchLimit}.`,
        },
      },
      required: ['query'],
    },
    validateArguments: true,
    annotations: { readOnlyHint: true },
    handler: async (args) => {
      const limit = (args.limit as number | undefined) ?? searchLimit;
      const matches = await searchTools({
        query: args.query as string,
        tag: args.tag as string | undefined,
        limit,
        tools: visibleTools(),
      });
      return jsonResult({
        data: {
          tools: matches.slice(0, limit).map((tool) => {
            return {
              name: tool.name,
              summary: summaryOf(tool),
              ...(tool.tags ? { tags: tool.tags } : {}),
            };
          }),
        },
      });
    },
  };
};

const describeToolOf = ({ names, find, visibleTools }: Catalog): Tool => {
  return {
    name: names.describe,
    description: `Get the full definition of tools found with "${names.search}", including the input schema "${names.call}" expects.`,
    inputSchema: {
      type: 'object',
      properties: {
        names: {
          type: 'array',
          items: { type: 'string' },
          minItems: 1,
          description: 'Tool names, as search returned them.',
        },
      },
      required: ['names'],
    },
    validateArguments: true,
    annotations: { readOnlyHint: true },
    handler: (args) => {
      const described: Array<Record<string, unknown>> = [];
      const unknown: Array<{ name: string; suggestions: string[] }> = [];
      for (const name of args.names as string[]) {
        const tool = find(name);
        if (!tool) {
          unknown.push({
            name,
            suggestions: suggestionsFor({ name, tools: visibleTools() }),
          });
          continue;
        }
        described.push({
          name: tool.name,
          ...(tool.title ? { title: tool.title } : {}),
          description: tool.description,
          inputSchema: resolveToolSchemas(tool).inputJson,
          ...(tool.annotations ? { annotations: tool.annotations } : {}),
        });
      }
      return jsonResult({
        data: {
          tools: described,
          ...(unknown.length > 0 ? { unknown } : {}),
        },
        isError: described.length === 0,
      });
    },
  };
};

/** Runs one tool the way a direct call would, with errors that help a retry. */
const runTool = async ({
  tool,
  args,
}: {
  tool: Tool;
  args: unknown;
}): Promise<CallToolResult> => {
  const schemas = resolveToolSchemas(tool);
  const validated = await schemas.input['~standard'].validate(args);
  if (validated.issues) {
    return jsonResult({
      data: {
        error: `Invalid arguments for "${tool.name}".`,
        issues: validated.issues.map(formatIssue),
        inputSchema: schemas.inputJson,
      },
      isError: true,
    });
  }

  // A refusal carries the schema, so a call made without `describe`
  // corrects itself in one retry.
  const schemaHint = {
    type: 'text' as const,
    text: JSON.stringify({ inputSchema: schemas.inputJson }),
  };
  try {
    const result = await tool.handler(
      validated.value as Record<string, unknown>
    );
    return result.isError
      ? { ...result, content: [...result.content, schemaHint] }
      : result;
  } catch (error) {
    return {
      content: [{ type: 'text', text: errorMessageOf(error) }, schemaHint],
      isError: true,
    };
  }
};

const callToolOf = ({ names, find, visibleTools }: Catalog): Tool => {
  return {
    name: names.call,
    description: `Run a tool found with "${names.search}". Pass its arguments as "${names.describe}" defined them.`,
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'The tool to run.' },
        arguments: {
          type: 'object',
          description: "The tool's arguments, matching its input schema.",
        },
      },
      required: ['name'],
    },
    validateArguments: true,
    handler: (args) => {
      const name = args.name as string;
      const tool = find(name);
      if (!tool) {
        return jsonResult({
          data: {
            error: `Unknown tool "${name}".`,
            suggestions: suggestionsFor({ name, tools: visibleTools() }),
          },
          isError: true,
        });
      }
      return runTool({ tool, args: args.arguments ?? {} });
    },
  };
};

/**
 * Registers `tools` behind three tools — `search`, `describe`, `call` — so a
 * client's context holds three small definitions instead of every schema,
 * and a schema enters it only for the tools the model is about to use.
 */
export const registerToolCatalog = ({
  server,
  tools,
  ...options
}: ToolCatalogOptions & { server: McpServer; tools: Tool[] }): void => {
  const catalog = catalogOf({ tools, options });
  for (const tool of [
    searchToolOf(catalog),
    describeToolOf(catalog),
    callToolOf(catalog),
  ]) {
    registerDirectTool({ server, tool });
  }

  const direct = options.direct ?? linksAppView;
  for (const tool of tools) {
    if (direct({ tool })) registerDirectTool({ server, tool });
  }
};
