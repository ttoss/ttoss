import {
  resolveVertexConfig,
  vertexModelFamily,
} from '../../../src/providers/vertexConfig.ts';

describe('vertexModelFamily', () => {
  test('claude-* ids are the claude family', () => {
    expect(vertexModelFamily('claude-opus-4-8')).toBe('claude');
    expect(vertexModelFamily('claude-sonnet-4-6@20250514')).toBe('claude');
  });

  test('gemini-* ids are the gemini family', () => {
    expect(vertexModelFamily('gemini-3.5-flash')).toBe('gemini');
    expect(vertexModelFamily('gemini-2.5-pro')).toBe('gemini');
  });

  test('anything else fails fast with the accepted shapes', () => {
    expect(() => {
      return vertexModelFamily('gpt-5');
    }).toThrow(/claude-\* or gemini-\*/);
  });
});

describe('resolveVertexConfig', () => {
  const KEY_JSON = JSON.stringify({
    type: 'service_account',
    project_id: 'proj-from-key',
    client_email: 'sa@proj-from-key.iam.gserviceaccount.com',
    private_key: '---',
  });

  test('parses the inline service-account key and uses its project_id', () => {
    const config = resolveVertexConfig({
      GOOGLE_APPLICATION_CREDENTIALS_JSON: KEY_JSON,
    });

    expect(config.projectId).toBe('proj-from-key');
    expect(config.credentials?.client_email).toBe(
      'sa@proj-from-key.iam.gserviceaccount.com'
    );
    expect(config.location).toBe('global');
  });

  test('explicit env project ids beat the key project_id, in order', () => {
    expect(
      resolveVertexConfig({
        GOOGLE_APPLICATION_CREDENTIALS_JSON: KEY_JSON,
        ANTHROPIC_VERTEX_PROJECT_ID: 'proj-anthropic',
        GOOGLE_CLOUD_PROJECT: 'proj-gcloud',
      }).projectId
    ).toBe('proj-anthropic');

    expect(
      resolveVertexConfig({
        GOOGLE_APPLICATION_CREDENTIALS_JSON: KEY_JSON,
        GOOGLE_CLOUD_PROJECT: 'proj-gcloud',
      }).projectId
    ).toBe('proj-gcloud');
  });

  test('works without inline credentials (ADC) when a project is named', () => {
    const config = resolveVertexConfig({
      ANTHROPIC_VERTEX_PROJECT_ID: 'proj-adc',
    });

    expect(config.credentials).toBeUndefined();
    expect(config.projectId).toBe('proj-adc');
  });

  test('CLOUD_ML_REGION overrides the global default location', () => {
    expect(
      resolveVertexConfig({
        ANTHROPIC_VERTEX_PROJECT_ID: 'p',
        CLOUD_ML_REGION: 'us-east5',
      }).location
    ).toBe('us-east5');
  });

  test('invalid inline JSON fails with an actionable message', () => {
    expect(() => {
      return resolveVertexConfig({
        GOOGLE_APPLICATION_CREDENTIALS_JSON: '{not json',
      });
    }).toThrow(/not valid JSON/);
  });

  test('no project id anywhere fails listing every source', () => {
    expect(() => {
      return resolveVertexConfig({});
    }).toThrow(
      /GOOGLE_APPLICATION_CREDENTIALS_JSON.*ANTHROPIC_VERTEX_PROJECT_ID.*GOOGLE_CLOUD_PROJECT/s
    );
  });

  test('defaults to process.env', () => {
    const saved = {
      json: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
      anthropic: process.env.ANTHROPIC_VERTEX_PROJECT_ID,
      gcloud: process.env.GOOGLE_CLOUD_PROJECT,
      region: process.env.CLOUD_ML_REGION,
    };

    delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    delete process.env.GOOGLE_CLOUD_PROJECT;
    delete process.env.CLOUD_ML_REGION;
    process.env.ANTHROPIC_VERTEX_PROJECT_ID = 'proj-process-env';

    try {
      expect(resolveVertexConfig().projectId).toBe('proj-process-env');
    } finally {
      const restore = (key: string, value: string | undefined) => {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      };
      restore('GOOGLE_APPLICATION_CREDENTIALS_JSON', saved.json);
      restore('ANTHROPIC_VERTEX_PROJECT_ID', saved.anthropic);
      restore('GOOGLE_CLOUD_PROJECT', saved.gcloud);
      restore('CLOUD_ML_REGION', saved.region);
    }
  });
});
