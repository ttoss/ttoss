import type { OpenApiSpec } from 'src/index';

/**
 * A realistic OpenAPI document exercising every branch of the generator:
 * path/query/body params, `$ref`s (schema and parameter), `oneOf`/`anyOf`,
 * array items, server-managed fields, circular refs, and excluded operations.
 */
export const testSpec: OpenApiSpec = {
  paths: {
    '/agents': {
      get: {
        operationId: 'listAgents',
        description: "List all agents.\nSupports filters.'quoted'",
        parameters: [
          {
            name: 'limit',
            in: 'query',
            required: false,
            description: 'Max results',
            schema: { type: 'integer' },
          },
          {
            name: 'tags',
            in: 'query',
            required: true,
            description: 'Filter by tags',
            schema: { type: 'array', items: { type: 'string' } },
          },
          { $ref: '#/components/parameters/ProjectId' },
        ],
      },
      post: {
        operationId: 'createAgent',
        description: 'Create an agent',
        'x-iam-action': 'agents:CreateAgent',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateAgentBody' },
            },
          },
        },
      },
    },
    '/agents/{agent_id}': {
      get: {
        operationId: 'getAgent',
        description: 'Get an agent by ID',
        parameters: [
          {
            name: 'agent_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
      },
      delete: {
        operationId: 'deleteAgent',
        description: 'Delete an agent',
        parameters: [
          {
            name: 'agent_id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
      },
      // Unsupported HTTP method — must be skipped.
      head: {
        operationId: 'headAgent',
        description: 'ignored',
      },
    },
    '/internal': {
      // Excluded from the MCP surface via the exclude extension.
      get: {
        operationId: 'internalOp',
        description: 'internal',
        'x-mcp-exclude': true,
      },
      // No operationId — must be skipped.
      post: {
        description: 'anonymous',
      },
    },
    '/actors': {
      post: {
        operationId: 'createActor',
        description: 'Create an actor (agent xor chat)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/AgentActor' },
                  { $ref: '#/components/schemas/ChatActor' },
                ],
              },
            },
          },
        },
      },
    },
  },
  components: {
    parameters: {
      ProjectId: {
        name: 'project_id',
        in: 'query',
        required: true,
        description: 'Project scope',
        schema: { type: 'string' },
      },
    },
    schemas: {
      CreateAgentBody: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', description: 'Agent name' },
          model_config: { $ref: '#/components/schemas/ModelConfig' },
          skill_ids: {
            type: 'array',
            items: { type: 'string' },
            description: 'Attached skills',
          },
          id: {
            type: 'string',
            description: 'Server-assigned id',
            'x-mcp-server-managed': true,
          },
        },
      },
      ModelConfig: {
        type: 'object',
        properties: {
          temperature: { type: 'number' },
          // Circular ref back to CreateAgentBody to exercise the guard.
          parent: { $ref: '#/components/schemas/CreateAgentBody' },
        },
      },
      AgentActor: {
        type: 'object',
        required: ['agent_id', 'name'],
        properties: {
          name: { type: 'string' },
          agent_id: { type: 'string' },
        },
      },
      ChatActor: {
        type: 'object',
        required: ['chat_id', 'name'],
        properties: {
          name: { type: 'string' },
          chat_id: { type: 'string' },
        },
      },
    },
  },
};
