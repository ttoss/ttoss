import type { Meta, StoryObj } from '@storybook/react-vite';

import { Code } from '../../_lib/SharedComponents';
import {
  byPrefix,
  rawCoreTokens,
  rawSemanticTokens,
  toCssVarName,
} from '../../_lib/tokenUtils';

const meta: Meta = {
  title: 'theme-v2/Tokens/Elevation',
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
};
export default meta;

// ---------------------------------------------------------------------------
// Story 1: ShadowLevels — core elevation primitives
// ---------------------------------------------------------------------------

/**
 * **Elevation scale** — core shadow primitives (`level.0`–`level.4`) and their
 * emphatic counterparts (higher opacity for dark surfaces). Each box uses the
 * CSS custom property so values update live when switching themes.
 *
 * The **semantic elevation** aliases (`surface.flat`, `surface.raised`, etc.)
 * are shown below and map directly to these core levels.
 */
export const ShadowLevels: StoryObj = {
  render: () => {
    const levelEntries = byPrefix(rawCoreTokens, 'core.elevation.level.');
    const emphaticEntries = byPrefix(rawCoreTokens, 'core.elevation.emphatic.');
    const semanticEntries = byPrefix(rawSemanticTokens, 'semantic.elevation.');

    const ElevationRow = ({
      path,
      val,
      prefix,
    }: {
      path: string;
      val: string | number;
      prefix: string;
    }) => {
      const cssVar = toCssVarName(path);
      const label = path.slice(prefix.length);
      return (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '80px 280px 1fr',
            alignItems: 'center',
            gap: 16,
            padding: '16px 0',
            borderBottom:
              '1px solid var(--tt-colors-content-secondary-border-default)',
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 10,
              background: 'var(--tt-colors-content-primary-background-default)',
              boxShadow: `var(${cssVar})`,
              border:
                '1px solid var(--tt-colors-content-secondary-border-default)',
            }}
          />
          <div>
            <div
              style={{
                fontWeight: 600,
                fontFamily: 'system-ui',
                fontSize: 13,
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            <Code>{cssVar}</Code>
          </div>
          <div
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              color: 'var(--tt-colors-content-muted-text-default)',
              wordBreak: 'break-word',
            }}
          >
            {String(val)}
          </div>
        </div>
      );
    };

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
          Two shadow series: <strong>level</strong> (standard depth for light
          surfaces) and <strong>emphatic</strong> (higher opacity for dark or
          coloured surfaces). Semantic aliases map these to named surface roles.
        </p>

        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: '0 0 8px',
            paddingBottom: 8,
            borderBottom:
              '1px solid var(--tt-colors-content-secondary-border-default)',
          }}
        >
          Standard levels (core.elevation.level)
        </h2>
        {levelEntries.map(([path, val]) => {
          return (
            <ElevationRow
              key={path}
              path={path}
              val={val}
              prefix="core.elevation.level."
            />
          );
        })}

        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: '32px 0 8px',
            paddingBottom: 8,
            borderBottom:
              '1px solid var(--tt-colors-content-secondary-border-default)',
          }}
        >
          Emphatic levels (core.elevation.emphatic)
        </h2>
        {emphaticEntries.map(([path, val]) => {
          return (
            <ElevationRow
              key={path}
              path={path}
              val={val}
              prefix="core.elevation.emphatic."
            />
          );
        })}

        <h2
          style={{
            fontSize: 16,
            fontWeight: 600,
            margin: '32px 0 8px',
            paddingBottom: 8,
            borderBottom:
              '1px solid var(--tt-colors-content-secondary-border-default)',
          }}
        >
          Semantic surface aliases (semantic.elevation.surface)
        </h2>
        <p
          style={{
            margin: '0 0 16px',
            color: 'var(--tt-colors-content-muted-text-default)',
            fontSize: 13,
          }}
        >
          Components use these named aliases, not raw level numbers. The
          semantic name communicates design intent:{' '}
          <em>how high above the canvas</em> this surface sits.
        </p>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {semanticEntries.map(([path, val]) => {
            const cssVar = toCssVarName(path);
            const label = path.slice('semantic.elevation.'.length);
            return (
              <div
                key={path}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  minWidth: 120,
                }}
              >
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: 12,
                    background:
                      'var(--tt-colors-content-primary-background-default)',
                    boxShadow: `var(${cssVar})`,
                    border:
                      '1px solid var(--tt-colors-content-secondary-border-default)',
                  }}
                />
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 12,
                      fontFamily: 'system-ui',
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--tt-colors-content-muted-text-default)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {String(val)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
};
