import fs from 'node:fs';
import path from 'node:path';

/**
 * Maximum size of a CloudFront Function, in bytes.
 *
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cloudfront-function-quotas.html
 */
export const MAX_FUNCTION_SIZE_BYTES = 10 * 1024;

/**
 * https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/writing-function-code.html
 */
export const FUNCTION_RUNTIME = 'cloudfront-js-2.0';

/**
 * `appendIndexHtml` injected into every app-supplied viewer request function.
 *
 * A cache behavior takes a single viewer request function, so an app that
 * supplies its own cannot also associate the shared `AppendIndexDotHtml` of the
 * base stack. Composing the two by concatenating their sources would not work
 * either: both would declare `handler`, and the later declaration would win
 * silently, dropping one of the behaviors.
 *
 * Injecting the logic as a named helper instead leaves a single `handler` in the
 * composed source and makes the order explicit at the call site, which is where
 * it matters — a function rewriting `/docs/x` to `/docs/x.md` must run before
 * the index appending, one rewriting `/docs/x` to `/x/docs` after it.
 *
 * The body is the base stack `AppendIndexDotHtml` function
 * (`getCloudFrontTemplate.ts`) with the event unwrapping removed, so both
 * behave the same. `tests/unit/deploy/staticApp/viewerRequestFunction.test.ts`
 * asserts they don't drift.
 */
export const APPEND_INDEX_HTML_HELPER = `function appendIndexHtml(request) {
  var uri = request.uri;
  if (uri.endsWith('/')) {
    request.uri += 'index.html';
  } else if (!uri.includes('.')) {
    request.uri += '/index.html';
  }
  return request;
}`;

/**
 * The entry point CloudFront calls. A function whose code doesn't declare it
 * fails at deploy time with an opaque error, so it's checked at synth time.
 */
const HANDLER_DECLARATION_REGEX = /function\s+handler\s*\(/;

/**
 * Reads the file the `viewerRequestFunctionCode` option points to.
 */
export const readViewerRequestFunctionCode = ({
  filePath,
}: {
  filePath: string;
}): string => {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `The viewer-request-function-code option points to "${filePath}", which doesn't exist.`
    );
  }

  return fs.readFileSync(resolvedPath, 'utf8');
};

/**
 * Composes the source of the per-app `AWS::CloudFront::Function`: the
 * `appendIndexHtml` helper followed by the app code, which owns the `handler`.
 */
export const getViewerRequestFunctionCode = ({
  code,
}: {
  code: string;
}): string => {
  if (!code.trim()) {
    throw new Error(
      'The viewer-request-function-code option points to an empty file.'
    );
  }

  if (!HANDLER_DECLARATION_REGEX.test(code)) {
    throw new Error(
      'The viewer request function code must declare a `function handler(event)`, which is the entry point CloudFront calls.'
    );
  }

  const functionCode = `${APPEND_INDEX_HTML_HELPER}\n\n${code.trim()}\n`;

  /**
   * The helper counts against the app budget, so the size of the composed
   * source is what CloudFront rejects.
   */
  const size = Buffer.byteLength(functionCode, 'utf8');

  if (size > MAX_FUNCTION_SIZE_BYTES) {
    throw new Error(
      `The viewer request function is ${size} bytes, above the ${MAX_FUNCTION_SIZE_BYTES} bytes CloudFront allows. The \`appendIndexHtml\` helper carlin injects counts against this budget.`
    );
  }

  return functionCode;
};
