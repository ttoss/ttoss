import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  Code,
  SectionHeading,
  tableStyle,
  tdStyle,
  thStyle,
} from '../../_lib/SharedComponents';
import {
  byPrefix,
  rawCoreTokens,
  rawSemanticTokens,
  toCssVarName,
} from '../../_lib/tokenUtils';

const meta: Meta = {
  title: 'theme-v2/Tokens/Typography',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;

// ---------------------------------------------------------------------------
// Story 1: FontScale — core font size scale rendered live
// ---------------------------------------------------------------------------

/**
 * The responsive **font size scale** engine — `core.font.scale.text.*` and
 * `core.font.scale.display.*`. Values are `clamp()` expressions that scale
 * fluidly with container size (`cqi`), capping at defined min/max bounds.
 *
 * Text is rendered live using the CSS custom properties so you can observe
 * actual visual sizing in the Storybook canvas.
 */
export const FontScale: StoryObj = {
  render: () => {
    const textScaleEntries = byPrefix(rawCoreTokens, 'core.font.scale.text.');
    const displayScaleEntries = byPrefix(
      rawCoreTokens,
      'core.font.scale.display.'
    );

    const renderScaleTable = (
      entries: [string, string | number][],
      label: string
    ) => {
      return (
        <div style={{ marginBottom: 32 }}>
          <SectionHeading>{label}</SectionHeading>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={{ ...thStyle, width: 60 }}>Step</th>
                <th style={{ ...thStyle, width: 360 }}>CSS var</th>
                <th style={{ ...thStyle, width: 220 }}>Value (clamp)</th>
                <th style={thStyle}>Preview</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([path, val]) => {
                const cssVar = toCssVarName(path);
                const step = path.split('.').pop() ?? '';
                return (
                  <tr key={path}>
                    <td
                      style={{
                        ...tdStyle,
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    >
                      {step}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: 'var(--tt-colors-content-muted-text-default)',
                      }}
                    >
                      <Code>{cssVar}</Code>
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        color: 'var(--tt-colors-content-muted-text-default)',
                      }}
                    >
                      <Code>{String(val)}</Code>
                    </td>
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontSize: `var(${cssVar})`,
                          fontFamily: 'system-ui, sans-serif',
                          lineHeight: 1.2,
                        }}
                      >
                        The quick brown fox
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    };

    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <p
          style={{
            margin: '0 0 8px',
            color: 'var(--tt-colors-content-muted-text-default)',
            fontSize: 13,
          }}
        >
          Font sizes use responsive <code>clamp()</code> expressions keyed on{' '}
          <code>cqi</code> (container query inline units). They grow fluidly
          between a floor and a cap, reducing the need for breakpoint overrides.
        </p>
        {renderScaleTable(
          textScaleEntries,
          'Text scale (core.font.scale.text)'
        )}
        {renderScaleTable(
          displayScaleEntries,
          'Display scale (core.font.scale.display)'
        )}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Story 2: SemanticTextStyles — composite text style tokens rendered live
// ---------------------------------------------------------------------------

/**
 * **Semantic text styles** — composite tokens (`display`, `headline`, `title`,
 * `body`, `label`, `caption`, `code`) that combine font-family, font-size,
 * font-weight, line-height, and letter-spacing into a single named role.
 *
 * Each row applies all five CSS custom properties simultaneously so you can
 * evaluate how the style looks in context. Switch the **Theme** toolbar to see
 * how each theme customises the type hierarchy.
 */
export const SemanticTextStyles: StoryObj = {
  render: () => {
    // Collect unique style groups (display, headline, title, body, label, …)
    const textEntries = byPrefix(rawSemanticTokens, 'semantic.text.');

    // Group by style family: semantic.text.{family}.{variant}.{property}
    const families: Record<string, Set<string>> = {};
    for (const [path] of textEntries) {
      const rest = path.slice('semantic.text.'.length); // "display.lg.fontFamily"
      const [family, variant] = rest.split('.');
      if (!families[family]) families[family] = new Set();
      families[family].add(variant);
    }

    const familyOrder = [
      'display',
      'headline',
      'title',
      'body',
      'label',
      'caption',
      'code',
    ];
    const sortedFamilies = familyOrder
      .filter((f) => {
        return families[f];
      })
      .concat(
        Object.keys(families).filter((f) => {
          return !familyOrder.includes(f);
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
          Each text style is a composite token combining five typographic
          properties into one named intent. All five CSS custom properties are
          applied at once — switch themes to see type hierarchy reflow.
        </p>
        {sortedFamilies.map((family) => {
          const variants = [...(families[family] ?? [])].sort();
          return (
            <div key={family}>
              <SectionHeading>text.{family}</SectionHeading>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={{ ...thStyle, width: 80 }}>Variant</th>
                    <th style={thStyle}>Preview</th>
                    <th style={{ ...thStyle, width: 180 }}>Font size var</th>
                    <th style={{ ...thStyle, width: 160 }}>Weight var</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant) => {
                    const familyVar = toCssVarName(
                      `semantic.text.${family}.${variant}.fontFamily`
                    );
                    const sizeVar = toCssVarName(
                      `semantic.text.${family}.${variant}.fontSize`
                    );
                    const weightVar = toCssVarName(
                      `semantic.text.${family}.${variant}.fontWeight`
                    );
                    const lineHeightVar = toCssVarName(
                      `semantic.text.${family}.${variant}.lineHeight`
                    );
                    const spacingVar = toCssVarName(
                      `semantic.text.${family}.${variant}.letterSpacing`
                    );
                    return (
                      <tr key={variant}>
                        <td
                          style={{
                            ...tdStyle,
                            fontFamily: 'monospace',
                            fontWeight: 600,
                          }}
                        >
                          {variant}
                        </td>
                        <td style={{ ...tdStyle, maxWidth: 420 }}>
                          <span
                            style={{
                              fontFamily: `var(${familyVar})`,
                              fontSize: `var(${sizeVar})`,
                              fontWeight:
                                `var(${weightVar})` as React.CSSProperties['fontWeight'],
                              lineHeight: `var(${lineHeightVar})`,
                              letterSpacing: `var(${spacingVar})`,
                            }}
                          >
                            The quick brown fox jumps
                          </span>
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color:
                              'var(--tt-colors-content-muted-text-default)',
                          }}
                        >
                          <Code>{sizeVar}</Code>
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            color:
                              'var(--tt-colors-content-muted-text-default)',
                          }}
                        >
                          <Code>{weightVar}</Code>
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
// Story 3: FontFamilies — core font family primitives
// ---------------------------------------------------------------------------

/**
 * Core **font family** primitives — the three base stacks (sans, serif, mono)
 * plus any optical sizing and numeric variant flags.
 */
export const FontFamilies: StoryObj = {
  render: () => {
    const familyEntries = byPrefix(rawCoreTokens, 'core.font.family.');
    const weightEntries = byPrefix(rawCoreTokens, 'core.font.weight.');

    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <SectionHeading>Font families (core.font.family)</SectionHeading>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {familyEntries.map(([path, val]) => {
            const cssVar = toCssVarName(path);
            const name = path.split('.').pop() ?? '';
            return (
              <div
                key={path}
                style={{
                  padding: '16px 20px',
                  borderRadius: 10,
                  border:
                    '1px solid var(--tt-colors-content-secondary-border-default)',
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: 'var(--tt-colors-content-muted-text-default)',
                    marginBottom: 6,
                  }}
                >
                  <strong>{name}</strong> · <Code>{cssVar}</Code>
                </div>
                <div
                  style={{
                    fontFamily: `var(${cssVar})`,
                    fontSize: 28,
                    lineHeight: 1.2,
                  }}
                >
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ
                  <br />
                  abcdefghijklmnopqrstuvwxyz 0123456789
                </div>
                <div
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    color: 'var(--tt-colors-content-muted-text-default)',
                    marginTop: 8,
                  }}
                >
                  {String(val)}
                </div>
              </div>
            );
          })}
        </div>

        <SectionHeading>Font weights (core.font.weight)</SectionHeading>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {weightEntries.map(([path, val]) => {
            const name = path.split('.').pop() ?? '';
            return (
              <div
                key={path}
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  border:
                    '1px solid var(--tt-colors-content-secondary-border-default)',
                  minWidth: 120,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: Number(val),
                    marginBottom: 6,
                  }}
                >
                  Aa
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    textTransform: 'capitalize',
                  }}
                >
                  {name}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'var(--tt-colors-content-muted-text-default)',
                    fontFamily: 'monospace',
                  }}
                >
                  {val}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
};
