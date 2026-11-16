import type { JsonObject } from '@ttoss/react-openapi';

/**
 * Sample records for the SOAT fake API, referencing each other the way real
 * ones do (`agent.guardrail_ids`, `actor.agent_id`…).
 */

// ─── Seed data ───────────────────────────────────────────────────────────────

const PROJECTS = ['proj_support', 'proj_research', 'proj_ops'];

const at = (day: number): string => {
  return new Date(Date.UTC(2026, 8, 1 + day, 9 + (day % 8))).toISOString();
};

const seedProjects = (): JsonObject[] => {
  return [
    {
      id: 'proj_support',
      name: 'Customer Support',
      guardrail_ids: ['guard_pii', 'guard_budget'],
      agent_policy_ids: ['pol_readonly'],
      default_model_route_id: 'route_primary',
      audit_reads_enabled: true,
      require_priced_model: false,
      default_conversation_retrieval: 'embed',
      trace_content_mode: 'full',
      max_concurrent_runs: 8,
      created_at: at(0),
      updated_at: at(20),
    },
    {
      id: 'proj_research',
      name: 'Research Lab',
      guardrail_ids: [],
      agent_policy_ids: null,
      default_model_route_id: 'route_cheap',
      audit_reads_enabled: false,
      require_priced_model: true,
      default_conversation_retrieval: 'none',
      trace_content_mode: 'none',
      max_concurrent_runs: null,
      created_at: at(3),
      updated_at: at(3),
    },
    {
      id: 'proj_ops',
      name: 'Internal Ops',
      guardrail_ids: ['guard_budget'],
      agent_policy_ids: ['pol_readonly', 'pol_tools'],
      default_model_route_id: null,
      audit_reads_enabled: false,
      require_priced_model: false,
      default_conversation_retrieval: 'none',
      trace_content_mode: 'full',
      max_concurrent_runs: 2,
      created_at: at(6),
      updated_at: at(9),
    },
  ];
};

const seedPolicies = (): JsonObject[] => {
  return [
    ['pol_readonly', 'ReadOnlyAccess', 'Read any resource of the project.'],
    ['pol_tools', 'ToolRunner', 'Call the tools bound to the agent.'],
    ['pol_admin', 'ProjectAdmin', 'Everything inside the project.'],
    ['pol_eval', 'EvalRunner', 'Run evaluations and read their results.'],
  ].map(([id, name, description], i) => {
    return {
      id,
      project_id: 'proj_support',
      name,
      description,
      document: {
        statement: [{ effect: 'Allow', action: [`${name}:*`], resource: '*' }],
      },
      created_at: at(i),
      updated_at: at(i),
    };
  });
};

const seedGuardrails = (): JsonObject[] => {
  return [
    ['guard_pii', 'PII Redaction', 'Masks personal data in tool outputs.'],
    ['guard_budget', 'Budget Update Guardrail', 'Caps spending changes.'],
    ['guard_tone', 'Tone Check', 'Blocks replies outside the brand voice.'],
  ].map(([id, name, description], i) => {
    return {
      id,
      project_id: PROJECTS[i % PROJECTS.length],
      name,
      description,
      version: 1 + i,
      context_mode: i === 1 ? 'replace' : 'merge',
      document: { deny: [{ when: 'tool.name == "transfer"' }] },
      created_at: at(i * 2),
      updated_at: at(i * 3),
    };
  });
};

const seedModelRoutes = (): JsonObject[] => {
  return [
    {
      id: 'route_primary',
      project_id: 'proj_support',
      name: 'primary-with-fallback',
      targets: [
        { ai_provider_id: 'aip_anthropic' },
        { ai_provider_id: 'aip_openai' },
      ],
      retry_on: ['rate_limit', 'server_error'],
      failure_threshold: 3,
      cooldown_seconds: 60,
      created_at: at(1),
      updated_at: at(4),
    },
    {
      id: 'route_cheap',
      project_id: 'proj_research',
      name: 'cheap-first',
      targets: [{ ai_provider_id: 'aip_groq' }],
      retry_on: ['rate_limit'],
      failure_threshold: 5,
      cooldown_seconds: 30,
      created_at: at(2),
      updated_at: at(2),
    },
  ];
};

const seedProviders = (): JsonObject[] => {
  return [
    ['aip_anthropic', 'Anthropic', 'anthropic', 'claude-sonnet-5-5'],
    ['aip_openai', 'OpenAI', 'openai', 'gpt-5'],
    ['aip_groq', 'Groq', 'groq', 'llama-4-70b'],
  ].map(([id, name, provider, model], i) => {
    return {
      id,
      project_id: PROJECTS[i % PROJECTS.length],
      name,
      provider,
      default_model: model,
      model_aliases_only: false,
      created_at: at(i),
      updated_at: at(i),
    };
  });
};

const AGENT_NAMES = [
  'Triage',
  'Billing',
  'Refunds',
  'Onboarding',
  'Escalation',
  'Knowledge Base',
  'Survey',
  'Scheduler',
];

const PROVIDERS = ['aip_anthropic', 'aip_openai', 'aip_groq'];

/** 23 agents in Customer Support (three pages of 10), 8 in the others. */
const seedAgents = (): JsonObject[] => {
  return Array.from({ length: 31 }, (_, i) => {
    const project = i < 23 ? 'proj_support' : PROJECTS[1 + (i % 2)];
    return {
      id: `agent_${String(100 + i)}`,
      project_id: project,
      name: `${AGENT_NAMES[i % AGENT_NAMES.length]} ${1 + Math.floor(i / AGENT_NAMES.length)}`,
      ai_provider_id: PROVIDERS[i % PROVIDERS.length],
      model_route_id: i % 3 === 0 ? 'route_primary' : null,
      model: i % 2 === 0 ? 'claude-sonnet-5-5' : null,
      instructions: 'Answer politely and cite the knowledge base.',
      guardrail_ids: i % 2 === 0 ? ['guard_pii'] : ['guard_pii', 'guard_tone'],
      policy_ids:
        i % 4 === 0 ? ['pol_readonly', 'pol_tools'] : ['pol_readonly'],
      run_as: i % 3 === 0 ? 'agent' : 'caller',
      temperature: Math.round((0.2 + (i % 5) * 0.15) * 100) / 100,
      max_steps: 4 + (i % 6),
      max_output_tokens: 1024,
      version: 1 + (i % 4),
      created_at: at(i),
      updated_at: at(i + 2),
    };
  });
};

const ACTOR_NAMES = ['Alice', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio'];

const seedActors = (): JsonObject[] => {
  return Array.from({ length: 14 }, (_, i) => {
    return {
      id: `actor_${String(200 + i)}`,
      project_id: i < 11 ? 'proj_support' : 'proj_ops',
      name: `${ACTOR_NAMES[i % ACTOR_NAMES.length]} ${String.fromCharCode(65 + i)}.`,
      external_id: `+5581999${String(1000 + i * 37).slice(-4)}`,
      agent_id: `agent_${String(100 + (i % 23))}`,
      tags: { channel: i % 2 === 0 ? 'whatsapp' : 'web' },
      created_at: at(i),
      updated_at: at(i),
    };
  });
};

const seedDatasets = (): JsonObject[] => {
  return [
    ['dset_refunds', 'Refund requests', 'Real refund conversations, labelled.'],
    ['dset_tone', 'Tone samples', 'Replies rated for brand voice.'],
  ].map(([id, name, description], i) => {
    return {
      id,
      project_id: 'proj_support',
      name,
      description,
      created_at: at(i),
      updated_at: at(i),
    };
  });
};

const seedEvals = (): JsonObject[] => {
  return [
    ['eval_refunds', 'Refund accuracy', 'agent_102', 'dset_refunds'],
    ['eval_tone', 'Tone regression', 'agent_100', 'dset_tone'],
  ].map(([id, name, agent, dataset], i) => {
    return {
      id,
      project_id: 'proj_support',
      name,
      agent_id: agent,
      dataset_id: dataset,
      policy_ids: ['pol_eval'],
      scorers: [{ kind: 'exact_match' }],
      pass_threshold: 0.8,
      created_at: at(i),
      updated_at: at(i),
    };
  });
};

export const SEEDS: Record<string, () => JsonObject[]> = {
  projects: seedProjects,
  policies: seedPolicies,
  guardrails: seedGuardrails,
  'model-routes': seedModelRoutes,
  'ai-providers': seedProviders,
  agents: seedAgents,
  actors: seedActors,
  datasets: seedDatasets,
  evals: seedEvals,
};

/** Id prefix of new records, as the real API names them. */
export const ID_PREFIX: Record<string, string> = {
  projects: 'proj',
  policies: 'pol',
  guardrails: 'guard',
  'model-routes': 'route',
  'ai-providers': 'aip',
  agents: 'agent',
  actors: 'actor',
  datasets: 'dset',
  evals: 'eval',
};
