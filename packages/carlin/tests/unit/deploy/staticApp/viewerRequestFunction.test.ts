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

describe('getViewerRequestFunctionCode', () => {
  test('should inject the appendIndexHtml helper before the app code', () => {
    const code = getViewerRequestFunctionCode({ code: HANDLER });

    expect(code).toEqual(`${APPEND_INDEX_HTML_HELPER}\n\n${HANDLER}\n`);
    expect(code.indexOf('function appendIndexHtml')).toBeLessThan(
      code.indexOf('function handler')
    );
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

  test('should count the injected helper against the size limit', () => {
    /**
     * App code that fits on its own but not once the helper is prepended.
     */
    const size =
      MAX_FUNCTION_SIZE_BYTES - Buffer.byteLength(APPEND_INDEX_HTML_HELPER) + 1;

    const code = `${'/*'.padEnd(size - HANDLER.length - 4, '-')}*/\n${HANDLER}`;

    expect(Buffer.byteLength(code)).toBeLessThan(MAX_FUNCTION_SIZE_BYTES);

    return expect(() => {
      return getViewerRequestFunctionCode({ code });
    }).toThrow('counts against this budget');
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
