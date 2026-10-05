import type { Catalog } from '@ttoss/i18n-core';

import { getIdentity, getRequestLocale } from './context';
import { type Tool, toolError } from './tool';

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
   * The validated tool input. Arg-conditional gates read this to vary their
   * predicate per call.
   */
  args: Record<string, unknown>;
  /** Tool name, for error attribution and gate labelling. */
  handler: string;
};

/** An authorization check. Throw to reject the call; return to continue. */
export type ToolCallGate = (ctx: ToolCallContext) => void | Promise<void>;

/** Options for {@link createToolGate}. */
export type CreateToolGateOptions = {
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
   * Gates own their own error handling — `onError` covers the tool handler only.
   */
  gates?: ToolCallGate[];
  /**
   * When `true` (default), checks `requiredScope` against `identity.scopes`
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

/** Parameters for the gate {@link createToolGate} returns. */
export interface GateToolParams {
  /** The tool to protect. */
  tool: Tool;
  /** The single scope that must be present on the caller's token. */
  requiredScope: string;
  /**
   * Per-tool gates run after the global `gates`. Useful for arg-conditional
   * authorization (e.g. different subscription tiers based on call args).
   */
  gates?: ToolCallGate[];
}

/** Wraps a {@link Tool}'s handler in the authorization pipeline. */
export type ToolGate = (params: GateToolParams) => Tool;

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
  i18n: NonNullable<CreateToolGateOptions['i18n']>;
}) => {
  try {
    const requested = i18n.getLocale
      ? await i18n.getLocale(ctx)
      : getRequestLocale();
    // Loaded here, not at import: `@ttoss/i18n-core` pulls in the ESM-only
    // FormatJS runtime, which an app without `i18n` should never load.
    const { renderLocalizedError } = await import('@ttoss/i18n-core');
    const rendered = renderLocalizedError({
      error,
      i18n: await i18n.catalog.getI18n(requested),
    });
    return rendered
      ? toolError({ message: rendered.message, code: rendered.code })
      : undefined;
  } catch {
    return undefined;
  }
};

/**
 * The package's `checkScopes` helper is not reused here because it throws
 * rather than returning an `isError` result, and it reads identity from
 * context itself.
 */
const hasScope = ({
  identity,
  requiredScope,
}: {
  identity: ToolIdentity;
  requiredScope: string;
}): boolean => {
  const scopes = Array.isArray(identity.scopes) ? identity.scopes : [];
  return scopes.includes(requiredScope);
};

/**
 * Factory for a gate: a function that wraps a {@link Tool} so every call
 * passes the same authentication and authorization pipeline before its
 * handler runs. The gated tool is an ordinary `Tool`, so it registers
 * directly or joins a catalog like any other.
 *
 * Every gated call:
 * 1. Resolves the caller identity (default: `getIdentity()`). Returns an
 *    `isError` result when the identity is absent (unauthenticated request).
 * 2. When `enforceScope` is `true` (default), checks `requiredScope` — returns
 *    an `isError` result when the scope is absent, consistent with how MCP
 *    surfaces authorization errors.
 * 3. Runs global `gates` then the tool's `gates` in order; a throwing gate
 *    rejects the call. Every gate receives the full {@link ToolCallContext}.
 * 4. Merges `buildContext` output into the handler args.
 * 5. Calls `onError` on handler throw before rethrowing.
 * 6. With `i18n`, renders a `LocalizedError` from a gate or the handler as an
 *    `isError` result in the caller's locale instead of rethrowing it.
 *
 * @example
 * ```typescript
 * const gate = createToolGate({
 *   resolveIdentity: () => {
 *     const jwt = getIdentity<{ sub: string; scopes: string[] }>();
 *     return { userId: jwt!.sub, scopes: jwt!.scopes };
 *   },
 * });
 *
 * registerTools({
 *   server,
 *   tools: [
 *     gate({
 *       requiredScope: 'campaigns:write',
 *       // arg-conditional gate: active vs. inactive have different restrictions
 *       gates: [
 *         ({ args }) =>
 *           args.isActive
 *             ? subscriptionGate(['mustNotExceedMaxActive', 'mustHaveBudget'])
 *             : subscriptionGate(['mustIncludeService']),
 *       ],
 *       tool: defineTool({
 *         name: 'activate-campaign',
 *         description: 'Activate or deactivate a campaign.',
 *         inputSchema: z.object({ isActive: z.boolean() }),
 *         method: ({ userId, isActive }) => toggleCampaign(userId, isActive),
 *       }),
 *     }),
 *   ],
 * });
 * ```
 */
export const createToolGate = ({
  resolveIdentity = getIdentity as () => ToolIdentity,
  gates = [],
  enforceScope = true,
  onError,
  buildContext,
  i18n,
}: CreateToolGateOptions = {}): ToolGate => {
  // Render a LocalizedError as a tool result, or rethrow anything else.
  const renderOrRethrow = async (error: unknown, ctx: ToolCallContext) => {
    const localized = i18n
      ? await localizedToolError({ error, ctx, i18n })
      : undefined;
    if (localized) return localized;
    throw error;
  };

  return ({ tool, requiredScope, gates: toolGates = [] }) => {
    return {
      ...tool,
      handler: async (args) => {
        const identity = resolveIdentity() as ToolIdentity | undefined;
        if (!identity) return toolError({ message: 'Unauthorized' });

        const ctx: ToolCallContext = { identity, args, handler: tool.name };

        if (enforceScope && !hasScope({ identity, requiredScope })) {
          return toolError({
            message: `This tool requires the "${requiredScope}" scope.`,
          });
        }

        try {
          for (const gate of [...gates, ...toolGates]) {
            await gate(ctx);
          }
        } catch (error) {
          return renderOrRethrow(error, ctx);
        }

        const extra = buildContext ? buildContext(ctx) : {};
        try {
          return await tool.handler({ ...args, ...extra });
        } catch (error) {
          if (onError) await onError(error, ctx);
          return renderOrRethrow(error, ctx);
        }
      },
    };
  };
};
