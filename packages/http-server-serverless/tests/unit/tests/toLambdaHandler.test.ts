import { App } from '@ttoss/http-server';
import serverless from 'serverless-http';
import { buildRawHeaders, toLambdaHandler } from 'src/index';

jest.mock('serverless-http', () => {
  return jest.fn().mockReturnValue(jest.fn());
});

const mockedServerless = jest.mocked(serverless);

describe('buildRawHeaders', () => {
  describe('API Gateway REST v1 (multiValueHeaders)', () => {
    test('builds raw headers from multiValueHeaders', () => {
      const event = {
        multiValueHeaders: {
          accept: ['application/json, text/event-stream'],
          'content-type': ['application/json'],
        },
      };

      const raw = buildRawHeaders(event);

      expect(raw).toEqual([
        'accept',
        'application/json, text/event-stream',
        'content-type',
        'application/json',
      ]);
    });

    test('preserves duplicate header values', () => {
      const event = {
        multiValueHeaders: {
          'x-custom': ['value1', 'value2'],
        },
      };

      const raw = buildRawHeaders(event);

      expect(raw).toEqual(['x-custom', 'value1', 'x-custom', 'value2']);
    });

    test('returns once multiValueHeaders is found, ignoring headers/cookies', () => {
      const event = {
        multiValueHeaders: { accept: ['application/json'] },
        headers: { 'x-other': 'should-be-ignored' },
        cookies: ['session=abc'],
      };

      const raw = buildRawHeaders(event);

      expect(raw).toEqual(['accept', 'application/json']);
      expect(raw).not.toContain('x-other');
      expect(raw).not.toContain('cookie');
    });
  });

  describe('API Gateway HTTP API v2 (headers + cookies)', () => {
    test('builds raw headers from headers object', () => {
      const event = {
        headers: {
          accept: 'application/json, text/event-stream',
          'content-type': 'application/json',
        },
      };

      const raw = buildRawHeaders(event);

      expect(raw).toEqual([
        'accept',
        'application/json, text/event-stream',
        'content-type',
        'application/json',
      ]);
    });

    test('appends each cookie as a separate cookie header', () => {
      const event = {
        headers: { accept: 'application/json' },
        cookies: ['session=abc123', 'theme=dark'],
      };

      const raw = buildRawHeaders(event);

      expect(raw).toContain('cookie');
      const cookieIdx = raw.indexOf('cookie');
      expect(raw[cookieIdx + 1]).toBe('session=abc123');
      expect(raw).toContain('theme=dark');
    });

    test('skips headers with undefined values', () => {
      const event = {
        headers: {
          accept: 'application/json',
          'x-undefined': undefined,
        },
      };

      const raw = buildRawHeaders(event);

      expect(raw).toContain('accept');
      expect(raw).not.toContain('x-undefined');
    });

    test('coerces non-string header values to strings', () => {
      const event = {
        headers: { 'x-count': 42 },
      };

      const raw = buildRawHeaders(event);

      expect(raw).toEqual(['x-count', '42']);
    });
  });

  describe('edge cases', () => {
    test('returns empty array for empty event', () => {
      expect(buildRawHeaders({})).toEqual([]);
    });

    test('returns empty array for null event', () => {
      expect(buildRawHeaders(null)).toEqual([]);
    });

    test('returns empty array for undefined event', () => {
      expect(buildRawHeaders(undefined)).toEqual([]);
    });

    test('returns empty array when headers object is missing', () => {
      expect(buildRawHeaders({ cookies: ['a=b'] })).toEqual(['cookie', 'a=b']);
    });
  });
});

describe('toLambdaHandler', () => {
  beforeEach(() => {
    mockedServerless.mockReturnValue(jest.fn());
  });

  test('returns a function (Lambda handler)', () => {
    const app = new App();
    const handler = toLambdaHandler(app);
    expect(typeof handler).toBe('function');
  });

  test('passes app.callback() and a request transform to serverless-http', () => {
    const app = new App();
    toLambdaHandler(app);

    expect(mockedServerless).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ request: expect.any(Function) })
    );
  });

  describe('request transform', () => {
    const getTransform = () => {
      const app = new App();
      toLambdaHandler(app);
      const [, options] = mockedServerless.mock.calls[0];
      return options.request as (
        req: Record<string, unknown>,
        event: unknown
      ) => void;
    };

    test('populates rawHeaders when empty', () => {
      const transform = getTransform();
      const req: Record<string, unknown> = { rawHeaders: [] };
      const event = {
        multiValueHeaders: {
          accept: ['application/json, text/event-stream'],
        },
      };

      transform(req, event);

      expect(req.rawHeaders).toEqual([
        'accept',
        'application/json, text/event-stream',
      ]);
    });

    test('does not overwrite rawHeaders that are already populated', () => {
      const transform = getTransform();
      const existing = ['accept', 'text/plain'];
      const req: Record<string, unknown> = { rawHeaders: existing };
      const event = {
        multiValueHeaders: { accept: ['application/json'] },
      };

      transform(req, event);

      expect(req.rawHeaders).toBe(existing);
    });

    test('populates rawHeaders when the property is undefined', () => {
      const transform = getTransform();
      const req: Record<string, unknown> = {};
      const event = { headers: { 'x-api-key': 'secret' } };

      transform(req, event);

      expect(req.rawHeaders).toEqual(['x-api-key', 'secret']);
    });
  });
});
