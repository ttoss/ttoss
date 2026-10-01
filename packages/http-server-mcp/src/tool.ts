import type {
  CallToolResult,
  JsonSchemaType,
  McpServer,
  StandardSchemaWithJSON,
  ToolAnnotations,
} from '@modelcontextprotocol/server';
import { fromJsonSchema } from '@modelcontextprotocol/server';

/**
 * A plain JSON Schema object (draft-07 compatible) describing the shape of a
 * tool's input or output. Forwarded verbatim over `tools/list`, so features
 * Zod cannot express (`anyOf`, `$ref`, `pattern`, `allOf`, …) survive intact.
 */
export interface JsonObjectSchema {
  type: 'object';
  properties?: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

/**
 * A schema a tool declares: a plain JSON Schema, or a Standard Schema with
 * JSON Schema support — Zod 4's `z.object(...)`, ArkType, or Valibot.
 */
export type ToolSchema = JsonObjectSchema | StandardSchemaWithJSON;

/**
 * An MCP tool: what it is and how it answers, independent of how a server
 * exposes it. {@link registerTools} registers a list of them, either one MCP
 * tool each or behind a search / describe / call catalog.
 */
export interface Tool {
  /** Unique tool name. */
  name: string;
  /** Display name clients show instead of `name`. */
  title?: string;
  /** What the tool does, written for the model. */
  description: string;
  /**
   * The tool's input.
   *
   * - A **JSON Schema** is advertised verbatim and enforced only with
   *   `validateArguments`; the handler receives the raw arguments.
   * - A **Standard Schema** (`z.object(...)`) is always enforced; the handler
   *   receives its parsed output, defaults and coercions applied.
   *
   * @default { type: 'object', properties: {} }
   */
  inputSchema?: ToolSchema;
  /**
   * Whether a JSON Schema `inputSchema` is enforced before the handler runs.
   *
   * Enable it once the schema describes every value the tool genuinely
   * accepts. Schemas generated from an OpenAPI document are a common source of
   * *incomplete* ones — a field a client may send as `null` to clear it, or
   * one accepting several shapes, is easy to emit as a bare
   * `{ type: 'string' }` — and validating against them rejects calls the
   * underlying API would have accepted. A Standard Schema ignores this flag.
   *
   * @default false
   */
  validateArguments?: boolean;
  /**
   * The result's schema, advertised on `tools/list`. A result's
   * `structuredContent` is validated against it.
   */
  outputSchema?: ToolSchema;
  /**
   * Behaviour hints forwarded on `tools/list` (`readOnlyHint`,
   * `destructiveHint`, `idempotentHint`, `openWorldHint`). Clients use them to
   * decide when to ask the user for confirmation; they never enforce anything.
   */
  annotations?: ToolAnnotations;
  /** Groups the tool for a catalog's `search` filter. Not sent on `tools/list`. */
  tags?: string[];
  /**
   * The line a catalog's `search` shows for the tool. Defaults to the first
   * line of `description`. Not sent on `tools/list`.
   */
  summary?: string;
  /**
   * Tool metadata forwarded verbatim on `tools/list`. The MCP Apps extension
   * links a tool to its view through it: build the bag with
   * `registerAppResource(...).toolMeta()`.
   */
  _meta?: Record<string, unknown>;
  /** Answers a call with the (validated, when enforced) arguments. */
  handler: (
    args: Record<string, unknown>
  ) => CallToolResult | Promise<CallToolResult>;
}

const EMPTY_OBJECT_SCHEMA: JsonObjectSchema = {
  type: 'object',
  properties: {},
};

/** The JSON Schema dialect the MCP SDK converts Standard Schemas to. */
const JSON_SCHEMA_TARGET = 'draft-2020-12';

const isStandardSchema = (
  schema: ToolSchema
): schema is StandardSchemaWithJSON => {
  return '~standard' in schema;
};

/**
 * Converts a JSON Schema into the Standard Schema `registerTool` accepts.
 *
 * A Standard Schema keeps advertisement and enforcement in separate fields:
 * `~standard.jsonSchema` is what `tools/list` publishes, `~standard.validate`
 * is what `tools/call` runs. Replacing only `validate` therefore keeps the
 * schema fully visible to clients while leaving arguments unchecked.
 */
const fromJsonObjectSchema = ({
  schema,
  validate,
}: {
  schema: JsonObjectSchema;
  validate: boolean;
}): StandardSchemaWithJSON => {
  // `JsonObjectSchema` deliberately keeps `properties` as `Record<string,
  // unknown>` for a simple public API; `fromJsonSchema` wants the SDK's
  // recursive `JsonSchemaType`. The runtime shape is the same JSON Schema
  // object either way — only the static type is looser here.
  const standard = fromJsonSchema(schema as JsonSchemaType);
  if (validate) return standard;
  return {
    '~standard': {
      ...standard['~standard'],
      validate: (value: unknown) => {
        return { value };
      },
    },
  } as StandardSchemaWithJSON;
};

/** A tool's schemas in the two forms every exposure needs. */
export interface ResolvedToolSchemas {
  /** What `registerTool` takes: advertises the schema, runs the enforcement. */
  input: StandardSchemaWithJSON;
  /** The input as plain JSON Schema, for a catalog's `describe`. */
  inputJson: Record<string, unknown>;
  output?: StandardSchemaWithJSON;
}

const resolved = new WeakMap<Tool, ResolvedToolSchemas>();

/**
 * Resolves a tool's schemas once, so the direct registration and a catalog's
 * `call` enforce exactly the same thing.
 */
export const resolveToolSchemas = (tool: Tool): ResolvedToolSchemas => {
  const cached = resolved.get(tool);
  if (cached) return cached;

  const inputSchema = tool.inputSchema ?? EMPTY_OBJECT_SCHEMA;
  const input = isStandardSchema(inputSchema)
    ? inputSchema
    : fromJsonObjectSchema({
        schema: inputSchema,
        validate: tool.validateArguments ?? false,
      });
  const inputJson = isStandardSchema(inputSchema)
    ? inputSchema['~standard'].jsonSchema.input({ target: JSON_SCHEMA_TARGET })
    : inputSchema;
  const output =
    tool.outputSchema === undefined || isStandardSchema(tool.outputSchema)
      ? tool.outputSchema
      : fromJsonObjectSchema({ schema: tool.outputSchema, validate: true });

  const result = { input, inputJson, output };
  resolved.set(tool, result);
  return result;
};

/** Registers one tool as one MCP tool. */
export const registerDirectTool = ({
  server,
  tool,
}: {
  server: McpServer;
  tool: Tool;
}): void => {
  const schemas = resolveToolSchemas(tool);
  server.registerTool(
    tool.name,
    {
      title: tool.title,
      description: tool.description,
      inputSchema: schemas.input,
      outputSchema: schemas.output,
      annotations: tool.annotations,
      _meta: tool._meta,
    },
    async (args: unknown) => {
      return tool.handler(args as Record<string, unknown>);
    }
  );
};

/** An `isError` result whose text is `{ error, code? }` as JSON. */
export const toolError = ({
  message,
  code,
}: {
  message: string;
  code?: string;
}): CallToolResult & { isError: true } => {
  const payload =
    code === undefined ? { error: message } : { error: message, code };
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload) }],
    isError: true as const,
  };
};

/** Parameters for {@link defineTool}. */
export interface DefineToolParams extends Omit<Tool, 'handler'> {
  /**
   * Answers a call with plain data, which becomes the tool result: JSON text,
   * plus `structuredContent` when `outputSchema` is set. Resolving to `null`
   * or `undefined` answers `notFoundMessage` as an `isError` result.
   */
  method: (args: Record<string, unknown>) => unknown;
  /**
   * The `isError` message for a `null` or `undefined` result.
   * @default 'Not found'
   */
  notFoundMessage?: string;
}

/**
 * Builds a {@link Tool} from a `method` that returns data instead of a
 * `CallToolResult`, which is what most hand-written tools want.
 *
 * @example
 * ```typescript
 * const getCampaign = defineTool({
 *   name: 'get-campaign',
 *   description: 'Get a campaign by id.',
 *   inputSchema: z.object({ campaignId: z.string() }),
 *   method: ({ campaignId }) => findCampaign(campaignId as string),
 *   notFoundMessage: 'Campaign not found',
 * });
 * ```
 */
export const defineTool = ({
  method,
  notFoundMessage = 'Not found',
  ...tool
}: DefineToolParams): Tool => {
  return {
    ...tool,
    handler: async (args) => {
      const result = await method(args);
      if (result == null) return toolError({ message: notFoundMessage });
      // TextContent stays alongside structuredContent for clients that ignore
      // structured output (MCP spec, tools → structured content).
      const content = [{ type: 'text' as const, text: JSON.stringify(result) }];
      return tool.outputSchema === undefined
        ? { content }
        : { content, structuredContent: result as Record<string, unknown> };
    },
  };
};
