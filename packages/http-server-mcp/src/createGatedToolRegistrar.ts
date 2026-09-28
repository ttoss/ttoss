import type { McpServer } from '@modelcontextprotocol/server';
import { type Catalog, renderLocalizedError } from '@ttoss/i18n-core';

import { getIdentity, getRequestLocale } from './context';

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
  /**
   * Tool metadata forwarded verbatim on `tools/list` — how a gated tool links
   * to an MCP Apps view (`registerAppResource(...).toolMeta()`).
   */
  _meta?: Record<string, unknown>;
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
  /**
   * Renders a `LocalizedError` — thrown by a gate or by the handler — as an
   * `isError` result `{ error: <message>, code }` in the caller's locale,
   * instead of letting the SDK surface its source-language message. Gates run
   * outside the handler, so this is the one place both are covered.
   *
   * `getLocale` defaults to the MCP request's `Accept-Language`
   * (`getRequestLocale()`); return a fixed locale to pin the agent contract to
   * one language. `onError` still runs for a handler error before it is
   * rendered. Errors that are not localized behave exactly as without this
   * option.
   */
  i18n?: {
    catalog: Pick<Catalog, 'getI18n'>;
    getLocale?: (
      ctx: ToolCallContext
    ) =>
      | string
      | string[]
      | null
      | undefined
      | Promise<string | string[] | null | undefined>;
  };
};

const toolError = (message: string, code?: string) => {
  const payload =
    code === undefined ? { error: message } : { error: message, code };
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload) }],
    isError: true as const,
  };
};

/**
 * The localized `isError` result for `error`, or `undefined` when it is not
 * a `LocalizedError` or rendering fails — the caller then keeps its usual path.
 */
const localizedToolError = async ({
  error,
  ctx,
  i18n,
}: {
  error: unknown;
  ctx: ToolCallContext;
  i18n: NonNullable<CreateGatedToolRegistrarOptions['i18n']>;
}) => {
  try {
    const requested = i18n.getLocale
      ? await i18n.getLocale(ctx)
      : getRequestLocale();
    const rendered = renderLocalizedError({
      error,
      i18n: await i18n.catalog.getI18n(requested),
    });
    return rendered ? toolError(rendered.message, rendered.code) : undefined;
  } catch {
    return undefined;
  }
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
 * 7. With `i18n`, renders a `LocalizedError` from a gate or the handler as an
 *    `isError` result in the caller's locale instead of rethrowing it.
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
  i18n,
}: CreateGatedToolRegistrarOptions) => {
  // Render a LocalizedError as a tool result, or rethrow anything else.
  const renderOrRethrow = async (error: unknown, ctx: ToolCallContext) => {
    const localized = i18n
      ? await localizedToolError({ error, ctx, i18n })
      : undefined;
    if (localized) return localized;
    throw error;
  };

  const runMethod = async (def: GatedToolDef, ctx: ToolCallContext) => {
    const extra = buildContext ? buildContext(ctx) : {};
    try {
      const result = await def.method({ ...ctx.args, ...extra });
      if (result == null) return toolError(notFoundMessage);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result) }],
      };
    } catch (error) {
      if (onError) await onError(error, ctx);
      return renderOrRethrow(error, ctx);
    }
  };

  const register = (def: GatedToolDef): void => {
    const handler = async (args: Record<string, unknown>) => {
      const identity = resolveIdentity() as ToolIdentity | undefined;
      if (!identity) return toolError('Unauthorized');

      const ctx: ToolCallContext = { identity, args, handler: def.name };

      if (enforceScope) {
        const scopeError = checkScope(identity, def.requiredScope);
        if (scopeError) return scopeError;
      }

      try {
        await runGates([...gates, ...(def.gates ?? [])], ctx);
      } catch (error) {
        return renderOrRethrow(error, ctx);
      }

      return runMethod(def, ctx);
    };

    type RegisterToolArgs = Parameters<McpServer['registerTool']>;
    server.registerTool(
      def.name,
      {
        description: def.description,
        inputSchema: def.inputSchema as RegisterToolArgs[1]['inputSchema'],
        _meta: def._meta,
      },
      handler as unknown as RegisterToolArgs[2]
    );
  };
  return { register };
};
