import Anthropic from '@anthropic-ai/sdk';

import type { Provider } from './index.ts';

/**
 * Anthropic provider. Auth via ANTHROPIC_API_KEY (or an `ant auth login`
 * profile); the SDK retries 429/5xx with backoff automatically.
 */
export const createAnthropicProvider = ({
  model = process.env.FSL_BENCH_ANTHROPIC_MODEL ?? 'claude-opus-4-8',
}: {
  model?: string;
} = {}): Provider => {
  const client = new Anthropic({ maxRetries: 4 });

  return {
    name: 'anthropic',
    model,
    generate: async ({ system, messages }) => {
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
          return (block as { text: string }).text;
        })
        .join('\n');
    },
  };
};
