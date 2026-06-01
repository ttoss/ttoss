/**
 * Jest global setup file.
 *
 * Polyfills Node.js built-in globals that Jest's sandbox does not expose by
 * default (even on Node 18+).  Without this, any module that references
 * `TextDecoder` or `TextEncoder` at module evaluation time (e.g. maplibre-gl
 * v5 which uses `@maplibre/mlt`) will throw `ReferenceError` in both the
 * `node` and `jsdom` Jest environments.
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { TextDecoder, TextEncoder } = require('node:util') as {
  TextDecoder: typeof globalThis.TextDecoder;
  TextEncoder: typeof globalThis.TextEncoder;
};

if (!globalThis.TextDecoder) {
  globalThis.TextDecoder = TextDecoder;
}
if (!globalThis.TextEncoder) {
  globalThis.TextEncoder = TextEncoder;
}
