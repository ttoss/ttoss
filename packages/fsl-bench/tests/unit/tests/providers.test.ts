import {
  createProvider,
  parseProviderSpec,
  PROVIDERS,
} from '../../../src/providers/index.ts';

const ENV_KEYS = [
  'FSL_BENCH_ANTHROPIC_MODEL',
  'FSL_BENCH_GEMINI_MODEL',
  'FSL_BENCH_VERTEX_MODEL',
  'FSL_BENCH_BEDROCK_MODEL',
  'ANTHROPIC_VERTEX_PROJECT_ID',
  'GOOGLE_APPLICATION_CREDENTIALS_JSON',
  'GOOGLE_CLOUD_PROJECT',
  'CLOUD_ML_REGION',
  'AWS_REGION',
];

const savedEnv: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key];
    delete process.env[key];
  }
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (savedEnv[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = savedEnv[key];
    }
  }
});

describe('parseProviderSpec', () => {
  test('parses a bare provider id', () => {
    expect(parseProviderSpec('gemini')).toEqual({
      id: 'gemini',
      model: undefined,
    });
  });

  test('parses an inline model override', () => {
    expect(parseProviderSpec('vertex:claude-opus-4-8')).toEqual({
      id: 'vertex',
      model: 'claude-opus-4-8',
    });
  });

  test('keeps colons inside the model id (e.g. Bedrock ARNs)', () => {
    expect(parseProviderSpec('bedrock:arn:aws:bedrock:model/x')).toEqual({
      id: 'bedrock',
      model: 'arn:aws:bedrock:model/x',
    });
  });

  test('rejects unknown providers listing the available ids', () => {
    expect(() => {
      return parseProviderSpec('openai');
    }).toThrow(/Unknown provider "openai".*anthropic, gemini, vertex, bedrock/);
  });
});

describe('createProvider — vertex family dispatch', () => {
  test('vertex accepts both claude-* and gemini-* model ids', () => {
    expect(createProvider('vertex:claude-opus-4-8').model).toBe(
      'claude-opus-4-8'
    );
    expect(createProvider('vertex:gemini-3.5-flash').model).toBe(
      'gemini-3.5-flash'
    );
    // Both are the same channel in the report's provider column.
    expect(createProvider('vertex:gemini-3.5-flash').name).toBe('vertex');
  });

  test('vertex rejects a model of unknown family at construction', () => {
    expect(() => {
      return createProvider('vertex:gpt-5');
    }).toThrow(/cannot infer the model family of "gpt-5"/);
  });
});

describe('createProvider — model resolution', () => {
  test('uses the registry default when nothing overrides', () => {
    for (const [id, entry] of Object.entries(PROVIDERS)) {
      const provider = createProvider(id);
      expect(provider.name).toBe(id);
      expect(provider.model).toBe(entry.defaultModel);
    }
  });

  test('env override beats the default', () => {
    process.env.FSL_BENCH_GEMINI_MODEL = 'gemini-9-experimental';
    expect(createProvider('gemini').model).toBe('gemini-9-experimental');
  });

  test('inline spec beats the env override', () => {
    process.env.FSL_BENCH_VERTEX_MODEL = 'claude-from-env';
    expect(createProvider('vertex:claude-from-spec').model).toBe(
      'claude-from-spec'
    );
  });
});

describe('createProvider — lazy auth', () => {
  test('construction never touches the environment (auth is call-time)', () => {
    // No provider env is set (cleared in beforeEach) and construction of
    // every provider still succeeds — credentials are only required when
    // generate() is first called.
    for (const id of Object.keys(PROVIDERS)) {
      expect(() => {
        return createProvider(id);
      }).not.toThrow();
    }
  });

  test('vertex (claude family) surfaces an actionable auth error at call time', async () => {
    await expect(
      createProvider('vertex').generate({ system: 's', messages: [] })
    ).rejects.toThrow('GOOGLE_APPLICATION_CREDENTIALS_JSON');
  });

  test('vertex (gemini family) surfaces the same auth error at call time', async () => {
    await expect(
      createProvider('vertex:gemini-3.5-flash').generate({
        system: 's',
        messages: [],
      })
    ).rejects.toThrow('GOOGLE_APPLICATION_CREDENTIALS_JSON');
  });

  test('bedrock surfaces an actionable auth error at call time', async () => {
    await expect(
      createProvider('bedrock').generate({ system: 's', messages: [] })
    ).rejects.toThrow('AWS_REGION');
  });

  test('gemini surfaces an actionable auth error at call time', async () => {
    const saved = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      await expect(
        createProvider('gemini').generate({ system: 's', messages: [] })
      ).rejects.toThrow('GEMINI_API_KEY');
    } finally {
      if (saved !== undefined) {
        process.env.GEMINI_API_KEY = saved;
      }
    }
  });
});
