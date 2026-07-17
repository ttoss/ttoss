import { AnthropicVertex } from '@anthropic-ai/vertex-sdk';
import type { JWTInput } from 'google-auth-library';
import { GoogleAuth } from 'google-auth-library';

import type { ClaudeMessagesClient } from './claude.ts';
import { createClaudeProvider } from './claude.ts';
import { callGenerateContent } from './gemini.ts';
import type { Provider } from './index.ts';
import type { VertexConfig } from './vertexConfig.ts';
import { resolveVertexConfig, vertexModelFamily } from './vertexConfig.ts';

/**
 * The `vertex` channel — Google Vertex AI, hosting two model families
 * behind two dialects: Gemini (Google-published, `generateContent`) and
 * Claude (partner model, Anthropic Messages API). The model id picks the
 * family (vertexModelFamily); auth and project resolution are shared
 * (resolveVertexConfig) and happen at call time, never at construction.
 */

const createAuth = (config: VertexConfig): GoogleAuth => {
  return new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    ...(config.credentials
      ? { credentials: config.credentials as JWTInput }
      : {}),
  });
};

const createVertexGeminiProvider = ({ model }: { model: string }): Provider => {
  let auth: GoogleAuth | undefined;

  return {
    name: 'vertex',
    model,
    generate: async ({ system, messages }) => {
      const config = resolveVertexConfig();
      auth ??= createAuth(config);
      // google-auth-library caches and refreshes the token internally.
      const token = await auth.getAccessToken();
      const host =
        config.location === 'global'
          ? 'aiplatform.googleapis.com'
          : `${config.location}-aiplatform.googleapis.com`;

      return callGenerateContent({
        url: `https://${host}/v1/projects/${config.projectId}/locations/${config.location}/publishers/google/models/${model}:generateContent`,
        headers: { authorization: `Bearer ${token}` },
        system,
        messages,
      });
    },
  };
};

const createVertexClaudeProvider = ({ model }: { model: string }): Provider => {
  return createClaudeProvider({
    name: 'vertex',
    model,
    createClient: () => {
      const config = resolveVertexConfig();

      return new AnthropicVertex({
        projectId: config.projectId,
        region: config.location,
        googleAuth: createAuth(config),
        maxRetries: 4,
      }) as unknown as ClaudeMessagesClient;
    },
  });
};

export const createVertexProvider = ({
  model,
}: {
  model: string;
}): Provider => {
  // Unknown families fail fast at construction — a typo'd model id should
  // kill the run before any sample is spent.
  return vertexModelFamily(model) === 'gemini'
    ? createVertexGeminiProvider({ model })
    : createVertexClaudeProvider({ model });
};
