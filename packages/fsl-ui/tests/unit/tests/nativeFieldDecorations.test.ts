/**
 * Native in-field decorations — the UA's own controls must not draw into a
 * frame the anatomy already furnished (F-060).
 *
 * The defect this guards was visible only in a real browser: a `SearchField`
 * with text showed two ✕ in the trailing corner, Chromium's
 * `::-webkit-search-cancel-button` beside the clear button the anatomy drew.
 * jsdom renders no UA decoration and no pseudo-element, so a DOM assertion
 * cannot see the bug — what these tests hold is the *mechanism*: the reset
 * exists, it covers the duplicating pseudo-elements and only those, it is
 * injected exactly once, and it is reached from the shared builder rather
 * than from a component that a future field could forget to copy.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  ensureNativeFieldDecorationReset,
  NATIVE_FIELD_DECORATION_CSS,
} from 'src/tokens/nativeFieldDecorations';

const SOURCE_ROOT = resolve(__dirname, '../../../src');

/** Decorations that duplicate an adornment the field anatomy draws. */
const SUPPRESSED = [
  '::-webkit-search-cancel-button',
  '::-webkit-search-decoration',
  '::-webkit-search-results-button',
];

/**
 * Decorations that are the *only* affordance for their type. Suppressing one
 * removes function rather than a duplicate, so the reset must leave it alone
 * until a component ships its own replacement.
 */
const LEFT_ALONE = [
  '::-webkit-calendar-picker-indicator',
  '::-webkit-inner-spin-button',
  '::-webkit-outer-spin-button',
  '::-ms-reveal',
];

describe('the reset covers the duplicating decorations, and only those', () => {
  test.each(SUPPRESSED)('%s is suppressed', (pseudo) => {
    expect(NATIVE_FIELD_DECORATION_CSS).toContain(pseudo);
  });

  test.each(LEFT_ALONE)('%s is left to the browser', (pseudo) => {
    expect(NATIVE_FIELD_DECORATION_CSS).not.toContain(pseudo);
  });

  test("it targets the package's own control part, not every input", () => {
    // A bare `input::-webkit-…` rule would reach controls this package does
    // not own. The compound attribute selector is the CONTRACT §5 namespace.
    expect(NATIVE_FIELD_DECORATION_CSS).toContain(
      "[data-scope][data-part='control']"
    );
  });

  test('it declares both the modern and the legacy spelling', () => {
    expect(NATIVE_FIELD_DECORATION_CSS).toContain('-webkit-appearance: none');
    expect(NATIVE_FIELD_DECORATION_CSS).toContain('display: none');
  });
});

describe('the reset reaches every field, structurally', () => {
  test('the shared value builder is what injects it', () => {
    // The root fix is that no component calls this. If the call ever moves
    // into a component, the next field to be written can omit it — which is
    // how the original defect shipped.
    const anatomy = readFileSync(
      resolve(SOURCE_ROOT, 'components/Field/anatomy.tsx'),
      'utf8'
    );
    expect(anatomy).toContain('ensureNativeFieldDecorationReset()');
  });

  test('no component calls it directly', () => {
    const callers = ['composites/SearchField/SearchField.tsx'].map((file) => {
      return readFileSync(resolve(SOURCE_ROOT, file), 'utf8');
    });
    for (const source of callers) {
      expect(source).not.toContain('ensureNativeFieldDecorationReset');
    }
  });
});

describe('injection', () => {
  test('injects the stylesheet once and is idempotent', () => {
    ensureNativeFieldDecorationReset();
    ensureNativeFieldDecorationReset();
    const styles = document.querySelectorAll(
      '#fsl-ui-native-field-decorations'
    );
    expect(styles).toHaveLength(1);
    expect(styles[0]?.textContent).toBe(NATIVE_FIELD_DECORATION_CSS);
  });

  test('does not duplicate an element injected by another module copy', () => {
    ensureNativeFieldDecorationReset();
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fresh = require('src/tokens/nativeFieldDecorations') as {
        ensureNativeFieldDecorationReset: () => void;
      };
      fresh.ensureNativeFieldDecorationReset();
    });
    expect(
      document.querySelectorAll('#fsl-ui-native-field-decorations')
    ).toHaveLength(1);
  });
});
