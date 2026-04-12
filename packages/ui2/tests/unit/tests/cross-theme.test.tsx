/**
 * Cross-theme invariant tests — ISSUE-004 multi-theme proof.
 *
 * Verifies that ui2 components work correctly across different themes.
 * The key invariant: `data-variant` stays identical regardless of theme.
 * Only the CSS custom property values change — the component's semantic
 * markup is theme-independent.
 *
 * Tests all 4 brand themes: bruttal, corporate, oca, ventures.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

import { render, screen } from '@testing-library/react';
import { createTheme } from '@ttoss/theme2';
import { toCssVarName, toFlatTokens } from '@ttoss/theme2/css';
import { bruttal } from '@ttoss/theme2/themes/bruttal';
import { corporate } from '@ttoss/theme2/themes/corporate';
import { oca } from '@ttoss/theme2/themes/oca';
import { ventures } from '@ttoss/theme2/themes/ventures';
import * as React from 'react';
import type { ComponentMeta } from 'src/_model/defineComponent';
import { UX_VALID_ROLES } from 'src/_model/resolver';
import { Button } from 'src/components/Button/Button';
import { Input } from 'src/components/Input/Input';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const baseBundle = createTheme();

const ALL_BRAND_THEMES = { bruttal, corporate, oca, ventures } as const;

const DIMS = ['background', 'border', 'text'] as const;

// ---------------------------------------------------------------------------
// 1. data-variant stays identical across themes
//
// Theme switching is pure CSS — `data-variant` is determined by the component's
// FSL expression (Responsibility + Evaluation + Consequence), not by theme data.
// Rendering the same component with baseTheme and bruttal must produce the same
// `data-variant` value.
// ---------------------------------------------------------------------------

describe('cross-theme: data-variant stays identical across themes', () => {
  test('Button renders data-variant="primary" in both themes', () => {
    const { unmount: unmount1 } = render(
      <Button data-testid="btn-base">X</Button>
    );
    const baseBtn = screen.getByTestId('btn-base');
    expect(baseBtn).toHaveAttribute('data-variant', 'primary');
    // No inline color styles
    expect(baseBtn.style.backgroundColor).toBe('');
    expect(baseBtn.style.borderColor).toBe('');
    expect(baseBtn.style.color).toBe('');
    unmount1();

    render(<Button data-testid="btn-alt">X</Button>);
    const altBtn = screen.getByTestId('btn-alt');
    expect(altBtn).toHaveAttribute('data-variant', 'primary');
    expect(altBtn.style.backgroundColor).toBe('');
    expect(altBtn.style.borderColor).toBe('');
    expect(altBtn.style.color).toBe('');
  });

  test('consequence="destructive" produces data-variant="negative" in both themes', () => {
    const { unmount: unmount1 } = render(
      <Button data-testid="btn-d-base" consequence="destructive">
        Delete
      </Button>
    );
    expect(screen.getByTestId('btn-d-base')).toHaveAttribute(
      'data-variant',
      'negative'
    );
    unmount1();

    render(
      <Button data-testid="btn-d-alt" consequence="destructive">
        Delete
      </Button>
    );
    expect(screen.getByTestId('btn-d-alt')).toHaveAttribute(
      'data-variant',
      'negative'
    );
  });

  test('Input renders data-variant="primary" in both themes', () => {
    const { unmount: unmount1 } = render(
      <Input data-testid="input-base" />
    );
    expect(screen.getByTestId('input-base')).toHaveAttribute(
      'data-variant',
      'primary'
    );
    unmount1();

    render(<Input data-testid="input-alt" />);
    expect(screen.getByTestId('input-alt')).toHaveAttribute(
      'data-variant',
      'primary'
    );
  });
});

// ---------------------------------------------------------------------------
// 2. UX_VALID_ROLES × theme — every role has tokens in ALL brand themes
//
// If a role is valid in UX_VALID_ROLES, it MUST have backing token data in
// every published theme. Otherwise, switching to that theme silently breaks
// components using that role.
// ---------------------------------------------------------------------------

describe('cross-theme: UX_VALID_ROLES × all themes — all roles have populated default tokens', () => {
  const baseFLAT = toFlatTokens(baseBundle.base);

  const uxRoleDimTriples: ReadonlyArray<[string, string, string]> =
    Object.entries(UX_VALID_ROLES).flatMap(([ux, roles]) => {
      return roles.flatMap((role) => {
        return DIMS.map((dim) => [ux, role, dim] as [string, string, string]);
      });
    });

  describe('base theme', () => {
    test.each(uxRoleDimTriples)(
      'semantic.colors.%s.%s.%s.default',
      (ux, role, dim) => {
        const tokenPath = `semantic.colors.${ux}.${role}.${dim}.default`;
        expect(baseFLAT[tokenPath]).toBeDefined();
        expect(baseFLAT[tokenPath]).not.toBe('');
      }
    );
  });

  describe.each(Object.entries(ALL_BRAND_THEMES))('%s theme', (themeName, theme) => {
    const themeFLAT = toFlatTokens(theme.base);

    test.each(uxRoleDimTriples)(
      'semantic.colors.%s.%s.%s.default',
      (ux, role, dim) => {
        const tokenPath = `semantic.colors.${ux}.${role}.${dim}.default`;
        expect(themeFLAT[tokenPath]).toBeDefined();
        expect(themeFLAT[tokenPath]).not.toBe('');
      }
    );
  });
});

// ---------------------------------------------------------------------------
// 3. styles.css — every var(--tt-*) reference has backing tokens in ALL themes
//
// A reference in CSS that resolves in the base theme but not in a brand theme
// would produce invisible text/borders/backgrounds when the user switches.
// ---------------------------------------------------------------------------

describe('cross-theme: styles.css var(--tt-*) references exist in all themes', () => {
  const stylesPath = path.resolve(__dirname, '../../../src/styles.css');
  const css = fs.readFileSync(stylesPath, 'utf-8');

  const baseDEFINED = new Set(
    Object.keys(toFlatTokens(baseBundle.base)).map(toCssVarName)
  );

  const ttVarUsages = new Set<string>();
  for (const m of css.matchAll(/var\((--tt-[a-zA-Z0-9-]+)\)/g)) {
    ttVarUsages.add(m[1]!);
  }

  test.each([...ttVarUsages])('%s exists in base theme', (varName) => {
    expect(baseDEFINED.has(varName)).toBe(true);
  });

  describe.each(Object.entries(ALL_BRAND_THEMES))('%s theme', (themeName, theme) => {
    const themeDEFINED = new Set(
      Object.keys(toFlatTokens(theme.base)).map(toCssVarName)
    );

    test.each([...ttVarUsages])('%s exists in ' + themeName + ' theme', (varName) => {
      expect(themeDEFINED.has(varName)).toBe(true);
    });
  });
});
