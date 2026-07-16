import type { Provider } from './index.ts';

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 529]);
const MAX_ATTEMPTS = 4;

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * Google Gemini provider via the REST generateContent endpoint (no SDK
 * dependency). Auth via GEMINI_API_KEY. Retries retryable statuses with
 * exponential backoff.
 *
 * Default is the `gemini-pro-latest` alias (Google-maintained, always
 * resolves to the current recommended pro-tier model) rather than a pinned
 * version — pinned snapshots (e.g. `gemini-2.5-pro`) get retired for new
 * API keys/projects on a rolling basis and 404. Override with
 * FSL_BENCH_GEMINI_MODEL to pin a specific snapshot for a frozen campaign.
 */
export const createGeminiProvider = ({
  model = process.env.FSL_BENCH_GEMINI_MODEL ?? 'gemini-pro-latest',
}: {
  model?: string;
} = {}): Provider => {
  return {
    name: 'gemini',
    model,
    generate: async ({ system, messages }) => {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not set');
      }

      const body = JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: messages.map((message) => {
          return {
            role: message.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: message.content }],
          };
        }),
        generationConfig: { temperature: 0 },
      });

      let lastError = '';

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
          {
            method: 'POST',
            headers: {
              'content-type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body,
          }
        );

        if (RETRYABLE_STATUS.has(response.status)) {
          lastError = `${response.status} ${await response.text()}`;
          await sleep(2000 * 2 ** (attempt - 1));
          continue;
        }

        if (!response.ok) {
          throw new Error(
            `Gemini request failed: ${response.status} ${await response.text()}`
          );
        }

        const data = (await response.json()) as {
          candidates?: {
            content?: { parts?: { text?: string }[] };
          }[];
        };

        const text = data.candidates?.[0]?.content?.parts
          ?.map((part) => {
            return part.text ?? '';
          })
          .join('');

        if (!text) {
          throw new Error(
            `Gemini returned no text candidate: ${JSON.stringify(data).slice(
              0,
              400
            )}`
          );
        }

        return text;
      }

      throw new Error(
        `Gemini request failed after ${MAX_ATTEMPTS} attempts: ${lastError}`
      );
    },
  };
};
