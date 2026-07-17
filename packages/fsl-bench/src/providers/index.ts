import {
  createAnthropicProvider,
  createBedrockProvider,
  createVertexProvider,
} from './claude.ts';
import { createGeminiProvider } from './gemini.ts';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Minimal generation interface shared by every provider. One call = one
 * completion; conversation state (the repair loop) is threaded by the
 * runner through `messages`.
 */
export interface Provider {
  name: ProviderId;
  model: string;
  generate(params: {
    system: string;
    messages: ChatMessage[];
  }): Promise<string>;
}

/**
 * The provider space has two orthogonal axes: the MODEL FAMILY (Claude,
 * Gemini — what the report compares) and the TRANSPORT CHANNEL (how the
 * model is reached — which auth the user has). A ProviderId names one
 * family+channel pair; adding a channel is one registry entry + one
 * factory, nothing else changes.
 */
export type ProviderId = 'anthropic' | 'gemini' | 'vertex' | 'bedrock';

interface ProviderEntry {
  create: (options: { model: string }) => Provider;
  defaultModel: string;
  /** One-line auth hint, surfaced in errors and docs. */
  auth: string;
}

export const PROVIDERS: Record<ProviderId, ProviderEntry> = {
  anthropic: {
    create: createAnthropicProvider,
    defaultModel: 'claude-opus-4-8',
    auth: 'ANTHROPIC_API_KEY',
  },
  gemini: {
    create: createGeminiProvider,
    // Google-maintained alias that always resolves to the current
    // recommended pro-tier model — pinned snapshots (e.g. gemini-2.5-pro)
    // get retired for new API keys/projects on a rolling basis and 404.
    defaultModel: 'gemini-pro-latest',
    auth: 'GEMINI_API_KEY',
  },
  vertex: {
    create: createVertexProvider,
    // Channels are transport, not model choice: the three Claude channels
    // share one default model (Bedrock spells it with its `anthropic.`
    // prefix). Which models are actually callable depends on what the
    // user's project/account has enabled — override per run as needed.
    defaultModel: 'claude-opus-4-8',
    auth: 'GOOGLE_APPLICATION_CREDENTIALS + ANTHROPIC_VERTEX_PROJECT_ID + CLOUD_ML_REGION',
  },
  bedrock: {
    create: createBedrockProvider,
    // Bedrock model ids carry the `anthropic.` provider prefix.
    defaultModel: 'anthropic.claude-opus-4-8',
    auth: 'AWS credentials chain + AWS_REGION',
  },
};

const isProviderId = (id: string): id is ProviderId => {
  return id in PROVIDERS;
};

/**
 * Parses a `--providers` item: `<id>` or `<id>:<model>` (the model may
 * itself contain `:`, e.g. Bedrock ARNs).
 */
export const parseProviderSpec = (
  spec: string
): { id: ProviderId; model?: string } => {
  const separator = spec.indexOf(':');
  const id = separator === -1 ? spec : spec.slice(0, separator);
  const model = separator === -1 ? undefined : spec.slice(separator + 1);

  if (!isProviderId(id)) {
    throw new Error(
      `Unknown provider "${id}". Available: ${Object.keys(PROVIDERS).join(
        ', '
      )} — append :<model-id> to override the model (e.g. vertex:claude-opus-4-8).`
    );
  }

  return { id, model: model || undefined };
};

/**
 * Model resolution, highest precedence first:
 * 1. inline spec (`--providers vertex:claude-opus-4-8`)
 * 2. env override (`FSL_BENCH_<PROVIDER>_MODEL`)
 * 3. the registry default
 */
export const createProvider = (spec: string): Provider => {
  const { id, model } = parseProviderSpec(spec);
  const entry = PROVIDERS[id];

  return entry.create({
    model:
      model ??
      process.env[`FSL_BENCH_${id.toUpperCase()}_MODEL`] ??
      entry.defaultModel,
  });
};
