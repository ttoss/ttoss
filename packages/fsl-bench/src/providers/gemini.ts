import type { ChatMessage, Provider } from './index.ts';

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 529]);
const MAX_ATTEMPTS = 4;

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

/**
 * Shared REST core for Google's `generateContent` dialect. The same wire
 * format serves the Google AI API (API-key auth) and Vertex AI (OAuth), so
 * the request/response/retry logic exists once and each channel contributes
 * only its URL + auth headers. No SDK dependency. Retries retryable
 * statuses with exponential backoff.
 */
export const callGenerateContent = async ({
  url,
  headers,
  system,
  messages,
}: {
  url: string;
  headers: Record<string, string>;
  system: string;
  messages: ChatMessage[];
}): Promise<string> => {
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
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body,
    });

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
};

/**
 * Gemini via the Google AI API (generativelanguage.googleapis.com). Auth
 * via GEMINI_API_KEY. Model resolution (default/env/inline) lives in the
 * provider registry (index.ts).
 */
export const createGeminiProvider = ({
  model,
}: {
  model: string;
}): Provider => {
  return {
    name: 'gemini',
    model,
    generate: async ({ system, messages }) => {
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        throw new Error(
          'GEMINI_API_KEY is not set — create one at https://aistudio.google.com/apikey'
        );
      }

      return callGenerateContent({
        url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        headers: { 'x-goog-api-key': apiKey },
        system,
        messages,
      });
    },
  };
};
