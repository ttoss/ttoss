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

// `structuredClone` is used by @chakra-ui/react internals but is not
// available in all jsdom environments. Polyfill it with a recursive
// implementation that preserves Dates and handles common types.
if (typeof globalThis.structuredClone === 'undefined') {
  const seen = new WeakMap<object, unknown>();

  const clone = <T>(val: T): T => {
    if (val === null || typeof val !== 'object') return val;
    if (val instanceof Date) return new Date(val.getTime()) as T;

    const known = seen.get(val as object);
    if (known) return known as T;

    if (Array.isArray(val)) {
      const copy = new Array(val.length);
      seen.set(val, copy);
      for (let i = 0; i < val.length; i++) {
        copy[i] = clone(val[i]);
      }
      return copy as T;
    }

    const copy: Record<string, unknown> = {};
    seen.set(val as object, copy);
    for (const [key, value] of Object.entries(val as object)) {
      copy[key] = clone(value);
    }
    return copy as T;
  };

  globalThis.structuredClone = <T>(val: T): T => {
    seen.clear();
    return clone(val);
  };
}
