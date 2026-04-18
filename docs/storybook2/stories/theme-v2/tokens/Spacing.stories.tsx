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
  title: 'theme-v2/Tokens/Spacing',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;

// ---------------------------------------------------------------------------
// Story 1: Scale — visual spacing ramp with responsive bars
// ---------------------------------------------------------------------------

/**
 * The **responsive spacing scale** — `core.spacing.*` values computed from
 * `core.spacing.engine.unit`, a `clamp()` expression that adapts to container
 * size via `cqi`. Each spacing step is a multiple of the engine unit.
 *
 * The bars below use `width: var(--tt-core-spacing-*)` to show the actual
 * computed size. Resize the canvas to observe responsive scaling.
 */
export const Scale: StoryObj = {
  render: () => {
    const spacingEntries = byPrefix(rawCoreTokens, 'core.spacing.').filter(
      ([path]) => {
        return !path.includes('.engine.');
      }
    );

    return (
      <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            background:
              'var(--tt-colors-informational-accent-background-default)',
            marginBottom: 24,
            fontSize: 13,
          }}
        >
          <strong>Spacing engine unit:</strong>{' '}
          <Code>var(--tt-core-spacing-engine-unit)</Code> —{' '}
          <Code>{String(rawCoreTokens['core.spacing.engine.unit'])}</Code>
          <br />
          All steps multiply this unit:{' '}
          <Code>calc(N * var(--tt-core-spacing-engine-unit))</Code>
        </div>

        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={{ ...thStyle, width: 60 }}>Step</th>
              <th style={{ ...thStyle, width: 260 }}>CSS var</th>
              <th style={thStyle}>Visual size (responsive bar)</th>
            </tr>
          </thead>
          <tbody>
            {spacingEntries.map(([path, val]) => {
              const cssVar = toCssVarName(path);
              const step = path.split('.').pop() ?? '';
              return (
                <tr key={path}>
                  <td
                    style={{
                      ...tdStyle,
                      fontFamily: 'monospace',
                      fontWeight: 700,
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
                  <td style={tdStyle}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                    >
                      <div
                        style={{
                          width: `var(${cssVar})`,
                          minWidth: step === '0' ? 2 : undefined,
                          height: 20,
                          borderRadius: 3,
                          background:
                            'var(--tt-colors-action-accent-background-default)',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 11,
                          color: 'var(--tt-colors-content-muted-text-default)',
                        }}
                      >
                        {String(val)}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <SectionHeading>
          Semantic spacing aliases (semantic.spacing)
        </SectionHeading>
        <p
          style={{
            margin: '0 0 16px',
            color: 'var(--tt-colors-content-muted-text-default)',
            fontSize: 13,
          }}
        >
          Semantic spacing tokens provide named intent aliases that map to core
          steps. Components consume these, not raw core values.
        </p>
        <table style={tableStyle}>
          <thead>
            <tr>
              {['Semantic path', 'CSS var', 'Core ref'].map((h) => {
                return (
                  <th key={h} style={thStyle}>
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {byPrefix(rawSemanticTokens, 'semantic.spacing.').map(
              ([path, val]) => {
                const cssVar = toCssVarName(path);
                const shortPath = path.slice('semantic.'.length);
                return (
                  <tr key={path}>
                    <td style={tdStyle}>
                      <Code>{shortPath}</Code>
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
                  </tr>
                );
              }
            )}
          </tbody>
        </table>
      </div>
    );
  },
};
