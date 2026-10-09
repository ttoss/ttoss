/**
 * What a client loads for one tool before the first call: the three fields a
 * `tools/list` answers. `openApiToToolDefinitions` returns this shape, and so
 * does a `tools/list` result.
 */
export interface McpSurfaceTool {
  name: string;
  description?: string;
  inputSchema?: unknown;
}

/** The size of each part of an MCP surface, in characters of JSON. */
export interface McpSurfaceReport {
  /** Sum of every tool's size. Instructions are not included. */
  total: number;
  /** One entry per tool, largest first. */
  tools: Array<{ name: string; size: number }>;
  /** Length of the server instructions, or `0` when there are none. */
  instructions: number;
}

/**
 * The limits a surface is checked against. `description` and `instructions`
 * have defaults, because a client cuts them; `total` and `perTool` are a
 * product's own choice, not a property of any client.
 */
export interface McpSurfaceBudget {
  /** Ceiling on the sum of every tool's size. */
  total?: number;
  /** Ceiling on any one tool's size. */
  perTool?: number;
  /**
   * Ceiling on any one tool's description length. Unlike `perTool`, it leaves
   * out the name and input schema, which no client cuts.
   * @default 2048
   */
  description?: number;
  /**
   * Ceiling on the instructions' length.
   * @default 2048
   */
  instructions?: number;
}

/** One limit a surface exceeds. */
export type McpSurfaceViolation =
  | { kind: 'total'; size: number; limit: number }
  | { kind: 'per_tool'; name: string; size: number; limit: number }
  | { kind: 'description'; name: string; size: number; limit: number }
  | { kind: 'instructions'; size: number; limit: number };

/**
 * Claude Code truncates a server's instructions at this many characters
 * without telling anyone, so a rule past it never reaches an agent
 * (https://code.claude.com/docs/en/mcp; a user can change it with
 * `CLAUDE_CODE_MAX_MCP_DESCRIPTION_LENGTH`).
 */
export const DEFAULT_INSTRUCTIONS_LIMIT = 2048;

/**
 * Claude Code truncates each tool description at the same length as the
 * instructions, from the same documentation, and just as silently.
 */
export const DEFAULT_DESCRIPTION_LIMIT = 2048;

const sizeOf = (tool: McpSurfaceTool): number => {
  return JSON.stringify({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
  }).length;
};

/**
 * Measures what an MCP server costs every session that connects to it: each
 * tool's name, description and input schema, and the instructions.
 *
 * It does not judge; {@link checkMcpSurface} compares the same numbers with a
 * budget.
 */
export const measureMcpSurface = ({
  tools,
  instructions,
}: {
  tools: McpSurfaceTool[];
  instructions?: string;
}): McpSurfaceReport => {
  const sizes = tools
    .map((tool) => {
      return { name: tool.name, size: sizeOf(tool) };
    })
    .sort((a, b) => {
      return b.size - a.size;
    });

  return {
    total: sizes.reduce((sum, entry) => {
      return sum + entry.size;
    }, 0),
    tools: sizes,
    instructions: instructions?.length ?? 0,
  };
};

const checkDescriptions = ({
  tools,
  limit,
}: {
  tools: McpSurfaceTool[];
  limit: number;
}): McpSurfaceViolation[] => {
  return tools.flatMap((tool) => {
    const size = tool.description?.length ?? 0;

    return size > limit
      ? [{ kind: 'description' as const, name: tool.name, size, limit }]
      : [];
  });
};

/**
 * Every limit an MCP surface exceeds, or `[]` when it fits.
 *
 * Returns rather than throws, so a test's `expect(...).toEqual([])` prints
 * which tool went over and by how much. Meant for a test, not for boot: a
 * server refusing to start over a few hundred bytes is worse than a red test.
 *
 * @example
 * ```typescript
 * expect(
 *   checkMcpSurface({
 *     tools,
 *     instructions,
 *     budget: { total: 70_000, perTool: 10_000 },
 *   })
 * ).toEqual([]);
 * ```
 */
export const checkMcpSurface = ({
  tools,
  instructions,
  budget = {},
}: {
  tools: McpSurfaceTool[];
  instructions?: string;
  budget?: McpSurfaceBudget;
}): McpSurfaceViolation[] => {
  const report = measureMcpSurface({ tools, instructions });
  const violations: McpSurfaceViolation[] = [];

  if (budget.total !== undefined && report.total > budget.total) {
    violations.push({ kind: 'total', size: report.total, limit: budget.total });
  }

  if (budget.perTool !== undefined) {
    for (const { name, size } of report.tools) {
      if (size > budget.perTool) {
        violations.push({
          kind: 'per_tool',
          name,
          size,
          limit: budget.perTool,
        });
      }
    }
  }

  violations.push(
    ...checkDescriptions({
      tools,
      limit: budget.description ?? DEFAULT_DESCRIPTION_LIMIT,
    })
  );

  const instructionsLimit = budget.instructions ?? DEFAULT_INSTRUCTIONS_LIMIT;

  if (report.instructions > instructionsLimit) {
    violations.push({
      kind: 'instructions',
      size: report.instructions,
      limit: instructionsLimit,
    });
  }

  return violations;
};

// A backticked identifier with at least one `-` or `_`: `get-next`,
// `list_tasks`. A single word such as `blocks` is as often a field or a value
// as a tool, so it is left out rather than reported.
const TOOL_MENTION = /`([a-z][a-z0-9]*(?:[-_][a-z0-9]+)+)`/g;

/**
 * The tool names the instructions mention that the surface does not have.
 *
 * Instructions are read once, at connect: a renamed tool they still name is
 * one every connected agent is taught to call and then told is "not found".
 * Pass `pattern` (a global RegExp whose first group is the name) when the
 * instructions name tools some other way.
 */
export const findUnknownToolMentions = ({
  instructions,
  tools,
  pattern = TOOL_MENTION,
}: {
  instructions: string;
  tools: Array<Pick<McpSurfaceTool, 'name'>>;
  pattern?: RegExp;
}): string[] => {
  const known = new Set(
    tools.map((tool) => {
      return tool.name;
    })
  );

  const mentioned = new Set(
    [...instructions.matchAll(pattern)].map(([, name]) => {
      return name;
    })
  );

  return [...mentioned].filter((name) => {
    return !known.has(name);
  });
};
