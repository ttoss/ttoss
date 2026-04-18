import type { Meta, StoryObj } from '@storybook/react-vite';
import { createTheme } from '@ttoss/theme2';
import { ThemeProvider } from '@ttoss/theme2/react';
import { bruttal } from '@ttoss/theme2/themes/bruttal';
import { corporate } from '@ttoss/theme2/themes/corporate';
import { oca } from '@ttoss/theme2/themes/oca';
import { ventures } from '@ttoss/theme2/themes/ventures';

import {
  Code,
  SectionHeading,
  Swatch,
  tableStyle,
  tdStyle,
  thStyle,
} from '../../_lib/SharedComponents';
import {
  coreColorPalettes,
  deref,
  isRef,
  semanticColorGroups,
  toCssVarName,
} from '../../_lib/tokenUtils';

// Themes used by ThemeHarmony story — resolved once at module load time
const _harmonyThemes = [
  { label: 'Base', theme: createTheme() },
  { label: 'Bruttal', theme: bruttal },
  { label: 'Corporate', theme: corporate },
  { label: 'Oca', theme: oca },
  { label: 'Ventures', theme: ventures },
];

// ---------------------------------------------------------------------------
// File-specific components
// ---------------------------------------------------------------------------

const RoleLabel = ({ role }: { role: string }) => {
  const roleColors: Record<string, string> = {
    action: 'var(--tt-colors-action-accent-background-default)',
    input: 'var(--tt-colors-informational-positive-background-default)',
    informational: 'var(--tt-colors-informational-accent-background-default)',
    navigation: 'var(--tt-colors-action-muted-border-default)',
    feedback: 'var(--tt-colors-informational-caution-background-default)',
    content: 'var(--tt-colors-action-secondary-background-default)',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '1px 8px',
        borderRadius: 999,
        background:
          roleColors[role] ??
          'var(--tt-colors-action-secondary-background-default)',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
        fontFamily: 'system-ui',
      }}
    >
      {role}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------
const meta: Meta = {
  title: 'theme-v2/Tokens/Colors',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;

// ---------------------------------------------------------------------------
// Story 1: CorePalette — all core color primitives organized by palette
// ---------------------------------------------------------------------------

/**
 * All core color primitives organised by palette (brand, neutral, red, etc.).
 *
 * These are the **immutable design atoms** — no semantic meaning, scale positions only.
 * Swatches use `var(--tt-core-colors-*)` so they update live when you switch the
 * **Theme** toolbar — letting you compare how each theme's palette differs.
 */
export const CorePalette: StoryObj = {
  render: () => {
    const paletteOrder = [
      'brand',
      'neutral',
      'red',
      'orange',
      'yellow',
      'green',
      'teal',
      'purple',
      'pink',
    ];
    const sortedPalettes = paletteOrder
      .filter((p) => {
        return coreColorPalettes[p];
      })
      .concat(
        Object.keys(coreColorPalettes).filter((p) => {
          return !paletteOrder.includes(p);
        })
      );

    return (
      <div
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: 24,
          maxWidth: 900,
        }}
      >
        <p
          style={{
            margin: '0 0 24px',
            color: 'var(--tt-colors-content-muted-text-default)',
            fontSize: 13,
          }}
        >
          Core tokens are intent-free primitives. They are the raw palette —
          scale positions only. Switch the <strong>Theme</strong> toolbar to
          compare how different themes define their colour palette.
        </p>
        {sortedPalettes.map((palette) => {
          const entries = coreColorPalettes[palette] ?? [];
          return (
            <div key={palette} style={{ marginBottom: 28 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  textTransform: 'capitalize',
                  color: 'var(--tt-colors-content-muted-text-default)',
                  marginBottom: 10,
                  letterSpacing: '0.04em',
                }}
              >
                {palette}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {entries.map(([path]) => {
                  const cssVar = toCssVarName(path);
                  const scale = path.split('.').pop() ?? '';
                  return (
                    <div
                      key={path}
                      style={{ textAlign: 'center', minWidth: 52 }}
                      title={`${cssVar}\nPath: ${path}`}
                    >
                      <div
                        style={{
                          width: 52,
                          height: 52,
                          borderRadius: 10,
                          background: `var(${cssVar})`,
                          border: '1px solid rgba(128,128,128,0.15)',
                        }}
                      />
                      <div
                        style={{
                          fontSize: 11,
                          marginTop: 5,
                          fontWeight: 500,
                          fontFamily: 'monospace',
                        }}
                      >
                        {scale}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 2: SemanticRoles — semantic color tokens grouped by UX role
// ---------------------------------------------------------------------------

/**
 * All semantic colour tokens grouped by UX role (action, input, informational, navigation…).
 *
 * Each row shows the **live swatch** (via `var(--tt-colors-*)`) alongside the
 * CSS custom property name and the core token it references in the base theme.
 * Switch the **Theme** or **Color Mode** toolbar to see semantic tokens remap
 * to completely different core values — the whole power of two-layer tokens.
 */
export const SemanticRoles: StoryObj = {
  render: () => {
    const roleOrder = [
      'action',
      'input',
      'informational',
      'navigation',
      'feedback',
    ];
    const sortedRoles = roleOrder
      .filter((r) => {
        return semanticColorGroups[r];
      })
      .concat(
        Object.keys(semanticColorGroups).filter((r) => {
          return !roleOrder.includes(r);
        })
      );

    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <p
          style={{
            margin: '0 0 24px',
            color: 'var(--tt-colors-content-muted-text-default)',
            fontSize: 13,
          }}
        >
          Semantic tokens carry <em>intent</em>, not values. Each maps to a core
          primitive and changes its mapping per theme. The{' '}
          <strong>Core ref</strong> column shows the base-theme reference —
          switch themes to see the swatches update in real time.
        </p>
        {sortedRoles.map((role) => {
          const entries = semanticColorGroups[role] ?? [];
          return (
            <div key={role}>
              <SectionHeading>
                <RoleLabel role={role} /> {role}
              </SectionHeading>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 48 }} />
                    <th style={thStyle}>Semantic path</th>
                    <th style={thStyle}>CSS var</th>
                    <th style={thStyle}>Core ref (base theme)</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map(([path, rawVal]) => {
                    const cssVar = toCssVarName(path);
                    const shortPath = path.slice('semantic.colors.'.length);
                    const coreRef = isRef(rawVal)
                      ? deref(rawVal)
                      : String(rawVal);
                    return (
                      <tr key={path}>
                        <td style={tdStyle}>
                          <Swatch cssVar={cssVar} size={32} radius={6} />
                        </td>
                        <td style={tdStyle}>
                          <Code>{shortPath}</Code>
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color:
                              'var(--tt-colors-content-muted-text-default)',
                          }}
                        >
                          <Code>{cssVar}</Code>
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color:
                              'var(--tt-colors-content-muted-text-default)',
                          }}
                        >
                          <Code>{coreRef}</Code>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 3: ThemeHarmony — compare key semantic tokens across all 5 themes
// ---------------------------------------------------------------------------

/**
 * **Theme harmony grid** — compare how the same semantic colour tokens resolve
 * across all five themes simultaneously (Base, Bruttal, Corporate, Oca, Ventures).
 *
 * Each row is a semantic colour token. Each column is a theme. The swatches
 * are rendered as CSS variables so each `ThemeProvider` scope resolves
 * independently — theme isolation with zero extra JavaScript.
 *
 * This makes divergence between themes immediately visible.
 *
 * > **Note:** This grid shows all five themes at once — the Theme toolbar does
 * > not affect it. For single-theme exploration, use the other colour stories.
 */
export const ThemeHarmony: StoryObj = {
  render: () => {
    const themes = _harmonyThemes;

    const spotTokens: [string, string][] = [
      ['Primary action bg', '--tt-colors-action-primary-background-default'],
      ['Accent action bg', '--tt-colors-action-accent-background-default'],
      ['Negative action bg', '--tt-colors-action-negative-background-default'],
      ['Content bg', '--tt-colors-content-primary-background-default'],
      ['Content text', '--tt-colors-content-primary-text-default'],
      ['Nav primary text', '--tt-colors-navigation-primary-text-default'],
      ['Focus ring', '--tt-colors-focus-ring-color'],
      ['Input border', '--tt-colors-input-primary-border-default'],
    ];

    return (
      <div
        style={{
          fontFamily: 'system-ui, sans-serif',
          padding: 24,
          overflowX: 'auto',
        }}
      >
        <p
          style={{
            margin: '0 0 20px',
            color: 'var(--tt-colors-content-muted-text-default)',
            fontSize: 13,
          }}
        >
          Same semantic tokens, different core mappings. Each cell renders
          inside its own <code>ThemeProvider</code> scope so values are resolved
          independently — no bleed between themes.
        </p>
        <p
          style={{
            margin: '0 0 20px',
            padding: '8px 14px',
            borderRadius: 6,
            background:
              'var(--tt-colors-informational-accent-background-default)',
            fontSize: 12,
          }}
        >
          This grid shows all five themes at once — the Theme toolbar does not
          affect it. For the full core → semantic dependency graph, see{' '}
          <strong>Tokens / Graph</strong>.
        </p>
        <table style={{ ...tableStyle, minWidth: 700 }}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 200 }}>Semantic token</th>
              {themes.map(({ label }) => {
                return (
                  <th key={label} style={{ ...thStyle, textAlign: 'center' }}>
                    {label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {spotTokens.map(([label, cssVar]) => {
              return (
                <tr key={cssVar}>
                  <td style={tdStyle}>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{label}</div>
                    <Code>{cssVar}</Code>
                  </td>
                  {themes.map(({ label: themeLabel, theme }) => {
                    return (
                      <td
                        key={themeLabel}
                        style={{ ...tdStyle, textAlign: 'center' }}
                      >
                        <ThemeProvider
                          theme={theme}
                          defaultMode="light"
                          storageKey={`harmony-${themeLabel}`}
                        >
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 8,
                              background: `var(${cssVar})`,
                              border: '1px solid rgba(128,128,128,0.15)',
                              margin: '0 auto',
                            }}
                          />
                        </ThemeProvider>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  },
};
