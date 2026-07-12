/**
 * llms.txt drift guard.
 *
 * `llms.txt` is the LLM-facing usage contract. It is hand-authored prose, so it
 * can silently drift from the code (e.g. a renamed dataviz var, a removed theme,
 * a phantom `elevation.tonal.flat`). This test asserts — against the real token
 * contract — that every concrete claim in `llms.txt` still resolves. It only
 * checks `llms.txt → code` (the direction that catches stale docs); it does not
 * require the guide to enumerate every token (that would be noise).
 *
 * @see /docs/website/docs/design/design-system/design-tokens/validation.md
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createTheme } from '../../../src/createTheme';
import { withDataviz } from '../../../src/dataviz/withDataviz';
import * as index from '../../../src/index';
import { toFlatTokens } from '../../../src/roots/helpers';
import { toCssVarName } from '../../../src/roots/toCssVars';

const LLMS = readFileSync(join(__dirname, '../../../llms.txt'), 'utf8');

/**
 * A theme populated to the full **legal** semantic surface, so the guard
 * validates `llms.txt` against every documentable path — not only what the
 * default theme happens to populate:
 * - `withDataviz` adds the opt-in `dataviz.*` extension;
 * - `elevation.tonal.{raised,overlay,blocking}` is an optional sub-tree the
 *   default omits — populated here with placeholder refs so legitimate
 *   `vars.elevation.tonal.*` mentions resolve, while a phantom like
 *   `tonal.flat` (no such member) still fails.
 */
const legalSurfaceTheme = withDataviz(
  createTheme({
    overrides: {
      semantic: {
        elevation: {
          tonal: {
            raised: '{core.colors.neutral.0}',
            overlay: '{core.colors.neutral.0}',
            blocking: '{core.colors.neutral.0}',
          },
        },
      },
    },
  })
);

/**
 * Source-of-truth set of semantic leaf paths as `vars.*` paths (the `semantic.`
 * prefix dropped).
 */
const semanticLeafPaths = new Set(
  Object.keys(toFlatTokens(legalSurfaceTheme.base))
    .filter((k) => {
      return k.startsWith('semantic.');
    })
    .map((k) => {
      return k.slice('semantic.'.length);
    })
);

type Classification = 'leaf' | 'node' | 'missing';

/**
 * Classify a `vars.<path>` mention (with the `vars.` prefix already stripped)
 * against the real leaf-path set: an exact leaf, a namespace prefix of some
 * leaf (a shorthand/grouping mention), or missing (drift).
 */
const classifyVarsMention = (
  path: string,
  leaves: ReadonlySet<string>
): Classification => {
  if (leaves.has(path)) return 'leaf';
  const prefix = `${path}.`;
  for (const leaf of leaves) {
    if (leaf.startsWith(prefix)) return 'node';
  }
  return 'missing';
};

describe('classifyVarsMention', () => {
  const leaves = new Set([
    'colors.action.primary.background.default',
    'text.body.md.fontSize',
  ]);

  test('exact leaf → leaf', () => {
    expect(
      classifyVarsMention('colors.action.primary.background.default', leaves)
    ).toBe('leaf');
  });

  test('namespace prefix → node', () => {
    expect(classifyVarsMention('colors.action', leaves)).toBe('node');
    expect(classifyVarsMention('text', leaves)).toBe('node');
  });

  test('unknown path → missing (this is what flags drift)', () => {
    expect(
      classifyVarsMention('colors.action.primary.background.nope', leaves)
    ).toBe('missing');
    expect(classifyVarsMention('elevation.tonal.flat', leaves)).toBe('missing');
  });
});

describe('llms.txt drift guard', () => {
  test('every concrete vars.<path> mention resolves to a real token (leaf or namespace)', () => {
    const re = /vars\.([A-Za-z0-9_.]+)/g;
    const missing: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(LLMS)) !== null) {
      const path = m[1].replace(/[.?]+$/, ''); // strip trailing dot / `?`
      if (!path) continue;
      if (classifyVarsMention(path, semanticLeafPaths) === 'missing') {
        missing.push(`vars.${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  test('every `vars.x → var(--tt-...)` mapping example agrees with toCssVarName', () => {
    const re = /`vars\.([\w.]+)`\s*→\s*`var\((--tt-[\w-]+)\)`/g;
    const pairs = [...LLMS.matchAll(re)];
    // Sanity: the mapping table exists (guards against a vacuous pass).
    expect(pairs.length).toBeGreaterThan(0);

    const mismatches = pairs
      .map(([, varsPath, cssVar]) => {
        return {
          varsPath,
          cssVar,
          expected: toCssVarName(`semantic.${varsPath}`),
        };
      })
      .filter((x) => {
        return x.expected !== x.cssVar;
      })
      .map((x) => {
        return `vars.${x.varsPath}: llms says ${x.cssVar}, code emits ${x.expected}`;
      });
    expect(mismatches).toEqual([]);
  });

  test("every name imported from '@ttoss/fsl-theme' is a real export", () => {
    const importRe = /import\s*\{([^}]+)\}\s*from\s*'@ttoss\/fsl-theme'/g;
    const names = new Set<string>();
    for (const m of LLMS.matchAll(importRe)) {
      for (const raw of m[1].split(',')) {
        const name = raw.trim();
        if (name) names.add(name);
      }
    }
    // Sanity: at least one bare-specifier import example exists.
    expect(names.size).toBeGreaterThan(0);

    const exported = new Set(Object.keys(index));
    const missing = [...names].filter((n) => {
      return !exported.has(n);
    });
    expect(missing).toEqual([]);
  });
});
