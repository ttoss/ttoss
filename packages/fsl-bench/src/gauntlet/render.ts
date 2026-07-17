import { createRequire } from 'node:module';
import path from 'node:path';

import { findPackageRoot } from '../libraries.ts';
import type { Scenario } from '../types.ts';

/**
 * Gauntlet L2/L3 — does the sample mount, and does it behave?
 *
 * The gauntlet owns its DOM: a dedicated jsdom instance whose globals are
 * installed once, and React / RTL / user-event loaded through Node's NATIVE
 * module cache (createRequire). The bundled sample requires the same native
 * `react`, so harness and sample share a single React instance. This module
 * is executed by renderChild.ts in a dedicated Node process per sample.
 */

// jsdom's DOMWindow type is only needed structurally here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyWindow = any;

interface RenderFailure {
  level: 'render' | 'behavior';
  error: string;
}

/**
 * React's act() aggregates event-handler errors into an AggregateError with
 * an empty message — unwrap it so the repair loop sees the real failures.
 */
const describeError = (error: unknown): string => {
  if (error instanceof AggregateError && error.errors.length > 0) {
    return error.errors
      .map((inner) => {
        return inner instanceof Error ? inner.message : String(inner);
      })
      .join('\n');
  }

  if (error instanceof Error) {
    return error.message || String(error);
  }

  return String(error);
};

let nativeRequire: NodeJS.Require | undefined;

const getNativeRequire = (): NodeJS.Require => {
  if (!nativeRequire) {
    nativeRequire = createRequire(path.join(findPackageRoot(), 'package.json'));
  }
  return nativeRequire;
};

/**
 * Exposes the jsdom world globally (jest-environment style): constructors
 * and values are copied as-is; window-level functions are bound so their
 * `this` stays the jsdom window. Includes prototype-level interfaces that
 * own-property enumeration misses.
 */
const copyWindowGlobals = (window: AnyWindow): void => {
  const windowKeys = new Set<string>(Object.getOwnPropertyNames(window));

  // eslint-disable-next-line guard-for-in
  for (const key in window) {
    windowKeys.add(key);
  }

  for (const key of windowKeys) {
    if (key in globalThis) {
      continue;
    }

    const value = window[key];

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (globalThis as any)[key] =
        typeof value === 'function' && !/^[A-Z]/.test(key)
          ? value.bind(window)
          : value;
    } catch {
      // read-only global — leave it
    }
  }

  for (const [key, value] of Object.entries({
    window,
    document: window.document,
    navigator: window.navigator,
    location: window.location,
  })) {
    Object.defineProperty(globalThis, key, { value, configurable: true });
  }
};

/**
 * Node ships its own Event/CustomEvent/EventTarget; jsdom's dispatchEvent
 * rejects instances of the Node brands, so the jsdom constructors must win
 * even where a global already exists.
 */
const forceJsdomEventConstructors = (window: AnyWindow): void => {
  for (const key of [
    'Event',
    'CustomEvent',
    'EventTarget',
    'MessageEvent',
    'DOMException',
  ]) {
    const value = window[key];

    if (value) {
      Object.defineProperty(globalThis, key, { value, configurable: true });
    }
  }
};

/** Observer + matchMedia gaps the component stacks rely on. */
const installObserverStubs = (window: AnyWindow): void => {
  class ObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
    takeRecords(): unknown[] {
      return [];
    }
  }

  for (const name of ['ResizeObserver', 'IntersectionObserver']) {
    window[name] ??= ObserverStub;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any)[name] ??= ObserverStub;
  }

  if (!window.matchMedia) {
    const matchMedia = (query: string) => {
      return {
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => {
          return false;
        },
      };
    };
    window.matchMedia = matchMedia;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).matchMedia = matchMedia;
  }
};

/**
 * jsdom implements no `CSS` interface (overlay positioning probes it) and
 * none of the pointer-capture / scrollIntoView APIs Radix and React Aria
 * touch.
 */
const installCssAndPointerPolyfills = (window: AnyWindow): void => {
  if (!window.CSS) {
    const cssPolyfill = {
      escape: (value: string) => {
        return value.replace(/[^a-zA-Z0-9_-]/g, (char) => {
          return `\\${char}`;
        });
      },
      supports: () => {
        return false;
      },
    };
    window.CSS = cssPolyfill;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).CSS = cssPolyfill;
  }

  const elementPrototype = window.Element.prototype;
  elementPrototype.scrollIntoView ??= () => {};
  elementPrototype.hasPointerCapture ??= () => {
    return false;
  };
  elementPrototype.setPointerCapture ??= () => {};
  elementPrototype.releasePointerCapture ??= () => {};
};

let domReady = false;

const setupDom = (): void => {
  if (domReady) {
    return;
  }

  const requireNative = getNativeRequire();
  const { JSDOM } = requireNative('jsdom');

  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true,
  });
  const { window } = dom;

  copyWindowGlobals(window);
  forceJsdomEventConstructors(window);
  installObserverStubs(window);
  installCssAndPointerPolyfills(window);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

  domReady = true;
};

/**
 * Requires the bundled sample, mounts its default export and runs the
 * scenario's behavior assertions. Returns null on success, or the failed
 * level + a repair-loop-ready error message.
 */
export const renderAndAssert = async ({
  bundlePath,
  scenario,
}: {
  bundlePath: string;
  scenario: Scenario;
}): Promise<RenderFailure | null> => {
  setupDom();

  const requireNative = getNativeRequire();
  const React = requireNative('react');
  const rtl = requireNative('@testing-library/react');
  const userEvent = requireNative('@testing-library/user-event').default;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let sampleModule: any;

  try {
    sampleModule = requireNative(bundlePath);
  } catch (error) {
    return {
      level: 'render',
      error: `the module threw while evaluating: ${String(error)}`,
    };
  } finally {
    // Fresh evaluation per sample even if paths ever repeat.
    delete requireNative.cache[bundlePath];
  }

  const App = sampleModule.default ?? sampleModule.App;

  if (!App) {
    return {
      level: 'render',
      error:
        'the file must `export default` a React component (named App) — no default export found',
    };
  }

  try {
    try {
      rtl.render(React.createElement(App));
    } catch (error) {
      return {
        level: 'render',
        error: `rendering <App /> threw: ${String(error)}`,
      };
    }

    try {
      const user = userEvent.setup();
      await scenario.assert({
        screen: rtl.screen,
        user,
        waitFor: rtl.waitFor,
      });
    } catch (error) {
      return { level: 'behavior', error: describeError(error) };
    }
  } finally {
    rtl.cleanup();
    // Scrub state a sample can leak across the shared document: portal
    // remnants and scroll-lock styling (e.g. Radix leaves
    // `pointer-events: none` on <body> when a modal unmounts while open).
    document.body.innerHTML = '';
    document.body.removeAttribute('style');
    document.body.removeAttribute('data-scroll-locked');
    document.documentElement.removeAttribute('style');
  }

  return null;
};
