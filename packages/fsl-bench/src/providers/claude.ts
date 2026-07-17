import { AnthropicBedrockMantle } from '@anthropic-ai/bedrock-sdk';
import Anthropic from '@anthropic-ai/sdk';
import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';

import type { ChatMessage, Provider, ProviderId } from './index.ts';

/**
 * Claude providers — one model family, three transport channels (direct
 * Anthropic API, Google Vertex AI, Amazon Bedrock). All three SDK clients
 * expose the same `messages.create` surface, so the generation logic exists
 * once and each channel contributes only its client construction + auth.
 *
 * Clients are constructed lazily (on first generate), so building a
 * provider never touches the environment — auth errors surface at call
 * time with an actionable message.
 */
interface ClaudeMessagesClient {
  messages: {
    create(params: {
      model: string;
      max_tokens: number;
      thinking: { type: 'adaptive' };
      system: string;
      messages: ChatMessage[];
    }): Promise<{ content: { type: string; text?: string }[] }>;
  };
}

const requireEnv = (name: string, hint: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set — ${hint}`);
  }

  return value;
};

const createClaudeProvider = ({
  name,
  model,
  createClient,
}: {
  name: ProviderId;
  model: string;
  createClient: () => ClaudeMessagesClient;
}): Provider => {
  let client: ClaudeMessagesClient | undefined;

  return {
    name,
    model,
    generate: async ({ system, messages }) => {
      client ??= createClient();

      const response = await client.messages.create({
        model,
        max_tokens: 16000,
        thinking: { type: 'adaptive' },
        system,
        messages,
      });

      return response.content
        .filter((block) => {
          return block.type === 'text';
        })
        .map((block) => {
          return block.text ?? '';
        })
        .join('\n');
    },
  };
};

/** Direct Anthropic API. Auth via ANTHROPIC_API_KEY; SDK retries 429/5xx. */
export const createAnthropicProvider = ({
  model,
}: {
  model: string;
}): Provider => {
  return createClaudeProvider({
    name: 'anthropic',
    model,
    createClient: () => {
      return new Anthropic({ maxRetries: 4 });
    },
  });
};

/**
 * Claude via Google Vertex AI (Model Garden). Auth via Application Default
 * Credentials — point GOOGLE_APPLICATION_CREDENTIALS at a service-account
 * key, or run `gcloud auth application-default login`.
 */
export const createVertexProvider = ({
  model,
}: {
  model: string;
}): Provider => {
  return createClaudeProvider({
    name: 'vertex',
    model,
    createClient: () => {
      return new AnthropicVertex({
        projectId: requireEnv(
          'ANTHROPIC_VERTEX_PROJECT_ID',
          'set it to the GCP project with Claude enabled in Model Garden'
        ),
        region: requireEnv(
          'CLOUD_ML_REGION',
          'set it to a region where the model is servable (e.g. us-east5)'
        ),
        maxRetries: 4,
      }) as unknown as ClaudeMessagesClient;
    },
  });
};

/**
 * Claude via Amazon Bedrock (Mantle / Messages-API endpoint). Auth via the
 * standard AWS credentials chain. Model ids carry the `anthropic.` prefix.
 */
export const createBedrockProvider = ({
  model,
}: {
  model: string;
}): Provider => {
  return createClaudeProvider({
    name: 'bedrock',
    model,
    createClient: () => {
      return new AnthropicBedrockMantle({
        awsRegion: requireEnv(
          'AWS_REGION',
          'set it to the AWS region where Claude is enabled on Bedrock'
        ),
        maxRetries: 4,
      }) as unknown as ClaudeMessagesClient;
    },
  });
};
