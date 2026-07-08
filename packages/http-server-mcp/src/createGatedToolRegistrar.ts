// eslint-disable-next-line @typescript-eslint/consistent-type-imports -- value import required so declaration bundler emits `export { McpServer }` not `export type { McpServer }`
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { getIdentity } from './context';

/** Resolved identity for a gated tool call. */
export type ToolIdentity = { userId: string; scopes?: string[] };

/**
 * Full context passed to gates, `buildContext`, and `onError` on every tool
 * invocation. Having all three fields in one object means gate callbacks can
 * be both identity-aware and args-aware without multiple parameters.
 */
export type ToolCallContext = {
  /** The resolved caller identity. */
  identity: ToolIdentity;
  /**
   * The validated tool input (post SDK parse). Present for gates and
   * `buildContext`. Arg-conditional gates read this to vary their predicate
   * per call.
   */
  args: Record<string, unknown>;
  /** Tool name, for error attribution and gate labelling. */
  handler: string;
};

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
  /**
   * Per-tool gates merged after the global `gates`. Useful for arg-conditional
   * authorization (e.g. different subscription tiers based on call args).
   * Each gate receives the full {@link ToolCallContext} (identity + args).
   * Throw to reject the call; return (or resolve) to continue.
   */
  gates?: Array<(ctx: ToolCallContext) => void | Promise<void>>;
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
   * Global authorization gates run after the scope check, in order, before
   * per-tool gates. Each receives the full {@link ToolCallContext} — both
   * identity and the validated call args — so gate predicates may be
   * conditional on either.
   * Throw to reject the call; return (or resolve) to continue.
   * Gates own their own error handling — `onError` covers the tool handler only.
   */
  gates?: Array<(ctx: ToolCallContext) => void | Promise<void>>;
  /**
   * When `true` (default), checks `def.requiredScope` against `identity.scopes`
   * and returns an `isError` result when the scope is absent. Set to `false`
   * to skip the scope check (e.g. when all scopes are enforced by `gates`).
   */
  enforceScope?: boolean;
  /**
   * Called when the tool **handler** throws. Use for error reporting/telemetry.
   * The error is always rethrown after this hook completes.
   * Note: scope-check failures and gate rejections do not trigger `onError`.
   */
  onError?: (error: unknown, ctx: ToolCallContext) => void | Promise<void>;
  /**
   * Called once per invocation to produce extra key-value pairs that are
   * merged into the handler args. Receives the full {@link ToolCallContext}
   * so context can vary by identity or by call args.
   */
  buildContext?: (ctx: ToolCallContext) => Record<string, unknown>;
  /**
   * Message returned as an `isError` result when the handler resolves to
   * `null` or `undefined`. Defaults to `"Not found"`.
   */
  notFoundMessage?: string;
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
 * 1. Resolves the caller identity (default: `getIdentity()`). Returns an
 *    `isError` result when the identity is absent (unauthenticated request).
 * 2. When `enforceScope` is `true` (default), checks `requiredScope` — returns
 *    an `isError` result when the scope is absent, consistent with how MCP
 *    surfaces authorization errors. The package's `checkScopes` helper is not
 *    reused here because it throws rather than returning an `isError` result,
 *    and it reads identity from context itself.
 * 3. Runs global `gates` then per-`register` `def.gates` in order; a throwing
 *    gate rejects the call. Every gate receives the full {@link ToolCallContext}
 *    (identity **and** the validated call args), enabling arg-conditional gates.
 *    Gates own their own error handling; `onError` covers the tool handler only.
 * 4. Merges `buildContext` output into the handler args.
 * 5. Wraps `null`/`undefined` results in a configurable "Not found" error result.
 * 6. Calls `onError` on handler throw before rethrowing.
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
 *   name: 'activate-campaign',
 *   description: 'Activate or deactivate a campaign.',
 *   requiredScope: 'campaigns:write',
 *   inputSchema: { isActive: z.boolean() },
 *   // arg-conditional gate: active vs. inactive have different restrictions
 *   gates: [
 *     ({ args }) =>
 *       args.isActive
 *         ? subscriptionGate(['mustNotExceedMaxActive', 'mustHaveBudget'])
 *         : subscriptionGate(['mustIncludeService']),
 *   ],
 *   method: async ({ userId, isActive }) => toggleCampaign(userId, isActive),
 * });
 * ```
 */
const checkScope = (
  identity: ToolIdentity,
  requiredScope: string
): ReturnType<typeof toolError> | null => {
  const scopes = Array.isArray(identity.scopes) ? identity.scopes : [];
  if (!scopes.includes(requiredScope)) {
    return toolError(`This tool requires the "${requiredScope}" scope.`);
  }
  return null;
};

const runGates = async (
  allGates: Array<(ctx: ToolCallContext) => void | Promise<void>>,
  ctx: ToolCallContext
): Promise<void> => {
  for (const gate of allGates) {
    await gate(ctx);
  }
};

export const createGatedToolRegistrar = ({
  server,
  resolveIdentity = getIdentity as () => ToolIdentity,
  gates = [],
  enforceScope = true,
  onError,
  buildContext,
  notFoundMessage = 'Not found',
}: CreateGatedToolRegistrarOptions) => {
  const register = (def: GatedToolDef): void => {
    const handler = async (args: Record<string, unknown>) => {
      const identity = resolveIdentity() as ToolIdentity | undefined;
      if (!identity) return toolError('Unauthorized');

      const ctx: ToolCallContext = { identity, args, handler: def.name };

      if (enforceScope) {
        const scopeError = checkScope(identity, def.requiredScope);
        if (scopeError) return scopeError;
      }

      await runGates([...gates, ...(def.gates ?? [])], ctx);

      const extra = buildContext ? buildContext(ctx) : {};
      try {
        const result = await def.method({ ...args, ...extra });
        if (result == null) return toolError(notFoundMessage);
        return {
          content: [{ type: 'text' as const, text: JSON.stringify(result) }],
        };
      } catch (error) {
        if (onError) await onError(error, ctx);
        throw error;
      }
    };

    server.registerTool(
      def.name,
      {
        description: def.description,
        inputSchema: def.inputSchema as Parameters<
          McpServer['registerTool']
        >[1]['inputSchema'],
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handler as any
    );
  };
  return { register };
};
