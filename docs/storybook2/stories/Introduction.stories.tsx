import type { Meta, StoryObj } from '@storybook/react-vite';

import { Code, SectionHeading } from './_lib/SharedComponents';

const meta: Meta = {
  title: 'Introduction',
  parameters: { layout: 'padded' },
  tags: ['!autodocs'],
};
export default meta;

/**
 * Welcome to the **ttoss design system** explorer — interactive documentation
 * for `@ttoss/theme2` (design token engine) and `@ttoss/ui2` (component library).
 */
export const Welcome: StoryObj = {
  render: () => {
    return (
      <div
        style={{
          fontFamily: 'system-ui, sans-serif',
          maxWidth: 740,
          padding: 24,
          lineHeight: 1.6,
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>
          ttoss Design System
        </h1>
        <p
          style={{
            fontSize: 15,
            color: 'var(--tt-colors-content-muted-text-default)',
            margin: '0 0 32px',
          }}
        >
          Interactive documentation for <strong>@ttoss/theme2</strong> (design
          token engine) and <strong>@ttoss/ui2</strong> (component library).
        </p>

        {/* ── Toolbar controls ── */}
        <SectionHeading>Toolbar controls</SectionHeading>
        <p style={{ margin: '0 0 8px' }}>
          Use the toolbar at the top of every story to switch:
        </p>
        <ul style={{ margin: '0 0 16px', paddingLeft: 24 }}>
          <li>
            <strong>Theme</strong> (paintbrush icon) — Base, Bruttal, Corporate,
            Oca, Ventures
          </li>
          <li>
            <strong>Color Mode</strong> (circle icon) — Light, Dark, System
          </li>
        </ul>
        <p style={{ margin: '0 0 24px' }}>
          Every token swatch and component reacts in real time. CSS custom
          properties re-resolve automatically — no page reload needed.
        </p>

        {/* ── Architecture diagram ── */}
        <SectionHeading>Two-layer token architecture</SectionHeading>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 40px 1fr',
            gap: 12,
            marginBottom: 16,
            padding: 16,
            borderRadius: 8,
            background:
              'var(--tt-colors-informational-accent-background-default)',
          }}
        >
          <div>
            <strong>Core tokens</strong>
            <br />
            Intent-free primitives: palette colours, spacing steps, font sizes.
            <br />
            Stable per-theme, different between themes.
          </div>
          <div
            style={{
              textAlign: 'center',
              fontSize: 24,
              color: 'var(--tt-colors-content-muted-text-default)',
              alignSelf: 'center',
            }}
          >
            →
          </div>
          <div>
            <strong>Semantic tokens</strong>
            <br />
            UX intent: <Code>action.primary.background</Code>,{' '}
            <Code>body.md.fontSize</Code>.<br />
            Each maps to a core token via{' '}
            <Code>{'{core.colors.brand.500}'}</Code>.
          </div>
        </div>
        <p style={{ margin: '0 0 24px' }}>
          Components consume <em>semantic</em> tokens only. Switching themes
          remaps every semantic → core reference. The core layer is an
          implementation detail.
        </p>

        {/* ── Navigation guide ── */}
        <SectionHeading>Navigation guide</SectionHeading>
        <table
          style={{
            borderCollapse: 'collapse',
            fontSize: 14,
            width: '100%',
          }}
        >
          <thead>
            <tr>
              {['Section', 'What you will find'].map((h) => {
                return (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontWeight: 600,
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      color: 'var(--tt-colors-content-muted-text-default)',
                      borderBottom:
                        '2px solid var(--tt-colors-content-secondary-border-default)',
                    }}
                  >
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {(
              [
                [
                  'theme-v2 / Overview',
                  'ThemeProvider setup and a quick sample of active tokens.',
                ],
                [
                  'theme-v2 / Tokens / Colors',
                  'Core palettes, semantic colour roles, and a multi-theme harmony grid.',
                ],
                [
                  'theme-v2 / Tokens / Typography',
                  'Font scale, semantic text styles, font families and weights — all live-rendered.',
                ],
                [
                  'theme-v2 / Tokens / Spacing',
                  'Responsive spacing ramp (core) and semantic spacing aliases.',
                ],
                [
                  'theme-v2 / Tokens / Elevation',
                  'Shadow levels (standard + emphatic) and semantic surface aliases.',
                ],
                [
                  'theme-v2 / Tokens / Motion',
                  'Duration and easing tokens with interactive hover demos.',
                ],
                [
                  'theme-v2 / Tokens / Graph',
                  'Full core → semantic dependency graph across all 10 token families.',
                ],
                [
                  'ui2 / Button · Dialog · Link',
                  'Component stories with evaluation variants, disabled states, and side-by-side comparisons.',
                ],
              ] as [string, string][]
            ).map(([section, desc]) => {
              return (
                <tr key={section}>
                  <td
                    style={{
                      padding: '8px 12px',
                      borderBottom:
                        '1px solid var(--tt-colors-content-secondary-border-default)',
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {section}
                  </td>
                  <td
                    style={{
                      padding: '8px 12px',
                      borderBottom:
                        '1px solid var(--tt-colors-content-secondary-border-default)',
                      color: 'var(--tt-colors-content-muted-text-default)',
                    }}
                  >
                    {desc}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* ── Copy hint ── */}
        <SectionHeading>Copy to clipboard</SectionHeading>
        <p>
          Click any <Code>monospace chip</Code> across the token browser to copy
          its text to the clipboard. A brief green flash confirms the copy.
        </p>
      </div>
    );
  },
};
