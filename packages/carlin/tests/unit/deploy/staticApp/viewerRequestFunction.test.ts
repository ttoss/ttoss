import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_LOGICAL_NAME } from 'src/deploy/baseStack/config';
import { getCloudFrontTemplate } from 'src/deploy/baseStack/getCloudFrontTemplate';
import {
  APPEND_INDEX_HTML_HELPER,
  getViewerRequestFunctionCode,
  MAX_FUNCTION_SIZE_BYTES,
  readViewerRequestFunctionCode,
  REDIRECT_TO_TRAILING_SLASH_FUNCTION_CODE,
  REDIRECT_TO_TRAILING_SLASH_HELPER,
} from 'src/deploy/staticApp/viewerRequestFunction';

const HANDLER = `function handler(event) {
  return appendIndexHtml(event.request);
}`;

const writeFixture = (code: string) => {
  const filePath = path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), 'carlin-viewer-request-')),
    'viewerRequest.js'
  );

  fs.writeFileSync(filePath, code);

  return filePath;
};

describe('readViewerRequestFunctionCode', () => {
  test('should read the file the option points to', () => {
    const filePath = writeFixture(HANDLER);

    expect(readViewerRequestFunctionCode({ filePath })).toEqual(HANDLER);
  });

  test('should throw when the file does not exist', () => {
    return expect(() => {
      return readViewerRequestFunctionCode({
        filePath: 'does/not/exist.js',
      });
    }).toThrow('points to "does/not/exist.js", which doesn\'t exist');
  });
});

const INJECTED_HELPERS = `${APPEND_INDEX_HTML_HELPER}\n\n${REDIRECT_TO_TRAILING_SLASH_HELPER}`;

describe('getViewerRequestFunctionCode', () => {
  test('should inject the helpers before the app code', () => {
    const code = getViewerRequestFunctionCode({ code: HANDLER });

    expect(code).toEqual(`${INJECTED_HELPERS}\n\n${HANDLER}\n`);

    for (const helper of ['appendIndexHtml', 'redirectToTrailingSlash']) {
      expect(code.indexOf(`function ${helper}`)).toBeLessThan(
        code.indexOf('function handler')
      );
    }
  });

  /**
   * The composed source has a single `handler`, which is what makes injecting
   * the logic as a helper different from concatenating the two functions: two
   * `handler` declarations would silently drop one of the behaviors.
   */
  test('should declare handler exactly once', () => {
    const code = getViewerRequestFunctionCode({ code: HANDLER });

    expect(code.match(/function\s+handler\s*\(/g)).toHaveLength(1);
  });

  test('should throw when the app code is empty', () => {
    return expect(() => {
      return getViewerRequestFunctionCode({ code: '  \n ' });
    }).toThrow('points to an empty file');
  });

  test('should throw when the app code does not declare a handler', () => {
    return expect(() => {
      return getViewerRequestFunctionCode({
        code: 'function viewerRequest(event) { return event.request; }',
      });
    }).toThrow('must declare a `function handler(event)`');
  });

  test('should throw when the composed code is above the CloudFront limit', () => {
    const padding = '/*'.padEnd(MAX_FUNCTION_SIZE_BYTES, '-') + '*/';

    return expect(() => {
      return getViewerRequestFunctionCode({ code: `${padding}\n${HANDLER}` });
    }).toThrow(`above the ${MAX_FUNCTION_SIZE_BYTES} bytes CloudFront allows`);
  });

  test('should count the injected helpers against the size limit', () => {
    /**
     * App code that fits on its own but not once the helpers are prepended.
     */
    const size =
      MAX_FUNCTION_SIZE_BYTES - Buffer.byteLength(INJECTED_HELPERS) + 1;

    const code = `${'/*'.padEnd(size - HANDLER.length - 4, '-')}*/\n${HANDLER}`;

    expect(Buffer.byteLength(code)).toBeLessThan(MAX_FUNCTION_SIZE_BYTES);

    return expect(() => {
      return getViewerRequestFunctionCode({ code });
    }).toThrow('count against this budget');
  });
});

/**
 * The helper is a copy of the base stack `AppendIndexDotHtml` function, so the
 * two are asserted to behave the same instead of trusting they stay in sync.
 */
describe('appendIndexHtml helper matches the base stack function', () => {
  const baseStackFunctionCode = getCloudFrontTemplate().Resources[
    BASE_STACK_CLOUDFRONT_FUNCTION_APPEND_INDEX_HTML_LOGICAL_NAME
  ].Properties?.FunctionCode as string;

  const baseStackHandler = new Function(
    `${baseStackFunctionCode}; return handler;`
  )();

  const helper = new Function(
    `${APPEND_INDEX_HTML_HELPER}; return appendIndexHtml;`
  )();

  test.each([
    '/',
    '/docs/',
    '/docs/guide',
    '/about',
    '/index.html',
    '/docs/guide.md',
    '/assets/main.js',
  ])('should rewrite %s the same way', (uri) => {
    expect(helper({ uri })).toEqual(baseStackHandler({ request: { uri } }));
  });
});

/**
 * The redirect is what the function does in production, so it is asserted by
 * running the code carlin deploys rather than by matching its source.
 */
describe('redirectToTrailingSlash function', () => {
  const handler = new Function(
    `${REDIRECT_TO_TRAILING_SLASH_FUNCTION_CODE}; return handler;`
  )();

  const request = ({
    uri,
    querystring = {},
  }: {
    uri: string;
    querystring?: Record<string, unknown>;
  }) => {
    return handler({ request: { uri, querystring } });
  };

  test.each([
    ['/', '/index.html'],
    ['/docs/', '/docs/index.html'],
  ])('should serve %p as %p', (uri, served) => {
    expect(request({ uri })).toEqual(expect.objectContaining({ uri: served }));
  });

  test.each(['/index.html', '/docs/guide.md', '/assets/main.js'])(
    'should serve %p untouched',
    (uri) => {
      expect(request({ uri })).toEqual(expect.objectContaining({ uri }));
    }
  );

  test.each(['/docs/guide', '/about'])(
    'should redirect %p to its trailing slash form',
    (uri) => {
      expect(request({ uri })).toEqual({
        statusCode: 301,
        statusDescription: 'Moved Permanently',
        headers: { location: { value: `${uri}/` } },
      });
    }
  );

  /**
   * A redirect that dropped the query string would break the attribution of
   * every campaign link pointing at a page without the trailing slash.
   */
  test('should carry the query string over', () => {
    const response = request({
      uri: '/docs/guide',
      querystring: {
        utm_source: { value: 'newsletter' },
        utm_content: { value: 'a%20b' },
        flag: { value: '' },
      },
    });

    expect(response.headers.location.value).toEqual(
      '/docs/guide/?utm_source=newsletter&utm_content=a%20b&flag='
    );
  });

  /**
   * A parameter sent more than once is collapsed into a single field whose
   * `multiValue` holds every value, the first of them repeated in `value`.
   */
  test('should carry duplicate parameters over', () => {
    const response = request({
      uri: '/docs/guide',
      querystring: {
        tag: {
          value: 'a',
          multiValue: [{ value: 'a' }, { value: 'b' }],
        },
      },
    });

    expect(response.headers.location.value).toEqual('/docs/guide/?tag=a&tag=b');
  });

  test('should fit the CloudFront function size limit', () => {
    expect(
      Buffer.byteLength(REDIRECT_TO_TRAILING_SLASH_FUNCTION_CODE, 'utf8')
    ).toBeLessThan(MAX_FUNCTION_SIZE_BYTES);
  });

  /**
   * The helper is the whole body of the function, so the two cannot drift.
   */
  test('should be the injected helper called by a handler', () => {
    expect(REDIRECT_TO_TRAILING_SLASH_FUNCTION_CODE).toContain(
      REDIRECT_TO_TRAILING_SLASH_HELPER
    );

    expect(
      REDIRECT_TO_TRAILING_SLASH_FUNCTION_CODE.match(/function\s+handler\s*\(/g)
    ).toHaveLength(1);
  });
});
