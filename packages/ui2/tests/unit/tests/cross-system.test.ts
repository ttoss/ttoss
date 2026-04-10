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
import { LAYOUT_TOKENS } from 'src/_model/layoutTokens';
import { UX_VALID_ROLES } from 'src/_model/resolver';

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
// 3. LAYOUT_TOKENS — every declared value resolves to a real theme token (B-05)
//
// Invariant: every `--tt-*` string in the LAYOUT_TOKENS const must correspond
// to a real CSS custom property defined by @ttoss/theme2. This catches forward-
// looking token declarations that do not yet have backing theme data.
//
// This test walks the nested LAYOUT_TOKENS object recursively and collects all
// leaf strings (which are all LayoutToken = `--tt-${string}` values), then
// verifies each one exists in the resolved theme token set.
//
// NOTE: Only tokens that are CURRENTLY defined in baseTheme are valid.
// Forward-looking tokens (e.g. radii.surface, border.selected.width) that do
// not yet exist in baseTheme will fail this test — add the theme token first.
// ---------------------------------------------------------------------------

/** Recursively collect all string leaves from a nested object */
const walkLayoutTokens = (obj: unknown): string[] => {
  if (typeof obj === 'string') return [obj];
  if (typeof obj === 'object' && obj !== null) {
    return Object.values(obj).flatMap(walkLayoutTokens);
  }
  return [];
};

describe('LAYOUT_TOKENS — every value maps to a real theme token (B-05)', () => {
  const allLayoutTokenValues = walkLayoutTokens(LAYOUT_TOKENS);

  test.each(allLayoutTokenValues)('%s', (varName) => {
    expect(DEFINED_VARS.has(varName)).toBe(true);
  });
});
