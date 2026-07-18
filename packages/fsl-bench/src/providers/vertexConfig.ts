/**
 * Pure resolution logic for the `vertex` channel — no SDK construction, no
 * network. Kept apart from the transport (vertex.ts) so it stays fully
 * unit-tested; the transport only wires these values into clients.
 */

export type VertexModelFamily = 'claude' | 'gemini';

/**
 * Vertex AI is a multi-family channel: Model Garden hosts Gemini
 * (Google-published, `generateContent` dialect) and Claude (partner model,
 * Anthropic Messages dialect) behind different endpoints. The model id
 * names its family; the channel dispatches on it.
 */
export const vertexModelFamily = (model: string): VertexModelFamily => {
  if (model.startsWith('claude')) {
    return 'claude';
  }

  if (model.startsWith('gemini')) {
    return 'gemini';
  }

  throw new Error(
    `The vertex channel cannot infer the model family of "${model}" — ` +
      'use a claude-* or gemini-* model id (e.g. vertex:claude-opus-4-8, vertex:gemini-3.5-flash).'
  );
};

export interface VertexConfig {
  /** Parsed service-account key, when provided inline via env. */
  credentials?: { project_id?: string } & Record<string, unknown>;
  projectId: string;
  /** Vertex location; `global` unless CLOUD_ML_REGION says otherwise. */
  location: string;
}

/**
 * Resolves auth inputs for the vertex channel, shared by both families.
 *
 * Credentials: GOOGLE_APPLICATION_CREDENTIALS_JSON carries the full
 * service-account key as a string — the shape environment secrets arrive
 * in, no file on disk needed. Absent that, the Google SDKs fall back to
 * Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS file
 * path, or `gcloud auth application-default login`).
 *
 * Project id precedence: explicit env (ANTHROPIC_VERTEX_PROJECT_ID, then
 * GOOGLE_CLOUD_PROJECT) beats the key's own project_id.
 */
export const resolveVertexConfig = (
  env: Record<string, string | undefined> = process.env
): VertexConfig => {
  const inline = env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  let credentials: VertexConfig['credentials'];

  if (inline) {
    try {
      credentials = JSON.parse(inline);
    } catch {
      throw new Error(
        'GOOGLE_APPLICATION_CREDENTIALS_JSON is set but is not valid JSON — ' +
          'paste the full service-account key file contents.'
      );
    }
  }

  const projectId =
    env.ANTHROPIC_VERTEX_PROJECT_ID ??
    env.GOOGLE_CLOUD_PROJECT ??
    credentials?.project_id;

  if (!projectId) {
    throw new Error(
      'No GCP project id for the vertex channel — set ' +
        'GOOGLE_APPLICATION_CREDENTIALS_JSON to a service-account key ' +
        '(its project_id is used), or set ANTHROPIC_VERTEX_PROJECT_ID / ' +
        'GOOGLE_CLOUD_PROJECT.'
    );
  }

  return {
    credentials,
    projectId,
    location: env.CLOUD_ML_REGION ?? 'global',
  };
};
