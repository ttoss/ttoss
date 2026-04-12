/**
 * Cross-system Consistency Validator — B-10 Guardrail
 *
 * Verifies that the three separate sources of truth agree:
 *   - resolver.ts (UX_VALID_ROLES)
 *   - theme-v2 baseTheme (actual token data, via toFlatTokens)
 *   - styles.css (CSS --tt-* var references)
 *
 * Problems caught here that no unit test of a single layer can catch:
 *
 *   Ghost roles   — a role in UX_VALID_ROLES has no baseTheme data → invisible component.
 *                   Sentinel for B-08. Fires when someone adds a role to UX_VALID_ROLES
 *                   without adding the corresponding data to baseTheme.
 *
 *   Missing dims  — baseTheme populates a role but omits a dimension.default →
 *                   component has no background / border / text color at all.
 *                   Every role that passes the ghost-role test must define all
 *                   three dimensions for the default state.
 *
 *   Dangling vars — a --tt-* CSS variable in styles.css has no backing token in
 *                   baseTheme → silently renders as zero/none/inherit at runtime.
 *                   Sentinel for layout token typos and deleted tokens.
 *
 * MAINTENANCE RULES:
 *   - Adding a role to UX_VALID_ROLES AND baseTheme → test passes automatically.
 *   - Adding a role to UX_VALID_ROLES WITHOUT baseTheme → test fails (good).
 *   - Adding a --tt-* var to styles.css WITHOUT defining the token → test fails (good).
 *   - This file needs no updates when new components are added to styles.css.
 *
 * @see REVIEW.md §B-10
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import { createTheme } from '@ttoss/theme2';
import { toCssVarName, toFlatTokens } from '@ttoss/theme2/css';
import type { ComponentToken } from 'src/_model/componentTokens';
import { COMPONENT_TOKENS } from 'src/_model/componentTokens';
import type { ComponentMeta } from 'src/_model/defineComponent';
import type { CompositeMeta } from 'src/_model/defineComposite';
import { generateComponentCss, UX_VALID_ROLES } from 'src/_model/resolver';

// ---------------------------------------------------------------------------
// Auto-discovery of component and composite metas
// ---------------------------------------------------------------------------

const discoverComponentMetas = (): ComponentMeta[] => {
  const componentsDir = path.resolve(__dirname, '../../../src/components');
  const dirs = fs
    .readdirSync(componentsDir, { withFileTypes: true })
    .filter((d) => {
      return d.isDirectory();
    })
    .map((d) => {
      return d.name;
    });

  const metas: ComponentMeta[] = [];
  for (const dir of dirs) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(`src/components/${dir}/${dir}`) as Record<
      string,
      unknown
    >;
    const metaKey = Object.keys(mod).find((k) => {
      return k.endsWith('ComponentMeta');
    });
    if (metaKey) {
      metas.push(mod[metaKey] as ComponentMeta);
    }
  }
  metas.sort((a, b) => {
    return a.scope.localeCompare(b.scope);
  });
  return metas;
};

const discoverCompositeMetas = (): CompositeMeta[] => {
  const compositesDir = path.resolve(__dirname, '../../../src/composites');
  if (!fs.existsSync(compositesDir)) return [];

  const dirs = fs
    .readdirSync(compositesDir, { withFileTypes: true })
    .filter((d) => {
      return d.isDirectory();
    })
    .map((d) => {
      return d.name;
    });

  const metas: CompositeMeta[] = [];
  for (const dir of dirs) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(`src/composites/${dir}/${dir}`) as Record<
      string,
      unknown
    >;
    const metaKey = Object.keys(mod).find((k) => {
      return k.endsWith('CompositeMeta');
    });
    if (metaKey) {
      metas.push(mod[metaKey] as CompositeMeta);
    }
  }
  metas.sort((a, b) => {
    return a.scope.localeCompare(b.scope);
  });
  return metas;
};

const discoveredComponentMetas = discoverComponentMetas();
const discoveredCompositeMetas = discoverCompositeMetas();

// ---------------------------------------------------------------------------
// 0. Scope uniqueness — no two components share a scope
// ---------------------------------------------------------------------------

describe('scope uniqueness — no two component or composite metas share a scope', () => {
  test('all component scopes are unique', () => {
    const scopes = discoveredComponentMetas.map((m) => {
      return m.scope;
    });
    expect(scopes).toEqual([...new Set(scopes)]);
  });

  test('all composite scopes are unique', () => {
    const scopes = discoveredCompositeMetas.map((m) => {
      return m.scope;
    });
    expect(scopes).toEqual([...new Set(scopes)]);
  });

  test('component and composite scopes do not overlap', () => {
    const componentScopes = new Set(
      discoveredComponentMetas.map((m) => {
        return m.scope;
      })
    );
    const compositeScopes = discoveredCompositeMetas.map((m) => {
      return m.scope;
    });
    for (const scope of compositeScopes) {
      expect(componentScopes.has(scope)).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// Shared fixtures — built once per file, re-used across all test groups
// ---------------------------------------------------------------------------

/**
 * Resolved flat token map for the default base mode.
 * Keys are dot-path token paths (e.g. 'semantic.colors.action.primary.background.default').
 * Values are resolved raw values (hex strings, px values, font families, etc.).
 */
const FLAT = toFlatTokens(createTheme().base);

/**
 * Set of all CSS custom property names defined by the theme.
 * Built by converting every flat token path to its CSS var name via toCssVarName.
 * Used to verify that every --tt-* reference in styles.css has a backing token.
 */
const DEFINED_VARS = new Set<string>(Object.keys(FLAT).map(toCssVarName));

// ---------------------------------------------------------------------------
// Helper — flatten UX_VALID_ROLES into (ux, role, dim) triples
// ---------------------------------------------------------------------------

const DIMS = ['background', 'border', 'text'] as const;
type Dim = (typeof DIMS)[number];

const uxRoleDimTriples: ReadonlyArray<[string, string, Dim]> = Object.entries(
  UX_VALID_ROLES
).flatMap(([ux, roles]) => {
  return roles.flatMap((role) => {
    return DIMS.map((dim) => {
      return [ux, role, dim] as [string, string, Dim];
    });
  });
});

// ---------------------------------------------------------------------------
// 1. UX_VALID_ROLES × baseTheme — every (ux, role) has populated default tokens
//
// Invariant: a role registered in UX_VALID_ROLES MUST have a resolved value for
// {dim}.default across ALL three dimensions in the base theme. If any dimension
// is missing, the component is visually broken from the start (no color, no
// border, or no text — depending on which dimension is absent).
//
// This is the B-08 / ghost-role sentinel: adding a role to UX_VALID_ROLES without
// backing data in baseTheme → this test fails immediately and loudly.
// ---------------------------------------------------------------------------

describe('UX_VALID_ROLES × baseTheme — {ux}.{role}.{dim}.default is populated (B-10)', () => {
  test.each(uxRoleDimTriples)(
    'semantic.colors.%s.%s.%s.default',
    (ux, role, dim) => {
      const tokenPath = `semantic.colors.${ux}.${role}.${dim}.default`;
      const value = FLAT[tokenPath];
      expect(value).toBeDefined();
      expect(value).not.toBe('');
    }
  );
});

// ---------------------------------------------------------------------------
// 2. styles.css — every --tt-* var reference has a defined token in baseTheme
//
// Invariant: every CSS custom property referenced as var(--tt-*) in styles.css
// must correspond to a real token in the theme. An undefined token silently
// resolves to the browser default (zero padding, zero height, inherited font).
//
// This test reads styles.css at test-run time — no manual maintenance required.
// Adding a new component with new --tt-* vars to styles.css will automatically
// extend this test.
// ---------------------------------------------------------------------------

describe('styles.css — every var(--tt-*) reference has a backing token (B-10)', () => {
  const stylesPath = path.resolve(__dirname, '../../../src/styles.css');
  const css = fs.readFileSync(stylesPath, 'utf-8');

  // Extract all unique --tt-* var names referenced in styles.css.
  // The --_* scoped vars are NOT included (they start with --_ not --tt-).
  const ttVarUsages = new Set<string>();
  for (const m of css.matchAll(/var\((--tt-[a-zA-Z0-9-]+)\)/g)) {
    ttVarUsages.add(m[1]!);
  }

  test.each([...ttVarUsages])('%s', (varName) => {
    expect(DEFINED_VARS.has(varName)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. COMPONENT_TOKENS — every declared value resolves to a real theme token (B-05)
//
// Invariant: every `--tt-*` string in the COMPONENT_TOKENS const must correspond
// to a real CSS custom property defined by @ttoss/theme2. This catches forward-
// looking token declarations that do not yet have backing theme data.
//
// This test walks the nested COMPONENT_TOKENS object recursively and collects all
// leaf strings (which are all ComponentToken = `--tt-${string}` values), then
// verifies each one exists in the resolved theme token set.
//
// NOTE: Only tokens that are CURRENTLY defined in baseTheme are valid.
// Forward-looking tokens (e.g. radii.surface, border.selected.width) that do
// not yet exist in baseTheme will fail this test — add the theme token first.
// ---------------------------------------------------------------------------

/** Recursively collect all string leaves from a nested object */
const walkComponentTokens = (obj: unknown): string[] => {
  if (typeof obj === 'string') return [obj];
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).flatMap(walkComponentTokens);
  }
  return [];
};

describe('COMPONENT_TOKENS — every value maps to a real theme token (B-05)', () => {
  const allComponentTokenValues = walkComponentTokens(COMPONENT_TOKENS);

  test.each(allComponentTokenValues)('%s', (varName) => {
    expect(DEFINED_VARS.has(varName)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 4. styles.css is fully generated — file matches generate-css.ts output
//
// Invariant: the ENTIRE styles.css file is a build artifact produced by
// `pnpm run generate:css`. It must match what the generator would produce
// from the current component definitions. If it doesn't, SSR will deliver
// stale layout or color-state rules.
//
// Fix: run `pnpm run generate:css` to regenerate.
//
// This test replicates the generator's logic (layout + color CSS) and
// compares key content sections against the actual file. It uses substring
// matching rather than full-file equality to avoid coupling to comment
// formatting while still catching functional drift.
//
// @see L5 resolution in REVIEW.md
// ---------------------------------------------------------------------------

describe('styles.css is fully generated — matches component definitions (L5)', () => {
  const stylesPath = path.resolve(__dirname, '../../../src/styles.css');
  const stylesCss = fs.readFileSync(stylesPath, 'utf-8');

  // ── Layout CSS drift check ──────────────────────────────────────

  const camelToKebab = (s: string): string => {
    return s.replace(/[A-Z]/g, (m) => {
      return `-${m.toLowerCase()}`;
    });
  };

  const isComponentToken = (v: string | number): v is ComponentToken => {
    return typeof v === 'string' && v.startsWith('--tt-');
  };

  const formatValue = (v: string | number): string => {
    if (isComponentToken(v)) return `var(${v})`;
    return String(v);
  };

  const componentMetas = discoveredComponentMetas;

  test.each(
    componentMetas.filter((m) => {
      return m.layout;
    })
  )('layout CSS for $scope is present and matches', (meta) => {
    const baseSelector = `[data-scope='${meta.scope}'][data-part='root']`;

    // Check base layout properties exist in CSS
    for (const [prop, val] of Object.entries(meta.layout!.base)) {
      const cssProp = camelToKebab(prop);
      const cssVal = formatValue(val!);
      expect(stylesCss).toContain(`${cssProp}: ${cssVal}`);
    }

    // Check size variants if present
    if (meta.layout?.sizes) {
      for (const [size, overrides] of Object.entries(meta.layout.sizes)) {
        if (!overrides) continue;
        const sizeSelector = `${baseSelector}[data-size='${size}']`;
        expect(stylesCss).toContain(sizeSelector);
      }
    }
  });

  // ── Composite layout CSS drift check ────────────────────────────

  test.each(
    discoveredCompositeMetas.filter((m) => {
      return m.layout;
    })
  )('composite layout CSS for $scope is present', (meta) => {
    const baseSelector = `[data-scope='${meta.scope}'][data-part='root']`;
    expect(stylesCss).toContain(baseSelector);

    for (const [prop, val] of Object.entries(meta.layout!.base)) {
      const cssProp = camelToKebab(prop);
      const cssVal = formatValue(val!);
      expect(stylesCss).toContain(`${cssProp}: ${cssVal}`);
    }
  });

  // ── Color CSS drift check ───────────────────────────────────────

  const expectedColorCss = componentMetas
    .map((meta) => {
      return generateComponentCss({
        scope: meta.scope,
        responsibility: meta.responsibility,
        dimensions: meta.dimensions,
        withInvalidOverlay: meta.withInvalidOverlay,
      });
    })
    .filter(Boolean)
    .join('\n\n')
    .trim();

  test('color-state CSS matches generateComponentCss() output — run `pnpm run generate:css` if this fails', () => {
    // Every line of the expected color CSS must be present in styles.css
    for (const line of expectedColorCss.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('/*')) {
        expect(stylesCss).toContain(trimmed);
      }
    }
  });

  // ── Structural invariants ───────────────────────────────────────

  test('file header indicates auto-generated', () => {
    expect(stylesCss).toContain('AUTO-GENERATED');
  });

  test('no @generated-begin/@generated-end markers (entire file is generated)', () => {
    expect(stylesCss).not.toContain('@generated-begin');
    expect(stylesCss).not.toContain('@generated-end');
  });

  test('input focus ring override is present', () => {
    expect(stylesCss).toContain(
      "[data-scope='input'][data-part='root']:focus-visible"
    );
  });

  test('behavioral layer is present', () => {
    expect(stylesCss).toContain('@layer ui2.behavioral');
    expect(stylesCss).toContain('[data-scope]:focus-visible');
    expect(stylesCss).toContain('cursor: not-allowed');
  });

  // ── selected/checked deduplication (ISSUE-008) ───────────────────

  test('no duplicate selectors emitted for any component (selected/checked collision)', () => {
    for (const meta of componentMetas) {
      const css = generateComponentCss({
        scope: meta.scope,
        responsibility: meta.responsibility,
        dimensions: meta.dimensions,
        withInvalidOverlay: meta.withInvalidOverlay,
      });

      // Extract all selector lines (lines ending with ' {')
      const selectorLines = css
        .split('\n')
        .filter((line) => {
          return line.trimEnd().endsWith('{');
        })
        .map((line) => {
          return line.trim();
        });

      // No two identical selectors should appear
      const seen = new Set<string>();
      for (const sel of selectorLines) {
        expect(seen.has(sel)).toBe(false);
        seen.add(sel);
      }
    }
  });
});
