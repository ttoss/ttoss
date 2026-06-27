// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- value import required so declaration bundler emits `export { McpServer }` not `export type { McpServer }`
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { getIdentity } from './context';

/** Resolved identity for a gated tool call. */
export type ToolIdentity = { userId: string; scopes?: string[] };

/** Definition for a single gated tool. */
export type GatedToolDef = {
  /** Tool name as registered with the MCP server. */
  name: string;
  /** Human-readable tool description. */
  description: string;
  /** The single scope that must be present on the caller's token. */
  requiredScope: string;
  /** Zod field map or ZodObject — passed through to `server.registerTool`. */
  inputSchema: unknown;
  /** The tool handler. Receives merged call args + `buildContext` output. */
  method: (args: Record<string, unknown>) => Promise<unknown>;
};

/** Options for {@link createGatedToolRegistrar}. */
export type CreateGatedToolRegistrarOptions = {
  /** The MCP server instance to register tools on. */
  server: McpServer;
  /**
   * Called once per tool invocation to resolve the caller's identity.
   * Defaults to `getIdentity()` from the request context.
   */
  resolveIdentity?: () => ToolIdentity;
  /**
   * Additional authorization gates run after the scope check, in order.
   * Throw to reject the call; return (or resolve) to continue.
   */
  gates?: Array<(identity: ToolIdentity) => void | Promise<void>>;
  /**
   * Called when a tool handler throws. Use for error reporting/telemetry.
   * The error is always rethrown after this hook completes.
   */
  onError?: (
    error: unknown,
    ctx: { handler: string; identity: ToolIdentity }
  ) => void | Promise<void>;
  /**
   * Called once per invocation to produce extra key-value pairs that are
   * merged into the handler args. Use to inject request-scoped context
   * (e.g. a database client keyed to the caller's tenant).
   */
  buildContext?: (identity: ToolIdentity) => Record<string, unknown>;
};

const toolError = (message: string) => {
  return {
    content: [
      { type: 'text' as const, text: JSON.stringify({ error: message }) },
    ],
    isError: true as const,
  };
};

/**
 * Factory that returns a `register` helper for MCP tools that require
 * authentication and a specific OAuth scope.
 *
 * Every registered tool automatically:
 * 1. Resolves the caller identity (default: `getIdentity()`).
 * 2. Checks `requiredScope` — returns an `isError` result (not a throw) when
 *    the scope is absent, consistent with how MCP surfaces authorization errors.
 * 3. Runs any extra `gates` in order; a throwing gate rejects the call.
 * 4. Merges `buildContext` output into the handler args.
 * 5. Wraps `null`/`undefined` results in a "Not found" error result.
 * 6. Calls `onError` on throw before rethrowing.
 *
 * @example
 * ```typescript
 * const { register } = createGatedToolRegistrar({
 *   server,
 *   resolveIdentity: () => {
 *     const jwt = getIdentity<{ sub: string; scopes: string[] }>();
 *     return { userId: jwt!.sub, scopes: jwt!.scopes };
 *   },
 * });
 *
 * register({
 *   name: 'list-campaigns',
 *   description: 'List all ad campaigns for the caller.',
 *   requiredScope: 'campaigns:read',
 *   inputSchema: { limit: z.number().optional() },
 *   method: async ({ userId, limit }) => fetchCampaigns(userId, limit),
 * });
 * ```
 */
export const createGatedToolRegistrar = ({
  server,
  resolveIdentity = getIdentity as () => ToolIdentity,
  gates = [],
  onError,
  buildContext,
}: CreateGatedToolRegistrarOptions) => {
  const register = (def: GatedToolDef): void => {
    server.registerTool(
      def.name,
      {
        description: def.description,
        inputSchema: def.inputSchema as Parameters<
          McpServer['registerTool']
        >[1]['inputSchema'],
      },
      async (args: Record<string, unknown>) => {
        const identity = resolveIdentity();
        const scopes = Array.isArray(identity.scopes) ? identity.scopes : [];

        if (!scopes.includes(def.requiredScope)) {
          return toolError(
            `This tool requires the "${def.requiredScope}" scope.`
          );
        }

        for (const gate of gates) {
          await gate(identity);
        }

        const extra = buildContext ? buildContext(identity) : {};
        try {
          const result = await def.method({ ...args, ...extra });
          if (result == null) return toolError('Not found');
          return {
            content: [{ type: 'text' as const, text: JSON.stringify(result) }],
          };
        } catch (error) {
          if (onError) await onError(error, { handler: def.name, identity });
          throw error;
        }
      }
    );
  };
  return { register };
};
