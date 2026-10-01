import {
  createToolGate,
  type CreateToolGateOptions,
  defineTool,
  type DefineToolParams,
  type Tool,
  type ToolCallContext,
  type ToolCallGate,
  type ToolIdentity,
  z,
} from 'src/index';

type ToolCallResult = {
  isError?: true;
  content: Array<{ type: string; text: string }>;
  structuredContent?: unknown;
};

/** Gates one `defineTool` tool and calls it the way a registered tool runs. */
const setupGate = (options: CreateToolGateOptions) => {
  const gate = createToolGate(options);
  let tool: Tool | undefined;
  const defineGated = ({
    requiredScope,
    gates,
    ...def
  }: DefineToolParams & { requiredScope: string; gates?: ToolCallGate[] }) => {
    tool = gate({ tool: defineTool(def), requiredScope, gates });
    return tool;
  };
  const call = (args: Record<string, unknown> = {}) => {
    if (!tool) throw new Error('defineGated not called');
    return tool.handler(args) as Promise<ToolCallResult>;
  };
  return { defineGated, call };
};

const makeIdentity = (overrides: Partial<ToolIdentity> = {}): ToolIdentity => {
  return { userId: 'user-1', scopes: ['read'], ...overrides };
};

describe('createToolGate', () => {
  describe('scope check', () => {
    test('returns isError result when required scope is missing; handler not called', async () => {
      const handler = jest.fn().mockResolvedValue({ ok: true });

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['other:scope'] });
        },
      });

      defineGated({
        name: 'admin-tool',
        description: 'admin tool',
        requiredScope: 'admin',
        method: handler,
      });

      const result = await call({});
      expect(result.isError).toBe(true);
      expect(JSON.parse(result.content[0].text).error).toContain('admin');
      expect(handler).not.toHaveBeenCalled();
    });

    test('proceeds when required scope is present', async () => {
      const handler = jest.fn().mockResolvedValue({ success: true });

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['campaigns:read'] });
        },
      });

      defineGated({
        name: 'list-campaigns',
        description: 'list campaigns',
        requiredScope: 'campaigns:read',
        method: handler,
      });

      const result = await call({});
      expect(result.isError).toBeUndefined();
      expect(handler).toHaveBeenCalled();
    });

    test('treats absent scopes (undefined) as empty — returns isError', async () => {
      const handler = jest.fn().mockResolvedValue({ ok: true });

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return { userId: 'user-1' } as ToolIdentity;
        },
      });

      defineGated({
        name: 'scoped-tool',
        description: 'scoped',
        requiredScope: 'admin',
        method: handler,
      });

      const result = await call({});
      expect(result.isError).toBe(true);
      expect(handler).not.toHaveBeenCalled();
    });

    test('enforceScope: false skips the scope check', async () => {
      const handler = jest.fn().mockResolvedValue({ ok: true });

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return makeIdentity({ scopes: [] });
        },
        enforceScope: false,
      });

      defineGated({
        name: 'unscoped-tool',
        description: 'unscoped',
        requiredScope: 'admin',
        method: handler,
      });

      const result = await call({});
      expect(result.isError).toBeUndefined();
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('gates', () => {
    test('runs global gates in order; a throwing gate rejects the call', async () => {
      const order: string[] = [];
      const gateA = jest.fn(async () => {
        order.push('A');
      });
      const gateB = jest.fn(async () => {
        throw new Error('gate-B failed');
      });
      const gateC = jest.fn(async () => {
        order.push('C');
      });
      const handler = jest.fn().mockResolvedValue({ ok: true });

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['tools:run'] });
        },
        gates: [gateA, gateB, gateC],
      });

      defineGated({
        name: 'guarded',
        description: 'guarded tool',
        requiredScope: 'tools:run',
        method: handler,
      });

      await expect(call({})).rejects.toThrow('gate-B failed');
      expect(order).toEqual(['A']); // gateC never ran
      expect(handler).not.toHaveBeenCalled();
    });

    test('gate receives full ToolCallContext (identity + args + handler name)', async () => {
      const receivedContexts: ToolCallContext[] = [];
      const identity = makeIdentity({ userId: 'alice', scopes: ['x'] });
      const callArgs = { campaignId: 99 };

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return identity;
        },
        gates: [
          (ctx) => {
            receivedContexts.push(ctx);
          },
        ],
      });

      defineGated({
        name: 'id-tool',
        description: 'id tool',
        requiredScope: 'x',
        method: jest.fn().mockResolvedValue({}),
      });

      await call(callArgs);
      expect(receivedContexts).toHaveLength(1);
      expect(receivedContexts[0].identity).toEqual(identity);
      expect(receivedContexts[0].args).toEqual(callArgs);
      expect(receivedContexts[0].handler).toBe('id-tool');
    });

    test('per-def gates run after global gates and also receive ToolCallContext', async () => {
      const order: string[] = [];
      const identity = makeIdentity({ scopes: ['write'] });
      const callArgs = { isActive: true };

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return identity;
        },
        gates: [
          (ctx) => {
            order.push(`global:${ctx.handler}`);
          },
        ],
      });

      defineGated({
        name: 'per-def-tool',
        description: 'per def gates',
        requiredScope: 'write',
        gates: [
          (ctx) => {
            order.push(`def:isActive=${String(ctx.args.isActive)}`);
          },
        ],
        method: jest.fn().mockResolvedValue({ ok: true }),
      });

      await call(callArgs);
      expect(order).toEqual(['global:per-def-tool', 'def:isActive=true']);
    });

    test('throwing per-def gate rejects the call; global gate already ran', async () => {
      const order: string[] = [];

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['write'] });
        },
        gates: [
          () => {
            order.push('global');
          },
        ],
      });

      defineGated({
        name: 'blocked-tool',
        description: 'blocked',
        requiredScope: 'write',
        gates: [
          () => {
            throw new Error('per-def gate rejected');
          },
        ],
        method: jest.fn().mockResolvedValue({ ok: true }),
      });

      await expect(call({})).rejects.toThrow('per-def gate rejected');
      expect(order).toEqual(['global']);
    });

    test('arg-conditional per-def gate picks different predicate based on args', async () => {
      const activated: boolean[] = [];
      const identity = makeIdentity({ scopes: ['write'] });

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return identity;
        },
      });

      defineGated({
        name: 'toggle',
        description: 'toggle',
        requiredScope: 'write',
        gates: [
          ({ args }) => {
            // simulate conditional logic — only flag which branch ran
            activated.push(args.isActive === true);
          },
        ],
        method: jest.fn().mockResolvedValue({ done: true }),
      });

      await call({ isActive: true });
      await call({ isActive: false });
      expect(activated).toEqual([true, false]);
    });
  });

  describe('buildContext', () => {
    test('buildContext output is merged into handler args', async () => {
      const handler = jest.fn().mockResolvedValue({ done: true });
      const identity = makeIdentity({ userId: 'bob', scopes: ['write'] });

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return identity;
        },
        buildContext: ({ identity: id }) => {
          return { tenantId: `tenant-${id.userId}` };
        },
      });

      defineGated({
        name: 'ctx-tool',
        description: 'ctx tool',
        requiredScope: 'write',
        method: handler,
      });

      await call({ key: 'val' });
      expect(handler).toHaveBeenCalledWith({
        key: 'val',
        tenantId: 'tenant-bob',
      });
    });

    test('buildContext receives args so context can vary per call', async () => {
      const handler = jest.fn().mockResolvedValue({ done: true });

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['r'] });
        },
        buildContext: ({ args }) => {
          return { doubled: (args.n as number) * 2 };
        },
      });

      defineGated({
        name: 'args-ctx-tool',
        description: 'args ctx',
        requiredScope: 'r',
        method: handler,
      });

      await call({ n: 5 });
      expect(handler).toHaveBeenCalledWith({ n: 5, doubled: 10 });
    });
  });

  describe('result shaping', () => {
    test('null result returns "Not found" error', async () => {
      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['r'] });
        },
      });

      defineGated({
        name: 'null-tool',
        description: 'null',
        requiredScope: 'r',
        method: async () => {
          return null;
        },
      });

      const result = await call({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Not found');
    });

    test('undefined result returns "Not found" error', async () => {
      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['r'] });
        },
      });

      defineGated({
        name: 'undef-tool',
        description: 'undef',
        requiredScope: 'r',
        method: async () => {
          return undefined;
        },
      });

      const result = await call({});
      expect(result.isError).toBe(true);
    });

    test('object result is JSON-wrapped in content', async () => {
      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['r'] });
        },
      });

      defineGated({
        name: 'obj-tool',
        description: 'obj',
        requiredScope: 'r',
        method: async () => {
          return { id: 42, name: 'widget' };
        },
      });

      const result = await call({});
      expect(result.isError).toBeUndefined();
      expect(result.content[0].type).toBe('text');
      expect(JSON.parse(result.content[0].text)).toEqual({
        id: 42,
        name: 'widget',
      });
    });

    test('notFoundMessage overrides the default "Not found" text', async () => {
      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['r'] });
        },
      });

      defineGated({
        name: 'custom-msg-tool',
        notFoundMessage: 'Campaign not found',
        description: 'custom msg',
        requiredScope: 'r',
        method: async () => {
          return null;
        },
      });

      const result = await call({});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Campaign not found');
    });
  });

  describe('onError', () => {
    test('handler throw triggers onError with full ToolCallContext, then rethrows', async () => {
      const onError = jest.fn();
      const error = new Error('handler-boom');
      const identity = makeIdentity({ userId: 'eve', scopes: ['admin'] });
      const callArgs = { payload: 'data' };

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return identity;
        },
        onError,
      });

      defineGated({
        name: 'failing-tool',
        description: 'failing',
        requiredScope: 'admin',
        method: async () => {
          throw error;
        },
      });

      await expect(call(callArgs)).rejects.toThrow('handler-boom');
      expect(onError).toHaveBeenCalledWith(error, {
        identity,
        args: callArgs,
        handler: 'failing-tool',
      });
    });

    test('handler throw is rethrown directly when onError is not provided', async () => {
      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['admin'] });
        },
      });

      defineGated({
        name: 'no-hook-tool',
        description: 'no hook',
        requiredScope: 'admin',
        method: async () => {
          throw new Error('direct-rethrow');
        },
      });

      await expect(call({})).rejects.toThrow('direct-rethrow');
    });

    test('gate throw does NOT trigger onError', async () => {
      const onError = jest.fn();

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return makeIdentity({ scopes: ['x'] });
        },
        gates: [
          () => {
            throw new Error('gate-rejection');
          },
        ],
        onError,
      });

      defineGated({
        name: 'gate-error-tool',
        description: 'gate error',
        requiredScope: 'x',
        method: jest.fn().mockResolvedValue({ ok: true }),
      });

      await expect(call({})).rejects.toThrow('gate-rejection');
      expect(onError).not.toHaveBeenCalled();
    });
  });

  describe('default resolveIdentity', () => {
    test('needs no options at all', async () => {
      const gated = createToolGate()({
        tool: defineTool({
          name: 'bare',
          description: 'bare',
          method: jest.fn(),
        }),
        requiredScope: 'r',
      });

      const result = (await gated.handler({})) as ToolCallResult;
      expect(JSON.parse(result.content[0].text).error).toBe('Unauthorized');
    });

    test('falls back to getIdentity() from context when resolveIdentity is not provided', async () => {
      const { defineGated, call } = setupGate({});

      defineGated({
        name: 'context-tool',
        description: 'context',
        requiredScope: 'r',
        method: jest.fn(),
      });

      // getIdentity() returns undefined outside an MCP request context →
      // clean Unauthorized isError result (not a raw TypeError)
      const result = await call({});
      expect(result.isError).toBe(true);
      expect(JSON.parse(result.content[0].text).error).toContain(
        'Unauthorized'
      );
    });
  });

  describe('undefined identity guard', () => {
    test('resolveIdentity returning undefined yields isError Unauthorized; handler not called', async () => {
      const handler = jest.fn().mockResolvedValue({ ok: true });

      const { defineGated, call } = setupGate({
        resolveIdentity: () => {
          return undefined as unknown as ReturnType<typeof makeIdentity>;
        },
      });

      defineGated({
        name: 'unauthed-tool',
        description: 'unauthed',
        requiredScope: 'admin',
        method: handler,
      });

      const result = await call({});
      expect(result.isError).toBe(true);
      expect(JSON.parse(result.content[0].text).error).toContain(
        'Unauthorized'
      );
      expect(handler).not.toHaveBeenCalled();
    });
  });
  describe('the gated tool', () => {
    test('keeps every field of the tool it wraps but the handler', () => {
      const tool: Tool = {
        name: 'get-item',
        title: 'Get Item',
        description: 'Get an item',
        inputSchema: z.object({ id: z.string() }),
        annotations: { readOnlyHint: true },
        tags: ['items'],
        summary: 'Get one item',
        _meta: { ui: { resourceUri: 'ui://app/view' } },
        handler: jest.fn(),
      };

      const gated = createToolGate({
        resolveIdentity: () => {
          return makeIdentity();
        },
      })({ tool, requiredScope: 'read' });

      const { handler: gatedHandler, ...fields } = gated;
      const { handler, ...original } = tool;
      expect(fields).toEqual(original);
      expect(gatedHandler).not.toBe(handler);
    });
  });
});

describe('defineTool', () => {
  test('without outputSchema, returns only text', async () => {
    const tool = defineTool({
      name: 'get-item',
      description: 'Get an item',
      method: async () => {
        return { id: 42 };
      },
    });

    const result = await tool.handler({});

    expect(result).not.toHaveProperty('structuredContent');
    expect(result.content).toEqual([
      { type: 'text', text: JSON.stringify({ id: 42 }) },
    ]);
  });

  test('with outputSchema, returns structuredContent and the same JSON as text', async () => {
    const tool = defineTool({
      name: 'get-item',
      description: 'Get an item',
      outputSchema: z.object({ id: z.number() }),
      method: async () => {
        return { id: 42 };
      },
    });

    const result = (await tool.handler({})) as ToolCallResult;

    expect(result.structuredContent).toEqual({ id: 42 });
    expect(JSON.parse(result.content[0].text)).toEqual(
      result.structuredContent
    );
  });

  test('passes the arguments to method and keeps the tool fields', async () => {
    const method = jest.fn().mockResolvedValue({ ok: true });
    const tool = defineTool({
      name: 'get-item',
      description: 'Get an item',
      tags: ['items'],
      method,
    });

    await tool.handler({ id: 'a' });

    expect(method).toHaveBeenCalledWith({ id: 'a' });
    expect(tool).toMatchObject({ name: 'get-item', tags: ['items'] });
    expect(tool).not.toHaveProperty('method');
  });
});
