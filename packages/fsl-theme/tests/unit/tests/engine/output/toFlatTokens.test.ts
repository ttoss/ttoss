import { baseTheme as defaultTheme } from '../../../../../src/baseTheme';
import { isTokenRef, toFlatTokens } from '../../../../../src/roots/helpers';

// ---------------------------------------------------------------------------
// toFlatTokens — output contracts
// ---------------------------------------------------------------------------

describe('toFlatTokens', () => {
  // ADR-007: both core.* and semantic.* namespaces are present in the output
  test('output contains both core.* and semantic.* namespaces', () => {
    const flat = toFlatTokens(defaultTheme);
    const keys = Object.keys(flat);
    expect(
      keys.some((k) => {
        return k.startsWith('core.');
      })
    ).toBe(true);
    expect(
      keys.some((k) => {
        return k.startsWith('semantic.');
      })
    ).toBe(true);
  });

  test('every pure {core.*} semantic ref resolves to the same value as its core counterpart', () => {
    const flat = toFlatTokens(defaultTheme);
    let checkedCount = 0;

    const walk = (obj: unknown, prefix: string): void => {
      if (typeof obj === 'string' && isTokenRef(obj)) {
        const refPath = obj.slice(1, -1); // '{core.X.Y}' → 'core.X.Y'
        if (refPath.startsWith('core.')) {
          expect(flat[prefix]).toBe(flat[refPath]);
          checkedCount++;
        }
      } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(
          obj as Record<string, unknown>
        )) {
          if (!key.startsWith('$')) {
            walk(value, `${prefix}.${key}`);
          }
        }
      }
    };

    walk(defaultTheme.semantic, 'semantic');
    // Sanity: the theme must have at least some core refs in semantic
    expect(checkedCount).toBeGreaterThan(0);
  });
});
